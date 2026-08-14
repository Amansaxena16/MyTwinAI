import './EmptyState.css'

interface EmptyStateProps {
  onSuggestionClick: (question: string) => void
}

/**
 * `label` is what the chip shows, `question` is what gets asked. They differ
 * only where the label carries an emoji, which has no place in the question.
 * Every question here is a cached one, so opening this way costs no tokens.
 */
const SUGGESTED_QUESTIONS = [
  { label: '👋 Hi, who are you?', question: 'Hi, who are you?' },
  { label: 'What are your key skills?', question: 'What are your key skills?' },
  { label: 'Tell me about your work experience.', question: 'Tell me about your work experience.' },
  { label: 'Why should we hire you?', question: 'Why should we hire you?' },
  { label: 'What projects have you built?', question: 'What projects have you built?' },
]

function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h1 className="empty-state-title">MyTwinAI</h1>
      <p className="empty-state-subtitle">
        Ask me anything about Aman's background, skills, experience, or projects.
      </p>
      <div className="empty-state-suggestions">
        {SUGGESTED_QUESTIONS.map(({ label, question }) => (
          <button
            key={question}
            type="button"
            className="suggestion-chip"
            onClick={() => onSuggestionClick(question)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default EmptyState
