import './EmptyState.css'

interface EmptyStateProps {
  onSuggestionClick: (question: string) => void
}

const SUGGESTED_QUESTIONS = [
  'What are your key skills?',
  'Tell me about your work experience.',
  'Why should we hire you?',
  'What projects have you built?',
]

function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h1 className="empty-state-title">MyTwinAI</h1>
      <p className="empty-state-subtitle">
        Ask me anything about Aman's background, skills, experience, or projects.
      </p>
      <div className="empty-state-suggestions">
        {SUGGESTED_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            className="suggestion-chip"
            onClick={() => onSuggestionClick(question)}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}

export default EmptyState
