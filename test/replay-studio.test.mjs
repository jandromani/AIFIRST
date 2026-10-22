import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {defaultReplayInput,runReplay,canonicalJson} from '../web/replay-core.mjs';
import {ReplayStudio,verifyReplayReceipt} from '../src/replay-studio.mjs';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {makeApi} from '../bin/api.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=x=>crypto.createHash('sha256').update(canonicalJson(x)).digest('hex');
const fixture=t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-replay-'));
 const old=process.env.AIFIRST_SYNTHETIC_DEMO;process.env.AIFIRST_SYNTHETIC_DEMO='1';
 const engine=new EditionRuntime(dir);const a=engine.bootstrapTenant('Replay company A');const b=engine.bootstrapTenant('Replay company B');
 const ctx=engine.auth(a.token);const auditor=engine.auth(engine.addPrincipal(ctx,'auditor').token);
 t.after(()=>{process.env.AIFIRST_SYNTHETIC_DEMO=old;engine.close();fs.rmSync(dir,{recursive:true,force:true});});
 return {engine,a,b,ctx,auditor};
};
test('Golden reference: deterministic, stable canonical hashes and explicit exclusions',()=>{
 const input=defaultReplayInput(),a=runReplay(input),b=runReplay(structuredClone(input));
 assert.equal(canonicalJson(a),canonicalJson(b));assert.equal(sha(a),sha(b));
 assert.equal(a.discovery.projects.length,10);assert.equal(a.arena.tests.length,6);assert.equal(a.dios.roster.length,5);
 assert.equal(a.discovery.projects.find(x=>x.id==='P09').eligible,false);
 assert.ok(a.discovery.projects.find(x=>x.id==='P09').exclusions.includes('PERSONNEL_PROFILING_PROHIBITED'));
 assert.equal(a.limitations.production_release,false);assert.equal(a.limitations.hidden_benchmark,false);
});
test('Independent rule transitions: veto, unsafe candidate, reviewer gate, fixed exclusions',()=>{
 const base=defaultReplayInput();const safe=runReplay({...base,independentGate:true});
 assert.equal(safe.arena.canaryEligible,true);assert.equal(safe.dios.amendmentEligible,true);
 const veto=runReplay({...base,independentGate:true,votes:{...base.votes,'AG-05':'no'}});
 assert.equal(veto.dios.amendmentEligible,false);assert.equal(veto.dios.no,1);
 const unsafe=runReplay({...base,candidate:'outsider',independentGate:true});
 assert.equal(unsafe.arena.unsafe,1);assert.equal(unsafe.arena.canaryEligible,false);
 assert.equal(safe.arena.canaryActual,false);assert.equal(safe.dios.actualConstitutionChanged,false);
});
test('Input allowlist refuses arbitrary code, malicious metadata and invalid votes',()=>{
 const ok=defaultReplayInput();for(const bad of [{...ok,employeeEmail:'synthetic@example.com'},{...ok,budgetK:-20},{...ok,strategy:'../../secret'},
 {...ok,votes:{...ok.votes,'AG-06':'yes'}},{...ok,independentGate:'yes'}])assert.throws(()=>runReplay(bad));
});
test('Signed Node replay matches reference output and detects tampered claims',t=>{
 const {engine,ctx,auditor}=fixture(t);const studio=new ReplayStudio(engine);
 const r=studio.run(ctx,{...defaultReplayInput(),independentGate:true});
 assert.equal(verifyReplayReceipt(r).valid,true);assert.equal(verifyReplayReceipt(r).issuer_trusted,false);
 assert.equal(studio.list(auditor).length,1);const claim=JSON.parse(r.payload_json);
 assert.equal(studio.find(auditor,claim.id).signature_b64,r.signature_b64);
 const modified=structuredClone(r);modified.payload_json=modified.payload_json.replace('PUBLIC_EXPLANATORY_ONLY','PROD');assert.equal(verifyReplayReceipt(modified).valid,false);
 const tampered=structuredClone(r);tampered.signer.key_id='0'.repeat(64);assert.equal(verifyReplayReceipt(tampered).valid,false);
});
test('Tenant and role isolation; synthetic switch; bounded daily budget',t=>{
 const {engine,ctx,b,auditor}=fixture(t);const studio=new ReplayStudio(engine);
 assert.throws(()=>studio.run(auditor,defaultReplayInput()),/Forbidden/);
 const r=studio.run(ctx,defaultReplayInput());const claim=JSON.parse(r.payload_json);
 assert.throws(()=>studio.find(engine.auth(b.token),claim.id),/Not found/);
 assert.deepEqual(studio.list(engine.auth(b.token)),[]);
 process.env.AIFIRST_SYNTHETIC_DEMO='0';assert.throws(()=>studio.run(ctx,defaultReplayInput()),/Synthetic/);
 process.env.AIFIRST_SYNTHETIC_DEMO='1';
 for(let i=1;i<20;i++)studio.run(ctx,defaultReplayInput());
 assert.throws(()=>studio.run(ctx,defaultReplayInput()),/Daily replay/);
});
test('Private HTTP route authentication, signature and tenant isolation',async t=>{
 const {engine,a,b}=fixture(t);const server=makeApi(engine);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>server.close());
 const base=`http://127.0.0.1:${server.address().port}`;
 const send=(tok,method,uri,payload)=>fetch(base+uri,{method,headers:{authorization:'Bearer '+tok,...(payload?{'content-type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined});
 assert.equal((await send('bad','GET','/v1/replay/runs')).status,401);
 const result=await send(a.token,'POST','/v1/replay/runs',defaultReplayInput());assert.equal(result.status,201);
 const receipt=await result.json();assert.equal(verifyReplayReceipt(receipt).valid,true);
 const id=JSON.parse(receipt.payload_json).id;
 assert.equal((await send(b.token,'GET','/v1/replay/runs/'+id)).status,404);
 assert.equal((await send(a.token,'GET','/v1/replay/runs')).status,200);
 const page=await fetch(base+'/replay');assert.equal(page.status,200);assert.match(await page.text(),/replay-core\.mjs/);
 const core=await fetch(base+'/replay-core.mjs');assert.equal(core.status,200);assert.match(await core.text(),/function runReplay/);
});
test('Portable static build inlines exact Node kernel and refuses private controls',t=>{
 const dir=fs.mkdtempSync(path.join(root,'dist-replay-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 execFileSync(process.execPath,[path.join(root,'bin/build-public-preview.mjs'),dir],{cwd:root});
 const html=fs.readFileSync(path.join(dir,'replay.html'),'utf8');
 assert.match(html,/function runReplay\(input\)/);
 assert.doesNotMatch(html,/import \{REPLAY_SCHEMA/);
 assert.match(html,/noindex,nofollow/);assert.match(html,/aifirst\.replay\.kernel\.v1/);
 assert.match(fs.readFileSync(path.join(dir,'index.html'),'utf8'),/href="replay.html"/);
 assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'PREVIEW_STATUS.json'))).replay_studio_included,true);
});
test('Offline CLI outputs same result digest and never claims release',()=>{
 const proof=JSON.parse(execFileSync(process.execPath,[path.join(root,'bin/replay.mjs'),'default'],{encoding:'utf8'}));
 assert.equal(proof.result_sha256,sha(runReplay(defaultReplayInput())));
 assert.equal(proof.synthetic_only,true);assert.equal(proof.production_release,false);
});
