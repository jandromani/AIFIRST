#!/usr/bin/env node
/** Explicit local synthetic signed receipt runner/verifier (no Docker, no providers). */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {VerifiedTheater,verifyTheaterReceipt} from '../src/verified-theater.mjs';

const cmd=process.argv[2];
if(cmd==='verify'){
 const file=process.argv[3];if(!file){console.error('Usage: node bin/theater-proof.mjs verify <receipt.json> [trusted-key-sha256]');process.exit(2)}
 const s=fs.statSync(file);if(!s.isFile()||s.size>30000)throw Error('Receipt size invalid');
 const result=verifyTheaterReceipt(JSON.parse(fs.readFileSync(file,'utf8')),{trustedKeyId:process.argv[4]||null});
 console.log(JSON.stringify({valid:result.valid,issuer_trusted:result.issuer_trusted||false,reason:result.reason,issuer_key_id:result.key_id,execution_mode:result.payload?.execution_mode,production_release:result.payload?.limitations?.production_release??null},null,2));
 if(!result.valid)process.exitCode=1;
}else if(cmd==='run'){
 if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1')throw Error('Set AIFIRST_SYNTHETIC_DEMO=1 to run local fixtures');
 const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const root=path.join(repo,'.aifirst-local');
 const token=process.env.AIFIRST_ADMIN_TOKEN;if(!token)throw Error('Set AIFIRST_ADMIN_TOKEN from pilot:init; never put it in Git');
 const engine=new EditionRuntime(root);
 try{
  const ctx=engine.auth(token);
  const verified=new VerifiedTheater(engine);const receipt=await verified.run(ctx);
  const directory=path.join(root,'receipts');fs.mkdirSync(directory,{recursive:true,mode:0o700});
  const id=JSON.parse(receipt.payload_json).run_id;
  const dest=path.join(directory,id+'.json');fs.writeFileSync(dest,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({path:dest,receipt_run:id,signature_valid:verifyTheaterReceipt(receipt).valid,key_id:receipt.signer.key_id,production_release:false},null,2));
 }finally{engine.close();}
}else{console.error('Usage: node bin/theater-proof.mjs run | verify <receipt.json> [trusted-key-sha256]');process.exit(2)}
