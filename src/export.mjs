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
const escapeHtml=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
/** A standalone, accessible and printable CEO preview. No remote fonts, scripts, dependencies or people records. */
export function renderExecutiveHTML(result){
 if(result?.kind!=="SYNTHETIC_REHEARSAL"||result.production_ready!==false)throw Error("Not synthetic");
 const g=Object.entries(result.gate_states||{});
 if(g.length!==8||g.some(([,status])=>status!=="UNVERIFIED"))throw Error("Refusing authorized-looking CEO preview");
 const fmt=x=>escapeHtml(Number(x).toLocaleString("es-ES",{maximumFractionDigits:0}));
 const pct=x=>escapeHtml((100*x).toFixed(2).replace(".",","));
 const gates=g.map(([name,status])=>"<div class='gate'><b>"+escapeHtml(name)+"</b><span>"+escapeHtml(status)+"</span></div>").join("");
 const steps=(result.journal||[]).map((step,i)=>"<div class='step'><span class='step-index'>"+String(i+1).padStart(2,"0")+"</span><span><b>"+escapeHtml(step.step)+"</b><small>"+escapeHtml(step.status)+"</small></span></div>").join("");
 const milestones=result.activation.milestones.map(x=>"<article class='milestone'><b>"+escapeHtml(x.milestone)+"</b><span>"+escapeHtml(x.item_id)+"</span><small>"+escapeHtml(x.status)+" · PENDIENTE</small></article>").join("");
 const sc=result.scenarios[0]||{};
 const css=[
 ":root{color-scheme:light;--ink:#162437;--muted:#677386;--line:#dce3ed;--rose:#ef6b5b;--pale:#fff2ef;--bg:#f4f6fa;--card:#fff;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}",
 "*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-size:14px;line-height:1.55}",
 ".page{max-width:1160px;margin:0 auto;background:white;min-height:100vh;padding:0 54px 70px;box-shadow:0 15px 90px #14263d0d}",
 ".top{display:flex;justify-content:space-between;align-items:center;padding:30px 0;border-bottom:1px solid var(--line)}.brand{font-weight:850;font-size:17px;letter-spacing:-.6px}.brand i{font-style:normal;color:var(--rose)}.version{color:var(--muted);font-size:11px}",
 ".warning{margin:24px 0;background:var(--pale);border:1px solid #f6c9bf;color:#9a3527;border-radius:8px;padding:12px 16px;font-size:12px;font-weight:750;letter-spacing:.02em}",
 ".hero{padding:30px 0 35px;border-bottom:1px solid var(--line)}.eyebrow{font-size:11px;letter-spacing:.17em;font-weight:750;color:var(--rose);text-transform:uppercase}h1{font-size:clamp(34px,6vw,64px);line-height:1.06;letter-spacing:-2.5px;margin:14px 0;max-width:840px}h1 em{font-style:normal;color:var(--rose)}.lede{max-width:750px;color:var(--muted);font-size:16px}",
 ".grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:24px 0}.kpi{border:1px solid var(--line);border-radius:10px;padding:21px 18px;background:var(--card)}.kpi b{display:block;font-size:30px;letter-spacing:-1px;line-height:1.2}.kpi span{font-size:11px;color:var(--muted)}",
 "section{padding:31px 0 5px;border-bottom:1px solid var(--line)}.section-head{display:flex;justify-content:space-between;gap:18px;align-items:baseline;margin-bottom:12px}.number{font-size:11px;color:var(--rose);font-weight:800}.section-head h2{margin:0;letter-spacing:-.7px;font-size:24px}.note{color:var(--muted);font-size:12px}",
 ".two{display:grid;grid-template-columns:1.2fr .8fr;gap:24px}.panel{border:1px solid var(--line);border-radius:10px;padding:18px;margin:12px 0 25px}.panel h3{font-size:17px;margin:4px 0 10px}.panel p{color:var(--muted);margin:7px 0}.danger{color:#9a3527;font-weight:700}.gates{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0 28px}.gate{padding:12px 14px;background:#f7f9fc;border-radius:7px;border:1px solid var(--line)}.gate b{display:block}.gate span{display:block;font-size:10px;font-weight:800;color:#b34c40}",
 ".steps{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin:18px 0 25px}.step{display:flex;gap:10px;border:1px solid var(--line);border-radius:8px;padding:11px;align-items:center}.step-index{color:var(--rose);font-weight:800;font-size:12px}.step small{display:block;color:var(--muted);font-size:10px}.step b{font-size:11px}",
 ".roadmap{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0 25px}.milestone{border-left:3px solid var(--rose);padding:15px;background:#f8fafc;border-radius:4px}.milestone b{display:block;font-size:24px}.milestone span{display:block;font-size:12px}.milestone small{display:block;color:#9a3527;font-size:10px;margin-top:5px}",
 ".economics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:15px 0 25px}.econ{background:#14273b;color:white;border-radius:9px;padding:20px}.econ b{font-size:25px;display:block}.econ span{font-size:11px;color:#b9c8d7}.footer{padding:26px 0 0;color:var(--muted);font-size:11px;display:flex;justify-content:space-between}",
 "@media(max-width:800px){.page{padding:0 22px 50px}.grid,.gates{grid-template-columns:repeat(2,1fr)}.two{grid-template-columns:1fr}.economics,.roadmap{grid-template-columns:1fr}.steps{grid-template-columns:1fr}h1{letter-spacing:-1px}}",
 "@media print{body{background:#fff}.page{padding:0 18px;box-shadow:none}.hero{padding-top:12px}.kpi,.panel,.gate,.milestone,.econ,.step{break-inside:avoid}section{break-inside:avoid}h1{font-size:43px}.warning{print-color-adjust:exact;-webkit-print-color-adjust:exact}}"
 ].join("");
 return [
  "<!doctype html><html lang='es'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>",
  "<meta name='robots' content='noindex,nofollow'><title>AIFIRST · Discovery Executive Draft</title><style>"+css+"</style></head><body><main class='page'>",
  "<header class='top'><div class='brand'>AIFIRST <i>/ OPERATING INTELLIGENCE</i></div><div class='version'>VERSIÓN 0.2 · DEMOSTRACIÓN · NO PUBLICABLE</div></header>",
  "<div class='warning' role='alert'>SIMULACIÓN EXCLUSIVAMENTE · NO VALIDADA · NO APTA PARA DECISIONES LABORALES NI ENTREGA A CLIENTE</div>",
  "<div class='hero'><div class='eyebrow'>AI transformation intelligence · Proof of concept</div>",
  "<h1>Del reto a una <em>estrategia verificable.</em></h1>",
  "<p class='lede'>Una muestra ficticia de cómo las entregas de un hackatón pueden alimentar propuestas de transformación. No son resultados reales: la evidencia sigue en cuarentena y no hay autorizaciones externas.</p></div>",
  "<section><div class='section-head'><h2><span class='number'>01 / </span> Estado del diagnóstico</h2><span class='note'>Run "+escapeHtml(result.run_id)+"</span></div>",
  "<div class='grid'><div class='kpi'><b>"+fmt(result.evidence.artifact_count)+"</b><span>Artefactos con hash comprobado</span></div>",
  "<div class='kpi'><b>"+escapeHtml(result.evidence.provisional_project_score)+"/5</b><span>Evaluación provisional de SOLUCIÓN</span></div>",
  "<div class='kpi'><b>"+fmt(result.graph.node_count)+"</b><span>Nodos de propuesta</span></div>",
  "<div class='kpi'><b>0</b><span>Gates verificados realmente</span></div></div>",
  "<p class='note'>Los archivos no han pasado un escáner externo, ni se ha verificado el jurado. No hay ranking de empleados ni ROI observado.</p></section>",
  "<section><div class='section-head'><h2><span class='number'>02 / </span> Opciones de transformación</h2></div>",
  "<div class='two'><div class='panel'><h3>"+escapeHtml(sc.scenario_id||"Escenario pendiente")+"</h3>",
  "<p>"+escapeHtml(sc.objective||"Sin propuesta")+"</p><p><b>Rango hipotético:</b> "+fmt(sc.cost_range_eur?.[0]??0)+"–"+fmt(sc.cost_range_eur?.[1]??0)+" €</p></div>",
  "<div class='panel'><h3>Regla de decisión</h3><p>G5 exige patrocinador, validación de contexto y comité humano. No se ha asignado, promocionado ni reubicado a ningún empleado.</p></div></div></section>",
  "<section><div class='section-head'><h2><span class='number'>03 / </span> Roadmap sujeto a aprobación</h2></div>",
  "<div class='roadmap'>"+milestones+"</div></section>",
  "<section><div class='section-head'><h2><span class='number'>04 / </span> Hipótesis económica</h2></div>",
  "<div class='economics'><div class='econ'><b>"+fmt(result.economics.hypothetical_price_eur)+" €</b><span>Precio sintético</span></div>",
  "<div class='econ'><b>"+fmt(result.economics.estimated_direct_cost_eur)+" €</b><span>Coste directo estimado</span></div>",
  "<div class='econ'><b>"+pct(result.economics.margin_ratio)+"%</b><span>Margen bruto ilustrativo</span></div></div>",
  "<p class='note'>No incluye CAC, overhead, impuestos ni tiempo de empleados del cliente. Ahorros y beneficios reales: NO MEDIDOS.</p></section>",
  "<section><div class='section-head'><h2><span class='number'>05 / </span> Cadena de elaboración</h2></div><div class='steps'>"+steps+"</div></section>",
  "<section><div class='section-head'><h2><span class='number'>06 / </span> Puertas de control</h2></div><div class='gates'>"+gates+"</div>",
  "<p class='danger'>Todos los G0–G7 siguen sin verificación externa. Sin G3 y G4 no se puede usar el diagnóstico como evaluación validada, y sin G5–G7 no se puede publicar ni ejecutar un roadmap.</p></section>",
  "<section><div class='section-head'><h2><span class='number'>07 / </span> Limitaciones de evidencia</h2></div>",
  "<div class='panel'><p>Inventario documentado: "+fmt(result.assurance.design_components)+" componentes. Producción verificada: ninguna en este ejemplo.</p>",
  "<p>No se extrapola participación voluntaria a toda la plantilla; los perfiles individuales quedan excluidos del informe ejecutivo.</p>",
  "<p>No se han verificado seguridad, firmas, datos empresariales, efectos reales ni decisiones organizativas.</p></div></section>",
  "<footer class='footer'><span>AIFIRST · Evidence-first transformation design</span><span>CONFIDENTIAL DEMO / SYNTHETIC ONLY</span></footer>",
  "</main></body></html>"
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
 return {"Executive_Draft.md":renderExecutive(result),
  "Executive_Draft.html":renderExecutiveHTML(result),"Roadmap_Draft.csv":renderRoadmapCSV(result),"Evidence_Trace.json":renderTrace(result)};
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
