#!/usr/bin/env node
/** Diagnose services without emitting credentials or inventing readiness attestations. */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const endpoints=[['keycloak',58080],['postgres',55432],['s3',59000],['openbao',58200],['clamav',53310]];
async function probe(port){return new Promise(resolve=>{const socket=net.createConnection({host:'127.0.0.1',port});const t=setTimeout(()=>{socket.destroy();resolve(false)},1500);socket.once('connect',()=>{clearTimeout(t);socket.destroy();resolve(true)});socket.once('error',()=>{clearTimeout(t);resolve(false)});});}
export async function doctor(){const checks=[];for(const [name,port] of endpoints)checks.push({service:name,port,port_open:await probe(port),authenticated:false,production_attested:false});return {purpose:'LOCAL_LAB_ONLY',services:checks,all_tcp_reachable:checks.every(c=>c.port_open),production_ready:false};}
export async function syncTrustedJwks({issuer=process.env.AIFIRST_OIDC_ISSUER||'http://127.0.0.1:58080/realms/aifirst-lab',directory=path.join(repo,'.aifirst-jwks')}={}){
 const u=new URL(issuer);if(u.protocol!=='http:'||u.hostname!=='127.0.0.1'||u.port!=='58080'||u.pathname!=='/realms/aifirst-lab')throw Error('Local trusted Keycloak issuer required');
 const discovery=await fetch(issuer+'/.well-known/openid-configuration',{signal:AbortSignal.timeout(5000)});
 if(!discovery.ok)throw Error('Keycloak discovery unavailable');const d=await discovery.json();if(d.issuer!==issuer)throw Error('OIDC issuer mismatch');
 const jwks=new URL(d.jwks_uri);if(jwks.origin!==u.origin||!jwks.pathname.endsWith('/protocol/openid-connect/certs'))throw Error('Untrusted JWKS URL');
 const response=await fetch(jwks,{signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error('JWKS unavailable');const j=await response.json();if(!Array.isArray(j.keys)||!j.keys.length||j.keys.length>15||j.keys.some(k=>!['RSA','EC'].includes(k.kty)||typeof k.kid!=='string'))throw Error('Invalid JWKS');
 fs.mkdirSync(directory,{recursive:true,mode:0o700});if(fs.lstatSync(directory).isSymbolicLink())throw Error('Unsafe JWKS directory');
 const file=path.join(directory,'keycloak-jwks.json');const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(j,null,2),{mode:0o600});fs.renameSync(temp,file);
 return {issuer,keys:j.keys.length,jwks_file:file,automatically_trusted_runtime:false,mfa_verified:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const command=process.argv[2];try{
  if(command==='doctor')console.log(JSON.stringify(await doctor(),null,2));
  else if(command==='sync-jwks')console.log(JSON.stringify(await syncTrustedJwks(),null,2));
  else throw Error('Usage: node bin/local-stack.mjs doctor | sync-jwks');
 }catch(e){console.error(e.message);process.exitCode=1;}
}
