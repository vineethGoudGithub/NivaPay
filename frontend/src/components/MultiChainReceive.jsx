import { useState } from 'react';
import { motion } from 'framer-motion';

export default function MultiChainReceive({ userEmail, onShowToast }) {
  const NETWORKS = [
    {
      id: 'upi',
      name: 'NivaPay ID / Email',
      icon: 'fa-solid fa-indian-rupee-sign',
      address: userEmail || 'user@nivapay.io',
      networkDesc: 'Zero-fee instant peer-to-peer transfers inside NivaPay',
      minDeposit: '₹1.00',
      speed: 'Instant (1 second)'
    },
    {
      id: 'eth',
      name: 'Ethereum (ERC-20)',
      icon: 'fa-brands fa-ethereum',
      address: '0x71C839F6370B342f2b4b73b22Ab2D95Eb1b384Af',
      networkDesc: 'Accepts ETH, USDT, USDC on Ethereum Mainnet & L2s',
      minDeposit: '0.005 ETH',
      speed: '~12 seconds (1 block)'
    },
    {
      id: 'btc',
      name: 'Bitcoin (Native SegWit)',
      icon: 'fa-brands fa-bitcoin',
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      networkDesc: 'Send only BTC to this native SegWit (bech32) address',
      minDeposit: '0.0005 BTC',
      speed: '~10 - 20 minutes'
    },
    {
      id: 'sol',
      name: 'Solana (SPL Tokens)',
      icon: 'fa-solid fa-bolt',
      address: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
      networkDesc: 'High-speed Solana network address for SOL & SPL tokens',
      minDeposit: '0.01 SOL',
      speed: '< 400 milliseconds'
    },
  ];

  const [activeNetwork, setActiveNetwork] = useState(NETWORKS[0]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeNetwork.address)}&color=0b57d0&bgcolor=ffffff`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeNetwork.address);
    onShowToast?.({ message: `${activeNetwork.name} address copied to clipboard!`, type: 'success' });
  };

  return (
    <div className="multichain-receive-container">
      <div className="panel-title">
        <i className="fa-solid fa-qrcode" />
        <span>Multi-Network Deposit & Receive Hub</span>
      </div>

      {/* Network Selector Tabs */}
      <div className="receive-network-tabs">
        {NETWORKS.map(net => (
          <button
            key={net.id}
            type="button"
            className={`receive-tab ${activeNetwork.id === net.id ? 'active' : ''}`}
            onClick={() => setActiveNetwork(net)}
          >
            <i className={net.icon} />
            <span>{net.name}</span>
          </button>
        ))}
      </div>

      <div className="receive-main-card">
        <div className="qr-code-box">
          <img src={qrUrl} alt={`${activeNetwork.name} QR Code`} />
          <span className="qr-caption">Scan with any wallet app</span>
        </div>

        <div className="receive-details-panel">
          <div className="receive-field-group">
            <label>Deposit Address / Identifier</label>
            <div className="address-copy-row">
              <code className="address-display">{activeNetwork.address}</code>
              <motion.button
                className="btn-copy"
                onClick={handleCopy}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fa-regular fa-copy" /> Copy
              </motion.button>
            </div>
          </div>

          <p className="network-desc-text">
            <i className="fa-solid fa-circle-info" /> {activeNetwork.networkDesc}
          </p>

          <div className="network-specs-grid">
            <div className="spec-item">
              <span className="spec-label">Expected Speed</span>
              <span className="spec-value">{activeNetwork.speed}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Minimum Deposit</span>
              <span className="spec-value">{activeNetwork.minDeposit}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
