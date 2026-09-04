import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AddressBook({ contacts, onAddContact, onDeleteContact, onSelectContact, onShowToast }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('Ethereum');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) {
      onShowToast?.({ message: 'Name and Email are required', type: 'error' });
      return;
    }

    onAddContact?.({ name, email, address: address || 'N/A', chain });
    setName('');
    setEmail('');
    setAddress('');
    setShowAddForm(false);
    onShowToast?.({ message: `Contact "${name}" added!`, type: 'success' });
  };

  return (
    <div className="address-book-container">
      <div className="panel-title-row">
        <div className="panel-title">
          <i className="fa-solid fa-address-book" />
          <span>Beneficiaries & Address Book</span>
        </div>
        <button
          className="btn-add-contact"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <i className={`fa-solid ${showAddForm ? 'fa-minus' : 'fa-plus'}`} />
          <span>{showAddForm ? 'Cancel' : 'Add Beneficiary'}</span>
        </button>
      </div>

      {showAddForm && (
        <motion.form
          className="glass-card add-contact-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h4>New Contact Details</h4>
          <div className="form-row-2">
            <div className="form-group">
              <label>Contact Name</label>
              <input
                type="text"
                placeholder="e.g. Satoshi Nakamoto"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Pay Email (NivaPay ID)</label>
              <input
                type="email"
                placeholder="user@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label>Crypto Wallet Address (Optional)</label>
              <input
                type="text"
                placeholder="0x... or sol address"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Preferred Network</label>
              <select value={chain} onChange={e => setChain(e.target.value)}>
                <option value="Ethereum">Ethereum</option>
                <option value="Solana">Solana</option>
                <option value="Polygon">Polygon</option>
                <option value="Bitcoin">Bitcoin</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-submit">
            <i className="fa-solid fa-check" /> Save Contact
          </button>
        </motion.form>
      )}

      <div className="contacts-grid">
        {(!contacts || contacts.length === 0) ? (
          <p className="text-muted">No saved contacts yet. Add your frequent payees above.</p>
        ) : (
          contacts.map((c, index) => (
            <div key={c.id || index} className="contact-card">
              <div className="contact-avatar">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="contact-info">
                <strong>{c.name}</strong>
                <span className="contact-email">{c.email}</span>
                {c.address && c.address !== 'N/A' && (
                  <span className="contact-addr">
                    <i className="fa-brands fa-ethereum" /> {c.address}
                  </span>
                )}
              </div>
              <div className="contact-actions">
                <button
                  type="button"
                  className="btn-pay-contact"
                  onClick={() => onSelectContact?.(c.email)}
                  title="Quick Pay"
                >
                  <i className="fa-solid fa-paper-plane" /> Pay
                </button>
                <button
                  type="button"
                  className="btn-del-contact"
                  onClick={() => onDeleteContact?.(index)}
                  title="Delete Contact"
                >
                  <i className="fa-solid fa-trash-can" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
