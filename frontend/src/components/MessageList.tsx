import { useEffect, useRef } from 'react'
import './MessageList.css'
import type { Message } from '../types/chat'

interface MessageListProps {
  messages: Message[]
  loading?: boolean
}

function MessageList({ messages, loading = false }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <div key={index} className={`message message-${message.role}`}>
          <div className="message-content">
            <div className="message-bubble">{message.content}</div>
            {message.sources && message.sources.length > 0 && (
              <details className="message-sources">
                <summary>Sources ({message.sources.length})</summary>
                <ul>
                  {message.sources.map((source, sourceIndex) => (
                    <li key={sourceIndex}>
                      <span className="source-doc-type">{source.doc_type ?? 'unknown'}</span>
                      <p>{source.content}</p>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      ))}
      {loading && (
        <div className="message message-assistant">
          <div className="message-bubble typing-indicator" aria-label="Assistant is typing">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

export default MessageList
