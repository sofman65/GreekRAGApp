import { ChatAction, ChatState, Conversation, Message } from "../types"

const createWelcomeConversation = (): Conversation => {
  const now = new Date()
  return {
    id: "1",
    title: "Νέα Συνομιλία",
    messages: [
      {
        role: "assistant",
        content:
          "Καλώς ήρθατε στο Ερμής. Είμαι εδώ για να σας βοηθήσω με τους διακλαδικούς κανονισμούς και τα στρατιωτικά έγγραφα. Πώς μπορώ να σας βοηθήσω σήμερα;",
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  }
}

export const initialChatState: ChatState = {
  conversations: [createWelcomeConversation()],
  currentConversationId: "1",
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_CURRENT":
      return { ...state, currentConversationId: action.conversationId }

    case "NEW_CONVERSATION":
      return {
        ...state,
        conversations: [action.conversation, ...state.conversations],
        currentConversationId: action.conversation.id,
      }

    case "DELETE_CONVERSATION": {
      const remaining = state.conversations.filter((c) => c.id !== action.conversationId)
      const nextId = remaining[0]?.id ?? createWelcomeConversation().id
      return {
        ...state,
        conversations: remaining.length ? remaining : [createWelcomeConversation()],
        currentConversationId: nextId,
      }
    }

    case "ADD_USER_MESSAGE":
    case "ADD_ASSISTANT_MESSAGE":
    case "UPDATE_ASSISTANT_MESSAGE":
    case "SET_SOURCES":
    case "SET_MODE":
    case "UPDATE_TITLE": {
      const conversations = state.conversations.map((conv) => {
        if (conv.id !== action.conversationId) return conv

        let updatedMessages = conv.messages

        if (action.type === "ADD_USER_MESSAGE") {
          const message: Message = {
            role: "user",
            content: action.content,
            timestamp: action.timestamp,
          }
          updatedMessages = [...conv.messages, message]
        } else if (action.type === "ADD_ASSISTANT_MESSAGE") {
          const message: Message = {
            role: "assistant",
            content: action.content ?? "",
            timestamp: action.timestamp,
          }
          updatedMessages = [...conv.messages, message]
        } else if (action.type === "UPDATE_ASSISTANT_MESSAGE") {
          const newMessages = [...conv.messages]
          const last = newMessages[newMessages.length - 1]
          if (last?.role === "assistant") {
            newMessages[newMessages.length - 1] = action.updater(last)
          }
          updatedMessages = newMessages
        } else if (action.type === "SET_SOURCES") {
          const newMessages = [...conv.messages]
          const last = newMessages[newMessages.length - 1]
          if (last?.role === "assistant") {
            newMessages[newMessages.length - 1] = {
              ...last,
              sources: action.sources,
              mode: action.mode ?? last.mode,
            }
          }
          updatedMessages = newMessages
        } else if (action.type === "SET_MODE") {
          const newMessages = [...conv.messages]
          const last = newMessages[newMessages.length - 1]
          if (last?.role === "assistant") {
            newMessages[newMessages.length - 1] = { ...last, mode: action.mode }
          }
          updatedMessages = newMessages
        } else if (action.type === "UPDATE_TITLE") {
          // title handled below
        }

        const updatedTitle =
          action.type === "UPDATE_TITLE" ? action.title : conv.title

        return {
          ...conv,
          messages: updatedMessages,
          title: updatedTitle,
          updatedAt: new Date(),
        }
      })

      return { ...state, conversations }
    }

    default:
      return state
  }
}
