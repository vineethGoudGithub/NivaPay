import { useState } from 'react';
import { motion } from 'framer-motion';

const POOLS = [
  { id: 'eth_pool', name: 'Ethereum 2.0 Liquid Staking', asset: 'ETH', apr: 4.8, lockup: 'Flexible', tvl: '$1.42B', icon: 'fa-brands fa-ethereum', color: '#627eea' },
  { id: 'sol_pool', name: 'Solana Validator High-Yield', asset: 'SOL', apr: 7.4, lockup: '7 Days', tvl: '$480M', icon: 'fa-solid fa-bolt', color: '#14f195' },
  { id: 'usdt_vault', name: 'USDT Stablecoin Vault', asset: 'USDT', apr: 10.2, lockup: 'Flexible', tvl: '$890M', icon: 'fa-solid fa-dollar-sign', color: '#26a17b' },
];

export default function StakingVaults({ cryptoBalances, stakes, onStake, onUnstake, onShowToast }) {
  const [selectedPool, setSelectedPool] = useState(POOLS[0]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [staking, setStaking] = useState(false);

  // APY projection
  const amountNum = parseFloat(stakeAmount) || 0;
  const yearlyEst = (amountNum * selectedPool.apr) / 100;
  const monthlyEst = yearlyEst / 12;
  const dailyEst = yearlyEst / 365;

  const currentAssetBal = cryptoBalances?.[selectedPool.asset] || 0;

  const handleStakeSubmit = async (e) => {
    e.preventDefault();
    if (amountNum <= 0) {
      onShowToast?.({ message: 'Enter a valid staking amount', type: 'error' });
      return;
    }
    if (amountNum > currentAssetBal) {
      onShowToast?.({ message: `Insufficient ${selectedPool.asset} balance to stake!`, type: 'error' });
      return;
    }

    setStaking(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      onStake?.({
        pool: selectedPool.name,
        asset: selectedPool.asset,
        amount: amountNum,
        apr: selectedPool.apr
      });
      onShowToast?.({
        message: `Successfully staked ${amountNum} ${selectedPool.asset} at ${selectedPool.apr}% APR!`,
        type: 'success'
      });
      setStakeAmount('');
    } catch (err) {
      onShowToast?.({ message: err.message || 'Staking failed', type: 'error' });
    } finally {
      setStaking(false);
    }
  };

  return (
    <div className="staking-vaults-container">
      <div className="panel-title">
        <i className="fa-solid fa-seedling" />
        <span>DeFi Yield & Staking Vaults</span>
      </div>

      {/* Pool Cards Grid */}
      <div className="pools-grid">
        {POOLS.map(pool => (
          <div
            key={pool.id}
            className={`pool-card ${selectedPool.id === pool.id ? 'selected' : ''}`}
            onClick={() => setSelectedPool(pool)}
          >
            <div className="pool-card-header">
              <div className="pool-icon" style={{ background: `${pool.color}15`, color: pool.color }}>
                <i className={pool.icon} />
              </div>
              <span className="apr-badge">+{pool.apr}% APY</span>
            </div>
            <h4>{pool.name}</h4>
            <div className="pool-stats">
              <div>
                <span className="stat-sub">Lockup</span>
                <strong>{pool.lockup}</strong>
              </div>
              <div>
                <span className="stat-sub">TVL</span>
                <strong>{pool.tvl}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stake & Calculator Section */}
      <div className="glass-card stake-action-card">
        <form onSubmit={handleStakeSubmit} className="stake-form">
          <div className="stake-input-header">
            <label>Stake {selectedPool.asset}</label>
            <span className="swap-balance-label">
              Available: <strong>{currentAssetBal} {selectedPool.asset}</strong>
              <button
                type="button"
                className="btn-max-pill"
                onClick={() => setStakeAmount(currentAssetBal.toString())}
              >
                MAX
              </button>
            </span>
          </div>

          <div className="input-wrapper">
            <input
              type="number"
              step="any"
              min="0"
              placeholder={`Amount in ${selectedPool.asset}`}
              value={stakeAmount}
              onChange={e => setStakeAmount(e.target.value)}
              required
            />
            <span className="input-unit-label">{selectedPool.asset}</span>
          </div>

          {/* Calculator Projections */}
          <div className="projections-bar">
            <div className="proj-item">
              <span>Daily Rewards</span>
              <strong>+{dailyEst.toFixed(5)} {selectedPool.asset}</strong>
            </div>
            <div className="proj-item">
              <span>Monthly Rewards</span>
              <strong>+{monthlyEst.toFixed(4)} {selectedPool.asset}</strong>
            </div>
            <div className="proj-item highlight">
              <span>1-Year Est. Yield</span>
              <strong>+{yearlyEst.toFixed(4)} {selectedPool.asset}</strong>
            </div>
          </div>

          <motion.button
            type="submit"
            className="btn-submit"
            disabled={staking || !stakeAmount}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {staking ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Staking Tokens...
              </>
            ) : (
              <>
                Stake {selectedPool.asset} Now <i className="fa-solid fa-seedling" />
              </>
            )}
          </motion.button>
        </form>
      </div>

      {/* Active Stakes List */}
      <div className="active-stakes-section">
        <h4>Active Staking Positions ({stakes?.length || 0})</h4>
        {(!stakes || stakes.length === 0) ? (
          <p className="text-muted" style={{ padding: '12px 0' }}>No active staking positions. Choose a pool above to earn passive yields.</p>
        ) : (
          <div className="stakes-list">
            {stakes.map(st => (
              <div key={st.id} className="stake-row-card">
                <div className="stake-row-info">
                  <strong>{st.pool}</strong>
                  <span>{st.amount} {st.asset} • Staked on {new Date(st.startDate).toLocaleDateString()}</span>
                </div>
                <div className="stake-row-rewards">
                  <span className="reward-tag">+{st.apr}% APR</span>
                  <button
                    className="btn-mini-unstake"
                    onClick={() => onUnstake?.(st.id)}
                    title="Unstake & Claim"
                  >
                    Unstake
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
