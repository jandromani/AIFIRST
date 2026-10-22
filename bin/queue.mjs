#!/usr/bin/env node
/** Single synthetic job worker. Only trusted API calls to configured model; no project code execution. */
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {SyntheticJobQueue} from '../src/job-queue.mjs';
import {openRouterFree} from '../src/openrouter-free.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','.aifirst-local');
if(process.argv[2]!=='once'||process.env.AIFIRST_SYNTHETIC_DEMO!=='1'||process.env.AIFIRST_ALLOW_OPENROUTER_FREE!=='1'){
 console.error('Usage: AIFIRST_SYNTHETIC_DEMO=1 AIFIRST_ALLOW_OPENROUTER_FREE=1 node bin/queue.mjs once');
 process.exitCode=2;
}else if(!process.env.OPENROUTER_API_KEY||!process.env.AIFIRST_ADMIN_TOKEN){
 console.error('OPENROUTER_API_KEY and AIFIRST_ADMIN_TOKEN must be configured in a secret store');process.exitCode=2;
}else{
 const engine=new EditionRuntime(root);
 try{
   engine.agent=openRouterFree({db:engine.db,perDay:Number(process.env.AIFIRST_FREE_DAILY_LIMIT||12)});
   const ctx=engine.auth(process.env.AIFIRST_ADMIN_TOKEN);
   const q=new SyntheticJobQueue(engine);
   const outcome=await q.runOne(ctx,'worker_'+crypto.randomUUID().replaceAll('-',''));
   console.log(JSON.stringify({...outcome,release_allowed:false,actual_bank_calls:0}));
   if(outcome.status==='FAILED_PERMANENT')process.exitCode=1;
 }finally{engine.close();}
}
