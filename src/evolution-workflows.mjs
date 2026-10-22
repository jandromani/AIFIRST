/** Capability-to-business-domain bridge: AIFIRST Discovery & Transformation / Evolution OS.
 * Models cannot invoke privileged tools. Each adapter must be explicitly registered in the host.
 */
import crypto from 'node:crypto';
export const PIPELINES=Object.freeze({
 DISCOVERY:{domains:['01','03','05','14'],steps:['Context intake','Challenge design','Scenarios'],artifact:'CompanyContext/ChallengeBrief'},
 HACKATHON:{domains:['06','07','08','09','10','11'],steps:['Submission manifest','Independent evaluation','Jury draft'],artifact:'EvidenceClaim/EvaluationResult'},
 EVIDENCE:{domains:['09','11','12','13'],steps:['Trace and lineage','Uncertainty','Organizational graph'],artifact:'GraphNode/GraphEdge'},
 REPORTS:{domains:['13','14','15','16'],steps:['Reconcile claims','Draft EX01–EX11','G6 human review'],artifact:'DeliverableManifest'},
 SECURITY:{domains:['02','04','09','18','20'],steps:['Scan manifest metadata','Review security gates','Report potential failures'],artifact:'RiskRegister'},
 WEB_UX:{domains:['01','06','15','20'],steps:['Accessibility checklist','UX contract audit','Candidate improvement'],artifact:'UXAudit'},
 OPERATIONS:{domains:['07','10','16','17'],steps:['Resource assignment','Cost check','Human escalation'],artifact:'OperationsPlan'},
 INTEGRATIONS:{domains:['08','10','17','18'],steps:['Schema negotiation','Permission analysis','Connector report'],artifact:'IntegrationReadiness'},
 FINANCE_DRAFT:{domains:['01','17','19'],steps:['Hypothetical unit economics','Draft pricing','Human finance review'],artifact:'PriceModel'}
});

export function orchestrateBoundedTasks(os,ctx,{capabilities,subject_refs,adapter}={}){
 if(!Array.isArray(capabilities)||capabilities.length<1||capabilities.length>9)throw Error('1–9 capabilities required');
 if(!Array.isArray(subject_refs)||subject_refs.length!==capabilities.length)throw Error('A hash per capability required');
 if(typeof adapter!=='function')throw Error('Explicit trusted adapter required');
 const tasks=[];
 for(let i=0;i<capabilities.length;i++){
  const cap=capabilities[i],plan=PIPELINES[cap];if(!plan)throw Error('Unsupported pipeline');
  const task=os.createTask(ctx,{capability:cap,contract:`${plan.artifact}: ${plan.steps.join(' → ')}`,subject_hash:subject_refs[i]});
  const chosen=os.snapshot(ctx).agents.filter(a=>a.capability===cap&&a.status==='ACTIVE'&&a.role==='productive').sort((a,b)=>b.version-a.version)[0];
  if(!chosen)throw Error('No active productive agent for '+cap);
  os.assignTask(ctx,task.id,chosen.id);tasks.push({task,agent:chosen.id,run:()=>os.executeTask(ctx,task.id,adapter)});
 }
 return tasks;
}
export function syntheticReference(input){return crypto.createHash('sha256').update(String(input)).digest('hex');}

/** Run a bounded concurrent swarm. Each tool is an approved host callback, never arbitrary model code. */
export async function runBoundedSwarm(os,ctx,{capabilities,subject_refs,adapter,maxConcurrency=3}={}){
 if(!Number.isInteger(maxConcurrency)||maxConcurrency<1||maxConcurrency>3)throw Error('Concurrency cap 1–3');
 const scheduled=orchestrateBoundedTasks(os,ctx,{capabilities,subject_refs,adapter});
 const results=new Array(scheduled.length);let index=0;
 const workers=Array.from({length:Math.min(maxConcurrency,scheduled.length)},async()=>{
  while(index<scheduled.length){const slot=index++;try{results[slot]={...await scheduled[slot].run(),agent:scheduled[slot].agent};}
  catch(error){results[slot]={id:scheduled[slot].task.id,status:'FAILED_PENDING_HUMAN_REVIEW',error:String(error.message||error).slice(0,120)};}}
 });await Promise.all(workers);
 return {status:'PENDING_INDEPENDENT_MIRROR_REVIEW',tasks:results,parallel_workers:workers.length,production_release:false};
}
