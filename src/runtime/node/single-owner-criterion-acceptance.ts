/** ENGÜRÜ / DoneCheck v1.2 versioned single-owner criterion acceptance.
 * A separate route: never impersonates a reviewer or writes `verified_finish`.
 * Must be called ONLY by the authority service that pins trusted roots from its
 * protected deployment/CAS configuration. Caller-supplied keys are NOT trust.
 * Main/runtime activation remains HOLD until a signed canonical CAS receipt.
 */
import { createHash, createPublicKey, verify as verifySignature } from 'node:crypto';
import { Buffer } from 'node:buffer';

export const ENGURU_CANONICAL_V421_SHA256 = '5f5ec92ed1a3ba7078c6e24873eda309453f22275b6285047c738a069db2075d';
const SHA = /^[a-f0-9]{64}$/;
const IDS = /^(?:H01|H02|DG02)-\d{2}$/;
const authenticated = new WeakSet<object>();
export const sha256 = (value: string | Buffer): string => createHash('sha256').update(value).digest('hex');
const canon = (x: unknown): string => JSON.stringify(x, (_k, val) =>
  val !== null && typeof val === 'object' && !Array.isArray(val)
    ? Object.fromEntries(Object.entries(val).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0)) : val);
const iso = (s: unknown) => typeof s === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(s) && Number.isFinite(Date.parse(s));
function assert(ok: unknown, code: string): asserts ok { if (!ok) throw new Error(code); }
const exactSha = (a: unknown, b: unknown) => typeof a === 'string' && typeof b === 'string' && SHA.test(a) && a === b;

export type Signed<T> = { payload: T; signatureBase64: string };
export interface Registry {
  schema: 'enguru.d03d04.owner-registry/v4.2.1'; status: 'ACTIVE_M02_ONLY';
  policySha256: string; ownerKeySha256: string; oracleKeySha256: string; version: number; epoch: number;
  nonce: string; notBefore: string; notAfter: string; revokedIds: string[];
  allowedIds: string[];
}
export interface Grant {
  schema: 'enguru.d03d04.owner-grant/v4.2.1'; grantId: string;
  actor: 'SOLE_HUMAN_OWNER'; action: 'ACCEPT_M02_CRITERION';
  policySha256: string; registryVersion: number; registryEpoch: number;
  registryNonce: string; criterionId: string; sourceSha256: string;
  testLogSha256: string; oracleReceiptSha256: string;
  notBefore: string; notAfter: string; denyM03: true; denyVerifiedFinish: true;
}
/** Root is supplied by the independently trusted deployment CAS store, never the producer. */
export interface TrustedActivationRoot {
  origin: 'PROTECTED_OWNER_CAS_STORE'; policySha256: string;
  ownerSpkiSha256: string; oracleSpkiSha256: string; expectedRegistrySha256: string;
  liveAuthorized: true; registryVersion: number; registryEpoch: number;
  registryNonce: string;
}
export interface VerifiedOwnerGrant { readonly criterionId: string; readonly grantId: string;
  readonly grantSha256: string; readonly policySha256: string;
  readonly sourceSha256: string; readonly testLogSha256: string;
  readonly oracleReceiptSha256: string; readonly oracleKeySha256: string; readonly epoch: number;
}
const verified = (g: VerifiedOwnerGrant) => authenticated.has(g);

function signedPayload<T>(value: Signed<T>, pem: string): T {
  assert(value && typeof value.signatureBase64 === 'string', 'SIGNATURE_ABSENT');
  const sig = Buffer.from(value.signatureBase64, 'base64');
  assert(sig.length === 64 && sig.toString('base64') === value.signatureBase64, 'SIGNATURE_ENCODING');
  assert(verifySignature(null, Buffer.from(canon(value.payload)), createPublicKey(pem), sig), 'SIGNATURE_INVALID');
  return value.payload;
}
/** Only the protected CAS-reading caller may supply `root`; this is NOT a public-input API. */
export function verifyOwnerGrant(input: {
  root: TrustedActivationRoot; signedRegistry: Signed<Registry>; signedGrant: Signed<Grant>;
  ownerPublicKeyPem: string; canonicalBytes: Buffer; now: string;
}): VerifiedOwnerGrant {
  const { root, signedRegistry, signedGrant, ownerPublicKeyPem, canonicalBytes, now } = input;
  assert(root?.origin === 'PROTECTED_OWNER_CAS_STORE' && root.liveAuthorized === true, 'TRUSTED_CAS_NOT_ACTIVE');
  assert(exactSha(root.policySha256, ENGURU_CANONICAL_V421_SHA256), 'UNTRUSTED_POLICY_ROOT');
  assert(exactSha(sha256(canonicalBytes), root.policySha256), 'CANONICAL_BYTES_CHANGED');
  assert(iso(now), 'CLOCK_INVALID');
  const pub = createPublicKey(ownerPublicKeyPem);
  assert(pub.asymmetricKeyType === 'ed25519' && exactSha(sha256(pub.export({format:'der',type:'spki'})),root.ownerSpkiSha256),'UNTRUSTED_OWNER_KEY');
  assert(exactSha(sha256(canon(signedRegistry)),root.expectedRegistrySha256),'UNTRUSTED_REGISTRY_SNAPSHOT');
  const r = signedPayload(signedRegistry,ownerPublicKeyPem);
  assert(r.schema==='enguru.d03d04.owner-registry/v4.2.1' && r.status==='ACTIVE_M02_ONLY','REGISTRY_NOT_ACTIVE');
  assert(exactSha(r.policySha256,root.policySha256) && exactSha(r.ownerKeySha256,root.ownerSpkiSha256) && exactSha(r.oracleKeySha256,root.oracleSpkiSha256) && r.oracleKeySha256!==r.ownerKeySha256,'REGISTRY_POLICY_OR_ORACLE_CHANGED');
  assert(r.version===root.registryVersion && r.epoch===root.registryEpoch && r.nonce===root.registryNonce,'CAS_VERSION_OR_NONCE_MISMATCH');
  assert(Number.isInteger(r.version)&&r.version>=1&&Number.isInteger(r.epoch)&&r.epoch>=0,'CAS_REVISION_INVALID');
  assert(iso(r.notBefore)&&iso(r.notAfter)&&Date.parse(r.notBefore)<=Date.parse(now)&&Date.parse(now)<=Date.parse(r.notAfter),'REGISTRY_EXPIRED');
  assert(Array.isArray(r.allowedIds)&&Array.isArray(r.revokedIds),'REGISTRY_LISTS_INVALID');
  const g=signedPayload(signedGrant,ownerPublicKeyPem);
  assert(g.schema==='enguru.d03d04.owner-grant/v4.2.1'&&g.actor==='SOLE_HUMAN_OWNER'&&g.action==='ACCEPT_M02_CRITERION','GRANT_WRONG_SCOPE');
  assert(g.denyM03===true&&g.denyVerifiedFinish===true,'HUMAN_THRESHOLD_BYPASS');
  assert(g.registryVersion===r.version&&g.registryEpoch===r.epoch&&g.registryNonce===r.nonce,'GRANT_STALE_CAS');
  assert(exactSha(g.policySha256,root.policySha256),'GRANT_POLICY_MISMATCH');
  assert(IDS.test(g.criterionId)&&r.allowedIds.includes(g.criterionId),'CRITERION_NOT_AUTHORIZED');
  assert(typeof g.grantId==='string'&&/^[A-Za-z0-9_-]{8,90}$/.test(g.grantId)&&!r.revokedIds.includes(g.grantId),'GRANT_REVOKED_OR_INVALID');
  for(const key of ['sourceSha256','testLogSha256','oracleReceiptSha256'] as const) assert(SHA.test(g[key]),'MISSING_SIGNED_CRITERION_PROOF');
  assert(iso(g.notBefore)&&iso(g.notAfter)&&Date.parse(g.notBefore)<=Date.parse(now)&&Date.parse(now)<=Date.parse(g.notAfter),'GRANT_EXPIRED');
  const result=Object.freeze({criterionId:g.criterionId,grantId:g.grantId,grantSha256:sha256(canon(signedGrant)),policySha256:g.policySha256,
    sourceSha256:g.sourceSha256,testLogSha256:g.testLogSha256,oracleReceiptSha256:g.oracleReceiptSha256,oracleKeySha256:r.oracleKeySha256,epoch:r.epoch});
  authenticated.add(result);
  return result;
}
export interface EvidenceInput { sourceBytes: Buffer; logBytes: Buffer; oracleReceiptBytes: Buffer;
  oraclePublicKeyPem: string; criterionId: string; executionId: string; }
export interface OracleReceipt { schema:'enguru.d03d04.oracle-criterion-proof/v1'; criterionId:string; executionId:string;
  outcome:'pass'; verificationResultId:string; sourceSha256:string; logSha256:string; }
export interface AuditLedgerLike { verify(): Promise<{valid:boolean;records?:Array<{event:{id:string;payload:Record<string,unknown>}}> ;headHash?:string|null}>;
  append(event:{id:string;type:string;actorId:string;occurredAt:string;payload:Record<string,unknown>}):Promise<{hash:string}>; }
export interface DoneCheckResultLike { id:string; outcome:string; criteria:Array<{criterionId:string;outcome:string}>; }
/** This route accepts only a verified criterion receipt; it does not finalize the product. */
export async function recordSingleOwnerCriterion(input: {authority:VerifiedOwnerGrant; evidence:EvidenceInput;
  donecheckResult:DoneCheckResultLike; ledger:AuditLedgerLike; occurredAt:string;}):Promise<{schema:string;state:'PASS_SCOPED';auditHeadHash:string|null|undefined;criterionId:string}> {
  const {authority,evidence,donecheckResult,ledger,occurredAt}=input;
  assert(verified(authority),'UNVERIFIED_OWNER_AUTHORITY');
  assert(iso(occurredAt),'DATE_INVALID');
  assert(evidence.criterionId===authority.criterionId && /^[A-Za-z0-9_-]{8,90}$/.test(evidence.executionId),'WRONG_CRITERION_OR_EXECUTION');
  assert(exactSha(sha256(evidence.sourceBytes),authority.sourceSha256) && exactSha(sha256(evidence.logBytes),authority.testLogSha256)
    && exactSha(sha256(evidence.oracleReceiptBytes),authority.oracleReceiptSha256),'EVIDENCE_BYTES_CHANGED');
  const oraclePub=createPublicKey(evidence.oraclePublicKeyPem);
  assert(oraclePub.asymmetricKeyType==='ed25519' && exactSha(sha256(oraclePub.export({format:'der',type:'spki'})),authority.oracleKeySha256),'ORACLE_KEY_UNTRUSTED');
  const oracleSigned=JSON.parse(evidence.oracleReceiptBytes.toString()) as Signed<OracleReceipt>;
  const oracleProof=signedPayload(oracleSigned,evidence.oraclePublicKeyPem);
  assert(oracleProof.schema==='enguru.d03d04.oracle-criterion-proof/v1'&&oracleProof.outcome==='pass'
    &&oracleProof.criterionId===evidence.criterionId&&oracleProof.executionId===evidence.executionId
    &&exactSha(oracleProof.sourceSha256,authority.sourceSha256) &&exactSha(oracleProof.logSha256,authority.testLogSha256)
    &&oracleProof.verificationResultId===donecheckResult.id,'ORACLE_RESULT_MISMATCH');
  assert(donecheckResult?.outcome==='pass'&&donecheckResult.criteria?.length===1
    && donecheckResult.criteria[0].criterionId===evidence.criterionId&&donecheckResult.criteria[0].outcome==='pass','DONECHECK_CRITERION_NOT_PASS');
  const prior=await ledger.verify();assert(prior?.valid===true,'LEDGER_UNAVAILABLE_OR_INVALID');
  const id='enguru-one-owner:'+authority.criterionId+':'+evidence.executionId;
  const proofSha256=sha256(canon({criterionId:evidence.criterionId,grantSha256:authority.grantSha256,sourceSha256:authority.sourceSha256,
    logSha256:authority.testLogSha256,oracleReceiptSha256:authority.oracleReceiptSha256}));
  const previous=prior.records?.filter(v=>v.event.id===id)||[];
  assert(previous.length<=1,'DUPLICATE_LEDGER_ID');
  if(previous.length===1){assert(previous[0].event.payload.proofSha256===proofSha256,'REPLAY_CONFLICT');}
  else { await ledger.append({id,type:'single_owner_criterion_evidence_authorized',actorId:'SOLE_HUMAN_OWNER',occurredAt,
    payload:{criterionId:evidence.criterionId,grantId:authority.grantId,proofSha256,policySha256:authority.policySha256,
      productAccepted:false,verifiedFinish:false}}); }
  const after=await ledger.verify();assert(after?.valid===true,'LEDGER_READBACK_FAILED');
  assert((after.records||[]).filter(v=>v.event.id===id&&v.event.payload.proofSha256===proofSha256).length===1,'LEDGER_READBACK_MISSING');
  return {schema:'donecheck.single-owner-criterion-evidence/v1',state:'PASS_SCOPED',auditHeadHash:after.headHash,criterionId:evidence.criterionId};
}