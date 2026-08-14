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

# What to offer as the next click after each answer.
#
# Every suggestion is itself a cached question, so following the chips costs no
# tokens however far a visitor goes. Written by hand rather than generated: the
# model would happily suggest questions there is no cached answer for, which
# would turn the cheapest path through the app into the most expensive one.
FOLLOW_UPS = {
    'What are your key skills?': [
        'What AI and GenAI tools has he worked with?',
        'What databases has he worked with?',
        'What projects have you built?',
    ],
    'Tell me about your work experience.': [
        'How much total experience does Aman have?',
        'What projects have you built?',
        'Why should we hire you?',
    ],
    'Why should we hire you?': [
        'What are his strengths?',
        'What are his weaknesses?',
        'Tell me about your work experience.',
    ],
    'What projects have you built?': [
        'Tell me about MyTwinAI.',
        'What AI and GenAI tools has he worked with?',
        'What are your key skills?',
    ],
    'Who is Aman Saxena?': [
        'What are your key skills?',
        'Tell me about your work experience.',
        'Where is he based?',
    ],
    'How much total experience does Aman have?': [
        'Tell me about your work experience.',
        'What projects have you built?',
        'Why should we hire you?',
    ],
    'What is his educational background?': [
        'What certifications does he have?',
        'What are your key skills?',
        'What are his achievements?',
    ],
    'What programming languages does he know?': [
        'What AI and GenAI tools has he worked with?',
        'What databases has he worked with?',
        'What projects have you built?',
    ],
    'What AI and GenAI tools has he worked with?': [
        'Tell me about MyTwinAI.',
        'What projects have you built?',
        'What are your key skills?',
    ],
    'What databases has he worked with?': [
        'What are your key skills?',
        'What projects have you built?',
        'Tell me about your work experience.',
    ],
    'Where is he based?': [
        'How can I contact him?',
        'Tell me about your work experience.',
        'Where does he see himself in 5 years?',
    ],
    'How can I contact him?': [
        'What projects have you built?',
        'What are your key skills?',
        'Why should we hire you?',
    ],
    'What are his strengths?': [
        'What are his weaknesses?',
        'Why should we hire you?',
        'What are his achievements?',
    ],
    'What are his weaknesses?': [
        'What are his strengths?',
        'Where does he see himself in 5 years?',
        'Why should we hire you?',
    ],
    'Where does he see himself in 5 years?': [
        'Why should we hire you?',
        'What are his strengths?',
        'Tell me about your work experience.',
    ],
    'Tell me about MyTwinAI.': [
        'What projects have you built?',
        'What AI and GenAI tools has he worked with?',
        'What are your key skills?',
    ],
    'What certifications does he have?': [
        'What is his educational background?',
        'What are his achievements?',
        'What are your key skills?',
    ],
    'What are his achievements?': [
        'What certifications does he have?',
        'What are his strengths?',
        'What is his educational background?',
    ],
}

# Shown after a question nobody wrote follow ups for, which is any question a
# visitor typed themselves.
DEFAULT_FOLLOW_UPS = [
    'What are your key skills?',
    'What projects have you built?',
    'Tell me about your work experience.',
]

# Almost every visitor opens with a greeting, and sending one to the model cost
# about 2,800 tokens to say hello back. Written here rather than in
# cached_answers.json because it is interface copy, not a generated answer, and
# because one paragraph serves every phrasing. Kept out of COMMON_QUESTIONS so
# "hi" is never offered as a follow up chip.
GREETING_ANSWER = (
    "**Hi! I'm MyTwinAI — Aman's digital twin.**\n\n"
    'I answer questions about his skills, experience, projects and education, '
    "straight from his own profile.\n\n"
    'Pick a question below, or ask me anything about him.'
)

GREETINGS = [
    'Hi, who are you?',
    'who are you?',
    'hi',
    'hii',
    'hi there',
    'hello',
    'hello there',
    'hey',
    'hey there',
    'good morning',
    'good evening',
]
