import { useState } from 'react'
import './App.css'
import { streamQuestion } from './api/chat'
import ChatInput from './components/ChatInput'
import EmptyState from './components/EmptyState'
import MessageList from './components/MessageList'
import Sidebar from './components/Sidebar'
import type { HistoryEntry, Message } from './types/chat'

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNewChat = () => {
    setMessages([])
    setLoading(false)
    setError(null)
  }

  /**
   * Asks a question on top of `baseMessages`, which become the history sent to
   * the backend. Regenerating just replays with a shorter base.
   */
  const sendQuestion = async (question: string, baseMessages: Message[]) => {
    setError(null)
    setLoading(true)

    const history: HistoryEntry[] = baseMessages.map(({ role, content }) => ({ role, content }))
    // The empty assistant message is the slot the streamed tokens land in.
    setMessages([...baseMessages, { role: 'user', content: question }, { role: 'assistant', content: '' }])

    let answer = ''
    try {
      await streamQuestion(question, history, (token) => {
        answer += token
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: answer }
          return next
        })
      })
    } catch (err) {
      console.error('Failed to get response', err)
      setError('Something went wrong while getting a response. Please try again.')
      // Drop the placeholder so an empty bubble is not left behind.
      if (!answer) {
        setMessages([...baseMessages, { role: 'user', content: question }])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSend = (question: string) => sendQuestion(question, messages)

  const handleRegenerate = () => {
    if (loading) return
    const lastUserIndex = messages.map((message) => message.role).lastIndexOf('user')
    if (lastUserIndex === -1) return
    sendQuestion(messages[lastUserIndex].content, messages.slice(0, lastUserIndex))
  }

  return (
    <div className="app">
      <Sidebar onNewChat={handleNewChat} />
      <main className="app-main">
        <div className="app-body">
          {messages.length === 0 ? (
            <div className="app-empty">
              <EmptyState onSuggestionClick={handleSend} />
            </div>
          ) : (
            <MessageList
              messages={messages}
              loading={loading}
              onRegenerate={handleRegenerate}
            />
          )}
        </div>
        {error && <div className="app-error">{error}</div>}
        <ChatInput onSend={handleSend} loading={loading} />
      </main>
    </div>
  )
}

export default App
