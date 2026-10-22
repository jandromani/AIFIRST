#!/usr/bin/env node
/** One-command signed local replay, no Docker, model provider, uploads or network. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {ReplayStudio,verifyReplayReceipt} from '../src/replay-studio.mjs';
import {defaultReplayInput} from '../web/replay-core.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-reference-replay-'));
fs.chmodSync(dir,0o700);
const prior=process.env.AIFIRST_SYNTHETIC_DEMO;
process.env.AIFIRST_SYNTHETIC_DEMO='1';
let engine;
try{
 engine=new EditionRuntime(dir);
 const admin=engine.auth(engine.bootstrapTenant('Synthetic reference company').token);
 const receipt=new ReplayStudio(engine).run(admin,defaultReplayInput());
 const verified=verifyReplayReceipt(receipt);
 if(!verified.valid||verified.issuer_trusted||verified.production_release!==false)throw Error('Unexpected replay assurance result');
 const out=process.argv[2]||'-';
 if(out==='-')process.stdout.write(JSON.stringify(receipt,null,2)+'\n');
 else{
  const target=path.resolve(out);
  if(!target.startsWith(path.resolve('artifacts')+path.sep))throw Error('Write only under artifacts/');
  fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});
  fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({written:target,verified:true,issuer_external_trust:false,production_release:false}));
 }
}finally{engine?.close();fs.rmSync(dir,{recursive:true,force:true});process.env.AIFIRST_SYNTHETIC_DEMO=prior;}
