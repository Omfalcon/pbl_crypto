import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const api = {
  // Key Management
  generateKey: async () => {
    const res = await client.post('/keys/generate');
    return res.data;
  },

  validateKey: async (key) => {
    const res = await client.post('/keys/validate', { key });
    return res.data;
  },

  // Encryption & Decryption
  encryptMessage: async ({ plaintext, key, sender = 'Alice', receiver = 'Bob' }) => {
    const res = await client.post('/encrypt', { plaintext, key, sender, receiver });
    return res.data;
  },

  decryptMessage: async ({ message_id, ciphertext, nonce, auth_tag, key }) => {
    const res = await client.post('/decrypt', { message_id, ciphertext, nonce, auth_tag, key });
    return res.data;
  },

  // Message Transfer & Inbox
  sendMessage: async ({ message_id, ciphertext, nonce, auth_tag, sender = 'Alice', receiver = 'Bob', algorithm = 'AES-256-GCM' }) => {
    const res = await client.post('/messages/send', { message_id, ciphertext, nonce, auth_tag, sender, receiver, algorithm });
    return res.data;
  },

  getInbox: async (receiver = 'Bob') => {
    const res = await client.get(`/messages/inbox?receiver=${encodeURIComponent(receiver)}`);
    return res.data;
  },

  // Tampering & Attacker Simulation
  tamperPayload: async ({ message_id, ciphertext, nonce, auth_tag, attack_type }) => {
    const res = await client.post('/tamper', { message_id, ciphertext, nonce, auth_tag, attack_type });
    return res.data;
  },

  verifyPayload: async ({ message_id, ciphertext, nonce, auth_tag, key }) => {
    const res = await client.post('/verify', { message_id, ciphertext, nonce, auth_tag, key });
    return res.data;
  },

  // Communication History & Audit
  getHistory: async (filter = 'all', skip = 0, limit = 50) => {
    const params = { skip, limit };
    if (filter && filter !== 'all') {
      params.filter = filter;
    }
    const res = await client.get('/history', { params });
    return res.data;
  },

  getMessageEvents: async (messageId) => {
    const res = await client.get(`/history/${encodeURIComponent(messageId)}/events`);
    return res.data;
  },

  getMessageDetails: async (messageId) => {
    const res = await client.get(`/history/${encodeURIComponent(messageId)}`);
    return res.data;
  },

  // Health
  checkHealth: async () => {
    const res = await client.get('/health');
    return res.data;
  },
};

export default api;
