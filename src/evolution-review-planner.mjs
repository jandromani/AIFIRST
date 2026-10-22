/** Evolution recommendations / recruiting. Never reads GOD channel as orchestrator.
 * Creates candidate proposals, not live prompt rewrites. All model outputs stay in review.
 */
import crypto from 'node:crypto';
import {EvolutionOS} from './evolution-os.mjs';
export class ReviewPlanner {
 constructor(engine,{evolution=null}={}){this.engine=engine;this.db=engine.db;this.os=evolution||new EvolutionOS(engine);
  this.db.exec(`CREATE TABLE IF NOT EXISTS evo_change_proposals(
   id TEXT PRIMARY KEY,tenant TEXT NOT NULL,position TEXT NOT NULL,reason_hash TEXT NOT NULL,
   source_channel TEXT NOT NULL,action TEXT NOT NULL,status TEXT NOT NULL,created_at INTEGER NOT NULL,
   UNIQUE(tenant,position,reason_hash));`);
 }
 propose(ctx,position,{reason,action='RECRUIT_CHALLENGER',source='ORCHESTRATOR'}={}){
  this.engine.permitted(ctx,'admin','auditor','security');this.os.ensure(ctx);
  const pos=this.os.row('evo_positions',ctx,position);
  if(!['RECRUIT_CHALLENGER','REQUEST_SHADOW_BENCHMARK','REVIEW_ORCHESTRATOR','FREEZE_AND_AUDIT'].includes(action))throw Error('Unapproved improvement action');
  if(!['ORCHESTRATOR','GOD','GOVERNANCE'].includes(source))throw Error('Invalid review channel');
  if(source!=='ORCHESTRATOR'&&!['auditor','security'].includes(ctx.role))throw Error('GOD reports inaccessible to orchestrator');
  if(typeof reason!=='string'||reason.length<10||reason.length>500)throw Error('Bounded evidence rationale required');
  const digest=crypto.createHash('sha256').update(reason).digest('hex');
  const old=this.db.prepare('SELECT id,status FROM evo_change_proposals WHERE tenant=? AND position=? AND reason_hash=?').get(ctx.tenant,pos.id,digest);
  if(old)return {...old,idempotent:true};
  const id='change_'+crypto.randomUUID();const now=Date.now();
  this.db.prepare('INSERT INTO evo_change_proposals VALUES(?,?,?,?,?,?,?,?)').run(id,ctx.tenant,pos.id,digest,source,action,'PENDING_HUMAN_GATE',now);
  this.os.log(ctx,'evolution.change_requested',id,{action,source,reason_digest:digest});
  return {id,action,source,status:'PENDING_HUMAN_GATE',autonomous_replacement:false};
 }
 queue(ctx){this.engine.permitted(ctx,'admin','auditor','security');return this.db.prepare('SELECT id,position,source_channel,action,status,created_at FROM evo_change_proposals WHERE tenant=? ORDER BY created_at DESC LIMIT 100').all(ctx.tenant);}
}
