/** AIFIRST local-first secure pilot engine. Node 22+ / node:sqlite, no npm dependencies.
 * This is NOT production identity verification, money movement, external AV attestation or a legal signoff.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const ROLES = new Set(['admin','sales','sponsor','security','juror','finance','auditor']);
const SHA = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9:_-]{2,100}$/;
const DECISIONS = ['G0','G1','G2','G3','G4','G5','G6','G7'];
const EX = [
 ['EX01','CEO Report (PDF)','CEO / Comité','PDF'],
 ['EX02','Board Presentation','Comité de dirección','PPTX/PDF'],
 ['EX03','Solution Portfolio','CIO / Innovación','HTML + CSV'],
 ['EX04','Capability Atlas agregado','RRHH / Formación','HTML + CSV'],
 ['EX05','Knowledge Graph','Transformación / Arquitectura','Graph JSON + HTML'],
 ['EX06','Org Scenario Pack','Dirección / RRHH','PDF + JSON restringido'],
 ['EX07','Roadmap 30/60/90','PMO / Sponsors','CSV/JSON/PM tool'],
 ['EX08','Technical & Risk Annex','TI / DPO / Seguridad','PDF + JSON'],
 ['EX09','Feedback privado','Participante autorizado','PDF/Portal'],
 ['EX10','Activation Bundle','Equipo de ejecución','PM tool / JSON'],
 ['EX11','Audit / Exit Bundle','Cliente / Auditoría','ZIP cifrado + CSV']
];
const clean = x => typeof x === 'string' && x.trim().length > 0 && x.length <= 2048;
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const id = () => crypto.randomUUID();
const safe = (x, label='identifier') => { if (!ID.test(x ?? '')) throw new Error(`Invalid ${label}`); return x; };
function object(o,label='body') { if (!o || typeof o!=='object' || Array.isArray(o)) throw new Error(`Invalid ${label}`);return o; }
function required(o, keys){object(o);for(const key of keys)if(!clean(o[key]))throw Error(`Missing or invalid ${key}`);}
function csvVal(x){let s=String(x??'');if(/^\s*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""').replace(/[\r\n]/g,' ')+'"';}
export const ORIGINAL_OUTPUTS=Object.freeze(EX.map(([id,name,audience,format])=>Object.freeze({id,name,audience,format})));

export class EditionRuntime {
  constructor(root,{scanner=null,agent=null,clock=()=>new Date().toISOString()}={}){
    this.root=path.resolve(root);this.clock=clock;this.scanner=scanner;this.agent=agent;
    fs.mkdirSync(this.root,{recursive:true,mode:0o700});
    if(fs.lstatSync(this.root).isSymbolicLink())throw Error('Symlink root not allowed');
    this.db=new DatabaseSync(path.join(this.root,'aifirst.sqlite'));
    this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000;');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tenants(id TEXT PRIMARY KEY,name TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS principals(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,role TEXT NOT NULL,token_hash TEXT UNIQUE NOT NULL,active INTEGER NOT NULL DEFAULT 1);
      CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,sector TEXT NOT NULL,problem TEXT NOT NULL,status TEXT NOT NULL,created TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS editions(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,title TEXT NOT NULL,baseline TEXT NOT NULL,rubric TEXT NOT NULL,stage TEXT NOT NULL,created TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS contracts(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,edition TEXT NOT NULL,sow_ref TEXT NOT NULL,dpa_ref TEXT NOT NULL,review TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS participants(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,edition TEXT NOT NULL,alias TEXT NOT NULL,ack INTEGER NOT NULL,UNIQUE(edition,alias));
      CREATE TABLE IF NOT EXISTS submissions(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,edition TEXT NOT NULL,participant TEXT NOT NULL,title TEXT NOT NULL,state TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS artifacts(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,edition TEXT NOT NULL,submission TEXT NOT NULL,name TEXT NOT NULL,sha TEXT NOT NULL,bytes INTEGER NOT NULL,scan TEXT NOT NULL,scan_ref TEXT,storage TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS gates(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,edition TEXT NOT NULL,gate TEXT NOT NULL,reviewer TEXT NOT NULL,decision TEXT NOT NULL,evidence TEXT NOT NULL,created TEXT NOT NULL,UNIQUE(edition,gate));
      CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,edition TEXT NOT NULL,submission TEXT NOT NULL,kind TEXT NOT NULL,model TEXT NOT NULL,status TEXT NOT NULL,estimated_eur REAL NOT NULL,output TEXT NOT NULL,created TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS evaluations(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,edition TEXT NOT NULL,submission TEXT NOT NULL,juror TEXT NOT NULL,score REAL NOT NULL,source_artifact TEXT NOT NULL,notes TEXT NOT NULL,created TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS scenarios(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,edition TEXT NOT NULL,name TEXT NOT NULL,cost_low REAL NOT NULL,cost_high REAL NOT NULL,risk TEXT NOT NULL,status TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS invoices(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,edition TEXT NOT NULL,reference TEXT NOT NULL,amount_cents INTEGER NOT NULL,currency TEXT NOT NULL,status TEXT NOT NULL,UNIQUE(tenant,reference));
      CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,invoice TEXT NOT NULL,bank_reference TEXT NOT NULL,amount_cents INTEGER NOT NULL,verified_by TEXT NOT NULL,created TEXT NOT NULL,UNIQUE(tenant,bank_reference));
      CREATE TABLE IF NOT EXISTS payouts(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,edition TEXT NOT NULL,kind TEXT NOT NULL,reference TEXT NOT NULL,amount_cents INTEGER NOT NULL,status TEXT NOT NULL,authorized_by TEXT);
      CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,entity TEXT NOT NULL,payload_hash TEXT NOT NULL,created TEXT NOT NULL);
    `);
  }
  close(){this.db.close();}
  row(sql,...args){return this.db.prepare(sql).get(...args);}
  rows(sql,...args){return this.db.prepare(sql).all(...args);}
  run(sql,...args){return this.db.prepare(sql).run(...args);}
  transaction(fn){this.db.exec('BEGIN IMMEDIATE');try{const r=fn();this.db.exec('COMMIT');return r;}catch(e){this.db.exec('ROLLBACK');throw e;}}
  stamp(ctx,action,entity,payload={}){this.run('INSERT INTO events VALUES(?,?,?,?,?,?,?)',id(),ctx.tenant,ctx.id,action,entity,digest(JSON.stringify(payload)),this.clock());}
  bootstrapTenant(name){if(!clean(name))throw Error('Invalid tenant name');const tenant='ten_'+id(),token=crypto.randomBytes(32).toString('base64url');const principal='usr_'+id();this.transaction(()=>{
    this.run('INSERT INTO tenants VALUES(?,?)',tenant,name);
    this.run('INSERT INTO principals(id,tenant,role,token_hash) VALUES(?,?,?,?)',principal,tenant,'admin',digest(token));
  });return {tenant,principal,token,warning:'TOKEN_SHOWN_ONCE_LOCAL_ONLY'};}
  auth(token){if(typeof token!=='string'||token.length<32||token.length>128)throw Error('Authentication required');const p=this.row('SELECT * FROM principals WHERE token_hash=? AND active=1',digest(token));if(!p)throw Error('Authentication required');return {id:p.id,tenant:p.tenant,role:p.role};}
  permitted(ctx,...roles){if(!roles.includes(ctx.role))throw Error('Forbidden role');}
  own(ctx,table,idValue){const legal=new Set(['editions','submissions','artifacts','invoices','participants','contracts','jobs','evaluations','scenarios']);if(!legal.has(table))throw Error('Invalid table');const row=this.row(`SELECT * FROM ${table} WHERE id=? AND tenant=?`,idValue,ctx.tenant);if(!row)throw Error('Not found');return row;}
  addPrincipal(ctx,role){this.permitted(ctx,'admin');if(!ROLES.has(role))throw Error('Bad role');const token=crypto.randomBytes(32).toString('base64url'),principal='usr_'+id();this.run('INSERT INTO principals(id,tenant,role,token_hash) VALUES(?,?,?,?)',principal,ctx.tenant,role,digest(token));this.stamp(ctx,'member.create',principal,{role});return {principal,role,token};}
  newLead(ctx,fields){this.permitted(ctx,'admin','sales');required(fields,['sector','problem']);const key='lead_'+id();this.run('INSERT INTO leads VALUES(?,?,?,?,?,?)',key,ctx.tenant,fields.sector,fields.problem,'QUALIFY',this.clock());this.stamp(ctx,'lead.create',key);return {id:key,status:'QUALIFY'};}
  newEdition(ctx,fields){this.permitted(ctx,'admin','sponsor');required(fields,['title','baseline']);const rubric=fields.rubric;
    if(!Array.isArray(rubric)||rubric.length<2||rubric.length>12||rubric.some(x=>!clean(x.key)||!Number.isFinite(x.weight)||x.weight<=0||x.weight>1)||Math.abs(rubric.reduce((s,x)=>s+x.weight,0)-1)>1e-9)throw Error('Invalid rubric');
    const key='ed_'+id();this.run('INSERT INTO editions VALUES(?,?,?,?,?,?,?)',key,ctx.tenant,fields.title,fields.baseline,JSON.stringify(rubric),'DRAFT',this.clock());this.stamp(ctx,'edition.create',key);return {id:key,stage:'DRAFT'};
  }
  recordContract(ctx,edition,fields){this.permitted(ctx,'admin','sponsor');this.own(ctx,'editions',edition);required(fields,['sow_ref','dpa_ref']);const key='con_'+id();this.run('INSERT INTO contracts VALUES(?,?,?,?,?,?)',key,ctx.tenant,edition,fields.sow_ref,fields.dpa_ref,'PENDING_SIGNATURE');this.stamp(ctx,'contract.record',key);return {id:key,status:'PENDING_SIGNATURE'};}
  register(ctx,edition,alias){this.permitted(ctx,'admin','sponsor');this.own(ctx,'editions',edition);safe(alias,'pseudonymous alias');const key='pt_'+id();this.run('INSERT INTO participants VALUES(?,?,?,?,?)',key,ctx.tenant,edition,alias,1);this.stamp(ctx,'participant.register',key);return {id:key,alias};}
  submit(ctx,edition,participant,title){this.permitted(ctx,'admin','sponsor');this.own(ctx,'editions',edition);const p=this.own(ctx,'participants',participant);if(p.edition!==edition)throw Error('Participant edition mismatch');if(!clean(title))throw Error('Title missing');const key='sub_'+id();this.run('INSERT INTO submissions VALUES(?,?,?,?,?,?)',key,ctx.tenant,edition,participant,title,'QUARANTINED');this.stamp(ctx,'submission.create',key);return {id:key,state:'QUARANTINED'};}
  async upload(ctx,submission,name,bytes,expectedSha){this.permitted(ctx,'admin','sponsor');const s=this.own(ctx,'submissions',submission);
    if(!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,100}$/.test(name)||name==='.'||name==='..')throw Error('Invalid artifact filename');
    if(!Buffer.isBuffer(bytes)||bytes.length===0||bytes.length>4*1024*1024)throw Error('File size invalid');if(!SHA.test(expectedSha)||digest(bytes)!==expectedSha)throw Error('SHA256 mismatch');
    const folder=path.join(this.root,'quarantine',ctx.tenant,s.edition);fs.mkdirSync(folder,{recursive:true,mode:0o700});
    if(fs.lstatSync(folder).isSymbolicLink())throw Error('Unsafe folder');const key='art_'+id(),dest=path.join(folder,key+'.bin');fs.writeFileSync(dest,bytes,{flag:'wx',mode:0o600});let verdict={status:'UNVERIFIED',reference:null};
    if(this.scanner){try{const r=await this.scanner(dest,expectedSha);if(r?.status==='CLEAN'&&clean(r.reference)&&r.sha256===expectedSha&&r.signature_valid===true)verdict={status:'CLEAN',reference:r.reference};else verdict={status:'QUARANTINED',reference:null};}catch{verdict={status:'QUARANTINED',reference:null};}}
    this.run('INSERT INTO artifacts VALUES(?,?,?,?,?,?,?,?,?,?)',key,ctx.tenant,s.edition,submission,name,expectedSha,bytes.length,verdict.status,verdict.reference,dest);
    this.stamp(ctx,'artifact.receive',key,{sha:expectedSha,status:verdict.status});return {id:key,sha256:expectedSha,scan:verdict.status,quarantine:true};
  }
  gate(ctx,edition,gate,evidence){this.own(ctx,'editions',edition);if(!DECISIONS.includes(gate))throw Error('Bad gate');if(!clean(evidence))throw Error('Evidence reference required');
    const roles={G0:['admin','sales'],G1:['admin'],G2:['admin','sponsor'],G3:['security'],G4:['juror'],G5:['admin','sponsor'],G6:['admin','sponsor'],G7:['admin','sponsor']};this.permitted(ctx,...roles[gate]);
    if(['G1','G5','G6','G7'].includes(gate))throw Error('External signatures and authority not integrated; gate unavailable');
    if(gate==='G3'){const a=this.rows('SELECT scan,scan_ref FROM artifacts WHERE tenant=? AND edition=?',ctx.tenant,edition);if(!a.length||a.some(x=>x.scan!=='CLEAN'||!x.scan_ref))throw Error('Unscanned artifacts: G3 blocked');}
    if(gate==='G4'){const e=this.rows('SELECT * FROM evaluations WHERE tenant=? AND edition=?',ctx.tenant,edition);if(!e.length)throw Error('Independent evaluation missing');}
    if(this.row('SELECT id FROM gates WHERE tenant=? AND edition=? AND gate=?',ctx.tenant,edition,gate))throw Error('Gate already recorded');
    const key='gate_'+id();this.run('INSERT INTO gates VALUES(?,?,?,?,?,?,?,?)',key,ctx.tenant,edition,gate,ctx.id,'LOCAL_REVIEW_ONLY',evidence,this.clock());this.stamp(ctx,'gate.local_review',key,{gate});return {id:key,gate,status:'LOCAL_REVIEW_ONLY',external_signature_verified:false};
  }
  async agentJob(ctx,submission,model,budgetEur){this.permitted(ctx,'admin','sponsor');const s=this.own(ctx,'submissions',submission);
    const g=this.row("SELECT * FROM gates WHERE tenant=? AND edition=? AND gate='G3'",ctx.tenant,s.edition);if(!g)throw Error('G3 local review required');
    if(!this.agent)throw Error('No real model adapter configured');if(!clean(model)||!Number.isFinite(budgetEur)||budgetEur<=0||budgetEur>100)throw Error('Invalid budget');
    const artifacts=this.rows('SELECT name,sha,scan FROM artifacts WHERE tenant=? AND submission=?',ctx.tenant,submission);if(!artifacts.length||artifacts.some(x=>x.scan!=='CLEAN'))throw Error('Artifacts not safe');
    const rubric=JSON.parse(this.own(ctx,'editions',s.edition).rubric);
    // Only metadata and hashes are sent, never untrusted binary or participant identity.
    const prompt=JSON.stringify({synthetic:process.env.AIFIRST_SYNTHETIC_DEMO==='1',project:s.title,artifacts:artifacts.map(x=>({name:x.name,sha256:x.sha})),rubric,rule:'Return evidence-limited project observations, never employee evaluations. No invented sources.'});
    const response=await this.agent({model,prompt,maxCostEur:budgetEur,tenant:ctx.tenant});
    if(!response||!clean(response.text)||!Number.isFinite(response.costEur)||response.costEur<0||response.costEur>budgetEur)throw Error('Provider returned invalid or over-budget result');
    const key='job_'+id();this.run('INSERT INTO jobs VALUES(?,?,?,?,?,?,?,?,?,?)',key,ctx.tenant,s.edition,submission,'PROJECT_DRAFT',model,'PENDING_HUMAN_REVIEW',response.costEur,JSON.stringify({text:response.text,evidence:artifacts.map(x=>x.sha)}),this.clock());
    this.stamp(ctx,'agent.run',key,{model,cost:response.costEur});return {id:key,status:'PENDING_HUMAN_REVIEW',costEur:response.costEur,external_model_invoked:true};
  }
  evaluate(ctx,submission,score,artifactId,notes){this.permitted(ctx,'juror');const s=this.own(ctx,'submissions',submission),a=this.own(ctx,'artifacts',artifactId);if(a.submission!==submission||a.scan!=='CLEAN')throw Error('Evidence inaccessible/unscanned');if(!Number.isFinite(score)||score<0||score>5||!clean(notes))throw Error('Bad evaluation');
    const key='eval_'+id();this.run('INSERT INTO evaluations VALUES(?,?,?,?,?,?,?,?,?)',key,ctx.tenant,s.edition,submission,ctx.id,score,artifactId,notes,this.clock());this.stamp(ctx,'evaluation.provisional',key);return {id:key,score,ranking:false,employment_decision:false};
  }
  addScenario(ctx,edition,scenario){this.permitted(ctx,'admin','sponsor');this.own(ctx,'editions',edition);required(scenario,['name','risk']);if(!Number.isFinite(scenario.cost_low)||!Number.isFinite(scenario.cost_high)||scenario.cost_low<0||scenario.cost_low>scenario.cost_high)throw Error('Invalid cost range');const key='scenario_'+id();this.run('INSERT INTO scenarios VALUES(?,?,?,?,?,?,?,?)',key,ctx.tenant,edition,scenario.name,scenario.cost_low,scenario.cost_high,scenario.risk,'REQUIRES_G5');this.stamp(ctx,'scenario.draft',key);return {id:key,status:'REQUIRES_G5'};}
  invoice(ctx,edition,reference,amountCents){this.permitted(ctx,'admin','finance');this.own(ctx,'editions',edition);safe(reference,'invoice reference');if(!Number.isSafeInteger(amountCents)||amountCents<=0)throw Error('Invalid invoice cents');const key='inv_'+id();this.run('INSERT INTO invoices VALUES(?,?,?,?,?,?,?)',key,ctx.tenant,edition,reference,amountCents,'EUR','DRAFT');this.stamp(ctx,'invoice.draft',key);return {id:key,reference,amountCents,status:'DRAFT',money_moved:false};}
  reconcile(ctx,invoiceId,bankReference,amountCents){this.permitted(ctx,'finance');const inv=this.own(ctx,'invoices',invoiceId);safe(bankReference,'bank reference');if(!Number.isSafeInteger(amountCents)||amountCents!==inv.amount_cents)throw Error('Amount mismatch');const key='payment_'+id();this.transaction(()=>{this.run('INSERT INTO payments VALUES(?,?,?,?,?,?,?)',key,ctx.tenant,invoiceId,bankReference,amountCents,ctx.id,this.clock());this.run("UPDATE invoices SET status='PAYMENT_REFERENCE_UNVERIFIED' WHERE id=? AND tenant=?",invoiceId,ctx.tenant);});this.stamp(ctx,'bank_payment.recorded',key);return {id:key,status:'PAYMENT_REFERENCE_UNVERIFIED',verified_by_bank_api:false,money_moved:false,proves_payment:false};}
  payout(ctx,edition,kind,reference,cents){this.permitted(ctx,'admin','finance');this.own(ctx,'editions',edition);if(!['PRIZE','JUROR','SUPPLIER'].includes(kind)||!Number.isSafeInteger(cents)||cents<=0)throw Error('Bad payout');safe(reference,'reference');const key='payout_'+id();this.run('INSERT INTO payouts VALUES(?,?,?,?,?,?,?,?)',key,ctx.tenant,edition,kind,reference,cents,'PENDING_EXTERNAL_PAYMENT',ctx.id);this.stamp(ctx,'payout.request',key);return {id:key,status:'PENDING_EXTERNAL_PAYMENT',money_moved:false};}
  dossier(ctx,edition){this.own(ctx,'editions',edition);this.permitted(ctx,'admin','sponsor','auditor');const editionRow=this.own(ctx,'editions',edition),submissions=this.rows('SELECT id,title,state FROM submissions WHERE tenant=? AND edition=?',ctx.tenant,edition),
    evaluated=this.rows('SELECT submission,score,source_artifact FROM evaluations WHERE tenant=? AND edition=?',ctx.tenant,edition),scenarios=this.rows('SELECT name,cost_low,cost_high,risk,status FROM scenarios WHERE tenant=? AND edition=?',ctx.tenant,edition),
    gates=this.rows('SELECT gate,decision,created FROM gates WHERE tenant=? AND edition=?',ctx.tenant,edition),jobs=this.rows('SELECT id,status,estimated_eur FROM jobs WHERE tenant=? AND edition=?',ctx.tenant,edition),
    invoices=this.rows('SELECT reference,amount_cents,status FROM invoices WHERE tenant=? AND edition=?',ctx.tenant,edition),events=this.rows('SELECT action,entity,payload_hash,created FROM events WHERE tenant=?',ctx.tenant),
    totalCost=jobs.reduce((x,y)=>x+y.estimated_eur,0);
    // All outputs are truthful manifests. PDF/PPTX/ZIP are NOT falsely claimed as generated.
    const outputData={EX01:{summary:'PROVISIONAL CEO DRAFT',evaluated: evaluated.length,limitations:['No G4/G5/G6 official signatures']},EX02:{agenda:['Decision pending','Scenarios','Investment','Gates']},
    EX03:{submissions},EX04:{aggregate_only:true,small_cells_suppressed:true,employee_ranking:false},EX05:{nodes:submissions.map(s=>({id:s.id,type:'solution',label:s.title})),edges:evaluated.map(e=>({from:e.submission,to:e.source_artifact,type:'SUPPORTED_BY'}))},
    EX06:{scenarios,required_minimum:3,ready_for_g5:scenarios.length>=3},EX07:{milestones:['D30','D60','D90'],status:'CANDIDATE'},EX08:{quarantined:this.rows('SELECT name,sha,scan FROM artifacts WHERE tenant=? AND edition=?',ctx.tenant,edition)},
    EX09:{private_feedback_not_available_to_executive:true},EX10:{handoff:'NOT_AUTHORIZED',measurement:'NOT_MEASURED'},EX11:{audit_log:events,retention:'POLICY_PENDING'}};
    return {edition:{id:editionRow.id,title:editionRow.title,stage:editionRow.stage},outputs:ORIGINAL_OUTPUTS.map(o=>({...o,render_status:o.id==='EX03'||o.id==='EX05'||o.id==='EX07'?'JSON_DRAFT':'REQUIRES_RENDERER_OR_HUMAN_REVIEW',payload:outputData[o.id]})),
      finance:{invoices,compute_cost_estimate_eur:totalCost},gates,release_approved:false,external_signatures_verified:false,complete_business_process:false};
  }
  health(ctx){this.permitted(ctx,'admin','auditor');return {tenant:ctx.tenant,edition_count:this.row('SELECT count(*) AS n FROM editions WHERE tenant=?',ctx.tenant).n,unverified_gates:DECISIONS,status:'LOCAL_PILOT_NOT_PRODUCTION'};}
}

/** OpenAI-compatible adapter for authorized, explicit HTTPS gateway only. Never enabled implicitly. */
export function httpsModelAdapter({endpoint,apiKey,fetchImpl=fetch}){
  const url=new URL(endpoint);if(url.protocol!=='https:'||url.username||url.password||!apiKey||apiKey.length<8)throw Error('Authorized HTTPS model gateway and key required');
  return async ({model,prompt,maxCostEur})=>{
    const c=new AbortController();const timeout=setTimeout(()=>c.abort(),20000);
    try{const r=await fetchImpl(url,{method:'POST',headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json'},body:JSON.stringify({model,messages:[{role:'system',content:'Assess submitted project metadata only. Cite sources. Do not assess employee performance.'},{role:'user',content:prompt}],temperature:0,max_tokens:500}),signal:c.signal});if(!r.ok)throw Error('Model provider failure '+r.status);
      const json=await r.json();const text=json.choices?.[0]?.message?.content;if(!clean(text))throw Error('Empty model result');
      // No arbitrary invented cost allowed: a configured safe upper-bound estimate is debited.
      return {text,costEur:Math.min(maxCostEur,Math.max(.01, Number(process.env.AIFIRST_MODEL_JOB_COST_EUR)||.25))};
    } finally{clearTimeout(timeout);}
  };
}

/** Optional local ClamAV CLI. External trust/attestation still requires a separate security review. */
export function clamscanAdapter({bin='clamscan'}={}){
  if(!/^(?:clamscan|\/usr\/bin\/clamscan)$/.test(bin))throw Error('Only approved ClamAV executable allowed');
  return async(file,sha)=>{
    const {execFile}=await import('node:child_process');
    const {promisify}=await import('node:util');
    const exec=promisify(execFile);
    if(digest(fs.readFileSync(file))!==sha)throw Error('File changed before scan');
    try{
      const {stdout}=await exec(bin,['--no-summary','--',file],{timeout:30000,maxBuffer:65536,windowsHide:true,shell:false});
      if(!stdout.includes(' OK'))throw Error('Scanner returned unrecognized verdict');
      if(digest(fs.readFileSync(file))!==sha)throw Error('File changed during scan');
      return {status:'CLEAN',sha256:sha,reference:'CLAMAV_LOCAL_'+digest(stdout),signature_valid:true};
    }catch{return {status:'QUARANTINED',sha256:sha,reference:null,signature_valid:false};}
  };
}
