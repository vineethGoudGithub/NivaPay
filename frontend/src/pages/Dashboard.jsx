import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../App";
import { api } from "../api";
import Toast from "../components/Toast";
import Web3WalletModal from "../components/Web3WalletModal";
import CryptoMarketFeed from "../components/CryptoMarketFeed";
import CryptoSwap from "../components/CryptoSwap";
import StakingVaults from "../components/StakingVaults";
import MultiChainReceive from "../components/MultiChainReceive";
import IdorSandbox from "../components/IdorSandbox";
import AddressBook from "../components/AddressBook";
import TransactionActivity from "../components/TransactionActivity";

const tabContentVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

export default function Dashboard() {
  const { user, setUser, logout } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("pay");
  const [toast, setToast] = useState(null);

  // Currency selection: 'INR' or 'USD'
  const [currency, setCurrency] = useState("INR");

  // Web3 state
  const [web3ModalOpen, setWeb3ModalOpen] = useState(false);
  const [web3State, setWeb3State] = useState({
    connected: false,
    provider: null,
    address: null,
    shortAddress: null,
    network: null,
    balance: null,
  });

  // Multi-asset crypto balances
  const [cryptoBalances, setCryptoBalances] = useState({
    BTC: 0.0145,
    ETH: 0.385,
    SOL: 4.82,
    USDT: 250.0,
  });

  // Staking positions
  const [stakes, setStakes] = useState([]);

  // Contacts
  const [contacts, setContacts] = useState([]);

  // Transactions ledger
  const [transactions, setTransactions] = useState([]);

  // Send form state
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);

  const [currentUserId, setCurrentUserIdState] = useState(api.getUserId() || "1");

  useEffect(() => {
    loadData(currentUserId);
    setCryptoBalances(api.getCryptoBalances(currentUserId));
    setStakes(api.getStakes(currentUserId));
    setContacts(api.getContacts(currentUserId));
    setTransactions(api.getTransactions(currentUserId));
  }, [currentUserId]);

  const loadData = async (userId = currentUserId) => {
    try {
      const [walletData, profileData] = await Promise.all([
        api.getWallet(userId),
        api.getProfile(userId),
      ]);
      if (walletData && walletData.wallet) setWallet(walletData.wallet);
      if (profileData && profileData.user) {
        setProfile(profileData.user);
        setUser(profileData.user);
      }
    } catch (err) {
      setToast({
        message: "Failed to load live data: " + err.message,
        type: "error",
      });
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);

    const numAmount = parseFloat(amount);
    try {
      const result = await api.sendMoney(recipientEmail, numAmount, currentUserId);
      if (result && result.wallet) {
        setToast({
          message: result.message || "Transfer successful on Render backend!",
          type: "success",
        });
        setWallet(result.wallet);

        // Record transaction
        const newTx = api.addTransaction(currentUserId, {
          type: "sent",
          title: `Payment to ${recipientEmail}`,
          amount: numAmount,
          currency: "INR",
          recipient: recipientEmail,
        });
        if (newTx) setTransactions((prev) => [newTx, ...prev]);

        setRecipientEmail("");
        setAmount("");
      }
    } catch (err) {
      setToast({ message: err.message || "Transfer failed", type: "error" });
    } finally {
      setSending(false);
    }
  };

  // Claim test funds simulation
  const handleClaimFaucet = async () => {
    try {
      // Simulate receipt of test funds
      const bonus = 500.0;
      setToast({ message: "Requesting test faucet from live network...", type: "info" });
      await new Promise((r) => setTimeout(r, 600));

      if (wallet) {
        const updated = { ...wallet, balance: Number(wallet.balance) + bonus };
        setWallet(updated);
      }

      const newTx = api.addTransaction(currentUserId, {
        type: "received",
        title: "Testnet Faucet Grant",
        amount: bonus,
        currency: "INR",
        from: "NivaPay Faucet Network",
      });
      if (newTx) setTransactions((prev) => [newTx, ...prev]);

      setToast({ message: `Received +₹${bonus.toFixed(2)} testnet funds!`, type: "success" });
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  // Swap tokens
  const handleExecuteSwap = ({ fromSymbol, fromAmount, toSymbol, toAmount }) => {
    // If source is INR, update wallet balance
    if (fromSymbol === "INR" && wallet) {
      setWallet({ ...wallet, balance: Math.max(0, Number(wallet.balance) - fromAmount) });
    } else {
      setCryptoBalances((prev) => {
        const updated = {
          ...prev,
          [fromSymbol]: Math.max(0, (prev[fromSymbol] || 0) - fromAmount),
          [toSymbol]: (prev[toSymbol] || 0) + toAmount,
        };
        api.updateCryptoBalances(currentUserId, updated);
        return updated;
      });
    }

    if (toSymbol === "INR" && wallet) {
      setWallet({ ...wallet, balance: Number(wallet.balance) + toAmount });
    } else if (fromSymbol === "INR") {
      setCryptoBalances((prev) => {
        const updated = {
          ...prev,
          [toSymbol]: (prev[toSymbol] || 0) + toAmount,
        };
        api.updateCryptoBalances(currentUserId, updated);
        return updated;
      });
    }

    // Log transaction
    const newTx = api.addTransaction(currentUserId, {
      type: "swap",
      title: `Swapped ${fromAmount} ${fromSymbol} → ${toAmount} ${toSymbol}`,
      amount: fromAmount,
      currency: fromSymbol,
    });
    if (newTx) setTransactions((prev) => [newTx, ...prev]);
  };

  // Staking
  const handleStake = ({ pool, asset, amount, apr }) => {
    setCryptoBalances((prev) => {
      const updated = {
        ...prev,
        [asset]: Math.max(0, (prev[asset] || 0) - amount),
      };
      api.updateCryptoBalances(currentUserId, updated);
      return updated;
    });

    const updatedStakes = api.saveStake(currentUserId, { pool, asset, amount, apr });
    setStakes(updatedStakes);

    const newTx = api.addTransaction(currentUserId, {
      type: "stake",
      title: `Staked in ${pool}`,
      amount,
      currency: asset,
    });
    if (newTx) setTransactions((prev) => [newTx, ...prev]);
  };

  const handleUnstake = (stakeId) => {
    const found = stakes.find((s) => s.id === stakeId);
    if (found) {
      setCryptoBalances((prev) => {
        const updated = {
          ...prev,
          [found.asset]: (prev[found.asset] || 0) + found.amount,
        };
        api.updateCryptoBalances(currentUserId, updated);
        return updated;
      });
    }
    const updated = api.unstake(currentUserId, stakeId);
    setStakes(updated);
    setToast({ message: "Unstaked position & claimed rewards to wallet!", type: "success" });
  };

  // Contacts
  const handleAddContact = (contact) => {
    const updated = api.saveContact(currentUserId, contact);
    setContacts(updated);
  };

  const handleDeleteContact = (index) => {
    const updated = api.deleteContact(currentUserId, index);
    setContacts(updated);
    setToast({ message: "Contact deleted", type: "info" });
  };

  const handleSelectContactForPay = (email) => {
    setRecipientEmail(email);
    setActiveTab("pay");
    setToast({ message: `Selected ${email} for payment`, type: "info" });
  };

  // User ID switch for IDOR sandbox
  const handleSwitchUserId = (newId) => {
    api.setUserId(newId);
    setCurrentUserIdState(newId);
    loadData(newId);
  };

  const fiatBalance = wallet ? parseFloat(wallet.balance) : 0.0;

  // Calculate approximate total net worth in INR
  const totalNetWorthInr = useMemo(() => {
    const btcVal = (cryptoBalances.BTC || 0) * 5350000;
    const ethVal = (cryptoBalances.ETH || 0) * 290000;
    const solVal = (cryptoBalances.SOL || 0) * 12380;
    const usdtVal = (cryptoBalances.USDT || 0) * 83.5;
    return fiatBalance + btcVal + ethVal + solVal + usdtVal;
  }, [fiatBalance, cryptoBalances]);

  const activeUser = profile || user;

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="nav-logo">
          <motion.i
            className="fa-solid fa-wallet"
            whileHover={{ scale: 1.15, rotate: -5 }}
            transition={{ type: "spring", stiffness: 400 }}
          />
          <div className="logo-text-group">
            <span className="brand-title">NivaPay</span>
            <span className="brand-subtitle">Crypto & Fiat Hub</span>
          </div>
        </div>

        {/* Center Live Integrations Indicator */}
        <div className="nav-center-metrics">
          <div className="backend-pill">
            <span className="live-dot pulse" />
            <span className="render-tag">Render Live</span>
          </div>
          <div className="gas-pill">
            <i className="fa-solid fa-gas-pump" />
            <span>16 Gwei</span>
          </div>
          <div className="currency-toggle">
            <button
              className={`curr-btn ${currency === "INR" ? "active" : ""}`}
              onClick={() => setCurrency("INR")}
            >
              ₹ INR
            </button>
            <button
              className={`curr-btn ${currency === "USD" ? "active" : ""}`}
              onClick={() => setCurrency("USD")}
            >
              $ USD
            </button>
          </div>
        </div>

        {/* Right Nav Actions */}
        <div className="nav-profile">
          {/* Web3 Connect Button */}
          <motion.button
            className={`btn-web3-connect ${web3State.connected ? "connected" : ""}`}
            onClick={() => setWeb3ModalOpen(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            {web3State.connected ? (
              <>
                <span className="web3-dot" />
                <span>{web3State.shortAddress}</span>
                <span className="web3-net-tag">{web3State.network?.symbol}</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-wallet" />
                <span>Connect Web3</span>
              </>
            )}
          </motion.button>

          {/* User Badge */}
          <div className="user-badge">
            <i className="fa-regular fa-circle-user" />
            <span>
              {activeUser?.name || "User"} <strong className="badge-id">#{currentUserId}</strong>
            </span>
          </div>

          <motion.button
            className="btn-logout"
            onClick={logout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Logout"
          >
            <i className="fa-solid fa-power-off" />
          </motion.button>
        </div>
      </nav>

      {/* Main Workspace Layout */}
      <div className="workspace">
        {/* Left Sidebar / Overview Panel */}
        <div className="wallet-panel">
          {/* Net Worth Card */}
          <div className="glass-card balance-card">
            <div className="balance-header-row">
              <span className="balance-kicker">Total Estimated Net Worth</span>
              <span className="asset-tag">Multi-Asset</span>
            </div>
            <div className="balance-amount">
              <span className="currency-symbol">{currency === "INR" ? "₹" : "$"}</span>
              <span>
                {currency === "INR"
                  ? totalNetWorthInr.toLocaleString("en-IN", { maximumFractionDigits: 2 })
                  : (totalNetWorthInr / 83.5).toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Primary Fiat Balance */}
            <div className="fiat-sub-balance">
              <div className="fiat-row">
                <span>Primary Wallet Balance (Live DB):</span>
                <strong>₹ {fiatBalance.toFixed(2)}</strong>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="balance-actions-row">
              <button
                className="btn-faucet-claim"
                onClick={handleClaimFaucet}
                title="Claim ₹500 test tokens"
              >
                <i className="fa-solid fa-faucet-drip" /> +₹500 Faucet
              </button>
              <button className="btn-copy" onClick={() => loadData()}>
                <i className="fa-solid fa-arrows-rotate" /> Sync
              </button>
            </div>

            {/* Crypto Holdings Breakdown Bar */}
            <div className="holdings-summary">
              <div className="holdings-title">
                <span>Crypto Reserves</span>
              </div>
              <div className="crypto-pills-row">
                <div className="crypto-pill">
                  <i className="fa-brands fa-bitcoin" style={{ color: "#f7931a" }} />
                  <span>{cryptoBalances.BTC} BTC</span>
                </div>
                <div className="crypto-pill">
                  <i className="fa-brands fa-ethereum" style={{ color: "#627eea" }} />
                  <span>{cryptoBalances.ETH} ETH</span>
                </div>
                <div className="crypto-pill">
                  <i className="fa-solid fa-bolt" style={{ color: "#14f195" }} />
                  <span>{cryptoBalances.SOL} SOL</span>
                </div>
                <div className="crypto-pill">
                  <i className="fa-solid fa-dollar-sign" style={{ color: "#26a17b" }} />
                  <span>{cryptoBalances.USDT} USDT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Menu */}
          <div className="actions-menu-grid">
            {[
              { id: "pay", label: "Send & Pay", icon: "fa-solid fa-paper-plane" },
              { id: "receive", label: "Receive & QR", icon: "fa-solid fa-qrcode" },
              { id: "swap", label: "Instant Swap", icon: "fa-solid fa-repeat" },
              { id: "market", label: "Crypto Markets", icon: "fa-solid fa-chart-line" },
              { id: "staking", label: "Staking & Yield", icon: "fa-solid fa-seedling" },
              { id: "contacts", label: "Address Book", icon: "fa-solid fa-address-book" },
              { id: "activity", label: "Transactions", icon: "fa-solid fa-clock-rotate-left" },
              { id: "sandbox", label: "IDOR Sandbox", icon: "fa-solid fa-bug" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`action-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={tab.icon} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Feature Panel */}
        <div className="main-panel">
          <div className="glass-card content-card">
            <AnimatePresence mode="wait">
              {/* TAB 1: SEND & PAY */}
              {activeTab === "pay" && (
                <motion.div
                  key="pay"
                  className="form-section"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div className="panel-title">
                    <i className="fa-solid fa-paper-plane" />
                    <span>Instant Money Transfer (Live Backend)</span>
                  </div>

                  <form onSubmit={handleSend}>
                    <div className="form-group">
                      <label>Recipient NivaPay ID / Email</label>
                      <div className="input-wrapper">
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="e.g. demo99@test.com"
                          required
                        />
                        <i className="fa-regular fa-envelope" />
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="amount-label-row">
                        <label>Amount (₹)</label>
                        <span className="balance-hint">
                          Available: ₹ {fiatBalance.toFixed(2)}
                        </span>
                      </div>
                      <div className="input-wrapper">
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          min="1"
                          step="any"
                          required
                        />
                        <i className="fa-solid fa-indian-rupee-sign" />
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      className="btn-submit"
                      disabled={sending}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {sending ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin" /> Transferring via Render API...
                        </>
                      ) : (
                        <>
                          Send ₹ Instant Transfer <i className="fa-solid fa-arrow-right" />
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* TAB 2: MULTI-CHAIN RECEIVE & QR */}
              {activeTab === "receive" && (
                <motion.div
                  key="receive"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <MultiChainReceive
                    userEmail={activeUser?.email}
                    onShowToast={(t) => setToast(t)}
                  />
                </motion.div>
              )}

              {/* TAB 3: INSTANT DEX SWAP */}
              {activeTab === "swap" && (
                <motion.div
                  key="swap"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <CryptoSwap
                    walletBalance={fiatBalance}
                    cryptoBalances={cryptoBalances}
                    onExecuteSwap={handleExecuteSwap}
                    onShowToast={(t) => setToast(t)}
                  />
                </motion.div>
              )}

              {/* TAB 4: LIVE CRYPTO MARKETS */}
              {activeTab === "market" && (
                <motion.div
                  key="market"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <CryptoMarketFeed
                    currency={currency}
                    onSelectCoinForSwap={(symbol) => {
                      setActiveTab("swap");
                      setToast({ message: `Ready to swap ${symbol}`, type: "info" });
                    }}
                  />
                </motion.div>
              )}

              {/* TAB 5: DEFI STAKING & YIELD */}
              {activeTab === "staking" && (
                <motion.div
                  key="staking"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <StakingVaults
                    cryptoBalances={cryptoBalances}
                    stakes={stakes}
                    onStake={handleStake}
                    onUnstake={handleUnstake}
                    onShowToast={(t) => setToast(t)}
                  />
                </motion.div>
              )}

              {/* TAB 6: ADDRESS BOOK */}
              {activeTab === "contacts" && (
                <motion.div
                  key="contacts"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <AddressBook
                    contacts={contacts}
                    onAddContact={handleAddContact}
                    onDeleteContact={handleDeleteContact}
                    onSelectContact={handleSelectContactForPay}
                    onShowToast={(t) => setToast(t)}
                  />
                </motion.div>
              )}

              {/* TAB 7: TRANSACTIONS ACTIVITY */}
              {activeTab === "activity" && (
                <motion.div
                  key="activity"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <TransactionActivity
                    transactions={transactions}
                    onShowToast={(t) => setToast(t)}
                  />
                </motion.div>
              )}

              {/* TAB 8: IDOR DEVELOPER SANDBOX */}
              {activeTab === "sandbox" && (
                <motion.div
                  key="sandbox"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <IdorSandbox
                    currentUserId={currentUserId}
                    onSwitchUserId={handleSwitchUserId}
                    onRefreshData={() => loadData(currentUserId)}
                    onShowToast={(t) => setToast(t)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Web3 Connection Modal */}
      <Web3WalletModal
        isOpen={web3ModalOpen}
        onClose={() => setWeb3ModalOpen(false)}
        web3State={web3State}
        setWeb3State={setWeb3State}
        onShowToast={(t) => setToast(t)}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </motion.div>
  );
}
