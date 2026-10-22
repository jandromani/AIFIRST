import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {VerifiedTheater,verifyTheaterReceipt} from '../src/verified-theater.mjs';
import {makeApi} from '../bin/api.mjs';
const fixture=t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-theater-test-'));process.env.AIFIRST_SYNTHETIC_DEMO='1';
 const engine=new EditionRuntime(root);t.after(()=>{engine.close();fs.rmSync(root,{recursive:true,force:true});});
 const a=engine.bootstrapTenant('Company A synthetic'),b=engine.bootstrapTenant('Company B synthetic');
 const admin=engine.auth(a.token),other=engine.auth(b.token),auditor=engine.auth(engine.addPrincipal(admin,'auditor').token);
 return {engine,a,b,admin,other,auditor};
};
test('Real private engines produce a locally signed receipt, with three independently checked flows',async t=>{
 const {engine,admin,auditor}=fixture(t);const v=new VerifiedTheater(engine);
 const receipt=await v.run(admin);const chk=verifyTheaterReceipt(receipt);
 assert.equal(chk.valid,true);assert.equal(chk.issuer_trusted,false);
 assert.equal(chk.payload.discovery.original_ex_contracts,11);assert.equal(chk.payload.discovery.scan,'MOCK_SIGNED_SCANNER_ONLY');
 assert.equal(chk.payload.arena.evolution_chain_valid,true);assert.equal(chk.payload.god.voting_unanimous,true);
 assert.equal(chk.payload.god.votes,chk.payload.god.eligible);
 assert.equal(chk.payload.limitations.production_release,false);
 const signed=verifyTheaterReceipt(receipt,{trustedKeyId:v.keyInfo(auditor).key_id});assert.equal(signed.issuer_trusted,true);
 assert.equal(v.list(auditor).length,1);assert.equal(v.find(auditor,chk.payload.run_id).signature_b64,receipt.signature_b64);
});
test('Tampering changes digest and invalidates signature, even if self-contained pubkey is supplied',async t=>{
 const {engine,admin}=fixture(t);const receipt=await new VerifiedTheater(engine).run(admin);
 const altered=structuredClone(receipt);altered.payload_json=altered.payload_json.replace('MOCK_SIGNED_SCANNER_ONLY','PRODUCTION_SCANNER_CERTIFIED');
 assert.equal(verifyTheaterReceipt(altered).valid,false);
 const rogue=structuredClone(receipt);rogue.signer.key_id='0'.repeat(64);assert.equal(verifyTheaterReceipt(rogue).valid,false);
});
test('Role and tenant isolation; synthetic mode off refuses runs',async t=>{
 const {engine,admin,other,auditor}=fixture(t);const v=new VerifiedTheater(engine);
 assert.deepEqual(v.list(other),[]);await assert.rejects(v.run(auditor),/Forbidden/);
 process.env.AIFIRST_SYNTHETIC_DEMO='0';await assert.rejects(v.run(admin),/Synthetic/);process.env.AIFIRST_SYNTHETIC_DEMO='1';
 const first=await v.run(admin);const id=verifyTheaterReceipt(first).payload.run_id;
 assert.throws(()=>v.find(other,id),/Not found/);assert.equal(v.list(other).length,0);
});
test('HTTP loopback requires auth and explicit synthetic acknowledgement',async t=>{
 const {engine,a,b}=fixture(t);const server=makeApi(engine);
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));t.after(()=>server.close());
 const port=server.address().port,base=`http://127.0.0.1:${port}`;
 const req=(tok,method,route,body)=>fetch(base+route,{method,headers:{authorization:'Bearer '+tok,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 assert.equal((await req('bad','GET','/v1/theater/proofs')).status,401);
 assert.equal((await req(a.token,'POST','/v1/theater/proofs',{ack_synthetic_only:false})).status,400);
 const result=await req(a.token,'POST','/v1/theater/proofs',{ack_synthetic_only:true});assert.equal(result.status,201);const r=await result.json();assert.equal(verifyTheaterReceipt(r).valid,true);
 const id=JSON.parse(r.payload_json).run_id;
 assert.equal((await req(b.token,'GET','/v1/theater/proofs/'+id)).status,404);
 assert.equal((await req(a.token,'GET','/v1/theater/proofs/'+id)).status,200);
 assert.equal((await req(a.token,'GET','/v1/theater/proofs/signer')).status,200);
});
