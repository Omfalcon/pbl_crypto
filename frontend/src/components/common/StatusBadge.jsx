import React from 'react';

export const StatusBadge = ({ status, size = 'sm' }) => {
  const norm = (status || '').toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (norm === 'SUCCESS' || norm === 'VERIFIED' || norm === 'ONLINE') {
    styles = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20';
  } else if (norm === 'FAILED' || norm === 'FAILURE' || norm === 'OFFLINE' || norm === 'ALERT') {
    styles = 'bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20';
  } else if (norm === 'PENDING' || norm === 'WARNING') {
    styles = 'bg-amber-950/70 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20';
  } else if (norm.includes('TAMPER')) {
    styles = 'bg-purple-950/70 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20';
  }

  const sizeClasses = size === 'xs'
    ? 'text-[10px] px-1.5 py-0.5'
    : size === 'md'
    ? 'text-xs px-3 py-1 font-semibold'
    : 'text-xs px-2.5 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-mono uppercase tracking-wider ${styles} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${norm === 'SUCCESS' || norm === 'VERIFIED' ? 'bg-emerald-400 animate-pulse' : norm === 'FAILED' || norm === 'FAILURE' ? 'bg-rose-400' : 'bg-amber-400'}`} />
      {status}
    </span>
  );
};

export default StatusBadge;
