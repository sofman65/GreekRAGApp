import { useReducer } from "react"
import { chatReducer, initialChatState } from "../reducer/chatReducer"
import { ChatState, Conversation } from "../types"

export function useConversations() {
  const [state, dispatch] = useReducer(chatReducer, initialChatState)

  const currentConversation =
    state.conversations.find((c) => c.id === state.currentConversationId) || state.conversations[0]

  const setCurrentConversation = (conversationId: string) =>
    dispatch({ type: "SET_CURRENT", conversationId })

  const addUserMessage = (conversationId: string, content: string, timestamp = new Date()) =>
    dispatch({ type: "ADD_USER_MESSAGE", conversationId, content, timestamp })

  const addAssistantMessage = (conversationId: string, content = "", timestamp = new Date()) =>
    dispatch({ type: "ADD_ASSISTANT_MESSAGE", conversationId, content, timestamp })

  const updateAssistantMessage = (conversationId: string, updater: any) =>
    dispatch({ type: "UPDATE_ASSISTANT_MESSAGE", conversationId, updater })

  const setSources = (conversationId: string, sources: string[], mode?: string) =>
    dispatch({ type: "SET_SOURCES", conversationId, sources, mode })

  const setMode = (conversationId: string, mode: string) =>
    dispatch({ type: "SET_MODE", conversationId, mode })

  const updateTitle = (conversationId: string, title: string) =>
    dispatch({ type: "UPDATE_TITLE", conversationId, title })

  const newConversation = (conversation: Conversation) =>
    dispatch({ type: "NEW_CONVERSATION", conversation })

  const deleteConversation = (conversationId: string) =>
    dispatch({ type: "DELETE_CONVERSATION", conversationId })

  return {
    state,
    currentConversation,
    setCurrentConversation,
    addUserMessage,
    addAssistantMessage,
    updateAssistantMessage,
    setSources,
    setMode,
    updateTitle,
    newConversation,
    deleteConversation,
  }
}
