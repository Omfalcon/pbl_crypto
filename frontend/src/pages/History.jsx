import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  FileText,
  Lock,
  ArrowRight,
  Eye,
  X,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

export const History = ({ addToast }) => {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageEvents, setMessageEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Pop-up modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState(null);
  const [modalEvents, setModalEvents] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await api.getHistory(filter, 0, 100);
      setMessages(data);
      if (data.length > 0 && !selectedMessage) {
        loadMessageDetails(data[0].message_id);
      }
    } catch (err) {
      if (addToast) addToast('error', 'Failed to load history', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessageDetails = async (messageId) => {
    try {
      setLoadingEvents(true);
      const res = await api.getMessageDetails(messageId);
      setSelectedMessage(res.message);
      setMessageEvents(res.events || []);
    } catch (err) {
      if (addToast) addToast('error', 'Failed to load event details', err.message);
    } finally {
      setLoadingEvents(false);
    }
  };

  const openModal = async (messageId) => {
    try {
      setModalLoading(true);
      setIsModalOpen(true);
      const res = await api.getMessageDetails(messageId);
      setModalMessage(res.message);
      setModalEvents(res.events || []);
    } catch (err) {
      if (addToast) addToast('error', 'Failed to inspect message', err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMessage(null);
    setModalEvents([]);
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(fieldName);
    if (addToast) addToast('info', 'Copied', `${fieldName} copied to clipboard.`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filterOptions = [
    { id: 'all', label: 'All Messages' },
    { id: 'encrypted', label: 'Successfully Encrypted' },
    { id: 'decrypted', label: 'Successfully Decrypted' },
    { id: 'failed_decryption', label: 'Failed Decryption' },
    { id: 'tampered', label: 'Tampered Attacks' },
  ];

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="bg-[#0b121e] border border-purple-800/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-950 border border-purple-600/50 flex items-center justify-center text-purple-400 font-mono font-bold">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
              AUDIT & TELEMETRY: MODULE 6
            </span>
            <h3 className="text-lg font-bold text-white font-mono">
              Communication History & Activity Logs
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={loadHistory}
          className="text-xs font-mono text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Database Records</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-[#0d1422] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 px-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setFilter(opt.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              filter === opt.id
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Grid: History Table & Message Events Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: History Table */}
        <div className="lg:col-span-7 bg-[#0d1422] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              9.1 SQLite Message Records ({messages.length})
            </h4>
            <span className="text-[11px] font-mono text-slate-500">
              Table: `messages`
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs font-mono text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
              Reading SQLite messages table...
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-slate-500 space-y-1">
              <p>No communication records match this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                    <th className="py-2 px-3">Message ID</th>
                    <th className="py-2 px-3">Route</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {messages.map((m) => {
                    const isSelected = selectedMessage?.message_id === m.message_id;
                    return (
                      <tr
                        key={m.message_id}
                        onClick={() => loadMessageDetails(m.message_id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-slate-900/90 text-cyan-300'
                            : 'hover:bg-slate-900/50 text-slate-300'
                        }`}
                      >
                        <td className="py-3 px-3 font-bold">{m.message_id}</td>
                        <td className="py-3 px-3 text-slate-400">
                          {m.sender} ➔ {m.receiver}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={m.decryption_status === 'SUCCESS' ? 'VERIFIED' : m.decryption_status} size="xs" />
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {new Date(m.created_at).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openModal(m.message_id);
                            }}
                            className="px-2.5 py-1 rounded-md bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-[11px] font-mono inline-flex items-center gap-1.5 transition-all shadow-sm hover:border-cyan-400"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Selected Message Details & Security Activity Log */}
        <div className="lg:col-span-5 bg-[#0d1422] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>9.4 Security Activity Audit Trail</span>
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
              `activity_logs`
            </span>
          </div>

          {selectedMessage ? (
            <div className="space-y-4">
              {/* Message Metadata Card */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">{selectedMessage.message_id}</span>
                  <StatusBadge status={selectedMessage.decryption_status === 'SUCCESS' ? 'VERIFIED' : selectedMessage.decryption_status} size="xs" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <div>Algorithm: <span className="text-cyan-400">{selectedMessage.algorithm}</span></div>
                  <div>Sender: <span className="text-slate-300">{selectedMessage.sender}</span></div>
                  <div>Nonce: <span className="text-slate-300">{selectedMessage.nonce.substring(0, 8)}...</span></div>
                  <div>Tag: <span className="text-emerald-400">{selectedMessage.auth_tag.substring(0, 8)}...</span></div>
                </div>
              </div>

              {/* Event Timeline */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                  Chronological Audit Events:
                </span>

                {loadingEvents ? (
                  <div className="py-6 text-center text-xs font-mono text-slate-500">
                    Loading events...
                  </div>
                ) : messageEvents.length === 0 ? (
                  <p className="text-xs font-mono text-slate-500">No events recorded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {messageEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-400 font-bold text-[11px]">
                            {evt.event_type}
                          </span>
                          <span className={`text-[10px] font-bold ${
                            evt.event_status === 'SUCCESS' ? 'text-emerald-400' : evt.event_status === 'ALERT' ? 'text-purple-400' : 'text-rose-400'
                          }`}>
                            {evt.event_status}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {evt.description}
                        </p>
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(evt.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs font-mono text-slate-500">
              Select a message record or click "Inspect" to view details.
            </div>
          )}

          {/* Guarantee Footer */}
          <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>SQLite Schema Verified: Contains no `plaintext` or `key` columns.</span>
          </div>
        </div>
      </div>

      {/* Detail Pop-up Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={closeModal}
        >
          <div
            className="bg-[#0b121e] border border-cyan-500/50 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl cyber-glow-cyan overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  Message Inspector: {modalMessage?.message_id || 'Loading...'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {modalLoading ? (
                <div className="py-12 text-center text-xs font-mono text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                  Loading message metadata & audit logs...
                </div>
              ) : modalMessage ? (
                <>
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl border ${
                    modalMessage.decryption_status === 'SUCCESS'
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 cyber-glow-green'
                      : modalMessage.decryption_status === 'FAILED'
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 cyber-glow-red'
                      : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {modalMessage.decryption_status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                      ) : modalMessage.decryption_status === 'FAILED' ? (
                        <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-mono font-bold text-sm uppercase tracking-wide">
                            {modalMessage.decryption_status === 'SUCCESS'
                              ? 'MESSAGE VERIFIED — AUTHENTICATION CONFIRMED'
                              : modalMessage.decryption_status === 'FAILED'
                              ? 'AUTHENTICATION FAILED — TAMPERING OR WRONG KEY'
                              : 'PENDING DECRYPTION IN BOB\'S INBOX'}
                          </h4>
                          <StatusBadge status={modalMessage.decryption_status === 'SUCCESS' ? 'VERIFIED' : modalMessage.decryption_status} size="xs" />
                        </div>
                        <p className="text-xs text-slate-300 font-mono">
                          {modalMessage.decryption_status === 'SUCCESS'
                            ? `Authenticity verified by AES-256-GCM. Decrypted at: ${new Date(modalMessage.decrypted_at).toLocaleString()}`
                            : modalMessage.decryption_status === 'FAILED'
                            ? 'The authentication tag failed cryptographic verification. Plaintext was blocked.'
                            : `Message transferred to Bob at ${new Date(modalMessage.created_at).toLocaleString()}. Awaiting decryption key.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Route</span>
                      <span className="text-white font-bold">{modalMessage.sender} ➔ {modalMessage.receiver}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Algorithm</span>
                      <span className="text-cyan-400 font-bold">{modalMessage.algorithm}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Created Timestamp</span>
                      <span className="text-slate-300">{new Date(modalMessage.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Decrypted Timestamp</span>
                      <span className="text-slate-300">
                        {modalMessage.decrypted_at ? new Date(modalMessage.decrypted_at).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Payload Details */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[10px] uppercase">96-bit Nonce (Base64)</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(modalMessage.nonce, 'Nonce')}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedKey === 'Nonce' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <p className="text-cyan-300 break-all">{modalMessage.nonce}</p>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[10px] uppercase">128-bit Authentication Tag (Base64)</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(modalMessage.auth_tag, 'Auth Tag')}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedKey === 'Auth Tag' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <p className="text-emerald-400 break-all">{modalMessage.auth_tag}</p>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[10px] uppercase">Ciphertext (Encrypted Payload)</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(modalMessage.ciphertext, 'Ciphertext')}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedKey === 'Ciphertext' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <p className="text-slate-300 break-all max-h-28 overflow-y-auto bg-slate-900/60 p-2 rounded">
                        {modalMessage.ciphertext}
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Zero Plaintext / Keys Persisted in Database</span>
              </span>
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-semibold rounded-lg transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
