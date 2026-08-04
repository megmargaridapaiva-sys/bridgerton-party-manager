import { useState, useEffect } from "react";
import "@/App.css";
import ChatWidget from "@/ChatWidget";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PARTY_DATE = new Date("2026-09-19T20:00:00");
const daysUntilParty = () => Math.max(0, Math.ceil((PARTY_DATE - new Date()) / 86400000));

// ─── PALETTE ─────────────────────────────────────────────────
const C = {
  rosa: "#C9A0DC", rosaD: "#9B6BB5", rosaLt: "#F5EEF8",
  verde: "#7FB5A0", verdeD: "#4A8A73", verdeLt: "#EAF4F0",
  dourado: "#D4A843", douradoLt: "#FDF4DC",
  azul: "#7A9EC4", azulLt: "#E8EEF6",
  escuro: "#1C1520", escuro2: "#241C2C",
  bg: "#F7F3EF", card: "#FFFFFF",
  txt: "#2A2018", muted: "#9A9088", line: "#EAE4DC",
};

// ─── REAL DATA ────────────────────────────────────────────────
const DEBUTANTE = {
  nome: "Ana Clara", tema: "", data: "19 de setembro de 2026",
  convidados: "120", local: "Buffet Castelo", cor: "Tons Rosa e Branco",
};

const ORCAMENTO_CATS = [
  { cat: "Infraestrutura", estimado: 25000, previsto: 11500, real: 7050, itens: [
    { item: "Espaço", previsto: 5000, real: 6000 },
    { item: "Gerador", previsto: 1500, real: 1050 },
    { item: "Decoração Temática", previsto: 5000, real: 0 },
  ]},
  { cat: "Gastronomia", estimado: 12000, previsto: 15600, real: 18050, itens: [
    { item: "Buffet", previsto: 12000, real: 16000 },
    { item: "Salada Ciser", previsto: 0, real: 500 },
    { item: "Doces Finos", previsto: 1100, real: 1550 },
    { item: "Carrinho Gourmet", previsto: 2500, real: 0 },
  ]},
  { cat: "Bebidas", estimado: 8000, previsto: 3500, real: 3000, itens: [
    { item: "Bartender", previsto: 500, real: 250 },
    { item: "Bar de Drinks", previsto: 2500, real: 2750 },
    { item: "Choop", previsto: 500, real: 0 },
  ]},
  { cat: "Cenografia", estimado: 3000, previsto: 1000, real: 1850, itens: [
    { item: "Gelo Seco", previsto: 250, real: 600 },
    { item: "Gerbs", previsto: 300, real: 500 },
    { item: "CO₂", previsto: 450, real: 750 },
  ]},
  { cat: "Iluminação", estimado: 5000, previsto: 1500, real: 500, itens: [
    { item: "Letreiro LED #15anos", previsto: 100, real: 100 },
    { item: "Pista de LED", previsto: 200, real: 250 },
    { item: "Telões", previsto: 100, real: 150 },
    { item: "Torres de LED", previsto: 1100, real: 0 },
  ]},
  { cat: "Música e Sonorização", estimado: 10000, previsto: 4000, real: 1000, itens: [
    { item: "DJ", previsto: 1000, real: 1000 },
    { item: "Banda", previsto: 2500, real: 0 },
    { item: "Violinista", previsto: 500, real: 0 },
  ]},
  { cat: "Entretenimento", estimado: 5000, previsto: 3000, real: 1950, itens: [
    { item: "Espelho Mágico", previsto: 1000, real: 1950 },
    { item: "Robô de LED", previsto: 500, real: 0 },
    { item: "Tambor de LED", previsto: 1500, real: 0 },
  ]},
  { cat: "Memórias", estimado: 10000, previsto: 3000, real: 2500, itens: [
    { item: "Fotógrafo", previsto: 1000, real: 1500 },
    { item: "Cinegrafista", previsto: 1000, real: 1000 },
    { item: "Álbum", previsto: 400, real: 0 },
    { item: "Making Of", previsto: 250, real: 0 },
  ]},
  { cat: "Assessorias", estimado: 10000, previsto: 5150, real: 5500, itens: [
    { item: "Assessoria de Planejamento", previsto: 4500, real: 3500 },
    { item: "Assessoria do Dia", previsto: 150, real: 2000 },
    { item: "Celebrante", previsto: 250, real: 0 },
  ]},
  { cat: "Design e Criação", estimado: 2000, previsto: 900, real: 200, itens: [
    { item: "Identidade Visual", previsto: 200, real: 0 },
    { item: "Save the Date", previsto: 100, real: 50 },
    { item: "Convite Digital", previsto: 100, real: 100 },
    { item: "RSVP", previsto: 100, real: 50 },
  ]},
  { cat: "Trajes e Acessórios", estimado: 12200, previsto: 3665, real: 0, itens: [
    { item: "Vestido da Recepção", previsto: 800, real: 0 },
    { item: "Vestido da Valsa", previsto: 1500, real: 0 },
    { item: "Look da Balada", previsto: 550, real: 0 },
    { item: "Acessórios Kit Valsa", previsto: 100, real: 0 },
    { item: "Sandália", previsto: 100, real: 0 },
    { item: "Tênis personalizado", previsto: 150, real: 0 },
  ]},
  { cat: "Dia da Debutante", estimado: 3000, previsto: 1500, real: 0, itens: [
    { item: "Penteado", previsto: 300, real: 0 },
    { item: "Maquiagem", previsto: 350, real: 0 },
    { item: "Manicure", previsto: 100, real: 0 },
    { item: "Massagem/Spa", previsto: 350, real: 0 },
    { item: "Brunch", previsto: 400, real: 0 },
  ]},
  { cat: "Lembranças e Itens de Festa", estimado: 5000, previsto: 1780, real: 400, itens: [
    { item: "Velas Flor aromatizada", previsto: 1000, real: 0 },
    { item: "Óculos escuro balada", previsto: 100, real: 100 },
    { item: "Colar e tiara", previsto: 100, real: 100 },
    { item: "Bastão de Led", previsto: 100, real: 100 },
    { item: "Pulseiras neon", previsto: 50, real: 100 },
  ]},
  { cat: "Horas Adicionais", estimado: 10000, previsto: 5200, real: 3500, itens: [
    { item: "Buffet hora extra", previsto: 3500, real: 3500 },
    { item: "Bar hora extra", previsto: 300, real: 0 },
    { item: "Espelho Mágico hora extra", previsto: 200, real: 0 },
    { item: "Fotógrafo hora extra", previsto: 500, real: 0 },
  ]},
  { cat: "Margem para Imprevistos", estimado: 6000, previsto: 3000, real: 0, itens: [
    { item: "Reserva de segurança", previsto: 3000, real: 0 },
  ]},
];

const FORNECEDORES_INIT = [
  { id:1, cat:"Espaço e Buffet", nome:"Buffet Castelo", contato:"(11) 95552-3105", email:"comercial@buffetcastelo.com", valor:"R$ 38.800", status:"contratado", obs:"Pacote integrado: Espaço + Buffet + DJ + Iluminação + Telões + Foto/Filmagem + Celebrante + Assessoria" },
  { id:2, cat:"Foto e Filmagem", nome:"FRL Fotografias", contato:"(11) 96495-3220", email:"", valor:"R$ 1.500", status:"contratado", obs:"1 fotógrafo + 1 cinegrafista. Única equipe no evento." },
  { id:3, cat:"Assessoria do Dia", nome:"Anjos Assessoria", contato:"(11) 96495-3220", email:"", valor:"R$ 2.000", status:"contratado", obs:"2 profissionais — 4h antes + 5h durante o evento" },
  { id:4, cat:"Assessoria Planej.", nome:"RP Assessoria", contato:"", email:"", valor:"R$ 3.500", status:"contratado", obs:"Renata Paiva — Método Experiência 15 RP" },
  { id:5, cat:"Design Visual", nome:"LuCelebre Design", contato:"(16) 99275-6527", email:"", valor:"R$ 200", status:"contratado", obs:"Save the Date + Convite + RSVP + Agradecimento" },
  { id:6, cat:"Doces Finos", nome:"Ateliê Anastácia Rocha", contato:"(11) 93092-0777", email:"atendimento@anastaciarocha.com.br", valor:"R$ 1.550", status:"contratado", obs:"500 unidades — Caixinhas, Copinhos, Marquise, Emotion, Almofadinha" },
  { id:7, cat:"Gerador", nome:"Albonett Geradores", contato:"(11) 99691-7665", email:"vendas@albonett.com.br", valor:"R$ 1.050", status:"contratado", obs:"Gerador 100kVA — 18h às 00h" },
  { id:8, cat:"Decoração Temática", nome:"", contato:"", email:"", valor:"", status:"pendente", obs:"" },
  { id:9, cat:"Atração / Espelho", nome:"", contato:"", email:"", valor:"", status:"pendente", obs:"" },
  { id:10, cat:"Carrinho Gourmet", nome:"", contato:"", email:"", valor:"", status:"pendente", obs:"" },
  { id:11, cat:"Trajes / Vestido", nome:"", contato:"", email:"", valor:"", status:"pendente", obs:"" },
  { id:12, cat:"Dia da Debutante", nome:"", contato:"", email:"", valor:"", status:"pendente", obs:"" },
];

const CONVIDADOS_INIT = [
  "Odete","Cícero","Jaqueline","Beatriz","Arthur","Sérgio","Vania/Sophia","Camilly",
  "Tia Vilma","Nádia","Reinaldo","Dona Maria","Luciane","Gustavo","José Carlos",
  "Lucimara","Júlia","Caroline/Matheus","Sirlene","Cláudia","Jair","Nicolle",
  "Ana Paula","Maitê","Tia Maria","Sandro","Gislene","Tia Ivete","Tio Ailton",
  "Kellen","Pietro","Paula","Alisson","Amanda","Leticia","Agatha",
  "Nicolli Mari","Gabriela Spada","Júlia Adriane","Beatriz Magione","Mariana Nunes",
  "Nicolly Maciel","Débora Ragali","Sabrina Damaceno","Júlia Teixeira","Yasmin Fraga",
  "Luisa Russa","Larissa Brito","Pietra Correia","Caio Henrique","Gustavo Garcia",
  "João Vitor","Vinícius Pereira","Paulo Henrique","Ana Parente","Alice Santos",
  "Fran","Paulo Paiva","Ana Paula","Douglas","Laura","Tio Arnaldo","Thais","Thamires",
  "Fernando","Guilherme","Renata/Pedro","Tio Osmar","Gustavo","Eduardo","Elisa","Bruno",
  "André","Tio Gilberto","Giovane","Tia Ilda","Giulia","Iara","Rodrigo","Tia Ester",
  "Everton","Dona Helena","Leila","Marcos","Vanessa","Dona Ana","Talitha/Fernando",
  "Sarah","Juliana","Patricia/Gabriela","Andreia","Sophia","Lucas","Livia","Alice",
].map((nome, i) => ({ id: i+1, nome, mesa: "", confirmado: "pendente", criancas: "não", obs: "" }));

const CHECKLIST_FASES = [
  { id:1, label:"Fase de Imersão", cor:C.rosa, itens:[
    "Reunião inicial","Diagnóstico da família","Perfil da Debutante",
    "Definição dos objetivos","Definição do conceito e temática","Levantamento de prioridades","Reunião de Planejamento",
  ]},
  { id:2, label:"Planejamento Estratégico", cor:C.verde, itens:[
    "Cronograma Geral","Cronograma de Contratação","Cronograma Financeiro",
    "Plano de Ação","Plano B / Contingência","Checklist Geral","Organização Documental",
  ]},
  { id:3, label:"Gestão Financeira", cor:C.dourado, itens:[
    "Planejamento Financeiro","Orçamento detalhado","Controle de Contratos",
    "Controle e Pagamento","Reserva para imprevistos",
  ]},
  { id:4, label:"Curadoria de Fornecedores", cor:C.azul, itens:[
    "Pesquisa e comparativos","Negociação","Validação técnica",
    "Checklist de entregas","Revisão final",
  ]},
  { id:5, label:"Gestão de Convidados", cor:"#D4807A", itens:[
    "Lista definitiva","Envio Save the Date","Envio Convites",
    "Entrega Caixas Convite","Confirmações RSVP","Marcação de Mesas","Controle de Acesso",
  ]},
  { id:6, label:"Identidade e Design", cor:"#A0A0C9", itens:[
    "Paleta de Cores","Logotipo / Brasão","Save the Date","Convite Virtual",
    "Caixa Convite Damas","Papelaria geral","Marcadores de Mesa",
  ]},
];

const STATUS_COLORS = {
  pendente: { bg:"#FFF5E0", txt:"#B07800", label:"Pendente" },
  negociando: { bg:"#E8F0FF", txt:"#3A5BA0", label:"Negociando" },
  contratado: { bg:"#E8F7EE", txt:"#2A7A4A", label:"Contratado" },
  pago: { bg:"#F0E8FF", txt:"#6A3A9A", label:"Pago" },
};

const fmt = (v) => v ? `R$ ${Number(v).toLocaleString("pt-BR")}` : "—";
const pct = (a, b) => b ? Math.round((a/b)*100) : 0;

// ─── COMPONENTS ──────────────────────────────────────────────
const Pill = ({ label, color, bg, size=10 }) => (
  <span data-testid="pill" style={{ fontSize:size, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
    color, background:bg, padding:"3px 8px", borderRadius:4, fontFamily:"system-ui", whiteSpace:"nowrap" }}>
    {label}
  </span>
);

const Card = ({ children, style={} }) => (
  <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.line}`,
    boxShadow:"0 1px 8px rgba(0,0,0,0.04)", ...style }}>{children}</div>
);

const Input = ({ value, onChange, placeholder, style={}, testId }) => (
  <input data-testid={testId} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{ width:"100%", padding:"8px 10px", borderRadius:7, outline:"none", boxSizing:"border-box",
      border: value ? `1.5px solid ${C.rosa}` : `1.5px solid ${C.line}`,
      background: value ? "#FDF9FF" : "#FAFAF8", fontSize:13, fontFamily:"inherit",
      color:C.txt, transition:"border 0.2s", ...style }} />
);

// ─── MAIN ─────────────────────────────────────────────────────
export default function App({ familyOnly = false }) {
  const [view, setView] = useState(familyOnly ? "familia" : "pro");
  const [tab, setTab] = useState(0);
  const [checklist, setCheck] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ac_check")) || {}; } catch { return {}; }
  });
  const [fornecedores, setForn] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ac_forn")) || FORNECEDORES_INIT; } catch { return FORNECEDORES_INIT; }
  });
  const [convidados, setConv] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ac_conv")) || CONVIDADOS_INIT; } catch { return CONVIDADOS_INIT; }
  });
  const [expandFase, setExpF] = useState(1);
  const [expandForn, setExpForn] = useState(null);
  const [expandOrc, setExpOrc] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroConv, setFiltroConv] = useState("todos");
  const [novoFornCat, setNovoFornCat] = useState("");
  const [novoConvNome, setNovoConvNome] = useState("");

  useEffect(() => { localStorage.setItem("ac_check", JSON.stringify(checklist)); }, [checklist]);
  useEffect(() => { localStorage.setItem("ac_forn", JSON.stringify(fornecedores)); }, [fornecedores]);
  useEffect(() => { localStorage.setItem("ac_conv", JSON.stringify(convidados)); }, [convidados]);

  // Pull RSVP confirmations from backend and merge into local state
  useEffect(() => {
    const pull = () => {
      fetch(`${API}/rsvp/all`).then(r => r.ok ? r.json() : []).then(list => {
        if (!Array.isArray(list) || list.length === 0) return;
        setConv(prev => prev.map(c => {
          const found = list.find(r => r.guest_id === c.id);
          if (!found) return c;
          const remoteStatus = found.status === "confirmado" ? "confirmado" : "pendente";
          if (c.confirmado === remoteStatus && (c.rsvpMsg || "") === (found.message || "")) return c;
          return { ...c, confirmado: remoteStatus, rsvpMsg: found.message || "" };
        }));
      }).catch(() => {});
    };
    pull();
    const iv = setInterval(pull, 30000);
    return () => clearInterval(iv);
  }, []);

  const toggleCheck = (faseId, idx) => {
    const key = `${faseId}-${idx}`;
    setCheck(p => ({ ...p, [key]: !p[key] }));
  };
  const updateForn = (id, field, val) => setForn(p => p.map(f => f.id!==id ? f : {...f,[field]:val}));
  const updateConv = (id, field, val) => setConv(p => p.map(c => c.id!==id ? c : {...c,[field]:val}));

  const addFornecedor = () => {
    const cat = novoFornCat.trim();
    if (!cat) return;
    setForn(p => {
      const nextId = p.length > 0 ? Math.max(...p.map(x => x.id)) + 1 : 1;
      return [...p, { id: nextId, cat, nome:"", contato:"", email:"", valor:"", status:"pendente", obs:"" }];
    });
    setNovoFornCat("");
  };

  const removeFornecedor = (id) => {
    if (!window.confirm("Remover este fornecedor?")) return;
    setForn(p => p.filter(f => f.id !== id));
  };

  const addConvidado = () => {
    const nome = novoConvNome.trim();
    if (!nome) return;
    setConv(p => {
      const nextId = p.length > 0 ? Math.max(...p.map(x => x.id)) + 1 : 1;
      return [...p, { id: nextId, nome, mesa:"", confirmado:"pendente", criancas:"não", obs:"" }];
    });
    setNovoConvNome("");
  };

  const removeConvidado = (id) => {
    if (!window.confirm("Remover este convidado?")) return;
    setConv(p => p.filter(c => c.id !== id));
  };

  const totalDone = CHECKLIST_FASES.flatMap(f => f.itens.map((_,i) => `${f.id}-${i}`)).filter(k => checklist[k]).length;
  const totalItems = CHECKLIST_FASES.reduce((s,f) => s+f.itens.length, 0);
  const globalPct = pct(totalDone, totalItems);
  const convConf = convidados.filter(c => c.confirmado==="confirmado").length;
  const fornContr = fornecedores.filter(f => f.status==="contratado"||f.status==="pago").length;
  const totalReal = ORCAMENTO_CATS.reduce((s,c) => s + c.itens.reduce((a,i) => a + (i.real||0), 0), 0);
  const totalPrev = ORCAMENTO_CATS.reduce((s,c) => s + c.itens.reduce((a,i) => a + (i.previsto||0), 0), 0);

  const TABS_PRO = ["Checklist","Fornecedores","Convidados","Orçamento"];
  const TABS_FAM = ["Nossa Festa","Convidados","Fornecedores","Orçamento"];

  const convFiltrados = convidados.filter(c => {
    const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase());
    const matchFiltro = filtroConv==="todos" || c.confirmado===filtroConv;
    return matchBusca && matchFiltro;
  });

  const convFamBuscados = convidados.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()));
  const fornContratadosLista = fornecedores.filter(f => f.status==="contratado"||f.status==="pago");

  // ── Alertas proativos ──
  const dias = daysUntilParty();
  const overCats = ORCAMENTO_CATS.map(c => {
    const p = c.itens.reduce((s,i)=>s+(i.previsto||0),0);
    const r = c.itens.reduce((s,i)=>s+(i.real||0),0);
    return { cat: c.cat, previsto: p, real: r, diff: r - p };
  }).filter(x => x.diff > 0 && x.previsto > 0);
  const fornPend = fornecedores.filter(f => f.status === "pendente").length;

  const getChatContext = () => ({
    debutante: DEBUTANTE,
    days_until_party: dias,
    checklist_progress: { done: totalDone, total: totalItems, pct: globalPct },
    checklist_items: CHECKLIST_FASES.flatMap(f =>
      f.itens.map((label, idx) => ({
        faseId: f.id, idx, label,
        done: !!checklist[`${f.id}-${idx}`],
      }))
    ),
    fornecedores: fornecedores.map(f => ({
      cat: f.cat, nome: f.nome, valor: f.valor, status: f.status, obs: f.obs,
    })),
    convidados_stats: { confirmados: convConf, total: convidados.length },
    convidados_list: convidados.map(c => ({
      id: c.id, nome: c.nome, confirmado: c.confirmado, mesa: c.mesa || "",
    })),
    orcamento: ORCAMENTO_CATS.map(c => ({
      cat: c.cat,
      previsto: c.itens.reduce((s,i)=>s+(i.previsto||0),0),
      real: c.itens.reduce((s,i)=>s+(i.real||0),0),
    })),
  });

  // ── Ações vindas do chat ──
  const handleChatAction = (a) => {
    const { type, args } = a;
    if (type === "CHECK") {
      const [faseId, idx] = args.map(Number);
      const fase = CHECKLIST_FASES.find(f => f.id === faseId);
      if (!fase || !fase.itens[idx]) return null;
      toggleCheck(faseId, idx);
      return `Checklist: "${fase.itens[idx]}" alterado`;
    }
    if (type === "CONFIRM" || type === "UNCONFIRM") {
      const id = Number(args[0]);
      const conv = convidados.find(c => c.id === id);
      if (!conv) return null;
      updateConv(id, "confirmado", type === "CONFIRM" ? "confirmado" : "pendente");
      return `${conv.nome} ${type === "CONFIRM" ? "confirmado(a)" : "movido(a) para pendente"}`;
    }
    if (type === "MESA") {
      const id = Number(args[0]);
      const num = String(args[1] || "").replace(/\D/g, "");
      const conv = convidados.find(c => c.id === id);
      if (!conv || !num) return null;
      updateConv(id, "mesa", num);
      return `${conv.nome} → Mesa ${num}`;
    }
    return null;
  };

  const copyRsvpLink = (c) => {
    const base = window.location.origin;
    const url = `${base}/rsvp/${c.id}?n=${encodeURIComponent(c.nome)}`;
    navigator.clipboard.writeText(url).then(() => {
      alert(`Link copiado! 🌸\n\n${url}`);
    }).catch(() => {
      prompt("Copie o link do RSVP:", url);
    });
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Palatino Linotype',Georgia,serif", color:C.txt }}>

      {/* ── HEADER ── */}
      <div style={{ background:`linear-gradient(150deg,${C.escuro},${C.escuro2})`,
        padding:"22px 16px 0", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-50, right:-50, width:200, height:200, borderRadius:"50%",
          background:`radial-gradient(circle,${C.rosa}18,transparent 70%)` }} />
        <div style={{ maxWidth:680, margin:"0 auto", position:"relative" }}>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
            <div>
              <div style={{ fontSize:9, letterSpacing:5, color:C.rosa, textTransform:"uppercase", marginBottom:3 }}>Método RP</div>
              <h1 style={{ fontSize:30, fontWeight:400, color:"#fff", margin:0, fontStyle:"italic", lineHeight:1 }}>Experiências</h1>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:3 }}>
                15 anos {DEBUTANTE.nome} · {DEBUTANTE.data}
              </div>
            </div>
            {!familyOnly && (
              <div style={{ display:"flex", borderRadius:10, overflow:"hidden", border:"1px solid rgba(255,255,255,0.1)" }}>
                {[["pro","🔧"],["familia","🌸"]].map(([v,icon]) => (
                  <button key={v} data-testid={`view-${v}-btn`} onClick={() => { setView(v); setTab(0); }}
                    style={{ padding:"7px 12px", border:"none", cursor:"pointer", fontFamily:"inherit",
                      fontSize:11, textTransform:"uppercase", letterSpacing:1, transition:"all 0.2s",
                      background: view===v ? C.rosa : "transparent",
                      color: view===v ? "#fff" : "rgba(255,255,255,0.35)" }}>
                    {icon} {v==="pro" ? "Pro" : "Família"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* KPIs */}
          <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", scrollbarWidth:"none" }}>
            {[
              { l:"Planejamento", v:`${globalPct}%`, c:C.rosa },
              { l:"Fornecedores", v:`${fornContr}/${fornecedores.length}`, c:C.verde },
              { l:"Confirmados", v:`${convConf}/${convidados.length}`, c:C.dourado },
              { l:"Realizado", v:fmt(totalReal), c:C.azul },
            ].map((k) => (
              <div key={k.l} style={{ flexShrink:0, background:"rgba(255,255,255,0.06)",
                borderRadius:10, padding:"9px 12px", minWidth:80 }}>
                <div style={{ fontSize:16, fontWeight:300, color:k.c }}>{k.v}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:1, letterSpacing:0.5 }}>{k.l}</div>
              </div>
            ))}
          </div>

          <div style={{ height:3, background:"rgba(255,255,255,0.08)", borderRadius:2, marginBottom:16, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${globalPct}%`, borderRadius:2,
              background:`linear-gradient(90deg,${C.rosa},${C.verde})`, transition:"width 0.6s ease" }} />
          </div>

          <div style={{ display:"flex", overflowX:"auto", scrollbarWidth:"none" }}>
            {(view==="pro" ? TABS_PRO : TABS_FAM).map((t,i) => (
              <button key={t} data-testid={`tab-${i}-btn`} onClick={() => setTab(i)}
                style={{ flexShrink:0, padding:"9px 14px", border:"none", background:"transparent",
                  cursor:"pointer", fontFamily:"inherit", fontSize:11, letterSpacing:1,
                  textTransform:"uppercase", transition:"all 0.2s",
                  color: tab===i ? "#fff" : "rgba(255,255,255,0.3)",
                  borderBottom: tab===i ? `2px solid ${C.rosa}` : "2px solid transparent" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth:680, margin:"0 auto", padding:"18px 14px 64px" }}>

        {/* ── ALERTAS PROATIVOS ── */}
        {(overCats.length > 0 || dias < 180 || fornPend > 0) && (
          <div data-testid="alerts-panel" style={{ marginBottom:14, display:"flex", flexDirection:"column", gap:8 }}>
            {dias >= 0 && (
              <div style={{
                background: dias < 30 ? "#FDECEA" : dias < 90 ? "#FDF4DC" : "#EAF4F0",
                border: `1px solid ${dias < 30 ? "#F5C6CB" : dias < 90 ? "#EED9A1" : "#C8E0D3"}`,
                borderRadius:12, padding:"10px 14px",
                display:"flex", alignItems:"center", gap:10,
              }}>
                <span style={{ fontSize:20 }}>{dias < 30 ? "⏰" : dias < 90 ? "🌸" : "📅"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color: dias<30 ? "#8A2A25" : dias<90 ? "#8A6A20" : C.verdeD }}>
                    Faltam {dias} dias para a festa
                  </div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                    {dias < 30 ? "Reta final — priorize confirmações e pagamentos"
                      : dias < 90 ? "Fase intensa — feche fornecedores pendentes"
                      : "Boa margem — siga o cronograma tranquila 🌿"}
                  </div>
                </div>
              </div>
            )}
            {overCats.length > 0 && (
              <div style={{
                background:"#FDECEA", border:"1px solid #F5C6CB",
                borderRadius:12, padding:"10px 14px",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <span style={{ fontSize:20 }}>⚠️</span>
                  <div style={{ fontSize:13, fontWeight:600, color:"#8A2A25" }}>
                    {overCats.length} {overCats.length===1 ? "categoria" : "categorias"} acima do previsto
                  </div>
                </div>
                <div style={{ fontSize:11, color:C.muted, paddingLeft:30 }}>
                  {overCats.slice(0,3).map(x => `${x.cat} (+${fmt(x.diff)})`).join(" · ")}
                  {overCats.length > 3 && ` · +${overCats.length-3} outras`}
                </div>
              </div>
            )}
            {fornPend > 0 && view === "pro" && (
              <div style={{
                background:"#E8F0FF", border:"1px solid #C8D8F0",
                borderRadius:12, padding:"10px 14px",
                display:"flex", alignItems:"center", gap:10,
              }}>
                <span style={{ fontSize:20 }}>📋</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#3A5BA0" }}>
                    {fornPend} {fornPend===1?"fornecedor pendente":"fornecedores pendentes"}
                  </div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                    Pergunte à assistente 🌸 quais fechar primeiro
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ PRO VIEW ════ */}
        {view==="pro" && (
          <>
            {/* ── CHECKLIST ── */}
            {tab===0 && (
              <div data-testid="checklist-view">
                <h2 style={{ fontSize:19, fontWeight:400, fontStyle:"italic", margin:"0 0 4px" }}>Checklist do Planejamento</h2>
                <p style={{ fontSize:12, color:C.muted, margin:"0 0 16px" }}>{totalDone} de {totalItems} itens · {globalPct}% concluído</p>
                {CHECKLIST_FASES.map(fase => {
                  const done = fase.itens.filter((_,i) => checklist[`${fase.id}-${i}`]).length;
                  const p2 = pct(done, fase.itens.length);
                  const open = expandFase===fase.id;
                  return (
                    <div key={fase.id} style={{ marginBottom:8, borderRadius:13, overflow:"hidden",
                      background:C.card, border:`1px solid ${C.line}` }}>
                      <button data-testid={`fase-${fase.id}-toggle`} onClick={() => setExpF(open?null:fase.id)}
                        style={{ width:"100%", padding:"13px 16px", background:open?`${fase.cor}0E`:C.card,
                          border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:10, textAlign:"left" }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0,
                          background:p2===100?fase.cor:`${fase.cor}22`, border:`2px solid ${fase.cor}`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:12, fontWeight:700, color:p2===100?"#fff":fase.cor }}>
                          {p2===100?"✓":fase.id}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>{fase.label}</div>
                          <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{done}/{fase.itens.length} itens</div>
                        </div>
                        <div style={{ fontSize:18, fontWeight:300, color:fase.cor }}>{p2}%</div>
                      </button>
                      <div style={{ height:3, background:C.line }}>
                        <div style={{ height:"100%", width:`${p2}%`, background:fase.cor, transition:"width 0.4s" }} />
                      </div>
                      {open && fase.itens.map((item,i) => {
                        const key = `${fase.id}-${i}`;
                        const done2 = checklist[key];
                        return (
                          <button key={i} data-testid={`check-${fase.id}-${i}`} onClick={() => toggleCheck(fase.id,i)}
                            style={{ width:"100%", padding:"11px 16px", background:done2?`${fase.cor}0A`:"transparent",
                              border:"none", borderTop:`1px solid ${C.line}`, cursor:"pointer",
                              display:"flex", alignItems:"center", gap:10, textAlign:"left", transition:"background 0.15s" }}>
                            <div style={{ width:20, height:20, borderRadius:5, flexShrink:0, transition:"all 0.2s",
                              border:done2?`2px solid ${fase.cor}`:`2px solid #D8D0C8`,
                              background:done2?fase.cor:"transparent",
                              display:"flex", alignItems:"center", justifyContent:"center" }}>
                              {done2 && <span style={{ color:"#fff", fontSize:11 }}>✓</span>}
                            </div>
                            <span style={{ fontSize:13, color:done2?C.muted:C.txt,
                              textDecoration:done2?"line-through":"none", flex:1, lineHeight:1.4 }}>{item}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── FORNECEDORES ── */}
            {tab===1 && (
              <div data-testid="fornecedores-view">
                <h2 style={{ fontSize:19, fontWeight:400, fontStyle:"italic", margin:"0 0 4px" }}>Fornecedores</h2>
                <p style={{ fontSize:12, color:C.muted, margin:"0 0 12px" }}>{fornContr} contratados de {fornecedores.length}</p>

                {/* Adicionar fornecedor */}
                <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                  <input
                    data-testid="novo-forn-input"
                    value={novoFornCat}
                    onChange={e=>setNovoFornCat(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Enter") addFornecedor(); }}
                    placeholder="+ Nova categoria/fornecedor..."
                    style={{ flex:1, padding:"9px 12px", borderRadius:10, outline:"none",
                      border:`1.5px solid ${C.line}`, background:"#FDF9FF", fontSize:13,
                      fontFamily:"inherit", color:C.txt, boxSizing:"border-box" }} />
                  <button data-testid="add-forn-btn" onClick={addFornecedor}
                    disabled={!novoFornCat.trim()}
                    style={{ padding:"9px 16px", borderRadius:10, border:"none",
                      background: novoFornCat.trim() ? C.rosa : C.line,
                      color:"#fff", fontSize:13, cursor: novoFornCat.trim() ? "pointer" : "not-allowed",
                      fontFamily:"inherit", fontWeight:600, whiteSpace:"nowrap" }}>
                    Adicionar
                  </button>
                </div>

                {fornecedores.map(f => {
                  const sc = STATUS_COLORS[f.status];
                  const open = expandForn===f.id;
                  return (
                    <div key={f.id} style={{ marginBottom:8, borderRadius:12, overflow:"hidden",
                      background:C.card, border:`1px solid ${C.line}` }}>
                      <button data-testid={`forn-${f.id}-toggle`} onClick={() => setExpForn(open?null:f.id)}
                        style={{ width:"100%", padding:"12px 15px", background:"transparent", border:"none",
                          cursor:"pointer", display:"flex", alignItems:"center", gap:10, textAlign:"left" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>{f.cat}</div>
                          {f.nome && <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{f.nome}</div>}
                        </div>
                        {f.valor && <div style={{ fontSize:12, fontWeight:600, color:C.verde, marginRight:6 }}>{f.valor}</div>}
                        <Pill label={sc.label} color={sc.txt} bg={sc.bg} />
                      </button>
                      {open && (
                        <div style={{ padding:"0 15px 15px", borderTop:`1px solid ${C.line}` }}>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginTop:12 }}>
                            {[["Nome/Empresa","nome"],["Contato","contato"],["E-mail","email"],["Valor","valor"]].map(([l,k]) => (
                              <div key={k}>
                                <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>{l}</div>
                                <Input testId={`forn-${f.id}-${k}`} value={f[k]} onChange={v=>updateForn(f.id,k,v)} placeholder={l} />
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop:7 }}>
                            <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>Status</div>
                            <select data-testid={`forn-${f.id}-status`} value={f.status} onChange={e=>updateForn(f.id,"status",e.target.value)}
                              style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1.5px solid ${C.line}`,
                                fontSize:13, fontFamily:"inherit", background:"#FAFAF8", outline:"none" }}>
                              {Object.entries(STATUS_COLORS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          </div>
                          <div style={{ marginTop:7 }}>
                            <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>Observações</div>
                            <textarea data-testid={`forn-${f.id}-obs`} value={f.obs||""} onChange={e=>updateForn(f.id,"obs",e.target.value)}
                              rows={2} placeholder="notas, pendências..."
                              style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1.5px solid ${C.line}`,
                                fontSize:12, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box" }} />
                          </div>
                          <button data-testid={`forn-${f.id}-remove`} onClick={()=>removeFornecedor(f.id)}
                            style={{ marginTop:10, background:"transparent", border:"1px solid #F5C6CB",
                              color:"#8A2A25", padding:"6px 12px", borderRadius:8, cursor:"pointer",
                              fontSize:11, fontFamily:"system-ui", fontWeight:600 }}>
                            🗑 Remover fornecedor
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── CONVIDADOS ── */}
            {tab===2 && (
              <div data-testid="convidados-view">
                <h2 style={{ fontSize:19, fontWeight:400, fontStyle:"italic", margin:"0 0 4px" }}>Lista de Convidados</h2>
                <p style={{ fontSize:12, color:C.muted, margin:"0 0 12px" }}>
                  {convConf} confirmados · {convidados.length} cadastrados
                </p>

                {/* Adicionar convidado */}
                <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                  <input
                    data-testid="novo-conv-input"
                    value={novoConvNome}
                    onChange={e=>setNovoConvNome(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Enter") addConvidado(); }}
                    placeholder="+ Nome do novo convidado..."
                    style={{ flex:1, padding:"9px 12px", borderRadius:10, outline:"none",
                      border:`1.5px solid ${C.line}`, background:"#FDF9FF", fontSize:13,
                      fontFamily:"inherit", color:C.txt, boxSizing:"border-box" }} />
                  <button data-testid="add-conv-btn" onClick={addConvidado}
                    disabled={!novoConvNome.trim()}
                    style={{ padding:"9px 16px", borderRadius:10, border:"none",
                      background: novoConvNome.trim() ? C.rosa : C.line,
                      color:"#fff", fontSize:13, cursor: novoConvNome.trim() ? "pointer" : "not-allowed",
                      fontFamily:"inherit", fontWeight:600, whiteSpace:"nowrap" }}>
                    Adicionar
                  </button>
                </div>

                <Input testId="busca-convidado" value={busca} onChange={setBusca} placeholder="🔍 Buscar convidado..." style={{ marginBottom:10 }} />
                <div style={{ display:"flex", gap:6, marginBottom:12, overflowX:"auto", scrollbarWidth:"none" }}>
                  {[["todos","Todos"],["confirmado","✓ Confirmados"],["pendente","⏳ Pendentes"]].map(([v,l]) => (
                    <button key={v} data-testid={`filtro-${v}`} onClick={() => setFiltroConv(v)}
                      style={{ flexShrink:0, padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer",
                        fontFamily:"system-ui", fontSize:11, fontWeight:700, letterSpacing:0.5,
                        background:filtroConv===v?C.verde:"#fff", color:filtroConv===v?"#fff":C.muted,
                        boxShadow:filtroConv===v?"none":"0 1px 4px rgba(0,0,0,0.08)" }}>
                      {l}
                    </button>
                  ))}
                </div>
                <Card style={{ overflow:"hidden" }}>
                  {convFiltrados.map((c,i) => (
                    <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                      borderTop:i>0?`1px solid ${C.line}`:"none",
                      background:c.confirmado==="confirmado"?"#F0FFF6":C.card }}>
                      <button data-testid={`conv-${c.id}-check`} onClick={() => updateConv(c.id,"confirmado",c.confirmado==="confirmado"?"pendente":"confirmado")}
                        style={{ width:20, height:20, borderRadius:5, flexShrink:0, cursor:"pointer",
                          border:c.confirmado==="confirmado"?`2px solid ${C.verde}`:`2px solid #D8D0C8`,
                          background:c.confirmado==="confirmado"?C.verde:"transparent",
                          display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
                        {c.confirmado==="confirmado" && <span style={{ color:"#fff", fontSize:10 }}>✓</span>}
                      </button>
                      <span style={{ flex:1, fontSize:13 }}>{c.nome}</span>
                      {c.mesa && (
                        <Pill label={`Mesa ${c.mesa}`} color={C.azul} bg={`${C.azul}18`} />
                      )}
                      <button
                        data-testid={`conv-${c.id}-rsvp-link`}
                        onClick={() => copyRsvpLink(c)}
                        title="Copiar link RSVP"
                        style={{
                          fontSize:11, border:`1px solid ${C.line}`, borderRadius:5,
                          padding:"3px 7px", cursor:"pointer",
                          background:"#FDF9FF", color:C.rosaD, fontFamily:"system-ui",
                          fontWeight:600, letterSpacing:0.3,
                        }}>
                        🔗
                      </button>
                      <button
                        data-testid={`conv-${c.id}-remove`}
                        onClick={() => removeConvidado(c.id)}
                        title="Remover convidado"
                        style={{
                          fontSize:11, border:`1px solid #F5C6CB`, borderRadius:5,
                          padding:"3px 7px", cursor:"pointer",
                          background:"transparent", color:"#8A2A25", fontFamily:"system-ui",
                          fontWeight:600,
                        }}>
                        🗑
                      </button>
                      <select data-testid={`conv-${c.id}-mesa`} value={c.mesa||""} onChange={e=>updateConv(c.id,"mesa",e.target.value)}
                        style={{ fontSize:11, border:`1px solid ${C.line}`, borderRadius:5, padding:"3px 6px",
                          fontFamily:"inherit", background:"#FAFAF8", color:C.muted, outline:"none", width:80 }}>
                        <option value="">Mesa —</option>
                        {Array.from({length:17},(_,i)=>i+1).map(n => (
                          <option key={n} value={n}>{`Mesa ${n}`}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {/* ── ORÇAMENTO ── */}
            {tab===3 && (
              <div data-testid="orcamento-view">
                <h2 style={{ fontSize:19, fontWeight:400, fontStyle:"italic", margin:"0 0 4px" }}>Orçamento Detalhado</h2>
                <p style={{ fontSize:12, color:C.muted, margin:"0 0 12px" }}>Estimado · Previsto · Realizado</p>

                {/* Totais */}
                <div style={{ background:C.escuro, borderRadius:14, padding:16, marginBottom:14 }}>
                  <div style={{ fontSize:9, letterSpacing:4, color:C.dourado, textTransform:"uppercase", marginBottom:10 }}>Visão geral</div>
                  {[
                    { l:"Orçamento familiar", v:65000, c:"rgba(255,255,255,0.4)" },
                    { l:"Total previsto", v:totalPrev, c:C.dourado },
                    { l:"Total realizado", v:totalReal, c:C.verde },
                  ].map((r) => (
                    <div key={r.l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{r.l}</span>
                      <span style={{ fontSize:16, fontWeight:300, color:r.c }}>{fmt(r.v)}</span>
                    </div>
                  ))}
                  <div style={{ height:3, background:"rgba(255,255,255,0.08)", borderRadius:2, marginTop:10, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct(totalReal,65000)}%`,
                      background:`linear-gradient(90deg,${C.verde},${C.dourado})`, borderRadius:2 }} />
                  </div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:5, textAlign:"right" }}>
                    {pct(totalReal,65000)}% do orçamento familiar utilizado
                  </div>
                </div>

                {ORCAMENTO_CATS.map((cat,ci) => {
                  const open = expandOrc===ci;
                  const realCat = cat.itens.reduce((s,i) => s+(i.real||0), 0);
                  const prevCat = cat.itens.reduce((s,i) => s+(i.previsto||0), 0);
                  const over = realCat > prevCat;
                  return (
                    <div key={ci} style={{ marginBottom:7, borderRadius:12, overflow:"hidden",
                      background:C.card, border:`1px solid ${C.line}` }}>
                      <button data-testid={`orc-${ci}-toggle`} onClick={() => setExpOrc(open?null:ci)}
                        style={{ width:"100%", padding:"12px 15px", background:"transparent", border:"none",
                          cursor:"pointer", display:"flex", alignItems:"center", gap:10, textAlign:"left" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>{cat.cat}</div>
                          <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                            Prev: {fmt(prevCat)} · Real: {fmt(realCat)||"—"}
                          </div>
                        </div>
                        {over && <Pill label="Acima" color="#C0392B" bg="#FDECEA" />}
                        <div style={{ fontSize:13, fontWeight:600, color:realCat>0?C.verde:C.muted }}>
                          {fmt(realCat) || "—"}
                        </div>
                      </button>
                      {open && (
                        <div style={{ borderTop:`1px solid ${C.line}` }}>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
                            padding:"8px 15px", background:C.bg }}>
                            {["Item","Previsto","Realizado"].map(h => (
                              <div key={h} style={{ fontSize:10, color:C.muted, fontWeight:700,
                                letterSpacing:1, textTransform:"uppercase", fontFamily:"system-ui" }}>{h}</div>
                            ))}
                          </div>
                          {cat.itens.map((item,ii) => (
                            <div key={ii} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
                              padding:"9px 15px", borderTop:`1px solid ${C.line}`,
                              background:item.real>item.previsto&&item.previsto>0?"#FFF8F0":C.card }}>
                              <span style={{ fontSize:12, color:C.txt }}>{item.item}</span>
                              <span style={{ fontSize:12, color:C.muted }}>{fmt(item.previsto)}</span>
                              <span style={{ fontSize:12, fontWeight:600,
                                color:item.real>0?C.verde:C.muted }}>{fmt(item.real)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ════ FAMÍLIA VIEW ════ */}
        {view==="familia" && (
          <>
            {/* ── NOSSA FESTA ── */}
            {tab===0 && (
              <div data-testid="nossa-festa-view">
                <div style={{ background:C.escuro, borderRadius:18, padding:22, marginBottom:14, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:-30, right:-30, width:130, height:130, borderRadius:"50%",
                    background:`radial-gradient(circle,${C.rosa}22,transparent 70%)` }} />
                  <div style={{ fontSize:9, letterSpacing:4, color:C.rosa, textTransform:"uppercase", marginBottom:8 }}>
                    A festa de
                  </div>
                  <div style={{ fontSize:32, fontStyle:"italic", color:"#fff", marginBottom:4 }}>
                    {DEBUTANTE.nome} 🌸
                  </div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:14 }}>
                    15 anos · {DEBUTANTE.cor}
                  </div>
                  {[
                    { l:"📅 Data", v:DEBUTANTE.data },
                    { l:"📍 Local", v:DEBUTANTE.local },
                    { l:"👥 Convidados", v:DEBUTANTE.convidados },
                  ].map((r,i) => (
                    <div key={r.l} style={{ display:"flex", justifyContent:"space-between",
                      padding:"7px 0", borderTop:i>0?`1px solid rgba(255,255,255,0.06)`:"none" }}>
                      <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{r.l}</span>
                      <span style={{ fontSize:12, color:"rgba(255,255,255,0.8)" }}>{r.v}</span>
                    </div>
                  ))}
                </div>

                {/* Progresso */}
                <Card style={{ padding:16, marginBottom:12 }}>
                  <div style={{ fontSize:10, letterSpacing:2, color:C.muted, textTransform:"uppercase",
                    fontFamily:"system-ui", marginBottom:12 }}>Como está o planejamento</div>
                  {CHECKLIST_FASES.map(f => {
                    const done = f.itens.filter((_,i) => checklist[`${f.id}-${i}`]).length;
                    const p2 = pct(done, f.itens.length);
                    return (
                      <div key={f.id} style={{ marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                          <span style={{ fontSize:12, color:C.txt }}>{f.label}</span>
                          <span style={{ fontSize:12, fontWeight:600, color:p2===100?C.verde:f.cor }}>{p2}%</span>
                        </div>
                        <div style={{ height:5, background:C.line, borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${p2}%`, background:f.cor, borderRadius:3, transition:"width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })}
                </Card>

                {/* Plano de tranquilidade */}
                <div style={{ background:C.escuro, borderRadius:14, padding:16 }}>
                  <div style={{ fontSize:10, letterSpacing:2, color:C.azul, textTransform:"uppercase",
                    fontFamily:"system-ui", marginBottom:10 }}>Plano de tranquilidade</div>
                  {[
                    { s:"Atraso ou problema com fornecedor", r:"Assessoria resolve", i:"🔧" },
                    { s:"Falha técnica no dia", r:"Assessoria resolve", i:"⚡" },
                    { s:"Ajuste de roteiro", r:"Assessoria resolve", i:"📋" },
                    { s:"Momentos emocionais", r:"Família aproveita", i:"💛" },
                  ].map((item,i) => (
                    <div key={item.s} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0",
                      borderTop:i>0?"1px solid rgba(255,255,255,0.06)":"none" }}>
                      <span style={{ fontSize:18 }}>{item.i}</span>
                      <span style={{ flex:1, fontSize:12, color:"rgba(255,255,255,0.6)" }}>{item.s}</span>
                      <Pill label={item.r} color={item.r.includes("Família")?C.rosa:C.verde}
                        bg={item.r.includes("Família")?`${C.rosa}22`:`${C.verde}22`} />
                    </div>
                  ))}
                  <div style={{ marginTop:14, padding:12, background:"rgba(255,255,255,0.04)", borderRadius:10, textAlign:"center" }}>
                    <p style={{ margin:0, fontSize:13, fontStyle:"italic", color:"rgba(255,255,255,0.5)", lineHeight:1.7 }}>
                      &ldquo;A partir daqui, vocês podem curtir.<br/>
                      <span style={{ color:C.rosa }}>Nós cuidamos do resto. 🌿</span>&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── CONVIDADOS (família) ── */}
            {tab===1 && (
              <div data-testid="fam-convidados-view">
                <h2 style={{ fontSize:19, fontWeight:400, fontStyle:"italic", margin:"0 0 4px" }}>Lista de Convidados</h2>
                <p style={{ fontSize:12, color:C.muted, margin:"0 0 12px" }}>
                  {convConf} confirmados de {convidados.length}
                </p>
                <Input testId="fam-busca" value={busca} onChange={setBusca} placeholder="🔍 Buscar..." style={{ marginBottom:10 }} />
                <Card style={{ overflow:"hidden" }}>
                  {convFamBuscados.map((c,i) => (
                    <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                      borderTop:i>0?`1px solid ${C.line}`:"none",
                      background:c.confirmado==="confirmado"?"#F0FFF6":C.card }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0,
                        background:c.confirmado==="confirmado"?C.verde:"#D8D0C8" }} />
                      <span style={{ flex:1, fontSize:13 }}>{c.nome}</span>
                      {c.mesa && <Pill label={`Mesa ${c.mesa}`} color={C.azul} bg={`${C.azul}18`} />}
                      <Pill label={c.confirmado==="confirmado"?"Confirmado":"Pendente"}
                        color={c.confirmado==="confirmado"?"#2A7A4A":"#B07800"}
                        bg={c.confirmado==="confirmado"?"#E8F7EE":"#FFF5E0"} />
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {/* ── FORNECEDORES (família) ── */}
            {tab===2 && (
              <div data-testid="fam-fornecedores-view">
                <h2 style={{ fontSize:19, fontWeight:400, fontStyle:"italic", margin:"0 0 4px" }}>Equipe do Evento</h2>
                <p style={{ fontSize:12, color:C.muted, margin:"0 0 12px" }}>{fornContr} serviços contratados</p>
                {fornecedores.filter(f => f.status==="contratado"||f.status==="pago").map((f) => (
                  <Card key={f.id} style={{ padding:"14px 16px", marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <div style={{ fontSize:11, color:C.rosa, letterSpacing:1,
                          textTransform:"uppercase", fontFamily:"system-ui", fontWeight:700, marginBottom:3 }}>{f.cat}</div>
                        <div style={{ fontSize:14, fontWeight:600 }}>{f.nome||"—"}</div>
                        {f.contato && <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>📞 {f.contato}</div>}
                      </div>
                      <Pill label="Contratado" color="#2A7A4A" bg="#E8F7EE" />
                    </div>
                    {f.obs && (
                      <div style={{ fontSize:12, color:C.muted, marginTop:8, lineHeight:1.5,
                        padding:"8px 10px", background:C.bg, borderRadius:7 }}>{f.obs}</div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* ── ORÇAMENTO (família) ── */}
            {tab===3 && (
              <div data-testid="fam-orcamento-view">
                <h2 style={{ fontSize:19, fontWeight:400, fontStyle:"italic", margin:"0 0 4px" }}>Investimento da Festa</h2>
                <p style={{ fontSize:12, color:C.muted, margin:"0 0 12px" }}>Visão geral do orçamento</p>
                <div style={{ background:C.escuro, borderRadius:14, padding:18, marginBottom:14 }}>
                  <div style={{ fontSize:9, letterSpacing:4, color:C.dourado, textTransform:"uppercase", marginBottom:12 }}>
                    Resumo financeiro
                  </div>
                  {[
                    { l:"Orçamento familiar", v:65000, c:"rgba(255,255,255,0.4)" },
                    { l:"Total previsto", v:totalPrev, c:C.dourado },
                    { l:"Total realizado até agora", v:totalReal, c:C.verde },
                  ].map((r,i) => (
                    <div key={r.l} style={{ display:"flex", justifyContent:"space-between",
                      padding:"9px 0", borderTop:i>0?"1px solid rgba(255,255,255,0.06)":"none" }}>
                      <span style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>{r.l}</span>
                      <span style={{ fontSize:18, fontWeight:300, color:r.c }}>{fmt(r.v)}</span>
                    </div>
                  ))}
                  <div style={{ height:4, background:"rgba(255,255,255,0.08)", borderRadius:2, marginTop:14, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct(totalReal,65000)}%`,
                      background:`linear-gradient(90deg,${C.verde},${C.dourado})`, borderRadius:2 }} />
                  </div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:5, textAlign:"right" }}>
                    {pct(totalReal,65000)}% do orçamento utilizado
                  </div>
                </div>
                {ORCAMENTO_CATS.map((cat,ci) => {
                  const realCat = cat.itens.reduce((s,i) => s+(i.real||0), 0);
                  if (!realCat) return null;
                  return (
                    <div key={ci} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"11px 14px", background:C.card, borderRadius:10, marginBottom:6,
                      border:`1px solid ${C.line}` }}>
                      <span style={{ fontSize:13 }}>{cat.cat}</span>
                      <span style={{ fontSize:14, fontWeight:600, color:C.verde }}>{fmt(realCat)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <ChatWidget getContext={getChatContext} onAction={handleChatAction} />
    </div>
  );
}
