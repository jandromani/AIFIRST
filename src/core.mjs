// AIFIRST deterministic domain layer. No external dependencies, remote services or LLM calls.
import fs from "node:fs";
import path from "node:path";

export const CONTRACTS = ["ClientBrief","SalesQualification","PricingQuote","EngagementConfig","CompanyContext","RiskRegister","ChallengeBrief","Rubric","GateApproval"];

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
export function schemaFor(kind, root = process.cwd()) {
  if (!CONTRACTS.includes(kind)) throw new Error("Unknown contract: "+kind);
  return readJson(path.join(root,"contracts",kind+".schema.json"));
}

function typeIs(value, expected) {
  switch(expected) {
    case "object": return value !== null && typeof value === "object" && !Array.isArray(value);
    case "array": return Array.isArray(value);
    case "integer": return typeof value === "number" && Number.isInteger(value);
    case "number": return typeof value === "number" && Number.isFinite(value);
    case "string": return typeof value === "string";
    case "boolean": return typeof value === "boolean";
    case "null": return value === null;
    default: return false;
  }
}
export function validateSchema(schema, value, loc="$") {
  const errors=[];
  if (schema.const !== undefined && value !== schema.const) errors.push(loc+": must equal "+JSON.stringify(schema.const));
  if (schema.type && !typeIs(value,schema.type)) return errors.concat(loc+": expected "+schema.type);
  if (schema.enum && !schema.enum.includes(value)) errors.push(loc+": not in allowed values");
  if (schema.type === "string") {
    if (schema.minLength != null && value.length < schema.minLength) errors.push(loc+": too short");
    if (schema.maxLength != null && value.length > schema.maxLength) errors.push(loc+": too long");
    if (schema.pattern && !(new RegExp(schema.pattern).test(value))) errors.push(loc+": invalid identifier");
    if (schema.format === "date-time" && (!Number.isFinite(Date.parse(value)) || !/^\d{4}-\d\d-\d\dT/.test(value))) errors.push(loc+": invalid timestamp");
  }
  if (schema.type === "number" || schema.type === "integer") {
    if (schema.minimum != null && value < schema.minimum) errors.push(loc+": below minimum");
    if (schema.maximum != null && value > schema.maximum) errors.push(loc+": above maximum");
  }
  if (schema.type === "array") {
    if (schema.minItems != null && value.length < schema.minItems) errors.push(loc+": too few items");
    if (schema.uniqueItems && new Set(value.map(x=>JSON.stringify(x))).size !== value.length) errors.push(loc+": duplicate items");
    if (schema.items) value.forEach((v,i)=>errors.push(...validateSchema(schema.items,v,loc+"["+i+"]")));
  }
  if (schema.type === "object") {
    for (const key of (schema.required||[])) if (!Object.hasOwn(value,key)) errors.push(loc+"."+key+": required");
    for (const [key,v] of Object.entries(value)) {
      if (!(key in (schema.properties||{}))) {
        if (schema.additionalProperties === false) errors.push(loc+"."+key+": unknown property");
      } else errors.push(...validateSchema(schema.properties[key],v,loc+"."+key));
    }
  }
  return errors;
}
export function validateContract(kind, value, root=process.cwd()) {
  const errors=validateSchema(schemaFor(kind,root),value);
  if (kind==="Rubric" && value.criteria) {
    const weight=value.criteria.reduce((s,x)=>s+(typeof x.weight==="number"?x.weight:0),0);
    if(Math.abs(weight-1)>1e-8)errors.push("$.criteria: weights must sum to 1");
    if(new Set(value.criteria.map(x=>x.id)).size!==value.criteria.length)errors.push("$.criteria: duplicate ids");
  }
  if(kind==="PricingQuote" && value.items && value.target_margin != null && value.commercial_price_eur != null){
    const q=calculateQuote(value);
    if(q && value.commercial_price_eur + 0.01 < q.minimum_price_eur)errors.push("$.commercial_price_eur: below required target margin");
  }
  return errors;
}
export function calculateQuote(q) {
  if (!q || !Array.isArray(q.items) || !Number.isFinite(q.target_margin) || q.target_margin >= 1) return null;
  const cost=q.items.reduce((sum,x)=>sum+Number(x.quantity)*Number(x.unit_cost_eur),0);
  if(!Number.isFinite(cost))return null;
  return {
    direct_cost_eur:Math.round(cost*100)/100,
    target_margin:q.target_margin,
    minimum_price_eur:Math.ceil(cost/(1-q.target_margin)*100)/100,
    commercial_price_eur:q.commercial_price_eur,
    gross_profit_eur:Math.round((q.commercial_price_eur-cost)*100)/100,
    actual_gross_margin:q.commercial_price_eur>0?Math.round((q.commercial_price_eur-cost)/q.commercial_price_eur*10000)/10000:null,
    note:"Gross margin excludes fixed overhead, acquisition and taxes; employee time belongs in customer ROI."
  };
}
export function validateCatalog(catalog) {
  const errors=[];
  const ids = catalog.domains.flatMap(d=>d.components.map(n=>n.id));
  if (new Set(ids).size!==ids.length)errors.push("Duplicate component ids");
  if (catalog.componentCount!==ids.length)errors.push("componentCount mismatch");
  if (catalog.domainCount!==catalog.domains.length)errors.push("domainCount mismatch");
  for(const d of catalog.domains) for(const n of d.components) {
    if(!n.id.startsWith(d.id+"."))errors.push("Wrong node domain: "+n.id);
    for(const k of ["title","inputs","outputs","acceptance","owner"])if(!n[k])errors.push(n.id+": missing "+k);
  }
  const set=new Set(ids);
  for(const edge of catalog.edges){
    if(!set.has(edge.from))errors.push("Unresolved edge source: "+edge.from);
    if(!set.has(edge.to))errors.push("Unresolved edge target: "+edge.to);
  }
  return errors;
}
export function loadBundle(folder) {
  const objects={},errors={};
  for (const kind of CONTRACTS.filter(k=>k!=="GateApproval")) {
    const file=path.join(folder,kind+".json");
    if(fs.existsSync(file)){
      try{objects[kind]=readJson(file)}catch(e){errors[kind]=["Invalid JSON: "+e.message]}
    }
  }
  const approvals={};
  for(const gate of ["G0","G1","G2"]){
    const file=path.join(folder,gate+".approval.json");
    if(fs.existsSync(file)){
      try{approvals[gate]=readJson(file)}catch(e){errors[gate]=["Invalid approval JSON: "+e.message]}
    }
  }
  return {objects,approvals,errors};
}
export function evaluateGates(bundle,root=process.cwd()) {
  const {objects,approvals}=bundle;
  const gates=[
    {id:"G0",required:["ClientBrief","SalesQualification","PricingQuote"]},
    {id:"G1",required:["EngagementConfig","RiskRegister"]},
    {id:"G2",required:["CompanyContext","ChallengeBrief","Rubric"]}
  ];
  const results=[];
  for(const gate of gates){
    const errors=[];
    if(bundle.errors)for(const [k,errs] of Object.entries(bundle.errors))if(gate.required.includes(k)||k===gate.id)errors.push(...errs.map(e=>k+": "+e));
    for(const kind of gate.required){
      if(!objects[kind])errors.push(kind+": missing");
      else errors.push(...validateContract(kind,objects[kind],root).map(e=>kind+" "+e));
    }
    const approval=approvals[gate.id];
    if(!approval)errors.push("No human approval metadata for "+gate.id);
    else {
      errors.push(...validateContract("GateApproval",approval,root).map(e=>"Approval "+e));
      if(approval.gate_id!==gate.id)errors.push("Approval gate mismatch");
      if(approval.decision!=="approved")errors.push("Gate not approved by human");
      if(approval.conditions && approval.conditions.length)errors.push("Unresolved approval conditions");
    }
    const client=objects.ClientBrief?.client_id;
    for(const kind of gate.required){
      if(objects[kind]?.client_id && client && objects[kind].client_id!==client)errors.push(kind+": wrong client_id");
    }
    if(gate.id==="G0") {
      if(objects.SalesQualification?.discovery_status!=="qualified")errors.push("Lead is not qualified");
      if(objects.SalesQualification?.buyer_identified!==true)errors.push("No authorized buyer identified");
    }
    if(gate.id==="G1"){
      if(!results[0].passed)errors.push("Prior gate G0 not passed");
      if(objects.EngagementConfig?.sow_approved!==true)errors.push("SOW not approved");
      const dpa=objects.EngagementConfig?.dpa_status;
      if(!["approved","not_applicable_with_reason"].includes(dpa))errors.push("DPA pending");
      if(dpa==="not_applicable_with_reason" && (objects.EngagementConfig?.dpa_rationale||"").length<20)errors.push("DPA exclusion needs reason");
      for(const risk of objects.RiskRegister?.risks||[]){
        if(["critical","high"].includes(risk.severity)&&risk.status==="open")errors.push("High/critical risk open: "+risk.risk_id);
      }
    }
    if(gate.id==="G2"){
      if(!results[1].passed)errors.push("Prior gate G1 not passed");
      if(objects.Rubric?.published_before_start!==true)errors.push("Rubric not frozen/public");
      if(objects.ChallengeBrief?.rubric_id!==objects.Rubric?.rubric_id)errors.push("Challenge references wrong rubric");
      const baseline=objects.ChallengeBrief?.baseline_ref;
      if(baseline && !objects.CompanyContext?.baselines?.some(b=>b.id===baseline))errors.push("Challenge baseline does not exist in context");
      for(const risk of objects.RiskRegister?.risks||[]){
        if(["critical","high"].includes(risk.severity)&&risk.status==="open")errors.push("High/critical risk open: "+risk.risk_id);
      }
    }
    results.push({gate:gate.id,passed:errors.length===0,errors,warning:"Syntactic gate only: approval authority, legal compliance and evidence authenticity require external human verification."});
  }
  return results;
}
