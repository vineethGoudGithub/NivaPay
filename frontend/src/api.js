const API_BASE = import.meta.env.VITE_API_BASE || 'https://jwtapplication.onrender.com/api';

function getUserId() {
  return localStorage.getItem('userId');
}

function setUserId(id) {
  localStorage.setItem('userId', id);
}

function removeUserId() {
  localStorage.removeItem('userId');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error(`Cannot reach backend on ${API_BASE}`);
  }

  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(res.ok ? 'Invalid response from backend' : `Backend error (${res.status})`);
    }
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

// Local storage key helper
const userKey = (userId, prefix) => `${prefix}_${userId || getUserId() || 'guest'}`;

export const api = {
  baseUrl: API_BASE,

  signup: (name, email, password) =>
    request('POST', '/auth/signup', { name, email, password }),

  login: (email, password) =>
    request('POST', '/auth/login', { email, password }),

  getWallet: (userId) => {
    const id = userId !== undefined && userId !== null ? userId : getUserId();
    return request('GET', `/wallet?userId=${id}`);
  },

  sendMoney: (recipientEmail, amount, userId) => {
    const id = userId !== undefined && userId !== null ? userId : getUserId();
    return request('POST', `/wallet/send?userId=${id}`, { recipientEmail, amount });
  },

  getProfile: (userId) => {
    const id = userId !== undefined && userId !== null ? userId : getUserId();
    return request('GET', `/user/profile?userId=${id}`);
  },

  setUserId,
  getUserId,
  removeUserId,

  // --- Transactions Activity Storage ---
  getTransactions: (userId) => {
    try {
      const raw = localStorage.getItem(userKey(userId, 'tx_history'));
      if (raw) return JSON.parse(raw);
      // Defaults
      return [
        {
          id: 'tx_init_1',
          type: 'received',
          title: 'Welcome Grant',
          amount: 100.00,
          currency: 'INR',
          status: 'Confirmed',
          from: 'System Faucet',
          hash: '0x3f8a...9c2d',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        }
      ];
    } catch {
      return [];
    }
  },

  addTransaction: (userId, tx) => {
    try {
      const list = api.getTransactions(userId);
      const newTx = {
        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        status: 'Confirmed',
        hash: '0x' + Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join('') + '...' + Array.from({length: 4}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        ...tx
      };
      list.unshift(newTx);
      localStorage.setItem(userKey(userId, 'tx_history'), JSON.stringify(list.slice(0, 50)));
      return newTx;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  // --- Crypto Multi-Asset Balances ---
  getCryptoBalances: (userId) => {
    try {
      const raw = localStorage.getItem(userKey(userId, 'crypto_balances'));
      if (raw) return JSON.parse(raw);
      return {
        BTC: 0.0145,
        ETH: 0.385,
        SOL: 4.82,
        USDT: 250.00
      };
    } catch {
      return { BTC: 0, ETH: 0, SOL: 0, USDT: 0 };
    }
  },

  updateCryptoBalances: (userId, balances) => {
    try {
      localStorage.setItem(userKey(userId, 'crypto_balances'), JSON.stringify(balances));
    } catch (e) {
      console.error(e);
    }
  },

  // --- Saved Contacts / Address Book ---
  getContacts: (userId) => {
    try {
      const raw = localStorage.getItem(userKey(userId, 'contacts'));
      if (raw) return JSON.parse(raw);
      return [
        { name: 'Alex Rivera', email: 'alex@web3pay.eth', address: '0x71C...aB94', chain: 'Ethereum' },
        { name: 'Devin Vance', email: 'devin@solmail.com', address: '9xQe...4pLk', chain: 'Solana' },
        { name: 'Sarah Chen', email: 'sarah@fintech.io', address: '0x32A...89Fd', chain: 'Polygon' }
      ];
    } catch {
      return [];
    }
  },

  saveContact: (userId, contact) => {
    try {
      const contacts = api.getContacts(userId);
      contacts.push({ id: Date.now(), ...contact });
      localStorage.setItem(userKey(userId, 'contacts'), JSON.stringify(contacts));
      return contacts;
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  deleteContact: (userId, index) => {
    try {
      const contacts = api.getContacts(userId);
      contacts.splice(index, 1);
      localStorage.setItem(userKey(userId, 'contacts'), JSON.stringify(contacts));
      return contacts;
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  // --- Staking Vaults Storage ---
  getStakes: (userId) => {
    try {
      const raw = localStorage.getItem(userKey(userId, 'stakes'));
      if (raw) return JSON.parse(raw);
      return [
        {
          id: 'stake_1',
          pool: 'ETH 2.0 Liquid Staking',
          asset: 'ETH',
          amount: 0.15,
          apr: 4.8,
          rewardsEarned: 0.00184,
          startDate: new Date(Date.now() - 86400000 * 14).toISOString()
        }
      ];
    } catch {
      return [];
    }
  },

  saveStake: (userId, stake) => {
    try {
      const stakes = api.getStakes(userId);
      const newStake = {
        id: 'stake_' + Date.now(),
        startDate: new Date().toISOString(),
        rewardsEarned: 0,
        ...stake
      };
      stakes.unshift(newStake);
      localStorage.setItem(userKey(userId, 'stakes'), JSON.stringify(stakes));
      return stakes;
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  unstake: (userId, id) => {
    try {
      const stakes = api.getStakes(userId).filter(s => s.id !== id);
      localStorage.setItem(userKey(userId, 'stakes'), JSON.stringify(stakes));
      return stakes;
    } catch (e) {
      console.error(e);
      return [];
    }
  }
};
