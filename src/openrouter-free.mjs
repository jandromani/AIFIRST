/** Explicit OpenRouter FREE adapter; source documents and private employee details NEVER cross boundary. */
import crypto from 'node:crypto';
const ENDPOINT='https://openrouter.ai/api/v1/chat/completions';
const MAX_TEXT=8000;
const SAFE_MODEL=m=>m==='openrouter/free'||(typeof m==='string'&&/^[a-z0-9._-]+\/[a-z0-9._-]+:free$/.test(m));
export function openRouterFree({apiKey=process.env.OPENROUTER_API_KEY,model='openrouter/free',fetchImpl=fetch,perDay=12,clock=()=>new Date(),db=null}={}){
 if(!apiKey || !/^sk-or-[A-Za-z0-9_-]{12,}$/.test(apiKey))throw Error('OPENROUTER_API_KEY required (never store in repository)');
 if(!SAFE_MODEL(model))throw Error('Only OpenRouter free model variants are permitted');
 if(!Number.isInteger(perDay)||perDay<1||perDay>50)throw Error('Free daily quota must be between 1 and 50');
 if(db)db.exec(`CREATE TABLE IF NOT EXISTS openrouter_usage(day TEXT NOT NULL, tenant TEXT NOT NULL, used INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day,tenant));`);
 let calls=0, currentDay='';
 return async({tenant='local-synthetic',model:requested=model,prompt,maxCostEur=0})=>{
  if(!SAFE_MODEL(requested))throw Error('Paid model blocked');
  if(maxCostEur<0||maxCostEur>1||!Number.isFinite(maxCostEur))throw Error('Budget invalid');
  if(typeof prompt!=='string'||prompt.length>MAX_TEXT)throw Error('Prompt length limit');
  let metadata;try{metadata=JSON.parse(prompt)}catch{throw Error('Structured metadata required');}
  if(!metadata||metadata.synthetic!==true||typeof metadata!=='object'||Array.isArray(metadata)||!Array.isArray(metadata.artifacts)||metadata.artifacts.length>50)throw Error('Only synthetic structured metadata permitted');
  // Send only names, content hashes and declared rubric: never raw files, PII, participant aliases, prompts or paths.
  // The fixed, trusted safety instruction mentions the word 'employee'; scan only outbound user-controlled fields.
  const forbidden=JSON.stringify({project:metadata.project,artifacts:metadata.artifacts,rubric:metadata.rubric});
  if(/\b(?:participant|employee|email|phone|iban|dni|nif|address|token|secret|credential|api_?key)\b/i.test(forbidden))throw Error('Potential personal/secret metadata blocked');
  const filtered={project:String(metadata.project??'').slice(0,120),artifacts:metadata.artifacts.map(a=>({name:String(a.name||'').slice(0,110),sha256:String(a.sha256||'').slice(0,64)})),rubric:metadata.rubric};
  if(filtered.artifacts.some(a=>!/^[a-f0-9]{64}$/.test(a.sha256)))throw Error('Invalid artifact digest');
  const day=clock().toISOString().slice(0,10);
  if(!db){if(day!==currentDay){calls=0;currentDay=day;}if(calls>=perDay)throw Error('Local OpenRouter free quota exhausted');calls++;}
  else{
    // pessimistic increment: failed calls count against upstream quotas
    db.exec('BEGIN IMMEDIATE');try{
      db.prepare('INSERT OR IGNORE INTO openrouter_usage(day,tenant,used) VALUES(?,?,0)').run(day,'__ACCOUNT_FREE_QUOTA__');
      const row=db.prepare('SELECT used FROM openrouter_usage WHERE day=? AND tenant=?').get(day,'__ACCOUNT_FREE_QUOTA__');
      if(row.used>=perDay)throw Error('Local OpenRouter free quota exhausted');
      db.prepare('UPDATE openrouter_usage SET used=used+1 WHERE day=? AND tenant=?').run(day,'__ACCOUNT_FREE_QUOTA__');db.exec('COMMIT');
    }catch(e){db.exec('ROLLBACK');throw e;}
  }
  const signal=AbortSignal.timeout(25000);
  const response=await fetchImpl(ENDPOINT,{method:'POST',signal,headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','HTTP-Referer':'https://github.com/jandromani/AIFIRST','X-Title':'AIFIRST local synthetic pilot'},body:JSON.stringify({model:requested,stream:false,temperature:0,max_tokens:500,messages:[
    {role:'system',content:'Review the PROJECT METADATA only. Return concise proposed risks, rubric observations and explicit uncertainty. NEVER judge individual employees, assert tests passed, or invent sources.'},
    {role:'user',content:JSON.stringify(filtered)}]})});
  if(!response.ok)throw Error(response.status===429?'OpenRouter free rate limit / retry later':`OpenRouter provider failed (${response.status})`);
  const body=await response.json();const content=body?.choices?.[0]?.message?.content;
  if(typeof content!=='string'||!content.trim()||content.length>16000)throw Error('Invalid OpenRouter answer');
  return {text:content,costEur:0,model:body.model||requested,usage:body.usage||{},provider:'openrouter',free_tier:true,review_required:true,request_digest:crypto.createHash('sha256').update(JSON.stringify(filtered)).digest('hex')};
 };
}
export const OPENROUTER_FREE_ENDPOINT=ENDPOINT;
