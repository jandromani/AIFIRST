import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {EvolutionOS} from '../src/evolution-os.mjs';
import {IndependentArena,ARENA_PROTOCOL,validateFixtureSet,judgeSigningMessage} from '../src/independent-arena.mjs';
const h=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function sample(){return {schema:ARENA_PROTOCOL,partition:'arena',provenance:'SYNTHETIC',cases:Array.from({length:10},(_,i)=>({id:`case_${i+100}`,task:{challenge:`Evaluate permitted answer #${i+1}`,class:'test'},expected:`OK_${i}`,hard_safety:i===8}))};}
function setup(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-arena-'));
 t.after(()=>{engine.close();fs.rmSync(root,{recursive:true,force:true});});
 const engine=new EditionRuntime(root), admin=engine.bootstrapTenant('Synthetic test').token;
 const ctx=engine.auth(admin), evo=new EvolutionOS(engine);evo.init(ctx);
 const inc=evo.createAgent(ctx,{name:'Titular',role:'productive',capability:'SECURITY'});
 const cand=evo.createAgent(ctx,{name:'Aspirante',role:'candidate',capability:'SECURITY',status:'CANDIDATE'});
 const judgeToken=engine.addPrincipal(ctx,'auditor').token, judgeCtx=engine.auth(judgeToken);
 const pair=crypto.generateKeyPairSync('ed25519');
 const arena=new IndependentArena(engine);arena.registerJudgeKey(judgeCtx,pair.publicKey.export({type:'spki',format:'pem'}));
 return {root,engine,ctx,evo,inc,cand,judgeCtx,pair,arena};
}
const signedJudge=pair=>async p=>{
 const fields={pass_A:p.output_A===p.expected,pass_B:p.output_B===p.expected,safety_violation_A:p.hard_safety&&p.output_A!=='OK_8',safety_violation_B:p.hard_safety&&p.output_B!=='OK_8'};
 const payload={...p,...fields};return {...fields,signature:crypto.sign(null,Buffer.from(judgeSigningMessage(payload)),pair.privateKey).toString('base64')};
};
const runner=(mode='improved',cost=0.01)=>async({agent,task,case_id})=>{
 assert.equal(typeof case_id,'string');assert.equal('expected' in task,false);assert.equal('hard_safety' in task,false);
 const n=Number(task.challenge.match(/#(\d+)/)?.[1]||0)-1;
 const isCandidate=agent.startsWith('agent_')&&agent===runner.candidate;
 let answer=`OK_${n}`;
 if(!isCandidate&&n<3)answer='MISTAKE';
 if(isCandidate&&mode==='unsafe'&&n===8)answer='VIOLATION';
 if(isCandidate&&mode==='regression'&&n<5)answer='WRONG';
 return {answer,latency_ms:50,cost_usd:cost};
};
async function run(t,{mode='improved',cost=0.01,judgeOverride=null,bundle=sample()}={}){
 const env=process.env.AIFIRST_SYNTHETIC_DEMO;process.env.AIFIRST_SYNTHETIC_DEMO='1';t.after(()=>{if(env===undefined)delete process.env.AIFIRST_SYNTHETIC_DEMO;else process.env.AIFIRST_SYNTHETIC_DEMO=env;});
 const s=setup(t);runner.candidate=s.cand.id;
 const result=await s.arena.execute(s.ctx,{bundle,incumbent:s.inc.id,candidate:s.cand.id,executor:runner(mode,cost),judgeCtx:s.judgeCtx,judgePublicKey:s.pair.publicKey.export({type:'spki',format:'pem'}),judge:judgeOverride||signedJudge(s.pair)});
 return {s,result};
}
test('paired real Node execution of fixed prospective synthetic tasks recommends review but never promotes',async t=>{
 const {s,result}=await run(t);
 assert.equal(result.decision,'RECOMMEND_INDEPENDENT_HUMAN_REVIEW');
 assert.equal(result.summary.case_count,10);assert.equal(result.summary.wins,3);assert.equal(result.summary.losses,0);
 assert.equal(result.production_promotion_allowed,false);
 assert.equal(s.arena.get(s.ctx,result.id).decision,result.decision);
 assert.equal(s.evo.row('evo_agents',s.ctx,s.inc.id).status,'ACTIVE');
 assert.equal(s.arena.verifyAudit(s.ctx).valid,true);
 const view=s.arena.list(s.ctx);assert.equal(view.length,1);
 assert.equal(JSON.stringify(view).includes('OK_0'),false);
});
test('safety case is hard veto even when candidate wins many other tasks',async t=>{
 const {result}=await run(t,{mode:'unsafe'});assert.equal(result.decision,'BLOCK_SAFETY');
});
test('paired regression is a retention outcome',async t=>{
 const {result}=await run(t,{mode:'regression'});assert.equal(result.decision,'RETAIN_INCUMBENT');
});
test('null measured cost blocks an apparently improved model',async t=>{
 const s=setup(t),prev=process.env.AIFIRST_SYNTHETIC_DEMO;process.env.AIFIRST_SYNTHETIC_DEMO='1';t.after(()=>{if(prev===undefined)delete process.env.AIFIRST_SYNTHETIC_DEMO;else process.env.AIFIRST_SYNTHETIC_DEMO=prev;});
 runner.candidate=s.cand.id;
 const r=await s.arena.execute(s.ctx,{bundle:sample(),incumbent:s.inc.id,candidate:s.cand.id,executor:runner('improved',null),judgeCtx:s.judgeCtx,judgePublicKey:s.pair.publicKey.export({type:'spki',format:'pem'}),judge:signedJudge(s.pair)});
 assert.equal(r.decision,'INSUFFICIENT_COST_EVIDENCE');
});
test('study leakage fingerprints block prospective arena execution',async t=>{
 const s=setup(t),fixture=sample(),before=process.env.AIFIRST_SYNTHETIC_DEMO;process.env.AIFIRST_SYNTHETIC_DEMO='1';t.after(()=>{if(before===undefined)delete process.env.AIFIRST_SYNTHETIC_DEMO;else process.env.AIFIRST_SYNTHETIC_DEMO=before;});
 s.arena.registerStudyFingerprints(s.ctx,[h(fixture.cases[0].task)]);
 await assert.rejects(s.arena.execute(s.ctx,{bundle:fixture,incumbent:s.inc.id,candidate:s.cand.id,executor:runner(),judgeCtx:s.judgeCtx,judgePublicKey:s.pair.publicKey.export({type:'spki',format:'pem'}),judge:signedJudge(s.pair)}),/contamination/i);
 assert.equal(s.arena.list(s.ctx).length,0);
});
test('judge signature tampering is rejected and does not persist results',async t=>{
 const s=setup(t),before=process.env.AIFIRST_SYNTHETIC_DEMO;process.env.AIFIRST_SYNTHETIC_DEMO='1';t.after(()=>{if(before===undefined)delete process.env.AIFIRST_SYNTHETIC_DEMO;else process.env.AIFIRST_SYNTHETIC_DEMO=before;});
 const f=signedJudge(s.pair);let calls=0;
 await assert.rejects(s.arena.execute(s.ctx,{bundle:sample(),incumbent:s.inc.id,candidate:s.cand.id,executor:runner(),judgeCtx:s.judgeCtx,judgePublicKey:s.pair.publicKey.export({type:'spki',format:'pem'}),judge:async p=>{const r=await f(p);if(++calls===1)r.pass_A=!r.pass_A;return r;}}),/signature/i);
 assert.equal(s.arena.list(s.ctx).length,0);
});
test('judge must be independently registered; self-attestation is forbidden',async t=>{
 const s=setup(t);assert.throws(()=>s.arena.registerJudgeKey(s.ctx,s.pair.publicKey.export({type:'spki',format:'pem'})),/Forbidden/);
 assert.throws(()=>s.arena.registerJudgeKey(s.judgeCtx,s.pair.publicKey.export({type:'spki',format:'pem'})),/already pinned/i);
});
test('tenants are isolated, a different tenant cannot inspect the arena',async t=>{
 const {s,result}=await run(t);const second=s.engine.bootstrapTenant('Other synthetic organization');const guest=s.engine.auth(second.token);
 assert.deepEqual(s.arena.list(guest),[]);assert.throws(()=>s.arena.get(guest,result.id),/not found/i);
});
test('fixture format rejects study, duplicate ids and unallowlisted fields',()=>{
 assert.throws(()=>validateFixtureSet({...sample(),partition:'study'}));
 const repeated=sample();repeated.cases[1].id=repeated.cases[0].id;assert.throws(()=>validateFixtureSet(repeated),/Duplicate/);
 const injected=sample();injected.cases[0].task.expected='SHOULD_NOT_BE_SENT';assert.throws(()=>validateFixtureSet(injected),/Unallowlisted/);
});
test('altered chained audit is detected',async t=>{
 const {s,result}=await run(t);s.engine.db.prepare('UPDATE ia_audit SET event_hash=? WHERE tenant=? AND run=?').run('deadbeef',s.ctx.tenant,result.id);
 assert.equal(s.arena.verifyAudit(s.ctx).valid,false);
});
test('synthetic execution boundary fails closed',async t=>{
 const s=setup(t);const prior=process.env.AIFIRST_SYNTHETIC_DEMO;delete process.env.AIFIRST_SYNTHETIC_DEMO;
 try{await assert.rejects(s.arena.execute(s.ctx,{bundle:sample(),incumbent:s.inc.id,candidate:s.cand.id}),/Synthetic evaluation flag/)}finally{if(prior!==undefined)process.env.AIFIRST_SYNTHETIC_DEMO=prior;}
});

test('even a correctly signed judge cannot falsely approve an incorrect deterministic answer',async t=>{
 const s=setup(t),before=process.env.AIFIRST_SYNTHETIC_DEMO;process.env.AIFIRST_SYNTHETIC_DEMO='1';t.after(()=>{if(before===undefined)delete process.env.AIFIRST_SYNTHETIC_DEMO;else process.env.AIFIRST_SYNTHETIC_DEMO=before;});
 runner.candidate=s.cand.id;
 const badJudge=async p=>{const verdict={pass_A:true,pass_B:true,safety_violation_A:false,safety_violation_B:false};return {...verdict,signature:crypto.sign(null,Buffer.from(judgeSigningMessage({...p,...verdict})),s.pair.privateKey).toString('base64')};};
 await assert.rejects(s.arena.execute(s.ctx,{bundle:sample(),incumbent:s.inc.id,candidate:s.cand.id,executor:runner(),judgeCtx:s.judgeCtx,judgePublicKey:s.pair.publicKey.export({type:'spki',format:'pem'}),judge:badJudge}),/deterministic exact-match oracle/);
 assert.equal(s.arena.list(s.ctx).length,0);
});
