import type { HistoryEntry, Source } from '../types/chat'

// Set VITE_API_BASE_URL in Vercel to the backend URL. Falls back to the local
// backend so nothing needs configuring during development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

/**
 * Statuses that mean the host has no container running yet rather than that the
 * app said no. A free Render instance parks itself when idle, and until it is
 * back up the edge answers immediately with 404 and `x-render-routing:
 * no-server` - so the first visitor after a quiet spell would otherwise see an
 * error rather than a wait. A genuinely wrong URL also 404s and will retry
 * pointlessly before failing, which only costs time during development.
 */
const COLD_START_STATUSES = [404, 502, 503, 504]

// Roughly 55 seconds in total. The first couple of tries are quick because the
// container is often already awake and only the routing lagged; after that
// there is no point asking faster than it can boot.
const COLD_START_RETRY_DELAYS_MS = [
  500, 1500, 3000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000,
]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

/**
 * POSTs to the backend, waiting out a sleeping host rather than failing on it.
 * `onWaking` fires before the first retry, so the caller can explain the pause
 * instead of leaving the visitor watching nothing.
 */
async function postWithWakeRetry(
  path: string,
  body: unknown,
  onWaking?: () => void,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    let response: Response | null = null
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch {
      // A network-level failure looks the same to us as a host still booting.
    }

    if (response && !COLD_START_STATUSES.includes(response.status)) return response

    if (attempt >= COLD_START_RETRY_DELAYS_MS.length) {
      if (response) return response
      throw new Error('Could not reach the server')
    }

    onWaking?.()
    await sleep(COLD_START_RETRY_DELAYS_MS[attempt])
  }
}

export async function askQuestion(
  question: string,
  history: HistoryEntry[],
  onWaking?: () => void,
): Promise<AskResponse> {
  const response = await postWithWakeRetry('/api/chat/ask/', { question, history }, onWaking)

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
  onWaking?: () => void,
): Promise<void> {
  const response = await postWithWakeRetry('/api/chat/stream/', { question, history }, onWaking)

  if (!response.ok || !response.body) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  // Past this point the answer has started arriving, so a failure is real and
  // must not be retried - the visitor has already seen part of the reply.
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
