import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {SyntheticJobQueue} from '../src/job-queue.mjs';
const rubric=[{key:'function',weight:.6},{key:'evidence',weight:.4}];
function setup(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-queue-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const e=new EditionRuntime(root,{scanner:async(file,sha)=>({status:'CLEAN',reference:'TEST_AV_ONLY',sha256:sha,signature_valid:true}),agent:async()=>({text:'Synthetic mock result, human verification needed',costEur:0})});
 t.after(()=>e.close());const a=e.bootstrapTenant('A'),admin=e.auth(a.token),sponsor=e.auth(e.addPrincipal(admin,'sponsor').token),security=e.auth(e.addPrincipal(admin,'security').token);
 const b=e.bootstrapTenant('B'),foreign=e.auth(b.token);
 return {e,admin,sponsor,security,foreign};
}
async function ready(e,admin,sponsor,security){
 const ed=e.newEdition(admin,{title:'Mock edition',baseline:'control',rubric});
 const p=e.register(sponsor,ed.id,'alias_001'),sub=e.submit(sponsor,ed.id,p.id,'Synthetic project');
 const bytes=Buffer.from('hello, synthetic only'),sha=crypto.createHash('sha256').update(bytes).digest('hex');
 await e.upload(sponsor,sub.id,'readme.txt',bytes,sha);
 e.gate(security,ed.id,'G3','MOCK_ONLY');return sub;
}
const withSynthetic=async fn=>{const old=process.env.AIFIRST_SYNTHETIC_DEMO;process.env.AIFIRST_SYNTHETIC_DEMO='1';try{return await fn()}finally{if(old===undefined)delete process.env.AIFIRST_SYNTHETIC_DEMO;else process.env.AIFIRST_SYNTHETIC_DEMO=old;}};
test('Persistent tenant-scoped queue, idempotency and controlled completion',async t=>withSynthetic(async()=>{
 const {e,admin,sponsor,security,foreign}=setup(t),sub=await ready(e,admin,sponsor,security);
 const q=new SyntheticJobQueue(e),r=q.enqueue(sponsor,sub.id,{});
 assert.equal(r.status,'QUEUED');assert.equal(q.enqueue(sponsor,sub.id,{}).id,r.id);
 assert.deepEqual(q.status(foreign),[]);
 const done=await q.runOne(admin,'worker_local_1');assert.equal(done.status,'COMPLETED');assert.equal(done.outputPendingReview,true);
 assert.equal((await q.runOne(admin,'worker_local_1')).status,'EMPTY');
 const restart=new SyntheticJobQueue(e);assert.equal(restart.status(admin)[0].status,'COMPLETED');
}));
test('Stale lease and wrong tenant forbidden; disabled outside demo',async t=>{
 const {e,admin,sponsor,security,foreign}=setup(t),sub=await ready(e,admin,sponsor,security);
 let q=new SyntheticJobQueue(e);
 assert.throws(()=>q.enqueue(sponsor,sub.id,{}),/synthetic/);
 await withSynthetic(async()=>{
  q.enqueue(sponsor,sub.id,{});const lease=q.claim(admin,'worker_local_2');
  assert.throws(()=>q.finish(foreign,lease,{jobId:'job_x'}),/Forbidden|tenant/);
  assert.throws(()=>q.finish(admin,{...lease,leaseUntil:lease.leaseUntil+1},{jobId:'job_x'}),/Lease lost/);
  assert.equal(q.finish(admin,lease,{jobId:'job_mock'}).status,'COMPLETED');
 });
});
