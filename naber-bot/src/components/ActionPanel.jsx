import { useState } from "react";

export default function ActionPanel({
  flow, // "connect" | "idle" | "payment-form" | "payment-confirm" | "busy" | "address-book"
  disabled,
  contacts = [],
  onConnect,
  onCheckBalance,
  onStartPayment,
  onSubmitPaymentForm,
  onConfirmPayment,
  onCancelPayment,
  onAddContact,
  onDeleteContact,
  onShowTransactions,
  onOpenAddressBook,
  onCloseAddressBook,
}) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [newName, setNewName] = useState("");
  const [newAddr, setNewAddr] = useState("");

  if (flow === "connect") {
    return (
      <div className="action-panel">
        <button
          type="button"
          className="btn btn--primary btn--full"
          onClick={onConnect}
          disabled={disabled}
        >
          Freighter ile bağlan
        </button>
      </div>
    );
  }

  if (flow === "address-book") {
    return (
      <div className="action-panel action-panel--address-book">
        <div className="address-book__header">
          <h3>Adres Defteri</h3>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onCloseAddressBook}>
            Geri
          </button>
        </div>

        {contacts.length === 0 ? (
          <p className="address-book__empty">Henüz kimse kaydedilmemiş.</p>
        ) : (
          <div className="address-book__list">
            {contacts.map((c, i) => (
              <div key={i} className="address-book__item">
                <div className="contact-info">
                  <strong>{c.name}</strong>
                  <span className="contact-address">{c.address.slice(0, 8)}...{c.address.slice(-8)}</span>
                </div>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => onDeleteContact(i)}
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          className="address-book__add-form"
          onSubmit={(e) => {
            e.preventDefault();
            const success = onAddContact(newName, newAddr);
            if (success) {
              setNewName("");
              setNewAddr("");
            }
          }}
        >
          <h4>Yeni Kişi Ekle</h4>
          <div className="field">
            <input
              type="text"
              placeholder="İsim (Örn. Ahmet)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <input
              type="text"
              placeholder="Stellar Adresi (G...)"
              value={newAddr}
              onChange={(e) => setNewAddr(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn--primary btn--full" disabled={disabled}>
            Kaydet
          </button>
        </form>
      </div>
    );
  }

  if (flow === "payment-form") {
    return (
      <form
        className="action-panel action-panel--form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitPaymentForm({ destination: destination.trim(), amount: amount.trim() });
        }}
      >
        {contacts.length > 0 && (
          <div className="field">
            <label htmlFor="contact-select">Kayıtlı Alıcılardan Seç</label>
            <select
              id="contact-select"
              className="select-field"
              onChange={(e) => setDestination(e.target.value)}
              value={destination}
            >
              <option value="">-- Bir kişi seçin --</option>
              {contacts.map((c, i) => (
                <option key={i} value={c.address}>
                  {c.name} ({c.address.slice(0, 4)}...{c.address.slice(-4)})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="destination">Alıcı adresi</label>
          <input
            id="destination"
            type="text"
            placeholder="G..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
        </div>
        <div className="field">
          <label htmlFor="amount">Tutar (XLM)</label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="5"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="action-panel__row">
          <button type="button" className="btn btn--ghost" onClick={onCancelPayment}>
            Vazgeç
          </button>
          <button type="submit" className="btn btn--primary" disabled={disabled}>
            Gönder
          </button>
        </div>
      </form>
    );
  }

  if (flow === "payment-confirm") {
    return (
      <div className="action-panel action-panel__row">
        <button type="button" className="btn btn--ghost" onClick={onCancelPayment} disabled={disabled}>
          Vazgeç
        </button>
        <button type="button" className="btn btn--primary" onClick={onConfirmPayment} disabled={disabled}>
          Onayla ve gönder
        </button>
      </div>
    );
  }

  if (flow === "idle") {
    return (
      <div className="action-panel action-panel__row">
        <button type="button" className="btn btn--secondary" onClick={onCheckBalance} disabled={disabled}>
          Bakiyeyi göster
        </button>
        <button type="button" className="btn btn--secondary" onClick={onShowTransactions} disabled={disabled}>
          Son İşlemler
        </button>
        <button type="button" className="btn btn--secondary" onClick={onOpenAddressBook} disabled={disabled}>
          Adres Defteri
        </button>
        <button type="button" className="btn btn--primary" onClick={onStartPayment} disabled={disabled}>
          XLM gönder
        </button>
      </div>
    );
  }

  // "busy" durumunda input alanı gösterme
  return <div className="action-panel action-panel--empty" />;
}
