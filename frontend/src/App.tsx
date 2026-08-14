import { useState } from 'react'
import './App.css'
import { ChatError, streamQuestion } from './api/chat'
import ChatInput from './components/ChatInput'
import EmptyState from './components/EmptyState'
import MessageList from './components/MessageList'
import Sidebar from './components/Sidebar'
import type { HistoryEntry, Message } from './types/chat'

// Chips are a way in, not a rail to ride the whole way. Past the first few
// answers a visitor knows what to ask, and the suggestions start reading like
// the conversation is on tracks.
const MAX_ANSWERS_WITH_FOLLOW_UPS = 5

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

    // This answer is the one after the ones already on screen.
    const answerNumber = baseMessages.filter((m) => m.role === 'assistant').length + 1
    const wantsFollowUps = answerNumber <= MAX_ANSWERS_WITH_FOLLOW_UPS

    let answer = ''
    try {
      await streamQuestion(
        question,
        history,
        (token) => {
          answer += token
          setMessages((prev) => {
            const next = [...prev]
            next[next.length - 1] = { role: 'assistant', content: answer }
            return next
          })
        },
        (followUps) => {
          if (!wantsFollowUps) return
          setMessages((prev) => {
            const next = [...prev]
            next[next.length - 1] = { role: 'assistant', content: answer, followUps }
            return next
          })
        },
      )
    } catch (err) {
      console.error('Failed to get response', err)
      setError(
        err instanceof ChatError
          ? err.message
          : 'Something went wrong while getting a response. Please try again.',
      )
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
              onSuggestionClick={handleSend}
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
