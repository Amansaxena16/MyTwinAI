"""The questions recruiters actually ask, answered ahead of time.

Answers for these are generated once by warm_cache.py and served from disk, so
the common path costs no LLM tokens at all. Close paraphrases match too, so this
list only needs one natural phrasing per topic.
"""

COMMON_QUESTIONS = [
    # The suggestion chips on the empty state.
    'What are your key skills?',
    'Tell me about your work experience.',
    'Why should we hire you?',
    'What projects have you built?',
    # The rest of a typical first conversation.
    'Who is Aman Saxena?',
    'How much total experience does Aman have?',
    'What is his educational background?',
    'What programming languages does he know?',
    'What AI and GenAI tools has he worked with?',
    'What databases has he worked with?',
    'Where is he based?',
    'How can I contact him?',
    'What are his strengths?',
    'What are his weaknesses?',
    'Where does he see himself in 5 years?',
    'Tell me about MyTwinAI.',
    'What certifications does he have?',
    'What are his achievements?',
]
