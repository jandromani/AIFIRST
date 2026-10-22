/** Local Replay Studio — synthetic reference kernel + persistent tenant-scoped signed receipts.
 * Unlike EvolutionOS execution proofs, this reruns PUBLIC deterministic rules, not agents.
 */
import crypto from 'node:crypto';
import {runReplay,canonicalJson} from '../web/replay-core.mjs';
import {signLocalTheaterClaim,verifyTheaterReceipt} from './verified-theater.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const now=()=>new Date().toISOString();
export class ReplayStudio{
 constructor(engine,{clock=now}={}){
  this.engine=engine;this.clock=clock;
  engine.db.exec(`CREATE TABLE IF NOT EXISTS replay_studio_runs(
     id TEXT PRIMARY KEY,tenant TEXT NOT NULL,created TEXT NOT NULL,scenario_sha256 TEXT NOT NULL,
     result_sha256 TEXT NOT NULL,receipt_json TEXT NOT NULL);
     CREATE INDEX IF NOT EXISTS idx_replay_studio_tenant ON replay_studio_runs(tenant,created);`);
 }
 run(ctx,input){
  this.engine.permitted(ctx,'admin','sponsor');
  if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1')throw Error('Synthetic mode required');
  const scenarioCanonical=canonicalJson(input);
  if(Buffer.byteLength(scenarioCanonical)>2048)throw Error('Scenario too large');
  const result=runReplay(input);const outputCanonical=canonicalJson(result);
  const id='rep_'+crypto.randomUUID();const claim={schema:'aifirst.replay.local_claim.v1',id,run_at:this.clock(),
   tenant_scope_sha256:sha(ctx.tenant),input,result,scenario_sha256:sha(scenarioCanonical),
   result_sha256:sha(outputCanonical),kernel:'aifirst.replay.kernel.v1',
   assertions:{same_public_reference_kernel:true,independent_llm_benchmark:false,
     synthetic_only:true,production_release:false,legal_signature:false}};
  const receipt=signLocalTheaterClaim(this.engine.root,claim);
  this.engine.transaction(()=>{
   const today=this.clock().slice(0,10);
   const n=this.engine.row('SELECT count(*) n FROM replay_studio_runs WHERE tenant=? AND created>=?',ctx.tenant,today).n;
   if(n>=20)throw Error('Daily replay limit exceeded');
   this.engine.run('INSERT INTO replay_studio_runs VALUES(?,?,?,?,?,?)',id,ctx.tenant,claim.run_at,claim.scenario_sha256,claim.result_sha256,JSON.stringify(receipt));
   this.engine.stamp(ctx,'replay.synthetic_signed',id,{scenario_sha256:claim.scenario_sha256,result_sha256:claim.result_sha256});
  });
  return receipt;
 }
 list(ctx){this.engine.permitted(ctx,'admin','sponsor','auditor');return this.engine.rows('SELECT id,created,scenario_sha256,result_sha256 FROM replay_studio_runs WHERE tenant=? ORDER BY created DESC LIMIT 30',ctx.tenant);}
 find(ctx,id){this.engine.permitted(ctx,'admin','sponsor','auditor');if(!/^rep_[0-9a-f-]{36}$/.test(id))throw Error('Not found');const row=this.engine.row('SELECT receipt_json FROM replay_studio_runs WHERE tenant=? AND id=?',ctx.tenant,id);if(!row)throw Error('Not found');return JSON.parse(row.receipt_json);}
}
export function verifyReplayReceipt(receipt,{trustedKeyId=null}={}){
 const signed=verifyTheaterReceipt(receipt,{trustedKeyId});if(!signed.valid)return {valid:false,reason:'Signature invalid'};
 const c=signed.payload;
 if(c?.schema!=='aifirst.replay.local_claim.v1'||c?.kernel!=='aifirst.replay.kernel.v1'||c?.assertions?.production_release!==false)return {valid:false,reason:'Invalid claim type'};
 try{
  if(sha(canonicalJson(c.input))!==c.scenario_sha256)return {valid:false,reason:'Input digest mismatch'};
  const expected=runReplay(c.input);
  if(sha(canonicalJson(expected))!==c.result_sha256)return {valid:false,reason:'Replay result mismatch'};
  if(canonicalJson(expected)!==canonicalJson(c.result))return {valid:false,reason:'Claimed output differs from reference replay'};
  return {valid:true,issuer_trusted:signed.issuer_trusted,replay_matched:true,key_id:signed.key_id,production_release:false};
 }catch{return {valid:false,reason:'Invalid replay input'};}
}
