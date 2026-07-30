import { useState, useEffect, useRef } from "react";

const C = {
  rosa: "#C9A0DC", rosaD: "#9B6BB5",
  verde: "#7FB5A0",
  escuro: "#1C1520",
  card: "#FFFFFF",
  bg: "#F7F3EF",
  txt: "#2A2018", muted: "#9A9088", line: "#EAE4DC",
};

const BACKEND = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND}/api`;

function getSessionId() {
  let sid = localStorage.getItem("ac_chat_sid");
  if (!sid) {
    sid = "ac-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem("ac_chat_sid", sid);
  }
  return sid;
}

export default function ChatWidget({ getContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const sessionId = useRef(getSessionId());

  useEffect(() => {
    if (open && messages.length === 0) {
      fetch(`${API}/chat/history/${sessionId.current}`)
        .then(r => r.ok ? r.json() : [])
        .then(hist => {
          if (hist && hist.length > 0) {
            setMessages(hist.map(h => ({ role: h.role, text: h.text })));
          } else {
            setMessages([{
              role: "assistant",
              text: "Oi! 🌸 Sou a assistente da festa da Ana Clara. Posso ajudar com checklist, fornecedores, convidados ou orçamento. O que você quer saber?",
            }]);
          }
        })
        .catch(() => {
          setMessages([{ role: "assistant", text: "Oi! 🌸 Como posso ajudar hoje?" }]);
        });
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text }, { role: "assistant", text: "" }]);
    setSending(true);

    try {
      const ctx = typeof getContext === "function" ? getContext() : null;
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId.current, message: text, context: ctx }),
      });

      if (!res.ok || !res.body) throw new Error("Sem resposta do servidor");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;
          if (payload.startsWith("[ERROR]")) {
            setMessages(m => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", text: "😔 " + payload };
              return copy;
            });
            continue;
          }
          const chunk = payload.replace(/\\n/g, "\n");
          setMessages(m => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, text: (last.text || "") + chunk };
            return copy;
          });
        }
      }
    } catch (e) {
      setMessages(m => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", text: "😔 Não consegui responder agora. Tenta de novo em instantes." };
        return copy;
      });
    } finally {
      setSending(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        data-testid="chat-toggle-btn"
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 9999,
          width: 58, height: 58, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.rosa}, ${C.rosaD})`,
          border: "none", cursor: "pointer",
          boxShadow: "0 6px 20px rgba(155,107,181,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, transition: "transform 0.2s",
          transform: open ? "scale(0.9)" : "scale(1)",
        }}
        aria-label="Assistente da Festa"
      >
        {open ? "✕" : "🌸"}
      </button>

      {/* Panel */}
      {open && (
        <div
          data-testid="chat-panel"
          style={{
            position: "fixed", bottom: 90, right: 20, zIndex: 9998,
            width: "min(380px, calc(100vw - 30px))",
            height: "min(560px, calc(100vh - 130px))",
            background: C.card, borderRadius: 18,
            border: `1px solid ${C.line}`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            fontFamily: "'Palatino Linotype',Georgia,serif",
          }}
        >
          {/* Header */}
          <div style={{
            background: `linear-gradient(150deg, ${C.escuro}, #241C2C)`,
            padding: "14px 18px", color: "#fff",
          }}>
            <div style={{ fontSize: 9, letterSpacing: 4, color: C.rosa, textTransform: "uppercase", marginBottom: 2 }}>
              Assistente
            </div>
            <div style={{ fontSize: 17, fontStyle: "italic" }}>Festa da Ana Clara 🌸</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              powered by Gemini 3 Flash
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            data-testid="chat-messages"
            style={{
              flex: 1, overflowY: "auto", padding: "14px 14px 6px",
              background: C.bg, display: "flex", flexDirection: "column", gap: 10,
            }}
          >
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: m.role === "user" ? C.rosa : C.card,
                color: m.role === "user" ? "#fff" : C.txt,
                padding: "9px 13px", borderRadius: 14,
                borderBottomRightRadius: m.role === "user" ? 4 : 14,
                borderBottomLeftRadius: m.role === "user" ? 14 : 4,
                fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap",
                border: m.role === "user" ? "none" : `1px solid ${C.line}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                {m.text || (m.role === "assistant" && sending && i === messages.length - 1
                  ? <span style={{ color: C.muted, fontStyle: "italic" }}>digitando…</span>
                  : "")}
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{
            padding: 10, borderTop: `1px solid ${C.line}`,
            display: "flex", gap: 8, background: C.card,
          }}>
            <textarea
              data-testid="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Pergunte sobre a festa..."
              rows={1}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 20,
                border: `1.5px solid ${C.line}`, resize: "none",
                fontSize: 13, fontFamily: "inherit", outline: "none",
                background: "#FAFAF8", color: C.txt, maxHeight: 100,
              }}
            />
            <button
              data-testid="chat-send-btn"
              onClick={send}
              disabled={sending || !input.trim()}
              style={{
                width: 40, height: 40, borderRadius: "50%",
                border: "none", cursor: sending ? "not-allowed" : "pointer",
                background: sending || !input.trim() ? C.line : C.verde,
                color: "#fff", fontSize: 16, flexShrink: 0,
                transition: "background 0.2s",
              }}
              aria-label="Enviar"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
