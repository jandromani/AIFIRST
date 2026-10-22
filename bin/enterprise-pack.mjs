#!/usr/bin/env node
/** Explicit local report export, never publishes/escapes enterprise API. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {renderDraftPack,decryptDraftArchive} from '../src/enterprise-reports.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [action,edition]=process.argv.slice(2);
const key=process.env.AIFIRST_MASTER_KEY_B64;
if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1'||!key||!process.env.AIFIRST_ADMIN_TOKEN){
 console.error('Synthetic mode, master key and admin token required.');process.exit(2);
}
if(!['export','decrypt'].includes(action)||!/^ed_[0-9a-f-]{36}$/.test(edition||''))throw Error('Usage: node bin/enterprise-pack.mjs export|decrypt <edition-id>');
const runtime=new EditionRuntime(path.join(root,'.aifirst-local'));
try{
 const ctx=runtime.auth(process.env.AIFIRST_ADMIN_TOKEN);runtime.permitted(ctx,'admin');runtime.own(ctx,'editions',edition);
 const base=path.join(root,'.aifirst-local','exports',ctx.tenant);fs.mkdirSync(base,{recursive:true,mode:0o700});
 const dest=path.join(base,edition+'.zip.aif1');
 if(action==='export'){
  const result=renderDraftPack({dossier:runtime.dossier(ctx,edition),masterKey:key,tenant:ctx.tenant,edition});
  fs.writeFileSync(dest,result.encryptedArchive,{flag:'wx',mode:0o600});
  fs.writeFileSync(dest+'.manifest.json',JSON.stringify(result.manifest,null,2),{flag:'wx',mode:0o600});
  console.log(JSON.stringify({file:dest,manifest:dest+'.manifest.json',release_allowed:false,files:result.manifest.files.length},null,2));
 }else{
  if(!fs.existsSync(dest))throw Error('Encrypted export not found');
  const zip=decryptDraftArchive(fs.readFileSync(dest),{masterKey:key,tenant:ctx.tenant,edition});
  const draft=path.join(base,edition+'.DRAFT.zip');fs.writeFileSync(draft,zip,{flag:'wx',mode:0o600});
  console.log(JSON.stringify({file:draft,warning:'DECRYPTED LOCAL DRAFT - DO NOT SEND / NOT SIGNED'},null,2));
 }
}finally{runtime.close()}
