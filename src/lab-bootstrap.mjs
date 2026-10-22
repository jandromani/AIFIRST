/** Local-only lab lifecycle. Secrets are generated once and stored outside Git. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export const PROJECT_ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SAFE_KEY=/^[A-Z][A-Z0-9_]{2,70}$/;
const CONFIG_KEYS=['AIFIRST_PG_PASSWORD','AIFIRST_KC_ADMIN_PASSWORD','AIFIRST_S3_USER','AIFIRST_S3_PASSWORD','AIFIRST_BAO_DEV_TOKEN','AIFIRST_KC_SERVICE_SECRET'];
const random=()=>crypto.randomBytes(30).toString('base64url');
export function labPaths(repo=PROJECT_ROOT){const repoDir=path.resolve(repo),state=path.join(repoDir,'.aifirst-local','one-command');return {repo:repoDir,state,env:path.join(state,'.env.lab'),runtime:path.join(state,'demo'),proof:path.join(state,'proof.json'),master:path.join(state,'master.key'),oidc:path.join(state,'trusted-jwks.json'),compose:path.join(repoDir,'infra','compose.local.yaml')};}
function secureDir(where){fs.mkdirSync(where,{recursive:true,mode:0o700});const s=fs.lstatSync(where);if(!s.isDirectory()||s.isSymbolicLink())throw Error('Unsafe lab state directory');if(process.platform!=='win32')fs.chmodSync(where,0o700);}
function secretsFile(p){if(fs.existsSync(p)){const s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||(process.platform!=='win32'&&(s.mode&0o077)))throw Error('Lab secrets file permissions unsafe');}}
function writeSecret(p,content){secretsFile(p);fs.writeFileSync(p,content,{mode:0o600,flag:'wx'});}
export function readLabEnv(file){secretsFile(file);const env={};for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){if(!line||line.startsWith('#'))continue;const i=line.indexOf('=');if(i<1)throw Error('Malformed lab environment');const key=line.slice(0,i),val=line.slice(i+1);if(!SAFE_KEY.test(key)||!val||val.includes('\n')||val.includes('\r'))throw Error('Malformed lab environment');if(Object.hasOwn(env,key))throw Error('Duplicate lab environment variable');env[key]=val;}for(const key of CONFIG_KEYS)if(!env[key]||env[key].length<(key==='AIFIRST_S3_USER'?3:16))throw Error('Missing lab configuration '+key);return env;}
export function initializeLab(repo=PROJECT_ROOT){const p=labPaths(repo);secureDir(path.dirname(p.state));secureDir(p.state);if(!fs.existsSync(p.env)){
 const env={AIFIRST_PG_PASSWORD:random(),AIFIRST_KC_ADMIN_PASSWORD:random(),AIFIRST_S3_USER:'aifirstlab',AIFIRST_S3_PASSWORD:random(),AIFIRST_BAO_DEV_TOKEN:random(),AIFIRST_KC_SERVICE_SECRET:random()};
 writeSecret(p.env,Object.entries(env).map(([k,v])=>k+'='+v).join('\n')+'\n');
 }const env=readLabEnv(p.env);if(!fs.existsSync(p.master))writeSecret(p.master,crypto.randomBytes(32).toString('base64')+'\n');else secretsFile(p.master);
 const key=Buffer.from(fs.readFileSync(p.master,'utf8').trim(),'base64');if(key.length!==32)throw Error('Invalid local master key');secureDir(p.runtime);return {paths:p,env,masterKey:key};}
export function composeArgs(paths,env,action){if(!['config','up','down','ps','logs'].includes(action))throw Error('Unsupported Compose command');const common=['compose','--env-file',paths.env,'-f',paths.compose,'-p','aifirst-lab'];if(action==='up')return [...common,'up','-d','--wait','--wait-timeout','240'];if(action==='down')return [...common,'down'];if(action==='config')return [...common,'config','--quiet'];if(action==='ps')return [...common,'ps','--format','json'];return [...common,'logs','--tail','60'];}
export function dockerCall(paths,env,action,{spawn=spawnSync,timeout=300000}={}){const args=composeArgs(paths,env,action);const r=spawn('docker',args,{cwd:paths.repo,env:{...process.env,...env},encoding:'utf8',timeout,maxBuffer:1024*1024,windowsHide:true});if(r.error||r.status!==0)throw Error(`Docker Compose ${action} failed: ${r.error?.code||r.stderr?.slice(-900)||'unknown'}`);return {action,success:true,output:action==='ps'?String(r.stdout).slice(0,2000):undefined};}
export function assertLocalRuntime(){if(Number(process.versions.node.split('.')[0])<22)throw Error('Node.js >=22 required');if(process.env.AIFIRST_SYNTHETIC_DEMO==='0')throw Error('Synthetic demo explicitly disabled');}
export const SAFE_LAB_SERVICES=Object.freeze(['postgres','keycloak','objectstore','openbao','clamav']);
export function dockerExec(paths,env,service,args,{spawn=spawnSync,timeout=30000}={}){if(!SAFE_LAB_SERVICES.includes(service)||!Array.isArray(args)||args.some(x=>typeof x!=='string'||x.length>10000))throw Error('Unsafe Docker exec command');const call=['compose','--env-file',paths.env,'-f',paths.compose,'-p','aifirst-lab','exec','-T',service,...args];const r=spawn('docker',call,{cwd:paths.repo,env:{...process.env,...env},encoding:'utf8',timeout,maxBuffer:1024*1024});if(r.error||r.status!==0)throw Error(`Docker ${service} exec failed: ${r.error?.code||r.stderr?.slice(-350)||'unknown'}`);return String(r.stdout);}
export function redactError(e){const msg=String(e?.message||e||'failure');return msg.replace(/(?:password|token|secret|authorization)[=:]\S+/gi,'[SECRET_REDACTED]').slice(0,700);}
