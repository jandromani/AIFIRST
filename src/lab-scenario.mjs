/** Full synthetic AIFIRST proof with REAL file writes, role gates and independent judge.
 * External connectors (ClamAV/S3/OIDC/OpenBao) are injected and their status is reported
 * honestly. Never treats a local success as legal, fiscal or production attestation.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {EditionRuntime} from './edition-runtime.mjs';
import {EnterpriseOps} from './enterprise-ops.mjs';
import {EvolutionOS} from './evolution-os.mjs';
import {EvolutionFabric} from './evolution-fabric.mjs';
import {ReviewPlanner} from './evolution-review-planner.mjs';
import {independentBenchmark} from './evolution-benchmarks.mjs';
import {LocalStackBridge} from './local-stack-bridge.mjs';
import {renderDraftPack} from './enterprise-reports.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
export async function runLabScenario({root,masterKey,scanner,s3=null,oidc=null,renderReports=false,python='python3',proofFile=null,runMode='OFFLINE_SYNTHETIC'}={}){
 if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1')throw Error('Synthetic mode required; customer data forbidden');
 if(!root||!path.isAbsolute(root)||!Buffer.isBuffer(masterKey)||masterKey.length!==32||typeof scanner!=='function')throw Error('Explicit isolated runtime/scanner/key required');
 const engine=new EditionRuntime(root,{scanner});
 try{
  const init=engine.bootstrapTenant('AIFIRST synthetic organization');
  fs.writeFileSync(path.join(root,'local-admin.token'),init.token+'\n',{flag:'wx',mode:0o600});
  const admin=engine.auth(init.token);
  const security=engine.auth(engine.addPrincipal(admin,'security').token),juror=engine.auth(engine.addPrincipal(admin,'juror').token),auditor=engine.auth(engine.addPrincipal(admin,'auditor').token);
  const enterprise=new EnterpriseOps(engine,{masterKey,oidc:oidc?{issuer:oidc.issuer,audience:oidc.audience,jwks:oidc.jwks,allowLocalLabIssuer:true}:null});
  let oidcCheck={configured:false,authenticated:false,mfa_verified:false};
  if(oidc){enterprise.bindOidc(admin,{issuer:oidc.issuer,subject:oidc.subject,role:'admin',principal:admin.id});const verified=enterprise.authenticateOidc(oidc.token);if(verified.id!==admin.id||verified.auth_method!=='verified_oidc')throw Error('OIDC bound admin auth failed');
   const {makeApi}=await import('../bin/api.mjs');const server=makeApi(engine,enterprise);await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
   try{const res=await fetch(`http://127.0.0.1:${server.address().port}/v1/health`,{headers:{authorization:'Bearer '+oidc.token},signal:AbortSignal.timeout(3000)});if(res.status!==200)throw Error('OIDC authenticated HTTP route failed: '+res.status);}finally{await new Promise(ok=>server.close(ok));}
   oidcCheck={configured:true,authenticated:true,http_route_authenticated:true,mfa_verified:false};}
  const edition=engine.newEdition(admin,{title:'Hackathon AI-FIRST · Synthetic',baseline:'Synthetic reference state, no business KPI',rubric:[{key:'evidence',weight:.6},{key:'quality',weight:.4}]});
  engine.recordContract(admin,edition.id,{sow_ref:'SYNTHETIC_SOW_UNEXECUTED',dpa_ref:'SYNTHETIC_DPA_UNEXECUTED'});
  const participant=engine.register(admin,edition.id,'alias_synthetic_001');
  const submission=engine.submit(admin,edition.id,participant.id,'Synthetic knowledge assistant');
  const content=Buffer.from('AIFIRST synthetic solution README. Evidence: fixture digest only. No users, secrets or client data.');
  const receipt=await enterprise.secureUpload(admin,submission.id,'README.txt',content,sha(content));
  if(!receipt.encrypted_at_rest||receipt.scan!=='CLEAN')throw Error('Scanner rejected synthetic fixture');
  const stack=new LocalStackBridge(engine,{s3});let replica={configured:Boolean(s3),roundtrip:false};
  if(s3){const r=await stack.replicateEncrypted(admin,receipt.id);const bytes=await s3.client.getEncrypted({bucket:s3.bucket,tenant:admin.tenant,key:`${edition.id}/${receipt.id}.sealed`,max:1024*1024});const sealed=fs.readFileSync(engine.own(admin,'artifacts',receipt.id).storage);if(!bytes.equals(sealed)||sha(bytes)!==r.sha256)throw Error('S3 encrypted replica roundtrip mismatch');replica={configured:true,roundtrip:true,object_digest:r.sha256};}
  const g3=engine.gate(security,edition.id,'G3','LOCAL_SCANNER_ONLY_NOT_LEGALLY_SIGNED');
  engine.evaluate(juror,submission.id,3.5,receipt.id,'Synthetic jury local: source material limited');
  const g4=engine.gate(juror,edition.id,'G4','LOCAL_JUROR_NOT_EXTERNAL_ATTESTED');
  for(let i=0;i<3;i++)engine.addScenario(admin,edition.id,{name:['Training pilots','Review automation','Knowledge governance'][i],risk:'Unverified impact and customer consent',cost_low:500*(i+1),cost_high:2500*(i+1)});
  const os=new EvolutionOS(engine);os.init(admin);
  const productive=os.createAgent(admin,{name:'Evidence evaluator',role:'productive',capability:'HACKATHON',prompt_spec:'Validate only synthetic manifest hashes'});
  const key=crypto.generateKeyPairSync('ed25519');const critic=os.createAgent(admin,{name:'Mirror independent',role:'mirror',capability:'HACKATHON',public_key:key.publicKey.export({type:'spki',format:'pem'})});
  const challenger=os.createAgent(admin,{name:'Aspirant version',role:'candidate',status:'CANDIDATE',capability:'HACKATHON'});
  const bridge=new EvolutionFabric(engine,{evolution:os});const attached=bridge.bridgeSubmission(admin,submission.id);
  const executed=await os.executeTask(admin,attached.task,async()=>({summary:'Synthetic digest checked; claims remain pending independent review.'}));
  const report='Synthetic mirror requests independent references and source-level validation before accepting results.';
  const toSign=`MIRROR:v1:${admin.tenant}:${critic.id}:${attached.task}:AGENT:ORCHESTRATOR:HIGH:${sha(report)}`;
  const critique=await bridge.mirrorRound(admin,attached.task,{mirror:critic.id,critic:async()=>({severity:'HIGH',report,signature:crypto.sign(null,Buffer.from(toSign),key.privateKey).toString('base64')})});
  const position=os.openPosition(admin,'HACKATHON','Evaluator competition',productive.id);const jobs=bridge.rotateJobBoard(admin);
  const application=os.apply(admin,jobs.vacancies[0],challenger.id,'Candidate prompt: cite digest and require independent checks');
  const arenaBenchmark=independentBenchmark({cases:[{input:'A',expected:'PASS-A'},{input:'B',expected:'PASS-B'},{input:'C',expected:'PASS-C'}],runner:async ({agent,input})=>({output:agent.id===challenger.id?'PASS-'+input:'UNVERIFIED',cost_eur:.0001})});
  os.trustedEvaluator=arenaBenchmark.evaluate;
  const arena=await os.arena(admin,application.id,{hiddenFixture:'synthetic_expected_answer_fixture_01',evaluate:arenaBenchmark.evaluate});
  if(!arena.quality_gate)throw Error('Independent arena rejected candidate');
  const promotion=os.proposePromotion(admin,arena.id);os.approvePromotion(auditor,promotion.id);const activated=os.activatePromotion(admin,promotion.id);
  const planner=new ReviewPlanner(engine,{evolution:os});const proposed=planner.propose(admin,position.id,{reason:'Signed independent critic identified a missing evidence verification step',source:'ORCHESTRATOR'});
  const dossier=engine.dossier(admin,edition.id);if(dossier.outputs.length!==11||dossier.release_approved!==false)throw Error('Executive pack invariant failed');
  let archive=null;if(renderReports){const pack=renderDraftPack({dossier,masterKey,tenant:admin.tenant,edition:edition.id,python});if(pack.files&&Object.keys(pack.files).length===11){const target=path.join(root,'unapproved-ex11.zip.aif1');fs.writeFileSync(target,pack.encryptedArchive,{flag:'wx',mode:0o600});archive={file:target,sha256:sha(pack.encryptedArchive),members:pack.manifest.files.length,release_allowed:false};}else throw Error('Incomplete draft report output');}
  const audit=os.auditChain(auditor);if(!audit.valid)throw Error('Evolution audit chain broken');
  const result={schema:'aifirst.lab.integrated-proof.v1',mode:runMode,tenant:init.tenant,edition:edition.id,submission:submission.id,artifact:receipt.id,
   services:{oidc:oidcCheck,encrypted_storage:true,clamav_clean_local:receipt.scan==='CLEAN',s3:replica,postgres_primary:false,bao_primary:false,openrouter_live:false},
   gates:{g3:g3.status,g4:g4.status,g1_legal:false,g5_legal:false,g6_legal:false,g7_legal:false,production_release:false},
   evolution:{task:attached.task,execution:executed.status,mirror:critique.channel,arena:arena.decision,promotion:activated.status,improvement:proposed.status,audit},
   report:{contracts:dossier.outputs.length,archive},local_admin_token_file:path.join(root,'local-admin.token'),participant_identities_transmitted:false,money_moved:false};
  if(proofFile){fs.mkdirSync(path.dirname(proofFile),{recursive:true,mode:0o700});fs.writeFileSync(proofFile,JSON.stringify(result,null,2),{mode:0o600});}
  return result;
 }finally{engine.close();}
}
