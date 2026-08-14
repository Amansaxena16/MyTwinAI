import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './MessageList.css'
import FollowUps from './FollowUps'
import type { Message } from '../types/chat'

interface MessageListProps {
  messages: Message[]
  loading?: boolean
  onRegenerate?: () => void
  onSuggestionClick?: (question: string) => void
}

function MessageList({
  messages,
  loading = false,
  onRegenerate,
  onSuggestionClick,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="message-list">
      <div className="message-list-inner">
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1

          if (message.role === 'user') {
            return (
              <div key={index} className="message message-user">
                <div className="message-bubble">{message.content}</div>
              </div>
            )
          }

          // An assistant message with no text yet is one still being streamed.
          if (!message.content) {
            return (
              <div key={index} className="message message-assistant">
                <div className="typing-indicator" aria-label="Assistant is typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )
          }

          const isStreaming = loading && isLast

          return (
            <div key={index} className="message message-assistant">
              <div className="message-body">
                <div className={isStreaming ? 'markdown is-streaming' : 'markdown'}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                {!isStreaming && (
                  <MessageActions
                    content={message.content}
                    onRegenerate={isLast ? onRegenerate : undefined}
                  />
                )}
                {/* Only under the newest answer: older ones have been answered past. */}
                {isLast && !loading && message.followUps && message.followUps.length > 0 && (
                  <FollowUps questions={message.followUps} onSelect={onSuggestionClick} />
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

interface MessageActionsProps {
  content: string
  onRegenerate?: () => void
}

function MessageActions({ content, onRegenerate }: MessageActionsProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
    } catch (err) {
      console.error('Could not copy the answer', err)
    }
  }

  return (
    <div className="message-actions">
      <button
        type="button"
        className="message-action"
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy answer'}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      {onRegenerate && (
        <button
          type="button"
          className="message-action"
          onClick={onRegenerate}
          aria-label="Regenerate answer"
        >
          <RefreshIcon />
          Retry
        </button>
      )}
    </div>
  )
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <rect x="4.5" y="4.5" width="8" height="8" rx="1.8" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M9.5 4.5v-1a1.8 1.8 0 0 0-1.8-1.8H3.3A1.8 1.8 0 0 0 1.5 3.5v4.4a1.8 1.8 0 0 0 1.8 1.8h1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path
        d="m2.5 7.5 3 3 6-7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path
        d="M12 7a5 5 0 1 1-1.5-3.6M12 1.5V4H9.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default MessageList
