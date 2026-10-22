/** Evidence-first integration bridge between Discovery & Transformation and Evolution OS.
 * Local-only and synthetic-only. No raw submissions, employee data, unapproved agent code,
 * payment authority, private GOD critiques or signer private keys cross the boundary.
 */
import crypto from 'node:crypto';
import {EvolutionOS, JOB_CYCLE_MS} from './evolution-os.mjs';
import {PIPELINES} from './evolution-workflows.mjs';
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const REF=/^[a-f0-9]{64}$/;
const assertDemo=()=>{if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1')throw Error('Only synthetic demo bridge enabled');};
export const EVOLUTION_BRIDGE_VERSION='aifirst.discovery-evolution.v1';
export class EvolutionFabric {
 constructor(engine,{clock=()=>Date.now(),evolution=null}={}){
  if(!engine?.db||!engine?.permitted)throw Error('EditionRuntime required');
  this.engine=engine;this.db=engine.db;this.clock=clock;
  this.os=evolution||new EvolutionOS(engine,{clock});
  this.db.exec(`
   CREATE TABLE IF NOT EXISTS evo_discovery_bridges(
    id TEXT PRIMARY KEY,tenant TEXT NOT NULL,edition TEXT NOT NULL,submission TEXT NOT NULL,
    capability TEXT NOT NULL,task TEXT NOT NULL,manifest_hash TEXT NOT NULL,created_at INTEGER NOT NULL,
    UNIQUE(tenant,submission,capability));
   CREATE INDEX IF NOT EXISTS idx_evo_bridge_tenant ON evo_discovery_bridges(tenant,edition);
   CREATE TABLE IF NOT EXISTS evo_mirror_rounds(
    id TEXT PRIMARY KEY,tenant TEXT NOT NULL,task TEXT NOT NULL,mirror TEXT NOT NULL,
    review TEXT NOT NULL,channel TEXT NOT NULL,created_at INTEGER NOT NULL,
    UNIQUE(tenant,task,mirror));
  `);
 }
 /** Bridge submissions without using raw content or unverified personal identities. */
 bridgeSubmission(ctx,submission,{capability='HACKATHON'}={}){
  assertDemo();this.engine.permitted(ctx,'admin');this.os.ensure(ctx);
  if(!Object.hasOwn(PIPELINES,capability))throw Error('Unknown capability');
  const sub=this.engine.own(ctx,'submissions',submission);
  const ed=this.engine.own(ctx,'editions',sub.edition);
  const artifacts=this.engine.rows('SELECT sha,scan,scan_ref FROM artifacts WHERE tenant=? AND submission=? ORDER BY sha',ctx.tenant,submission);
  if(!artifacts.length||artifacts.some(a=>a.scan!=='CLEAN'||!a.scan_ref))throw Error('Trusted malware scan required for each artifact');
  const review=this.engine.row("SELECT id FROM gates WHERE tenant=? AND edition=? AND gate='G3'",ctx.tenant,ed.id);
  if(!review)throw Error('G3 local review required');
  const old=this.db.prepare('SELECT * FROM evo_discovery_bridges WHERE tenant=? AND submission=? AND capability=?').get(ctx.tenant,submission,capability);
  const manifest_hash=hash({tenant:ctx.tenant,edition:ed.id,submission,capability,artifacts:artifacts.map(x=>x.sha),rubric:ed.rubric});
  if(old){if(old.manifest_hash!==manifest_hash)throw Error('Manifest drift: resubmit as new version after human review');return {id:old.id,task:old.task,capability,idempotent:true,redacted:true};}
  const agent=this.os.snapshot(ctx).agents.filter(a=>a.status==='ACTIVE'&&a.capability===capability&&a.role==='productive').sort((a,b)=>b.version-a.version)[0];
  if(!agent)throw Error('No available agent for capability');
  const task=this.os.createTask(ctx,{capability,contract:`AIFIRST Discovery ${capability} — synthetic SHA references, human jury required`,subject_hash:manifest_hash});
  this.os.assignTask(ctx,task.id,agent.id);
  const id='bridge_'+crypto.randomUUID();
  this.db.prepare('INSERT INTO evo_discovery_bridges VALUES(?,?,?,?,?,?,?,?)').run(id,ctx.tenant,ed.id,submission,capability,task.id,manifest_hash,this.clock());
  this.os.log(ctx,'bridge.discovery_connected',id,{task:task.id,manifest_hash});
  return {id,task:task.id,capability,assigned_agent:agent.id,redacted:true,production_approval:false,idempotent:false};
 }
 /** The mirror operates independently, sees ONLY the blind packet, and signs outside the host.
  * The caller supplies a signed response from the mirror's own identity system.
  */
 async mirrorRound(ctx,taskId,{mirror,critic}={}){
  assertDemo();this.engine.permitted(ctx,'admin');
  if(typeof critic!=='function')throw Error('Independent critic adapter required');
  const packet=this.os.blindPacket(ctx,taskId),task=this.os.row('evo_tasks',ctx,taskId);
  if(task.status!=='PENDING_INDEPENDENT_REVIEW')throw Error('Task requires independent review');
  const reviewer=this.os.row('evo_agents',ctx,mirror);
  if(reviewer.role!=='mirror'||reviewer.status!=='ACTIVE'||!reviewer.public_key||reviewer.id===task.assigned_agent)throw Error('Active independent mirror required');
  const existing=this.db.prepare('SELECT * FROM evo_mirror_rounds WHERE tenant=? AND task=? AND mirror=?').get(ctx.tenant,taskId,mirror);
  if(existing)return {id:existing.id,channel:existing.channel,review:existing.review,idempotent:true,content_private:true};
  const critique=await critic(Object.freeze({...packet,reviewer_identity_hidden:true,channel:'ORCHESTRATOR'}));
  if(!critique||!['LOW','MEDIUM','HIGH','CRITICAL'].includes(critique.severity)||typeof critique.report!=='string'||typeof critique.signature!=='string')throw Error('Signed mirror verdict required');
  const review=this.os.mirrorMessage(ctx,{mirror,task:taskId,target:'AGENT',channel:'ORCHESTRATOR',severity:critique.severity,report:critique.report,signature:critique.signature});
  const id='round_'+crypto.randomUUID();
  this.db.prepare('INSERT INTO evo_mirror_rounds VALUES(?,?,?,?,?,?,?)').run(id,ctx.tenant,taskId,mirror,review.id,review.channel,this.clock());
  this.os.log(ctx,'bridge.mirror_review',id,{task:taskId,channel:review.channel,severity:critique.severity});
  return {id,review:review.id,channel:review.channel,content_private:true,approved_for_production:false,idempotent:false};
 }
 /** All four-day vacancies are renewed by an admin-operated tick. No automatic promotion. */
 rotateJobBoard(ctx){
  assertDemo();this.engine.permitted(ctx,'admin');this.os.ensure(ctx);
  const due=this.db.prepare(`SELECT p.id AS position,j.id AS job,j.next_round_at FROM evo_positions p LEFT JOIN evo_jobs j
   ON j.id=(SELECT x.id FROM evo_jobs x WHERE x.tenant=p.tenant AND x.position=p.id ORDER BY x.posted_at DESC,x.rowid DESC LIMIT 1)
   WHERE p.tenant=? ORDER BY p.created,p.id`).all(ctx.tenant);
  let opened=0,unchanged=0,closed=0;const vacancies=[];
  for(const entry of due){
   if(entry.job && entry.next_round_at>this.clock()){unchanged++;continue;}
   if(entry.job){this.db.prepare("UPDATE evo_jobs SET status='EXPIRED' WHERE tenant=? AND id=? AND status='OPEN'").run(ctx.tenant,entry.job);closed++;}
   const vacancy=this.os.postVacancy(ctx,entry.position);vacancies.push(vacancy.id);opened++;
  }
  return {cycle_ms:JOB_CYCLE_MS,opened,unchanged,closed,positions:due.length,vacancies,automatic_promotion:false};
 }
 /** Exportable integration health (not external certification). */
 health(ctx){this.engine.permitted(ctx,'admin','auditor','security');this.os.ensure(ctx);
  const bridges=this.db.prepare('SELECT capability,COUNT(*) as count FROM evo_discovery_bridges WHERE tenant=? GROUP BY capability').all(ctx.tenant);
  const reports=this.db.prepare('SELECT COUNT(*) as count FROM evo_mirror_rounds WHERE tenant=?').get(ctx.tenant).count;
  const pending=this.db.prepare("SELECT COUNT(*) as count FROM evo_tasks WHERE tenant=? AND status='PENDING_INDEPENDENT_REVIEW'").get(ctx.tenant).count;
  return {schema:EVOLUTION_BRIDGE_VERSION,tenant_scope:'ISOLATED',bridges,mirror_rounds:reports,pending_human_reviews:pending,content_transport:'SHA256_ONLY',external_attestation:false,production_ready:false};
 }
}
