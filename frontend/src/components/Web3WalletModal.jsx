import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NETWORKS = [
  { id: '1', name: 'Ethereum Mainnet', icon: 'fa-brands fa-ethereum', symbol: 'ETH', color: '#627eea' },
  { id: '11155111', name: 'Sepolia Testnet', icon: 'fa-solid fa-flask', symbol: 'SepoliaETH', color: '#f59e0b' },
  { id: '137', name: 'Polygon', icon: 'fa-solid fa-draw-polygon', symbol: 'MATIC', color: '#8247e5' },
  { id: '42161', name: 'Arbitrum One', icon: 'fa-solid fa-layer-group', symbol: 'ETH', color: '#28a0f0' },
  { id: 'sol', name: 'Solana Network', icon: 'fa-solid fa-bolt', symbol: 'SOL', color: '#14f195' },
];

const WALLET_PROVIDERS = [
  { id: 'metamask', name: 'MetaMask', icon: 'fa-brands fa-ethereum', popular: true, color: '#f6851b' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: 'fa-solid fa-wallet', popular: true, color: '#0052ff' },
  { id: 'phantom', name: 'Phantom', icon: 'fa-solid fa-ghost', popular: true, color: '#ab9ff2' },
  { id: 'walletconnect', name: 'WalletConnect v2', icon: 'fa-solid fa-link', popular: false, color: '#3b99fc' },
  { id: 'simulator', name: 'Instant Smart Web3 (Mock)', icon: 'fa-solid fa-microchip', popular: true, color: '#10b981' },
];

export default function Web3WalletModal({ isOpen, onClose, web3State, setWeb3State, onShowToast }) {
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [connecting, setConnecting] = useState(null);

  if (!isOpen) return null;

  const handleConnect = async (provider) => {
    setConnecting(provider.id);

    try {
      if (provider.id === 'metamask' && typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          const addr = accounts[0];
          setWeb3State({
            connected: true,
            provider: 'MetaMask',
            address: addr,
            shortAddress: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
            network: selectedNetwork,
            balance: '1.428 ETH'
          });
          onShowToast?.({ message: 'MetaMask connected successfully!', type: 'success' });
          onClose();
          return;
        }
      }

      // Simulated or fallback provider
      await new Promise(r => setTimeout(r, 600));
      const randHex = Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const fakeAddress = '0x' + randHex;
      setWeb3State({
        connected: true,
        provider: provider.name,
        address: fakeAddress,
        shortAddress: `${fakeAddress.slice(0, 6)}...${fakeAddress.slice(-4)}`,
        network: selectedNetwork,
        balance: selectedNetwork.id === 'sol' ? '14.85 SOL' : '2.15 ETH'
      });
      onShowToast?.({ message: `${provider.name} connected on ${selectedNetwork.name}!`, type: 'success' });
      onClose();
    } catch (err) {
      onShowToast?.({ message: err.message || 'Failed to connect wallet', type: 'error' });
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = () => {
    setWeb3State({ connected: false, provider: null, address: null, network: null, balance: null });
    onShowToast?.({ message: 'Web3 Wallet disconnected', type: 'info' });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="modal-box web3-modal"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      >
        <div className="modal-header">
          <div className="modal-title">
            <i className="fa-solid fa-wallet" style={{ color: 'var(--blue)' }} />
            <span>{web3State.connected ? 'Connected Web3 Wallet' : 'Connect Web3 Wallet'}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {web3State.connected ? (
          <div className="web3-connected-view">
            <div className="web3-badge-card">
              <div className="web3-avatar">
                <i className="fa-brands fa-ethereum" />
              </div>
              <div className="web3-info">
                <div className="web3-provider-tag">
                  <span className="live-dot" /> {web3State.provider}
                </div>
                <div className="web3-address-row">
                  <code>{web3State.address}</code>
                  <button
                    className="btn-mini-copy"
                    onClick={() => {
                      navigator.clipboard.writeText(web3State.address);
                      onShowToast?.({ message: 'Address copied!', type: 'success' });
                    }}
                    title="Copy full address"
                  >
                    <i className="fa-regular fa-copy" />
                  </button>
                </div>
                <div className="web3-stats-row">
                  <span>Network: <strong>{web3State.network?.name || 'Ethereum'}</strong></span>
                  <span>Balance: <strong>{web3State.balance}</strong></span>
                </div>
              </div>
            </div>

            <div className="web3-actions-row">
              <button
                className="btn-outline-danger"
                onClick={handleDisconnect}
              >
                <i className="fa-solid fa-arrow-right-from-bracket" /> Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="web3-connect-view">
            <div className="network-selector-section">
              <label>Select Network</label>
              <div className="network-chips">
                {NETWORKS.map(net => (
                  <button
                    key={net.id}
                    type="button"
                    className={`net-chip ${selectedNetwork.id === net.id ? 'active' : ''}`}
                    onClick={() => setSelectedNetwork(net)}
                  >
                    <i className={net.icon} style={{ color: net.color }} />
                    <span>{net.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="provider-list-section">
              <label>Choose Provider</label>
              <div className="provider-grid">
                {WALLET_PROVIDERS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className="provider-item-btn"
                    onClick={() => handleConnect(p)}
                    disabled={connecting !== null}
                  >
                    <div className="provider-icon-wrapper" style={{ background: `${p.color}15`, color: p.color }}>
                      <i className={p.icon} />
                    </div>
                    <div className="provider-text">
                      <span className="p-name">{p.name}</span>
                      {p.popular && <span className="popular-badge">Popular</span>}
                    </div>
                    {connecting === p.id ? (
                      <i className="fa-solid fa-spinner fa-spin" />
                    ) : (
                      <i className="fa-solid fa-chevron-right arrow-indicator" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <p className="web3-modal-foot">
              <i className="fa-solid fa-shield-halved" /> Non-custodial Web3 integration. Your private keys never leave your device.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
