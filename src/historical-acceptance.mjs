/**
 * AIFIRST historical decision acceptance, v0.1.
 * PRIVATE and OBSERVATIONAL: no LLM inference, no independent judge, no promotion.
 * Case files remain on the owner's machine. Database stores only allowlisted counters/signals.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const HISTORICAL_POLICY='historical.acceptance.v1';
export const CASES=Object.freeze({
 S01:{title:'Constructor + tres revisores',rule:'REVIEW_CHAIN'},
 S02:{title:'Fallo y reintento observado',rule:'RETRY_RECOVERY'},
 S03:{title:'Fallo que detiene la fábrica',rule:'FAILURE_OVERRIDES_TESTS'},
 S04:{title:'Violación de límite sensible',rule:'SECURITY_VETO'},
 S05:{title:'Gate DoR no preparado',rule:'DOR_BLOCK'},
 S06:{title:'Corrección entre rondas de SDD',rule:'SDD_ROUNDS'},
 S07:{title:'HOLD adversarial',rule:'ADVERSARIAL_HOLD'},
 S08:{title:'Timeout inyectado, recuperado',rule:'INJECTED_RESILIENCE'},
 S10:{title:'Juez rechaza todos los casos',rule:'JUDGE_CALIBRATION'},
 S11:{title:'Prompt A/B con juez heurístico',rule:'HEURISTIC_AB'},
});
const SHA=/^[a-f0-9]{64}$/i;
const CASE_RE=/^S(?:0[1-8]|10|11)$/;
const allExpected=Object.keys(CASES);
const maxSampleBytes=4_000_000;
const count=(a,p)=>a.filter(p).length;
const isRecord=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const makeHash=v=>crypto.createHash('sha256').update(v).digest('hex');
const safeNumber=v=>Number.isSafeInteger(v)&&v>=0?v:0;
const includes=(x,p)=>String(x||'').toLowerCase().includes(p);
const sampleSignals=s=>{
 const runs=s.runs,ev=s.events,evals=s.evaluations;
 const verdicts=evals.map(x=>String(x.verdict||x.verdict_normalized||'').trim().toLowerCase());
 const statuses=ev.map(x=>String(x.status||'').toLowerCase());
 const outcomes=runs.map(x=>String(x.outcome||'unknown').toLowerCase());
 const reviewRejected=verdicts.some(v=>['hold','not ready','fail','violation','all_rejected'].includes(v));
 const securityVeto=verdicts.includes('violation')||statuses.some(v=>/sensitive_data_boundary_violation/.test(v));
 const findings=evals.reduce((n,x)=>n+safeNumber(x.detail?.findings_headings),0);
 const timeout=statuses.some(v=>v.includes('provider_timeout'));
 const improved=count(evals,x=>String(x.verdict)==='improved');
 const worsened=count(evals,x=>String(x.verdict)==='worsened');
 const equal=count(evals,x=>String(x.verdict)==='no_change');
 return {runs:runs.length,events:ev.length,evaluations:evals.length,
     real_observed_events:count(ev,x=>x.observation==='REAL_OBSERVED'),
     derived_events:count(ev,x=>x.observation==='DERIVED'),
     failed_runs:outcomes.filter(v=>v==='failure').length,
     successful_runs:outcomes.filter(v=>v==='success').length,
     rejected_runs:outcomes.filter(v=>v==='rejected').length,
     security_veto:securityVeto,
     recorded_review_rejection:reviewRejected,
     findings_headings:findings,
     retry_flagged:runs.some(x=>x.has_retry===true),
     injected_timeout:timeout,
     ab_heuristic:{improved,worsened,equal,scored:improved+worsened+equal},
     recorded_gate_labels:[...new Set(verdicts.filter(v=>['hold','not ready','ready','done','archive','violation','all_rejected'].includes(v)))].sort(),
     source_harness: ev.some(x=>x.observation==='SYNTHETIC')?'SYNTHETIC_TEST_FIXTURE':s.sample_id==='S08'?'INJECTED':s.sample_id==='S11'?'HEURISTIC':'HISTORICAL_METADATA'};
};
function assess(s){
 const f=sampleSignals(s),id=s.sample_id,issues=[],checks=[];
 const gate=(name,passed)=>{checks.push({name,passed:!!passed});if(!passed)issues.push(name)};
 switch(id){
  case 'S01':gate('review_chain_has_multi_runs',f.runs>=4);gate('recorded_reviewer_evaluations',f.evaluations>=3);break;
  case 'S02':gate('contains_failed_attempt',f.failed_runs>0);gate('contains_later_completion',f.successful_runs>0);gate('retry_label_present',f.retry_flagged);break;
  case 'S03':gate('factory_failure_recorded',f.failed_runs>0);gate('contains_passing_tests',s.evaluations.some(x=>x.verdict==='pass'));break;
  case 'S04':gate('sensitive_data_violation_recorded',f.security_veto);gate('false_success_detected',f.successful_runs>0);break;
  case 'S05':gate('not_ready_gate_recorded',f.recorded_gate_labels.includes('not ready'));break;
  case 'S06':for(const verdict of ['not ready','ready','done','archive'])gate(`contains_${verdict.replaceAll(' ','_')}`,f.recorded_gate_labels.includes(verdict));break;
  case 'S07':gate('adversarial_hold_recorded',f.recorded_gate_labels.includes('hold'));gate('adversarial_findings_present',f.findings_headings>0);break;
  case 'S08':gate('injected_timeout_recorded',f.injected_timeout);gate('recovery_recorded',f.successful_runs>0);break;
  case 'S10':gate('all_rejected_by_original_judge',f.recorded_gate_labels.includes('all_rejected'));break;
  case 'S11':gate('paired_heuristic_scores_recorded',f.ab_heuristic.scored>0);gate('two_variants_recorded',s.runs.length===2);break;
 }
 // These are historical evidence consistency tests, never empirical quality verdicts.
 const decision=issues.length?'INVALID_EVIDENCE':f.security_veto?'SECURITY_HOLD':id==='S02'?'RECOVERY_WITH_PRIOR_FAILURE':id==='S06'?'SDD_REMEDIATION_OBSERVED':f.recorded_review_rejection?'RECORDED_GATE_HOLD':f.failed_runs?'RECORDED_FAILURE':id==='S08'?'INJECTED_RECOVERY':id==='S11'?'HEURISTIC_COMPARISON':'HISTORICAL_GATE_OBSERVED';
 const caution=id==='S11'?'HEURISTIC_NOT_INDEPENDENT':id==='S08'?'INJECTED_FAILURE_NOT_FIELD_RELIABILITY':id==='S06'?'SAME_CHANGE_TUNED_TO_PREVIOUS_FEEDBACK':id==='S01'?'REVIEWERS_NOT_INDEPENDENT':id==='S10'?'JUDGE_CALIBRATION_NOT_ESTABLISHED':'OBSERVATIONAL_NO_REPRODUCTION';
 return {case_id:id,title:CASES[id].title,rule:CASES[id].rule,checks,signals:f,decision,caution,release_gate:'BLOCKED_NO_INDEPENDENT_BENCHMARK',promote_allowed:false,rollback_tested:false,independent_jury_verified:false,historical_replay_only:true};
}
function readSafe(full,max){const st=fs.lstatSync(full);if(!st.isFile()||st.isSymbolicLink()||st.size<=0||st.size>max)throw Error('Invalid size or unsafe source file');return fs.readFileSync(full)}
function validateSample(obj,key,{allowSynthetic=false}={}){
 if(!isRecord(obj)||obj.sample_id!==key||!Array.isArray(obj.runs)||!Array.isArray(obj.events)||!Array.isArray(obj.evaluations)||obj.events.length>15000||obj.runs.length>100||obj.evaluations.length>5000)throw Error(`Invalid sample schema: ${key}`);
 if(obj.runs.length<1)throw Error(`Empty sample runs: ${key}`);
 // No payload text, source evidence or hash values are persisted or returned.
 if(obj.events.some(x=>!isRecord(x)||!(['REAL_OBSERVED','DERIVED'].includes(x.observation)||(allowSynthetic&&x.observation==='SYNTHETIC'))||x.data_classification!=='internal'))throw Error(`Unapproved event classification: ${key}`);
 if(obj.runs.some(x=>!isRecord(x)||typeof x.run_id!=='string'||!/^run_[a-f\d]{16,64}$/.test(x.run_id)))throw Error(`Invalid run identifier: ${key}`);
 return assess(obj);
}
export function evaluateHistoricalSample(obj,{allowSynthetic=false}={}){if(!Object.hasOwn(CASES,obj?.sample_id))throw Error('Unknown historical case');return validateSample(obj,obj.sample_id,{allowSynthetic})}

export class HistoricalAcceptance {
 constructor(engine){this.engine=engine;this.db=engine.db;this.root=engine.root;this.db.exec(`
 CREATE TABLE IF NOT EXISTS historical_acceptance_batches(tenant TEXT NOT NULL,batch_id TEXT NOT NULL,manifest_sha TEXT NOT NULL,imported_at TEXT NOT NULL,case_count INTEGER NOT NULL,corpus_batch TEXT,PRIMARY KEY(tenant,batch_id));
 CREATE TABLE IF NOT EXISTS historical_acceptance_cases(tenant TEXT NOT NULL,batch_id TEXT NOT NULL,case_id TEXT NOT NULL,decision TEXT NOT NULL,rule TEXT NOT NULL,signals_json TEXT NOT NULL,checks_json TEXT NOT NULL,caution TEXT NOT NULL,release_gate TEXT NOT NULL,PRIMARY KEY(tenant,batch_id,case_id));
 `)}
 authorize(ctx){this.engine.permitted(ctx,'admin','auditor','security');if(!ctx?.tenant)throw Error('Tenant required')}
 latest(ctx){this.authorize(ctx);return this.db.prepare('SELECT batch_id,imported_at,case_count,corpus_batch FROM historical_acceptance_batches WHERE tenant=? ORDER BY imported_at DESC LIMIT 1').get(ctx.tenant)||null}
 importSamples(ctx,{directory,ackPrivate=false,allowSynthetic=false}={}){
  this.authorize(ctx);if(!ackPrivate)throw Error('Explicit private import approval required');
  const dir=path.resolve(directory||'');if(!fs.lstatSync(dir).isDirectory()||fs.lstatSync(dir).isSymbolicLink())throw Error('Unsafe corpus directory');
  const manifestBuf=readSafe(path.join(dir,'10_PROVENANCE_MANIFEST.json'),4_000_000);
  const manifest=JSON.parse(manifestBuf.toString('utf8'));
  if(!Array.isArray(manifest.files))throw Error('Invalid package manifest');
  const entries=new Map();for(const x of manifest.files){if(typeof x.path!=='string'||!SHA.test(x.sha256)||entries.has(x.path))throw Error('Duplicate or invalid manifest file entry');entries.set(x.path,x.sha256)}
  const reports=[];
  for(const key of allExpected){
   const suffix=[...entries.keys()].filter(x=>x.startsWith('SAMPLES/'+key+'_')&&x.endsWith('.json'));
   if(suffix.length!==1)throw Error(`Required case missing or ambiguous: ${key}`);
   const rel=suffix[0],base=path.basename(rel);
   const actual=path.resolve(dir,'SAMPLES',base);
   const bytes=readSafe(actual,maxSampleBytes);
   if(makeHash(bytes)!==entries.get(rel))throw Error(`SHA-256 provenance mismatch: ${key}`);
   reports.push(validateSample(JSON.parse(bytes.toString('utf8')),key,{allowSynthetic}));
  }
  const digest=makeHash(manifestBuf),tenant=ctx.tenant;
  const bid='hist_'+crypto.createHash('sha256').update(tenant+'\0'+digest+'\0'+HISTORICAL_POLICY).digest('hex').slice(0,24);
  if(this.db.prepare('SELECT 1 FROM historical_acceptance_batches WHERE tenant=? AND batch_id=?').get(tenant,bid))return {batch_id:bid,idempotent:true,case_count:reports.length,production_ready:false};
  const corpusBatch=this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='corpus_batches'").get()?this.db.prepare('SELECT id FROM corpus_batches WHERE tenant=? ORDER BY created DESC LIMIT 1').get(tenant)?.id:null;
  this.db.exec('BEGIN IMMEDIATE');try{
   this.db.prepare('INSERT INTO historical_acceptance_batches VALUES(?,?,?,?,?,?)').run(tenant,bid,digest,new Date().toISOString(),reports.length,corpusBatch??null);
   const stmt=this.db.prepare('INSERT INTO historical_acceptance_cases VALUES(?,?,?,?,?,?,?,?,?)');
   for(const r of reports)stmt.run(tenant,bid,r.case_id,r.decision,r.rule,JSON.stringify(r.signals),JSON.stringify(r.checks),r.caution,r.release_gate);
   this.db.exec('COMMIT');
  }catch(err){this.db.exec('ROLLBACK');throw err}
  return {batch_id:bid,idempotent:false,case_count:reports.length,checks_passed:reports.reduce((x,r)=>x+count(r.checks,c=>c.passed),0),checks_failed:reports.reduce((x,r)=>x+count(r.checks,c=>!c.passed),0),production_ready:false,private_only:true,linked_corpus_batch:!!corpusBatch};
 }
 list(ctx){this.authorize(ctx);const b=this.latest(ctx);if(!b)return {imported:false,cases:[]};const rows=this.db.prepare('SELECT case_id,decision,rule,caution,signals_json,checks_json,release_gate FROM historical_acceptance_cases WHERE tenant=? AND batch_id=? ORDER BY case_id').all(ctx.tenant,b.batch_id);return {imported:true,batch:b,policy:HISTORICAL_POLICY,cases:rows.map(x=>({case_id:x.case_id,title:CASES[x.case_id].title,decision:x.decision,rule:x.rule,caution:x.caution,signals:JSON.parse(x.signals_json),checks:JSON.parse(x.checks_json),release_gate:x.release_gate,promote_allowed:false,independent_jury_verified:false})),automated_promotions:0,private_only:true,original_payloads_stored:false};}
 find(ctx,caseId){if(!CASE_RE.test(caseId)||!Object.hasOwn(CASES,caseId))throw Error('Unknown historical case');const r=this.list(ctx);return {...r,cases:r.cases.filter(x=>x.case_id===caseId)}}
}
