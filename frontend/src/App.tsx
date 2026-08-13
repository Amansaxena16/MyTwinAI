import { useEffect, useState } from 'react'
import './App.css'
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
    <div className="app">
      <Sidebar theme={theme} onToggleTheme={toggleTheme} onNewChat={handleNewChat} />
      <main className="app-main">
        <div className="app-body">
          {messages.length === 0 ? (
            <div className="app-empty">
              <EmptyState onSuggestionClick={handleSend} />
            </div>
          ) : (
            <MessageList messages={messages} loading={loading} />
          )}
        </div>
        {error && <div className="app-error">{error}</div>}
        <ChatInput onSend={handleSend} loading={loading} />
      </main>
    </div>
  )
}

export default App
