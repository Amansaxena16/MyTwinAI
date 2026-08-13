import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
      <div className="message-list-inner">
        {messages.map((message, index) =>
          message.role === 'user' ? (
            <div key={index} className="message message-user">
              <div className="message-bubble">{message.content}</div>
            </div>
          ) : (
            <div key={index} className="message message-assistant">
              <div className="markdown">
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
            </div>
          ),
        )}
        {loading && (
          <div className="message message-assistant">
            <div className="typing-indicator" aria-label="Assistant is typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default MessageList
