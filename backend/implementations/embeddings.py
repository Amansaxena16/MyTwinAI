"""The embedding model, run through ONNX rather than PyTorch.

Same model as before, sentence-transformers/all-MiniLM-L6-v2, and it produces
the same numbers: embedding one question through both engines gave a cosine
similarity of 1.0000000000, the largest single difference being 1.4e-7, which
is float rounding. Only the machinery around the model changed, so answers are
unaffected and an existing vector_db stays valid without re-ingesting.

What changed is the cost. PyTorch needed 862 MB and 11.6 seconds to load, ONNX
needs 243 MB and 0.9 seconds, and onnxruntime already arrives as a chromadb
dependency - so this removes packages rather than adding any. That mattered
because every host that will run a 1.89 GB image wants a credit card.
"""

from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2
from langchain_core.embeddings import Embeddings


class MiniLMEmbeddings(Embeddings):
    """LangChain's embedding interface, backed by Chroma's ONNX runtime.

    The model downloads to ~/.cache/chroma on first use, which the Dockerfile
    does at build time so no visitor ever waits for it.
    """

    def __init__(self) -> None:
        self._embed = ONNXMiniLM_L6_V2()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [[float(value) for value in vector] for vector in self._embed(texts)]

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]
