import { useState } from 'react';
import { motion } from 'framer-motion';

export default function TransactionActivity({ transactions, onShowToast }) {
  const [filter, setFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState(null);

  const filteredTxs = (transactions || []).filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'sent') return tx.type === 'sent';
    if (filter === 'received') return tx.type === 'received';
    if (filter === 'swap') return tx.type === 'swap';
    if (filter === 'stake') return tx.type === 'stake';
    return true;
  });

  const exportCSV = () => {
    if (!transactions || transactions.length === 0) {
      onShowToast?.({ message: 'No transactions to export', type: 'info' });
      return;
    }
    const headers = ['ID', 'Type', 'Amount', 'Currency', 'Recipient/Counterparty', 'TxHash', 'Timestamp', 'Status'];
    const rows = transactions.map(t => [
      t.id,
      t.type,
      t.amount,
      t.currency,
      t.recipient || t.from || 'N/A',
      t.hash || 'N/A',
      t.timestamp,
      t.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nivapay_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast?.({ message: 'Transaction statement exported as CSV!', type: 'success' });
  };

  const exportJSON = () => {
    if (!transactions || transactions.length === 0) {
      onShowToast?.({ message: 'No transactions to export', type: 'info' });
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `nivapay_transactions_${Date.now()}.json`);
    dlAnchorElem.click();
    onShowToast?.({ message: 'Transaction statement exported as JSON!', type: 'success' });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'sent': return { icon: 'fa-solid fa-arrow-up-right-from-square', color: '#ef4444', label: 'Sent' };
      case 'received': return { icon: 'fa-solid fa-arrow-down-left-and-up-right-to-center', color: '#10b981', label: 'Received' };
      case 'swap': return { icon: 'fa-solid fa-repeat', color: '#8b5cf6', label: 'Swap' };
      case 'stake': return { icon: 'fa-solid fa-seedling', color: '#f59e0b', label: 'Staked' };
      default: return { icon: 'fa-solid fa-receipt', color: '#3b82f6', label: 'Payment' };
    }
  };

  return (
    <div className="activity-container">
      <div className="panel-title-row">
        <div className="panel-title">
          <i className="fa-solid fa-clock-rotate-left" />
          <span>Activity & Transaction Ledger</span>
        </div>
        <div className="export-actions">
          <button className="btn-export-outline" onClick={exportCSV} title="Export CSV for taxes/accounting">
            <i className="fa-solid fa-file-csv" /> Export CSV
          </button>
          <button className="btn-export-outline" onClick={exportJSON} title="Export JSON">
            <i className="fa-solid fa-file-code" /> JSON
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="activity-filters">
        {['all', 'sent', 'received', 'swap', 'stake'].map(f => (
          <button
            key={f}
            type="button"
            className={`filter-pill ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="table-responsive">
        <table className="market-table activity-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Details</th>
              <th>Amount</th>
              <th>Tx Hash</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTxs.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-muted" style={{ padding: '24px' }}>
                  No transactions found for this filter.
                </td>
              </tr>
            ) : (
              filteredTxs.map(tx => {
                const info = getTypeIcon(tx.type);
                const isNegative = tx.type === 'sent';
                return (
                  <tr
                    key={tx.id}
                    className="clickable-tx-row"
                    onClick={() => setSelectedTx(tx)}
                  >
                    <td>
                      <div className="tx-type-cell">
                        <div className="tx-type-icon" style={{ background: `${info.color}15`, color: info.color }}>
                          <i className={info.icon} />
                        </div>
                        <span>{info.label}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{tx.title || (tx.recipient ? `To: ${tx.recipient}` : (tx.from ? `From: ${tx.from}` : 'Transfer'))}</strong>
                    </td>
                    <td>
                      <span className={isNegative ? 'amount-negative' : 'amount-positive'}>
                        {isNegative ? '-' : '+'}
                        {tx.currency === 'INR' ? '₹' : ''}{tx.amount} {tx.currency !== 'INR' ? tx.currency : ''}
                      </span>
                    </td>
                    <td>
                      <code className="hash-code">{tx.hash || '0x49c...8b21'}</code>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {new Date(tx.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td>
                      <span className="status-confirmed-badge">
                        <i className="fa-solid fa-check" /> Confirmed
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="modal-backdrop" onClick={() => setSelectedTx(null)}>
          <motion.div
            className="modal-box tx-modal"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="modal-header">
              <div className="modal-title">
                <i className="fa-solid fa-receipt" />
                <span>Transaction Receipt</span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedTx(null)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="tx-modal-body">
              <div className="tx-big-amount">
                {selectedTx.type === 'sent' ? '-' : '+'}{selectedTx.currency === 'INR' ? '₹ ' : ''}{selectedTx.amount} {selectedTx.currency !== 'INR' ? selectedTx.currency : ''}
              </div>
              <div className="tx-receipt-details">
                <div className="receipt-row">
                  <span>Transaction ID:</span>
                  <code>{selectedTx.id}</code>
                </div>
                <div className="receipt-row">
                  <span>Blockchain / Ledger Hash:</span>
                  <div className="hash-flex">
                    <code>{selectedTx.hash}</code>
                    <button
                      className="btn-mini-copy"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedTx.hash);
                        onShowToast?.({ message: 'Hash copied!', type: 'success' });
                      }}
                    >
                      <i className="fa-regular fa-copy" />
                    </button>
                  </div>
                </div>
                <div className="receipt-row">
                  <span>Status:</span>
                  <strong style={{ color: '#10b981' }}>{selectedTx.status} (12 Block Confirmations)</strong>
                </div>
                <div className="receipt-row">
                  <span>Network Fee:</span>
                  <span>₹0.00 (Zero-gas sponsored)</span>
                </div>
                <div className="receipt-row">
                  <span>Timestamp:</span>
                  <span>{new Date(selectedTx.timestamp).toUTCString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
