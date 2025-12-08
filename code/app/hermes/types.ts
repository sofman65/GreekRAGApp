export type Role = "user" | "assistant"

export interface Message {
  role: Role
  content: string
  sources?: string[]
  timestamp: Date
  mode?: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface ChatState {
  conversations: Conversation[]
  currentConversationId: string
}

export type ChatAction =
  | { type: "ADD_USER_MESSAGE"; conversationId: string; content: string; timestamp: Date }
  | { type: "ADD_ASSISTANT_MESSAGE"; conversationId: string; content?: string; timestamp: Date }
  | {
      type: "UPDATE_ASSISTANT_MESSAGE"
      conversationId: string
      updater: (msg: Message) => Message
    }
  | { type: "SET_SOURCES"; conversationId: string; sources: string[]; mode?: string }
  | { type: "SET_MODE"; conversationId: string; mode: string }
  | { type: "UPDATE_TITLE"; conversationId: string; title: string }
  | { type: "NEW_CONVERSATION"; conversation: Conversation }
  | { type: "DELETE_CONVERSATION"; conversationId: string }
  | { type: "SET_CURRENT"; conversationId: string }

