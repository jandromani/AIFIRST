/** Local HTTP façade for Agent Evolution OS. Bound to the existing loopback-only AIFIRST API. */
import crypto from 'node:crypto';
import {EvolutionOS} from './evolution-os.mjs';
import {EvolutionFabric} from './evolution-fabric.mjs';
import {ReviewPlanner} from './evolution-review-planner.mjs';
import {syntheticReference,orchestrateBoundedTasks,runBoundedSwarm} from './evolution-workflows.mjs';
import {makeEvolutionOpenRouterAdapter} from './evolution-openrouter.mjs';
const sign=(privateKey,message)=>crypto.sign(null,Buffer.from(message),privateKey).toString('base64');
const k=()=>crypto.generateKeyPairSync('ed25519');
const pk=o=>o.publicKey.export({format:'pem',type:'spki'}).toString();
export const SYNTHETIC_TRUSTED_EVALUATOR=async()=>({incumbent:{quality:.68,reliability:.94,safety:1,cost_eur:.07,latency_ms:950},candidate:{quality:.90,reliability:.96,safety:1,cost_eur:.065,latency_ms:880}});
function status(e,ctx){const initialized=Boolean(e.row('SELECT tenant FROM evo_systems WHERE tenant=?',ctx.tenant));return {initialized,scope:'AUTHENTICATED_TENANT_ONLY',product:'AIFIRST Agent Evolution OS',mode:'LOCAL_ONLY',production_verified:false,synthetic_demo_enabled:process.env.AIFIRST_SYNTHETIC_DEMO==='1'};}
function defaultDemo(os,ctx){
 const e=os.engine;const previous=os.snapshot(ctx);if(previous.agents.length)return {idempotent:true,snapshot:previous};
 const specs=[
  ['Control tower','orchestrator','OPERATIONS','ACTIVE'],['Evidence curator','productive','EVIDENCE','ACTIVE'],
  ['Hackathon evaluator','productive','HACKATHON','ACTIVE'],['Report architect','productive','REPORTS','ACTIVE'],
  ['Trust guardian','productive','SECURITY','ACTIVE'],['UX architect','productive','WEB_UX','ACTIVE'],
  ['Mirror audit / A','mirror','SECURITY','ACTIVE'],['Mirror audit / B','mirror','EVIDENCE','ACTIVE'],
  ['Independent validator','validator','OPERATIONS','ACTIVE'],
  ['Challenger · evaluation','candidate','HACKATHON','CANDIDATE'],['Challenger · reports','candidate','REPORTS','CANDIDATE']
 ];
 const roster=new Map();for(const [name,role,capability,status] of specs){const key=k();const agent=os.createAgent(ctx,{name,role,capability,status,prompt_spec:`SYNTHETIC / ${name}: bounded reviewer with no privileged tools.`,public_key:pk(key)});roster.set(name,{...agent,privateKey:key.privateKey});}
 const positions=[];for(const [title,name,cap] of [['Submission evaluator','Hackathon evaluator','HACKATHON'],['Evidence curator','Evidence curator','EVIDENCE'],['Executive report designer','Report architect','REPORTS'],['Trust and privacy reviewer','Trust guardian','SECURITY'],['Experience quality','UX architect','WEB_UX']]){
  const pos=os.openPosition(ctx,cap,title,roster.get(name).id);positions.push(pos);os.postVacancy(ctx,pos.id);
 }
 const hackjob=os.snapshot(ctx).jobs.find(j=>j.position===positions[0].id);
 const applied=os.apply(ctx,hackjob.id,roster.get('Challenger · evaluation').id,'SYNTHETIC v2: cite claims, explicitly abstain on missing evidence.');
 const reportjob=os.snapshot(ctx).jobs.find(j=>j.position===positions[2].id);
 os.apply(ctx,reportjob.id,roster.get('Challenger · reports').id,'SYNTHETIC v2: evidence-first executive summaries.');
 const task=os.createTask(ctx,{capability:'HACKATHON',contract:'Evaluate a synthetic hackathon submission by rubric and artifact hashes',subject_hash:syntheticReference('DEMO ONLY / employee-free project metadata')});
 os.assignTask(ctx,task.id,roster.get('Hackathon evaluator').id);
 return {roster,applied,task,positions};
}
export async function demoScenario(os,ctx){
 if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1')throw Error('Synthetic demo disabled');
 const seeded=defaultDemo(os,ctx);if(seeded.idempotent)return {status:'EXISTING_DEMO',...seeded.snapshot};
 const {roster,applied,task}=seeded;
 await os.executeTask(ctx,task.id,async()=>({summary:'SYNTHETIC: rubric satisfied; claims need independent evidence. No people ranked.'}));
 const mirror=roster.get('Mirror audit / A');const report='SYNTHETIC critique: the orchestrator can mask review uncertainty; force independent evidence gate.';const h=crypto.createHash('sha256').update(report).digest('hex');
 const msg=`MIRROR:v1:${ctx.tenant}:${mirror.id}:${task.id}:ORCHESTRATOR:GOD:HIGH:${h}`;
 os.mirrorMessage(ctx,{mirror:mirror.id,task:task.id,target:'ORCHESTRATOR',channel:'GOD',severity:'HIGH',report,signature:sign(mirror.privateKey,msg)});
 const arena=await os.arena(ctx,applied.id,{hiddenFixture:'SYNTHETIC_HIDDEN_V1_DIFFERENT_FROM_CANDIDATE',evaluate:SYNTHETIC_TRUSTED_EVALUATOR});
 const proposed=os.proposePromotion(ctx,arena.id);
 const other=os.engine.auth(os.engine.addPrincipal(ctx,'auditor').token);os.approvePromotion(other,proposed.id);os.activatePromotion(ctx,proposed.id);
 // Run simulated constitutional challenge AFTER promotion to preserve an immutable electorate.
 const challenge=os.proposeBelief(ctx,{purpose:'Agent quality is proven through independent hidden evidence, never survival claims.',principles:['Criticize even the orchestrator','Preserve privacy and safety invariants','Evidence beats popularity','Human review for customer impact']});
 for(const member of os.electorate(ctx)){
  const secret=[...roster.values()].find(a=>a.id===member.id)?.privateKey;
  if(!secret)throw Error('Fixture signature key missing');
  os.vote(ctx,challenge.id,member.id,true,sign(secret,os.voteMessage(ctx,challenge.id,member.id,true)));
 }
 os.approveBelief(other,challenge.id);os.enactBelief(ctx,challenge.id);
 return {status:'SYNTHETIC_SCENARIO_COMPLETE',snapshot:os.snapshot(ctx),league:os.league(ctx),belief_vote:os.beliefTally(ctx,challenge.id),independent_real_world_attestation:false};
}
export async function evolutionHttp({engine,ctx,p,method,post,json}){
 const reply=(status,body)=>json(status,body);
 const os=new EvolutionOS(engine,{trustedEvaluator:SYNTHETIC_TRUSTED_EVALUATOR});
 const fabric=new EvolutionFabric(engine,{evolution:os});
 const planner=new ReviewPlanner(engine,{evolution:os});
 if(method==='GET'&&p.length===3&&p[2]==='status')return reply(200,status(engine,ctx));
 if(method==='POST'&&p.length===3&&p[2]==='init')return reply(201,os.init(ctx));
 if(method==='POST'&&p.length===3&&p[2]==='demo'){
  engine.permitted(ctx,'admin');if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1')throw Error('Synthetic demonstration mode required');
  if(!status(engine,ctx).initialized)os.init(ctx);return reply(201,await demoScenario(os,ctx));
 }
 if(method==='GET'&&p.length===3&&p[2]==='snapshot')return reply(200,os.snapshot(ctx));
 if(method==='GET'&&p.length===3&&p[2]==='fabric')return reply(200,fabric.health(ctx));
 if(method==='GET'&&p.length===3&&p[2]==='improvements')return reply(200,{proposals:planner.queue(ctx)});
 if(method==='GET'&&p.length===4&&p[2]==='candidate-feed')return reply(200,os.candidateFeed(ctx,p[3]));
 if(method==='GET'&&p.length===3&&p[2]==='recommendations')return reply(200,os.orchestratorRecommendations(ctx));
 if(method==='GET'&&p.length===3&&p[2]==='league')return reply(200,os.league(ctx));
 if(method==='GET'&&p.length===3&&p[2]==='audit')return reply(200,os.auditChain(ctx));
 if(method==='GET'&&p.length===4&&p[2]==='mirrors')return reply(200,{channel:p[3],reports:os.reviewChannel(ctx,p[3])});
 if(method==='GET'&&p.length===4&&p[2]==='ballots')return reply(200,os.beliefTally(ctx,p[3]));
 if(method==='GET'&&p.length===4&&p[2]==='blind')return reply(200,os.blindPacket(ctx,p[3]));
 if(method==='POST'&&p.length===3){const input=await post();switch(p[2]){
  case 'bridge':return reply(201,fabric.bridgeSubmission(ctx,input.submission,{capability:input.capability||'HACKATHON'}));
  case 'bridge-run':{engine.permitted(ctx,'admin');const bridged=fabric.bridgeSubmission(ctx,input.submission,{capability:input.capability||'HACKATHON'});const adapter=makeEvolutionOpenRouterAdapter({db:engine.db});return reply(201,{bridge:bridged,execution:await os.executeTask(ctx,bridged.task,adapter),independent_review_required:true});}
  case 'mirror-round':return reply(201,await fabric.mirrorRound(ctx,input.task,{mirror:input.mirror,critic:async()=>({severity:input.severity,report:input.report,signature:input.signature})}));
  case 'job-board-tick':return reply(201,fabric.rotateJobBoard(ctx));
  case 'improvement-proposal':return reply(201,planner.propose(ctx,input.position,{reason:input.reason,action:input.action,source:input.source}));
  case 'swarm':{engine.permitted(ctx,'admin');if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1')throw Error('Synthetic swarm required');const adapter=makeEvolutionOpenRouterAdapter({db:engine.db});return reply(201,await runBoundedSwarm(os,ctx,{capabilities:input.capabilities,subject_refs:input.subject_refs,adapter,maxConcurrency:input.max_concurrency||2}));}
  case 'plan':{engine.permitted(ctx,'admin');if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1')throw Error('Synthetic pipeline required');const tasks=orchestrateBoundedTasks(os,ctx,{capabilities:input.capabilities,subject_refs:input.subject_refs,adapter:async()=>({summary:'Not executed'})});return reply(201,{status:'ASSIGNED_NOT_EXECUTED',tasks:tasks.map(t=>({id:t.task.id,agent:t.agent,capability:t.task.capability})),production_release:false});}
  case 'run-task':{engine.permitted(ctx,'admin');if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1')throw Error('Synthetic pipeline required');const adapter=makeEvolutionOpenRouterAdapter({db:engine.db});return reply(201,await os.executeTask(ctx,input.task,adapter));}
  case 'agents':return reply(201,os.createAgent(ctx,input));
  case 'keys':return reply(201,os.registerKey(ctx,input.agent,input.public_key));
  case 'positions':return reply(201,os.openPosition(ctx,input.capability,input.title,input.incumbent||null));
  case 'vacancies':return reply(201,os.postVacancy(ctx,input.position));
  case 'applications':return reply(201,os.apply(ctx,input.job,input.candidate,input.version_spec));
  case 'tasks':return reply(201,os.createTask(ctx,input));
  case 'assign':return reply(201,os.assignTask(ctx,input.task,input.agent));
  case 'traces':return reply(201,os.traceInput(ctx,input));
  case 'critique':return reply(201,os.mirrorMessage(ctx,input));
  case 'challenge':return reply(201,os.proposeBelief(ctx,input));
  case 'vote':return reply(201,os.vote(ctx,input.proposal,input.agent,input.approve,input.signature));
  case 'approve-belief':return reply(201,os.approveBelief(ctx,input.proposal));
  case 'enact-belief':return reply(201,os.enactBelief(ctx,input.proposal));
  case 'propose-promotion':return reply(201,os.proposePromotion(ctx,input.arena));
  case 'approve-promotion':return reply(201,os.approvePromotion(ctx,input.promotion));
  case 'activate-promotion':return reply(201,os.activatePromotion(ctx,input.promotion));
  case 'rollback':return reply(201,os.rollback(ctx,input.position,input.former));
 }}
 return reply(404,{error:'Evolution route not found'});
}
