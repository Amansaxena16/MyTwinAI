import { useState } from 'react'
import './App.css'
import { ChatError, streamQuestion } from './api/chat'
import ChatInput from './components/ChatInput'
import EmptyState from './components/EmptyState'
import FollowUps from './components/FollowUps'
import MessageList from './components/MessageList'
import Sidebar from './components/Sidebar'
import type { HistoryEntry, Message } from './types/chat'

// Chips are a way in, not a rail to ride the whole way. Past the first few
// answers a visitor knows what to ask, and the suggestions start reading like
// the conversation is on tracks.
const MAX_ANSWERS_WITH_FOLLOW_UPS = 5

// The free host parks the server when nobody has visited for a while, and the
// first question has to wait for it to start again. Saying so beats a silent
// pause that reads as broken.
const WAKING_NOTE = 'Waking the server up — this can take up to a minute on the first question.'

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Shown with the error, since a failed answer leaves no message to hang them on.
  const [errorFollowUps, setErrorFollowUps] = useState<string[]>([])
  const [waking, setWaking] = useState(false)

  const handleNewChat = () => {
    setMessages([])
    setLoading(false)
    setError(null)
    setErrorFollowUps([])
    setWaking(false)
  }

  /**
   * Asks a question on top of `baseMessages`, which become the history sent to
   * the backend. Regenerating just replays with a shorter base.
   */
  const sendQuestion = async (question: string, baseMessages: Message[]) => {
    setError(null)
    setErrorFollowUps([])
    setWaking(false)
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
          // The server answered, so whatever wait there was is over.
          setWaking(false)
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
        () => setWaking(true),
      )
    } catch (err) {
      console.error('Failed to get response', err)
      if (err instanceof ChatError) {
        setError(err.message)
        setErrorFollowUps(err.followUps)
      } else {
        setError('Something went wrong while getting a response. Please try again.')
      }
      // Drop the placeholder so an empty bubble is not left behind.
      if (!answer) {
        setMessages([...baseMessages, { role: 'user', content: question }])
      }
    } finally {
      setLoading(false)
      setWaking(false)
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
              waitingNote={waking ? WAKING_NOTE : undefined}
              onRegenerate={handleRegenerate}
              onSuggestionClick={handleSend}
            />
          )}
        </div>
        {error && (
          <div className="app-error">
            <p className="app-error-text">{error}</p>
            <FollowUps
              questions={errorFollowUps}
              onSelect={handleSend}
              label="Try one of these"
            />
          </div>
        )}
        <ChatInput onSend={handleSend} loading={loading} />
      </main>
    </div>
  )
}

export default App
