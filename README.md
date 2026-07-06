# Digital Twin — Ask-Me-Anything chat

A public chat app where anyone can ask an AI version of you about your **education,
certifications, experience, skills, projects, hobbies, and contacts**. Out-of-scope
questions get a polite redirect. Built with Next.js (App Router) + TypeScript +
Tailwind, streaming answers from **Claude Haiku 4.5** (provider-swappable).

## Quick start

```bash
# 1. Add your API key
cp .env.example .env.local
#   then edit .env.local and set ANTHROPIC_API_KEY=...

# 2. (Optional) refresh your profile from source files
npm run build:profile     # reads data/linkedin.pdf + data/hobbies.txt

# 3. Run
npm run dev               # http://localhost:3000
```

## Personalize it

1. **`data/linkedin.pdf`** — export your LinkedIn profile as PDF ("More → Save to PDF")
   and drop it here. Its text becomes what the twin knows.
2. **`data/hobbies.txt`** — free text about your hobbies, interests, and preferences.
3. **`public/avatar.png`** — your headshot (until you add one, the header shows your
   initials).
4. **`data/config.ts`** — your name, greeting, title, the LinkedIn/GitHub/Hugging Face
   links, the suggested-question chips, and the allowed topic scope.

After changing the PDF or txt, re-run `npm run build:profile` (it also runs
automatically before `npm run dev` and `npm run build`).

## How it works

- `data/profile.generated.ts` — auto-generated profile text (don't edit by hand).
- `lib/systemPrompt.ts` — persona + guardrails; only answers in-scope topics, never
  invents facts, refuses jailbreak/override attempts.
- `lib/llm.ts` — provider abstraction. Default Claude Haiku 4.5; set `LLM_PROVIDER=groq`
  or `cerebras` (+ that provider's key) in `.env.local` to swap to a faster open model.
- `app/api/chat/route.ts` — validates input, rate-limits per IP, streams the answer.
- `app/page.tsx` — the chat UI; conversation history is saved in the browser
  (localStorage), so it survives page reloads. History is client-side only.

## Speed / cost notes

Answers **stream**, so the first words appear in well under a second — there's no long
blank wait regardless of model. Claude Haiku 4.5 is ~$1 in / $5 out per 1M tokens. If
you want extreme raw throughput, flip `LLM_PROVIDER` to `groq`/`cerebras` — they run
open models (Llama/Qwen), are cheaper per token (often $0 on their free tiers for a
low-traffic personal site), and trade a little persona nuance. A *bigger* Claude model
(Sonnet/Opus) is higher quality but **slower**, not faster.

## Deploy to Vercel

```bash
npx vercel        # or connect the repo in the Vercel dashboard
```

Then in **Vercel → Project → Settings → Environment Variables**, add
`ANTHROPIC_API_KEY` (and, if you swapped providers, `LLM_PROVIDER` + that key) and
redeploy. `data/linkedin.pdf` / `data/hobbies.txt` are committed with the repo, so the
`prebuild` step regenerates the profile on Vercel automatically.

> Rate limiting is a simple in-memory per-IP limiter (15 msgs/min). It's per-instance
> and resets on cold start — fine for a personal site. For durable, cross-instance
> limits, swap `lib/rateLimit.ts` for Upstash Redis (`@upstash/ratelimit`).
