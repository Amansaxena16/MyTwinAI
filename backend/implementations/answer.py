import os

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, SystemMessage, convert_to_messages
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings

from ingest import DB_NAME, embeddings

load_dotenv()
my_api_key = os.getenv('groq_api_key')
if not my_api_key:
    raise ValueError('Could not find Groq API Key')

model = 'llama-3.3-70b-versatile'
RETRIEVAL_K = 5

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
retriever = vectorstore.as_retriever()
llm = ChatGroq(temperature=0, model_name=model, groq_api_key=my_api_key)


def fetch_context(question: str) -> list[Document]:
    return retriever.invoke(question, k=RETRIEVAL_K)


def answer_question(question: str, history: list[dict] = []) -> tuple[str, list[Document]]:
    docs = fetch_context(question)
    context = '\n\n'.join(doc.page_content for doc in docs)
    system_prompt = SYSTEM_PROMPT.format(context=context)
    messages = [SystemMessage(content=system_prompt)]
    messages.extend(convert_to_messages(history))
    messages.append(HumanMessage(content=question))
    response = llm.invoke(messages)
    return response.content, docs
