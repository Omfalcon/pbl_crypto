import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Send,
  Inbox,
  KeyRound,
  ShieldAlert,
  History,
  Lock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Database,
  Cpu
} from 'lucide-react';
import api from '../services/api';

export const Overview = ({ onNavigate, sessionKey }) => {
  const [stats, setStats] = useState({
    totalMessages: 0,
    decryptedMessages: 0,
    failedAttempts: 0,
    tamperedAttempts: 0,
    inboxPending: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      const [messages, inbox] = await Promise.all([
        api.getHistory('all', 0, 100),
        api.getInbox('Bob')
      ]);

      const decrypted = messages.filter(m => m.decryption_status === 'SUCCESS').length;
      const failed = messages.filter(m => m.decryption_status === 'FAILED').length;
      const pending = inbox.filter(m => m.decryption_status === 'PENDING').length;

      setStats({
        totalMessages: messages.length,
        decryptedMessages: decrypted,
        failedAttempts: failed,
        tamperedAttempts: failed, // Tampered payloads trigger decryption failure
        inboxPending: pending
      });
    } catch (err) {
      console.error('Failed to load overview data', err);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    {
      id: 'sender',
      title: 'Alice — Message Sender',
      desc: 'Compose plaintext, choose 256-bit key, perform AES-256-GCM encryption with fresh nonce, and send encrypted payload.',
      icon: Send,
      color: 'text-cyan-400',
      border: 'hover:border-cyan-500/50',
      badge: 'Confidentiality'
    },
    {
      id: 'receiver',
      title: 'Bob — Message Receiver',
      desc: 'Inspect incoming encrypted payload (ciphertext, nonce, tag), provide secret key, and perform authenticated decryption.',
      icon: Inbox,
      color: 'text-emerald-400',
      border: 'hover:border-emerald-500/50',
      badge: `${stats.inboxPending} Pending`,
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'keys',
      title: 'Key Management',
      desc: 'Generate cryptographically secure 256-bit AES keys, validate formats, copy Base64 string, and manage session keys.',
      icon: KeyRound,
      color: 'text-amber-400',
      border: 'hover:border-amber-500/50',
      badge: sessionKey ? 'Key Active' : 'No Key Set',
      badgeColor: sessionKey ? 'bg-amber-950/80 text-amber-300 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
    },
    {
      id: 'attacker',
      title: 'Attacker & Tampering Lab',
      desc: 'Simulate ciphertext bit-flips, authentication tag tampering, nonce corruption, and test incorrect decryption keys.',
      icon: ShieldAlert,
      color: 'text-rose-400',
      border: 'hover:border-rose-500/50',
      badge: 'Integrity & Auth'
    },
    {
      id: 'history',
      title: 'Communication History',
      desc: 'Review SQLite audit records, filter by status, and verify that zero plaintext or secret keys are persisted.',
      icon: History,
      color: 'text-purple-400',
      border: 'hover:border-purple-500/50',
      badge: `${stats.totalMessages} Records`,
      badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-500/30'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0d1627] to-slate-900 border border-slate-800 rounded-2xl p-6 cyber-glow-cyan">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/40 text-cyan-400 text-xs font-mono">
              <Cpu className="w-3.5 h-3.5" />
              <span>ACADEMIC PBL CRYPTOGRAPHY LAB</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-mono">
              AES-256-GCM Secure Channel Simulator
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Demonstrates end-to-end authenticated encryption between Alice and Bob using Galois/Counter Mode (GCM).
              Validates that unauthorized modifications to ciphertext, nonces, or authentication tags are cryptographically detected before any plaintext is released.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[10px] font-mono text-slate-400 uppercase">Total Messages</p>
              <p className="text-xl font-bold text-white font-mono mt-0.5">{stats.totalMessages}</p>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[10px] font-mono text-slate-400 uppercase">Bob Inbox Pending</p>
              <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{stats.inboxPending}</p>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[10px] font-mono text-slate-400 uppercase">Auth Verified</p>
              <p className="text-xl font-bold text-cyan-400 font-mono mt-0.5">{stats.decryptedMessages}</p>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[10px] font-mono text-slate-400 uppercase">Attacks Blocked</p>
              <p className="text-xl font-bold text-rose-400 font-mono mt-0.5">{stats.failedAttempts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Properties Explained */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0b121e] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2.5 text-cyan-400 mb-2 font-mono text-sm font-semibold">
            <Lock className="w-4 h-4" />
            <span>1. Confidentiality</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            AES-256 CTR keystream transforms plaintext into ciphertext. Eavesdroppers intercepting the payload in transit cannot read the original message without the 256-bit secret key.
          </p>
        </div>

        <div className="bg-[#0b121e] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2.5 text-emerald-400 mb-2 font-mono text-sm font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>2. Data Integrity</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The 128-bit authentication tag is computed via Galois Field GHASH over the ciphertext and nonce. Any byte altered in transit immediately invalidates the tag check.
          </p>
        </div>

        <div className="bg-[#0b121e] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2.5 text-amber-400 mb-2 font-mono text-sm font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>3. Authenticity</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Only parties possessing the legitimate 256-bit key can produce a valid authentication tag. Bob verifies the tag before unmasking any plaintext.
          </p>
        </div>
      </div>

      {/* Module Navigation Grid */}
      <div>
        <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 font-bold mb-3">
          Explore Operational Modules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                onClick={() => onNavigate(m.id)}
                className={`bg-[#0d1422] border border-slate-800/90 rounded-xl p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between ${m.border} hover:bg-slate-900/80`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg bg-slate-950 border border-slate-800 ${m.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {m.badge && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${m.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
                    {m.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {m.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-cyan-400">
                  <span>Launch Module</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Overview;
