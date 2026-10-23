#!/usr/bin/env node
/** Explicit, private, local-only importer. No files, logs, telemetry or keys leave this machine. */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {TraceIntelligence} from '../src/trace-intelligence.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','.aifirst-local');
const cmd=process.argv[2];
if(!['import','summary','candidates','graph'].includes(cmd)){console.error('Usage: node bin/trace-intelligence.mjs import runs.json events.jsonl | summary | candidates | graph');process.exit(2)}
if(!process.env.AIFIRST_ADMIN_TOKEN){console.error('Set AIFIRST_ADMIN_TOKEN in your local environment (never commit it).');process.exit(2)}
const engine=new EditionRuntime(root);
try{
 const ctx=engine.auth(process.env.AIFIRST_ADMIN_TOKEN);engine.permitted(ctx,'admin');
 const traces=new TraceIntelligence(engine);let out;
 if(cmd==='import'){
  if(process.env.AIFIRST_ALLOW_CONFIDENTIAL_LOCAL_IMPORT!=='1')throw Error('Set AIFIRST_ALLOW_CONFIDENTIAL_LOCAL_IMPORT=1 after checking disk encryption, file permissions and authorization');
  if(process.argv.length!==5)throw Error('Pass local runs.json and events.jsonl paths');
  out=await traces.importFiles(ctx,{runsFile:process.argv[3],eventsFile:process.argv[4],ackConfidential:true});
 }else if(cmd==='summary')out=traces.summary(ctx);
 else if(cmd==='candidates')out=traces.candidates(ctx,{limit:30});
 else out=traces.graph(ctx,{limit:100});
 console.log(JSON.stringify(out,null,2));
} catch(e){console.error('Trace Intelligence:',String(e.message||e));process.exitCode=1} finally {engine.close()}
