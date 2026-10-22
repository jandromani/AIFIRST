/** Separate untrusted-code runner (local Docker only), disabled unless explicitly armed.
 * Test command generation with fake spawn; this is NOT an audited VM isolation boundary.
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const DIGEST_IMAGE=/^[a-z0-9][a-z0-9._/:-]{1,170}@sha256:[a-f0-9]{64}$/;
/** Never accept raw shell commands, network, root, privileged or writable mounts. */
export function sandboxArgs({image,sourceDir,timeoutMs=15000,memoryMb=256,cpus=.5}={}){
 if(!DIGEST_IMAGE.test(image||''))throw Error('Pinned digest image required');
 if(!Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>30000)throw Error('Invalid sandbox timeout');
 if(!Number.isInteger(memoryMb)||memoryMb<64||memoryMb>512||![.25,.5,1].includes(cpus))throw Error('Invalid resource budget');
 if(typeof sourceDir!=='string'||!path.isAbsolute(sourceDir)||/[\r\n,=]/.test(sourceDir))throw Error('Absolute safe fixture directory required');
 const p=path.resolve(sourceDir);const stat=fs.lstatSync(p);
 if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Unsafe sandbox fixture directory');
 for(const f of fs.readdirSync(p)){const stat=fs.lstatSync(path.join(p,f));if(stat.isSymbolicLink()||!(stat.isDirectory()||stat.isFile()))throw Error('Unsafe fixture entry');}
 const args=['run','--rm','--network','none','--read-only','--cap-drop','ALL',
  '--security-opt','no-new-privileges','--pids-limit','48',
  '--memory',`${memoryMb}m`,'--cpus',String(cpus),'--user','65534:65534',
  '--tmpfs','/tmp:rw,noexec,nosuid,size=16m',
  '--mount',`type=bind,source=${p},target=/work,readonly`,
  '--workdir','/work',image,'node','--disable-proto=throw','/work/main.mjs'];
 return {command:'docker',args,timeoutMs,network:'none',privileges:'dropped',production_attested:false};
}
export async function runSandbox(config,{spawnImpl=spawn}={}){
 if(process.env.AIFIRST_ENABLE_UNTRUSTED_SANDBOX!=='1')throw Error('Sandbox disabled by default');
 if(process.env.AIFIRST_SYNTHETIC_DEMO!=='1')throw Error('Untrusted sandbox is for synthetic fixtures only');
 const spec=sandboxArgs(config);
 const allow=process.env.AIFIRST_SANDBOX_FIXTURES_ROOT;
 if(!allow||!path.isAbsolute(allow)||!path.resolve(config.sourceDir).startsWith(path.resolve(allow)+path.sep))throw Error('Sandbox fixture root not allowlisted');
 return await new Promise((resolve,reject)=>{
  const cp=spawnImpl(spec.command,spec.args,{stdio:['ignore','pipe','pipe'],shell:false,env:{PATH:process.env.PATH||'/usr/bin:/bin'},windowsHide:true});
  let output='',errors='',finished=false;
  const kill=setTimeout(()=>{cp.kill('SIGKILL');finish(Error('Sandbox timed out'));},spec.timeoutMs);
  const finish=(err,result)=>{if(finished)return;finished=true;clearTimeout(kill);err?reject(err):resolve(result);};
  cp.stdout?.on('data',b=>{output+=b.toString();if(output.length>262144){cp.kill('SIGKILL');finish(Error('Sandbox output cap'));}});
  cp.stderr?.on('data',b=>{errors+=b.toString();if(errors.length>8192){cp.kill('SIGKILL');finish(Error('Sandbox stderr cap'));}});
  cp.on('error',()=>finish(Error('Sandbox runtime unavailable')));
  cp.on('exit',(code,signal)=>code===0?finish(null,{exit_code:code,output,review_required:true,production_attested:false}):finish(Error(`Sandbox failed: ${signal||code}`)));
 });
}
