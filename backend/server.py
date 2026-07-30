from fastapi import FastAPI, APIRouter
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

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
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


def build_system_message(context: Optional[Dict[str, Any]]) -> str:
    base = (
        "Você é a Assistente da Festa de 15 Anos da Ana Clara — tema Jardim Encantado, "
        "Setembro de 2026, Buffet Castelo, 120 convidados, orçamento familiar de R$ 65.000. "
        "Responda SEMPRE em português brasileiro, de forma acolhedora, prática e curta "
        "(máx. 6 linhas quando possível). Use o contexto real do app abaixo para dar "
        "respostas específicas sobre checklist, fornecedores, convidados e orçamento. "
        "Se o usuário perguntar algo fora do contexto da festa, ajude mesmo assim, "
        "mas sempre mantendo o tom de assessora de 15 anos."
    )
    if not context:
        return base

    try:
        parts = [base, "\n\n=== CONTEXTO ATUAL DO APP ==="]

        checklist = context.get("checklist_progress")
        if checklist:
            parts.append(f"Checklist: {checklist.get('done', 0)}/{checklist.get('total', 0)} itens concluídos ({checklist.get('pct', 0)}%).")

        fornecedores = context.get("fornecedores") or []
        contratados = [f for f in fornecedores if f.get("status") in ("contratado", "pago")]
        pendentes = [f for f in fornecedores if f.get("status") == "pendente"]
        if fornecedores:
            parts.append(f"Fornecedores contratados ({len(contratados)}):")
            for f in contratados[:15]:
                nome = f.get("nome") or "—"
                valor = f.get("valor") or "—"
                parts.append(f"  • {f.get('cat')}: {nome} — {valor}")
            if pendentes:
                nomes_pend = ", ".join([f.get("cat", "?") for f in pendentes[:10]])
                parts.append(f"Fornecedores pendentes: {nomes_pend}")

        conv = context.get("convidados_stats")
        if conv:
            parts.append(f"Convidados: {conv.get('confirmados', 0)} confirmados de {conv.get('total', 0)}.")

        orc = context.get("orcamento") or []
        if orc:
            parts.append("Orçamento por categoria (previsto → realizado):")
            for c in orc[:20]:
                parts.append(f"  • {c.get('cat')}: R$ {c.get('previsto', 0):,} → R$ {c.get('real', 0):,}".replace(",", "."))
            total_prev = sum(c.get("previsto", 0) for c in orc)
            total_real = sum(c.get("real", 0) for c in orc)
            parts.append(f"TOTAL previsto: R$ {total_prev:,} · realizado: R$ {total_real:,} · familiar: R$ 65.000".replace(",", "."))

        return "\n".join(parts)
    except Exception:
        return base


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

    # Load prior messages for this session (for history persistence via LlmChat)
    system_msg = build_system_message(req.context)

    chat = LlmChat(
        api_key=api_key,
        session_id=req.session_id,
        system_message=system_msg,
    ).with_model("gemini", "gemini-3-flash-preview")

    # Store user message in Mongo
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
                    # SSE data line — replace newlines to keep framing valid
                    payload = event.content.replace("\r", "").replace("\n", "\\n")
                    yield f"data: {payload}\n\n"
                elif isinstance(event, StreamDone):
                    break
            # Persist assistant response
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


# Include the router in the main app
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
