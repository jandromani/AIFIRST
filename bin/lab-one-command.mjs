#!/usr/bin/env node
/** One-command local synthetic AIFIRST integration lab. Never deploys customer infrastructure. */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {initializeLab,labPaths,readLabEnv,dockerCall,assertLocalRuntime,redactError} from '../src/lab-bootstrap.mjs';
import {provisionKeycloak,provisionBao,provisionS3,checkClamav,migrateLocalPostgres,waitFor} from '../src/lab-provision.mjs';
import {scanClamd} from '../src/local-stack-adapters.mjs';
import {runLabScenario} from '../src/lab-scenario.mjs';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const writeProof=(p,obj)=>{fs.mkdirSync(path.dirname(p),{recursive:true,mode:0o700});const tmp=p+'.tmp-'+process.pid;fs.writeFileSync(tmp,JSON.stringify(obj,null,2),{mode:0o600,flag:'wx'});fs.renameSync(tmp,p);};
const renderer=(paths)=>{
 for(const python of ['python3','python']){const r=spawnSync(python,['-c','import reportlab,pptx'],{encoding:'utf8',timeout:7000});if(r.status===0)return python;}
 const python=['python3','python'].find(p=>spawnSync(p,['--version'],{encoding:'utf8',timeout:7000}).status===0);
 if(!python)throw Error('Python 3 must be installed to generate the 11 executive reports');
 const venv=path.join(paths.state,'venv'),executable=process.platform==='win32'?path.join(venv,'Scripts','python.exe'):path.join(venv,'bin','python');
 if(!fs.existsSync(executable)){const created=spawnSync(python,['-m','venv',venv],{encoding:'utf8',timeout:60000});if(created.status!==0)throw Error('Cannot create isolated Python reports environment');}
 const req=path.join(paths.repo,'requirements-reports.txt');
 const installed=spawnSync(executable,['-m','pip','install','--disable-pip-version-check','-r',req],{encoding:'utf8',timeout:240000,maxBuffer:1024*1024});
 if(installed.status!==0)throw Error('Reports dependencies cannot be installed; check local Python/pip and network');
 const ready=spawnSync(executable,['-c','import reportlab,pptx'],{encoding:'utf8',timeout:7000});if(ready.status!==0)throw Error('PDF/PPTX dependencies failed post-install check');
 return executable;
};
async function orchestrate({serve=false,log=console.error}={}){
 assertLocalRuntime();const {paths,env,masterKey}=initializeLab(repo);
 const steps=[];const step=async (name,fn)=>{const at=Date.now();log('[AIFIRST lab] '+name);const value=await fn();steps.push({name,status:'VERIFIED_LOCAL_ONLY',duration_ms:Date.now()-at});return value;};
 await step('Docker Compose syntax',async()=>dockerCall(paths,env,'config'));
 await step('Start five local services',async()=>dockerCall(paths,env,'up',{timeout:600000}));
 const iam=await step('Keycloak OIDC signed service identity',()=>waitFor(()=>provisionKeycloak({env}),{retries:28,intervalMs:2500,label:'Keycloak'}));
 const bao=await step('OpenBao Transit encryption roundtrip',()=>waitFor(()=>provisionBao({token:env.AIFIRST_BAO_DEV_TOKEN}),{retries:10,intervalMs:1800,label:'OpenBao'}));
 const s3=await step('S3 private bucket',()=>waitFor(()=>provisionS3({user:env.AIFIRST_S3_USER,password:env.AIFIRST_S3_PASSWORD,bucket:'aifirst-synthetic-'+crypto.randomBytes(5).toString('hex')}),{retries:18,intervalMs:1500,label:'S3'}));
 const av=await step('ClamAV INSTREAM noninfected fixture',()=>waitFor(checkClamav,{retries:45,intervalMs:4000,label:'ClamAV'}));
 const postgres=await step('PostgreSQL audit migrations',()=>migrateLocalPostgres({paths,env}));
 fs.writeFileSync(paths.oidc,JSON.stringify(iam.jwks),{mode:0o600});
 const python=await step('Report renderer preflight',async()=>renderer(paths));
 // Fresh demo data on each run, never re-use stale synthetic outcomes to claim completion.
 const runRoot=path.join(paths.runtime,'run-'+crypto.randomUUID());fs.mkdirSync(runRoot,{mode:0o700});
 const scanner=async (file,expected)=>{const b=fs.readFileSync(file);const r=await scanClamd(b);if(r.sha256!==expected)throw Error('ClamAV digest mismatch');return r;};
 const proof=await step('Discovery → Evolution → Jury → Eleven EX Reports',()=>runLabScenario({root:runRoot,masterKey,scanner,s3,oidc:iam,renderReports:true,python,runMode:'LOCAL_DOCKER_SERVICE_PROOF'}));
 const final={schema:'aifirst.lab.verification.v1',classification:'SYNTHETIC_ONLY',checked_at:new Date().toISOString(),services:{keycloak:iam.oidc_signature_verified,openbao:bao.transit_roundtrip,s3:proof.services.s3.roundtrip,clamav:av.local_engine_response,postgres:postgres.schema_created},steps,integrated:proof,production_ready:false,external_provider_attested:false,money_moved:false};
 writeProof(paths.proof,final);log(`[AIFIRST lab] PASS — ${steps.length} verified local steps; proof: ${paths.proof}`);log('[AIFIRST lab] One-time local console token file: '+proof.local_admin_token_file+' (mode 0600; NEVER share)');log('[AIFIRST lab] NO customer production approval; no OpenRouter live inference; no legal signatures.');
 if(!serve)return final;
 const launchEnv={...process.env,AIFIRST_LOCAL_ROOT:runRoot,AIFIRST_SYNTHETIC_DEMO:'1',AIFIRST_MASTER_KEY_B64:masterKey.toString('base64'),AIFIRST_OIDC_ISSUER:iam.issuer,AIFIRST_OIDC_AUDIENCE:iam.audience,AIFIRST_OIDC_JWKS_FILE:paths.oidc,AIFIRST_OIDC_LOCAL_DEV_ISSUER:'1',AIFIRST_LAB_CLAMD_TCP:'1',AIFIRST_ALLOW_OPENROUTER_FREE:'0',AIFIRST_LAB_PROOF_PATH:paths.proof};
 log('[AIFIRST lab] Local product UI: http://127.0.0.1:4181/ · /console · /evolution · /atlas · /lab');
 await new Promise((resolve,reject)=>{const p=spawn(process.execPath,[path.join(repo,'bin','api.mjs'),'serve'],{cwd:repo,env:launchEnv,stdio:'inherit',shell:false});let stopped=false;const onSignal=()=>{if(!stopped){stopped=true;p.kill('SIGTERM');}};process.once('SIGINT',onSignal);process.once('SIGTERM',onSignal);p.once('error',reject);p.once('exit',code=>{process.removeListener('SIGINT',onSignal);process.removeListener('SIGTERM',onSignal);code===0||stopped?resolve():reject(Error('Local product API exited '+code));});});
 return final;
}
async function offlineProof(){assertLocalRuntime();process.env.AIFIRST_SYNTHETIC_DEMO='1';const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-offline-proof-'));try{
 const proof=await runLabScenario({root:tmp,masterKey:crypto.randomBytes(32),scanner:async(_,digest)=>({status:'CLEAN',reference:'MOCK_SCANNER_TEST_ONLY',sha256:digest,signature_valid:true}),renderReports:false,runMode:'OFFLINE_MOCK_SCAN_TEST_NOT_DOCKER'});
 if(proof.gates.production_release||!proof.evolution.audit.valid||proof.report.contracts!==11)throw Error('Offline proof invariant failed');console.log(JSON.stringify(proof,null,2));return proof;
}finally{fs.rmSync(tmp,{recursive:true,force:true});}}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const command=process.argv[2]||'full';
 try{if(command==='full')await orchestrate({serve:true});else if(command==='verify')console.log(JSON.stringify(await orchestrate(),null,2));else if(command==='offline-proof')await offlineProof();
 else if(command==='init'){const {paths}=initializeLab(repo);console.log(JSON.stringify({prepared:true,credentials_path:paths.env,secret_values_printed:false}));}
 else if(command==='stop'){const p=labPaths(repo);if(!fs.existsSync(p.env))throw Error('No lab configuration to stop');dockerCall(p,readLabEnv(p.env),'down');console.log('Local lab containers stopped; data and secrets retained');}
 else throw Error('Usage: lab-one-command.mjs full | verify | offline-proof | init | stop');
 }catch(e){console.error('[AIFIRST lab] FAILED_CLOSED: '+redactError(e));process.exitCode=1;}
}
export {orchestrate,offlineProof};
