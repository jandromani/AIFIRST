#!/usr/bin/env node
/** Private local pilot API. Binds LOOPBACK ONLY, not a public internet deployment. */
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { EditionRuntime,httpsModelAdapter,clamscanAdapter } from '../src/edition-runtime.mjs';
import { EnterpriseOps } from '../src/enterprise-ops.mjs';
import { openRouterFree } from '../src/openrouter-free.mjs';
import { loadTrustedJwks } from '../src/enterprise-security.mjs';
import { renderDraftPack } from '../src/enterprise-reports.mjs';
import { SyntheticJobQueue } from '../src/job-queue.mjs';
import { integrationReadiness } from '../src/integration-readiness.mjs';
import {LocalStackBridge,optionalS3FromEnv} from '../src/local-stack-bridge.mjs';
import {scanClamd} from '../src/local-stack-adapters.mjs';
import { evolutionHttp } from '../src/evolution-http.mjs';
import {VerifiedTheater} from '../src/verified-theater.mjs';
import {ReplayStudio} from '../src/replay-studio.mjs';
import {TraceIntelligence} from '../src/trace-intelligence.mjs';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const baseRoot=path.resolve(__dirname,'..','.aifirst-local');
const root=process.env.AIFIRST_LOCAL_ROOT?path.resolve(process.env.AIFIRST_LOCAL_ROOT):baseRoot;
if(!root.startsWith(baseRoot+path.sep)&&root!==baseRoot)throw Error('External lab data root refused');
const json=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'"});res.end(JSON.stringify(body));};
const maxBody=4*1024*1024;
async function body(req,limit=maxBody){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw new Error('Payload too large');chunks.push(chunk)}return Buffer.concat(chunks);}
const parse=b=>{try{return JSON.parse(b.toString('utf8'))}catch{throw Error('Invalid JSON')}};

export function makeApi(engine,enterprise=null){return http.createServer(async(req,res)=>{
  try {
    // Loopback alone does not prevent DNS rebinding or cross-origin form/script requests.
    const remote=req.socket.remoteAddress||'';
    if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote))return json(res,403,{error:'Loopback access only'});
    const host=String(req.headers.host||'');
    if(!/^(?:127\.0\.0\.1|localhost)(?::[0-9]{1,5})?$/.test(host))return json(res,403,{error:'Host not allowlisted'});
    const origin=req.headers.origin;
    if(origin && (!(/^http:\/\/(?:127\.0\.0\.1|localhost):[0-9]{1,5}$/.test(String(origin))) || new URL(String(origin)).host!==host))return json(res,403,{error:'Cross-origin API access forbidden'});
    const rawUrl=req.url||'';
    if(rawUrl.length>500||rawUrl.includes('%2f')||rawUrl.includes('%5c'))throw Error('Invalid route');
    const u=new URL(rawUrl,'http://127.0.0.1');const p=u.pathname.split('/').filter(Boolean),method=req.method;
    // Product landing, authenticated command center and traceable operating Atlas.
    // Serve local-only static HTML with per-response nonces, no CDN dependencies or network analytics.
    if(method==='GET'&&['/','/console','/atlas','/evolution','/lab','/demo','/replay','/traces'].includes(u.pathname)){
      const pages={'/':'index.html','/console':'pilot.html','/atlas':'atlas.html','/evolution':'evolution.html','/lab':'lab.html','/demo':'demo.html','/replay':'replay.html','/traces':'traces.html'};
      const nonce=crypto.randomBytes(16).toString('base64');
      const source=fs.readFileSync(path.resolve(__dirname,'..','web',pages[u.pathname]),'utf8');
      const html=source.replace(/<style(?=[\s>])/g,'<style nonce="'+nonce+'"').replace(/<script(?=[\s>])/g,'<script nonce="'+nonce+'"');
      res.writeHead(200,{'content-type':'text/html; charset=utf-8','x-content-type-options':'nosniff','cache-control':'no-store','referrer-policy':'no-referrer','x-frame-options':'DENY','strict-transport-security':'max-age=0','content-security-policy':"default-src 'none'; script-src 'nonce-"+nonce+"' 'self'; style-src 'nonce-"+nonce+"'; connect-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"});
      return res.end(html);
    }
    // Public reference algorithm only: no secrets, no user input, no dynamic files.
    if(method==='GET'&&u.pathname==='/replay-core.mjs'){
      const moduleSource=fs.readFileSync(path.resolve(__dirname,'..','web','replay-core.mjs'),'utf8');
      res.writeHead(200,{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'"});
      return res.end(moduleSource);
    }
    if(!p.length||p[0]!=='v1')return json(res,404,{error:'Not found'});
    const bearer=(req.headers.authorization||'').replace(/^Bearer /,'');
    const ctx=bearer.split('.').length===3 && enterprise?.oidc? enterprise.authenticateOidc(bearer):engine.auth(bearer);
    if(process.env.AIFIRST_REQUIRE_OIDC==='1'&&ctx.auth_method!=='verified_oidc')throw Error('OIDC authentication required');
    const post=async()=>{if(!req.headers['content-type']?.startsWith('application/json'))throw Error('application/json required');return parse(await body(req,1024*1024));};
    if(p[1]==='replay'&&p[2]==='runs'){
      const studio=new ReplayStudio(engine);
      if(method==='POST'&&p.length===3){const input=await post();return json(res,201,studio.run(ctx,input));}
      if(method==='GET'&&p.length===3)return json(res,200,{runs:studio.list(ctx)});
      if(method==='GET'&&p.length===4)return json(res,200,studio.find(ctx,p[3]));
      return json(res,405,{error:'Method not allowed'});
    }
    if(p[1]==='traces'){
      if(method!=='GET')return json(res,405,{error:'Read-only local trace API; import via private CLI'});
      const ti=new TraceIntelligence(engine);
      if(p.length===3&&p[2]==='summary')return json(res,200,ti.summary(ctx));
      if(p.length===3&&p[2]==='runs')return json(res,200,ti.runs(ctx,{limit:Number(u.searchParams.get('limit')||50),offset:Number(u.searchParams.get('offset')||0),system:u.searchParams.get('system')}));
      if(p.length===5&&p[2]==='runs'&&p[4]==='events')return json(res,200,ti.events(ctx,p[3],{limit:Number(u.searchParams.get('limit')||100),offset:Number(u.searchParams.get('offset')||0)}));
      if(p.length===3&&p[2]==='candidates')return json(res,200,ti.candidates(ctx,{limit:Number(u.searchParams.get('limit')||30)}));
      if(p.length===3&&p[2]==='graph')return json(res,200,ti.graph(ctx,{limit:Number(u.searchParams.get('limit')||120)}));
      return json(res,404,{error:'Trace route not found'});
    }
    if(p[1]==='evolution')return await evolutionHttp({engine,ctx,p,method,post,json:(status,data)=>json(res,status,data)});
    // Authenticated local synthetic proof. Public demos never receive private auth tokens.
    if(p[1]==='theater'&&p[2]==='proofs'){
      const receipts=new VerifiedTheater(engine);
      if(method==='POST'&&p.length===3){const input=await post();if(input?.ack_synthetic_only!==true)return json(res,400,{error:'Explicit synthetic mode acknowledgement required'});return json(res,201,await receipts.run(ctx));}
      if(method==='GET'&&p.length===3)return json(res,200,{runs:receipts.list(ctx)});
      if(method==='GET'&&p.length===4&&p[3]==='signer')return json(res,200,receipts.keyInfo(ctx));
      if(method==='GET'&&p.length===4)return json(res,200,receipts.find(ctx,p[3]));
      return json(res,405,{error:'Method not allowed'});
    }

    if(method==='GET'&&p[1]==='health')return json(res,200,engine.health(ctx));
    if(method==='GET'&&p.length===3&&p[1]==='lab'&&p[2]==='proof'){
      engine.permitted(ctx,'admin','auditor');
      const expected=path.resolve(__dirname,'..','.aifirst-local','one-command','proof.json');
      if(!process.env.AIFIRST_LAB_PROOF_PATH||path.resolve(process.env.AIFIRST_LAB_PROOF_PATH)!==expected||!fs.existsSync(expected))return json(res,404,{error:'No successful integrated lab proof'});
      const stat=fs.lstatSync(expected);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>80000)throw Error('Unsafe proof file');
      const proof=JSON.parse(fs.readFileSync(expected,'utf8'));if(proof?.integrated?.tenant!==ctx.tenant)return json(res,404,{error:'Not found'});
      if(proof?.production_ready!==false||proof?.integrated?.gates?.production_release!==false)throw Error('Invalid lab proof release marker');
      return json(res,200,{...proof,integrated:{...proof.integrated,local_admin_token_file:undefined},classification:'SYNTHETIC_ONLY',production_ready:false});
    }

    if(method==='GET'&&p.length===2&&p[1]==='editions'){
      engine.permitted(ctx,'admin','sponsor','auditor');
      const editions=engine.rows('SELECT id,title,stage,created FROM editions WHERE tenant=? ORDER BY created DESC LIMIT 100',ctx.tenant);
      return json(res,200,{editions,scope:'AUTHENTICATED_TENANT_ONLY'});
    }
    if(method==='GET'&&p[1]==='integrations'&&p[2]==='readiness'&&p.length===3){
      engine.permitted(ctx,'admin','auditor');
      return json(res,200,integrationReadiness({enterprise,env:process.env}));
    }
    if(method==='GET'&&p[1]==='stack'&&p[2]==='readiness'&&p.length===3){
      return json(res,200,new LocalStackBridge(engine,{s3:process.env.AIFIRST_S3_ENDPOINT?optionalS3FromEnv():null}).status(ctx));
    }
    if(method==='POST'&&p[1]==='artifacts'&&p[2]&&p[3]==='replicate'&&p.length===4){
      if(!enterprise?.masterKey)throw Error('Encryption required before replication');
      return json(res,201,await new LocalStackBridge(engine,{s3:optionalS3FromEnv()}).replicateEncrypted(ctx,p[2]));
    }
    if(method==='GET'&&p.length===2&&p[1]==='queue')return json(res,200,{jobs:new SyntheticJobQueue(engine).status(ctx),execution:'SYNTHETIC_ONLY'});
    if(method==='GET'&&p[1]==='integrations'&&p[2]==='status'){engine.permitted(ctx,'admin','auditor');return json(res,200,{scope:'LOCAL_DEMO',oidc_verified_configured:Boolean(enterprise?.oidc),artifact_encryption_configured:Boolean(enterprise?.masterKey),clamav_requested:process.env.AIFIRST_ENABLE_CLAMAV==='1',openrouter_free_requested:process.env.AIFIRST_ALLOW_OPENROUTER_FREE==='1',openrouter_key_present:Boolean(process.env.OPENROUTER_API_KEY),erp_configured:Boolean(process.env.AIFIRST_ERP_ENDPOINT&&process.env.AIFIRST_ERP_API_KEY),bank_statement_verifier_configured:Boolean(enterprise?.bankVerifyKey),qualified_signature_provider_connected:false,actual_bank_api_connected:false,untrusted_code_sandbox_connected:false,production_ready:false});}
    if(method==='POST'&&p.length===2&&p[1]==='oidc-bindings'){if(!enterprise)return json(res,503,{error:'Enterprise boundary unavailable'});return json(res,201,enterprise.bindOidc(ctx,await post()));}
    if(method==='POST'&&p.length===2&&p[1]==='signing-key'){if(!enterprise)return json(res,503,{error:'Enterprise boundary unavailable'});const r=await post();return json(res,201,enterprise.registerSigner(ctx,r.public_key_pem));}
    if(method==='POST'&&p.length===2&&p[1]==='members'){const r=await post();return json(res,201,engine.addPrincipal(ctx,r.role));}
    if(method==='POST'&&p.length===2&&p[1]==='leads')return json(res,201,engine.newLead(ctx,await post()));
    if(method==='POST'&&p.length===2&&p[1]==='editions')return json(res,201,engine.newEdition(ctx,await post()));
    if(p[1]==='editions'&&p[2]&&p.length>=3){const edition=p[2];
      if(method==='GET'&&p.length===4&&p[3]==='dossier')return json(res,200,engine.dossier(ctx,edition));
      if(method==='GET'&&p.length===4&&p[3]==='approvals'){if(!enterprise)return json(res,503,{error:'Enterprise boundary unavailable'});engine.permitted(ctx,'admin','sponsor','auditor');return json(res,200,{approvals:enterprise.approvals(ctx,edition),legal_acceptance_pending:true});}
      if(method==='POST'&&p.length===4&&p[3]==='contracts')return json(res,201,engine.recordContract(ctx,edition,await post()));
      if(method==='POST'&&p.length===4&&p[3]==='participants'){const r=await post();return json(res,201,engine.register(ctx,edition,r.alias));}
      if(method==='POST'&&p.length===4&&p[3]==='submissions'){const r=await post();return json(res,201,engine.submit(ctx,edition,r.participant,r.title));}
      if(method==='POST'&&p.length===4&&p[3]==='gates'){const r=await post();return json(res,201,engine.gate(ctx,edition,r.gate,r.evidence));}
      if(method==='POST'&&p.length===4&&p[3]==='scenarios')return json(res,201,engine.addScenario(ctx,edition,await post()));
      if(method==='POST'&&p.length===4&&p[3]==='invoices'){const r=await post();return json(res,201,engine.invoice(ctx,edition,r.reference,r.amount_cents));}
      if(method==='POST'&&p.length===4&&p[3]==='payouts'){const r=await post();return json(res,201,engine.payout(ctx,edition,r.kind,r.reference,r.amount_cents));}
      if(method==='GET'&&p.length===4&&p[3]==='payout-batch'){if(!enterprise)return json(res,503,{error:'Enterprise boundary unavailable'});return json(res,200,enterprise.payoutBatch(ctx,edition));}
      if(method==='POST'&&p.length===4&&p[3]==='approvals'){if(!enterprise)return json(res,503,{error:'Enterprise boundary unavailable'});const r=await post();return json(res,201,enterprise.signGate(ctx,edition,r.gate,r.evidence_sha256,r.signature_b64));}
      if(method==='POST'&&p.length===4&&p[3]==='report-pack'){if(!enterprise||!enterprise.masterKey)throw Error('Master encryption key required');engine.permitted(ctx,'admin','sponsor');if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1')throw Error('Synthetic demo mode required');const d=engine.dossier(ctx,edition);const pack=renderDraftPack({dossier:d,masterKey:enterprise.masterKey,tenant:ctx.tenant,edition});return json(res,200,{manifest:pack.manifest,encrypted_zip_base64:pack.encryptedArchive.toString('base64'),release_allowed:false});}
    }
    if(method==='POST'&&p[1]==='invoices'&&p[2]&&p[3]==='erp-export'&&p.length===4){engine.permitted(ctx,'finance');if(!process.env.AIFIRST_ERP_ENDPOINT||!process.env.AIFIRST_ERP_API_KEY)throw Error('ERP connector not configured');const {erpHttpsAdapter}=await import('../src/enterprise-ops.mjs');const inv=engine.own(ctx,'invoices',p[2]);const exported=await erpHttpsAdapter({endpoint:process.env.AIFIRST_ERP_ENDPOINT,apiKey:process.env.AIFIRST_ERP_API_KEY})({invoice:inv,tenant:ctx.tenant});engine.stamp(ctx,'erp.export_requested',inv.id,exported);return json(res,200,exported);}
    if(method==='POST'&&p[1]==='invoices'&&p[2]&&p[3]==='bank-statement'&&p.length===4){if(!enterprise)return json(res,503,{error:'Enterprise boundary unavailable'});const r=await post();return json(res,201,enterprise.importBankStatement(ctx,p[2],r.statement,r.signature_b64));}
    if(method==='POST'&&p[1]==='invoices'&&p[2]&&p[3]==='reconcile'&&p.length===4){const r=await post();return json(res,201,engine.reconcile(ctx,p[2],r.bank_reference,r.amount_cents));}
    if(p[1]==='submissions'&&p[2]&&p.length===4){const sub=p[2];
      if(method==='PUT'&&p[3]==='artifact'){
        if(req.headers['content-type']!=='application/octet-stream')throw Error('binary content required');
        const file=req.headers['x-artifact-name'];const sha=req.headers['x-content-sha256'];
        if(!enterprise||!enterprise.masterKey)throw Error('Encrypted storage is not configured');
        return json(res,201,await enterprise.secureUpload(ctx,sub,file,await body(req),sha));
      }
      if(method==='POST'&&p[3]==='queue'){const r=await post();return json(res,201,new SyntheticJobQueue(engine).enqueue(ctx,sub,{model:r.model,maxCostEur:r.max_cost_eur}));}
      if(method==='POST'&&p[3]==='agent'){const r=await post();return json(res,201,await engine.agentJob(ctx,sub,r.model,r.max_cost_eur));}
      if(method==='POST'&&p[3]==='evaluate'){const r=await post();return json(res,201,engine.evaluate(ctx,sub,r.score,r.artifact_id,r.notes));}
    }
    return json(res,404,{error:'Not found'});
  }catch(e){const message=String(e.message||'').slice(0,150);const invalid=/invalid|missing|bad |required|size|SHA256|mismatch|missing|not safe|unscanned|blocked|review|already|unavailable/i.test(message);
    const status=/authentication/i.test(message)?401:/forbidden/i.test(message)?403:/not found/i.test(message)?404:/quota exceeded/i.test(message)?429:invalid?400:500;
    return json(res,status,{error:status===500?'Internal error':message});}
});}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const arg=process.argv[2];
  if(!['init','serve'].includes(arg)){console.error('Usage: node bin/api.mjs init <tenant-name> | serve');process.exit(2);}
  let agent=null;
  const freeConfigured=Boolean(process.env.OPENROUTER_API_KEY&&process.env.AIFIRST_SYNTHETIC_DEMO==='1'&&process.env.AIFIRST_ALLOW_OPENROUTER_FREE==='1');
  if(!freeConfigured&&process.env.AIFIRST_MODEL_ENDPOINT&&process.env.AIFIRST_MODEL_KEY){agent=httpsModelAdapter({endpoint:process.env.AIFIRST_MODEL_ENDPOINT,apiKey:process.env.AIFIRST_MODEL_KEY});}
  const scanner=process.env.AIFIRST_ENABLE_CLAMD==='1' ? async(file,expectedSha)=>{
    const data=fs.readFileSync(file);const verdict=await scanClamd(data,{port:Number(process.env.AIFIRST_CLAMD_PORT||53310)});
    if(verdict.sha256!==expectedSha)throw Error('ClamAV input changed during scan');return verdict;
  } : process.env.AIFIRST_ENABLE_CLAMAV==='1'?clamscanAdapter():null;
  const e=new EditionRuntime(root,{agent,scanner});
  if(freeConfigured)e.agent=openRouterFree({apiKey:process.env.OPENROUTER_API_KEY,model:process.env.AIFIRST_FREE_MODEL||'openrouter/free',perDay:Number(process.env.AIFIRST_FREE_DAILY_LIMIT||12),db:e.db});
  const masterKey=process.env.AIFIRST_MASTER_KEY_B64?Buffer.from(process.env.AIFIRST_MASTER_KEY_B64,'base64'):null;
  const oidc=process.env.AIFIRST_OIDC_ISSUER&&process.env.AIFIRST_OIDC_AUDIENCE&&process.env.AIFIRST_OIDC_JWKS_FILE?
    {issuer:process.env.AIFIRST_OIDC_ISSUER,audience:process.env.AIFIRST_OIDC_AUDIENCE,jwks:loadTrustedJwks(process.env.AIFIRST_OIDC_JWKS_FILE),allowLocalLabIssuer:process.env.AIFIRST_OIDC_LOCAL_DEV_ISSUER==='1'}:null;
  const enterprise=new EnterpriseOps(e,{masterKey,oidc,bankVerifyKey:process.env.AIFIRST_BANK_STATEMENT_VERIFY_KEY_PEM||null});
  if(arg==='init'){
    const name=process.argv.slice(3).join(' ')||'Synthetic pilot company';
    console.log(JSON.stringify(e.bootstrapTenant(name),null,2));e.close();
  }else{
    const host='127.0.0.1';const port=Number(process.env.AIFIRST_LOCAL_PORT||4181);
    if(!Number.isInteger(port)||port<1025||port>65535)throw Error('Invalid port');
    const server=makeApi(e,enterprise);server.listen(port,host,()=>console.log(`AIFIRST LOCAL API http://${host}:${port} — NOT INTERNET EXPOSED`));
    for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>server.close(()=>{e.close();process.exit(0)}));
  }
}
