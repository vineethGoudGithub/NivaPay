import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const ASSETS = [
  { symbol: 'INR', name: 'Indian Rupee (Fiat)', rateInr: 1, icon: 'fa-solid fa-indian-rupee-sign', color: '#16a34a' },
  { symbol: 'USDT', name: 'Tether USD', rateInr: 83.5, icon: 'fa-solid fa-dollar-sign', color: '#26a17b' },
  { symbol: 'ETH', name: 'Ethereum', rateInr: 290000, icon: 'fa-brands fa-ethereum', color: '#627eea' },
  { symbol: 'SOL', name: 'Solana', rateInr: 12380, icon: 'fa-solid fa-bolt', color: '#14f195' },
  { symbol: 'BTC', name: 'Bitcoin', rateInr: 5350000, icon: 'fa-brands fa-bitcoin', color: '#f7931a' },
];

export default function CryptoSwap({ walletBalance, cryptoBalances, onExecuteSwap, onShowToast }) {
  const [fromAsset, setFromAsset] = useState(ASSETS[0]); // INR
  const [toAsset, setToAsset] = useState(ASSETS[2]); // ETH
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5%');
  const [swapping, setSwapping] = useState(false);

  // Calculate conversion
  const exchangeRate = useMemo(() => {
    return fromAsset.rateInr / toAsset.rateInr;
  }, [fromAsset, toAsset]);

  const toAmount = useMemo(() => {
    if (!fromAmount || isNaN(fromAmount) || Number(fromAmount) <= 0) return '';
    const converted = Number(fromAmount) * exchangeRate;
    return converted < 0.0001 ? converted.toFixed(6) : converted.toFixed(4);
  }, [fromAmount, exchangeRate]);

  // Current balance of source asset
  const sourceBalance = useMemo(() => {
    if (fromAsset.symbol === 'INR') {
      return Number(walletBalance || 0);
    }
    return Number(cryptoBalances?.[fromAsset.symbol] || 0);
  }, [fromAsset, walletBalance, cryptoBalances]);

  const handleFlip = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
    setFromAmount('');
  };

  const handleMax = () => {
    if (sourceBalance > 0) {
      setFromAmount(sourceBalance.toString());
    }
  };

  const handleSwap = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(fromAmount);
    if (!amountVal || amountVal <= 0) {
      onShowToast?.({ message: 'Enter a valid amount to swap', type: 'error' });
      return;
    }
    if (amountVal > sourceBalance) {
      onShowToast?.({ message: `Insufficient ${fromAsset.symbol} balance!`, type: 'error' });
      return;
    }

    setSwapping(true);
    try {
      await new Promise(r => setTimeout(r, 700));
      onExecuteSwap?.({
        fromSymbol: fromAsset.symbol,
        fromAmount: amountVal,
        toSymbol: toAsset.symbol,
        toAmount: parseFloat(toAmount),
      });
      onShowToast?.({
        message: `Successfully swapped ${amountVal} ${fromAsset.symbol} for ${toAmount} ${toAsset.symbol}!`,
        type: 'success'
      });
      setFromAmount('');
    } catch (err) {
      onShowToast?.({ message: err.message || 'Swap failed', type: 'error' });
    } finally {
      setSwapping(false);
    }
  };

  return (
    <div className="swap-container">
      <div className="panel-title">
        <i className="fa-solid fa-repeat" />
        <span>Instant DEX Swap</span>
      </div>

      <form onSubmit={handleSwap} className="swap-form">
        {/* Pay Box */}
        <div className="swap-asset-card">
          <div className="swap-card-top">
            <label>You Pay</label>
            <span className="swap-balance-label">
              Balance: <strong>{sourceBalance.toLocaleString()} {fromAsset.symbol}</strong>
              <button type="button" className="btn-max-pill" onClick={handleMax}>MAX</button>
            </span>
          </div>

          <div className="swap-input-row">
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0.0"
              value={fromAmount}
              onChange={e => setFromAmount(e.target.value)}
              required
            />
            <div className="asset-select-wrapper">
              <select
                value={fromAsset.symbol}
                onChange={e => {
                  const sel = ASSETS.find(a => a.symbol === e.target.value);
                  if (sel) {
                    if (sel.symbol === toAsset.symbol) handleFlip();
                    else setFromAsset(sel);
                  }
                }}
              >
                {ASSETS.map(a => (
                  <option key={a.symbol} value={a.symbol}>{a.symbol} - {a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Flip Button */}
        <div className="swap-flip-wrapper">
          <motion.button
            type="button"
            className="btn-flip"
            onClick={handleFlip}
            whileHover={{ scale: 1.12, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.25 }}
            title="Switch assets"
          >
            <i className="fa-solid fa-arrow-down-up-across-line" />
          </motion.button>
        </div>

        {/* Receive Box */}
        <div className="swap-asset-card">
          <div className="swap-card-top">
            <label>You Receive (Estimated)</label>
            <span className="swap-balance-label">
              Balance: <strong>{(cryptoBalances?.[toAsset.symbol] || (toAsset.symbol === 'INR' ? walletBalance : 0) || 0).toLocaleString()} {toAsset.symbol}</strong>
            </span>
          </div>

          <div className="swap-input-row">
            <input
              type="text"
              readOnly
              placeholder="0.0"
              value={toAmount}
            />
            <div className="asset-select-wrapper">
              <select
                value={toAsset.symbol}
                onChange={e => {
                  const sel = ASSETS.find(a => a.symbol === e.target.value);
                  if (sel) {
                    if (sel.symbol === fromAsset.symbol) handleFlip();
                    else setToAsset(sel);
                  }
                }}
              >
                {ASSETS.map(a => (
                  <option key={a.symbol} value={a.symbol}>{a.symbol} - {a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Swap Details Accordion */}
        <div className="swap-details-box">
          <div className="swap-detail-item">
            <span>Exchange Rate</span>
            <strong>1 {fromAsset.symbol} ≈ {exchangeRate < 0.0001 ? exchangeRate.toFixed(8) : exchangeRate.toFixed(4)} {toAsset.symbol}</strong>
          </div>
          <div className="swap-detail-item">
            <span>Slippage Tolerance</span>
            <div className="slippage-options">
              {['0.1%', '0.5%', '1.0%'].map(slip => (
                <button
                  type="button"
                  key={slip}
                  className={`slip-pill ${slippage === slip ? 'active' : ''}`}
                  onClick={() => setSlippage(slip)}
                >
                  {slip}
                </button>
              ))}
            </div>
          </div>
          <div className="swap-detail-item">
            <span>Network Routing</span>
            <span className="badge-routing"><i className="fa-solid fa-route" /> Best Route (Zero Protocol Fee)</span>
          </div>
        </div>

        <motion.button
          type="submit"
          className="btn-submit"
          disabled={swapping || !fromAmount}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {swapping ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" /> Swapping Tokens...
            </>
          ) : (
            <>
              Confirm Swap <i className="fa-solid fa-arrow-right" />
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}
