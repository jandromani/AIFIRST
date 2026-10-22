import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {EditionRuntime,ORIGINAL_OUTPUTS,httpsModelAdapter} from '../src/edition-runtime.mjs';
import {makeApi} from '../bin/api.mjs';

const setup=t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-e2e-'));const runtime=new EditionRuntime(root,{
 scanner:async(file,sha)=>({status:'CLEAN',reference:'MOCK-SCANNER-TEST-ONLY',sha256:sha,signature_valid:true}),
 agent:async({model,prompt,maxCostEur})=>({text:'Draft: artifact hashes cited; not verified by independent juror.',costEur:Math.min(.10,maxCostEur)})
 });
 t.after(()=>{runtime.close();fs.rmSync(root,{recursive:true,force:true});});
 const a=runtime.bootstrapTenant('Company A'),b=runtime.bootstrapTenant('Company B'),ctx=runtime.auth(a.token),other=runtime.auth(b.token);
 const sales=runtime.auth(runtime.addPrincipal(ctx,'sales').token);
 const sponsor=runtime.auth(runtime.addPrincipal(ctx,'sponsor').token);
 const security=runtime.auth(runtime.addPrincipal(ctx,'security').token);
 const juror=runtime.auth(runtime.addPrincipal(ctx,'juror').token);
 const finance=runtime.auth(runtime.addPrincipal(ctx,'finance').token);
 const auditor=runtime.auth(runtime.addPrincipal(ctx,'auditor').token);
 return {root,runtime,a,b,ctx,other,sales,sponsor,security,juror,finance,auditor};
};
const rubric=[{key:'function',weight:.6},{key:'evidence',weight:.4}];

test('A: independent Node 22 SQLite persists real data and enforces role/tenant access',t=>{
 const {runtime:r,ctx,other,sales}=setup(t);
 const lead=r.newLead(sales,{sector:'retail',problem:'document intake'});
 assert.equal(lead.status,'QUALIFY');
 assert.throws(()=>r.newLead(other,{sector:'',problem:'none'}),/Missing/);
 const edition=r.newEdition(ctx,{title:'Pilot edition',baseline:'10 minutes',rubric});
 assert.equal(r.own(ctx,'editions',edition.id).title,'Pilot edition');
 assert.throws(()=>r.own(other,'editions',edition.id),/Not found/);
 const reopen=new EditionRuntime(r.root);t.after(()=>reopen.close());
 assert.equal(reopen.own(ctx,'editions',edition.id).baseline,'10 minutes');
 assert.throws(()=>reopen.auth('not-valid'),/Authentication/);
});

test('B: uploads verify SHA, reject traversal/size/tamper and stay quarantined without AV',async t=>{
 const {runtime:r,ctx,sponsor}=setup(t);
 const edition=r.newEdition(ctx,{title:'Company pilot',baseline:'4 minutes',rubric});
 const part=r.register(sponsor,edition.id,'alias_01');const sub=r.submit(sponsor,edition.id,part.id,'Synthetic sample');
 const bytes=Buffer.from('totally synthetic README','utf8'),sha=crypto.createHash('sha256').update(bytes).digest('hex');
 await assert.rejects(r.upload(sponsor,sub.id,'../bad',bytes,sha),/Invalid/);
 await assert.rejects(r.upload(sponsor,sub.id,'readme.txt',bytes,'0'.repeat(64)),/SHA256/);
 const saved=await r.upload(sponsor,sub.id,'readme.txt',bytes,sha);assert.equal(saved.scan,'CLEAN');assert.equal(saved.quarantine,true);
 assert.equal(r.rows('SELECT * FROM artifacts WHERE tenant=?',ctx.tenant).length,1);
 const noAV=new EditionRuntime(path.join(r.root,'unscanned'));
 t.after(()=>noAV.close());const a=noAV.bootstrapTenant('Test no scanner');const c=noAV.auth(a.token);const e=noAV.newEdition(c,{title:'Unverified',baseline:'5',rubric});
 const p=noAV.register(c,e.id,'alias_01');const s=noAV.submit(c,e.id,p.id,'No scanner');
 assert.equal((await noAV.upload(c,s.id,'file.txt',bytes,sha)).scan,'UNVERIFIED');
 assert.throws(()=>noAV.gate(c,e.id,'G3','evidence'),/Forbidden|Unscanned/);
});

test('C: review is independent, agent adapter requires configuration, actual bounded adapter called',async t=>{
 const {runtime:r,ctx,sponsor,security,juror}=setup(t);
 const edition=r.newEdition(ctx,{title:'AI challenge',baseline:'baseline:one',rubric});
 const part=r.register(sponsor,edition.id,'alias_001'),sub=r.submit(sponsor,edition.id,part.id,'Readme classifier');
 const bytes=Buffer.from('public synthetic README'),sha=crypto.createHash('sha256').update(bytes).digest('hex');
 const artifact=await r.upload(sponsor,sub.id,'readme.md',bytes,sha);
 await assert.rejects(r.agentJob(sponsor,sub.id,'model-name',1),/G3/);
 const pre=r.gate(security,edition.id,'G3','mock-av-review');assert.equal(pre.external_signature_verified,false);
 await assert.rejects(r.agentJob(sponsor,sub.id,'model-name',0),/budget/);
 const job=await r.agentJob(sponsor,sub.id,'model-name',2);
 assert.equal(job.external_model_invoked,true);assert.equal(job.status,'PENDING_HUMAN_REVIEW');
 assert.throws(()=>r.evaluate(sponsor,sub.id,3,artifact.id,'Evidence'),/Forbidden/);
 const judged=r.evaluate(juror,sub.id,3,artifact.id,'Synthetic evidence, jury still local');
 assert.equal(judged.ranking,false);
 assert.equal(r.gate(juror,edition.id,'G4','independent-reviewed').status,'LOCAL_REVIEW_ONLY');
 assert.throws(()=>r.gate(ctx,edition.id,'G1','contract'),/unavailable/);
 assert.throws(()=>r.gate(sponsor,edition.id,'G5','committee'),/unavailable/);
});

test('D: exact 11 original output identities preserved and no unsupported renderers claimed',t=>{
 const {runtime:r,ctx,sponsor}=setup(t);
 const ed=r.newEdition(ctx,{title:'Output edition',baseline:'baseline',rubric});
 for(let i=0;i<3;i++)r.addScenario(sponsor,ed.id,{name:'Scenario '+i,risk:'Budget uncertainty',cost_low:1000,cost_high:10000});
 const dossier=r.dossier(ctx,ed.id);
 assert.equal(dossier.outputs.length,11);
 assert.deepEqual(dossier.outputs.map(x=>x.id),Array.from({length:11},(_,i)=>'EX'+String(i+1).padStart(2,'0')));
 assert.equal(dossier.outputs.find(x=>x.id==='EX02').name,'Board Presentation');
 assert.equal(dossier.outputs.find(x=>x.id==='EX05').format,'Graph JSON + HTML');
 assert.equal(dossier.outputs.find(x=>x.id==='EX06').payload.ready_for_g5,true);
 assert.equal(dossier.outputs.find(x=>x.id==='EX11').render_status,'REQUIRES_RENDERER_OR_HUMAN_REVIEW');
 assert.equal(dossier.release_approved,false);
 assert.ok(!JSON.stringify(dossier).includes('alias_'));
});

test('E: leads, contracts, invoice, finance-only manual reconciliation, awards; zero money movement',t=>{
 const {runtime:r,ctx,sales,finance,sponsor}=setup(t);
 const ed=r.newEdition(ctx,{title:'Paid scope',baseline:'4.0',rubric});
 assert.equal(r.recordContract(sponsor,ed.id,{sow_ref:'SOW:signed-reference',dpa_ref:'DPA:reference'}).status,'PENDING_SIGNATURE');
 const inv=r.invoice(finance,ed.id,'INV-2026-01',2500000);
 assert.equal(inv.status,'DRAFT');assert.equal(inv.money_moved,false);
 assert.throws(()=>r.invoice(finance,ed.id,'INV-2026-01',2500000),/UNIQUE|constraint/i);
 assert.throws(()=>r.reconcile(sales,inv.id,'TRANSFER-01',2500000),/Forbidden/);
 assert.throws(()=>r.reconcile(finance,inv.id,'TRANSFER-01',100),/Amount mismatch/);
 const bank=r.reconcile(finance,inv.id,'TRANSFER-01',2500000);
 assert.equal(bank.verified_by_bank_api,false);assert.equal(bank.money_moved,false);
 assert.throws(()=>r.reconcile(finance,inv.id,'TRANSFER-01',2500000),/UNIQUE|constraint/i);
 assert.equal(r.payout(finance,ed.id,'PRIZE','win-01',100000).money_moved,false);
 assert.equal(r.dossier(ctx,ed.id).finance.invoices[0].status,'PAYMENT_REFERENCE_UNVERIFIED');
});

test('HTTP auth/tenant isolation; create and retrieve edition through real local listener',async t=>{
 const {runtime:r,a,b}=setup(t);const server=makeApi(r);
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));t.after(()=>server.close());
 const port=server.address().port,base=`http://127.0.0.1:${port}`;
 const request=(token,url,method='GET',payload)=>fetch(base+url,{method,headers:{authorization:'Bearer '+token,...(payload?{'content-type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined});
 const bad=await request('wrong','/v1/health');assert.equal(bad.status,401);
 const a1=await request(a.token,'/v1/editions','POST',{title:'Company A edit',baseline:'5 minutes',rubric});assert.equal(a1.status,201);const newEdition=await a1.json();
 const forbidden=await request(b.token,`/v1/editions/${newEdition.id}/dossier`);assert.equal(forbidden.status,404);
 const own=await request(a.token,`/v1/editions/${newEdition.id}/dossier`);assert.equal(own.status,200);
 assert.equal((await own.json()).outputs.length,11);
});

test('Model adapter never permits HTTP or missing API key',()=>{
 assert.throws(()=>httpsModelAdapter({endpoint:'http://127.0.0.1:9000',apiKey:'abcdefgh'}),/HTTPS/);
 assert.throws(()=>httpsModelAdapter({endpoint:'https://example.com/api',apiKey:''}),/key/);
});
