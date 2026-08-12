import { useEffect, useRef } from 'react'
import './MessageList.css'
import type { Message } from '../types/chat'

interface MessageListProps {
  messages: Message[]
}

function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <div key={index} className={`message message-${message.role}`}>
          <div className="message-bubble">{message.content}</div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

export default MessageList
