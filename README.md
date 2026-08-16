# MyTwinAI

A chatbot that answers recruiters' questions about me — using **my real profile**, not an AI's guesswork.

Ask it *"what projects has he built?"* and it answers from my actual files. Ask it *"write me a Python script"* and it politely refuses. It only knows one subject: me.

**Built with:** Django · React · LangChain · Chroma · Groq

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
llama-3.3-70b   ->  used first. better answers, runs out sooner
llama-3.1-8b    ->  takes over automatically when the first is empty
```

When the good model runs out, the app **quietly steps down** instead of breaking. The visitor never knows.

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

---

## What I'd do next

- Let visitors ask in other languages
- Track which questions get asked most, and pre-write those answers too
- A short evaluation set to catch wrong answers automatically before they go live
