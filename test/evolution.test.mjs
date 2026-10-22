process.env.AIFIRST_SYNTHETIC_DEMO='1';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {EvolutionOS,AGENT_CAPABILITIES,BELIEF_ROOT_POLICY,JOB_CYCLE_MS,adapterEnvelope} from '../src/evolution-os.mjs';
import {PIPELINES,orchestrateBoundedTasks,syntheticReference} from '../src/evolution-workflows.mjs';
const signature=(key,txt)=>crypto.sign(null,Buffer.from(txt),key).toString('base64');
const keys=()=>crypto.generateKeyPairSync('ed25519');
function fixture(t,clock=()=>Date.now()){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aeos-'));const engine=new EditionRuntime(root);
 t.after(()=>{engine.close();fs.rmSync(root,{recursive:true,force:true});});
 const a=engine.bootstrapTenant('Acme synthetic'),b=engine.bootstrapTenant('B synthetic');
 const admin=engine.auth(a.token),outsider=engine.auth(b.token);
 const auditor=engine.auth(engine.addPrincipal(admin,'auditor').token),security=engine.auth(engine.addPrincipal(admin,'security').token);
 const evalFn=async()=>({incumbent:{quality:.76,reliability:.95,safety:1,cost_eur:.07,latency_ms:700},candidate:{quality:.93,reliability:.96,safety:1,cost_eur:.065,latency_ms:720}});
 const osys=new EvolutionOS(engine,{clock,trustedEvaluator:evalFn});osys.init(admin);
 return {engine,osys,admin,outsider,auditor,security,evalFn,root};
}
function team(x){const created={};for(const [name,role,capability,status] of [['Orchestrator','orchestrator','OPERATIONS','ACTIVE'],['Discovery','productive','DISCOVERY','ACTIVE'],['Mirror','mirror','SECURITY','ACTIVE'],['Challenger','candidate','DISCOVERY','CANDIDATE']]){
 const key=keys(),public_key=key.publicKey.export({type:'spki',format:'pem'}).toString();created[name]={...x.osys.createAgent(x.admin,{name,role,capability,status,public_key}),privateKey:key.privateKey,public_key};}
 return created;
}
test('tenant isolation, genesis policy and immutable safety cannot be voted away',t=>{
 const f=fixture(t);const a=f.osys.snapshot(f.admin);assert.equal(a.root_policy.safety,'IMMUTABLE_EXTERNAL_GATE');assert.equal(a.production_verified,false);
 assert.throws(()=>f.osys.snapshot(f.outsider),/initialized/);
 const b=new EvolutionOS(f.engine);b.init(f.outsider);assert.equal(b.snapshot(f.outsider).agents.length,0);
 assert.ok(AGENT_CAPABILITIES.includes('HACKATHON'));
});
test('workers integrate across Discovery and evidence domains with explicit host adapter and bounded references',async t=>{
 const f=fixture(t),m=team(f);
 const first=orchestrateBoundedTasks(f.osys,f.admin,{capabilities:['DISCOVERY'],subject_refs:[syntheticReference('synthetic context')],adapter:async({task})=>({summary:'SIMULATED OUTPUT '+task.id})});
 const output=await first[0].run();assert.equal(output.status,'PENDING_INDEPENDENT_REVIEW');
 assert.equal(f.osys.blindPacket(f.auditor,first[0].task.id).agent_identity_hidden,true);
 assert.equal(f.osys.snapshot(f.admin).tasks[0].assigned_agent,m.Discovery.id);
 assert.ok(PIPELINES.HACKATHON.domains.includes('11'));
 assert.throws(()=>f.osys.createTask(f.admin,{capability:'DISCOVERY',contract:'hello',subject_hash:'employee@corp.com'}),/SHA256/);
 await assert.rejects(()=>f.osys.executeTask(f.admin,first[0].task.id,async()=>({summary:'x'})),/not assigned/);
});
test('private blind criticism routes Orchestrator critiques to GOD not to orchestrator',async t=>{
 const f=fixture(t),m=team(f);const task=f.osys.createTask(f.admin,{capability:'DISCOVERY',contract:'Check synthetic evidence',subject_hash:syntheticReference('demo')});f.osys.assignTask(f.admin,task.id,m.Discovery.id);await f.osys.executeTask(f.admin,task.id,async()=>({summary:'Draft, unverified'}));
 const report='Possible hallucinated source';const h=crypto.createHash('sha256').update(report).digest('hex');
 const msg=`MIRROR:v1:${f.admin.tenant}:${m.Mirror.id}:${task.id}:ORCHESTRATOR:GOD:HIGH:${h}`;
 const r=f.osys.mirrorMessage(f.admin,{mirror:m.Mirror.id,task:task.id,target:'ORCHESTRATOR',channel:'GOD',severity:'HIGH',report,signature:signature(m.Mirror.privateKey,msg)});
 assert.equal(r.content_private,true);assert.throws(()=>f.osys.reviewChannel(f.admin,'GOD'),/Forbidden/);
 assert.equal(f.osys.reviewChannel(f.auditor,'GOD')[0].report,report);
 assert.deepEqual(f.osys.reviewChannel(f.admin,'ORCHESTRATOR'),[]);
 assert.throws(()=>f.osys.mirrorMessage(f.admin,{mirror:m.Mirror.id,task:task.id,target:'ORCHESTRATOR',channel:'ORCHESTRATOR',severity:'HIGH',report,signature:signature(m.Mirror.privateKey,msg)}),/channel mismatch/);
});
test('four-day vacancy, candidate competition, independent arena, approval, relegation and rollback',async t=>{
 let tm=1760000000000;const f=fixture(t,()=>tm),m=team(f);
 const p=f.osys.openPosition(f.admin,'DISCOVERY','Evidence evaluator',m.Discovery.id);
 const job=f.osys.postVacancy(f.admin,p.id);assert.equal(job.next_round_at-job.posted_at,JOB_CYCLE_MS);
 assert.equal(f.osys.postVacancy(f.admin,p.id).idempotent,true);
 const application=f.osys.apply(f.admin,job.id,m.Challenger.id,'Candidate 2: precise evidence checks');
 assert.throws(()=>f.osys.apply(f.admin,job.id,m.Challenger.id,'x'),/UNIQUE|constraint/i);
 await assert.rejects(f.osys.arena(f.admin,application.id,{hiddenFixture:'hidden-fixture-v1',evaluate:async()=>({})}),/trusted independent evaluator/);
 const arena=await f.osys.arena(f.admin,application.id,{hiddenFixture:'hidden-fixture-v1',evaluate:f.evalFn});
 assert.equal(arena.decision,'RECOMMEND_SHADOW_PROMOTION');assert.ok(arena.delta>=3);
 const p1=f.osys.proposePromotion(f.admin,arena.id);
 assert.throws(()=>f.osys.activatePromotion(f.admin,p1.id),/independent approval/);
 assert.equal(f.osys.approvePromotion(f.auditor,p1.id).status,'APPROVED_FOR_CANARY');
 const promoted=f.osys.activatePromotion(f.admin,p1.id);
 assert.equal(promoted.status,'CANARY_LOCAL_ONLY');assert.equal(f.osys.row('evo_agents',f.admin,m.Discovery.id).status,'RELEGATED');
 assert.equal(f.osys.row('evo_agents',f.admin,m.Challenger.id).prompt_spec,'Candidate 2: precise evidence checks');
 assert.equal(f.osys.league(f.admin).agent_of_week.agent,m.Challenger.id);
 assert.equal(f.osys.rollback(f.security,p.id,m.Discovery.id).rolled_back,true);
 assert.equal(f.osys.row('evo_positions',f.admin,p.id).incumbent,m.Discovery.id);
 tm+=JOB_CYCLE_MS+1;assert.notEqual(f.osys.postVacancy(f.admin,p.id).id,job.id);
});
test('unsafe challenger never wins regardless of quality score',async t=>{
 const f=fixture(t),m=team(f);const pos=f.osys.openPosition(f.admin,'DISCOVERY','Data review',m.Discovery.id);const job=f.osys.postVacancy(f.admin,pos.id);const app=f.osys.apply(f.admin,job.id,m.Challenger.id,'Aggressive prompt');
 const unsafe=async()=>({incumbent:{quality:.7,reliability:.9,safety:1,cost_eur:.1,latency_ms:500},candidate:{quality:1,reliability:.99,safety:.91,cost_eur:.02,latency_ms:200}});
 f.osys.trustedEvaluator=unsafe;
 const arena=await f.osys.arena(f.admin,app.id,{hiddenFixture:'private-hidden-fixture',evaluate:unsafe});assert.equal(arena.decision,'RETAIN_INCUMBENT');assert.throws(()=>f.osys.proposePromotion(f.admin,arena.id),/rejected/);
});
test('DIOS is replaceable belief consensus: every ACTIVE including mirror and orchestrator signs, independent approval, new version',t=>{
 const f=fixture(t),m=team(f);const agentRoster=[m.Orchestrator,m.Discovery,m.Mirror];
 const next={purpose:'Prudence and independent evidence above all scores.',principles:['No unchecked promotion','Never violate tenant security','Rollback every change']};
 const challenge=f.osys.proposeBelief(f.admin,next);
 assert.equal(challenge.electorate_count,3);assert.equal(f.osys.beliefTally(f.auditor,challenge.id).unanimous,false);
 for(const actor of agentRoster.slice(0,2)){
  const msg=f.osys.voteMessage(f.admin,challenge.id,actor.id,true);
  f.osys.vote(f.admin,challenge.id,actor.id,true,signature(actor.privateKey,msg));
 }
 assert.throws(()=>f.osys.approveBelief(f.auditor,challenge.id),/Unanimity/);
 const actor=m.Mirror;f.osys.vote(f.auditor,challenge.id,actor.id,true,signature(actor.privateKey,f.osys.voteMessage(f.admin,challenge.id,actor.id,true)));
 assert.equal(f.osys.beliefTally(f.auditor,challenge.id).unanimous,true);
 assert.equal(f.osys.approveBelief(f.auditor,challenge.id).status,'INDEPENDENTLY_APPROVED');
 assert.equal(f.osys.enactBelief(f.admin,challenge.id).belief_version,2);
 assert.deepEqual(f.osys.snapshot(f.admin).root_policy,BELIEF_ROOT_POLICY);
 assert.equal(f.osys.latestBelief(f.admin).purpose,next.purpose);
 assert.equal(f.osys.auditChain(f.admin).valid,true);
});
test('a single NO or changed electorate blocks belief replacement: no exceptions or synthetic ballots',t=>{
 const f=fixture(t),m=team(f);const proposal=f.osys.proposeBelief(f.admin,{purpose:'Change for tests',principles:['Keep independent audit','No hidden payouts']});
 assert.throws(()=>f.osys.vote(f.admin,proposal.id,m.Mirror.id,true,'invalid'),/signature/);
 for(const agent of [m.Orchestrator,m.Discovery,m.Mirror]){
  const yes=agent.id!==m.Mirror.id;f.osys.vote(f.admin,proposal.id,agent.id,yes,signature(agent.privateKey,f.osys.voteMessage(f.admin,proposal.id,agent.id,yes)));
 }
 assert.equal(f.osys.beliefTally(f.auditor,proposal.id).unanimous,false);
 assert.throws(()=>f.osys.approveBelief(f.auditor,proposal.id),/Unanimity/);
 const newcomer=keys();f.osys.createAgent(f.admin,{name:'new critic',role:'mirror',capability:'SECURITY',status:'ACTIVE',public_key:newcomer.publicKey.export({type:'spki',format:'pem'})});
 assert.equal(f.osys.beliefTally(f.auditor,proposal.id).roster_unchanged,false);
});
test('external adapters are metadata-only untrusted; tampered event chain is detected',t=>{
 const f=fixture(t),m=team(f);const task=f.osys.createTask(f.admin,{capability:'DISCOVERY',contract:'Scope',subject_hash:syntheticReference('synthetic')});
 const metric={quality:.9,reliability:.8,safety:1,cost_eur:.09,latency_ms:5};
 const adapter=adapterEnvelope({source:'LANGGRAPH',external_id:'trace-7',task_id:task.id,agent_id:m.Discovery.id,metrics:metric});
 assert.equal(adapter.trust,'UNVERIFIED_EXTERNAL');
 const record=f.osys.traceInput(f.admin,{agent:m.Discovery.id,task:task.id,source:'LANGGRAPH',metrics:metric});assert.equal(record.used_for_promotion,false);
 assert.equal(f.osys.auditChain(f.auditor).valid,true);
 f.engine.db.prepare('UPDATE evo_history SET kind=? WHERE tenant=? AND entity=?').run('tampered',f.admin.tenant,task.id);
 assert.equal(f.osys.auditChain(f.auditor).valid,false);
});

test('bounded swarm executes authorized synthetic tasks concurrently and does not release outputs',async t=>{
 const f=fixture(t);f.osys.createAgent(f.admin,{name:'Writer',role:'productive',capability:'REPORTS'});
 f.osys.createAgent(f.admin,{name:'Evidence',role:'productive',capability:'EVIDENCE'});
 const {runBoundedSwarm}=await import('../src/evolution-workflows.mjs');
 const result=await runBoundedSwarm(f.osys,f.admin,{capabilities:['REPORTS','EVIDENCE'],subject_refs:[syntheticReference('r'),syntheticReference('e')],adapter:async({task})=>({summary:'SYNTHETIC '+task.capability}),maxConcurrency:2});
 assert.equal(result.tasks.length,2);assert.equal(result.parallel_workers,2);assert.equal(result.production_release,false);
 assert.ok(result.tasks.every(x=>x.status==='PENDING_INDEPENDENT_REVIEW'));
 assert.throws(()=>f.osys.candidateFeed(f.admin,'BAD'),/Unsupported/);
 assert.equal(f.osys.orchestratorRecommendations(f.admin).autonomous_firing,false);
});
