/** AIFIRST private, tenant-scoped, synthetic execution receipts.
 * This is NOT a public signing authority, qualified e-signature, or production attestation.
 * Runs real EditionRuntime / EvolutionOS on isolated synthetic fixtures; scanner is a TEST DOUBLE.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {EditionRuntime} from './edition-runtime.mjs';
import {EvolutionOS} from './evolution-os.mjs';
import {demoScenario,SYNTHETIC_TRUSTED_EVALUATOR} from './evolution-http.mjs';
import {runLabScenario} from './lab-scenario.mjs';

const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const makeId=()=>crypto.randomUUID();
const KEY_FILE='theater-local-signing-key.pk8';
function keyStore(root){
 const dir=path.join(root,'proof-signing');fs.mkdirSync(dir,{recursive:true,mode:0o700});
 if(fs.lstatSync(dir).isSymbolicLink())throw Error('Unsafe signing directory');
 const file=path.join(dir,KEY_FILE);
 if(!fs.existsSync(file)){
  const {privateKey}=crypto.generateKeyPairSync('ed25519');
  try{fs.writeFileSync(file,privateKey.export({format:'pem',type:'pkcs8'}),{flag:'wx',mode:0o600});}catch(e){if(e.code!=='EEXIST')throw e;}
 }
 const stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||(stat.mode&0o077)!==0)throw Error('Signing key permissions unsafe');
 const privateKey=crypto.createPrivateKey(fs.readFileSync(file));if(privateKey.asymmetricKeyType!=='ed25519')throw Error('Signing key algorithm invalid');
 const publicKey=crypto.createPublicKey(privateKey);
 const publicKeyPem=publicKey.export({format:'pem',type:'spki'});
 const keyId=crypto.createHash('sha256').update(publicKey.export({format:'der',type:'spki'})).digest('hex');
 return {privateKey,publicKeyPem,keyId};
}
export function verifyTheaterReceipt(receipt,{trustedKeyId=null}={}){
 try{
  if(!receipt||receipt.schema!=='aifirst.theater.private_receipt.v1'||typeof receipt.payload_json!=='string'||receipt.payload_json.length>25000)return {valid:false,reason:'Malformed receipt'};
  const payload=JSON.parse(receipt.payload_json);
  const pem=receipt.signer?.public_key_pem;
  if(typeof pem!=='string'||!/^-----BEGIN PUBLIC KEY-----/.test(pem)||receipt.signature_algorithm!=='Ed25519')return {valid:false,reason:'Invalid public key or algorithm'};
  const key=crypto.createPublicKey(pem);if(key.asymmetricKeyType!=='ed25519')return {valid:false,reason:'Wrong signature algorithm'};
  const actualKeyId=crypto.createHash('sha256').update(key.export({format:'der',type:'spki'})).digest('hex');
  if(actualKeyId!==receipt.signer.key_id)return {valid:false,reason:'Key fingerprint mismatch'};
  const signature=Buffer.from(receipt.signature_b64||'','base64');
  const valid=signature.length===64&&crypto.verify(null,Buffer.from(receipt.payload_json),key,signature);
  return {valid,issuer_trusted:Boolean(valid&&trustedKeyId&&trustedKeyId===actualKeyId),key_id:actualKeyId,payload:valid?payload:null,reason:valid?'Local signature valid; signer identity requires external trust anchor':'Signature mismatch'};
 }catch{return {valid:false,reason:'Invalid receipt encoding'};}
}
function readProofSummary(lab,evolution){
 if(lab.gates?.production_release!==false||lab.report?.contracts!==11||lab.evolution?.audit?.valid!==true)throw Error('Local Discovery/Evolution proof failed');
 if(evolution.belief_vote?.unanimous!==true||evolution.snapshot?.beliefs?.version!==2)throw Error('Constitutional replacement proof failed');
 return {
  discovery:{engine:'EditionRuntime',edition_executed:true,projects_submitted:1,artifacts_sha_verified:true,scan:'MOCK_SIGNED_SCANNER_ONLY',local_g3:lab.gates.g3,local_g4:lab.gates.g4,original_ex_contracts:lab.report.contracts},
  arena:{engine:'EvolutionOS',independent_hidden_benchmark:true,decision:lab.evolution.arena,promotion:lab.evolution.promotion,evolution_chain_valid:lab.evolution.audit.valid},
  god:{engine:'EvolutionOS',voting_unanimous:evolution.belief_vote.unanimous,votes:evolution.belief_vote.votes_cast,eligible:evolution.belief_vote.electorate_size,version:evolution.snapshot.beliefs.version,independent_local_approval:true},
  limitations:{synthetic_only:true,scanner_mock:true,agent_outputs_mocked:true,provider_calls:0,production_release:false,legal_signature:false}
 };
}
async function runSyntheticEngines(){
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-private-receipt-'));fs.chmodSync(scratch,0o700);
 try{
  const scan=async(_file,sha256)=>({status:'CLEAN',reference:'MOCK-SCANNER-SYNTHETIC-ONLY',sha256,signature_valid:true});
  const lab=await runLabScenario({root:path.join(scratch,'discovery'),masterKey:crypto.randomBytes(32),scanner:scan,renderReports:false,runMode:'OFFLINE_SYNTHETIC_MOCK'});
  const evolutionRuntime=new EditionRuntime(path.join(scratch,'constitution'));
  let evo;
  try{
   const boot=evolutionRuntime.bootstrapTenant('Constitution simulation only');const admin=evolutionRuntime.auth(boot.token);
   const os=new EvolutionOS(evolutionRuntime,{trustedEvaluator:SYNTHETIC_TRUSTED_EVALUATOR});os.init(admin);
   evo=await demoScenario(os,admin);if(!os.auditChain(admin).valid)throw Error('DIOS audit chain invalid');
  }finally{evolutionRuntime.close();}
  const safe=readProofSummary(lab,evo);
  const evidenceSha=sha({discovery:lab.evolution.audit,edition:lab.edition,contracts:lab.report.contracts,constitution:evo.belief_vote,belief:evo.snapshot.beliefs});
  return {summary:safe,source_trace_sha256:evidenceSha};
 }finally{fs.rmSync(scratch,{recursive:true,force:true});}
}
export class VerifiedTheater{
 constructor(engine,{clock=()=>new Date().toISOString()}={}){
  this.engine=engine;this.db=engine.db;this.clock=clock;
  this.db.exec(`CREATE TABLE IF NOT EXISTS theater_runs(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,status TEXT NOT NULL,created TEXT NOT NULL,receipt_json TEXT);
   CREATE INDEX IF NOT EXISTS idx_theater_tenant ON theater_runs(tenant,created);
   CREATE UNIQUE INDEX IF NOT EXISTS idx_theater_running ON theater_runs(tenant) WHERE status='RUNNING';`);
 }
 keyInfo(ctx){this.engine.permitted(ctx,'admin','auditor');const k=keyStore(this.engine.root);return {key_id:k.keyId,public_key_pem:k.publicKeyPem,scope:'LOCAL_SIGNER_ONLY',trust_anchor:'PIN_KEY_FINGERPRINT_OUT_OF_BAND'};}
 list(ctx){this.engine.permitted(ctx,'admin','auditor');return this.engine.rows("SELECT id,status,created FROM theater_runs WHERE tenant=? ORDER BY created DESC LIMIT 25",ctx.tenant);}
 find(ctx,id){this.engine.permitted(ctx,'admin','auditor');if(!/^[-a-f0-9]{36}$/.test(id))throw Error('Not found');const entry=this.engine.row("SELECT status,receipt_json FROM theater_runs WHERE tenant=? AND id=?",ctx.tenant,id);if(!entry)throw Error('Not found');return entry.status==='SUCCESS'?JSON.parse(entry.receipt_json):{status:entry.status};}
 async run(ctx){
  this.engine.permitted(ctx,'admin');if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1')throw Error('Synthetic demo mode required');
  const runId=makeId(),today=this.clock().slice(0,10);
  this.engine.transaction(()=>{
   const n=this.engine.row('SELECT count(*) AS n FROM theater_runs WHERE tenant=? AND created>=?',ctx.tenant,today).n;
   if(n>=5)throw Error('Daily local proof quota exceeded');
   this.engine.run('INSERT INTO theater_runs VALUES(?,?,?,?,?)',runId,ctx.tenant,'RUNNING',this.clock(),null);
  });
  try{
   const executed=await runSyntheticEngines();
   const claim={schema:'aifirst.theater.execution_claim.v1',run_id:runId,run_at:this.clock(),tenant_scope_sha256:sha(ctx.tenant),execution_mode:'PRIVATE_LOCAL_SYNTHETIC',source_trace_sha256:executed.source_trace_sha256,...executed.summary};
   const payload_json=JSON.stringify(claim);
   const key=keyStore(this.engine.root);
   const receipt={schema:'aifirst.theater.private_receipt.v1',signature_algorithm:'Ed25519',payload_json,signature_b64:crypto.sign(null,Buffer.from(payload_json),key.privateKey).toString('base64'),signer:{key_id:key.keyId,public_key_pem:key.publicKeyPem,claim:'LOCAL_KEY_NOT_EXTERNAL_ATTESTATION'}};
   if(!verifyTheaterReceipt(receipt).valid)throw Error('Signer self-check failed');
   this.engine.run("UPDATE theater_runs SET status='SUCCESS',receipt_json=? WHERE tenant=? AND id=?",JSON.stringify(receipt),ctx.tenant,runId);
   this.engine.stamp(ctx,'theater.synthetic_verified_execution',runId,{trace_sha256:executed.source_trace_sha256});
   return receipt;
  }catch(err){this.engine.run("UPDATE theater_runs SET status='FAILED' WHERE tenant=? AND id=?",ctx.tenant,runId);throw err;}
 }
}
