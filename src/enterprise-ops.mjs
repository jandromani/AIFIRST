/** Enterprise boundary adapters. No money movement, QES or bank truth without external trust configuration. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {encryptArtifact,decryptArtifact,scanSensitive,verifyOidcJwt} from './enterprise-security.mjs';

const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const json=x=>JSON.stringify(x);
const id=()=>crypto.randomUUID();
const SAFE_TEXT=x=>typeof x==='string'&&x.length>0&&x.length<=256;
export class EnterpriseOps{
 constructor(engine,{masterKey=null,oidc=null,bankVerifyKey=null}={}){
  this.engine=engine;this.masterKey=masterKey;this.oidc=oidc;this.bankVerifyKey=bankVerifyKey;
  this.db=engine.db;
  this.db.exec(`
  CREATE TABLE IF NOT EXISTS enterprise_bindings(issuer TEXT NOT NULL, subject TEXT NOT NULL, tenant TEXT NOT NULL, role TEXT NOT NULL, principal TEXT NOT NULL, PRIMARY KEY(issuer,subject));
  CREATE TABLE IF NOT EXISTS sealed_artifacts(artifact TEXT PRIMARY KEY, tenant TEXT NOT NULL, sha256 TEXT NOT NULL, state TEXT NOT NULL, inspected TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS gate_approvals(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,edition TEXT NOT NULL,gate TEXT NOT NULL,principal TEXT NOT NULL,payload_digest TEXT NOT NULL,signature TEXT NOT NULL,state TEXT NOT NULL,created TEXT NOT NULL,UNIQUE(tenant,edition,gate,principal));
  CREATE TABLE IF NOT EXISTS signer_keys(tenant TEXT NOT NULL,principal TEXT NOT NULL,key_pem TEXT NOT NULL,fingerprint TEXT NOT NULL,verified_issuer TEXT,PRIMARY KEY(tenant,principal));
  CREATE TABLE IF NOT EXISTS erp_exports(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,invoice TEXT NOT NULL,external_id TEXT,request_sha TEXT NOT NULL,status TEXT NOT NULL,created TEXT NOT NULL,UNIQUE(tenant,invoice));
  CREATE TABLE IF NOT EXISTS bank_imports(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,invoice TEXT NOT NULL,reference TEXT NOT NULL,statement_sha TEXT NOT NULL,status TEXT NOT NULL,created TEXT NOT NULL,UNIQUE(tenant,reference));
  `);
 }
 bindOidc(ctx,{issuer,subject,role,principal}){
  this.engine.permitted(ctx,'admin');
  if(!this.oidc||issuer!==this.oidc.issuer||!SAFE_TEXT(subject)||!SAFE_TEXT(principal)||!['admin','sales','sponsor','security','juror','finance','auditor'].includes(role))throw Error('OIDC identity binding invalid');
  const p=this.engine.row('SELECT * FROM principals WHERE id=? AND tenant=? AND role=? AND active=1',principal,ctx.tenant,role);
  if(!p)throw Error('Local principal not found');
  this.engine.run('INSERT INTO enterprise_bindings VALUES(?,?,?,?,?)',issuer,subject,ctx.tenant,role,principal);
  this.engine.stamp(ctx,'oidc.bind',principal,{issuer,subject_hash:sha(subject)});
  return {linked:true,issuer,subject_digest:sha(subject),tenant:ctx.tenant};
 }
 authenticateOidc(token){
  if(!this.oidc)throw Error('OIDC disabled');
  const v=verifyOidcJwt(token,this.oidc);
  const b=this.engine.row('SELECT * FROM enterprise_bindings WHERE issuer=? AND subject=?',v.issuer,v.subject);
  if(!b)throw Error('OIDC identity has no authorized tenant binding');
  const p=this.engine.row('SELECT active FROM principals WHERE id=? AND tenant=? AND role=?',b.principal,b.tenant,b.role);
  if(!p?.active)throw Error('OIDC account disabled');
  return {id:b.principal,tenant:b.tenant,role:b.role,auth_method:'verified_oidc',oidc_sub:v.subject,issuer:v.issuer};
 }
 /** Secure upload means encrypted at rest; AV and PII remain independently gated. */
 async secureUpload(ctx,submission,name,bytes,sha256){
  if(!this.masterKey)throw Error('Encrypted storage key is required');
  const inspection=scanSensitive(bytes);
  if(inspection.sha256!==sha256)throw Error('Upload digest mismatch');
  if(inspection.findings.length)throw Error('Potential secret/PII; redact before uploading');
  const result=await this.engine.upload(ctx,submission,name,bytes,sha256);
  const row=this.engine.own(ctx,'artifacts',result.id);
  const sealed=encryptArtifact(bytes,{masterKey:this.masterKey,tenant:ctx.tenant,artifactId:row.id});
  const encryptedPath=row.storage+'.sealed';
  fs.writeFileSync(encryptedPath,sealed,{flag:'wx',mode:0o600});
  const verified=decryptArtifact(fs.readFileSync(encryptedPath),{masterKey:this.masterKey,tenant:ctx.tenant,artifactId:row.id});
  if(sha(verified)!==sha256){fs.rmSync(encryptedPath,{force:true});throw Error('Encryption integrity check failed');}
  this.engine.transaction(()=>{
   this.engine.run('UPDATE artifacts SET storage=? WHERE id=? AND tenant=?',encryptedPath,row.id,ctx.tenant);
   this.engine.run('INSERT INTO sealed_artifacts VALUES(?,?,?,?,?)',row.id,ctx.tenant,sha256,'AES_256_GCM',json(inspection));
  });
  fs.rmSync(row.storage,{force:true});
  this.engine.stamp(ctx,'artifact.encrypted',row.id,{sha256});
  return {...result,encrypted_at_rest:true,pii_and_secrets:'LIMITED_SCAN_ONLY',external_av_verified:false};
 }
 /** Two cryptographic checks: external OIDC identity and user Ed25519 signature. NOT a qualified e-signature. */
 registerSigner(ctx,pem){
  if(ctx.auth_method!=='verified_oidc')throw Error('Signers require externally verified OIDC identity');
  const k=crypto.createPublicKey(pem);
  if(k.asymmetricKeyType!=='ed25519')throw Error('Only Ed25519 signer keys supported');
  const canonical=k.export({type:'spki',format:'pem'}).toString(),fingerprint=sha(canonical);
  this.engine.run('INSERT OR REPLACE INTO signer_keys VALUES(?,?,?,?,?)',ctx.tenant,ctx.id,canonical,fingerprint,ctx.issuer);
  return {fingerprint,registered:true,qualified_electronic_signature:false};
 }
 approvalPayload(ctx,edition,gate,evidenceDigest){
  this.engine.own(ctx,'editions',edition);
  if(!/^G[1-7]$/.test(gate)||!/^[0-9a-f]{64}$/.test(evidenceDigest))throw Error('Gate evidence digest invalid');
  return json({schema:1,tenant:ctx.tenant,edition,gate,evidenceDigest});
 }
 signGate(ctx,edition,gate,evidenceDigest,signatureB64){
  if(ctx.auth_method!=='verified_oidc')throw Error('OIDC required for gate approval');
  const roles={G1:['admin'],G2:['admin','sponsor'],G3:['security'],G4:['juror'],G5:['sponsor'],G6:['sponsor'],G7:['sponsor']};
  this.engine.permitted(ctx,...(roles[gate]||[]));
  const record=this.engine.row('SELECT * FROM signer_keys WHERE tenant=? AND principal=? AND verified_issuer=?',ctx.tenant,ctx.id,ctx.issuer);
  if(!record)throw Error('Signer key not bound to verified OIDC identity');
  const statement=this.approvalPayload(ctx,edition,gate,evidenceDigest);
  if(!crypto.verify(null,Buffer.from(statement),record.key_pem,Buffer.from(signatureB64||'','base64')))throw Error('Invalid gate signature');
  const key='approval_'+id();
  this.engine.run('INSERT INTO gate_approvals VALUES(?,?,?,?,?,?,?,?,?)',key,ctx.tenant,edition,gate,ctx.id,evidenceDigest,signatureB64,'CRYPTO_VERIFIED_LEGAL_REVIEW_PENDING',new Date().toISOString());
  this.engine.stamp(ctx,'gate.signature_verified',key,{gate,digest:evidenceDigest});
  return {id:key,gate,cryptographic_signature_verified:true,oidc_identity_verified:true,qualified_electronic_signature:false,legal_acceptance_pending:true,release_allowed:false};
 }
 approvals(ctx,edition){this.engine.own(ctx,'editions',edition);return this.engine.rows('SELECT gate,principal,state,created,payload_digest FROM gate_approvals WHERE tenant=? AND edition=?',ctx.tenant,edition);}
 /** Verifies a bank-signed statement. NOT an account API, and never triggers a transfer. */
 importBankStatement(ctx,invoiceId,statement,signatureB64){
  this.engine.permitted(ctx,'finance');const invoice=this.engine.own(ctx,'invoices',invoiceId);
  if(!this.bankVerifyKey)throw Error('Bank statement verification key not configured');
  if(!statement||statement.invoice_id!==invoiceId||statement.currency!=='EUR'||statement.amount_cents!==invoice.amount_cents||!SAFE_TEXT(statement.reference))throw Error('Bank statement fields mismatch');
  const k=crypto.createPublicKey(this.bankVerifyKey);
  if(!crypto.verify(null,Buffer.from(json(statement)),k,Buffer.from(signatureB64||'','base64')))throw Error('Bank statement signature invalid');
  const key='bank_'+id(),statementSha=sha(json(statement));
  this.engine.transaction(()=>{
   this.engine.run('INSERT INTO bank_imports VALUES(?,?,?,?,?,?,?)',key,ctx.tenant,invoiceId,statement.reference,statementSha,'SIGNED_STATEMENT_IMPORTED',new Date().toISOString());
   this.engine.run("UPDATE invoices SET status='BANK_STATEMENT_IMPORTED' WHERE id=? AND tenant=?",invoiceId,ctx.tenant);
  });
  this.engine.stamp(ctx,'bank.signed_statement_import',key,{statementSha});
  return {id:key,status:'BANK_STATEMENT_IMPORTED',signature_valid:true,verified_by_live_bank_api:false,money_moved:false};
 }
 /** A handoff to finance; no real payment initiated by this code. */
 payoutBatch(ctx,edition){
  this.engine.permitted(ctx,'finance');this.engine.own(ctx,'editions',edition);
  const pending=this.engine.rows("SELECT id,kind,reference,amount_cents FROM payouts WHERE tenant=? AND edition=? AND status='PENDING_EXTERNAL_PAYMENT'",ctx.tenant,edition);
  return {edition,currency:'EUR',approval_required:true,submitted_to_bank:false,money_moved:false,entries:pending};
 }
}
export function erpHttpsAdapter({endpoint,apiKey,fetchImpl=fetch}){
 const u=new URL(endpoint||'https://invalid.invalid');if(u.protocol!=='https:'||!apiKey||apiKey.length<12||u.username||u.password||u.hash)throw Error('HTTPS ERP endpoint and secret are required');
 return async({invoice,tenant})=>{
  if(!invoice||invoice.status!=='DRAFT'||!Number.isSafeInteger(invoice.amount_cents))throw Error('Only draft invoices can be sent to ERP');
  const data={reference:invoice.reference,amount_cents:invoice.amount_cents,currency:'EUR',client_tenant_reference:tenant,source:'AIFIRST_DRAFT'};
  const res=await fetchImpl(endpoint,{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`,'Idempotency-Key':sha(tenant+'|'+invoice.id)},body:json(data)});
  if(!res.ok)throw Error('ERP provider refused invoice request');
  const result=await res.json();if(!SAFE_TEXT(result.id)||!['accepted','pending'].includes(result.status))throw Error('ERP response invalid');
  return {external_invoice_id:result.id,status:'ERP_'+result.status.toUpperCase(),invoice_fiscal_validity_unverified:true,money_moved:false};
 };
}
