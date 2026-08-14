import './FollowUps.css'

interface FollowUpsProps {
  questions: string[]
  onSelect?: (question: string) => void
  label?: string
}

/**
 * The questions to offer as the next click. Shown under the newest answer, and
 * under an error, where they are the only way left to get an answer.
 */
function FollowUps({ questions, onSelect, label = 'Ask next' }: FollowUpsProps) {
  if (!onSelect || questions.length === 0) return null

  return (
    <div className="follow-ups">
      <span className="follow-ups-label">{label}</span>
      <div className="follow-ups-list">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            className="follow-up"
            onClick={() => onSelect(question)}
          >
            {question}
            <ArrowIcon />
          </button>
        ))}
      </div>
    </div>
  )
}

function ArrowIcon() {
  return (
    <svg className="follow-up-arrow" width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path
        d="M3 7h8M7.5 3.5 11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default FollowUps
