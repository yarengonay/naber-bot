export default function TypingIndicator() {
  return (
    <div className="chat-row chat-row--bot">
      <div className="bot-avatar bot-avatar--thinking" aria-hidden="true">
        <span className="bot-avatar-dot" />
      </div>
      <div className="chat-bubble chat-bubble--bot chat-bubble--typing" aria-label="GuíaOrbita yazıyor">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}
