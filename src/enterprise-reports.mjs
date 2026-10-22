/** Real PDF/PPTX/ZIP artifact generation, still synthetic and explicitly unapproved. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {encryptArtifact,decryptArtifact} from './enterprise-security.mjs';
import {fileURLToPath} from 'node:url';
const dirname=path.dirname(fileURLToPath(import.meta.url));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function crc32(buf){let c=~0;for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^(-(c&1)&0xedb88320);}return (~c)>>>0;}
/** Portable ZIP with uncompressed entries; archive gets AES-256-GCM envelope separately. */
export function zipStore(files){
 const local=[],central=[];let offset=0;const sorted=Object.entries(files).sort(([a],[b])=>a.localeCompare(b));
 for(const [name,buf] of sorted){
  if(!/^[a-zA-Z0-9_.-]{1,120}$/.test(name)||!Buffer.isBuffer(buf))throw Error('ZIP unsafe member');
  const n=Buffer.from(name),crc=crc32(buf),hdr=Buffer.alloc(30),cd=Buffer.alloc(46);
  hdr.writeUInt32LE(0x04034b50,0);hdr.writeUInt16LE(20,4);hdr.writeUInt32LE(crc,14);hdr.writeUInt32LE(buf.length,18);hdr.writeUInt32LE(buf.length,22);hdr.writeUInt16LE(n.length,26);
  local.push(hdr,n,buf);
  cd.writeUInt32LE(0x02014b50,0);cd.writeUInt16LE(20,4);cd.writeUInt16LE(20,6);cd.writeUInt32LE(crc,16);cd.writeUInt32LE(buf.length,20);cd.writeUInt32LE(buf.length,24);cd.writeUInt16LE(n.length,28);cd.writeUInt32LE(offset,42);
  central.push(cd,n);offset+=hdr.length+n.length+buf.length;
 }
 const center=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(sorted.length,8);end.writeUInt16LE(sorted.length,10);end.writeUInt32LE(center.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...local,center,end]);
}
export function renderDraftPack({dossier,masterKey,tenant,edition,python='python3'}={}){
 if(!dossier||dossier.release_approved!==false||dossier.external_signatures_verified!==false)throw Error('Only unapproved dossier can be rendered');
 if(!/^[A-Za-z0-9_-]{5,128}$/.test(tenant||'')||!/^[A-Za-z0-9_-]{5,128}$/.test(edition||''))throw Error('Invalid render scope');
 const key=Buffer.isBuffer(masterKey)?masterKey:Buffer.from(masterKey||'','base64');if(key.length!==32)throw Error('32-byte encryption master key required');
 const work=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-render-'));const out=path.join(work,'renders');fs.mkdirSync(out);
 try{
  const input=path.join(work,'dossier.json');fs.writeFileSync(input,JSON.stringify(dossier),{mode:0o600});
  const executable=python; // fixed executable, no shell; configure runtime rather than user input
  if(!['python3','python'].includes(executable))throw Error('Python interpreter not allowlisted');
  const result=execFileSync(executable,[path.join(dirname,'..','tools','render_enterprise.py'),input,out],{encoding:'utf8',timeout:45000,maxBuffer:1024*1024,windowsHide:true});
  const files={};for(const item of fs.readdirSync(out)){const filename=path.basename(item);if(filename!==item)throw Error('Unsafe artifact');files[filename]=fs.readFileSync(path.join(out,item));}
  if(Object.keys(files).length!==11)throw Error('Unexpected number of deliverables');
  const zip=zipStore(files);const encrypted=encryptArtifact(zip,{masterKey:key,tenant,artifactId:edition+':EX11'});
  const manifest={classification:'SYNTHETIC_UNAPPROVED',tenant,edition,release_allowed:false,
   files:Object.entries(files).map(([name,body])=>({name,bytes:body.length,sha256:sha(body)})),archive_sha256:sha(zip),ciphertext_sha256:sha(encrypted),
   encryption:'AES-256-GCM envelope wrapping a ZIP; decrypt with AIFIRST CLI before unzip',
   format:'ZIP_ENCRYPTED_AIF1_NOT_PKZIP',notes:['EX09 is withheld; no participant-specific data','No qualified signature or financial verification']};
  return {files,manifest,encryptedArchive:encrypted,render_stdout:JSON.parse(result)};
 }finally{fs.rmSync(work,{recursive:true,force:true});}
}
export function decryptDraftArchive(bytes,{masterKey,tenant,edition}){
 return decryptArtifact(bytes,{masterKey,tenant,artifactId:edition+':EX11'});
}
