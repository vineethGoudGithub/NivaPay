import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api';

export default function IdorSandbox({ currentUserId, onSwitchUserId, onShowToast, onRefreshData }) {
  const [targetId, setTargetId] = useState('');
  const [inspectedWallet, setInspectedWallet] = useState(null);
  const [loadingInspect, setLoadingInspect] = useState(false);

  const handleInspect = async (idToInspect) => {
    const id = idToInspect || targetId;
    if (!id) {
      onShowToast?.({ message: 'Enter a User ID to inspect', type: 'error' });
      return;
    }

    setLoadingInspect(true);
    try {
      const data = await api.getWallet(id);
      if (data && data.wallet) {
        setInspectedWallet(data.wallet);
        onShowToast?.({ message: `Loaded Wallet for User #${id} successfully!`, type: 'success' });
      } else {
        setInspectedWallet(null);
        onShowToast?.({ message: `No wallet found for User #${id}`, type: 'error' });
      }
    } catch (err) {
      setInspectedWallet(null);
      onShowToast?.({ message: err.message || 'Inspection failed', type: 'error' });
    } finally {
      setLoadingInspect(false);
    }
  };

  const handleSwitch = (newId) => {
    if (!newId) return;
    onSwitchUserId(newId);
    onShowToast?.({ message: `Switched active User ID to #${newId}`, type: 'info' });
  };

  return (
    <div className="idor-sandbox-container">
      <div className="panel-title">
        <i className="fa-solid fa-bug" />
        <span>IDOR & Multi-Account Developer Sandbox</span>
      </div>

      <div className="sandbox-banner">
        <div className="sandbox-badge">
          <i className="fa-solid fa-unlock-keyhole" /> Direct Client State
        </div>
        <p>
          This application connects directly to your live Render backend at <code>https://jwtapplication.onrender.com</code>.
          The backend reads <code>userId</code> directly from client query parameters (<code>/api/wallet?userId=X</code>).
          Use this panel to switch identities, inspect arbitrary accounts, and simulate multi-tenant actions.
        </p>
      </div>

      <div className="sandbox-grid">
        {/* Identity Switcher */}
        <div className="glass-card sandbox-card">
          <h4>Active Client Identity</h4>
          <div className="active-id-display">
            <span>Current localStorage userId:</span>
            <span className="ip-badge big-badge">#{currentUserId || '1'}</span>
          </div>

          <label style={{ marginTop: '14px' }}>Quick Switch To Demo Accounts:</label>
          <div className="quick-switch-pills">
            {[1, 2, 3, 4, 5].map(id => (
              <button
                key={id}
                type="button"
                className={`pill-id ${String(currentUserId) === String(id) ? 'current' : ''}`}
                onClick={() => handleSwitch(id)}
              >
                User #{id}
              </button>
            ))}
          </div>

          <div className="custom-id-row" style={{ marginTop: '16px' }}>
            <input
              type="number"
              min="1"
              placeholder="Custom User ID..."
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
            />
            <button
              type="button"
              className="btn-copy"
              onClick={() => handleSwitch(targetId)}
              disabled={!targetId}
            >
              Switch ID
            </button>
          </div>
        </div>

        {/* Live Inspect Arbitrary User Wallet */}
        <div className="glass-card sandbox-card">
          <h4>Inspect Any Account Balance</h4>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            Trigger direct <code>GET /api/wallet?userId={'{id}'}</code> against Render backend:
          </p>

          <div className="inspect-input-row" style={{ marginTop: '12px' }}>
            <input
              type="number"
              min="1"
              placeholder="Enter User ID to inspect (e.g. 1)"
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
            />
            <button
              type="button"
              className="btn-submit"
              style={{ width: 'auto', padding: '0 18px' }}
              onClick={() => handleInspect()}
              disabled={loadingInspect || !targetId}
            >
              {loadingInspect ? <i className="fa-solid fa-spinner fa-spin" /> : 'Inspect'}
            </button>
          </div>

          {inspectedWallet && (
            <motion.div
              className="inspected-result-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inspected-header">
                <strong>User #{inspectedWallet.id} Wallet Data</strong>
                <span className="live-dot" /> Live from Render
              </div>
              <div className="inspected-details">
                <div>Balance: <strong>₹ {parseFloat(inspectedWallet.balance).toFixed(2)}</strong></div>
                <div>Wallet ID: <code>{inspectedWallet.id}</code></div>
                <div>Version: <code>{inspectedWallet.version}</code></div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
