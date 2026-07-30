"""Backend tests for Método Experiência 15 RP app."""
import os
import uuid
import json
import time
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://gerenciador-festa.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


# ── Basic health ──
def test_root():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    assert r.json().get("message") == "Hello World"


# ── RSVP endpoints ──
class TestRsvp:
    guest_id = 9901  # test-only guest id

    def test_confirm_upsert(self):
        payload = {"guest_id": self.guest_id, "nome": "TEST_Ana", "status": "confirmado", "message": "vai sim"}
        r = requests.post(f"{API}/rsvp/confirm", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is True
        assert data.get("guest_id") == self.guest_id
        assert data.get("status") == "confirmado"

    def test_get_by_id(self):
        r = requests.get(f"{API}/rsvp/{self.guest_id}", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("guest_id") == self.guest_id
        assert d.get("nome") == "TEST_Ana"

    def test_all_contains(self):
        r = requests.get(f"{API}/rsvp/all", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        ids = [d.get("guest_id") for d in data]
        assert self.guest_id in ids
        # ensure _id excluded
        for d in data:
            assert "_id" not in d

    def test_confirm_update_status(self):
        payload = {"guest_id": self.guest_id, "nome": "TEST_Ana", "status": "recusado", "message": ""}
        r = requests.post(f"{API}/rsvp/confirm", json=payload, timeout=15)
        assert r.status_code == 200
        # verify persistence
        r2 = requests.get(f"{API}/rsvp/{self.guest_id}", timeout=15)
        assert r2.json().get("status") == "recusado"

    def test_confirm_invalid_status(self):
        r = requests.post(f"{API}/rsvp/confirm",
                          json={"guest_id": 9999, "nome": "x", "status": "bogus"}, timeout=15)
        assert r.status_code == 400

    def test_get_unknown_returns_empty(self):
        r = requests.get(f"{API}/rsvp/999999", timeout=15)
        assert r.status_code == 200
        assert r.json() == {}


# ── Chat SSE streaming ──
class TestChat:
    def test_chat_stream_basic(self):
        session_id = f"test-{uuid.uuid4()}"
        payload = {
            "session_id": session_id,
            "message": "Diga apenas 'ola' em uma palavra.",
            "context": {"days_until_party": 100}
        }
        with requests.post(f"{API}/chat", json=payload, stream=True, timeout=60) as r:
            assert r.status_code == 200
            chunks = []
            done = False
            start = time.time()
            for line in r.iter_lines(decode_unicode=True):
                if line and line.startswith("data: "):
                    payload_line = line[6:]
                    if payload_line == "[DONE]":
                        done = True
                        break
                    if payload_line.startswith("[ERROR]"):
                        pytest.fail(f"stream error: {payload_line}")
                    chunks.append(payload_line)
                if time.time() - start > 55:
                    break
            assert done, "stream never finished with [DONE]"
            assert len(chunks) > 0, "no text chunks received"

    def test_chat_history_persisted(self):
        session_id = f"test-{uuid.uuid4()}"
        payload = {"session_id": session_id, "message": "diga oi", "context": None}
        with requests.post(f"{API}/chat", json=payload, stream=True, timeout=60) as r:
            for line in r.iter_lines(decode_unicode=True):
                if line and line.strip() == "data: [DONE]":
                    break
        # Give small buffer for insert
        time.sleep(0.5)
        h = requests.get(f"{API}/chat/history/{session_id}", timeout=15)
        assert h.status_code == 200
        docs = h.json()
        roles = [d.get("role") for d in docs]
        assert "user" in roles
        assert "assistant" in roles
        for d in docs:
            assert "_id" not in d

    def test_chat_action_tokens(self):
        """Verify Gemini emits [[CONFIRM:id]] token when asked to perform action."""
        session_id = f"test-{uuid.uuid4()}"
        context = {
            "convidados_list": [
                {"id": 4, "nome": "Beatriz", "confirmado": "pendente", "mesa": None},
                {"id": 5, "nome": "Carlos", "confirmado": "pendente", "mesa": None},
            ],
            "days_until_party": 100,
        }
        payload = {
            "session_id": session_id,
            "message": "Confirme a Beatriz (id 4). Curto.",
            "context": context,
        }
        text = []
        with requests.post(f"{API}/chat", json=payload, stream=True, timeout=90) as r:
            assert r.status_code == 200
            for line in r.iter_lines(decode_unicode=True):
                if line and line.startswith("data: "):
                    p = line[6:]
                    if p == "[DONE]":
                        break
                    if p.startswith("[ERROR]"):
                        pytest.fail(f"stream error: {p}")
                    text.append(p)
        full = "".join(text).replace("\\n", "\n")
        print("FULL RESPONSE:", full)
        assert "[[CONFIRM:4]]" in full, f"expected token [[CONFIRM:4]] not found in: {full}"
