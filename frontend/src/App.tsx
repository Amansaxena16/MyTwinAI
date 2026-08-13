import { useEffect, useState } from 'react'
import { askQuestion } from './api/chat'
import ChatInput from './components/ChatInput'
import EmptyState from './components/EmptyState'
import MessageList from './components/MessageList'
import Sidebar from './components/Sidebar'
import type { HistoryEntry, Message } from './types/chat'

type Theme = 'light' | 'dark'

function App() {
  const [theme, setTheme] = useState<Theme>('light')
  const [messages, setMessages] = useState<Message[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const handleNewChat = () => {
    setMessages([])
    setHistory([])
    setLoading(false)
    setError(null)
  }

  const handleSend = async (question: string) => {
    setError(null)
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setLoading(true)

    try {
      const response = await askQuestion(question, history)
      setMessages((prev) => [...prev, { role: 'assistant', content: response.answer }])
      setHistory(response.history)
    } catch (err) {
      console.error('Failed to get response', err)
      setError('Something went wrong while getting a response. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Sidebar theme={theme} onToggleTheme={toggleTheme} onNewChat={handleNewChat} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState onSuggestionClick={handleSend} />
            </div>
          ) : (
            <MessageList messages={messages} loading={loading} />
          )}
        </div>
        {error && (
          <p
            style={{
              color: 'var(--color-danger)',
              textAlign: 'center',
              fontSize: 15,
              margin: '0 24px 8px',
            }}
          >
            {error}
          </p>
        )}
        <ChatInput onSend={handleSend} loading={loading} />
      </main>
    </div>
  )
}

export default App
