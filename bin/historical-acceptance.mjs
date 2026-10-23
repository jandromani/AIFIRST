#!/usr/bin/env node
/** Local-only historical case evaluator. Import requires explicit approval, no uploads. */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {HistoricalAcceptance} from '../src/historical-acceptance.mjs';
const cmd=process.argv[2];const location=process.argv[3];
if(!['import','list','case'].includes(cmd)) {console.error('Usage: npm run history:import -- /private/AIFIRST_AGENT_TRACE_EVIDENCE | npm run history:list | npm run history:case -- S04');process.exit(2)}
if(!process.env.AIFIRST_ADMIN_TOKEN){console.error('Admin token required in AIFIRST_ADMIN_TOKEN');process.exit(2)}
if(cmd==='import'&&process.env.AIFIRST_ALLOW_CONFIDENTIAL_LOCAL_IMPORT!=='1'){console.error('Explicit AIFIRST_ALLOW_CONFIDENTIAL_LOCAL_IMPORT=1 required (authorized encrypted local disk)');process.exit(2)}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','.aifirst-local');
const engine=new EditionRuntime(root);
try{const ctx=engine.auth(process.env.AIFIRST_ADMIN_TOKEN);engine.permitted(ctx,'admin');const service=new HistoricalAcceptance(engine);
const output=cmd==='import'?service.importSamples(ctx,{directory:location,ackPrivate:true}):cmd==='case'?service.find(ctx,location):service.list(ctx);
console.log(JSON.stringify(output,null,2));}
catch(e){console.error('Historical acceptance:',e.message);process.exitCode=1}
finally{engine.close()}
