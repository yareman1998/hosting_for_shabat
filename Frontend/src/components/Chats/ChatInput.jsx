
import { Send } from 'lucide-react';

export function ChatInput({ messageText, setMessageText, sendMessage }) {
  return (
    <form onSubmit={sendMessage} className="chat-input-form">
      <input
        type="text"
        placeholder="הקלד הודעה..."
        className="chat-input"
        value={messageText}
        onChange={e => setMessageText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
      />
      <button
        type="submit"
        disabled={!messageText.trim()}
        className="chat-send-btn"
      >
        <Send className="w-4 h-4 rotate-180" />
      </button>
    </form>
  );
}
