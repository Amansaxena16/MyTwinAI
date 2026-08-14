"""Generate the answers for COMMON_QUESTIONS once, so serving them is free.

Run after changing the knowledge base:

    python implementations/warm_cache.py

Existing answers are kept, so a run interrupted by the Groq rate limit can be
resumed later and will only ask for the ones still missing.
"""

import json
import os
import sys
import time

from answer import CACHE_PATH, answer_question
from common_questions import COMMON_QUESTIONS

# Ollama unloads an idle model and drops the connection while it reloads, which
# is a blip rather than a real failure. A rate limit is not worth retrying.
RETRIES = 2
RETRY_WAIT_SECONDS = 5


def is_worth_retrying(exc: Exception) -> bool:
    return 'rate limit' not in str(exc).lower()


def generate(question: str) -> str:
    for attempt in range(RETRIES + 1):
        try:
            # use_cache=False so warming never reads back its own answers.
            answer, _ = answer_question(question, use_cache=False)
            return answer
        except Exception as exc:
            if attempt == RETRIES or not is_worth_retrying(exc):
                raise
            print(f'  retrying after: {exc}')
            time.sleep(RETRY_WAIT_SECONDS)
    raise RuntimeError('unreachable')


def load_existing() -> dict[str, str]:
    if not os.path.exists(CACHE_PATH):
        return {}
    with open(CACHE_PATH, encoding='utf-8') as cache_file:
        return {entry['question']: entry['answer'] for entry in json.load(cache_file)}


def save(answers: dict[str, str]) -> None:
    entries = [
        {'question': question, 'answer': answers[question]}
        for question in COMMON_QUESTIONS
        if question in answers
    ]
    with open(CACHE_PATH, 'w', encoding='utf-8') as cache_file:
        json.dump(entries, cache_file, indent=2, ensure_ascii=False)


def main() -> int:
    answers = load_existing()
    missing = [q for q in COMMON_QUESTIONS if q not in answers]

    if not missing:
        print(f'Cache already complete: {len(answers)} questions.')
        return 0

    print(f'{len(answers)} cached, generating {len(missing)}...')
    for question in missing:
        try:
            answer = generate(question)
        except Exception as exc:
            # Almost always the Groq daily token limit. Keep what we have.
            save(answers)
            print(f'\nStopped at "{question}": {exc}')
            print(f'Saved {len(answers)} answers. Re-run later to finish.')
            return 1

        answers[question] = answer
        save(answers)
        print(f'  ok  {question}')

    print(f'\nCache complete: {len(answers)} questions -> {CACHE_PATH}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
