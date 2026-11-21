import React, { useState } from 'react';
import {
  Key,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Lock,
  FileCheck,
  Trash2
} from 'lucide-react';
import api from '../services/api';

export const KeyManagement = ({ sessionKey, onSetSessionKey, addToast }) => {
  const [currentKey, setCurrentKey] = useState(sessionKey || '');
  const [showKey, setShowKey] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const data = await api.generateKey();
      setCurrentKey(data.key);
      onSetSessionKey(data.key);
      setValidationResult({
        valid: true,
        algorithm: data.algorithm,
        key_size: data.key_size,
        message: 'Cryptographically secure 256-bit AES key generated successfully.'
      });
      addToast('success', 'Key Generated', 'Fresh 256-bit AES key created.');
    } catch (err) {
      addToast('error', 'Generation Error', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidate = async (keyToTest) => {
    const key = keyToTest !== undefined ? keyToTest : currentKey;
    if (!key.trim()) {
      setValidationResult(null);
      return;
    }

    try {
      setIsValidating(true);
      const res = await api.validateKey(key.trim());
      setValidationResult(res);
      if (res.valid) {
        onSetSessionKey(key.trim());
        addToast('success', 'Valid AES Key', res.message);
      } else {
        addToast('error', 'Invalid Key', res.message);
      }
    } catch (err) {
      addToast('error', 'Validation Failed', err.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCopy = () => {
    if (!currentKey) return;
    navigator.clipboard.writeText(currentKey);
    addToast('info', 'Key Copied', 'Base64 key copied to clipboard.');
  };

  const handleClear = () => {
    setCurrentKey('');
    onSetSessionKey('');
    setValidationResult(null);
    addToast('info', 'Key Cleared', 'Key removed from temporary session memory.');
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="bg-[#0b121e] border border-amber-800/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-950 border border-amber-600/50 flex items-center justify-center text-amber-400 font-mono font-bold">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
              CRYPTOGRAPHIC ENGINE: MODULE 3
            </span>
            <h3 className="text-lg font-bold text-white font-mono">
              Key Management & AES-256 Validation
            </h3>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
          <span>Key Length:</span>
          <strong className="text-amber-400">256 Bits (32 Bytes)</strong>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        {/* Interactive Key Operations */}
        <div className="bg-[#0d1422] border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Key Generator & Inspector</span>
            </h4>
            <div className="flex items-center gap-2">
              {currentKey && (
                <button
                  onClick={handleClear}
                  className="text-xs font-mono text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Key Value Field */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              Base64 Key Material (256-bit symmetric secret):
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={currentKey}
                onChange={(e) => {
                  setCurrentKey(e.target.value);
                  setValidationResult(null);
                }}
                placeholder="Generate a key or paste Base64 string..."
                className="w-full bg-[#070b13] border border-slate-800 focus:border-amber-500 rounded-lg pl-3 pr-24 py-2.5 text-xs font-mono text-amber-300 placeholder-slate-600 outline-none"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!currentKey}
                  className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                  title="Copy key"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="py-2.5 px-4 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-mono font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-900/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Generate New 256-bit Key</span>
            </button>

            <button
              onClick={() => handleValidate()}
              disabled={isValidating || !currentKey.trim()}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-mono font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-700"
            >
              <FileCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Validate Key Format</span>
            </button>
          </div>

          {/* Validation Feedback Card */}
          {validationResult && (
            <div className={`p-4 rounded-xl border ${
              validationResult.valid
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            }`}>
              <div className="flex items-start gap-3">
                {validationResult.valid ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="font-bold">
                      {validationResult.valid ? 'VALID AES-256 KEY' : 'INVALID KEY FORMAT'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                      {validationResult.key_size} bits
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {validationResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Key Properties Table */}
          <div className="pt-2 border-t border-slate-800">
            <h5 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2 font-semibold">
              Algorithm Specifications
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ALGORITHM</span>
                <span className="text-white font-bold">AES-256-GCM</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block">KEY SIZE</span>
                <span className="text-amber-400 font-bold">256 Bits</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block">NONCE SIZE</span>
                <span className="text-cyan-400 font-bold">96 Bits (12 B)</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block">AUTH TAG</span>
                <span className="text-emerald-400 font-bold">128 Bits (16 B)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyManagement;
