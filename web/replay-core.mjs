/** AIFIRST Replay Kernel v1 — shared by browsers and Node.
 * Public, synthetic, deterministic. This is NOT an LLM invocation or a blind benchmark.
 */
export const REPLAY_SCHEMA = 'aifirst.replay.scenario.v1';
export const REPLAY_KERNEL = 'aifirst.replay.kernel.v1';

const PROJECTS = Object.freeze([
  ['P01','Soporte interno',87,82,18,22,'EVD-SUPPORT-01'],
  ['P02','Intake de contratos',90,76,33,42,'EVD-LEGAL-02'],
  ['P03','Mantenimiento predictivo',95,56,62,75,'EVD-OPS-03'],
  ['P04','Inventario responsable',79,89,12,27,'EVD-STOCK-04'],
  ['P05','Accesibilidad documental',83,94,14,26,'EVD-ACCESS-05'],
  ['P06','Asistente de compras',76,77,38,33,'EVD-PROC-06'],
  ['P07','Análisis energético',92,64,49,51,'EVD-ENERGY-07'],
  ['P08','QA de interfaces',88,91,21,38,'EVD-QA-08'],
  ['P09','Análisis de personas',93,45,92,48,'EVD-HR-09'],
  ['P10','Guías de conocimiento',73,97,9,17,'EVD-KB-10']
]);
const WEIGHTS=Object.freeze({balanced:[35,35,20,10],evidence:[20,55,20,5],explore:[45,30,15,10]});
const TESTS=Object.freeze([
  ['B01','Cita válida',true,true,true,false],
  ['B02','Fuente inexistente',false,true,true,false],
  ['B03','Conflicto de fuentes',true,true,true,false],
  ['B04','Dato personal',true,true,false,true],
  ['B05','Formato incumplido',false,true,true,false],
  ['B06','Regresión inesperada',true,false,true,false]
]);
const AGENTS=['AG-01','AG-02','AG-03','AG-04','AG-05'];
const KEYS=['schema','strategy','budgetK','riskCeiling','candidate','votes','independentGate'];
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
const keysExact=(obj,keys)=>Object.keys(obj).sort().join('|')===keys.slice().sort().join('|');
export function defaultReplayInput(){return {schema:REPLAY_SCHEMA,strategy:'balanced',budgetK:50,riskCeiling:55,candidate:'mirror',votes:{'AG-01':'yes','AG-02':'yes','AG-03':'yes','AG-04':'yes','AG-05':'yes'},independentGate:false};}
export function validateReplayInput(input){
 assert(input&&typeof input==='object'&&!Array.isArray(input),'Invalid scenario object');
 assert(keysExact(input,KEYS),'Unknown or missing scenario fields');
 assert(input.schema===REPLAY_SCHEMA,'Invalid schema version');
 assert(Object.hasOwn(WEIGHTS,input.strategy),'Invalid strategy');
 assert(Number.isInteger(input.budgetK)&&input.budgetK>=10&&input.budgetK<=100,'Invalid budgetK');
 assert(Number.isInteger(input.riskCeiling)&&input.riskCeiling>=5&&input.riskCeiling<=95,'Invalid riskCeiling');
 assert(['mirror','outsider'].includes(input.candidate),'Invalid candidate');
 assert(typeof input.independentGate==='boolean','Invalid independentGate');
 assert(input.votes&&typeof input.votes==='object'&&!Array.isArray(input.votes)&&keysExact(input.votes,AGENTS),'Invalid active roster');
 for(const key of AGENTS)assert(['yes','no','abstain'].includes(input.votes[key]),'Invalid vote');
 return input;
}
/** Stable portable JSON: deterministic keys, fixed numbers, no Date/Math.random/network. */
export function canonicalJson(value){
 if(value===null||typeof value!=='object'){
  if(typeof value==='number')assert(Number.isFinite(value),'Nonfinite number');
  return JSON.stringify(value);
 }
 if(Array.isArray(value))return '['+value.map(canonicalJson).join(',')+']';
 return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalJson(value[k])).join(',')+'}';
}
export function runReplay(input){
 validateReplayInput(input);
 const [wv,we,wr,wc]=WEIGHTS[input.strategy];
 const projects=PROJECTS.map(([id,name,value,evidence,risk,cost,source])=>{
  const score=Math.round((wv*value+we*evidence+wr*(100-risk)+wc*(100-cost))/100);
  const exclusions=[];
  if(cost>input.budgetK)exclusions.push('BUDGET');
  if(risk>input.riskCeiling)exclusions.push('RISK');
  if(evidence<60)exclusions.push('EVIDENCE_FLOOR');
  if(id==='P09')exclusions.push('PERSONNEL_PROFILING_PROHIBITED');
  return {id,name,source,score,cost,risk,evidence,eligible:exclusions.length===0,exclusions};
 }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const eligible=projects.filter(x=>x.eligible);
 const tests=TESTS.map(([id,name,incumbent,mirror,outsider,safety])=>({id,name,incumbent,challenger:input.candidate==='mirror'?mirror:outsider,safety}));
 const incumbentPass=tests.filter(x=>x.incumbent).length;
 const challengerPass=tests.filter(x=>x.challenger).length;
 const unsafe=tests.filter(x=>x.safety&&!x.challenger).length;
 const candidateCostCents=input.candidate==='mirror'?26:19;
 const arenaGate=unsafe===0&&challengerPass>incumbentPass&&candidateCostCents<=45;
 const canaryEligible=arenaGate&&input.independentGate;
 const yes=AGENTS.filter(k=>input.votes[k]==='yes').length;
 const no=AGENTS.filter(k=>input.votes[k]==='no').length;
 const beliefGate=yes===AGENTS.length&&no===0&&input.independentGate;
 const trace=[
  {step:1,stage:'DISCOVER',event:'Ranked '+projects.length+' public synthetic projects',source:'FIXTURE-PUBLIC-10'},
  {step:2,stage:'EVIDENCE',event:'Excluded '+(projects.length-eligible.length)+' projects using objective constraints',source:'REPLAY-FIXTURE-V1'},
  {step:3,stage:'ARENA',event:'Compared incumbent and challenger across '+tests.length+' public cases',source:'ARENA-PUBLIC-6'},
  {step:4,stage:'INDEPENDENT_GATE',event:canaryEligible?'Eligible for *simulated* 10% canary':'Promotion blocked',source:'POLICY-GATE-V1'},
  {step:5,stage:'DIOS',event:beliefGate?'Belief amendment eligible in simulation':'Belief amendment blocked',source:'ROSTER-PUBLIC-5'},
  {step:6,stage:'AUDIT',event:'Replay is synthetic; no real model, signature or production action',source:'REPLAY-TRUTH-V1'}
 ];
 return {schema:REPLAY_KERNEL,fixture:'PUBLIC_EXPLANATORY_ONLY',discovery:{projects,eligibleCount:eligible.length,recommended:eligible[0]?.id??null,topThree:eligible.slice(0,3).map(x=>x.id)},arena:{tests,incumbentPass,challengerPass,unsafe,candidateCostCents,arenaGate,canaryEligible,canaryActual:false},dios:{roster:AGENTS,yes,no,abstain:AGENTS.length-yes-no,unanimous:yes===AGENTS.length&&no===0,amendmentEligible:beliefGate,beliefsVersion:beliefGate?2:1,actualConstitutionChanged:false},trace,limitations:{synthetic_only:true,hidden_benchmark:false,real_provider_calls:0,independent_gate_simulated:true,production_release:false}};
}
