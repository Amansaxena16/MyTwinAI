import type { HistoryEntry, Source } from '../types/chat'

const API_BASE_URL = 'http://localhost:8000'

export interface AskResponse {
  answer: string
  sources: Source[]
  history: HistoryEntry[]
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
 */
export async function streamQuestion(
  question: string,
  history: HistoryEntry[],
  onToken: (token: string) => void,
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
      if (payload.error) throw new Error(payload.error)
      if (payload.done) return
      if (payload.token) onToken(payload.token)
    }
  }
}
