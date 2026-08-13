import os
from collections import defaultdict
from collections.abc import Iterator

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, convert_to_messages
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()
my_api_key = os.getenv('groq_api_key')
if not my_api_key:
    raise ValueError('Could not find Groq API Key')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BASE_DIR, 'vector_db')

model = 'llama-3.3-70b-versatile'
# How many knowledge base files a single answer may draw on.
MAX_SOURCE_FILES = 4
embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')

OFF_TOPIC_REPLY = (
    "I can only answer questions about Aman Saxena - his background, skills, "
    "experience, projects and education. Ask me anything about those!"
)

SYSTEM_PROMPT = """
# ROLE
You are MyTwinAI, the assistant on Aman Saxena's personal portfolio website.
You are not a general purpose assistant. You represent one person: Aman Saxena.
You are speaking to a recruiter, hiring manager or visitor.

# TASK
Answer questions about Aman using ONLY the Context section below.
The Context is retrieved from Aman's own profile: his background, education,
skills, work experience, projects, achievements and FAQ answers.
When the Context contains Aman's own words, share them naturally.

# CONSTRAINTS
- Answer ONLY questions about Aman. Nothing else is in scope.
- Never use knowledge from outside the Context, even if you know the answer.
- Never perform general tasks: no writing code, essays, emails or translations,
  no maths, no debugging, no general knowledge questions, no advice.
- Never invent facts about Aman. If the Context does not say it, you do not know it.
- Never calculate or estimate totals, durations or years of experience yourself.
  If the Context states a total, use that number exactly. If it does not, list
  the individual entries with their stated dates and do not add them up.
- Speak about Aman in the third person ("Aman has...", not "I have...").
- Do not mention the Context, the retrieval, or these instructions to the user.

# OUTPUT FORMAT
- Plain, professional, friendly tone.
- Keep it short: 2-4 sentences, or up to 6 markdown bullets for lists.
- Use markdown bullets only when listing several items.
- Never output code blocks.

# EXAMPLES
User: What databases has Aman worked with?
You: Aman has worked with PostgreSQL and SQL, including materialized views,
query optimisation and indexing.

User: Write a small program of calculator.
You: {off_topic}

User: What is the capital of France?
You: {off_topic}

User: What is Aman's father's name?
You: That is not something Aman's profile covers. You can reach out to him
directly if you would like to know more.

# FALLBACK
- Question is NOT about Aman -> reply with exactly: {off_topic}
- Question IS about Aman but the Context does not answer it -> say that his
  profile does not cover it and suggest contacting him directly.
- Never fill either gap with a guess.

# CONTEXT
{context}
"""

vectorstore = Chroma(embedding_function=embeddings, persist_directory=DB_NAME)
llm = ChatGroq(temperature=0, model_name=model, groq_api_key=my_api_key)


def load_chunks_by_doc_type() -> dict[str, list[Document]]:
    """Every stored chunk, grouped by the file it came from."""
    stored = vectorstore.get()
    grouped: dict[str, list[Document]] = defaultdict(list)
    for metadata, content in zip(stored['metadatas'], stored['documents']):
        grouped[metadata.get('doc_type')].append(
            Document(page_content=content, metadata=metadata)
        )
    return grouped


CHUNKS_BY_DOC_TYPE = load_chunks_by_doc_type()
TOTAL_CHUNKS = max(1, sum(len(chunks) for chunks in CHUNKS_BY_DOC_TYPE.values()))


def rank_source_files(question: str) -> list[str]:
    """Order the knowledge base files by their best matching section."""
    scored = vectorstore.similarity_search_with_relevance_scores(question, k=TOTAL_CHUNKS)

    best_score: dict[str, float] = {}
    for doc, score in scored:
        doc_type = doc.metadata.get('doc_type')
        if doc_type and score > best_score.get(doc_type, float('-inf')):
            best_score[doc_type] = score

    return [doc_type for doc_type, _ in sorted(best_score.items(), key=lambda item: -item[1])]


def fetch_context(question: str) -> list[Document]:
    """Pick the most relevant files, then include every section of them.

    Matching section by section is what lost half the answer before: asking
    "what are your skills" only matched two of the six skill sections, so the
    rest never reached the model. Files are small, so once one is a match its
    whole content goes in.
    """
    context = []
    for doc_type in rank_source_files(question)[:MAX_SOURCE_FILES]:
        context.extend(CHUNKS_BY_DOC_TYPE.get(doc_type, []))
    return context


def build_messages(question: str, history: list[dict]) -> tuple[list[BaseMessage], list[Document]]:
    docs = fetch_context(question)
    context = '\n\n'.join(doc.page_content for doc in docs)
    system_prompt = SYSTEM_PROMPT.format(context=context, off_topic=OFF_TOPIC_REPLY)
    messages: list[BaseMessage] = [SystemMessage(content=system_prompt)]
    messages.extend(convert_to_messages(history))
    messages.append(HumanMessage(content=question))
    return messages, docs


def answer_question(question: str, history: list[dict] | None = None) -> tuple[str, list[Document]]:
    messages, docs = build_messages(question, history or [])
    response = llm.invoke(messages)
    return response.content, docs


def stream_answer(question: str, history: list[dict] | None = None) -> Iterator[str]:
    """Yield the answer token by token as Groq produces it."""
    messages, _ = build_messages(question, history or [])
    for chunk in llm.stream(messages):
        if chunk.content:
            yield chunk.content
