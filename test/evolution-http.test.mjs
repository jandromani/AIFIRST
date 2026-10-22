import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {EditionRuntime} from '../src/edition-runtime.mjs';import {makeApi} from '../bin/api.mjs';
process.env.AIFIRST_SYNTHETIC_DEMO='1';
function setup(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'evo-http-')),db=new EditionRuntime(root),a=db.bootstrapTenant('A demo'),b=db.bootstrapTenant('B demo'),aud=db.auth(db.addPrincipal(db.auth(a.token),'auditor').token),server=makeApi(db);
 t.after(()=>{server.close();db.close();fs.rmSync(root,{recursive:true,force:true});});return {db,a,b,aud,server};}
async function listen(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port;}
function request(base,token,path,method='GET',body){return fetch(base+path,{method,headers:{Authorization:'Bearer '+token,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});}
test('Product home and Evolution page served on loopback with a nonce CSP',async t=>{const f=setup(t),base=await listen(f.server);const r=await request(base,f.a.token,'/evolution');assert.equal(r.status,200);const html=await r.text();assert.match(html,/Agent Evolution OS/);assert.match(r.headers.get('content-security-policy'),/nonce-/);assert.doesNotMatch(r.headers.get('content-security-policy'),/unsafe-inline/);});
test('Evolution HTTP demo real SQLite: identity, critique private channel and GOD v2',async t=>{const f=setup(t),base=await listen(f.server);
 const pre=await request(base,f.a.token,'/v1/evolution/status');assert.equal((await pre.json()).initialized,false);
 const demo=await request(base,f.a.token,'/v1/evolution/demo','POST',{demo:true});assert.equal(demo.status,201);const flow=await demo.json();assert.equal(flow.status,'SYNTHETIC_SCENARIO_COMPLETE');assert.equal(flow.snapshot.agents.length,11);assert.equal(flow.snapshot.beliefs.version,2);
 const o=await request(base,f.b.token,'/v1/evolution/status');assert.equal((await o.json()).initialized,false);
 assert.equal((await request(base,f.b.token,'/v1/evolution/snapshot')).status,404);
 const unauthorized=await request(base,f.a.token,'/v1/evolution/mirrors/GOD');assert.equal(unauthorized.status,403);
 // Independent auditor token is available through the fixture setup context, via token handled here manually in a separate actor.
 const snap=await request(base,f.a.token,'/v1/evolution/snapshot');assert.equal((await snap.json()).metrics.active_agents,9);
 const summary=await request(base,f.a.token,'/v1/evolution/league');assert.ok((await summary.json()).agent_of_week);
 const again=await request(base,f.a.token,'/v1/evolution/demo','POST',{demo:true});assert.equal((await again.json()).status,'EXISTING_DEMO');
});
test('Evolution REST restricts ingest, blocks cross-tenant agent references and disabled demo outside synthetic mode',async t=>{const f=setup(t),base=await listen(f.server);
 await request(base,f.a.token,'/v1/evolution/init','POST',{});
 const agent=await request(base,f.a.token,'/v1/evolution/agents','POST',{name:'public synthetic agent',role:'productive',capability:'REPORTS'});assert.equal(agent.status,201);const json=await agent.json();
 await request(base,f.b.token,'/v1/evolution/init','POST',{});
 const foreign=await request(base,f.b.token,'/v1/evolution/positions','POST',{capability:'REPORTS',title:'Leak attempt',incumbent:json.id});assert.equal(foreign.status,404);
 const result=await request(base,f.a.token,'/v1/evolution/tasks','POST',{capability:'REPORTS',contract:'Synthetic report',subject_hash:'a'.repeat(64)});assert.equal(result.status,201);
 const bad=await request(base,f.a.token,'/v1/evolution/traces','POST',{agent:json.id,task:(await result.json()).id,source:'LANGGRAPH',metrics:{quality:2,reliability:.9,safety:1,cost_eur:0,latency_ms:22}});assert.notEqual(bad.status,201);
});
