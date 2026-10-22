/** Verified LOCAL encrypted SQLite snapshots. Not a KMS, cloud HA or disaster-recovery service. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {DatabaseSync, backup} from 'node:sqlite';
import {encryptArtifact,decryptArtifact} from './enterprise-security.mjs';

const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const assertFile=file=>{
  const stat=fs.lstatSync(file);
  if(!stat.isFile()||stat.isSymbolicLink())throw Error('Snapshot input must be a regular non-symlink file');
  return stat;
};
const checkKey=key=>{
  const bytes=Buffer.isBuffer(key)?key:Buffer.from(key||'','base64');
  if(bytes.length!==32)throw Error('Snapshot encryption key must be 32 bytes');
  return bytes;
};
const backupFolder=root=>{
  const dir=path.join(path.resolve(root),'backups');
  if(fs.existsSync(dir)&&fs.lstatSync(dir).isSymbolicLink())throw Error('Symlink backup folder forbidden');
  fs.mkdirSync(dir,{recursive:true,mode:0o700});
  return dir;
};
/** A SQLite consistent online backup, then encrypt before writing the exported copy. */
export async function createEncryptedSnapshot(db,root,masterKey,{clock=()=>new Date().toISOString()}={}){
  if(!db||typeof db.prepare!=='function')throw Error('Active SQLite database required');
  const key=checkKey(masterKey),dir=backupFolder(root),snapshotId=crypto.randomUUID();
  const stage=path.join(dir,'.tmp-'+snapshotId+'.sqlite');
  try{
    await backup(db,stage);
    const stat=assertFile(stage);
    if(stat.size===0||stat.size>256*1024*1024)throw Error('Snapshot size not supported');
    const plain=fs.readFileSync(stage),sha256=digest(plain);
    const encrypted=encryptArtifact(plain,{masterKey:key,tenant:'AIFIRST_SYSTEM',artifactId:'snapshot:'+snapshotId});
    const manifest={version:1,snapshot_id:snapshotId,created_at:clock(),encrypted:true,cipher:'AES-256-GCM/HKDF-SHA256',sqlite_sha256:sha256,size_bytes:plain.length,scope:'ALL_TENANTS_RESTRICTED',data_protection:'Requires offline master key and protected storage'};
    const out=path.join(dir,snapshotId+'.snapshot.aif1');
    const container=Buffer.concat([Buffer.from(JSON.stringify(manifest)+'\n'),encrypted]);
    fs.writeFileSync(out,container,{flag:'wx',mode:0o600});
    return {path:out,manifest,container_sha256:digest(container),restored:false};
  }finally{if(fs.existsSync(stage))fs.rmSync(stage,{force:true});}
}
export function verifyEncryptedSnapshot(file,masterKey){
  checkKey(masterKey); const stat=assertFile(file);
  if(stat.size>300*1024*1024)throw Error('Snapshot exceeds maximum');
  const body=fs.readFileSync(file),nl=body.indexOf(10);
  if(nl<0||nl>4096)throw Error('Invalid snapshot header');
  const info=JSON.parse(body.subarray(0,nl).toString('utf8'));
  if(info.version!==1||info.encrypted!==true||!/^[0-9a-f-]{36}$/.test(info.snapshot_id)||!/^[a-f0-9]{64}$/.test(info.sqlite_sha256))throw Error('Invalid snapshot manifest');
  const plain=decryptArtifact(body.subarray(nl+1),{masterKey,tenant:'AIFIRST_SYSTEM',artifactId:'snapshot:'+info.snapshot_id});
  if(digest(plain)!==info.sqlite_sha256||plain.length!==info.size_bytes)throw Error('Snapshot checksum mismatch');
  return {manifest:info,sqlite:plain,container_sha256:digest(body)};
}
/** Restore to a NEW empty directory only; never overwrite a live database. */
export function restoreEncryptedSnapshot(file,targetDir,masterKey){
  const {manifest,sqlite}=verifyEncryptedSnapshot(file,masterKey);
  const target=path.resolve(targetDir);
  if(fs.existsSync(target)){
    if(fs.lstatSync(target).isSymbolicLink())throw Error('Restore target symlink forbidden');
    if(fs.readdirSync(target).length)throw Error('Restore destination must be empty');
  }else fs.mkdirSync(target,{recursive:true,mode:0o700});
  const dest=path.join(target,'aifirst.sqlite');
  fs.writeFileSync(dest,sqlite,{flag:'wx',mode:0o600});
  let db;
  try{
    db=new DatabaseSync(dest,{readOnly:true});
    const integrity=db.prepare('PRAGMA integrity_check').all();
    if(integrity.length!==1||integrity[0].integrity_check!=='ok')throw Error('SQLite integrity check failed');
  }catch(e){fs.rmSync(dest,{force:true});throw e;
  }finally{db?.close();}
  return {restored:true,path:dest,snapshot_id:manifest.snapshot_id,external_dr_verified:false};
}
