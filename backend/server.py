from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ── Models ──────────────────────────────────────────
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


class ChatRequest(BaseModel):
    session_id: str
    message: str
    context: Optional[Dict[str, Any]] = None


class RsvpConfirm(BaseModel):
    guest_id: int
    nome: str
    status: str  # "confirmado" | "recusado"
    message: Optional[str] = ""


# ── System prompt builder ──────────────────────────────────────────
def build_system_message(context: Optional[Dict[str, Any]]) -> str:
    base = (
        "Você é a Assistente da Festa de 15 Anos da Ana Clara — tema Jardim Encantado, "
        "Setembro de 2026, Buffet Castelo, 120 convidados, orçamento familiar de R$ 65.000. "
        "Responda SEMPRE em português brasileiro, de forma acolhedora, prática e curta "
        "(máx. 6 linhas quando possível).\n\n"
        "IMPORTANTE — AÇÕES DIRETAS NO APP:\n"
        "Quando o usuário pedir para você EXECUTAR algo (\"marca aí\", \"confirma a Ana Paula\", "
        "\"coloca a Júlia na mesa 5\", \"desconfirma\", \"marque o item X\"), termine sua resposta "
        "com tokens de ação neste formato exato, um por linha, ao final:\n"
        "  [[CHECK:<faseId>:<idx>]]       — marca/desmarca um item do checklist\n"
        "  [[CONFIRM:<convId>]]           — confirma presença de um convidado\n"
        "  [[UNCONFIRM:<convId>]]         — remove confirmação\n"
        "  [[MESA:<convId>:<num>]]        — atribui mesa (1 a 17)\n\n"
        "Regras: Use APENAS IDs presentes no contexto abaixo. Nunca invente. Se o convidado "
        "não estiver na lista, avise que não encontrou. Confirme em texto natural ANTES do token "
        "(ex: \"Pronto, marquei ✓\"). Só use tokens quando o usuário PEDIR uma ação — não use "
        "tokens em respostas puramente informativas."
    )
    if not context:
        return base

    try:
        parts = [base, "\n\n=== CONTEXTO ATUAL DO APP ==="]

        checklist = context.get("checklist_progress")
        if checklist:
            parts.append(f"Checklist: {checklist.get('done', 0)}/{checklist.get('total', 0)} itens concluídos ({checklist.get('pct', 0)}%).")

        days = context.get("days_until_party")
        if days is not None:
            parts.append(f"Faltam {days} dias para a festa (data-alvo: 15 de Setembro de 2026).")

        # Checklist items with IDs
        items = context.get("checklist_items") or []
        if items:
            parts.append("\nItens do checklist (formato faseId:idx — label [status]):")
            for it in items:
                mark = "✓" if it.get("done") else "○"
                parts.append(f"  {it.get('faseId')}:{it.get('idx')} — {it.get('label')} [{mark}]")

        fornecedores = context.get("fornecedores") or []
        contratados = [f for f in fornecedores if f.get("status") in ("contratado", "pago")]
        pendentes = [f for f in fornecedores if f.get("status") == "pendente"]
        if fornecedores:
            parts.append(f"\nFornecedores contratados ({len(contratados)}):")
            for f in contratados[:15]:
                nome = f.get("nome") or "—"
                valor = f.get("valor") or "—"
                parts.append(f"  • {f.get('cat')}: {nome} — {valor}")
            if pendentes:
                nomes_pend = ", ".join([f.get("cat", "?") for f in pendentes[:10]])
                parts.append(f"Fornecedores pendentes: {nomes_pend}")

        # Convidados list with IDs
        conv_list = context.get("convidados_list") or []
        if conv_list:
            parts.append(f"\nConvidados (id · nome · status · mesa) — total {len(conv_list)}:")
            for c in conv_list:
                mesa = c.get("mesa") or "—"
                parts.append(f"  {c.get('id')} · {c.get('nome')} · {c.get('confirmado')} · Mesa {mesa}")

        orc = context.get("orcamento") or []
        if orc:
            parts.append("\nOrçamento por categoria (previsto → realizado):")
            for c in orc[:20]:
                over = " ⚠️ ACIMA" if c.get("real", 0) > c.get("previsto", 0) and c.get("previsto", 0) > 0 else ""
                parts.append(f"  • {c.get('cat')}: R$ {c.get('previsto', 0):,} → R$ {c.get('real', 0):,}{over}".replace(",", "."))
            total_prev = sum(c.get("previsto", 0) for c in orc)
            total_real = sum(c.get("real", 0) for c in orc)
            parts.append(f"TOTAL previsto: R$ {total_prev:,} · realizado: R$ {total_real:,} · familiar: R$ 65.000".replace(",", "."))

        return "\n".join(parts)
    except Exception:
        return base


# ── Routes ──────────────────────────────────────────
@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post("/chat")
async def chat_stream(req: ChatRequest):
    api_key = EMERGENT_LLM_KEY
    if not api_key:
        async def err():
            yield "data: [ERROR] EMERGENT_LLM_KEY não configurada\n\n"
        return StreamingResponse(err(), media_type="text/event-stream")

    system_msg = build_system_message(req.context)

    chat = LlmChat(
        api_key=api_key,
        session_id=req.session_id,
        system_message=system_msg,
    ).with_model("gemini", "gemini-3-flash-preview")

    await db.chat_messages.insert_one({
        "session_id": req.session_id,
        "role": "user",
        "text": req.message,
        "ts": datetime.now(timezone.utc).isoformat(),
    })

    async def event_generator():
        full = []
        try:
            async for event in chat.stream_message(UserMessage(text=req.message)):
                if isinstance(event, TextDelta):
                    full.append(event.content)
                    payload = event.content.replace("\r", "").replace("\n", "\\n")
                    yield f"data: {payload}\n\n"
                elif isinstance(event, StreamDone):
                    break
            await db.chat_messages.insert_one({
                "session_id": req.session_id,
                "role": "assistant",
                "text": "".join(full),
                "ts": datetime.now(timezone.utc).isoformat(),
            })
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.exception("chat stream error")
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api_router.get("/chat/history/{session_id}")
async def chat_history(session_id: str):
    docs = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("ts", 1).to_list(500)
    return docs


# ── RSVP endpoints ──────────────────────────────────────────
@api_router.post("/rsvp/confirm")
async def rsvp_confirm(rsvp: RsvpConfirm):
    if rsvp.status not in ("confirmado", "recusado"):
        raise HTTPException(400, "status inválido")
    doc = {
        "guest_id": rsvp.guest_id,
        "nome": rsvp.nome,
        "status": rsvp.status,
        "message": rsvp.message or "",
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    await db.rsvp_confirmations.update_one(
        {"guest_id": rsvp.guest_id},
        {"$set": doc},
        upsert=True,
    )
    return {"ok": True, **doc}


@api_router.get("/rsvp/all")
async def rsvp_all():
    docs = await db.rsvp_confirmations.find({}, {"_id": 0}).to_list(1000)
    return docs


@api_router.get("/rsvp/{guest_id}")
async def rsvp_get(guest_id: int):
    doc = await db.rsvp_confirmations.find_one({"guest_id": guest_id}, {"_id": 0})
    return doc or {}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
