export type Role = 'user' | 'assistant'

export interface Source {
  content: string
  doc_type: string | null
}

export interface Message {
  role: Role
  content: string
  sources?: Source[]
}

export interface HistoryEntry {
  role: Role
  content: string
}
