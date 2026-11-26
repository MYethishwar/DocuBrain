# DocuBrain API

FastAPI service that answers questions from the **Yethishwar Archives** Bedrock Knowledge Base
using **Nova Lite**, with the **guardrail** applied. Runs locally with uvicorn and on **AWS Lambda**
through Mangum (later behind API Gateway).

## Request flow

```
POST /ask
  → routers/ask_router.py                 validates the request, maps errors to HTTP 500 / 502 / 429
  → services/kb_service.py                business logic
      → config/settings.py                settings: SSM first, then .env, else error (cached)
          → clients/ssm_client.py
      → clients/knowledge_base_client.py  1. Retrieve: top chunks from the knowledge base
      → clients/model_client.py           2. Converse: Nova Lite + guardrail writes the answer
  ← schemas/ask_schema.py                 response shape
```

Why two steps instead of `RetrieveAndGenerate`: the knowledge base is a **managed knowledge base**,
and AWS does not support `RetrieveAndGenerate` on those. In the Converse call the retrieved chunks are
marked as the guardrail's **grounding source** and the question as the **query**, so the contextual
grounding check still runs, and the question is also checked by the other guardrail policies
(denied topics, word filters, sensitive information). When the guardrail blocks, the log line names the
policy that fired (for example `topicPolicy`).

## Folder layout

```
backend/
├── src/
│   ├── docubrain_server.py        FastAPI app, CORS, request logging, routers, Lambda handler
│   ├── config/settings.py         settings lookup: SSM → .env → ConfigurationError
│   ├── clients/
│   │   ├── ssm_client.py              Parameter Store calls only
│   │   ├── knowledge_base_client.py   Bedrock Knowledge Base Retrieve only
│   │   ├── model_client.py            Bedrock Converse (model + guardrail) only
│   │   ├── guardrail_client.py        standalone ApplyGuardrail (used in Ollama mode)
│   │   └── ollama_client.py           local open-source model via Ollama's HTTP API
│   ├── services/kb_service.py     business logic
│   ├── routers/
│   │   ├── ask_router.py          POST /ask
│   │   └── health_router.py       GET /health
│   ├── schemas/ask_schema.py      request/response models
│   └── utils/logger.py            shared logger (one format everywhere)
├── events/                        Lambda console test events
├── .env.example                   template for local .env
├── requirements.txt               runtime dependencies (go into the Lambda zip)
├── requirements-dev.txt           + uvicorn and httpx for local runs
└── build_lambda.ps1               builds dist/docubrain-api.zip
```

## Settings: where each value comes from

For each setting the app tries, in order:

1. **SSM Parameter Store** (`/docubrain/...`)
2. **`.env` file or environment variable**
3. Otherwise it logs an error and `/ask` returns **500 "Server configuration error"**.

If SSM can't be reached at all (no credentials, no permission, no network), it logs a warning
and uses `.env` for everything. Values are read once per process and cached.

| Setting | SSM parameter | `.env` variable |
|---|---|---|
| Knowledge base ID | `/docubrain/kb-id` | `KB_ID` |
| Guardrail ID | `/docubrain/guardrail-id` | `GUARDRAIL_ID` |
| Guardrail version | `/docubrain/guardrail-version` | `GUARDRAIL_VERSION` |
| Model ARN | `/docubrain/model-arn` | `MODEL_ARN` |

### Model provider

| Variable | Default | Meaning |
|---|---|---|
| `MODEL_PROVIDER` | `bedrock` | `bedrock`: Retrieve → Converse with the guardrail attached. `ollama`: ApplyGuardrail (input) → Retrieve → local Ollama model → ApplyGuardrail (output, with contextual grounding) |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server |
| `OLLAMA_MODEL` | `llama3.2:3b` | Model pulled with `ollama pull` |
| `OLLAMA_MAX_CHUNKS` | `3` | Passages sent to Ollama (fewer = faster on CPU) |
| `OLLAMA_TIMEOUT_SECONDS` | `180` | Request timeout |

In both modes the knowledge base and the guardrail are the AWS ones. Ollama mode is for running the
backend locally; the startup log shows which provider is active, for example
`DocuBrain API ready (model_provider=ollama [llama3.2:3b], ...)`.

Optional environment variables: `AWS_REGION` (default `ap-southeast-2`, set automatically on Lambda),
`PARAM_PREFIX` (default `/docubrain`), `CORS_ORIGINS` (default `*`; set to the React app URL later),
`LOG_LEVEL` (default `INFO`).

## Logging

Every module gets its logger from `src/utils/logger.py`:

```
2026-11-26 12:30:01,120 | INFO    | src.config.settings | Setting 'kb_id' loaded from SSM parameter '/docubrain/kb-id'
2026-11-26 12:30:01,130 | INFO    | src.clients.knowledge_base_client | Retrieve returned 5 chunk(s) in 1097 ms
2026-11-26 12:30:01,131 | WARNING | src.services.kb_service | Guardrail intervened; policies triggered: ['topicPolicy']
2026-11-26 12:30:01,132 | INFO    | src.docubrain_server | POST /ask -> 200 (2160 ms)
```

On Lambda these lines appear in **CloudWatch Logs** (Monitor tab → View CloudWatch logs).

## API

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/health` | — | `{"status": "ok"}` |
| POST | `/ask` | `{"question": "When did the Zero Hour start?"}` | `{"question", "answer", "guardrail_action": "NONE" \| "INTERVENED" \| "MASKED", "sources": [...]}` |

## Run locally

Needs AWS credentials for the same account (`aws configure` or `aws sso login`).
Without SSM access, fill in `.env` instead.

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
copy .env.example .env     # optional fallback values
uvicorn src.docubrain_server:app --reload
```

Open http://localhost:8000/docs and try `POST /ask`.

## Deploy to Lambda

1. Build the zip:
   ```powershell
   .\build_lambda.ps1
   ```
2. Lambda console → **Code → Upload from → .zip file** → `dist\docubrain-api.zip`.
3. **Runtime settings → Edit**: Runtime **Python 3.12**, Handler **`src.docubrain_server.handler`**,
   Architecture **x86_64** (must match the build).
4. **Configuration → General configuration**: Timeout **30 sec**, Memory **512 MB**.
5. **Test** tab → new event → paste `events/health_event.json`, then `events/ask_event.json`.
   A good result returns `statusCode: 200` with the answer in `body`.

The `.env` file is never put in the zip. On Lambda the settings come from SSM.
