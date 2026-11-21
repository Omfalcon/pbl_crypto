import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Bug,
  Key,
  Unlock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileCode,
  Radio,
  Copy
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

export const AttackerSimulation = ({ sessionKey, onSetSessionKey, addToast }) => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [attackScenario, setAttackScenario] = useState(null);
  const [tamperedPayload, setTamperedPayload] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const data = await api.getHistory('all', 0, 20);
      setMessages(data);
      if (data.length > 0 && !selectedMessage) {
        setSelectedMessage(data[0]);
      }
    } catch (err) {
      addToast('error', 'Failed to load messages for attack simulation', err.message);
    }
  };

  const handleSelectMessage = (msg) => {
    setSelectedMessage(msg);
    setAttackScenario(null);
    setTamperedPayload(null);
    setVerificationResult(null);
  };

  // 8.2 Attack Scenario 1: Modify Ciphertext
  const handleAttackCiphertext = async () => {
    if (!selectedMessage) return;
    try {
      setIsAttacking(true);
      setVerificationResult(null);
      const res = await api.tamperPayload({
        message_id: selectedMessage.message_id,
        ciphertext: selectedMessage.ciphertext,
        nonce: selectedMessage.nonce,
        auth_tag: selectedMessage.auth_tag,
        attack_type: 'ciphertext'
      });
      setAttackScenario('ciphertext');
      setTamperedPayload(res);
      addToast('warning', 'Ciphertext Tampered', 'Attacker modified byte 0 of the ciphertext.');
    } catch (err) {
      addToast('error', 'Tampering Error', err.message);
    } finally {
      setIsAttacking(false);
    }
  };

  // 8.3 Attack Scenario 2: Modify Authentication Tag
  const handleAttackTag = async () => {
    if (!selectedMessage) return;
    try {
      setIsAttacking(true);
      setVerificationResult(null);
      const res = await api.tamperPayload({
        message_id: selectedMessage.message_id,
        ciphertext: selectedMessage.ciphertext,
        nonce: selectedMessage.nonce,
        auth_tag: selectedMessage.auth_tag,
        attack_type: 'tag'
      });
      setAttackScenario('tag');
      setTamperedPayload(res);
      addToast('warning', 'Auth Tag Tampered', 'Attacker modified trailing byte of authentication tag.');
    } catch (err) {
      addToast('error', 'Tampering Error', err.message);
    } finally {
      setIsAttacking(false);
    }
  };

  // 8.4 Attack Scenario 3: Incorrect Key
  const handleAttackIncorrectKey = async () => {
    if (!selectedMessage) return;
    try {
      setIsAttacking(true);
      setVerificationResult(null);
      // Generate a different random key
      const badKeyGen = await api.generateKey();
      setCustomKeyInput(badKeyGen.key);
      setAttackScenario('incorrect_key');
      setTamperedPayload({
        attack_type: 'incorrect_key',
        description: 'Attacker or unauthorized receiver attempts decryption using an illegitimate 256-bit key.',
        original_payload: {
          ciphertext: selectedMessage.ciphertext,
          nonce: selectedMessage.nonce,
          auth_tag: selectedMessage.auth_tag
        },
        modified_payload: {
          ciphertext: selectedMessage.ciphertext,
          nonce: selectedMessage.nonce,
          auth_tag: selectedMessage.auth_tag,
          key: badKeyGen.key
        }
      });
      addToast('warning', 'Incorrect Key Generated', 'Simulated wrong key generated for decryption attempt.');
    } catch (err) {
      addToast('error', 'Attack Setup Failed', err.message);
    } finally {
      setIsAttacking(false);
    }
  };

  // 8.5 Attack Scenario 4: Modify Nonce
  const handleAttackNonce = async () => {
    if (!selectedMessage) return;
    try {
      setIsAttacking(true);
      setVerificationResult(null);
      const res = await api.tamperPayload({
        message_id: selectedMessage.message_id,
        ciphertext: selectedMessage.ciphertext,
        nonce: selectedMessage.nonce,
        auth_tag: selectedMessage.auth_tag,
        attack_type: 'nonce'
      });
      setAttackScenario('nonce');
      setTamperedPayload(res);
      addToast('warning', 'Nonce Modified', 'Attacker corrupted initial byte of nonce/IV.');
    } catch (err) {
      addToast('error', 'Tampering Error', err.message);
    } finally {
      setIsAttacking(false);
    }
  };

  // 8.6 Attack Scenario 5: Restore Original Payload
  const handleRestoreOriginal = () => {
    setAttackScenario('restored');
    setTamperedPayload(null);
    setVerificationResult(null);
    setCustomKeyInput('');
    addToast('info', 'Payload Restored', 'Reverted to the legitimate, untampered original encrypted payload.');
  };

  // Run Real Cryptographic Verification
  const handleRunVerification = async () => {
    if (!selectedMessage) return;

    const payloadToVerify = tamperedPayload?.modified_payload || {
      ciphertext: selectedMessage.ciphertext,
      nonce: selectedMessage.nonce,
      auth_tag: selectedMessage.auth_tag
    };

    let keyToUse = attackScenario === 'incorrect_key'
      ? customKeyInput
      : (sessionKey || '');

    if (!keyToUse) {
      try {
        const k = await api.generateKey();
        keyToUse = k.key;
        if (onSetSessionKey) onSetSessionKey(k.key);
      } catch {
        addToast('error', 'Verification Error', 'Unable to initialize verification key.');
        return;
      }
    }

    try {
      setIsVerifying(true);
      const res = await api.verifyPayload({
        message_id: selectedMessage.message_id,
        ciphertext: payloadToVerify.ciphertext,
        nonce: payloadToVerify.nonce,
        auth_tag: payloadToVerify.auth_tag,
        key: keyToUse
      });

      setVerificationResult({
        ...res,
        tested_scenario: attackScenario || 'original'
      });

      if (res.authenticated) {
        addToast('success', 'Verification Succeeded', 'Authentication verified — untampered payload confirmed.');
      } else {
        addToast('error', 'Authentication Failed', res.reason);
      }
    } catch (err) {
      addToast('error', 'Verification Error', err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="bg-[#0b121e] border border-rose-800/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-950 border border-rose-600/50 flex items-center justify-center text-rose-400 font-mono font-bold">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
              SECURITY RESEARCH: MODULE 5
            </span>
            <h3 className="text-lg font-bold text-white font-mono">
              Attacker Interception & Tampering Simulation
            </h3>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
          <span>Target Payload:</span>
          <strong className="text-cyan-400">{selectedMessage?.message_id || 'None'}</strong>
        </div>
      </div>

      {/* Target Message Selector */}
      <div className="bg-[#0d1422] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-mono text-slate-300 font-semibold uppercase">
            Select Intercepted Message:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {messages.slice(0, 5).map((m) => (
            <button
              key={m.message_id}
              onClick={() => handleSelectMessage(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${selectedMessage?.message_id === m.message_id
                ? 'bg-rose-950 text-rose-300 border border-rose-600/50 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
            >
              {m.message_id}
            </button>
          ))}
          {messages.length === 0 && (
            <span className="text-xs text-slate-500 font-mono">No messages yet. Send a message from Alice first.</span>
          )}
        </div>
      </div>

      {/* Attack Control Matrix */}
      <div className="bg-[#0d1422] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Attack Scenarios (8.2 - 8.6)</span>
          </h4>
          <span className="text-[11px] font-mono text-slate-400">
            Modifies a copy of the payload; original SQLite data is never corrupted
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Attack 1: Nonce */}
          <button
            onClick={handleAttackNonce}
            disabled={!selectedMessage || isAttacking}
            className={`p-3 rounded-xl border text-left transition-all ${attackScenario === 'nonce'
              ? 'bg-rose-950/80 border-rose-500 text-rose-200 cyber-glow-red'
              : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/40 text-slate-300'
              }`}
          >
            <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block mb-1">
              Scenario 1
            </span>
            <p className="text-xs font-mono font-bold">Modify Nonce</p>
            <p className="text-[11px] text-slate-400 mt-1">Alters 96-bit IV vector</p>
          </button>

          {/* Attack 2: Auth Tag */}
          <button
            onClick={handleAttackTag}
            disabled={!selectedMessage || isAttacking}
            className={`p-3 rounded-xl border text-left transition-all ${attackScenario === 'tag'
              ? 'bg-rose-950/80 border-rose-500 text-rose-200 cyber-glow-red'
              : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/40 text-slate-300'
              }`}
          >
            <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block mb-1">
              Scenario 2
            </span>
            <p className="text-xs font-mono font-bold">Modify Auth Tag</p>
            <p className="text-[11px] text-slate-400 mt-1">Corrupts 128-bit MAC tag</p>
          </button>

          {/* Attack 3: Ciphertext */}
          <button
            onClick={handleAttackCiphertext}
            disabled={!selectedMessage || isAttacking}
            className={`p-3 rounded-xl border text-left transition-all ${attackScenario === 'ciphertext'
              ? 'bg-rose-950/80 border-rose-500 text-rose-200 cyber-glow-red'
              : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/40 text-slate-300'
              }`}
          >
            <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block mb-1">
              Scenario 3
            </span>
            <p className="text-xs font-mono font-bold">Modify Ciphertext</p>
            <p className="text-[11px] text-slate-400 mt-1">Flips bits in ciphertext byte 0</p>
          </button>

          {/* Attack 4: Key */}
          <button
            onClick={handleAttackIncorrectKey}
            disabled={!selectedMessage || isAttacking}
            className={`p-3 rounded-xl border text-left transition-all ${attackScenario === 'incorrect_key'
              ? 'bg-amber-950/80 border-amber-500 text-amber-200'
              : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40 text-slate-300'
              }`}
          >
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block mb-1">
              Scenario 4
            </span>
            <p className="text-xs font-mono font-bold">Test Incorrect Key</p>
            <p className="text-[11px] text-slate-400 mt-1">Generates wrong 256-bit key</p>
          </button>

          {/* Attack 5: Restore */}
          <button
            onClick={handleRestoreOriginal}
            disabled={!selectedMessage}
            className={`p-3 rounded-xl border text-left transition-all ${attackScenario === 'restored' || (!attackScenario && !tamperedPayload)
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40 text-slate-300'
              }`}
          >
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-1">
              Scenario 5
            </span>
            <p className="text-xs font-mono font-bold">Restore Original</p>
            <p className="text-[11px] text-slate-400 mt-1">Valid original encrypted data</p>
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison: Original vs Attacked */}
      {selectedMessage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Payload */}
          <div className="bg-[#0d1422] border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Original Untampered Payload</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                LEGITIMATE
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">ORIGINAL NONCE</span>
                <p className="text-cyan-300 break-all">{selectedMessage.nonce}</p>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">ORIGINAL AUTH TAG</span>
                <p className="text-emerald-400 break-all">{selectedMessage.auth_tag}</p>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">ORIGINAL CIPHERTEXT (SAMPLE)</span>
                <p className="text-slate-300 break-all max-h-20 overflow-y-auto">{selectedMessage.ciphertext}</p>
              </div>
            </div>
          </div>

          {/* Attacked / Modified Payload */}
          <div className={`border rounded-xl p-5 space-y-3 ${tamperedPayload
            ? 'bg-[#150d18] border-rose-700/60 cyber-glow-red'
            : 'bg-[#0d1422] border-slate-800'
            }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Attacked Payload Version</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${tamperedPayload
                ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                {tamperedPayload ? 'TAMPERED COPY' : 'NO ACTIVE ATTACK'}
              </span>
            </div>

            {tamperedPayload ? (
              <div className="space-y-2 text-xs font-mono">
                <div className={`p-2 rounded border ${attackScenario === 'nonce' ? 'bg-rose-950/60 border-rose-500 text-rose-200' : 'bg-slate-950 border-slate-800 text-cyan-300'
                  }`}>
                  <span className="text-slate-500 text-[10px] block">
                    {attackScenario === 'nonce' ? 'MODIFIED NONCE (TAMPERED)' : 'NONCE'}
                  </span>
                  <p className="break-all">{tamperedPayload.modified_payload.nonce}</p>
                </div>

                <div className={`p-2 rounded border ${attackScenario === 'tag' ? 'bg-rose-950/60 border-rose-500 text-rose-200' : 'bg-slate-950 border-slate-800 text-emerald-400'
                  }`}>
                  <span className="text-slate-500 text-[10px] block">
                    {attackScenario === 'tag' ? 'MODIFIED AUTH TAG (TAMPERED)' : 'AUTH TAG'}
                  </span>
                  <p className="break-all">{tamperedPayload.modified_payload.auth_tag}</p>
                </div>

                <div className={`p-2 rounded border ${attackScenario === 'ciphertext' ? 'bg-rose-950/60 border-rose-500 text-rose-200' : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}>
                  <span className="text-slate-500 text-[10px] block">
                    {attackScenario === 'ciphertext' ? 'MODIFIED CIPHERTEXT (BIT-FLIP TAMPERED)' : 'CIPHERTEXT'}
                  </span>
                  <p className="break-all max-h-20 overflow-y-auto">{tamperedPayload.modified_payload.ciphertext}</p>
                </div>

                {attackScenario === 'incorrect_key' && (
                  <div className="p-2 rounded border bg-amber-950/60 border-amber-500 text-amber-200">
                    <span className="text-slate-400 text-[10px] block">SIMULATED WRONG KEY</span>
                    <p className="break-all">{customKeyInput}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-xs font-mono text-slate-500">
                Click one of the attack scenario buttons above to simulate an attacker altering payload components.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification Execution and Security Verdict */}
      <div className="bg-[#0d1422] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              Cryptographic Verification Engine Test
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Passes the active payload into the actual Python AES-256-GCM decryption engine to evaluate GHASH MAC integrity.
            </p>
          </div>

          <button
            onClick={handleRunVerification}
            disabled={isVerifying || !selectedMessage}
            className="py-2.5 px-6 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-mono font-bold rounded-lg flex items-center gap-2 transition-all shadow-md shadow-cyan-600/20 cyber-glow-cyan"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running AES-GCM Integrity Check...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Run Cryptographic Verification</span>
              </>
            )}
          </button>
        </div>

        {/* 8.7 Attack Result Visualization Banner */}
        {verificationResult && (
          <div className={`p-5 rounded-xl border mt-3 ${verificationResult.authenticated
            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 cyber-glow-green'
            : 'bg-rose-950/40 border-rose-500/60 text-rose-200 cyber-glow-red'
            }`}>
            <div className="flex items-start gap-4">
              {verificationResult.authenticated ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h5 className="font-mono font-bold text-base uppercase tracking-wider">
                    {verificationResult.authenticated
                      ? 'AUTHENTICATION VERIFIED — PAYLOAD INTEGRITY CONFIRMED'
                      : verificationResult.tested_scenario === 'ciphertext'
                        ? 'AUTHENTICATION FAILED — CIPHERTEXT TAMPERING DETECTED'
                        : verificationResult.tested_scenario === 'tag'
                          ? 'AUTHENTICATION FAILED — INVALID AUTHENTICATION TAG'
                          : verificationResult.tested_scenario === 'nonce'
                            ? 'AUTHENTICATION FAILED — PAYLOAD MODIFIED'
                            : 'DECRYPTION FAILED — AUTHENTICATION VERIFICATION FAILED'}
                  </h5>
                  <StatusBadge
                    status={verificationResult.authenticated ? 'VERIFIED' : 'FAILED'}
                    size="sm"
                  />
                </div>

                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  {verificationResult.reason}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-700/50 text-[11px] font-mono text-slate-400 flex flex-wrap gap-4">
                  <span>Attack Scenario: <strong className="text-white">{verificationResult.tested_scenario}</strong></span>
                  <span>Auth Gate: <strong className={verificationResult.authenticated ? 'text-emerald-400' : 'text-rose-400'}>{verificationResult.verification_status}</strong></span>
                  <span>Plaintext Released: <strong className={verificationResult.authenticated ? 'text-emerald-400' : 'text-rose-400'}>{verificationResult.authenticated ? 'YES' : 'NO (BLOCKED)'}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttackerSimulation;
