import glob
import os

from langchain_chroma import Chroma
from langchain_community.document_loaders import TextLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KNOWLEDGE_BASE_DIR = os.path.join(os.path.dirname(BASE_DIR), 'knowledge_base')
DB_NAME = os.path.join(BASE_DIR, 'vector_db')


def fetch_documents():
    files = glob.glob(os.path.join(KNOWLEDGE_BASE_DIR, '*.md'))

    documents = []
    for file_path in files:
        doc_type = os.path.splitext(os.path.basename(file_path))[0]
        loader = TextLoader(file_path, encoding='utf-8')
        file_docs = loader.load()
        for doc in file_docs:
            doc.metadata['doc_type'] = doc_type
            documents.append(doc)
    return documents


def create_chunks(documents):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=200)
    chunks = text_splitter.split_documents(documents)
    return chunks


def create_embeddings(chunks):
    if os.path.exists(DB_NAME):
        Chroma(persist_directory=DB_NAME, embedding_function=embeddings).delete_collection()

    vectorstore = Chroma.from_documents(
        documents=chunks, embedding=embeddings, persist_directory=DB_NAME
    )

    return vectorstore


embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')

if __name__ == '__main__':
    documents = fetch_documents()
    chunks = create_chunks(documents)
    create_embeddings(chunks)
    print(f'Ingestion complete: {len(documents)} documents, {len(chunks)} chunks')
