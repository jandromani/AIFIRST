import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {makeEvolutionOpenRouterAdapter} from '../src/evolution-openrouter.mjs';
import {adapterEnvelope, EvolutionOS} from '../src/evolution-os.mjs';
import {EditionRuntime} from '../src/edition-runtime.mjs';
const root=path.resolve(import.meta.dirname,'..');
test('OpenRouter synthetic adapter transmits no contract, prompt spec, private review or identity; requires explicit opt-in',async()=>{
 const old={...process.env};
 try{delete process.env.AIFIRST_SYNTHETIC_DEMO;delete process.env.AIFIRST_ALLOW_OPENROUTER_FREE;
  assert.throws(()=>makeEvolutionOpenRouterAdapter({apiKey:'sk-or-demo_0123456789abcdefghijkl'}),/closed/);
  process.env.AIFIRST_SYNTHETIC_DEMO='1';process.env.AIFIRST_ALLOW_OPENROUTER_FREE='1';
  let transmitted='';const stub=async(url,{body})=>{transmitted=body;return {ok:true,json:async()=>({choices:[{message:{content:'Observed synthetic evidence gaps; human review required'}}],model:'synthetic/free',usage:{prompt_tokens:120,completion_tokens:10}})};};
  const adapter=makeEvolutionOpenRouterAdapter({apiKey:'sk-or-demo_0123456789abcdefghijkl',fetchImpl:stub});
  const r=await adapter({task:{id:'task_safe_01',capability:'HACKATHON',contract:'PRIVATE_PERSON_12345',subject_hash:'a'.repeat(64)},agent:{prompt_spec:'PRIVATE_SECRET_PROMPT'}});
  assert.match(r.summary,/synthetic/);assert.ok(!transmitted.includes('PRIVATE_PERSON_12345'));assert.ok(!transmitted.includes('PRIVATE_SECRET_PROMPT'));assert.match(transmitted,/openrouter\/free/);
 }finally{process.env.AIFIRST_SYNTHETIC_DEMO=old.AIFIRST_SYNTHETIC_DEMO??'';process.env.AIFIRST_ALLOW_OPENROUTER_FREE=old.AIFIRST_ALLOW_OPENROUTER_FREE??'';}
});
test('two products are discoverable and UX labels keep synthetic / no production claims',()=>{
 const landing=fs.readFileSync(path.join(root,'web/index.html'),'utf8');const evo=fs.readFileSync(path.join(root,'web/evolution.html'),'utf8');const console=fs.readFileSync(path.join(root,'web/pilot.html'),'utf8');
 for(const string of ['Discovery &','Agent<br>Evolution OS','href="/evolution"'])assert.ok(landing.includes(string));
 for(const word of ['DIOS','Swarm','Job market','Mirror audit','LOCAL','evolutivo'])assert.ok(evo.includes(word),word);
 assert.ok(console.includes('Evolution OS ↗'));assert.ok(evo.includes('noindex,nofollow'));assert.ok(!/localStorage|sessionStorage/.test(evo));
});
test('external agent envelope rejects out-of-range scores and never grants trust',()=>{
 const payload={source:'CREWAI',external_id:'job123',task_id:'task_demo1',agent_id:'agent_demo1',metrics:{quality:.9,reliability:.8,safety:.95,cost_eur:.1,latency_ms:120}};
 const s=adapterEnvelope(payload);assert.equal(s.trust,'UNVERIFIED_EXTERNAL');assert.equal(s.used_for_promotions,false);assert.equal(s.external_id_hash,crypto.createHash('sha256').update('job123').digest('hex'));
 assert.throws(()=>adapterEnvelope({...payload,metrics:{...payload.metrics,quality:7}}),/Normalized/);
});
