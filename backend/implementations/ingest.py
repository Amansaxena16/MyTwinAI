import glob
import os

from langchain_chroma import Chroma
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

from .embeddings import MiniLMEmbeddings

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KNOWLEDGE_BASE_DIR = os.path.join(os.path.dirname(BASE_DIR), 'knowledge_base')
DB_NAME = os.path.join(BASE_DIR, 'vector_db')

HEADERS_TO_SPLIT_ON = [('#', 'title'), ('##', 'section')]
# Only long sections get split further; most sit well under this.
MAX_CHUNK_SIZE = 1200
CHUNK_OVERLAP = 150


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
    """Split on markdown headings so a section is never cut in half.

    Each chunk is prefixed with its heading path ("Skills > Databases") so a
    bare list of technology names still embeds close to a question that asks
    about "skills" - the names alone carry almost no matching meaning.
    """
    header_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=HEADERS_TO_SPLIT_ON, strip_headers=True
    )
    overflow_splitter = RecursiveCharacterTextSplitter(
        chunk_size=MAX_CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
    )

    chunks = []
    for doc in documents:
        for section in header_splitter.split_text(doc.page_content):
            section.metadata = {**doc.metadata, **section.metadata}

            heading_path = ' > '.join(
                part
                for part in (section.metadata.get('title'), section.metadata.get('section'))
                if part
            )
            if heading_path:
                section.page_content = f'{heading_path}\n\n{section.page_content}'

            chunks.extend(overflow_splitter.split_documents([section]))
    return chunks


def create_embeddings(chunks):
    if os.path.exists(DB_NAME):
        Chroma(persist_directory=DB_NAME, embedding_function=embeddings).delete_collection()

    vectorstore = Chroma.from_documents(
        documents=chunks, embedding=embeddings, persist_directory=DB_NAME
    )

    return vectorstore


embeddings = MiniLMEmbeddings()

if __name__ == '__main__':
    documents = fetch_documents()
    chunks = create_chunks(documents)
    create_embeddings(chunks)
    print(f'Ingestion complete: {len(documents)} documents, {len(chunks)} chunks')
