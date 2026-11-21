import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Lock,
  Unlock,
  Key,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Copy,
  Clock,
  User,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

export const Receiver = ({ sessionKey, onSetSessionKey, addToast }) => {
  const [inboxMessages, setInboxMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [keyInput, setKeyInput] = useState(sessionKey || '');
  const [keyOption, setKeyOption] = useState(sessionKey ? 'session' : 'paste');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionResult, setDecryptionResult] = useState(null);
  const [loadingInbox, setLoadingInbox] = useState(true);

  // Sync sessionKey
  useEffect(() => {
    if (sessionKey && !keyInput) {
      setKeyInput(sessionKey);
      setKeyOption('session');
    }
  }, [sessionKey]);

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    try {
      setLoadingInbox(true);
      const data = await api.getInbox('Bob');
      setInboxMessages(data);
      if (data.length > 0 && !selectedMessage) {
        setSelectedMessage(data[0]);
      }
    } catch (err) {
      addToast('error', 'Failed to fetch inbox', err.message);
    } finally {
      setLoadingInbox(false);
    }
  };

  const handleSelectMessage = (msg) => {
    setSelectedMessage(msg);
    setDecryptionResult(null); // Clear previous result when changing message
  };

  const handleDecrypt = async () => {
    if (!selectedMessage) {
      addToast('warning', 'No Message Selected', 'Please select an incoming message to decrypt.');
      return;
    }
    if (!keyInput.trim()) {
      addToast('warning', 'Missing Key', 'Please provide a 256-bit AES key to decrypt.');
      return;
    }

    try {
      setIsDecrypting(true);
      setDecryptionResult(null);

      const res = await api.decryptMessage({
        message_id: selectedMessage.message_id,
        ciphertext: selectedMessage.ciphertext,
        nonce: selectedMessage.nonce,
        auth_tag: selectedMessage.auth_tag,
        key: keyInput.trim()
      });

      setDecryptionResult(res);

      if (res.success) {
        addToast('success', 'Decryption Succeeded', 'Authenticated plaintext verified and recovered.');
        // Update local inbox status
        setInboxMessages(prev => prev.map(m => m.message_id === selectedMessage.message_id ? { ...m, decryption_status: 'SUCCESS', authentication_status: 'VERIFIED' } : m));
      } else {
        addToast('error', 'Authentication Failed', res.message);
        setInboxMessages(prev => prev.map(m => m.message_id === selectedMessage.message_id ? { ...m, decryption_status: 'FAILED', authentication_status: 'FAILED' } : m));
      }
    } catch (err) {
      addToast('error', 'Decryption Error', err.response?.data?.detail || err.message);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    addToast('info', 'Copied to Clipboard', `${label} copied.`);
  };

  return (
    <div className="space-y-6">
      {/* Receiver Identity Banner */}
      <div className="bg-[#0b121e] border border-emerald-800/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-600/50 flex items-center justify-center text-emerald-400 font-mono font-bold">
            B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                TRANSMISSION ENDPOINT: RECEIVER
              </span>
            </div>
            <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <span>Bob</span>
              <span className="text-xs font-normal text-slate-400">(Awaiting encrypted transmissions from Alice)</span>
            </h3>
          </div>
        </div>

        <button
          onClick={fetchInbox}
          className="text-xs font-mono text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingInbox ? 'animate-spin' : ''}`} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {/* Main Grid: Inbox on Left, Payload & Decrypt on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Incoming Messages Inbox */}
        <div className="lg:col-span-5 bg-[#0d1422] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Inbox className="w-4 h-4 text-emerald-400" />
              <span>5.1 Incoming Messages ({inboxMessages.length})</span>
            </h4>
          </div>

          {loadingInbox ? (
            <div className="py-12 text-center text-xs font-mono text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
              Loading incoming messages...
            </div>
          ) : inboxMessages.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-slate-500 space-y-2 border-2 border-dashed border-slate-800/80 rounded-xl">
              <Inbox className="w-8 h-8 mx-auto text-slate-600" />
              <p>Inbox is empty.</p>
              <p className="text-[11px] text-slate-600">Switch to Alice (Sender) to encrypt and transmit a message.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {inboxMessages.map((msg) => {
                const isSelected = selectedMessage?.message_id === msg.message_id;
                return (
                  <div
                    key={msg.message_id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-950/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold text-white">
                        {msg.message_id}
                      </span>
                      <StatusBadge status={msg.decryption_status === 'SUCCESS' ? 'VERIFIED' : msg.decryption_status} size="xs" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Sender: <strong className="text-slate-300">{msg.sender}</strong></span>
                      <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                    </div>

                    <div className="mt-2 text-[10px] font-mono text-slate-500 truncate bg-slate-900/80 px-2 py-1 rounded">
                      Ciphertext: {msg.ciphertext.substring(0, 30)}...
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Payload Inspection & Decryption */}
        <div className="lg:col-span-7 space-y-6">
          {selectedMessage ? (
            <div className="bg-[#0d1422] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>5.2 Payload Inspection ({selectedMessage.message_id})</span>
                </h4>
                <span className="text-xs font-mono text-slate-400">
                  Algorithm: <strong className="text-cyan-400">{selectedMessage.algorithm}</strong>
                </span>
              </div>

              {/* Encrypted Material Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase block">96-bit Nonce</span>
                  <p className="text-cyan-300 break-all">{selectedMessage.nonce}</p>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase block">128-bit Auth Tag</span>
                  <p className="text-emerald-400 break-all">{selectedMessage.auth_tag}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[10px] font-mono uppercase">Full Ciphertext (Encrypted)</span>
                  <button
                    onClick={() => handleCopy(selectedMessage.ciphertext, 'Ciphertext')}
                    className="text-slate-400 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-24 overflow-y-auto text-xs font-mono text-slate-300 break-all bg-slate-900/60 p-2 rounded">
                  {selectedMessage.ciphertext}
                </div>
              </div>

              {/* 5.3 Decryption Key Input */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>5.3 Decryption Key Input</span>
                  </label>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setKeyOption('paste')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        keyOption === 'paste'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Option A: Paste Key
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setKeyOption('session');
                        if (sessionKey) setKeyInput(sessionKey);
                      }}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        keyOption === 'session'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Option B: Use Session Key
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Enter Base64 encoded 256-bit AES key..."
                    className="flex-1 bg-[#070b13] border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 outline-none"
                  />
                  {sessionKey && keyInput !== sessionKey && (
                    <button
                      onClick={() => setKeyInput(sessionKey)}
                      className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 rounded-lg"
                    >
                      Insert Alice's Key
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  * Decryption will succeed ONLY if this key is identical to the key Alice used for encryption.
                </p>
              </div>

              {/* 5.4 Decrypt Action */}
              <button
                onClick={handleDecrypt}
                disabled={isDecrypting || !keyInput.trim()}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-mono font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/30 cyber-glow-green"
              >
                {isDecrypting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Tag & Decrypting...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>5.4 Decrypt Message</span>
                  </>
                )}
              </button>

              {/* Decryption Result Banner */}
              {decryptionResult && (
                <div className={`p-4 rounded-xl border mt-4 ${
                  decryptionResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 cyber-glow-green'
                    : 'bg-rose-950/40 border-rose-500/60 text-rose-200 cyber-glow-red'
                }`}>
                  <div className="flex items-start gap-3">
                    {decryptionResult.success ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-mono font-bold text-sm uppercase tracking-wide">
                          {decryptionResult.success
                            ? 'MESSAGE SUCCESSFULLY DECRYPTED — AUTHENTICATION VERIFIED'
                            : 'DECRYPTION FAILED — AUTHENTICATION VERIFICATION FAILED'}
                        </h5>
                        <StatusBadge
                          status={decryptionResult.authentication_status}
                          size="xs"
                        />
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-mono">
                        {decryptionResult.message}
                      </p>

                      {decryptionResult.success && decryptionResult.decrypted_plaintext && (
                        <div className="mt-3 pt-3 border-t border-emerald-500/30">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                            Recovered Plaintext Message:
                          </span>
                          <div className="bg-slate-950/90 border border-emerald-500/30 rounded-lg p-3 text-sm text-emerald-300 font-mono whitespace-pre-wrap select-all">
                            {decryptionResult.decrypted_plaintext}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#0d1422] border border-slate-800 rounded-xl p-12 text-center text-xs font-mono text-slate-500">
              Select a message from the incoming list on the left to inspect and decrypt.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Receiver;
