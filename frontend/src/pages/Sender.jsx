import React, { useState } from 'react';
import {
  Send,
  Lock,
  Key,
  Copy,
  Download,
  Trash2,
  Check,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

export const Sender = ({ sessionKey, onSetSessionKey, onMessageSent, addToast }) => {
  const [plaintext, setPlaintext] = useState('');
  const [keyInput, setKeyInput] = useState(sessionKey || '');
  const [keyOption, setKeyOption] = useState(sessionKey ? 'existing' : 'generate');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [encryptedPayload, setEncryptedPayload] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Synchronize keyInput if sessionKey changes from outside
  React.useEffect(() => {
    if (sessionKey && !keyInput) {
      setKeyInput(sessionKey);
      setKeyOption('existing');
    }
  }, [sessionKey]);

  const handleGenerateKey = async () => {
    try {
      const data = await api.generateKey();
      setKeyInput(data.key);
      onSetSessionKey(data.key);
      addToast('success', 'Generated 256-bit AES Key', 'Cryptographically secure key ready in Base64 format.');
    } catch (err) {
      addToast('error', 'Key Generation Failed', err.message);
    }
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    addToast('info', 'Copied to Clipboard', `${fieldName} copied.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleEncrypt = async () => {
    if (!plaintext.trim()) {
      addToast('warning', 'Empty Message', 'Please enter a message to encrypt.');
      return;
    }
    if (!keyInput.trim()) {
      addToast('warning', 'Missing Key', 'Please generate or paste a 256-bit AES key.');
      return;
    }

    try {
      setIsEncrypting(true);
      // Validate key first
      const val = await api.validateKey(keyInput);
      if (!val.valid) {
        addToast('error', 'Invalid Key', val.message);
        setIsEncrypting(false);
        return;
      }

      const res = await api.encryptMessage({
        plaintext: plaintext.trim(),
        key: keyInput.trim(),
        sender: 'Alice',
        receiver: 'Bob'
      });

      setEncryptedPayload({
        ...res,
        original_plaintext: plaintext.trim() // Kept on Alice's client state only
      });

      onSetSessionKey(keyInput.trim());
      addToast('success', 'Encryption Succeeded', `Encrypted with AES-256-GCM. Nonce generated: ${res.nonce.substring(0, 8)}...`);
    } catch (err) {
      addToast('error', 'Encryption Failed', err.response?.data?.detail || err.message);
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleSendToBob = async () => {
    if (!encryptedPayload) return;

    try {
      setIsSending(true);
      const res = await api.sendMessage({
        message_id: encryptedPayload.message_id,
        ciphertext: encryptedPayload.ciphertext,
        nonce: encryptedPayload.nonce,
        auth_tag: encryptedPayload.auth_tag,
        sender: 'Alice',
        receiver: 'Bob',
        algorithm: encryptedPayload.algorithm
      });

      addToast('success', 'Transferred to Bob', 'Encrypted payload is now available in Bob\'s inbox.');
      if (onMessageSent) onMessageSent(encryptedPayload);
    } catch (err) {
      addToast('error', 'Transfer Failed', err.response?.data?.detail || err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!encryptedPayload) return;
    const exportData = {
      message_id: encryptedPayload.message_id,
      algorithm: encryptedPayload.algorithm,
      ciphertext: encryptedPayload.ciphertext,
      nonce: encryptedPayload.nonce,
      auth_tag: encryptedPayload.auth_tag,
      sender: 'Alice',
      receiver: 'Bob',
      encryption_timestamp: encryptedPayload.encryption_timestamp
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encrypted_${encryptedPayload.message_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('info', 'Download Started', 'Encrypted payload saved as JSON without plaintext.');
  };

  const handleClear = () => {
    setPlaintext('');
    setEncryptedPayload(null);
  };

  return (
    <div className="space-y-6">
      {/* Sender Identity Banner */}
      <div className="bg-[#0b121e] border border-cyan-800/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-600/50 flex items-center justify-center text-cyan-400 font-mono font-bold">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                TRANSMISSION ENDPOINT: SENDER
              </span>
            </div>
            <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <span>Alice</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="text-slate-400">Bob (Receiver)</span>
            </h3>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>AEAD Protection: AES-256-GCM</span>
        </div>
      </div>

      {/* Two Column Layout: Message Composition & Key Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Plaintext Composition */}
        <div className="lg:col-span-7 bg-[#0d1422] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>4.1 Message Composition</span>
            </h4>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className={`${plaintext.length > 9000 ? 'text-amber-400' : 'text-slate-400'}`}>
                {plaintext.length} / 10,000 chars
              </span>
              {plaintext && (
                <button
                  onClick={handleClear}
                  className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          <textarea
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value.slice(0, 10000))}
            placeholder="Type confidential message here... (e.g. coordinates, sensitive credentials, mission directives)"
            rows={7}
            className="w-full bg-[#070b13] border border-slate-800 focus:border-cyan-500 rounded-lg p-3.5 text-sm text-slate-100 placeholder-slate-600 font-mono outline-none transition-colors resize-y"
          />

          {/* Key Selection */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>4.3 256-bit AES Key Selection</span>
              </label>

              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setKeyOption('generate')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    keyOption === 'generate'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Option A: Generate
                </button>
                <button
                  type="button"
                  onClick={() => setKeyOption('existing')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    keyOption === 'existing'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Option B: Paste
                </button>
              </div>
            </div>

            {keyOption === 'generate' ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={keyInput}
                  readOnly
                  placeholder="Click 'Generate Key' to produce a 256-bit key"
                  className="flex-1 bg-[#070b13] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 placeholder-slate-600 outline-none"
                />
                <button
                  onClick={handleGenerateKey}
                  type="button"
                  className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate</span>
                </button>
                {keyInput && (
                  <button
                    onClick={() => handleCopy(keyInput, 'AES Key')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    title="Copy Key"
                  >
                    {copiedField === 'AES Key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste 44-character Base64 key (e.g. k5x9...)"
                  className="flex-1 bg-[#070b13] border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 outline-none"
                />
                {keyInput && (
                  <button
                    onClick={() => handleCopy(keyInput, 'AES Key')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    {copiedField === 'AES Key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              * Note: The secret key must be securely pre-shared with Bob through an out-of-band channel. It is never transmitted with the payload.
            </p>
          </div>

          {/* Encrypt Action Button */}
          <button
            onClick={handleEncrypt}
            disabled={isEncrypting || !plaintext.trim() || !keyInput.trim()}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-mono font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-600/20 cyber-glow-cyan"
          >
            {isEncrypting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Encrypting with AES-256-GCM...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Encrypt Message</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Encrypted Payload Output */}
        <div className="lg:col-span-5 bg-[#0d1422] border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>4.5 Encrypted Payload</span>
              </h4>
              {encryptedPayload && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  READY
                </span>
              )}
            </div>

            {encryptedPayload ? (
              <div className="space-y-3">
                {/* Message ID & Algorithm */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">MESSAGE ID</span>
                    <span className="text-white font-bold">{encryptedPayload.message_id}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">ALGORITHM</span>
                    <span className="text-cyan-400 font-bold">{encryptedPayload.algorithm}</span>
                  </div>
                </div>

                {/* Nonce */}
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      Unique Nonce (12 Bytes / 96 Bits Base64)
                    </span>
                    <button
                      onClick={() => handleCopy(encryptedPayload.nonce, 'Nonce')}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs font-mono text-cyan-300 break-all">{encryptedPayload.nonce}</p>
                </div>

                {/* Auth Tag */}
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      Authentication Tag (16 Bytes / 128 Bits Base64)
                    </span>
                    <button
                      onClick={() => handleCopy(encryptedPayload.auth_tag, 'Auth Tag')}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs font-mono text-emerald-400 break-all">{encryptedPayload.auth_tag}</p>
                </div>

                {/* Ciphertext */}
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      Ciphertext (Base64)
                    </span>
                    <button
                      onClick={() => handleCopy(encryptedPayload.ciphertext, 'Ciphertext')}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="max-h-24 overflow-y-auto text-xs font-mono text-slate-300 break-all bg-slate-900/60 p-1.5 rounded">
                    {encryptedPayload.ciphertext}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-xl">
                <Lock className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-xs font-mono text-slate-400">
                  No encrypted payload generated yet.
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Compose a plaintext message, choose or generate an AES key, and click "Encrypt Message".
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons: Send to Bob, Download, Copy */}
          {encryptedPayload && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                onClick={handleSendToBob}
                disabled={isSending}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-bold rounded-lg flex items-center justify-center gap-2 transition-all cyber-glow-green"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting payload to Bob...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>4.6 Send to Bob (Receiver)</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadJSON}
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </button>
                <button
                  onClick={() => handleCopy(JSON.stringify(encryptedPayload, null, 2), 'Full Payload')}
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Payload</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sender;
