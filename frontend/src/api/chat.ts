import type { HistoryEntry, Source } from '../types/chat'

// Set VITE_API_BASE_URL in Vercel to the Hugging Face Space URL. Falls back to
// the local backend so nothing needs configuring during development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

/**
 * An error the backend wrote for the visitor to read, such as having run out
 * of daily tokens. Safe to show as-is, unlike a network or parsing failure.
 * Carries the follow up questions, which are the way out of a rate limit.
 */
export class ChatError extends Error {
  followUps: string[]

  constructor(message: string, followUps: string[] = []) {
    super(message)
    this.followUps = followUps
  }
}

export interface AskResponse {
  answer: string
  sources: Source[]
  history: HistoryEntry[]
  follow_ups: string[]
}

export async function askQuestion(
  question: string,
  history: HistoryEntry[],
): Promise<AskResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat/ask/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history }),
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}

/**
 * Streams the answer over SSE, calling onToken for each chunk as it arrives.
 * onFollowUps fires once at the end, with the questions to offer next.
 */
export async function streamQuestion(
  question: string,
  history: HistoryEntry[],
  onToken: (token: string) => void,
  onFollowUps?: (questions: string[]) => void,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/chat/stream/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history }),
  })

  if (!response.ok || !response.body) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE events are separated by a blank line; keep any partial tail buffered.
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const event of events) {
      const line = event.trim()
      if (!line.startsWith('data:')) continue

      const payload = JSON.parse(line.slice('data:'.length).trim())
      if (payload.error) throw new ChatError(payload.error, payload.follow_ups ?? [])
      if (payload.done) return
      if (payload.token) onToken(payload.token)
      if (payload.follow_ups) onFollowUps?.(payload.follow_ups)
    }
  }
}
