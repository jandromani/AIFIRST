#!/usr/bin/env node
/** Build a portable, read-only marketing preview. NEVER bundle the private API or its tokens. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'web');
const target=path.resolve(process.argv[2]||path.join(root,'dist-preview'));
if(target===root||target===source||!target.startsWith(root+path.sep))throw Error('Output must be an isolated directory inside this repository');
if(fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())throw Error('Refusing symlink output');
const pages=['index.html','evolution.html','atlas.html','demo.html','replay.html'];
const routes={'/':'index.html','/evolution':'evolution.html','/demo':'demo.html','/replay':'replay.html','/atlas':'atlas.html','/console':'console.html','/lab':'lab.html','/traces':'traces.html'};
function rewriteLinks(html){
 return html.replace(/\bhref="(\/|\/evolution|\/demo|\/replay|\/atlas|\/console|\/lab|\/traces)(#[^"\s]*)?"/g,(_m,r,hash='')=>`href="${routes[r]}${hash}"`);
}
function banner(){return `<div role="status" style="position:relative;z-index:100;padding:12px 20px;background:#d8fa80;color:#142018;font:600 14px/1.5 system-ui;text-align:center">Vista pública estática · ejemplos sintéticos · las operaciones privadas requieren el servidor local. <a style="color:#142018;text-decoration:underline" href="console.html">Ver cómo ejecutar el producto</a></div>`;}
function render(name){
 if(!fs.existsSync(path.join(source,name)))return null;
 let html=fs.readFileSync(path.join(source,name),'utf8');
 html=rewriteLinks(html);
 // Non-indexed until the user explicitly authorizes a marketing release.
 html=html.replace(/<head([^>]*)>/i,(_m,a)=>`<head${a}><meta name="robots" content="noindex,nofollow">`);
 // This snapshot is static; never allow someone to enter credentials into a public mirror.
 if(name==='evolution.html'){
  const a=html.indexOf('<div class="connect">'), b=html.indexOf('<div class="warning">',a);
  if(a<0||b<a)throw Error('Evolution connection boundary changed; refusing unsafe public export');
  html=html.slice(0,a)+`<div class="connect"><span id="connection" role="status">Exploración de solo lectura · conexión privada deshabilitada</span><input type="password" id="token" disabled hidden autocomplete="off" aria-label="Token deshabilitado"><button id="connect" type="button" disabled hidden>Conectar</button><button id="seed" type="button" disabled hidden>Demo sintética</button></div>\n`+html.slice(b);
  for(const id of ['bridge-link','bridge-refresh','board-tick'])html=html.replace(new RegExp('(<button\\b)(?=[^>]*\\bid="'+id+'")','g'),'$1 disabled');
  html=html.replace('Sin agentes. Inicia una edición sintética con el botón superior.','Vista estática: la edición sintética se ejecuta en el piloto local.');
  // No API requests should occur through user-triggered actions in the static view.
  html=html.replace(/async function api\(path,opt=\{\}\)\{[\s\S]*?\nfunction replace\(/,`async function api(){throw Error('Vista pública: API privada no disponible')}\nfunction replace(`);
 }
 if(name==='replay.html'){
  // Inline the exact shared replay kernel, making the public artifact portable even as file://.
  // No private fixture or secret is ever copied into this kernel.
  const kernel=fs.readFileSync(path.join(source,'replay-core.mjs'),'utf8').replace(/^export /gm,'');
  const imp="import {REPLAY_SCHEMA,defaultReplayInput,runReplay,canonicalJson} from './replay-core.mjs';";
  if(!html.includes(imp))throw Error('Replay kernel integration changed: refusing mismatched export');
  html=html.replace(imp,kernel);
 }
 if(name==='index.html'||name==='evolution.html'||name==='replay.html')html=html.replace(/<body([^>]*)>/i,(_m,attrs)=>`<body${attrs}>${banner()}`);
 return html;
}
function placeholder(title,meaning){return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} · AIFIRST</title><style>:root{font-family:system-ui;background:#0b1513;color:#ebf4ee}body{margin:0;min-height:100vh;display:grid;place-items:center}main{max-width:670px;padding:32px}h1{font-size:clamp(30px,6vw,64px);letter-spacing:-.06em}p{line-height:1.7;color:#b9c7bc}a{color:#d8fa80}code{color:#d8fa80}article{border:1px solid #3b5443;padding:32px;border-radius:20px}</style></head><body><main><article><p style="color:#d8fa80">AIFIRST · PRIVATE PRODUCT BOUNDARY</p><h1>${title}</h1><p>${meaning}</p><p>Para ver la aplicación auténtica: <code>npm run pilot:init -- "Empresa sintética"</code> y <code>npm run pilot:serve</code>, en una copia local del repositorio. Después abre <code>http://127.0.0.1:4181/</code>.</p><a href="index.html">← Volver a la web pública</a></article></main></body></html>`;}
fs.mkdirSync(target,{recursive:true,mode:0o700});
const included=[];
for(const file of pages){const html=render(file);if(html){fs.writeFileSync(path.join(target,file),html,'utf8');included.push(file);}}
if(!included.includes('index.html')||!included.includes('evolution.html')||!included.includes('demo.html')||!included.includes('replay.html'))throw Error('Missing product website or Evolution OS page');
if(!included.includes('atlas.html')){fs.writeFileSync(path.join(target,'atlas.html'),placeholder('Operating Atlas','El Atlas navegable solo se incluye cuando se construye desde un checkout completo; esta copia local parcial no contenía web/atlas.html.'),'utf8');}
fs.writeFileSync(path.join(target,'console.html'),placeholder('Command Center','La consola de empresas está protegida por el API local de Node, con autenticación y almacenamiento. No existe una consola pública estática. No introduzcas tokens en esta vista.'),'utf8');
fs.writeFileSync(path.join(target,'lab.html'),placeholder('Integration Lab','Los informes de Keycloak, S3, cifrado, antivirus y evolución se generan y consultan en el laboratorio privado; no son credenciales ni certificaciones públicas.'),'utf8');
fs.writeFileSync(path.join(target,'traces.html'),placeholder('Trace Intelligence — solo privado','Las trazas confidenciales NO se incluyen en la web pública. Usa el piloto local autenticado y el importador CLI autorizado.'),'utf8');
fs.writeFileSync(path.join(target,'robots.txt'),'User-agent: *\nDisallow: /\n','utf8');
fs.writeFileSync(path.join(target,'PREVIEW_STATUS.json'),JSON.stringify({schema:'aifirst.public_preview.v1',static_read_only:true,production_ready:false,backend_included:false,client_data_included:false,atlas_included:included.includes('atlas.html'),decision_theater_included:included.includes('demo.html'),replay_studio_included:included.includes('replay.html'),public_replay_kernel_shared_with_node:true,interactive_demo_count:3,source_pages:included},null,2)+'\n');
console.log(JSON.stringify({created:target,pages:fs.readdirSync(target),read_only:true,atlas_included:included.includes('atlas.html')},null,2));
