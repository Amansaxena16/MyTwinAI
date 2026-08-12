import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import './ChatInput.css'

interface ChatInputProps {
  onSend: (question: string) => void
  loading: boolean
}

function ChatInput({ onSend, loading }: ChatInputProps) {
  const [value, setValue] = useState('')

  const submit = () => {
    const question = value.trim()
    if (!question || loading) return
    onSend(question)
    setValue('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="chat-input">
      <textarea
        className="chat-input-textarea"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about Aman's experience, skills, or projects..."
        rows={1}
        disabled={loading}
      />
      <button
        type="button"
        className="chat-input-send"
        onClick={submit}
        disabled={loading || !value.trim()}
        aria-label="Send"
      >
        <SendIcon />
      </button>
    </div>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 8L14 2L9.5 14L7.5 9L2 8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default ChatInput
