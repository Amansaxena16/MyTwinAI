import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import type { HistoryEntry, Message } from './types/chat'

type Theme = 'light' | 'dark'

function App() {
  const [theme, setTheme] = useState<Theme>('light')
  const [messages, setMessages] = useState<Message[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(false)

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
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Sidebar theme={theme} onToggleTheme={toggleTheme} onNewChat={handleNewChat} />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>MyTwinAI</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {messages.length === 0
              ? 'Empty state comes next.'
              : `${messages.length} message(s), ${history.length} in history.`}
          </p>
          {loading && <p style={{ color: 'var(--color-text-muted)' }}>Thinking…</p>}
        </div>
      </main>
    </div>
  )
}

export default App
