import './Sidebar.css'
import { profile } from '../data/profile'

interface SidebarProps {
  onNewChat: () => void
}

function Sidebar({ onNewChat }: SidebarProps) {
  return (
    <aside className="sidebar">
      <button className="sidebar-brand" onClick={onNewChat} aria-label="Start a new chat">
        <span className="sidebar-logo" aria-hidden="true">
          <SparkleIcon />
        </span>
        <span className="sidebar-title">MyTwinAI</span>
      </button>

      <div className="profile-card">
        <span className="profile-avatar" aria-hidden="true">
          {profile.initials}
        </span>
        {/* A wrapper only so the card can turn into a row on a phone. It is
            display:contents on desktop, so the layout there is unchanged. */}
        <div className="profile-identity">
          <p className="profile-name">{profile.name}</p>
          <p className="profile-tagline">{profile.tagline}</p>
          <p className="profile-location">
            <PinIcon />
            {profile.location}
          </p>
        </div>

        <div className="profile-links">
          {profile.links.map((link) => (
            <a
              key={link.label}
              className="profile-link"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              title={link.label}
            >
              <LinkIcon name={link.icon} />
            </a>
          ))}
        </div>
      </div>

      <div className="sidebar-spacer" />

      <p className="sidebar-footer">
        Answers come from Aman's own profile, so ask anything about his work.
      </p>
    </aside>
  )
}

function LinkIcon({ name }: { name: string }) {
  if (name === 'github') return <GitHubIcon />
  if (name === 'linkedin') return <LinkedInIcon />
  if (name === 'code') return <CodeIcon />
  return <MailIcon />
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

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 11S10 7.5 10 4.8A4 4 0 0 0 2 4.8C2 7.5 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="4.8" r="1.3" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 8 0Z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.6 0H2.4A2.4 2.4 0 0 0 0 2.4v11.2A2.4 2.4 0 0 0 2.4 16h11.2a2.4 2.4 0 0 0 2.4-2.4V2.4A2.4 2.4 0 0 0 13.6 0ZM5 13H2.9V6.2H5V13Zm-1-7.7a1.2 1.2 0 1 1 0-2.5 1.2 1.2 0 0 1 0 2.5ZM13.1 13H11V9.6c0-.8-.3-1.4-1-1.4-.6 0-.9.4-1 .8v4H6.8s.03-6.2 0-6.8H8.9v1a2.1 2.1 0 0 1 1.9-1c1.4 0 2.3.9 2.3 2.9V13Z" />
    </svg>
  )
}

function CodeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M5.5 4 1.5 8l4 4M10.5 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="m2 5 6 4 6-4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

export default Sidebar
