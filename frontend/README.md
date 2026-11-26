# DocuBrain Web

Chat interface for the DocuBrain API (Yethishwar Archives knowledge base with guardrail).

## Stack

| Library | Why |
|---|---|
| React 19 + Vite 8 + TypeScript | Fast dev server, typed code, static build for any host |
| Tailwind CSS 4 | Styling with a custom theme (`src/index.css`) |
| Motion | Message entrances, typing dots, drifting background glow |
| lucide-react | Line icons |
| react-markdown | Renders lists and bold text in answers |

Fonts: **Bricolage Grotesque** (headings) and **Atkinson Hyperlegible Next** (body, built for legibility).
Palette: ink-navy background, signal-lime accent, iris glow, coral for guardrail blocks, amber for errors.

## Folder layout

```
src/
├── main.tsx                 entry point
├── App.tsx                  page layout
├── index.css                Tailwind + theme (fonts, colours)
├── api/docubrainApi.ts      POST /ask + friendly error messages
├── hooks/useChat.ts         conversation state
├── types/chat.ts            shared types
└── components/
    ├── ChatHeader.tsx       logo, "Guardrail on", New chat
    ├── EmptyState.tsx       welcome + suggested questions
    ├── MessageList.tsx      messages + auto-scroll
    ├── MessageBubble.tsx    user / answer / blocked / error bubbles, sources, copy
    ├── TypingIndicator.tsx  "Searching the archives…"
    ├── ChatInput.tsx        auto-growing input, Enter to send
    ├── BackgroundGlow.tsx   decorative background
    └── LogoMark.tsx         DocuBrain mark
```

## Run locally

```powershell
cd frontend
npm install
copy .env.example .env      # sets VITE_API_URL to the API Gateway URL
npm run dev
```

Open http://localhost:5173. API Gateway CORS must allow this origin.

## Build for hosting

```powershell
npm run build
```

Upload the `dist/` folder to S3 + CloudFront or Amplify Hosting, then add the hosted URL to
API Gateway CORS.
