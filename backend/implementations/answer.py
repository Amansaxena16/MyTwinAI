import os
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
RETRIEVAL_K = 5
embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')

SYSTEM_PROMPT = """
You are a friendly AI assistant representing Aman Saxena on his personal portfolio.
You are speaking with a recruiter or visitor who wants to learn about Aman's
background, skills, experience, and projects.
Use the given context to answer their questions about Aman.
When the context includes Aman's own words (such as his FAQ answers), you can
share them naturally.
If you don't know the answer from the given context, say so honestly instead
of guessing.
Context:
{context}
"""

vectorstore = Chroma(embedding_function=embeddings, persist_directory=DB_NAME)
retriever = vectorstore.as_retriever(search_kwargs={'k': RETRIEVAL_K})
llm = ChatGroq(temperature=0, model_name=model, groq_api_key=my_api_key)


def fetch_context(question: str) -> list[Document]:
    return retriever.invoke(question)


def build_messages(question: str, history: list[dict]) -> tuple[list[BaseMessage], list[Document]]:
    docs = fetch_context(question)
    context = '\n\n'.join(doc.page_content for doc in docs)
    messages: list[BaseMessage] = [SystemMessage(content=SYSTEM_PROMPT.format(context=context))]
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
