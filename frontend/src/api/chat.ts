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
