# MyTwinAI

### ▶ [Try it live](https://my-twin-ai-one.vercel.app)

A chatbot that answers recruiters' questions about me — using **my real profile**, not an AI's guesswork.

Ask it *"what projects has he built?"* and it answers from my actual files. Ask it *"write me a Python script"* and it politely refuses. It only knows one subject: me.

**Built with:** Django · React · LangChain · Chroma · Groq · Docker

*First question after a quiet spell may take a few seconds — the free server goes to sleep, and the app waits for it rather than showing you an error.*

---

## How it works

```
Recruiter asks a question
        |
        v
Is it a question I already answered?  ──yes──>  send the saved answer   (instant, free)
        |
        no
        v
Find the right facts in my profile files
        |
        v
Send facts + question to the AI  ──>  stream the answer back word by word
```

That first branch is the important one. It means the most common questions cost nothing at all.

---

## The problems I had to solve

This is the interesting part. Building the chatbot was easy. Making it **correct and affordable** was not.

### 1. It answered things it shouldn't

Someone asked it to write a calculator program — and it did.

That's not a portfolio bot, that's a free ChatGPT. It also meant anyone could burn my budget on unrelated questions.

**Fix:** I rewrote the instructions with a clear job description — role, task, rules, format, examples, and what to do when it doesn't know. Now off-topic questions get one polite line.

```
"write a small python program for a calculator"
-> "I can only answer questions about Aman Saxena..."
```

### 2. It only knew half my skills

I asked for my skills. It listed some and skipped my AI tools and programming languages entirely.

**Why:** my skills file was being chopped into pieces mid-list. Only one piece was being found.

**Fix:** I now split files at headings instead of at a character count, so a section is never cut in half. Each piece also carries its heading (`Skills > Databases`) so a bare list of tool names still matches a question about "skills".

### 3. It said I had 3–4 years of experience

I have 2.

The AI was counting from my first internship to my latest job — ignoring the study gaps in between.

**Fix:** two parts. I wrote the real total into my profile, and I told the model **never to do maths on dates** — if a total is written down, use that number exactly.

### 4. Running out of tokens

The free AI service gives **100,000 tokens a day**. Each question costs about 3,000.

**That's only ~34 questions per day, shared across every visitor.** One curious recruiter could use them all, and the next person would see an error.

This was the hardest problem, and it needed four separate fixes.

---

## Fix 1 — Save the common answers

Recruiters ask the same things. *"What are your skills?"* *"Why should we hire you?"*

So I wrote those answers **once** and saved them to a file. Now they're served straight from disk.

| | Before | After |
| --- | --- | --- |
| Speed | ~600 ms | **8 ms** |
| Cost | ~3,000 tokens | **0** |

**The mistake I made first:** I matched questions by *meaning*, using AI similarity. It seemed clever. It was wrong:

```
"What skills does he have?"  ->  matched "What are his strengths?"   (0.731)
"Where did he study?"        ->  matched the correct answer          (0.722)
```

The **wrong** match scored **higher** than a **right** one. No cut-off could separate them — I'd either serve wrong answers or never match anything.

**So I made it simpler:** match the exact words instead. It can't catch every rephrasing, but it can never be wrong. And the clickable buttons send exact text anyway, so the common path stays free.

## Fix 2 — Suggest the next question

After each answer, three buttons appear: **"Ask next"**.

Every suggested question is one I've already saved an answer for. So clicking through the whole conversation costs **nothing**.

Three details that make it actually work:

- **Never suggests something already asked.** If it did, you'd click it and get an answer already on screen.
- **Works mid-conversation, not just at the start.** This was the bug that nearly killed the feature — my cache originally only worked on the first message, so every button click would have cost tokens.
- **Suggestions appear even on an error.** If the AI is out of tokens, the buttons still work, because saved answers don't need the AI.

## Fix 3 — Greet people for free

Almost every visitor opens with "hi".

That was costing ~2,800 tokens to say hello back.

Now "hi", "hello", "hey" and eight other greetings are answered instantly from the saved file. **Free.**

## Fix 4 — Two AI models instead of one

I use a big model for quality and a smaller one for capacity:

```
gpt-oss-120b   ->  used first. better answers, runs out sooner
gpt-oss-20b    ->  takes over automatically when the first is empty
```

When the good model runs out, the app **quietly steps down** instead of breaking. The visitor never knows.

**This is also where it bit me.** The app first ran on `llama-3.3-70b` with `llama-3.1-8b` behind it. Groq retired *both* on the same day, so the fallback was already dead when the main model went — and the whole point of having two was lost. A fallback only helps if it can fail for a different reason than the thing it is backing up.

The saved answers carried the site through it. Clicking the suggested questions still worked, because those never reach the AI at all.

And if both run out, the error is honest and useful:

> "I have hit my daily question limit and it resets in about 34 minutes. The suggested questions below still work in the meantime."

Not *"Something went wrong."*

---

## One more problem: people asking for huge answers

I tested what happens if someone types *"tell me everything about Aman in 1000 words"*.

It refused — and then wrote 617 words anyway. Another prompt made it repeat the same sentence until it filled **4,825 tokens**. About twenty of those would empty a whole day.

**Fix:** a hard limit on answer length, enforced by the AI service — not just asked for politely in the instructions. The model can't talk its way past it.

I sized it by measuring, not guessing. My longest genuine answer needs 567 tokens, so the cap is 600. My first attempt at 400 cut a real answer off in the middle of a GitHub link.

---

## The last problem: it was too big to host for free

The app worked. Nowhere free would run it.

Every host with real Docker support wanted a credit card. Free tiers cap at **512 MB of memory**, and mine needed about 500 MB — right on the line, with no room to spare.

I measured where it was going:

```
PyTorch and its dependencies   ~400 MB
everything else                ~100 MB
```

**All that PyTorch existed to run one small model** — the thing that turns text into numbers so I can search my profile.

That same model also ships in **ONNX** format, which needs no PyTorch at all. And it was already installed, as a dependency of a library I was using anyway.

Before switching, I checked it actually gave the same answers:

```
cosine similarity between the two versions:  1.0000000000
largest difference in any number:            0.00000014
```

Identical, down to floating-point rounding. Same model, lighter engine.

| | Before | After |
| --- | --- | --- |
| Memory | 519 MB | **303 MB** |
| Docker image | 1.89 GB | **799 MB** |
| Time to load the model | 11.6s | **0.9s** |

It fits comfortably now — and as a bonus, the 0.9-second load killed the cold-start delay too.

**The lesson:** the heaviest dependency was doing the smallest job. Worth checking before paying for a bigger server.

---

## Where it runs

| | |
| --- | --- |
| **Frontend** | Vercel — [my-twin-ai-one.vercel.app](https://my-twin-ai-one.vercel.app) |
| **Backend** | Render (free tier), Docker |
| **Cost** | £0 |

Both redeploy automatically when I push to `main`.

The backend needs these environment variables:

```
groq_api_key           your Groq key
django_secret_key      any long random string
django_debug           false
cors_allowed_origins   https://your-frontend-domain
```

That last one matters: without it any website could embed the bot and spend my daily AI tokens.

**Free hosting has one catch.** The server sleeps after 15 minutes of no visitors, and takes a moment to wake. So the frontend retries quietly and says *"waking the server up"* instead of showing an error — a recruiter sees a short wait, not a broken page.

---

## Running it locally

```bash
# backend
cd backend
python manage.py runserver

# frontend
cd frontend
npm run dev
```

You'll need a free [Groq](https://console.groq.com) API key in a `.env` file:

```
groq_api_key = your_key_here
```

## Updating my profile

The knowledge lives in plain markdown files in `backend/knowledge_base/`.

After editing one, rebuild the search index:

```bash
cd backend
python -m implementations.ingest
```

If your change affects one of the saved answers in
`backend/implementations/cached_answers.json`, **edit that too** — saved answers
are served without asking the AI, so they don't update themselves.

I have been caught by this: I updated my skills, rebuilt the index, and the site
still showed the old list, because the two most-clicked questions were being
answered from the cache and never reached the AI at all.

Then push, and both hosts redeploy on their own:

```bash
git add -A && git commit -m "update my profile" && git push
```

The search index is committed to the repo, so the server never has to build it.

---

## What I'd do next

- Make it work properly on phones — it is built for a desktop screen right now
- Let visitors ask in other languages
- Track which questions get asked most, and pre-write those answers too
- A short evaluation set to catch wrong answers automatically before they go live
