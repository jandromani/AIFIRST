/** Restricted adapter: only SYNTHETIC task metadata may be sent to OpenRouter Free. */
import {openRouterFree} from './openrouter-free.mjs';
const CAPABILITY_RUBRIC={quality:.45,reliability:.3,safety:.25};
export function makeEvolutionOpenRouterAdapter({apiKey=process.env.OPENROUTER_API_KEY,db,fetchImpl=fetch,model=process.env.AIFIRST_FREE_MODEL||'openrouter/free'}={}){
 if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1'||process.env.AIFIRST_ALLOW_OPENROUTER_FREE!=='1')throw Error('Synthetic Free provider boundary is closed');
 const invoke=openRouterFree({apiKey,db,fetchImpl,model,perDay:Number(process.env.AIFIRST_FREE_DAILY_LIMIT||12)});
 return async ({task})=>{
  // No prompt_spec, source document, untrusted contract, user identity, private report or raw customer data.
  const payload={synthetic:true,project:`Synthetic ${task.capability} improvement assessment`,artifacts:[{name:'synthetic-run-digest',sha256:task.subject_hash}],rubric:CAPABILITY_RUBRIC};
  const out=await invoke({tenant:'synthetic-evolution',model,prompt:JSON.stringify(payload),maxCostEur:0});
  return {summary:out.text.slice(0,2000),model:out.model,usage:out.usage,provider:'openrouter',pending_review:true};
 };
}
