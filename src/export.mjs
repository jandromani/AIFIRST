// Fixed-fixture synthetic exporter. No network, no protected person data, no customer publication.
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
const SHA=s=>createHash("sha256").update(s,"utf8").digest("hex");
const WARNING="SIMULATION ONLY — NOT FOR CUSTOMER DISTRIBUTION OR EMPLOYMENT DECISIONS";
const eur=x=>Number(x).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
function cell(value){
 let x=String(value??"");
 if(/^\s*[=+\-@]/.test(x))x="'"+x;
 return '"'+x.replaceAll('"','""').replace(/\r|\n/g," ")+'"';
}
export function renderExecutive(result){
 if(result?.kind!=="SYNTHETIC_REHEARSAL"||result.production_ready!==false)throw Error("Not a safe synthetic run");
 const scenario=result.scenarios[0]||{};
 const gates=Object.entries(result.gate_states).map(([g,v])=>"- "+g+": "+v);
 const roadmap=result.activation.milestones.map(m=>"- "+m.milestone+" / "+m.item_id+" / "+m.status);
 return [
  "# AI First Discovery · Informe ejecutivo de demostración",
  "","> **"+WARNING+"**","",
  "**Edición:** "+result.run_id+" · **Estado:** revisión pendiente · No publicar","",
  "## Resumen de evidencias",
  "Propuesta con "+result.evidence.artifact_count+" artefactos comprobados por huella, todos en cuarentena.",
  "Puntuación provisional de una SOLUCIÓN ficticia: "+result.evidence.provisional_project_score+"/5. No evalúa empleados ni es un ranking definitivo.","",
  "## Escenario organizativo por revisar en G5",
  scenario.scenario_id+" — "+scenario.objective,
  "Coste estimado ficticio del escenario: "+eur(scenario.cost_range_eur?.[0]??0)+" a "+eur(scenario.cost_range_eur?.[1]??0)+".",
  "Ninguna persona ha sido reasignada.","",
  "## Roadmap D30 / D60 / D90",...roadmap,"",
  "## Economía (no resultados reales)",
  "Precio propuesto ficticio: "+eur(result.economics.hypothetical_price_eur),
  "Costes directos estimados: "+eur(result.economics.estimated_direct_cost_eur),
  "Margen bruto ilustrativo: "+(result.economics.margin_ratio*100).toFixed(2)+" %",
  "ROI del cliente: NO MEDIDO.","",
  "## Estado de ocho gates",...gates,"",
  "## Límites del diagnóstico",
  "- "+result.graph.node_count+" nodos y "+result.graph.edge_count+" relaciones, todos propuestos.",
  "- "+result.assurance.design_components+" componentes de diseño; "+result.assurance.unverified_components+" sin verificación de producción.",
  "- No hay autorización G3–G7, escaneo de malware, identidad del jurado o firmas auténticas.",
  "- Capacidades individuales excluidas de la salida ejecutiva.",
  "- No se afirma ahorro, seguridad, cumplimiento normativo ni preparación laboral.","",
  WARNING,""
 ].join("\n");
}
export function renderRoadmapCSV(result){
 if(result?.kind!=="SYNTHETIC_REHEARSAL")throw Error("Not synthetic");
 const rows=[["run_id","milestone","item_id","status","dependencies","gate"]];
 for(const m of result.activation.milestones){
  rows.push([result.run_id,m.milestone,m.item_id,m.status,(m.dependencies||[]).join(";"),"G7:UNVERIFIED"]);
 }
 return rows.map(row=>row.map(cell).join(",")).join("\n")+"\n";
}
export function renderTrace(result){
 if(result?.kind!=="SYNTHETIC_REHEARSAL")throw Error("Not synthetic");
 return JSON.stringify({classification:"SYNTHETIC_ONLY",warning:WARNING,run_id:result.run_id,
  gates:result.gate_states,journal:result.journal,release_allowed:false,production_ready:false,
  private_capabilities_exported:false},null,2)+"\n";
}
export function prepareExport(result){
 return {"Executive_Draft.md":renderExecutive(result),"Roadmap_Draft.csv":renderRoadmapCSV(result),"Evidence_Trace.json":renderTrace(result)};
}
export function writeSyntheticArtifacts(root,result){
 if(result?.ok!==true||result.kind!=="SYNTHETIC_REHEARSAL"||
  result.production_ready!==false||result.report_publishable!==false||
  Object.keys(result.gate_states||{}).length!==8||
  Object.values(result.gate_states).some(s=>s!=="UNVERIFIED"))throw Error("Refusing to export apparently authorized output");
 if(!/^run:[a-f0-9]{20}$/.test(result.run_id))throw Error("Unsafe run ID");
 const parent=path.resolve(root,"artifacts");
 const base=path.resolve(parent,"synthetic-engagement-"+result.run_id.slice(4));
 if(!base.startsWith(parent+path.sep))throw Error("Path outside artifact directory");
 if(fs.existsSync(parent)&&fs.lstatSync(parent).isSymbolicLink())throw Error("Symlink artifact directory blocked");
 if(fs.existsSync(base)&&fs.lstatSync(base).isSymbolicLink())throw Error("Symlink run directory blocked");
 fs.mkdirSync(base,{recursive:true,mode:0o700});
 const map=prepareExport(result),records=[];
 for(const [name,body] of Object.entries(map)){
  const target=path.join(base,name);
  if(fs.existsSync(target)){
   if(fs.readFileSync(target,"utf8")!==body)throw Error("Refusing overwrite of changed artifact: "+name);
  }else fs.writeFileSync(target,body,{flag:"wx",encoding:"utf8",mode:0o600});
  records.push({name,sha256:SHA(body),bytes:Buffer.byteLength(body,"utf8")});
 }
 const manifest=JSON.stringify({classification:"SYNTHETIC_NON_PRODUCTION",run_id:result.run_id,release_allowed:false,files:records},null,2)+"\n";
 const target=path.join(base,"Artifact_Manifest.json");
 if(fs.existsSync(target)){
  if(fs.readFileSync(target,"utf8")!==manifest)throw Error("Refusing overwrite of changed manifest");
 }else fs.writeFileSync(target,manifest,{flag:"wx",encoding:"utf8",mode:0o600});
 return {relative_path:path.relative(root,base),files:records,manifest_sha256:SHA(manifest),external_delivery:false};
}
