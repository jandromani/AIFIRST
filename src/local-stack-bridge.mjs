/** Optional secondary encrypted-object replica. Primary source of truth remains EditionRuntime/SQLite. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {s3Client} from './local-stack-adapters.mjs';
export function optionalS3FromEnv(env=process.env,{fetchImpl=fetch}={}){
 const values=['AIFIRST_S3_ENDPOINT','AIFIRST_S3_ACCESS_KEY','AIFIRST_S3_SECRET_KEY','AIFIRST_S3_BUCKET'];
 if(values.some(key=>!env[key]))return null;
 return {client:s3Client({url:env.AIFIRST_S3_ENDPOINT,accessKey:env.AIFIRST_S3_ACCESS_KEY,secretKey:env.AIFIRST_S3_SECRET_KEY,fetchImpl}),bucket:env.AIFIRST_S3_BUCKET};
}
export class LocalStackBridge {
 constructor(engine,{s3=null}={}){if(!engine?.db||!engine?.permitted)throw Error('EditionRuntime required');this.engine=engine;this.s3=s3;
  this.engine.db.exec(`CREATE TABLE IF NOT EXISTS stack_replicas(
   id TEXT PRIMARY KEY,tenant TEXT NOT NULL,artifact TEXT NOT NULL,object_key TEXT NOT NULL,
   sealed_sha256 TEXT NOT NULL,created_at TEXT NOT NULL,
   UNIQUE(tenant,artifact));`);
 }
 async replicateEncrypted(ctx,artifactId){this.engine.permitted(ctx,'admin','security');if(!this.s3)throw Error('S3 not configured');
  const a=this.engine.own(ctx,'artifacts',artifactId);if(!a.storage.endsWith('.sealed'))throw Error('Only encrypted artifacts can be replicated');
  const root=path.resolve(this.engine.root);const file=path.resolve(a.storage);
  if(!file.startsWith(root+path.sep)||fs.lstatSync(file).isSymbolicLink())throw Error('Unsafe encrypted artifact path');
  const old=this.engine.row('SELECT * FROM stack_replicas WHERE tenant=? AND artifact=?',ctx.tenant,artifactId);
  if(old)return {artifact:artifactId,object_key:old.object_key,sha256:old.sealed_sha256,idempotent:true,external_attested:false};
  const bytes=fs.readFileSync(file);if(bytes.length<25||bytes.length>8*1024*1024)throw Error('Encrypted artifact size invalid');
  const stored=await this.s3.client.putEncrypted({bucket:this.s3.bucket,tenant:ctx.tenant,key:`${a.edition}/${artifactId}.sealed`,body:bytes});
  if(!stored?.sha256||stored.bytes!==bytes.length)throw Error('S3 failed to provide receipt');
  const id='rep_'+crypto.randomUUID();
  this.engine.run('INSERT INTO stack_replicas VALUES(?,?,?,?,?,?)',id,ctx.tenant,artifactId,stored.key,stored.sha256,new Date().toISOString());
  this.engine.stamp(ctx,'stack.object_replicated',artifactId,{sha256:stored.sha256});
  return {artifact:artifactId,object_key:stored.key,sha256:stored.sha256,idempotent:false,secondary_copy:true,production_attested:false};
 }
 status(ctx){this.engine.permitted(ctx,'admin','security','auditor');return {
   s3_configuration_present:Boolean(this.s3),encrypted_objects_replicated:this.engine.row('SELECT COUNT(*) AS n FROM stack_replicas WHERE tenant=?',ctx.tenant).n,
   postgres_primary:false,kms_primary:false,enterprise_sso_verified:false,production_ready:false};}
}
