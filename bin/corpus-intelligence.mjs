#!/usr/bin/env node
/** Private corpus ingestion. Never sends records to the API, GitHub, a cloud service or stdout. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {EditionRuntime} from '../src/edition-runtime.mjs';import {CorpusIntelligence} from '../src/corpus-intelligence.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','.aifirst-local');
const [cmd,dir,eventsPath]=process.argv.slice(2);
if(!['import','summary','runs','evaluations'].includes(cmd)){console.error('Usage: npm run corpus:import -- /path/to/private/corpus [03_TRACE_EVENTS.jsonl] | npm run corpus:summary | npm run corpus:runs');process.exit(2)}
if(!process.env.AIFIRST_ADMIN_TOKEN){console.error('AIFIRST_ADMIN_TOKEN required. Never paste it into chat or commit it.');process.exit(2)}
if(cmd==='import'&&process.env.AIFIRST_ALLOW_CONFIDENTIAL_LOCAL_IMPORT!=='1'){console.error('Explicit local confidential import gate AIFIRST_ALLOW_CONFIDENTIAL_LOCAL_IMPORT=1 required. Confirm authorization and encrypted disk.');process.exit(2)}
const e=new EditionRuntime(root);
try{const ctx=e.auth(process.env.AIFIRST_ADMIN_TOKEN);e.permitted(ctx,'admin');const c=new CorpusIntelligence(e);let result;
 if(cmd==='import')result=await c.importPackage(ctx,{directory:dir,eventsFile:eventsPath||null,ackPrivate:true});
 if(cmd==='summary')result={study:c.summary(ctx,{partition:'study'}),private_arena:c.summary(ctx,{partition:'arena'})};
 if(cmd==='runs')result=c.runs(ctx,{partition:'arena',onlyAudit:true,limit:30});
 if(cmd==='evaluations')result=c.evaluations(ctx,{partition:'arena',limit:40});
 console.log(JSON.stringify(result,null,2));}catch(err){console.error('Corpus:',err.message);process.exitCode=1}finally{e.close()}
