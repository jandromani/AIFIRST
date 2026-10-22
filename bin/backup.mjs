#!/usr/bin/env node
/** Local cryptographic backup/recovery; requires key stored outside repository. */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {createEncryptedSnapshot,verifyEncryptedSnapshot,restoreEncryptedSnapshot} from '../src/operations-hardening.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','.aifirst-local');
const [action,a,b]=process.argv.slice(2);
const key=process.env.AIFIRST_MASTER_KEY_B64;
if(!key){console.error('Set AIFIRST_MASTER_KEY_B64 securely; do not commit it.');process.exitCode=2;}
else if(action==='create'&& !a){
  const db=new EditionRuntime(root);
  try{const info=await createEncryptedSnapshot(db.db,root,key);console.log(JSON.stringify({snapshot_path:info.path,manifest:info.manifest,offline_only:true},null,2));}
  finally{db.close();}
}else if(action==='verify'&&a&&!b){const info=verifyEncryptedSnapshot(path.resolve(a),key);console.log(JSON.stringify({verified:true,manifest:info.manifest},null,2));}
else if(action==='restore'&&a&&b){const info=restoreEncryptedSnapshot(path.resolve(a),path.resolve(b),key);console.log(JSON.stringify(info,null,2));}
else{console.error('Usage: node bin/backup.mjs create | verify <file> | restore <file> <EMPTY_FOLDER>');process.exitCode=2;}
