/** Private metadata-only trace intelligence for observed agent activity.
 * Stores tenant-HMAC pseudonyms and bounded non-content telemetry, never raw prompts,
 * outputs, tool arguments, source refs or local file paths. NOT an agent-quality ranking.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';

const DATE=/^\d{4}-\d\d-\d\dT\d\d:\d\d:/;
const SHORT=/^[a-z0-9:_-]{1,75}$/i;
const permittedTypes=new Set(['tool_call','llm_call','llm_request','turn','user_message','agent_final_answer','context_compaction','task_prompt','session_start','harness_injection','agent_message','goal_update','chat_request']);
const statuses=new Set(['ok','completed','error','failed','timeout','cancelled','tool_use','end_turn','interrupted','no_result','running','inProgress','async_launched','generating']);
function saneTime(t){return typeof t==='string'&&DATE.test(t)&&Number.isFinite(Date.parse(t))?t:null}
function family(name){const n=String(name||'').toLowerCase();if(/bash|shell|terminal|exec|command/.test(n))return 'shell';if(/read|open|cat|search_file/.test(n))return 'file_read';if(/write|edit|patch|save/.test(n))return 'file_write';if(/search|browse|web|fetch/.test(n))return 'search';if(/task|agent|notify|plan|wait|inbox/.test(n))return 'coordination';return name?'other':null}
function safeStat(x){return typeof x==='number'&&Number.isSafeInteger(x)&&x>=0&&x<1e13?x:0}
function fileCheck(file,maxBytes){const p=path.resolve(file);const s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||s.size>maxBytes||!s.size)throw Error('Unsafe or empty input file');return p}
async function digest(file){const h=crypto.createHash('sha256');for await(const buf of fs.createReadStream(file))h.update(buf);return h.digest('hex')}
function object(x){return x&&typeof x==='object'&&!Array.isArray(x)}

export class TraceIntelligence {
 constructor(engine){this.engine=engine;this.db=engine.db;this.root=engine.root;this.db.exec(`
 CREATE TABLE IF NOT EXISTS trace_imports(tenant TEXT NOT NULL,id TEXT NOT NULL,runs_sha TEXT NOT NULL,events_sha TEXT NOT NULL,created TEXT NOT NULL,run_count INTEGER NOT NULL,event_count INTEGER NOT NULL,invalid_count INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(tenant,id));
 CREATE TABLE IF NOT EXISTS trace_runs(tenant TEXT NOT NULL,import_id TEXT NOT NULL,id TEXT NOT NULL,trace TEXT,parent TEXT,system TEXT NOT NULL,started TEXT,ended TEXT,outcome TEXT,agent_count INTEGER,tool_calls INTEGER,tool_errors INTEGER,tests INTEGER,tests_failed INTEGER,with_critique INTEGER,with_human INTEGER,version_observed INTEGER,declared_events INTEGER,actual_events INTEGER DEFAULT 0,PRIMARY KEY(tenant,import_id,id));
 CREATE INDEX IF NOT EXISTS ti_runs ON trace_runs(tenant,import_id,system);
 CREATE TABLE IF NOT EXISTS trace_kind_counts(tenant TEXT NOT NULL,import_id TEXT NOT NULL,kind TEXT NOT NULL,n INTEGER NOT NULL,PRIMARY KEY(tenant,import_id,kind));
 CREATE TABLE IF NOT EXISTS trace_observation_counts(tenant TEXT NOT NULL,import_id TEXT NOT NULL,observation TEXT NOT NULL,n INTEGER NOT NULL,PRIMARY KEY(tenant,import_id,observation));
 CREATE TABLE IF NOT EXISTS trace_events(tenant TEXT NOT NULL,import_id TEXT NOT NULL,run TEXT NOT NULL,seq INTEGER NOT NULL,at TEXT,kind TEXT NOT NULL,family TEXT,status TEXT,agent TEXT,span TEXT,parent_span TEXT,observation TEXT,PRIMARY KEY(tenant,import_id,run,seq));
 CREATE INDEX IF NOT EXISTS ti_events ON trace_events(tenant,import_id,run,seq);
 CREATE INDEX IF NOT EXISTS ti_agents ON trace_events(tenant,import_id,agent);
 `);}
 allowed(ctx){this.engine.permitted(ctx,'admin','auditor','security');if(!ctx.tenant)throw Error('Invalid tenant')}
 secret(){const p=path.join(this.root,'trace-intelligence.key');if(fs.existsSync(p)){const s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||(s.mode&0o077)!==0)throw Error('Unsafe trace pseudonym key permissions');const k=fs.readFileSync(p);if(k.length!==32)throw Error('Invalid trace pseudonym key');return k} const k=crypto.randomBytes(32);fs.writeFileSync(p,k,{flag:'wx',mode:0o600});return k}
 alias(secret,tenant,kind,value){if(!value||typeof value!=='string')return null;return kind+'_'+crypto.createHmac('sha256',secret).update(tenant+'\x00'+kind+'\x00'+value).digest('hex').slice(0,24)}
 async importFiles(ctx,{runsFile,eventsFile,ackConfidential=false,maxEvents=1000000}={}){
  this.allowed(ctx);if(ackConfidential!==true)throw Error('Explicit confidential local-import acknowledgement required');
  if(!Number.isSafeInteger(maxEvents)||maxEvents<1||maxEvents>2000000)throw Error('Invalid event limit');
  const runsPath=fileCheck(runsFile,60*1024*1024), eventsPath=fileCheck(eventsFile,1024*1024*1024);
  const runs=JSON.parse(fs.readFileSync(runsPath,'utf8'));if(!Array.isArray(runs)||!runs.length||runs.length>30000)throw Error('Invalid run inventory');
  const key=this.secret(),tenant=ctx.tenant;
  const runsSha=await digest(runsPath),eventsSha=await digest(eventsPath);
  const importId=this.alias(key,tenant,'imp',runsSha+':'+eventsSha);
  const old=this.db.prepare('SELECT * FROM trace_imports WHERE tenant=? AND id=?').get(tenant,importId);
  if(old)return {id:importId,run_count:old.run_count,event_count:old.event_count,idempotent:true,classification:'CONFIDENTIAL_LOCAL_ONLY',production_release:false};
  const runMap=new Map();
  for(const run of runs){if(!object(run)||typeof run.run_id!=='string'||!SHORT.test(run.run_id)||runMap.has(run.run_id)||!['codex','claude-code','vscode-copilot','copilot-cli'].includes(run.system))throw Error('Invalid or duplicate run metadata');runMap.set(run.run_id,run)}
  const insertRun=this.db.prepare('INSERT INTO trace_runs(tenant,import_id,id,trace,parent,system,started,ended,outcome,agent_count,tool_calls,tool_errors,tests,tests_failed,with_critique,with_human,version_observed,declared_events) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  const insertEvent=this.db.prepare('INSERT INTO trace_events(tenant,import_id,run,seq,at,kind,family,status,agent,span,parent_span,observation) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
  const insertKind=this.db.prepare('INSERT INTO trace_kind_counts VALUES(?,?,?,?)');
  const insertObservation=this.db.prepare('INSERT INTO trace_observation_counts VALUES(?,?,?,?)');
  this.db.exec('BEGIN IMMEDIATE');let count=0,stored=0,invalid=0;
  try{
   for(const r of runs){const m=object(r.metrics)?r.metrics:{};insertRun.run(tenant,importId,this.alias(key,tenant,'run',r.run_id),this.alias(key,tenant,'trace',r.trace_id),this.alias(key,tenant,'run',r.parent_run_id),r.system,saneTime(r.started),saneTime(r.ended),['success','failure','unknown','failed','partial'].includes(r.outcome)?r.outcome:'unknown',Array.isArray(r.agents)?r.agents.length:0,safeStat(m.tool_calls),safeStat(m.tool_errors),safeStat(m.tests),safeStat(m.tests_failed),r.has_critique?1:0,r.has_human_decision?1:0,r.version_compare?1:0,safeStat(r.event_count))}
   const counts=new Map(),kinds=new Map(),observations=new Map();const stream=readline.createInterface({input:fs.createReadStream(eventsPath,{encoding:'utf8'}),crlfDelay:Infinity});
   for await(const line of stream){if(!line.trim())continue;count++;if(count>maxEvents)throw Error('Event limit exceeded');if(line.length>24000)throw Error('Unexpected oversized event record');let e;try{e=JSON.parse(line)}catch{throw Error('Malformed JSONL event')}
    if(!object(e)||typeof e.run_id!=='string'||!runMap.has(e.run_id))throw Error('Event has no matching run');
    const rid=this.alias(key,tenant,'run',e.run_id),seq=(counts.get(e.run_id)||0)+1;counts.set(e.run_id,seq);
    const rawKind=typeof e.event_type==='string'&&SHORT.test(e.event_type)?e.event_type:'unknown';
    const kind=permittedTypes.has(rawKind)?rawKind:(rawKind.startsWith('hook')?'hook':rawKind.startsWith('inbox')?'coordination':'other');
    const status=statuses.has(e.status)?e.status:null;
    if(e.data_classification!=='confidential'&&e.data_classification!=='synthetic'&&e.data_classification!=='internal')throw Error('Unknown event classification');
    const observation=e.observation==='REAL_OBSERVED'?'OBSERVED':e.observation==='DERIVED'?'DERIVED':'UNKNOWN';
    kinds.set(kind,(kinds.get(kind)||0)+1);observations.set(observation,(observations.get(observation)||0)+1);
    // Exact counts of ALL records; materialize only diagnostically useful or evenly sampled events.
    // NOT an exact full-span replay: deliberately avoids copying the confidential raw ledger.
    const meaningful=['error','failed','timeout','cancelled'].includes(status)||['agent_final_answer','task_prompt','agent_message','hook','coordination'].includes(kind);
    const keep=meaningful||seq<=5||seq>runMap.get(e.run_id).event_count-5||seq%25===0;
    if(keep){insertEvent.run(tenant,importId,rid,seq,saneTime(e.timestamp),kind,family(e.tool_name),status,this.alias(key,tenant,'agent',e.agent_id),this.alias(key,tenant,'span',e.span_id),this.alias(key,tenant,'span',e.parent_span_id),observation);stored++}
   }
   for(const [id,r] of runMap){const observed=counts.get(id)||0;if(observed!==r.event_count)throw Error('Run event count mismatch');this.db.prepare('UPDATE trace_runs SET actual_events=? WHERE tenant=? AND import_id=? AND id=?').run(observed,tenant,importId,this.alias(key,tenant,'run',id))}
   for(const [kind,n] of kinds)insertKind.run(tenant,importId,kind,n);
   for(const [observation,n] of observations)insertObservation.run(tenant,importId,observation,n);
   this.db.prepare('INSERT INTO trace_imports VALUES(?,?,?,?,?,?,?,?)').run(tenant,importId,runsSha,eventsSha,new Date().toISOString(),runs.length,count,invalid);
   this.db.exec('COMMIT');
  }catch(e){this.db.exec('ROLLBACK');throw e}
  return {id:importId,run_count:runs.length,event_count:count,stored_timeline_events:stored,idempotent:false,classification:'CONFIDENTIAL_LOCAL_ONLY',production_release:false};
 }
 newest(ctx){this.allowed(ctx);return this.db.prepare('SELECT id,created,run_count,event_count,invalid_count FROM trace_imports WHERE tenant=? ORDER BY created DESC LIMIT 1').get(ctx.tenant)||null}
 summary(ctx){this.allowed(ctx);const b=this.newest(ctx);if(!b)return {imported:false,classification:'CONFIDENTIAL_LOCAL_ONLY',production_release:false};const tenant=ctx.tenant;
  const all=this.db.prepare('SELECT system,COUNT(*) runs,SUM(tool_calls) tool_calls,SUM(tool_errors) tool_errors,SUM(tests) tests,SUM(tests_failed) tests_failed,SUM(with_critique) with_critique,SUM(with_human) with_human,SUM(version_observed) version_observed FROM trace_runs WHERE tenant=? AND import_id=? GROUP BY system ORDER BY runs DESC').all(tenant,b.id);
  const obs=this.db.prepare('SELECT observation,n events FROM trace_observation_counts WHERE tenant=? AND import_id=?').all(tenant,b.id);
  const events=this.db.prepare('SELECT kind,n events FROM trace_kind_counts WHERE tenant=? AND import_id=? ORDER BY n DESC LIMIT 15').all(tenant,b.id);
  const agents=this.db.prepare('SELECT COUNT(DISTINCT agent) n FROM trace_events WHERE tenant=? AND import_id=? AND agent IS NOT NULL').get(tenant,b.id).n;
  const sampled_events=this.db.prepare('SELECT COUNT(*) n FROM trace_events WHERE tenant=? AND import_id=?').get(tenant,b.id).n;
  return {imported:true,batch:b,systems:all,event_kinds:events,observations:obs,agent_alias_count:agents,timeline_events_stored:sampled_events,timeline_sampling:'errors+finals+coordination+first_last_five+every_25th',classification:'CONFIDENTIAL_LOCAL_ONLY',production_release:false,quality_comparison_valid:false};}
 runs(ctx,{limit=50,offset=0,system=null}={}){this.allowed(ctx);const b=this.newest(ctx);if(!b)return {runs:[]};if(!Number.isInteger(limit)||limit<1||limit>100||!Number.isInteger(offset)||offset<0||offset>100000)throw Error('Invalid pagination');if(system&&!['codex','claude-code','vscode-copilot','copilot-cli'].includes(system))throw Error('Invalid system');const rows=system?this.db.prepare('SELECT * FROM trace_runs WHERE tenant=? AND import_id=? AND system=? ORDER BY tool_errors DESC,tests_failed DESC,started DESC LIMIT ? OFFSET ?').all(ctx.tenant,b.id,system,limit,offset):this.db.prepare('SELECT * FROM trace_runs WHERE tenant=? AND import_id=? ORDER BY tool_errors DESC,tests_failed DESC,started DESC LIMIT ? OFFSET ?').all(ctx.tenant,b.id,limit,offset);return {batch:b.id,runs:rows.map(r=>({...r,audit_priority:(r.tool_errors>0||r.tests_failed>0||r.outcome==='unknown')?'REVIEW':'ROUTINE',quality_score:null}))};}
 events(ctx,id,{limit=100,offset=0}={}){this.allowed(ctx);if(typeof id!=='string'||!/^run_[a-f0-9]{24}$/.test(id))throw Error('Invalid run identifier');if(!Number.isInteger(limit)||limit<1||limit>250||!Number.isInteger(offset)||offset<0||offset>1000000)throw Error('Invalid pagination');const b=this.newest(ctx);if(!b)return {events:[]};const r=this.db.prepare('SELECT id,system,outcome,started,ended FROM trace_runs WHERE tenant=? AND import_id=? AND id=?').get(ctx.tenant,b.id,id);if(!r)throw Error('Run not found');return {run:r,events:this.db.prepare('SELECT seq,at,kind,family,status,agent,span,parent_span,observation FROM trace_events WHERE tenant=? AND import_id=? AND run=? ORDER BY seq LIMIT ? OFFSET ?').all(ctx.tenant,b.id,id,limit,offset),no_raw_content:true,sampled_timeline:true};}
 candidates(ctx,{limit=30}={}){this.allowed(ctx);if(!Number.isInteger(limit)||limit<1||limit>100)throw Error('Invalid limit');const b=this.newest(ctx);if(!b)return {cases:[]};const rows=this.db.prepare("SELECT id,system,outcome,tool_calls,tool_errors,tests,tests_failed,with_critique,with_human,version_observed,declared_events FROM trace_runs WHERE tenant=? AND import_id=? AND (tool_errors>0 OR tests_failed>0 OR with_critique=1 OR outcome='unknown') ORDER BY tests_failed DESC,tool_errors DESC,with_critique DESC LIMIT ?").all(ctx.tenant,b.id,limit);return {cases:rows.map(x=>({run_id:x.id,system:x.system,observed:{tool_calls:x.tool_calls,tool_errors:x.tool_errors,tests:x.tests,tests_failed:x.tests_failed,has_critique:!!x.with_critique,has_human_decision:!!x.with_human,has_versions:!!x.version_observed},reasons:[...(x.tests_failed?['TEST_FAILURE']:[]),...(x.tool_errors?['TOOL_ERRORS']:[]),...(x.with_critique?['EXISTING_CRITIQUE']:[]),...(x.outcome==='unknown'?['INCOMPLETE_OUTCOME']:[])],next_gate:'AUTHORIZED_HUMAN_EVIDENCE_REVIEW',promotable:false,benchmark_independent:false})),no_private_inputs:true,automatic_promotions:false};}
 graph(ctx,{limit=150}={}){this.allowed(ctx);if(!Number.isInteger(limit)||limit<1||limit>200)throw Error('Invalid limit');const b=this.newest(ctx);if(!b)return {nodes:[],edges:[]};const nodes=this.db.prepare('SELECT id,system,trace,parent,outcome,actual_events FROM trace_runs WHERE tenant=? AND import_id=? ORDER BY actual_events DESC LIMIT ?').all(ctx.tenant,b.id,limit);const ids=new Set(nodes.map(x=>x.id));return {nodes,edges:nodes.filter(x=>x.parent&&ids.has(x.parent)).map(x=>({from:x.parent,to:x.id,kind:'parent_run'})),metadata_only:true};}
}
