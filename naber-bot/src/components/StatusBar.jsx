import { shortAddress } from "../lib/messages";

export default function StatusBar({
  status, // "disconnected" | "connecting" | "connected"
  address,
  balance,
  onDisconnect,
  personality,
  onChangePersonality,
}) {
  const isConnected = status === "connected";

  return (
    <header className="status-bar">
      <div className="status-bar__brand">
        <span className="status-bar__logo">⌁</span>
        <span className="status-bar__name">GuíaOrbita</span>
      </div>

      <div className="status-bar__info">
        {isConnected ? (
          <>
            <div className="status-pill status-pill--connected">
              <span className="status-pill__dot" />
              {shortAddress(address)}
            </div>
            {balance !== null && (
              <div className="status-pill status-pill--balance">
                {balance} <span className="status-pill__unit">XLM</span>
              </div>
            )}
            <select
              className="personality-select"
              value={personality}
              onChange={(e) => onChangePersonality(e.target.value)}
              aria-label="Bot Kişiliği"
            >
              <option value="friendly">😊 Dost Canlısı</option>
              <option value="technical">🔬 Ciddi/Teknik</option>
              <option value="cool">😎 Havalı/Sokak</option>
            </select>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={onDisconnect}
            >
              Bağlantıyı kes
            </button>
          </>
        ) : (
          <>
            <select
              className="personality-select"
              value={personality}
              onChange={(e) => onChangePersonality(e.target.value)}
              aria-label="Bot Kişiliği"
            >
              <option value="friendly">😊 Dost Canlısı</option>
              <option value="technical">🔬 Ciddi/Teknik</option>
              <option value="cool">😎 Havalı/Sokak</option>
            </select>
            <div className="status-pill status-pill--disconnected">
              <span className="status-pill__dot" />
              Bağlı değil
            </div>
          </>
        )}
      </div>
    </header>
  );
}
