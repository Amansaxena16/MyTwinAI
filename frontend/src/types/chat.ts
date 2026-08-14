export type Role = 'user' | 'assistant'

export interface Source {
  content: string
  doc_type: string | null
}

export interface Message {
  role: Role
  content: string
  /** Questions to offer as the next click. Assistant messages only. */
  followUps?: string[]
}

export interface HistoryEntry {
  role: Role
  content: string
}
