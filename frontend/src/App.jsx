import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Toast from './components/common/Toast';
import Overview from './pages/Overview';
import Sender from './pages/Sender';
import Receiver from './pages/Receiver';
import KeyManagement from './pages/KeyManagement';
import AttackerSimulation from './pages/AttackerSimulation';
import History from './pages/History';
import api from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  // Ephemeral in-memory key state (strictly NEVER saved to localStorage or database)
  const [sessionKey, setSessionKey] = useState('');
  const [toasts, setToasts] = useState([]);
  const [backendOnline, setBackendOnline] = useState(false);
  const [inboxCount, setInboxCount] = useState(0);

  // Toast notification helper
  const addToast = (type, title, message) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Poll backend health
  const checkHealth = async () => {
    try {
      await api.checkHealth();
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  };

  // Update inbox count
  const updateInboxCount = async () => {
    try {
      const inbox = await api.getInbox('Bob');
      const pending = inbox.filter((m) => m.decryption_status === 'PENDING').length;
      setInboxCount(pending);
    } catch {
      // Ignore background fetch error
    }
  };

  useEffect(() => {
    checkHealth();
    updateInboxCount();
    const interval = setInterval(() => {
      checkHealth();
      updateInboxCount();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResetSession = () => {
    if (window.confirm('Reset current application session? This will clear all in-memory keys and session inputs.')) {
      setSessionKey('');
      addToast('info', 'Session Reset', 'All temporary secret keys cleared from memory.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans cyber-grid-bg">
      {/* Top Header */}
      <Header
        backendOnline={backendOnline}
        onResetSession={handleResetSession}
        activeTab={activeTab}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          inboxCount={inboxCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <Overview
                onNavigate={setActiveTab}
                sessionKey={sessionKey}
              />
            )}

            {activeTab === 'sender' && (
              <Sender
                sessionKey={sessionKey}
                onSetSessionKey={setSessionKey}
                onMessageSent={() => {
                  updateInboxCount();
                  addToast('info', 'Switch to Bob', 'Navigate to Bob (Receiver) to test authenticated decryption.');
                }}
                addToast={addToast}
              />
            )}

            {activeTab === 'receiver' && (
              <Receiver
                sessionKey={sessionKey}
                onSetSessionKey={setSessionKey}
                addToast={addToast}
              />
            )}

            {activeTab === 'keys' && (
              <KeyManagement
                sessionKey={sessionKey}
                onSetSessionKey={setSessionKey}
                addToast={addToast}
              />
            )}

            {activeTab === 'attacker' && (
              <AttackerSimulation
                sessionKey={sessionKey}
                onSetSessionKey={setSessionKey}
                addToast={addToast}
              />
            )}

            {activeTab === 'history' && (
              <History
                addToast={addToast}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating Cyber Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
