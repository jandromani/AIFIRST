#!/usr/bin/env node
/** Private local pilot API. Binds LOOPBACK ONLY, not a public internet deployment. */
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { EditionRuntime,httpsModelAdapter,clamscanAdapter } from '../src/edition-runtime.mjs';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..','.aifirst-local');
const json=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'"});res.end(JSON.stringify(body));};
const maxBody=4*1024*1024;
async function body(req,limit=maxBody){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw new Error('Payload too large');chunks.push(chunk)}return Buffer.concat(chunks);}
const parse=b=>{try{return JSON.parse(b.toString('utf8'))}catch{throw Error('Invalid JSON')}};

export function makeApi(engine){return http.createServer(async(req,res)=>{
  try {
    const rawUrl=req.url||'';
    if(rawUrl.length>500||rawUrl.includes('%2f')||rawUrl.includes('%5c'))throw Error('Invalid route');
    const u=new URL(rawUrl,'http://127.0.0.1');const p=u.pathname.split('/').filter(Boolean),method=req.method;
    if(method==='GET'&&u.pathname==='/'){const html=fs.readFileSync(path.resolve(__dirname,'..','web','pilot.html'),'utf8');res.writeHead(200,{'content-type':'text/html; charset=utf-8','x-content-type-options':'nosniff','cache-control':'no-store','content-security-policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'"});return res.end(html);}
    if(!p.length||p[0]!=='v1')return json(res,404,{error:'Not found'});
    const ctx=engine.auth((req.headers.authorization||'').replace(/^Bearer /,''));
    const post=async()=>{if(!req.headers['content-type']?.startsWith('application/json'))throw Error('application/json required');return parse(await body(req,1024*1024));};
    if(method==='GET'&&p[1]==='health')return json(res,200,engine.health(ctx));
    if(method==='POST'&&p.length===2&&p[1]==='members'){const r=await post();return json(res,201,engine.addPrincipal(ctx,r.role));}
    if(method==='POST'&&p.length===2&&p[1]==='leads')return json(res,201,engine.newLead(ctx,await post()));
    if(method==='POST'&&p.length===2&&p[1]==='editions')return json(res,201,engine.newEdition(ctx,await post()));
    if(p[1]==='editions'&&p[2]&&p.length>=3){const edition=p[2];
      if(method==='GET'&&p.length===4&&p[3]==='dossier')return json(res,200,engine.dossier(ctx,edition));
      if(method==='POST'&&p.length===4&&p[3]==='contracts')return json(res,201,engine.recordContract(ctx,edition,await post()));
      if(method==='POST'&&p.length===4&&p[3]==='participants'){const r=await post();return json(res,201,engine.register(ctx,edition,r.alias));}
      if(method==='POST'&&p.length===4&&p[3]==='submissions'){const r=await post();return json(res,201,engine.submit(ctx,edition,r.participant,r.title));}
      if(method==='POST'&&p.length===4&&p[3]==='gates'){const r=await post();return json(res,201,engine.gate(ctx,edition,r.gate,r.evidence));}
      if(method==='POST'&&p.length===4&&p[3]==='scenarios')return json(res,201,engine.addScenario(ctx,edition,await post()));
      if(method==='POST'&&p.length===4&&p[3]==='invoices'){const r=await post();return json(res,201,engine.invoice(ctx,edition,r.reference,r.amount_cents));}
      if(method==='POST'&&p.length===4&&p[3]==='payouts'){const r=await post();return json(res,201,engine.payout(ctx,edition,r.kind,r.reference,r.amount_cents));}
    }
    if(method==='POST'&&p[1]==='invoices'&&p[2]&&p[3]==='reconcile'&&p.length===4){const r=await post();return json(res,201,engine.reconcile(ctx,p[2],r.bank_reference,r.amount_cents));}
    if(p[1]==='submissions'&&p[2]&&p.length===4){const sub=p[2];
      if(method==='PUT'&&p[3]==='artifact'){
        if(req.headers['content-type']!=='application/octet-stream')throw Error('binary content required');
        const file=req.headers['x-artifact-name'];const sha=req.headers['x-content-sha256'];
        return json(res,201,await engine.upload(ctx,sub,file,await body(req),sha));
      }
      if(method==='POST'&&p[3]==='agent'){const r=await post();return json(res,201,await engine.agentJob(ctx,sub,r.model,r.max_cost_eur));}
      if(method==='POST'&&p[3]==='evaluate'){const r=await post();return json(res,201,engine.evaluate(ctx,sub,r.score,r.artifact_id,r.notes));}
    }
    return json(res,404,{error:'Not found'});
  }catch(e){const message=String(e.message||'').slice(0,150);const invalid=/invalid|missing|bad |required|size|SHA256|mismatch|missing|not safe|unscanned|blocked|review|already|unavailable/i.test(message);
    const status=/authentication/i.test(message)?401:/forbidden/i.test(message)?403:/not found/i.test(message)?404:invalid?400:500;
    return json(res,status,{error:status===500?'Internal error':message});}
});}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const arg=process.argv[2];
  if(!['init','serve'].includes(arg)){console.error('Usage: node bin/api.mjs init <tenant-name> | serve');process.exit(2);}
  let agent=null;
  if(process.env.AIFIRST_MODEL_ENDPOINT&&process.env.AIFIRST_MODEL_KEY){agent=httpsModelAdapter({endpoint:process.env.AIFIRST_MODEL_ENDPOINT,apiKey:process.env.AIFIRST_MODEL_KEY});}
  const scanner=process.env.AIFIRST_ENABLE_CLAMAV==='1'?clamscanAdapter():null;
  const e=new EditionRuntime(root,{agent,scanner});
  if(arg==='init'){
    const name=process.argv.slice(3).join(' ')||'Synthetic pilot company';
    console.log(JSON.stringify(e.bootstrapTenant(name),null,2));e.close();
  }else{
    const host='127.0.0.1';const port=Number(process.env.AIFIRST_LOCAL_PORT||4181);
    if(!Number.isInteger(port)||port<1025||port>65535)throw Error('Invalid port');
    const server=makeApi(e);server.listen(port,host,()=>console.log(`AIFIRST LOCAL API http://${host}:${port} — NOT INTERNET EXPOSED`));
    for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>server.close(()=>{e.close();process.exit(0)}));
  }
}
