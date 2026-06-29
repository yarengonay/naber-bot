function formatText(text) {
  const lines = text.split(/\n/);
  return lines.map((line, i) => {
    // Kalın (**metin**) ve linkler ([etiket](url)) için ayırıcı regex
    const regex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
    const segments = line.split(regex).map((seg, j) => {
      if (seg.startsWith("**") && seg.endsWith("**")) {
        return <strong key={j}>{seg.slice(2, -2)}</strong>;
      }
      if (seg.startsWith("[") && seg.includes("](") && seg.endsWith(")")) {
        const separatorIdx = seg.indexOf("](");
        const label = seg.slice(1, separatorIdx);
        const url = seg.slice(separatorIdx + 2, -1);
        return (
          <a
            key={j}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-bubble-link"
          >
            {label}
          </a>
        );
      }
      return seg;
    });
    return (
      <span key={i}>
        {segments}
        {i !== lines.length - 1 && <br />}
      </span>
    );
  });
}

export default function ChatBubble({ message }) {
  const { sender, variant, text } = message;

  if (sender === "system") {
    return (
      <div className={`chat-system chat-system--${variant}`}>
        <span>{text}</span>
      </div>
    );
  }

  const isBot = sender === "bot";

  return (
    <div className={`chat-row chat-row--${sender}`}>
      {isBot && (
        <div className={`bot-avatar bot-avatar--${variant}`} aria-hidden="true">
          <span className="bot-avatar-dot" />
        </div>
      )}
      <div className={`chat-bubble chat-bubble--${sender} chat-bubble--${variant}`}>
        {formatText(text)}
      </div>
    </div>
  );
}
