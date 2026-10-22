#!/usr/bin/env node
import {pgAuditClient} from '../src/local-stack-adapters.mjs';
if(process.argv[2]!=='migrate'){console.error('Usage: node bin/stack-migrate.mjs migrate');process.exit(2)}
if(process.env.AIFIRST_RUN_PG_MIGRATION!=='1'||!process.env.AIFIRST_PG_URL){console.error('Explicit migration enablement and PG URL required');process.exit(2)}
let client;
try{client=await pgAuditClient({connectionString:process.env.AIFIRST_PG_URL});console.log(JSON.stringify(await client.migrate()));}
catch(e){console.error(e.message);process.exitCode=1}
finally{await client?.close()}
