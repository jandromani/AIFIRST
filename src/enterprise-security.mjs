/** Enterprise security boundary: OIDC signature validation, content classification and encrypted storage. */
import fs from 'node:fs';
import crypto from 'node:crypto';

const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
export function scanSensitive(buffer){
 if(!Buffer.isBuffer(buffer)||buffer.length>4*1024*1024)throw Error('Invalid scan payload');
 const s=buffer.toString('utf8');
 const findings=[];
 for(const [name,re] of [
  ['EMAIL',/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/],
  ['IBAN',/\bES\d{22}\b/],
  ['NATIONAL_ID',/\b\d{8}[A-HJ-NP-TV-Z]\b/],
  ['SECRET',/(?:sk-or-v1-|sk-[A-Za-z0-9]{20}|-----BEGIN (?:RSA|EC|OPENSSH|PRIVATE) PRIVATE KEY-----|(?:api[_-]?key|password|secret)\s*[:=]\s*\S{6,})/i],
 ])if(re.test(s))findings.push(name);
 return {status:findings.length?'REQUIRES_REDACTION':'LIMITED_STATIC_SCAN_ONLY',findings,sha256:sha(buffer),limitations:['Only heuristic text scan: not a certified PII/secret scanner','Binary documents require separate parser and AV']};
}
export function encryptArtifact(buffer,{masterKey,tenant,artifactId}){
 if(!Buffer.isBuffer(buffer)||typeof tenant!=='string'||typeof artifactId!=='string')throw Error('Invalid encryption arguments');
 const key=Buffer.isBuffer(masterKey)?masterKey:Buffer.from(masterKey||'','base64');
 if(key.length!==32)throw Error('AIFIRST_MASTER_KEY_B64 must hold 32 random bytes');
 const derived=crypto.hkdfSync('sha256',key,Buffer.from(tenant),Buffer.from('AIFIRST:'+artifactId),32);
 const nonce=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',derived,nonce);
 cipher.setAAD(Buffer.from(tenant+'|'+artifactId));
 const bytes=Buffer.concat([cipher.update(buffer),cipher.final()]);
 return Buffer.concat([Buffer.from('AIF1'),nonce,cipher.getAuthTag(),bytes]);
}
export function decryptArtifact(sealed,{masterKey,tenant,artifactId}){
 if(!Buffer.isBuffer(sealed)||sealed.length<32||sealed.subarray(0,4).toString()!=='AIF1')throw Error('Invalid encrypted artifact');
 const key=Buffer.isBuffer(masterKey)?masterKey:Buffer.from(masterKey||'','base64');if(key.length!==32)throw Error('Invalid master key');
 const derived=crypto.hkdfSync('sha256',key,Buffer.from(tenant),Buffer.from('AIFIRST:'+artifactId),32);
 const decipher=crypto.createDecipheriv('aes-256-gcm',derived,sealed.subarray(4,16));
 decipher.setAAD(Buffer.from(tenant+'|'+artifactId));decipher.setAuthTag(sealed.subarray(16,32));
 return Buffer.concat([decipher.update(sealed.subarray(32)),decipher.final()]);
}
function decode64(x){if(typeof x!=='string'||!/^[A-Za-z0-9_-]+$/.test(x))throw Error('Invalid JWT segment');return Buffer.from(x,'base64url');}
/** OIDC uses trusted (out-of-band) JWKS. It does NOT fetch attacker-provided key URLs. */
export function verifyOidcJwt(token,{issuer,audience,jwks,now=Math.floor(Date.now()/1000),maxAgeSeconds=3600,allowLocalLabIssuer=false}){
 if(typeof token!=='string'||token.length>12000)throw Error('OIDC token invalid');
 const allowedLab=allowLocalLabIssuer===true&&issuer==='http://127.0.0.1:58080/realms/aifirst-lab';
 if(!issuer||!(issuer.startsWith('https://')||allowedLab)||!audience||!jwks||!Array.isArray(jwks.keys))throw Error('OIDC trust configuration missing');
 const segments=token.split('.');if(segments.length!==3)throw Error('Invalid JWT');
 const header=JSON.parse(decode64(segments[0]).toString('utf8'));
 const claims=JSON.parse(decode64(segments[1]).toString('utf8'));
 if(!['RS256','ES256'].includes(header.alg)||!header.kid)throw Error('OIDC signing algorithm rejected');
 const jwk=jwks.keys.find(x=>x.kid===header.kid&&x.alg===header.alg&&x.use==='sig');
 if(!jwk||jwk.kty!==(header.alg==='RS256'?'RSA':'EC'))throw Error('Unknown OIDC signer');
 const key=crypto.createPublicKey({key:jwk,format:'jwk'});
 const signature=decode64(segments[2]);const signingInput=segments[0]+'.'+segments[1];
 const verified=crypto.verify('sha256',Buffer.from(signingInput),{key,dsaEncoding:header.alg==='ES256'?'ieee-p1363':'der'},signature);
 if(!verified)throw Error('OIDC signature invalid');
 const audiences=Array.isArray(claims.aud)?claims.aud:[claims.aud];
 if(claims.iss!==issuer||!audiences.includes(audience)||!claims.sub||!Number.isInteger(claims.exp)||now>=claims.exp)throw Error('OIDC claims invalid');
 if(claims.nbf!==undefined&&now<claims.nbf)throw Error('OIDC token not yet active');
 if(!Number.isInteger(claims.iat)||claims.iat>now+60||now-claims.iat>maxAgeSeconds)throw Error('OIDC token too old or missing iat');
 if(audiences.length>1&&claims.azp!==audience)throw Error('OIDC azp missing');
 return {subject:claims.sub,issuer:claims.iss,audience,verified_signature:true,expires_at:claims.exp};
}
export function loadTrustedJwks(filename){
 if(!filename||!fs.existsSync(filename))throw Error('Configured JWKS trust file missing');
 const data=JSON.parse(fs.readFileSync(filename,'utf8'));
 if(!Array.isArray(data.keys)||data.keys.some(x=>!x.kid||!x.alg||x.d))throw Error('Public-only JWKS required');
 return data;
}
