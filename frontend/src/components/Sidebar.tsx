import './Sidebar.css'

interface SidebarProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onNewChat: () => void
}

function Sidebar({ theme, onToggleTheme, onNewChat }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <span className="sidebar-logo" aria-hidden="true">
          <SparkleIcon />
        </span>
        <span className="sidebar-title">MyTwinAI</span>
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        <PlusIcon />
        New Chat
      </button>

      <div className="sidebar-spacer" />

      <div className="sidebar-footer">Aman Saxena · Full Stack Developer</div>
    </aside>
  )
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"
        fill="currentColor"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M7 0.5V2M7 12V13.5M13.5 7H12M2 7H0.5M11.5 2.5L10.5 3.5M3.5 10.5L2.5 11.5M11.5 11.5L10.5 10.5M3.5 3.5L2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M12.5 8.5A5.5 5.5 0 1 1 5.5 1.5a4.4 4.4 0 0 0 7 7Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Sidebar
