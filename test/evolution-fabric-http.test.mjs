import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {makeApi} from '../bin/api.mjs';
process.env.AIFIRST_SYNTHETIC_DEMO='1';
function fixture(t){const folder=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-fabric-http-'));const e=new EditionRuntime(folder);
 t.after(()=>{e.close();fs.rmSync(folder,{recursive:true,force:true})});const a=e.bootstrapTenant('Synthetic A'),b=e.bootstrapTenant('Synthetic B');return {e,a,b};}
const request=(base,token,endpoint,method='GET',payload)=>fetch(base+endpoint,{method,headers:{authorization:'Bearer '+token,...(payload?{'content-type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined});
test('HTTP integration: fabric, calendar, proposals, tenant isolation and no automatic promotions',async t=>{
 const {e,a,b}=fixture(t);const server=makeApi(e);await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>server.close());
 const base='http://127.0.0.1:'+server.address().port;
 let r=await request(base,a.token,'/v1/evolution/init','POST',{});assert.equal(r.status,201);
 const another=await request(base,b.token,'/v1/evolution/fabric');assert.notEqual(another.status,200);
 r=await request(base,a.token,'/v1/evolution/fabric');assert.equal(r.status,200);const h=await r.json();assert.equal(h.production_ready,false);assert.equal(h.content_transport,'SHA256_ONLY');
 r=await request(base,a.token,'/v1/evolution/agents','POST',{name:'Evaluator',role:'productive',capability:'HACKATHON'});assert.equal(r.status,201);const agent=await r.json();
 r=await request(base,a.token,'/v1/evolution/positions','POST',{capability:'HACKATHON',title:'Challenge evaluator',incumbent:agent.id});assert.equal(r.status,201);const pos=await r.json();
 r=await request(base,a.token,'/v1/evolution/job-board-tick','POST',{});assert.equal(r.status,201);const tick=await r.json();assert.equal(tick.opened,1);
 r=await request(base,a.token,'/v1/evolution/job-board-tick','POST',{});assert.equal((await r.json()).opened,0);
 r=await request(base,a.token,'/v1/evolution/improvement-proposal','POST',{position:pos.id,reason:'Review mirror revealed an uncertain evidence source'});assert.equal(r.status,201);assert.equal((await r.json()).autonomous_replacement,false);
 r=await request(base,a.token,'/v1/evolution/improvements');assert.equal((await r.json()).proposals.length,1);
 const bad=await request(base,b.token,'/v1/evolution/improvements');assert.equal((await bad.json()).proposals.length,0);
 const rejected=await request(base,b.token,'/v1/evolution/improvement-proposal','POST',{position:pos.id,reason:'Try cross tenant access'});assert.notEqual(rejected.status,201);
 const sim=await request(base,a.token,'/v1/evolution/bridge','POST',{submission:'sub_bogus'});assert.notEqual(sim.status,201);
 const snap=await request(base,a.token,'/v1/evolution/snapshot');assert.equal((await snap.json()).agents.find(x=>x.id===agent.id).status,'ACTIVE');
});
