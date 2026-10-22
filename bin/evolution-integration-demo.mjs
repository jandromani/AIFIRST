#!/usr/bin/env node
/** Reproducible synthetic integration proof. Not an external LLM call or customer pilot. */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {EvolutionOS} from '../src/evolution-os.mjs';
import {EvolutionFabric} from '../src/evolution-fabric.mjs';
import {ReviewPlanner} from '../src/evolution-review-planner.mjs';
import {independentBenchmark} from '../src/evolution-benchmarks.mjs';
process.env.AIFIRST_SYNTHETIC_DEMO='1';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-evolution-integration-'));
const engine=new EditionRuntime(root);const signed=(p,s)=>crypto.sign(null,Buffer.from(p),s).toString('base64');
try{
 const bootstrap=engine.bootstrapTenant('Synthetic Discovery + Evolution proof');const admin=engine.auth(bootstrap.token);const auditor=engine.auth(engine.addPrincipal(admin,'auditor').token);const security=engine.auth(engine.addPrincipal(admin,'security').token);
 const evaluator=engine.newEdition(admin,{title:'Synthetic hackathon',baseline:'Current project documentation reviewed',rubric:[{key:'correctness',weight:.7},{key:'evidence',weight:.3}]});
 const participant=engine.register(admin,evaluator.id,'alias_demo_001');const submission=engine.submit(admin,evaluator.id,participant.id,'Synthetic solution');
 const bytes=Buffer.from('Only locally created synthetic material, no personal data');const digest=crypto.createHash('sha256').update(bytes).digest('hex');
 engine.run('INSERT INTO artifacts VALUES(?,?,?,?,?,?,?,?,?,?)','art_demo01',admin.tenant,evaluator.id,submission.id,'readme.txt',digest,bytes.length,'CLEAN','SYNTHETIC_MOCK_SCAN_NOT_CERTIFIED','synthetic-only');
 engine.run('INSERT INTO gates VALUES(?,?,?,?,?,?,?,?)','gate_demo01',admin.tenant,evaluator.id,'G3',security.id,'LOCAL_REVIEW_ONLY','SYNTHETIC_NOT_AUTHORIZED',new Date().toISOString());
 const osys=new EvolutionOS(engine);osys.init(admin);
 const incumbent=osys.createAgent(admin,{name:'Incumbent evidence evaluator',role:'productive',capability:'HACKATHON',prompt_spec:'v1: review source hashes'});
 const key=crypto.generateKeyPairSync('ed25519');const mirror=osys.createAgent(admin,{name:'Independent signed mirror',role:'mirror',capability:'HACKATHON',public_key:key.publicKey.export({format:'pem',type:'spki'})});
 const challenger=osys.createAgent(admin,{name:'Challenger with bounded citation rules',role:'candidate',status:'CANDIDATE',capability:'HACKATHON'});
 const bridge=new EvolutionFabric(engine,{evolution:osys});const attached=bridge.bridgeSubmission(admin,submission.id);
 const completed=await osys.executeTask(admin,attached.task,async()=>({summary:'Synthetic project has a README digest; human must verify claims.'}));
 const report='Synthetic mirror: verify three independent source checks before deployment.';const hash=crypto.createHash('sha256').update(report).digest('hex');
 const signature=signed(`MIRROR:v1:${admin.tenant}:${mirror.id}:${attached.task}:AGENT:ORCHESTRATOR:HIGH:${hash}`,key.privateKey);
 const critique=await bridge.mirrorRound(admin,attached.task,{mirror:mirror.id,critic:async()=>({severity:'HIGH',report,signature})});
 const pos=osys.openPosition(admin,'HACKATHON','Hackathon evaluator',incumbent.id);const vacant=bridge.rotateJobBoard(admin);
 const applied=osys.apply(admin,vacant.vacancies[0],challenger.id,'Synthetic candidate: expected-answer checks');
 const hidden=[{input:'A',expected:'OK-A'},{input:'B',expected:'OK-B'},{input:'C',expected:'OK-C'}];
 const suite=independentBenchmark({cases:hidden,runner:async({agent,input})=>({output:agent.id===challenger.id?'OK-'+input:'UNVERIFIED',cost_eur:0.0001})});
 const independentEval=async info=>suite.evaluate(info);osys.trustedEvaluator=independentEval;
 const arena=await osys.arena(admin,applied.id,{hiddenFixture:'synthetic_fixture_v1',evaluate:independentEval});
 let promotion=null;if(arena.quality_gate){const p=osys.proposePromotion(admin,arena.id);osys.approvePromotion(auditor,p.id);promotion=osys.activatePromotion(admin,p.id);}
 const planner=new ReviewPlanner(engine,{evolution:osys});const change=planner.propose(admin,pos.id,{reason:'Independently signed mirror identified missing source evidence',source:'ORCHESTRATOR'});
 const result={schema:'aifirst.evolution.integration-proof.v1',mode:'SYNTHETIC_ONLY',links:{discovery_submission:submission.id,evolution_task:attached.task,bridge_id:attached.id},execution:completed,critic:{channel:critique.channel,signed:true},job_board:vacant,arena:{decision:arena.decision,delta:arena.delta,benchmark_hash:suite.fixture_hash},promotion,governance:change,audit:osys.auditChain(auditor),gates:{external_provider_verified:false,production_release:false,customer_data_used:false},data_transport:'SHA256_METADATA_ONLY'};
 if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));else console.log(`Discovery → Evolution: ${result.links.evolution_task}\nMirror: ${critique.channel}\nArena: ${arena.decision}\nPromotion: ${promotion?.status||'none'}\nAudit: ${result.audit.valid?'VALID':'INVALID'}\nProduction release: BLOCKED`);
 if(!result.audit.valid||!promotion||result.gates.production_release)process.exitCode=1;
}finally{engine.close();fs.rmSync(root,{recursive:true,force:true});}
