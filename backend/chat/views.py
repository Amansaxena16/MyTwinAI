import json
import logging

from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from implementations.answer import answer_question, follow_ups_for, stream_answer

logger = logging.getLogger(__name__)


class AskLLM(APIView):

    def post(self, request):
        question = request.data.get('question')
        if not question:
            return Response({'error': 'Could not find Question'}, status=status.HTTP_400_BAD_REQUEST)

        history = request.data.get('history', [])

        answer, docs = answer_question(question, history)

        history.append({'role': 'user', 'content': question})
        history.append({'role': 'assistant', 'content': answer})

        sources = [
            {'content': d.page_content, 'doc_type': d.metadata.get('doc_type')}
            for d in docs
        ]

        return Response(
            {
                'answer': answer,
                'sources': sources,
                'history': history,
                'follow_ups': follow_ups_for(question),
            },
            status=status.HTTP_200_OK,
        )


class AskLLMStream(APIView):
    """Same answer as AskLLM, streamed token by token over SSE."""

    def post(self, request):
        question = request.data.get('question')
        if not question:
            return Response({'error': 'Could not find Question'}, status=status.HTTP_400_BAD_REQUEST)

        history = request.data.get('history', [])

        def event_stream():
            try:
                for token in stream_answer(question, history):
                    yield f'data: {json.dumps({"token": token})}\n\n'
                # After the answer, so the chips appear once it has finished.
                yield f'data: {json.dumps({"follow_ups": follow_ups_for(question)})}\n\n'
            except Exception:
                logger.exception('Streaming the answer failed')
                yield f'data: {json.dumps({"error": "Could not generate an answer."})}\n\n'
            yield f'data: {json.dumps({"done": True})}\n\n'

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        # Stops nginx (and friends) from buffering the stream into one chunk.
        response['X-Accel-Buffering'] = 'no'
        return response
