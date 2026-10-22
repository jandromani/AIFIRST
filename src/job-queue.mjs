/** Durable local job queue for *synthetic metadata only*. Not an untrusted-code sandbox. */
import crypto from 'node:crypto';
const now=()=>Date.now();
const makeId=()=> 'queue_'+crypto.randomUUID();
export class SyntheticJobQueue {
 constructor(engine,{clock=now,maximumPerTenantEur=10,leaseMs=120000}={}){
  this.engine=engine;this.db=engine.db;this.clock=clock;this.leaseMs=leaseMs;this.maxEur=maximumPerTenantEur;
  if(!Number.isFinite(maximumPerTenantEur)||maximumPerTenantEur<=0)throw Error('Invalid queue ceiling');
  this.db.exec(`CREATE TABLE IF NOT EXISTS synthetic_queue(
    id TEXT PRIMARY KEY,tenant TEXT NOT NULL,edition TEXT NOT NULL,submission TEXT NOT NULL,
    kind TEXT NOT NULL,model TEXT NOT NULL,max_eur REAL NOT NULL,status TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,lease_owner TEXT,lease_until INTEGER NOT NULL DEFAULT 0,
    result_ref TEXT,last_error TEXT,created_at INTEGER NOT NULL,UNIQUE(tenant,submission,kind));
    CREATE INDEX IF NOT EXISTS idx_synthetic_ready ON synthetic_queue(status,lease_until,created_at);`);
 }
 enqueue(ctx,submission,{model='openrouter/free',maxCostEur=.25}={}){
  this.engine.permitted(ctx,'admin','sponsor');
  const sub=this.engine.own(ctx,'submissions',submission);
  if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1')throw Error('Queue is synthetic-demo only');
  if(!/^openrouter\/free$|^[a-z0-9._-]+\/[a-z0-9._-]+:free$/.test(model))throw Error('Only free demonstration models allowed');
  if(!Number.isFinite(maxCostEur)||maxCostEur<=0||maxCostEur>1)throw Error('Budget exceeds demo limit');
  const artifacts=this.engine.rows('SELECT scan,scan_ref FROM artifacts WHERE tenant=? AND submission=?',ctx.tenant,submission);
  if(artifacts.length===0||artifacts.some(a=>a.scan!=='CLEAN'||!a.scan_ref))throw Error('Unverified artifact cannot be queued');
  const gate=this.engine.row("SELECT id FROM gates WHERE tenant=? AND edition=? AND gate='G3'",ctx.tenant,sub.edition);
  if(!gate)throw Error('G3 local review is missing');
  return this.engine.transaction(()=>{
   const old=this.engine.row("SELECT * FROM synthetic_queue WHERE tenant=? AND submission=? AND kind='PROJECT_DRAFT'",ctx.tenant,submission);
   if(old)return {id:old.id,status:old.status,idempotent:true};
   const active=this.engine.row("SELECT COALESCE(SUM(max_eur),0) AS reserved FROM synthetic_queue WHERE tenant=? AND status IN ('QUEUED','LEASED','COMPLETED')",ctx.tenant);
   if(active.reserved+maxCostEur>this.maxEur+1e-8)throw Error('Tenant budget reservation cap exceeded');
   const id=makeId();this.engine.run('INSERT INTO synthetic_queue VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',id,ctx.tenant,sub.edition,submission,'PROJECT_DRAFT',model,maxCostEur,'QUEUED',0,null,0,null,null,this.clock());
   return {id,status:'QUEUED',maxCostEur,created_for_demo_only:true};
  });
 }
 claim(ctx,workerId){
  this.engine.permitted(ctx,'admin');
  if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1')throw Error('Queue processor disabled outside synthetic demo');
  if(typeof workerId!=='string'||!/^worker_[a-zA-Z0-9_-]{3,80}$/.test(workerId))throw Error('Invalid worker identity');
  return this.engine.transaction(()=>{
   const record=this.engine.row(`SELECT * FROM synthetic_queue WHERE tenant=? AND (
     status='QUEUED' OR (status='LEASED' AND lease_until<=? AND attempts<3)) ORDER BY created_at,id LIMIT 1`,ctx.tenant,this.clock());
   if(!record)return null;
   const until=this.clock()+this.leaseMs;
   this.engine.run("UPDATE synthetic_queue SET status='LEASED',attempts=attempts+1,lease_owner=?,lease_until=? WHERE id=? AND tenant=?",workerId,until,record.id,ctx.tenant);
   return {id:record.id,tenant:ctx.tenant,submission:record.submission,edition:record.edition,model:record.model,maxCostEur:record.max_eur,leaseOwner:workerId,leaseUntil:until,attempt:record.attempts+1};
  });
 }
 finish(ctx,lease,{jobId=null,error=null}={}){
  this.engine.permitted(ctx,'admin');if(lease.tenant!==ctx.tenant)throw Error('Cross-tenant lease');
  return this.engine.transaction(()=>{
   const item=this.engine.row('SELECT * FROM synthetic_queue WHERE id=? AND tenant=?',lease.id,ctx.tenant);
   if(!item||item.status!=='LEASED'||item.lease_owner!==lease.leaseOwner||item.lease_until!==lease.leaseUntil||item.lease_until<this.clock())throw Error('Lease lost; refusing stale completion');
   const status=error?(item.attempts>=3?'FAILED_PERMANENT':'QUEUED'):'COMPLETED';
   if(!error&&(!jobId||typeof jobId!=='string'))throw Error('Job reference required');
   this.engine.run('UPDATE synthetic_queue SET status=?,result_ref=?,last_error=?,lease_owner=NULL,lease_until=0 WHERE id=? AND tenant=?',status,jobId,error?String(error).slice(0,150):null,item.id,ctx.tenant);
   return {id:item.id,status,attempts:item.attempts};
  });
 }
 async runOne(ctx,workerId){
  const lease=this.claim(ctx,workerId);if(!lease)return {status:'EMPTY'};
  try{
   const r=await this.engine.agentJob(ctx,lease.submission,lease.model,lease.maxCostEur);
   return {...this.finish(ctx,lease,{jobId:r.id}),estimatedCostEur:r.costEur,outputPendingReview:true};
  }catch(e){return {...this.finish(ctx,lease,{error:e?.message||'Job failed'}),outputPendingReview:true};}
 }
 status(ctx){this.engine.permitted(ctx,'admin','sponsor','auditor');return this.engine.rows('SELECT id,status,attempts,model,max_eur,created_at FROM synthetic_queue WHERE tenant=? ORDER BY created_at DESC LIMIT 100',ctx.tenant);}
}
