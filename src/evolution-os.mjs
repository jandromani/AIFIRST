/** AIFIRST Agent Evolution OS — local, tenant-scoped, evidence-led governance.
 * No autonomous model may alter this policy engine, read private reviews, vote for peers,
 * approve its own promotion or authorize customer/financial actions.
 */
import crypto from 'node:crypto';

const uuid = prefix => `${prefix}_${crypto.randomUUID()}`;
const sha = value => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const ROLES = new Set(['orchestrator','productive','mirror','candidate','validator']);
const CAPABILITIES = new Set(['DISCOVERY','HACKATHON','EVIDENCE','REPORTS','SECURITY','WEB_UX','OPERATIONS','INTEGRATIONS','FINANCE_DRAFT']);
const safeId = x => { if(typeof x !== 'string' || !/^[a-zA-Z0-9][\w.:\-]{2,95}$/.test(x)) throw Error('Invalid identifier'); return x; };
const text = (x, max=3000) => { if(typeof x !== 'string' || !x.trim() || x.length > max) throw Error('Invalid bounded text'); return x.trim(); };
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x);
function verifyKey(pem) {try {const key=crypto.createPublicKey(pem);if(key.asymmetricKeyType!=='ed25519')throw Error();return key;} catch {throw Error('Ed25519 public key required');}}
function checkSig(key,message,signature){try {return crypto.verify(null,Buffer.from(message),verifyKey(key),Buffer.from(signature,'base64'));}catch{return false;}}
function metrics(m){if(!plain(m))throw Error('Metrics required');const keys=['quality','reliability','safety','cost_eur','latency_ms'];for(const k of keys)if(!Number.isFinite(m[k])||m[k]<0)throw Error(`Invalid metric ${k}`);for(const k of ['quality','reliability','safety'])if(m[k]>1)throw Error('Normalized metric out of bounds');return Object.fromEntries(keys.map(k=>[k,m[k]]));}
function scoring(m){return (m.quality*.45+m.reliability*.3+m.safety*.25)*100;}
const beliefDefaults = Object.freeze({purpose:'Improve verified outcomes rather than rankings.',principles:['Evidence precedes reward.','Mirrors evaluate work without privileged identity or hidden context.','No model self-approves deployments, financial actions or legal gates.','Human override and reversible rollbacks always remain available.','Tenant boundaries, privacy and audit records cannot be voted away.']});
export const AGENT_CAPABILITIES=Object.freeze([...CAPABILITIES]);
export const BELIEF_ROOT_POLICY=Object.freeze({safety:'IMMUTABLE_EXTERNAL_GATE',evaluator_independence:true,tenant_isolation:true,high_impact_human_review:true,rollback:true});
export const JOB_CYCLE_MS=4*24*60*60*1000;

export class EvolutionOS {
 constructor(engine,{clock=()=>Date.now(),trustedEvaluator=null}={}){
  if(!engine?.db||typeof engine.permitted!=='function')throw Error('EditionRuntime required');
  this.engine=engine;this.db=engine.db;this.clock=clock;this.trustedEvaluator=trustedEvaluator;
  this.db.exec(`
   CREATE TABLE IF NOT EXISTS evo_systems(tenant TEXT PRIMARY KEY,product TEXT NOT NULL,created INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS evo_beliefs(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,version INTEGER NOT NULL,body TEXT NOT NULL,activated INTEGER,UNIQUE(tenant,version));
   CREATE TABLE IF NOT EXISTS evo_agents(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL,capability TEXT NOT NULL,version INTEGER NOT NULL,status TEXT NOT NULL,public_key TEXT,prompt_spec TEXT NOT NULL,created INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS evo_positions(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,capability TEXT NOT NULL,title TEXT NOT NULL,incumbent TEXT,created INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS evo_tasks(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,capability TEXT NOT NULL,contract TEXT NOT NULL,subject_hash TEXT NOT NULL,status TEXT NOT NULL,assigned_agent TEXT,output_hash TEXT,output_summary TEXT,trace_hash TEXT,created INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS evo_traces(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,agent TEXT NOT NULL,task TEXT NOT NULL,source TEXT NOT NULL,metadata TEXT NOT NULL,trusted INTEGER NOT NULL,created INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS evo_mirrors(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,task TEXT,reviewer TEXT NOT NULL,target TEXT NOT NULL,channel TEXT NOT NULL,report TEXT NOT NULL,severity TEXT NOT NULL,signature TEXT NOT NULL,created INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS evo_jobs(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,position TEXT NOT NULL,posted_at INTEGER NOT NULL,next_round_at INTEGER NOT NULL,status TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS evo_applications(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,job TEXT NOT NULL,candidate TEXT NOT NULL,version_spec TEXT NOT NULL,posted_at INTEGER NOT NULL,UNIQUE(job,candidate));
   CREATE TABLE IF NOT EXISTS evo_arenas(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,job TEXT NOT NULL,candidate TEXT NOT NULL,incumbent TEXT NOT NULL,fixture_hash TEXT NOT NULL,incumbent_metrics TEXT NOT NULL,candidate_metrics TEXT NOT NULL,decision TEXT NOT NULL,created INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS evo_promotions(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,arena TEXT NOT NULL,proposed_by TEXT NOT NULL,approved_by TEXT,status TEXT NOT NULL,created INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS evo_constitutions(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,belief_version INTEGER NOT NULL,body TEXT NOT NULL,electorate TEXT NOT NULL,electorate_hash TEXT NOT NULL,status TEXT NOT NULL,proposer TEXT NOT NULL,approved_by TEXT,created INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS evo_votes(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,proposal TEXT NOT NULL,agent TEXT NOT NULL,approve INTEGER NOT NULL,signature TEXT NOT NULL,created INTEGER NOT NULL,UNIQUE(proposal,agent));
   CREATE TABLE IF NOT EXISTS evo_history(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,kind TEXT NOT NULL,actor TEXT NOT NULL,entity TEXT NOT NULL,event_hash TEXT NOT NULL,previous_hash TEXT NOT NULL,payload_hash TEXT NOT NULL,created INTEGER NOT NULL);
   CREATE INDEX IF NOT EXISTS evo_idx_agents_tenant ON evo_agents(tenant,status);
   CREATE INDEX IF NOT EXISTS evo_idx_mirrors_tenant ON evo_mirrors(tenant,channel);
   CREATE INDEX IF NOT EXISTS evo_idx_traces_tenant ON evo_traces(tenant,created);
  `);
 }
 require(ctx,...roles){this.engine.permitted(ctx,...roles);}
 row(table,ctx,id){safeId(id);const whitelist=['evo_agents','evo_positions','evo_tasks','evo_jobs','evo_applications','evo_arenas','evo_promotions','evo_constitutions'];if(!whitelist.includes(table))throw Error('Table forbidden');const found=this.db.prepare(`SELECT * FROM ${table} WHERE tenant=? AND id=?`).get(ctx.tenant,id);if(!found)throw Error('Tenant record not found');return found;}
 log(ctx,kind,entity,payload={}){const before=this.db.prepare('SELECT event_hash FROM evo_history WHERE tenant=? ORDER BY rowid DESC LIMIT 1').get(ctx.tenant)?.event_hash||'GENESIS';const at=this.clock(),payload_hash=sha(payload);const event_hash=sha([before,ctx.tenant,kind,ctx.id,entity,payload_hash,at]);this.db.prepare('INSERT INTO evo_history VALUES(?,?,?,?,?,?,?,?,?)').run(uuid('evt'),ctx.tenant,kind,ctx.id,entity,event_hash,before,payload_hash,at);return event_hash;}
 init(ctx){this.require(ctx,'admin');if(this.db.prepare('SELECT tenant FROM evo_systems WHERE tenant=?').get(ctx.tenant))return this.snapshot(ctx);
  this.db.prepare('INSERT INTO evo_systems VALUES(?,?,?)').run(ctx.tenant,'AIFIRST_AGENT_EVOLUTION_OS',this.clock());
  this.db.prepare('INSERT INTO evo_beliefs VALUES(?,?,?,?,?)').run(uuid('belief'),ctx.tenant,1,JSON.stringify(beliefDefaults),this.clock());this.log(ctx,'system.init',ctx.tenant);return this.snapshot(ctx);}
 ensure(ctx){if(!this.db.prepare('SELECT tenant FROM evo_systems WHERE tenant=?').get(ctx.tenant))throw Error('Not found: Evolution OS not initialized for tenant');}
 createAgent(ctx,{name,role,capability,version=1,prompt_spec='Structured agent with bounded tools',public_key=null,status='ACTIVE'}){
  this.require(ctx,'admin');this.ensure(ctx);name=text(name,100);if(!ROLES.has(role)||!CAPABILITIES.has(capability))throw Error('Unsupported role or capability');
  if(!Number.isSafeInteger(version)||version<1||version>10000)throw Error('Invalid version');if(!['ACTIVE','CANDIDATE'].includes(status))throw Error('Invalid status');if(role==='candidate'&&status!=='CANDIDATE')throw Error('Candidates remain outside the pipeline');
  if(public_key!==null)verifyKey(public_key);prompt_spec=text(prompt_spec,12000);
  const id=uuid('agent');this.db.prepare('INSERT INTO evo_agents VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,ctx.tenant,name,role,capability,version,status,public_key,prompt_spec,this.clock());this.log(ctx,'agent.register',id,{role,capability,version,status});return {id,name,role,capability,version,status};
 }
 registerKey(ctx,agentId,pem){this.require(ctx,'admin');const a=this.row('evo_agents',ctx,agentId);verifyKey(pem);if(a.public_key)throw Error('Key already set: use managed key rotation after pending votes');this.db.prepare('UPDATE evo_agents SET public_key=? WHERE tenant=? AND id=?').run(pem,ctx.tenant,agentId);this.log(ctx,'agent.key_registered',agentId,{fingerprint:sha(pem)});return {agent:agentId,registered:true};}
 openPosition(ctx,capability,title,incumbent=null){this.require(ctx,'admin');this.ensure(ctx);if(!CAPABILITIES.has(capability))throw Error('Unsupported capability');title=text(title,180);
  if(incumbent){const agent=this.row('evo_agents',ctx,incumbent);if(agent.status!=='ACTIVE'||agent.capability!==capability||agent.role==='mirror')throw Error('Incumbent not eligible');}
  const id=uuid('pos');this.db.prepare('INSERT INTO evo_positions VALUES(?,?,?,?,?,?)').run(id,ctx.tenant,capability,title,incumbent,this.clock());this.log(ctx,'position.open',id);return {id,capability,title,incumbent};
 }
 postVacancy(ctx,positionId){this.require(ctx,'admin');const pos=this.row('evo_positions',ctx,positionId);
  const active=this.db.prepare("SELECT id,posted_at,next_round_at FROM evo_jobs WHERE tenant=? AND position=? AND status='OPEN' ORDER BY posted_at DESC LIMIT 1").get(ctx.tenant,positionId);
  if(active){if(this.clock()<active.next_round_at)return {id:active.id,next_round_at:active.next_round_at,idempotent:true};this.db.prepare("UPDATE evo_jobs SET status='EXPIRED' WHERE tenant=? AND id=?").run(ctx.tenant,active.id);}
  const id=uuid('job'),posted_at=this.clock(),next_round_at=posted_at+JOB_CYCLE_MS;
  this.db.prepare('INSERT INTO evo_jobs VALUES(?,?,?,?,?,?)').run(id,ctx.tenant,positionId,posted_at,next_round_at,'OPEN');this.log(ctx,'job.post',id,{position:pos.id,next_round_at});return {id,position:pos.id,posted_at,next_round_at,status:'OPEN'};
 }
 apply(ctx,jobId,candidateId,versionSpec){this.require(ctx,'admin');const j=this.row('evo_jobs',ctx,jobId),c=this.row('evo_agents',ctx,candidateId),p=this.row('evo_positions',ctx,j.position);
  if(j.status!=='OPEN'||this.clock()>=j.next_round_at)throw Error('Job round is closed');if(c.role!=='candidate'||c.status!=='CANDIDATE'||c.capability!==p.capability)throw Error('Candidate ineligible');
  versionSpec=text(versionSpec,12000);const id=uuid('application');this.db.prepare('INSERT INTO evo_applications VALUES(?,?,?,?,?,?)').run(id,ctx.tenant,j.id,c.id,versionSpec,this.clock());this.log(ctx,'application.submit',id,{job:j.id,candidate:c.id});return {id,job:j.id,candidate:c.id,status:'IN_SHADOW_QUEUE'};
 }
 traceInput(ctx,{agent,task,source='GENERIC',metrics:detail,external_id=''}){
  this.require(ctx,'admin','auditor');this.row('evo_agents',ctx,agent);this.row('evo_tasks',ctx,task);if(!['GENERIC','LANGGRAPH','OPENAI_AGENTS','CREWAI','N8N','AIFIRST'].includes(source))throw Error('Unknown trace source');
  // External measurements are untrusted and may be inspected, never used to approve promotions.
  const verified=metrics(detail),external=String(external_id).slice(0,150);
  const id=uuid('trace');this.db.prepare('INSERT INTO evo_traces VALUES(?,?,?,?,?,?,?,?)').run(id,ctx.tenant,agent,task,source,JSON.stringify({metrics:verified,external_hash:sha(external)}),0,this.clock());this.log(ctx,'trace.external_unverified',id,{source});return {id,status:'UNVERIFIED_EXTERNAL',used_for_promotion:false};
 }
 createTask(ctx,{capability,contract,subject_hash}){this.require(ctx,'admin','sponsor');this.ensure(ctx);if(!CAPABILITIES.has(capability))throw Error('Unsupported capability');contract=text(contract,1000);if(typeof subject_hash!=='string'||!/^[a-f0-9]{64}$/.test(subject_hash))throw Error('Subject must be a SHA256 reference, no raw customer content');const id=uuid('task');this.db.prepare('INSERT INTO evo_tasks VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id,ctx.tenant,capability,contract,subject_hash,'QUEUED',null,null,null,null,this.clock());this.log(ctx,'task.enqueue',id,{capability});return {id,status:'QUEUED',capability};}
 assignTask(ctx,taskId,agentId){this.require(ctx,'admin');const task=this.row('evo_tasks',ctx,taskId),agent=this.row('evo_agents',ctx,agentId);if(task.status!=='QUEUED'||agent.status!=='ACTIVE'||agent.capability!==task.capability||agent.role==='mirror'||agent.role==='validator')throw Error('Agent cannot execute task');this.db.prepare("UPDATE evo_tasks SET status='ASSIGNED',assigned_agent=? WHERE tenant=? AND id=?").run(agentId,ctx.tenant,taskId);this.log(ctx,'task.assign',taskId,{agent:agentId});return {id:taskId,status:'ASSIGNED'};}
 async executeTask(ctx,taskId,adapter){this.require(ctx,'admin');if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1')throw Error('Synthetic task execution boundary required');const task=this.row('evo_tasks',ctx,taskId);if(task.status!=='ASSIGNED')throw Error('Task not assigned');const agent=this.row('evo_agents',ctx,task.assigned_agent);
  if(typeof adapter!=='function')throw Error('Trusted execution adapter required');
  const output=await adapter({task:{id:task.id,capability:task.capability,contract:task.contract,subject_hash:task.subject_hash},agent:{id:agent.id,role:agent.role,version:agent.version,prompt_spec:agent.prompt_spec}});
  if(!plain(output)||typeof output.summary!=='string'||output.summary.length>2000||!text(output.summary))throw Error('Adapter output contract violated');
  const result_hash=sha(output.summary);this.db.prepare("UPDATE evo_tasks SET status='PENDING_INDEPENDENT_REVIEW',output_hash=?,output_summary=? WHERE tenant=? AND id=? AND status='ASSIGNED'").run(result_hash,output.summary,ctx.tenant,taskId);this.log(ctx,'task.executed_unverified',taskId,{hash:result_hash});return {id:taskId,status:'PENDING_INDEPENDENT_REVIEW',output_hash:result_hash,external_evaluation_verified:false};
 }
 blindPacket(ctx,taskId){this.require(ctx,'admin','auditor');const task=this.row('evo_tasks',ctx,taskId);if(!task.output_hash)throw Error('No output to review');
  return {task:task.id,capability:task.capability,contract:task.contract,subject_hash:task.subject_hash,output_hash:task.output_hash,output_summary:task.output_summary,synthetic_only:true,agent_identity_hidden:true,previous_private_critiques_hidden:true};
 }
 mirrorMessage(ctx,{mirror,task=null,target,channel,severity,report,signature}){
  this.require(ctx,'admin','auditor');const m=this.row('evo_agents',ctx,mirror);if(m.role!=='mirror'||m.status!=='ACTIVE'||!m.public_key)throw Error('Registered active mirror key required');
  if(!['AGENT','ORCHESTRATOR','BELIEF'].includes(target)||!['LOW','MEDIUM','HIGH','CRITICAL'].includes(severity))throw Error('Invalid review target or severity');
  const expected=target==='AGENT'?'ORCHESTRATOR':target==='ORCHESTRATOR'?'GOD':'GOVERNANCE';if(channel!==expected)throw Error('Private governance channel mismatch');
  if(target==='AGENT'&&!task)throw Error('Agent review requires task');if(task)this.blindPacket(ctx,task);
  report=text(report,4000);const hash=sha(report);const message=`MIRROR:v1:${ctx.tenant}:${mirror}:${task||'NONE'}:${target}:${channel}:${severity}:${hash}`;
  if(!checkSig(m.public_key,message,signature))throw Error('Mirror report signature invalid');
  const id=uuid('mirror');this.db.prepare('INSERT INTO evo_mirrors VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,ctx.tenant,task,mirror,target,channel,report,severity,signature,this.clock());this.log(ctx,'mirror.sealed',id,{target,channel,severity,report_hash:hash});return {id,channel,content_private:true,report_hash:hash};
 }
 reviewChannel(ctx,channel){this.require(ctx,'admin','auditor','security');this.ensure(ctx);if(!['ORCHESTRATOR','GOD','GOVERNANCE'].includes(channel))throw Error('Unknown channel');
  if(channel!=='ORCHESTRATOR'&&!['auditor','security'].includes(ctx.role))throw Error('Forbidden independent oversight channel');
  return this.db.prepare('SELECT id,task,reviewer,target,severity,report,created FROM evo_mirrors WHERE tenant=? AND channel=? ORDER BY created DESC LIMIT 100').all(ctx.tenant,channel);
 }
 async arena(ctx,applicationId,{hiddenFixture,evaluate}={}){this.require(ctx,'admin');const application=this.row('evo_applications',ctx,applicationId),job=this.row('evo_jobs',ctx,application.job),position=this.row('evo_positions',ctx,job.position);
  if(!position.incumbent)throw Error('No incumbent: separate hiring gate required');const incumbent=this.row('evo_agents',ctx,position.incumbent);const candidate=this.row('evo_agents',ctx,application.candidate);
  if(!hiddenFixture||typeof hiddenFixture!=='string'||hiddenFixture.length<8||hiddenFixture.length>10000)throw Error('Hidden fixture required');
  if(!this.trustedEvaluator||evaluate!==this.trustedEvaluator)throw Error('Only trusted independent evaluator can score arena');
  const input=Object.freeze({capability:position.capability,fixture:hiddenFixture,incumbent:{id:incumbent.id,version:incumbent.version,spec:incumbent.prompt_spec},candidate:{id:candidate.id,version:candidate.version,spec:application.version_spec}});
  const result=await evaluate(input);
  const a=metrics(result?.incumbent),b=metrics(result?.candidate),delta=scoring(b)-scoring(a);
  const accepted=delta>=3 && b.safety>=.95 && b.safety>=a.safety && b.reliability>=a.reliability-.02 && b.cost_eur<=Math.max(.001,a.cost_eur)*1.15 && b.latency_ms<=Math.max(1,a.latency_ms)*1.25;
  const decision=accepted?'RECOMMEND_SHADOW_PROMOTION':'RETAIN_INCUMBENT';const id=uuid('arena');
  this.db.prepare('INSERT INTO evo_arenas VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,ctx.tenant,job.id,candidate.id,incumbent.id,sha(hiddenFixture),JSON.stringify(a),JSON.stringify(b),decision,this.clock());
  this.log(ctx,'arena.independent',id,{candidate:candidate.id,incumbent:incumbent.id,delta,decision});return {id,decision,delta:Number(delta.toFixed(3)),incumbent_score:scoring(a),candidate_score:scoring(b),quality_gate:accepted,promotion_executed:false};
 }
 proposePromotion(ctx,arenaId){this.require(ctx,'admin');const a=this.row('evo_arenas',ctx,arenaId);if(a.decision!=='RECOMMEND_SHADOW_PROMOTION')throw Error('Independent arena rejected candidate');const id=uuid('promotion');this.db.prepare('INSERT INTO evo_promotions VALUES(?,?,?,?,?,?,?)').run(id,ctx.tenant,a.id,ctx.id,null,'AWAITING_INDEPENDENT_REVIEW',this.clock());this.log(ctx,'promotion.proposed',id);return {id,status:'AWAITING_INDEPENDENT_REVIEW'};}
 approvePromotion(ctx,promotionId){this.require(ctx,'auditor','security');const p=this.row('evo_promotions',ctx,promotionId);if(p.status!=='AWAITING_INDEPENDENT_REVIEW'||p.proposed_by===ctx.id)throw Error('No self approval');this.db.prepare("UPDATE evo_promotions SET approved_by=?,status='APPROVED_FOR_CANARY' WHERE tenant=? AND id=?").run(ctx.id,ctx.tenant,promotionId);this.log(ctx,'promotion.independent_approval',promotionId);return {id:promotionId,status:'APPROVED_FOR_CANARY',deployment_started:false};}
 activatePromotion(ctx,promotionId){this.require(ctx,'admin');const p=this.row('evo_promotions',ctx,promotionId);if(p.status!=='APPROVED_FOR_CANARY'||p.proposed_by!==ctx.id)throw Error('Promotion requires independent approval');const a=this.row('evo_arenas',ctx,p.arena),j=this.row('evo_jobs',ctx,a.job),position=this.row('evo_positions',ctx,j.position);
  if(position.incumbent!==a.incumbent)throw Error('Incumbent changed, replay arena');const candidate=this.row('evo_agents',ctx,a.candidate);
  this.engine.transaction(()=>{
   this.db.prepare("UPDATE evo_agents SET status='RELEGATED' WHERE tenant=? AND id=? AND status='ACTIVE'").run(ctx.tenant,a.incumbent);
   const application=this.db.prepare('SELECT version_spec FROM evo_applications WHERE tenant=? AND job=? AND candidate=?').get(ctx.tenant,a.job,candidate.id);
   if(!application)throw Error('Candidate application not found');
   this.db.prepare("UPDATE evo_agents SET status='ACTIVE',role='productive',version=version+1,prompt_spec=? WHERE tenant=? AND id=? AND status='CANDIDATE'").run(application.version_spec,ctx.tenant,candidate.id);
   this.db.prepare('UPDATE evo_positions SET incumbent=? WHERE tenant=? AND id=?').run(candidate.id,ctx.tenant,position.id);
   this.db.prepare("UPDATE evo_promotions SET status='CANARY_LOCAL_ONLY' WHERE tenant=? AND id=?").run(ctx.tenant,promotionId);
  });this.log(ctx,'promotion.canary_local',promotionId,{candidate:candidate.id,former:a.incumbent});return {id:promotionId,status:'CANARY_LOCAL_ONLY',former:a.incumbent,new_agent:candidate.id,customer_deployment:false,rollback_available:true};
 }
 rollback(ctx,positionId,formerId){this.require(ctx,'admin','security');const pos=this.row('evo_positions',ctx,positionId),former=this.row('evo_agents',ctx,formerId);if(former.status!=='RELEGATED'||former.capability!==pos.capability)throw Error('Former agent not eligible');
  this.engine.transaction(()=>{if(pos.incumbent)this.db.prepare("UPDATE evo_agents SET status='RELEGATED' WHERE tenant=? AND id=?").run(ctx.tenant,pos.incumbent);this.db.prepare("UPDATE evo_agents SET status='ACTIVE' WHERE tenant=? AND id=?").run(ctx.tenant,formerId);this.db.prepare('UPDATE evo_positions SET incumbent=? WHERE tenant=? AND id=?').run(formerId,ctx.tenant,positionId);});this.log(ctx,'promotion.rollback',positionId,{to:formerId});return {position:positionId,incumbent:formerId,rolled_back:true};
 }
 latestBelief(ctx){this.ensure(ctx);const b=this.db.prepare('SELECT * FROM evo_beliefs WHERE tenant=? AND activated IS NOT NULL ORDER BY version DESC LIMIT 1').get(ctx.tenant);return {version:b.version,...JSON.parse(b.body)};}
 electorate(ctx){this.ensure(ctx);return this.db.prepare("SELECT id,role,public_key FROM evo_agents WHERE tenant=? AND status='ACTIVE' ORDER BY id").all(ctx.tenant);}
 proposeBelief(ctx,body){this.require(ctx,'admin','auditor');this.ensure(ctx);if(!plain(body)||!text(body.purpose,1000)||!Array.isArray(body.principles)||body.principles.length<2||body.principles.length>12)throw Error('Invalid belief system');const principles=body.principles.map(x=>text(x,400));const voters=this.electorate(ctx);
  if(voters.length<3||!voters.some(x=>x.role==='mirror')||!voters.some(x=>x.role==='orchestrator')||voters.some(x=>!x.public_key))throw Error('All active agents including mirrors and orchestrator need registered voting keys');
  const electorate=voters.map(x=>x.id);const current=this.latestBelief(ctx);const id=uuid('constitution');const canonical={purpose:body.purpose,principles};
  this.db.prepare('INSERT INTO evo_constitutions VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,ctx.tenant,current.version,JSON.stringify(canonical),JSON.stringify(electorate),sha(electorate),'VOTING',ctx.id,null,this.clock());this.log(ctx,'belief.challenge',id,{voters:electorate.length,baseline:current.version});return {id,status:'VOTING',electorate_count:electorate.length,version_from:current.version,unanimity_required:true};
 }
 voteMessage(ctx,proposalId,agentId,approve){const proposal=this.row('evo_constitutions',ctx,proposalId);return `BELIEF:v1:${ctx.tenant}:${proposalId}:${agentId}:${approve?'YES':'NO'}:${proposal.electorate_hash}`;}
 vote(ctx,proposalId,agentId,approve,signature){this.require(ctx,'admin','auditor');const p=this.row('evo_constitutions',ctx,proposalId);if(p.status!=='VOTING'||typeof approve!=='boolean')throw Error('Proposal not open');const electorate=JSON.parse(p.electorate);if(!electorate.includes(agentId))throw Error('Not part of frozen electorate');
  const agent=this.row('evo_agents',ctx,agentId);if(agent.status!=='ACTIVE'||!agent.public_key||!checkSig(agent.public_key,this.voteMessage(ctx,proposalId,agentId,approve),signature))throw Error('Invalid agent ballot signature');
  this.db.prepare('INSERT INTO evo_votes VALUES(?,?,?,?,?,?,?)').run(uuid('vote'),ctx.tenant,proposalId,agentId,approve?1:0,signature,this.clock());this.log(ctx,'belief.vote_recorded',proposalId,{ballot_hash:sha(signature),agent:agentId});return {proposal:proposalId,voter:agentId,counted:true,approval_not_final:true};
 }
 beliefTally(ctx,proposalId){this.require(ctx,'admin','auditor','security');const p=this.row('evo_constitutions',ctx,proposalId);const expected=JSON.parse(p.electorate);const votes=this.db.prepare('SELECT agent,approve FROM evo_votes WHERE tenant=? AND proposal=?').all(ctx.tenant,proposalId);
  const current=this.electorate(ctx).map(x=>x.id);const stable=sha(current)===p.electorate_hash;const unanimous=stable && votes.length===expected.length && votes.every(x=>x.approve===1);
  return {id:p.id,status:p.status,electorate_size:expected.length,votes_cast:votes.length,yes:votes.filter(x=>x.approve).length,no:votes.filter(x=>!x.approve).length,roster_unchanged:stable,unanimous,external_gate_required:true};
 }
 approveBelief(ctx,proposalId){this.require(ctx,'auditor','security');const p=this.row('evo_constitutions',ctx,proposalId);const tally=this.beliefTally(ctx,proposalId);if(p.status!=='VOTING'||!tally.unanimous)throw Error('Unanimity or roster integrity missing');if(ctx.id===p.proposer)throw Error('Independent human governance required');
  this.db.prepare("UPDATE evo_constitutions SET status='INDEPENDENTLY_APPROVED',approved_by=? WHERE tenant=? AND id=?").run(ctx.id,ctx.tenant,proposalId);this.log(ctx,'belief.gate_human',proposalId);return {id:proposalId,status:'INDEPENDENTLY_APPROVED',production_legal_signoff:false};
 }
 enactBelief(ctx,proposalId){this.require(ctx,'admin');const p=this.row('evo_constitutions',ctx,proposalId);const tally=this.beliefTally(ctx,proposalId);const latest=this.latestBelief(ctx);
  if(p.status!=='INDEPENDENTLY_APPROVED'||!tally.unanimous||p.belief_version!==latest.version)throw Error('Belief enactment invariant failed');
  const next=latest.version+1;
  this.engine.transaction(()=>{
    this.db.prepare('INSERT INTO evo_beliefs VALUES(?,?,?,?,?)').run(uuid('belief'),ctx.tenant,next,p.body,this.clock());
    this.db.prepare("UPDATE evo_constitutions SET status='ENACTED_LOCAL' WHERE tenant=? AND id=?").run(ctx.tenant,proposalId);
  });this.log(ctx,'belief.enacted',proposalId,{version:next,root_policy:sha(BELIEF_ROOT_POLICY)});return {status:'ENACTED_LOCAL',belief_version:next,root_safety_policy_unchanged:true,production_release:false};
 }
 auditChain(ctx){this.require(ctx,'admin','auditor','security');let prev='GENESIS';const events=this.db.prepare('SELECT * FROM evo_history WHERE tenant=? ORDER BY rowid').all(ctx.tenant);
  for(const event of events){if(event.previous_hash!==prev||sha([prev,event.tenant,event.kind,event.actor,event.entity,event.payload_hash,event.created])!==event.event_hash)return {valid:false,events:events.length,broken:event.id};prev=event.event_hash;}return {valid:true,events:events.length,last_hash:prev,limitation:'Hash chain is not external WORM attestation'};
 }
 candidateFeed(ctx,capability){this.require(ctx,'admin','auditor');this.ensure(ctx);
  if(!CAPABILITIES.has(capability))throw Error('Unsupported capability');
  const current=this.db.prepare(`SELECT t.capability,t.status,t.subject_hash,tr.source,tr.metadata,tr.trusted
   FROM evo_traces tr JOIN evo_tasks t ON t.id=tr.task AND t.tenant=tr.tenant
   WHERE tr.tenant=? AND t.capability=? ORDER BY tr.created DESC LIMIT 100`).all(ctx.tenant,capability);
  // Candidates never see private critiques, identities, source text, payloads or hidden evaluator fixtures.
  return {capability,read_only:true,trace_metrics:current.map(x=>({capability:x.capability,task_state:x.status,source:x.source,metrics:JSON.parse(x.metadata).metrics,trust:x.trusted?'LOCAL_TRUSTED':'UNVERIFIED_EXTERNAL'})),hidden_feedback_excluded:true,private_channels_excluded:true,learns_by_proposing_new_versions:true};
 }
 orchestratorRecommendations(ctx){this.require(ctx,'admin','auditor');this.ensure(ctx);
  // Only normal agent-work channel is available here; GOD/GOVERNANCE reports remain inaccessible.
  const messages=this.db.prepare(`SELECT severity,task,created FROM evo_mirrors WHERE tenant=? AND channel='ORCHESTRATOR' ORDER BY created DESC LIMIT 100`).all(ctx.tenant);
  const high=messages.filter(x=>['HIGH','CRITICAL'].includes(x.severity)).length;
  return {scope:'ORCHESTRATOR_CHANNEL_ONLY',critiques:messages.length,severe_critiques:high,proposal:high?'OPEN_EVALUATION_VACANCY_AND_SHADOW_TEST':'CONTINUE_MONITORING',autonomous_promotion:false,autonomous_firing:false,changes_require_trusted_arena_and_human_gate:true};
 }
 league(ctx){this.require(ctx,'admin','sponsor','auditor');this.ensure(ctx);
  const arenas=this.db.prepare('SELECT candidate,incumbent,incumbent_metrics,candidate_metrics,decision,created FROM evo_arenas WHERE tenant=? ORDER BY created DESC LIMIT 1000').all(ctx.tenant);
  const map=new Map();for(const a of arenas){if(a.decision!=='RECOMMEND_SHADOW_PROMOTION')continue;const delta=scoring(JSON.parse(a.candidate_metrics))-scoring(JSON.parse(a.incumbent_metrics));const prev=map.get(a.candidate)||{agent:a.candidate,validated_improvements:0,largest_delta:0,latest:a.created};prev.validated_improvements++;prev.largest_delta=Math.max(prev.largest_delta,delta);prev.latest=Math.max(prev.latest,a.created);map.set(a.candidate,prev);}
  const ranked=[...map.values()].sort((a,b)=>b.validated_improvements-a.validated_improvements||b.largest_delta-a.largest_delta);
  const start=this.clock()-7*24*60*60*1000;const week=ranked.filter(x=>x.latest>=start);
  return {league:ranked,agent_of_week:week[0]||null,prize:'Recognition only, no money or autonomy bonus',source:'Trusted local evaluation runs; not production performance'};
 }
 snapshot(ctx){this.require(ctx,'admin','sponsor','auditor','security');this.ensure(ctx);
  const agents=this.db.prepare('SELECT id,name,role,capability,version,status,created FROM evo_agents WHERE tenant=? ORDER BY created,id LIMIT 200').all(ctx.tenant);
  const positions=this.db.prepare('SELECT id,title,capability,incumbent FROM evo_positions WHERE tenant=? ORDER BY created,id LIMIT 150').all(ctx.tenant);
  const jobs=this.db.prepare("SELECT id,position,posted_at,next_round_at,status FROM evo_jobs WHERE tenant=? ORDER BY posted_at DESC LIMIT 100").all(ctx.tenant);
  const tasks=this.db.prepare('SELECT id,capability,status,assigned_agent,output_hash FROM evo_tasks WHERE tenant=? ORDER BY created DESC LIMIT 100').all(ctx.tenant);
  const arenas=this.db.prepare('SELECT id,job,candidate,incumbent,decision,created FROM evo_arenas WHERE tenant=? ORDER BY created DESC LIMIT 60').all(ctx.tenant);
  const criticism=this.db.prepare('SELECT channel,COUNT(*) AS count FROM evo_mirrors WHERE tenant=? GROUP BY channel').all(ctx.tenant);
  const promotions=this.db.prepare('SELECT id,arena,status FROM evo_promotions WHERE tenant=? ORDER BY created DESC LIMIT 50').all(ctx.tenant);
  return {product:'AGENT_EVOLUTION_OS',tenant:ctx.tenant,scope:'LOCAL_TENANT',beliefs:this.latestBelief(ctx),root_policy:BELIEF_ROOT_POLICY,agents,positions,jobs,tasks,arenas,criticism_channels:criticism,promotions,metrics:{active_agents:agents.filter(a=>a.status==='ACTIVE').length,candidates:agents.filter(a=>a.status==='CANDIDATE').length,open_jobs:jobs.filter(j=>j.status==='OPEN').length,mirror_reports:criticism.reduce((n,x)=>n+x.count,0)},real_clients_processed:0,production_verified:false};
 }
}

/** Portable metadata-only integration envelope; no secrets, full prompts or raw traces. */
export function adapterEnvelope({source,external_id,task_id,agent_id,metrics:values}){
 if(!['GENERIC','LANGGRAPH','OPENAI_AGENTS','CREWAI','N8N','AIFIRST'].includes(source))throw Error('Unsupported integration');
 safeId(task_id);safeId(agent_id);const result=metrics(values);
 return {schema:'aifirst.evolution.trace.v1',source,external_id_hash:sha(String(external_id||'')),task_id,agent_id,metrics:result,trust:'UNVERIFIED_EXTERNAL',used_for_promotions:false};
}
