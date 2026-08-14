import json
import logging
import math
import re

from django.http import StreamingHttpResponse
from groq import RateLimitError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from implementations.answer import answer_question, follow_ups_for, stream_answer

logger = logging.getLogger(__name__)

GENERIC_ERROR = 'Could not generate an answer.'


def rate_limit_message(exc: RateLimitError) -> str:
    """Say how long the wait is, rather than leaving the visitor guessing.

    The daily token allowance is a rolling 24 hour window, so the wait is
    usually minutes rather than "tomorrow". Groq puts it in the message as
    "Please try again in 36m15.552s".
    """
    match = re.search(r'try again in (?:(\d+)m)?([\d.]+)s', str(exc))
    if not match:
        return 'I have hit my daily question limit. Please try again a bit later.'

    minutes = int(match.group(1) or 0) + math.ceil(float(match.group(2)) / 60)
    when = 'a minute' if minutes <= 1 else f'about {minutes} minutes'
    return (
        f'I have hit my daily question limit and it resets in {when}. '
        'The suggested questions below still work in the meantime.'
    )


class AskLLM(APIView):

    def post(self, request):
        question = request.data.get('question')
        if not question:
            return Response({'error': 'Could not find Question'}, status=status.HTTP_400_BAD_REQUEST)

        history = request.data.get('history', [])

        try:
            answer, docs = answer_question(question, history)
        except RateLimitError as exc:
            logger.warning('Groq rate limit reached: %s', exc)
            return Response(
                {'error': rate_limit_message(exc), 'follow_ups': follow_ups_for(question)},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

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
            # Errors carry the chips too. They are cached answers, so they work
            # when nothing else does, and an error saying "try the suggestions
            # below" needs there to be suggestions below.
            except RateLimitError as exc:
                logger.warning('Groq rate limit reached: %s', exc)
                payload = {'error': rate_limit_message(exc), 'follow_ups': follow_ups_for(question)}
                yield f'data: {json.dumps(payload)}\n\n'
            except Exception:
                logger.exception('Streaming the answer failed')
                payload = {'error': GENERIC_ERROR, 'follow_ups': follow_ups_for(question)}
                yield f'data: {json.dumps(payload)}\n\n'
            yield f'data: {json.dumps({"done": True})}\n\n'

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        # Stops nginx (and friends) from buffering the stream into one chunk.
        response['X-Accel-Buffering'] = 'no'
        return response
