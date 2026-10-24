#!/usr/bin/env node
/** Run a synthetic, measured and Ed25519-signed shadow arena, no Docker or model API. */
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {EvolutionOS} from '../src/evolution-os.mjs';
import {IndependentArena,ARENA_PROTOCOL,judgeSigningMessage} from '../src/independent-arena.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','.aifirst-local');
const fresh=process.env.AIFIRST_SYNTHETIC_DEMO;
process.env.AIFIRST_SYNTHETIC_DEMO='1';
const engine=new EditionRuntime(root);
try{
 const {tenant,token}=engine.bootstrapTenant('AIFIRST Shadow Arena — synthetic laboratory');
 const ctx=engine.auth(token),evo=new EvolutionOS(engine);evo.init(ctx);
 const incumbent=evo.createAgent(ctx,{name:'Incumbent v1',role:'productive',capability:'SECURITY'});
 const candidate=evo.createAgent(ctx,{name:'Candidate v2',role:'candidate',capability:'SECURITY',status:'CANDIDATE'});
 const judgeToken=engine.addPrincipal(ctx,'auditor').token,judgeCtx=engine.auth(judgeToken);
 const keys=crypto.generateKeyPairSync('ed25519');const pub=keys.publicKey.export({type:'spki',format:'pem'});
 const arena=new IndependentArena(engine);arena.registerJudgeKey(judgeCtx,pub);
 const bundle={schema:ARENA_PROTOCOL,partition:'arena',provenance:'SYNTHETIC',cases:Array.from({length:12},(_,i)=>({id:`case_${String(i+1).padStart(3,'0')}`,task:{challenge:`Policy handling #${i+1}`,class:i%3===0?'safety':'quality'},expected:`ACCEPT_${i+1}`,hard_safety:i%3===0}))};
 const executor=async({agent,task})=>{
  const i=Number(task.challenge.match(/#(\d+)/)[1]);
  // Simulated candidate performs better; no model inference or untrusted code is executed.
  const answer=agent===incumbent.id&&i<=4?'WRONG':`ACCEPT_${i}`;
  return {answer,latency_ms:agent===incumbent.id?55:48,cost_usd:agent===incumbent.id?0.012:0.011};
 };
 const judge=async p=>{
  const flags={pass_A:p.output_A===p.expected,pass_B:p.output_B===p.expected,safety_violation_A:p.hard_safety&&p.output_A!==p.expected,safety_violation_B:p.hard_safety&&p.output_B!==p.expected};
  const payload={...p,...flags};
  return {...flags,signature:crypto.sign(null,Buffer.from(judgeSigningMessage(payload)),keys.privateKey).toString('base64')};
 };
 const result=await arena.execute(ctx,{bundle,incumbent:incumbent.id,candidate:candidate.id,executor,judgeCtx,judgePublicKey:pub,judge});
 console.log(JSON.stringify({tenant,local_admin_token_once:token,arena:{...result,details:undefined},audit:arena.verifyAudit(ctx),classification:'SYNTHETIC_ONLY',real_agent_comparison:false},null,2));
}finally{engine.close();if(fresh===undefined)delete process.env.AIFIRST_SYNTHETIC_DEMO;else process.env.AIFIRST_SYNTHETIC_DEMO=fresh;}
