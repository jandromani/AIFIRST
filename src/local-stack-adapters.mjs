/** Optional local-stack adapters. Fail closed and never imply production attestation. */
import crypto from 'node:crypto';
import net from 'node:net';
import fs from 'node:fs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hmac=(k,v)=>crypto.createHmac('sha256',k).update(v).digest();
const maxBytes=8*1024*1024;
function endpoint(input,{remoteHttps=false}={}){
 const u=new URL(input);
 if(u.username||u.password||u.search||u.hash)throw Error('Credentials/query forbidden in connector URL');
 const loopback=['127.0.0.1','localhost','[::1]'].includes(u.hostname);
 if(!(u.protocol==='https:'||(u.protocol==='http:'&&loopback&&!remoteHttps)))throw Error('Remote services require HTTPS');
 if(!loopback&&!remoteHttps)throw Error('External endpoints disabled in local mode');
 return u;
}
function simple(value,label){if(typeof value!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,180}$/.test(value)||value.includes('..')||value.includes('//'))throw Error(`Unsafe ${label}`);return value;}
const encodePath=x=>x.split('/').map(encodeURIComponent).join('/');
function responseError(r,name){if(!r.ok)throw Error(`${name} HTTP ${r.status}`);}
/** SigV4 S3 path-style client, suitable for localhost MinIO lab or a reviewed HTTPS S3 endpoint. */
export function s3Client({url,accessKey,secretKey,region='us-east-1',fetchImpl=fetch,remoteHttps=false,clock=()=>new Date()}={}){
 const origin=endpoint(url,{remoteHttps});
 if(!/^[-\w]{3,100}$/.test(accessKey||'')||typeof secretKey!=='string'||secretKey.length<16||!/^[a-z0-9-]{3,40}$/.test(region))throw Error('S3 credentials/region invalid');
 if(origin.pathname!=='/'&&origin.pathname!=='')throw Error('S3 endpoint must have root path');
 async function request(method,bucket,key='',body=Buffer.alloc(0)){
  bucket=simple(bucket,'bucket');if(!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket))throw Error('Invalid S3 bucket');
  if(key) simple(key,'key');
  const data=Buffer.from(body);if(data.length>maxBytes)throw Error('S3 object too large');
  const u=new URL(`${encodePath(bucket)}${key?'/'+encodePath(key):''}`,origin);
  const date=clock().toISOString().replace(/[:-]|\.\d{3}/g,'');const day=date.slice(0,8);
  const payloadHash=sha(data),signed='host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders=`host:${u.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${date}\n`;
  const canon=[method,u.pathname,'',canonicalHeaders,signed,payloadHash].join('\n');
  const scope=`${day}/${region}/s3/aws4_request`;
  const toSign=['AWS4-HMAC-SHA256',date,scope,sha(Buffer.from(canon))].join('\n');
  let signing=hmac('AWS4'+secretKey,day);
  for(const item of [region,'s3','aws4_request'])signing=hmac(signing,item);
  const signature=hmac(signing,toSign).toString('hex');
  const headers={authorization:`AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signed}, Signature=${signature}`,
    'x-amz-date':date,'x-amz-content-sha256':payloadHash};
  const res=await fetchImpl(u,{method,headers,...(method==='PUT'?{body:data}:{}),signal:AbortSignal.timeout(8000)});
  responseError(res,'S3');return res;
 }
 return Object.freeze({
  createBucket:async bucket=>{await request('PUT',bucket);return {bucket,created:true,production_attested:false};},
  putEncrypted:async({bucket,tenant,key,body})=>{
   const objectKey=`${simple(tenant,'tenant')}/${simple(key,'key')}`;
   if(!Buffer.isBuffer(body)||body.length<25)throw Error('Encrypted bytes required');
   await request('PUT',bucket,objectKey,body);
   return {key:objectKey,sha256:sha(body),bytes:body.length,external_storage_attested:false};
  },
  getEncrypted:async({bucket,tenant,key,max=1024*1024})=>{
   const objectKey=`${simple(tenant,'tenant')}/${simple(key,'key')}`;
   if(!Number.isSafeInteger(max)||max<1||max>maxBytes)throw Error('Invalid S3 read cap');
   const r=await request('GET',bucket,objectKey);
   if(Number(r.headers.get('content-length')||0)>max)throw Error('S3 read cap exceeded');
   const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length>max)throw Error('S3 read cap exceeded');return bytes;
  }
 });
}
/** OpenBao transit: cipher operations occur at Bao; its dev image is not persistent. */
export function baoTransit({url,token,key='aifirst',fetchImpl=fetch,remoteHttps=false}={}){
 const u=endpoint(url,{remoteHttps});if(typeof token!=='string'||token.length<16)throw Error('OpenBao token required');simple(key,'transit key');
 async function call(path,payload){const r=await fetchImpl(new URL(path,u),{method:'POST',headers:{'x-vault-token':token,'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(8000)});responseError(r,'OpenBao');const reply=await r.json();if(reply.errors?.length)throw Error('OpenBao rejected request');return reply.data||{};}
 return Object.freeze({
  encrypt:async (data,context)=>{if(!Buffer.isBuffer(data)||data.length>1024*1024)throw Error('Transit buffer required');simple(context,'transit context');const r=await call(`/v1/transit/encrypt/${key}`,{plaintext:data.toString('base64'),context:Buffer.from(context).toString('base64')});if(!/^vault:v\d+:/.test(r.ciphertext||''))throw Error('Invalid transit ciphertext');return r.ciphertext;},
  decrypt:async (ciphertext,context)=>{simple(context,'transit context');if(!/^vault:v\d+:/.test(ciphertext||''))throw Error('Invalid ciphertext');const r=await call(`/v1/transit/decrypt/${key}`,{ciphertext,context:Buffer.from(context).toString('base64')});if(!r.plaintext)throw Error('Invalid transit plaintext');return Buffer.from(r.plaintext,'base64');},
  name:key
 });
}
/** Local ClamAV daemon INSTREAM client; verified daemon result != vendor security attestation. */
export async function scanClamd(buffer,{host='127.0.0.1',port=53310,timeoutMs=8000}={}){
 if(!Buffer.isBuffer(buffer)||!buffer.length||buffer.length>maxBytes)throw Error('Invalid ClamAV scan body');
 if(!['127.0.0.1','::1'].includes(host)||!Number.isInteger(port)||port<1||port>65535)throw Error('Nonlocal ClamAV daemon blocked');
 return new Promise((resolve,reject)=>{
  const sock=net.createConnection({host,port});let output='';let done=false;
  const finish=(err,result)=>{if(done)return;done=true;sock.destroy();err?reject(err):resolve(result);};
  sock.setTimeout(timeoutMs,()=>finish(Error('ClamAV timeout')));
  sock.on('error',err=>finish(Error(`ClamAV unavailable: ${err.code||'network'}`)));
  sock.on('connect',()=>{
   sock.write(Buffer.from('zINSTREAM\0'));
   for(let i=0;i<buffer.length;i+=65536){const piece=buffer.subarray(i,i+65536),size=Buffer.alloc(4);size.writeUInt32BE(piece.length);sock.write(size);sock.write(piece);}
   sock.write(Buffer.alloc(4));
  });
  sock.on('data',chunk=>{output+=chunk.toString();if(output.length>1024)return finish(Error('Invalid ClamAV reply'));
   if(output.includes('\0')||output.includes('\n')){
    if(/stream: OK\s*[\x00\r\n]?$/.test(output))return finish(null,{status:'CLEAN',sha256:sha(buffer),reference:`CLAMD_LOCAL:${sha(buffer).slice(0,20)}`,signature_valid:true,external_attested:false});
    if(/FOUND/.test(output))return finish(null,{status:'INFECTED',sha256:sha(buffer),signature_valid:false,external_attested:false});
    finish(Error('ClamAV did not return a valid verdict'));
   }
  });
  sock.on('end',()=>{if(!done)finish(Error('ClamAV closed without verdict'));});
 });
}
/** PostgreSQL schema is tenant-keyed for a staged secondary store; SQLite is still primary. */
export const POSTGRES_MIGRATIONS=Object.freeze([
 `CREATE TABLE IF NOT EXISTS aifirst_events (id UUID PRIMARY KEY, tenant_id TEXT NOT NULL, kind TEXT NOT NULL, entity_ref TEXT NOT NULL, content_sha256 CHAR(64) NOT NULL CHECK(content_sha256 ~ '^[a-f0-9]{64}$'), occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE INDEX IF NOT EXISTS idx_aifirst_events_tenant_time ON aifirst_events(tenant_id,occurred_at DESC)`,
 `ALTER TABLE aifirst_events ENABLE ROW LEVEL SECURITY`,
 `ALTER TABLE aifirst_events FORCE ROW LEVEL SECURITY`,
 `DROP POLICY IF EXISTS aifirst_events_tenant ON aifirst_events`,
 `CREATE POLICY aifirst_events_tenant ON aifirst_events USING (tenant_id = current_setting('aifirst.tenant_id',true)) WITH CHECK (tenant_id = current_setting('aifirst.tenant_id',true))`
]);
/** Requires pg package when a real service is provisioned. Dedicated non-owner role needed for RLS. */
export async function pgAuditClient({connectionString,poolClass=null}={}){
 const u=new URL(connectionString);if(!['postgres:','postgresql:'].includes(u.protocol)||!['127.0.0.1','localhost'].includes(u.hostname)||u.search||u.hash)throw Error('PostgreSQL local URL required');
 if(!u.password)throw Error('PostgreSQL password missing');
 const Pool=poolClass|| (await import('pg')).Pool;
 const pool=new Pool({connectionString,max:4,connectionTimeoutMillis:4000,statement_timeout:4000});
 return Object.freeze({
  migrate:async()=>{const c=await pool.connect();try{await c.query('BEGIN');for(const sql of POSTGRES_MIGRATIONS)await c.query(sql);await c.query('COMMIT');return {migrations:POSTGRES_MIGRATIONS.length,production_migrated:false};}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}},
  append:async({tenant,id,kind,entity,sha256})=>{simple(tenant,'tenant');simple(kind,'event kind');simple(entity,'entity');if(!/^[a-f0-9]{64}$/.test(sha256))throw Error('Invalid audit hash');const c=await pool.connect();try{await c.query('BEGIN');await c.query('SELECT set_config($1,$2,true)',['aifirst.tenant_id',tenant]);await c.query('INSERT INTO aifirst_events(id,tenant_id,kind,entity_ref,content_sha256) VALUES ($1,$2,$3,$4,$5)',[id,tenant,kind,entity,sha256]);await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}},
  close:()=>pool.end()
 });
}
