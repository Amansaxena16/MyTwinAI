import './Sidebar.css'

interface SidebarProps {
  onNewChat: () => void
}

function Sidebar({ onNewChat }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <span className="sidebar-logo" aria-hidden="true">
          <SparkleIcon />
        </span>
        <span className="sidebar-title">MyTwinAI</span>
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

export default Sidebar
