import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {makeApi} from '../bin/api.mjs';
import {integrationReadiness,CONNECTOR_REGISTRY} from '../src/integration-readiness.mjs';
const temp=t=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-ui-web-'));const engine=new EditionRuntime(root);const tenant=engine.bootstrapTenant('Synthetic brand test');t.after(()=>{engine.close();fs.rmSync(root,{recursive:true,force:true})});return {engine,tenant}};
const listen=async(t,engine)=>{const server=makeApi(engine);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>server.close());return 'http://127.0.0.1:'+server.address().port};
test('Brand landing is separate from command center, local Atlas is navigable and each page is nonce-protected',async t=>{
 const {engine}=temp(t),url=await listen(t,engine);
 for(const [route,expected] of [['/','Tu próxima ventaja'],['/console','Command Center'],['/atlas','Operating Atlas']]){
  const res=await fetch(url+route);assert.equal(res.status,200,route);const html=await res.text();assert.match(html,new RegExp(expected));
  assert.ok(html.includes('lang="es"'));assert.match(res.headers.get('content-security-policy'),/script-src 'nonce-/);
  assert.doesNotMatch(res.headers.get('content-security-policy'),/unsafe-inline/);
  assert.match(html,/<style nonce="[^"]+">/);
 }
});
test('Brand narrative has clear no-production disclosure and no invented customers, active ROI or external analytics',()=>{
 const html=fs.readFileSync(new URL('../web/index.html',import.meta.url),'utf8');
 for(const text of ['Plataforma en desarrollo','no representa resultados de clientes reales','Operating Atlas','G0–G7','EX01–11','30/60/90'])assert.ok(html.includes(text),text);
 assert.doesNotMatch(html,/<script[^>]+src=|google-analytics|gtag\s*\(|segment\.com|mixpanel/i);
 assert.match(html,/prefers-reduced-motion/);assert.match(html,/focus-visible/);
 assert.equal((html.match(/data-case="/g)||[]).length,3);
});
test('New authenticated tenant-scoped editions cannot cross tenant and never return participant names',async t=>{
 const {engine,tenant}=temp(t),b=engine.bootstrapTenant('Other company'),url=await listen(t,engine),aCtx=engine.auth(tenant.token);
 const rubric=[{key:'quality',weight:.5},{key:'evidence',weight:.5}];engine.newEdition(aCtx,{title:'Synthetics only',baseline:'Assumption',rubric});
 const get=token=>fetch(url+'/v1/editions',{headers:{authorization:'Bearer '+token}});
 assert.equal((await get('invalid')).status,401);
 const a=await (await get(tenant.token)).json(),other=await (await get(b.token)).json();
 assert.equal(a.editions.length,1);assert.equal(other.editions.length,0);
 assert.deepEqual(Object.keys(a.editions[0]).sort(),['created','id','stage','title']);
});
test('Readiness registry never treats configured flags as external certification and never returns keys',async t=>{
 const {engine,tenant}=temp(t),url=await listen(t,engine);
 const response=await fetch(url+'/v1/integrations/readiness',{headers:{authorization:'Bearer '+tenant.token}});
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.production_ready,false);
 assert.equal(data.connectors.length,9);assert.ok(data.connectors.every(x=>x.externally_verified===false));
 assert.equal(data.summary.externally_verified,0);
 assert.doesNotMatch(JSON.stringify(data),/sk-or-|password|BEGIN PRIVATE KEY/);
 const seed=integrationReadiness({enterprise:{masterKey:Buffer.alloc(32),oidc:{issuer:'synthetic'}},env:{OPENROUTER_API_KEY:'SUPER_PRIVATE_123',AIFIRST_SYNTHETIC_DEMO:'1',AIFIRST_ALLOW_OPENROUTER_FREE:'1'}});
 assert.equal(seed.summary.configured,3);assert.equal(seed.production_ready,false);
 assert.doesNotMatch(JSON.stringify(seed),/SUPER_PRIVATE_123/);
 assert.equal(CONNECTOR_REGISTRY.length,9);
});
test('Admin-only readiness and exact Origin policy block other local ports',async t=>{
 const {engine,tenant}=temp(t),url=await listen(t,engine),ctx=engine.auth(tenant.token),sponsor=engine.addPrincipal(ctx,'sponsor');
 const uri=url+'/v1/integrations/readiness';
 assert.equal((await fetch(uri,{headers:{authorization:'Bearer '+sponsor.token}})).status,403);
 const crossed=await fetch(uri,{headers:{authorization:'Bearer '+tenant.token,origin:'http://127.0.0.1:9999'}});
 assert.equal(crossed.status,403);
 const allowed=await fetch(uri,{headers:{authorization:'Bearer '+tenant.token,origin:url}});
 assert.equal(allowed.status,200);
});
test('Command center never saves tokens to persistent web storage and shows all contracted EX',()=>{
 const html=fs.readFileSync(new URL('../web/pilot.html',import.meta.url),'utf8');
 assert.doesNotMatch(html.split('<script>')[1]||'',/\blocalStorage\s*\.|\bsessionStorage\s*\./);
 assert.match(html,/\.textContent\s*=/);
 assert.match(html,/aria-current/);
 assert.match(html,/connection-list/);
 assert.match(html,/prefers-reduced-motion/);
 assert.match(html,/token=''/);
 assert.equal((html.match(/\['EX\d\d',/g)||[]).length,11);
});
