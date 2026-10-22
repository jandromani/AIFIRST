#!/usr/bin/env node
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {EditionRuntime} from '../src/edition-runtime.mjs';import {EvolutionOS} from '../src/evolution-os.mjs';import {demoScenario,SYNTHETIC_TRUSTED_EVALUATOR} from '../src/evolution-http.mjs';
const command=process.argv[2];
if(command!=='demo'){console.error('Usage: npm run evolution:demo');process.exit(2);}
// CLI uses its own isolated temporary database and never activates customer providers.
process.env.AIFIRST_SYNTHETIC_DEMO='1';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-evolution-demo-'));
const engine=new EditionRuntime(root);
try{
 const demo=engine.bootstrapTenant('AIFIRST demo / synthetic only');const ctx=engine.auth(demo.token);
 const os=new EvolutionOS(engine,{trustedEvaluator:SYNTHETIC_TRUSTED_EVALUATOR});os.init(ctx);
 const out=await demoScenario(os,ctx);
 console.log(JSON.stringify({status:out.status,product:'AIFIRST Agent Evolution OS',agents:out.snapshot.agents.length,positions:out.snapshot.positions.length,jobs:out.snapshot.jobs.length,arenas:out.snapshot.arenas.length,mirror_channels:out.snapshot.criticism_channels,belief_version:out.snapshot.beliefs.version,agent_of_week:out.league.agent_of_week,unanimous_replacement:out.belief_vote.unanimous,audit:os.auditChain(ctx),production_verified:false},null,2));
}finally{engine.close();fs.rmSync(root,{recursive:true,force:true});}
