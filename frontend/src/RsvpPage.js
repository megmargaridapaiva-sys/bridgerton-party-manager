import { useState, useEffect } from "react";

const C = {
  rosa: "#C9A0DC", rosaD: "#9B6BB5",
  verde: "#7FB5A0", verdeD: "#4A8A73",
  escuro: "#1C1520", escuro2: "#241C2C",
  bg: "#F7F3EF", card: "#FFFFFF",
  txt: "#2A2018", muted: "#9A9088", line: "#EAE4DC",
};

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RsvpPage() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const guestId = parseInt(parts[1] || "0", 10);
  const params = new URLSearchParams(window.location.search);
  const nome = params.get("n") || "Convidado(a)";

  const [status, setStatus] = useState(null); // null | 'confirmado' | 'recusado'
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!guestId) { setLoading(false); return; }
    fetch(`${API}/rsvp/${guestId}`)
      .then(r => r.ok ? r.json() : {})
      .then(d => {
        if (d && d.status) {
          setSaved(d);
          setStatus(d.status);
          setMessage(d.message || "");
        }
      })
      .finally(() => setLoading(false));
  }, [guestId]);

  const confirm = async (choice) => {
    if (sending || !guestId) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/rsvp/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_id: guestId, nome, status: choice, message,
        }),
      });
      const data = await res.json();
      setSaved(data);
      setStatus(choice);
    } catch (e) {
      alert("Não consegui salvar. Tenta de novo em instantes.");
    } finally {
      setSending(false);
    }
  };

  if (!guestId) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={h1Style}>Link inválido 😔</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>
            Peça um novo link para a família da Ana Clara.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 10, letterSpacing: 5, color: C.rosa, textTransform: "uppercase", marginBottom: 8 }}>
            Você foi convidado(a) para
          </div>
          <div style={{ fontSize: 26, fontStyle: "italic", color: "#fff", lineHeight: 1.2 }}>
            Os 15 anos de<br/>
            <span style={{ color: C.rosa, fontSize: 34 }}>Ana Clara</span> 🌸
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 12, letterSpacing: 1 }}>
            🌿 JARDIM ENCANTADO
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
            📅 Setembro 2026 · 📍 Buffet Castelo
          </div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "16px 18px",
          textAlign: "center", marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4, letterSpacing: 1, textTransform: "uppercase" }}>Convite para</div>
          <div style={{ fontSize: 20, fontStyle: "italic", color: "#fff" }}>{nome}</div>
        </div>

        {loading ? (
          <div style={{ color: C.muted, textAlign: "center", padding: 20 }}>Carregando…</div>
        ) : status ? (
          <div data-testid="rsvp-confirmed" style={{
            background: status === "confirmado" ? `${C.verde}22` : "rgba(200,80,80,0.15)",
            border: `1.5px solid ${status === "confirmado" ? C.verde : "#C05050"}`,
            borderRadius: 14, padding: 18, textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>
              {status === "confirmado" ? "🌸" : "💛"}
            </div>
            <div style={{ fontSize: 16, color: "#fff", fontStyle: "italic", marginBottom: 6 }}>
              {status === "confirmado"
                ? "Sua presença está confirmada!"
                : "Você respondeu que não pode ir"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>
              {status === "confirmado"
                ? "Ana Clara vai adorar ter você lá. 🌿"
                : "Vamos sentir sua falta. Obrigada por avisar!"}
            </div>
            <button
              data-testid="rsvp-change"
              onClick={() => setStatus(null)}
              style={{
                background: "transparent", border: `1px solid rgba(255,255,255,0.3)`,
                color: "rgba(255,255,255,0.7)", padding: "7px 14px", borderRadius: 20,
                fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                textTransform: "uppercase", letterSpacing: 1,
              }}
            >
              Alterar resposta
            </button>
          </div>
        ) : (
          <>
            <textarea
              data-testid="rsvp-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Deixe uma mensagem carinhosa para a Ana Clara (opcional)"
              rows={3}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1px solid rgba(255,255,255,0.15)`, background: "rgba(255,255,255,0.04)",
                color: "#fff", fontSize: 13, fontFamily: "inherit", resize: "none",
                outline: "none", boxSizing: "border-box", marginBottom: 14,
              }}
            />
            <button
              data-testid="rsvp-confirm-btn"
              onClick={() => confirm("confirmado")}
              disabled={sending}
              style={{
                width: "100%", padding: "13px", borderRadius: 12,
                background: `linear-gradient(135deg, ${C.verde}, ${C.verdeD})`,
                color: "#fff", border: "none", cursor: sending ? "wait" : "pointer",
                fontSize: 15, fontFamily: "inherit", fontStyle: "italic",
                marginBottom: 8, boxShadow: "0 4px 14px rgba(127,181,160,0.35)",
              }}
            >
              🌸 Sim, estarei presente
            </button>
            <button
              data-testid="rsvp-decline-btn"
              onClick={() => confirm("recusado")}
              disabled={sending}
              style={{
                width: "100%", padding: "11px", borderRadius: 12,
                background: "transparent", color: "rgba(255,255,255,0.5)",
                border: `1px solid rgba(255,255,255,0.15)`,
                cursor: sending ? "wait" : "pointer",
                fontSize: 13, fontFamily: "inherit",
              }}
            >
              Infelizmente não poderei ir
            </button>
          </>
        )}

        <div style={{
          marginTop: 22, textAlign: "center", fontSize: 10,
          color: "rgba(255,255,255,0.25)", letterSpacing: 1, textTransform: "uppercase",
        }}>
          Método Experiência 15 RP
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: `linear-gradient(160deg, ${C.escuro} 0%, ${C.escuro2} 100%)`,
  fontFamily: "'Palatino Linotype',Georgia,serif",
  padding: "40px 16px",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const cardStyle = {
  width: "100%", maxWidth: 460,
  background: "rgba(0,0,0,0.35)",
  borderRadius: 22,
  border: "1px solid rgba(201,160,220,0.2)",
  padding: "36px 26px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
  position: "relative", overflow: "hidden",
};

const h1Style = { fontSize: 24, color: "#fff", margin: 0, fontStyle: "italic" };
