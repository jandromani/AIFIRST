/** Service-level checks and lab bootstrap. They are real network checks; no synthetic bypass. */
import crypto from 'node:crypto';
import {s3Client,baoTransit,scanClamd,POSTGRES_MIGRATIONS} from './local-stack-adapters.mjs';
import {verifyOidcJwt} from './enterprise-security.mjs';
import {dockerExec} from './lab-bootstrap.mjs';
const base='http://127.0.0.1:58080';const issuer=base+'/realms/aifirst-lab';
const keycloakToken=async (path,body,fetchImpl)=>{const r=await fetchImpl(base+path,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body),signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Keycloak token HTTP '+r.status);const t=await r.json();if(typeof t.access_token!=='string')throw Error('Keycloak token missing');return t.access_token;};
const jwtPayload=token=>JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'));
export async function provisionKeycloak({env,fetchImpl=fetch,clientSecret=env?.AIFIRST_KC_SERVICE_SECRET}={}){
 const r=await fetchImpl(issuer+'/.well-known/openid-configuration',{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Keycloak realm not ready');const d=await r.json();if(d.issuer!==issuer)throw Error('Keycloak issuer mismatch');
 const jwksUri=new URL(d.jwks_uri);if(jwksUri.origin!==base||jwksUri.pathname!==('/realms/aifirst-lab/protocol/openid-connect/certs'))throw Error('Unexpected JWKS location');
 const jr=await fetchImpl(jwksUri,{signal:AbortSignal.timeout(8000)});if(!jr.ok)throw Error('Keycloak JWKS inaccessible');const jwks=await jr.json();if(!Array.isArray(jwks.keys)||!jwks.keys.length)throw Error('Empty Keycloak JWKS');
 const admin=await keycloakToken('/realms/master/protocol/openid-connect/token',{grant_type:'password',client_id:'admin-cli',username:'admin',password:env.AIFIRST_KC_ADMIN_PASSWORD},fetchImpl);
 const auth={'authorization':'Bearer '+admin,'content-type':'application/json'};
 if(typeof clientSecret!=='string'||clientSecret.length<30)throw Error('Local client secret missing');const clientId='aifirst-lab-runner';const list=await fetchImpl(base+'/admin/realms/aifirst-lab/clients?clientId='+clientId,{headers:auth,signal:AbortSignal.timeout(8000)});if(!list.ok)throw Error('Keycloak client list HTTP '+list.status);const existing=await list.json();if(!Array.isArray(existing))throw Error('Keycloak clients invalid');
 if(existing.length>1)throw Error('Duplicate lab service clients');
 const spec={clientId,name:'AIFIRST synthetic integration runner',enabled:true,protocol:'openid-connect',publicClient:false,clientAuthenticatorType:'client-secret',secret:clientSecret,serviceAccountsEnabled:true,standardFlowEnabled:false,directAccessGrantsEnabled:false,implicitFlowEnabled:false,fullScopeAllowed:false,
   protocolMappers:[{name:'aifirst-lab-audience',protocol:'openid-connect',protocolMapper:'oidc-audience-mapper',consentRequired:false,config:{'included.custom.audience':clientId,'access.token.claim':'true','id.token.claim':'false'}}]};
 if(!existing.length){const created=await fetchImpl(base+'/admin/realms/aifirst-lab/clients',{method:'POST',headers:auth,body:JSON.stringify(spec),signal:AbortSignal.timeout(8000)});if(created.status!==201)throw Error('Keycloak client creation HTTP '+created.status);}
 const token=await keycloakToken('/realms/aifirst-lab/protocol/openid-connect/token',{grant_type:'client_credentials',client_id:clientId,client_secret:clientSecret},fetchImpl);
 // Service account's token must be signed by realm JWKS and explicitly intended for our client.
 const claims=jwtPayload(token);if(!claims.aud||!(Array.isArray(claims.aud)?claims.aud:[claims.aud]).includes(clientId))throw Error('Keycloak audience mapper not active');
 const identity=verifyOidcJwt(token,{issuer,audience:clientId,jwks,allowLocalLabIssuer:true});
 return {issuer,audience:clientId,jwks,subject:identity.subject,token,oidc_signature_verified:true,service_identity_mfa:false};
}
async function baoPost(path,token,payload={},fetchImpl=fetch){const r=await fetchImpl('http://127.0.0.1:58200'+path,{method:'POST',headers:{'x-vault-token':token,'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(8000)});if(![200,204].includes(r.status))throw Error('OpenBao initialize HTTP '+r.status);return r;}
export async function provisionBao({token,fetchImpl=fetch}={}){
 const mount=await fetchImpl('http://127.0.0.1:58200/v1/sys/mounts',{headers:{'x-vault-token':token},signal:AbortSignal.timeout(8000)});if(!mount.ok)throw Error('OpenBao mounts unavailable');const list=await mount.json();if(!list['transit/'])await baoPost('/v1/sys/mounts/transit',token,{type:'transit',description:'Synthetic only'},fetchImpl);
 const key=await fetchImpl('http://127.0.0.1:58200/v1/transit/keys/aifirst',{headers:{'x-vault-token':token},signal:AbortSignal.timeout(8000)});if(key.status===404)await baoPost('/v1/transit/keys/aifirst',token,{type:'aes256-gcm96',derived:true},fetchImpl);else if(!key.ok)throw Error('OpenBao Transit key check HTTP '+key.status);
 const adapter=baoTransit({url:'http://127.0.0.1:58200',token,fetchImpl});const b=Buffer.from('AIFIRST transit synthetic verification');const crypt=await adapter.encrypt(b,'synthetic-lab');const decoded=await adapter.decrypt(crypt,'synthetic-lab');if(!decoded.equals(b))throw Error('OpenBao ciphertext mismatch');return {transit_roundtrip:true,dev_mode_ephemeral:true,adapter};
}
export async function provisionS3({user,password,fetchImpl=fetch,bucket='aifirst-synthetic-demo'}={}){
 const s3=s3Client({url:'http://127.0.0.1:59000',accessKey:user,secretKey:password,fetchImpl});await s3.createBucket(bucket);return {client:s3,bucket,created:true,public_access_not_tested:true};
}
export async function checkClamav(){const r=await scanClamd(Buffer.from('AIFIRST harmless synthetic anti-malware readiness text'));if(r.status!=='CLEAN')throw Error('ClamAV test bytes not clean');return {local_engine_response:true,signature_database_freshness_not_attested:true};}
export function migrateLocalPostgres({paths,env,exec=dockerExec}={}){
 for(const sql of POSTGRES_MIGRATIONS)exec(paths,env,'postgres',['psql','-U','aifirst','-d','aifirst','-v','ON_ERROR_STOP=1','-c',sql]);
 const count=exec(paths,env,'postgres',['psql','-U','aifirst','-d','aifirst','-tAc',"SELECT COUNT(*) FROM information_schema.tables WHERE table_name='aifirst_events'"]).trim();if(count!=='1')throw Error('Postgres audit schema missing');return {schema_created:true,primary_database:'SQLite',row_level_security_customer_verified:false};
}
export async function waitFor(fn,{retries=30,intervalMs=3000,label='service',sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){let last;for(let i=0;i<retries;i++){try{return await fn();}catch(e){last=e;if(i<retries-1)await sleep(intervalMs);}}throw Error(`${label} did not become ready after ${retries} probes: ${String(last?.message||'unknown').slice(0,250)}`);}
