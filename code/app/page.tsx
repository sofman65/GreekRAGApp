"use client"

import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input"
import { ChatSidebar } from "./hermes/components/ChatSidebar"
import { ChatMessage } from "./hermes/components/ChatMessage"
import { ChatLoading } from "./hermes/components/ChatLoading"
import { useConversations } from "./hermes/hooks/useConversations"
import { useHermesWS } from "./hermes/hooks/useHermesWS"
import { Conversation } from "./hermes/types"
import { cn } from "@/lib/utils"

const placeholders = [
  "Ποιες είναι οι διαδικασίες για άδεια στρατιωτικού προσωπικού;",
  "Πώς εφαρμόζονται οι κανονισμοί ασφαλείας στις εγκαταστάσεις;",
  "Ποια είναι η διαδικασία για την έκδοση στρατιωτικών εγγράφων;",
  "Πώς διεξάγεται η εκπαίδευση νέων στρατιωτών;",
  "Ποιοι είναι οι κανόνες χρήσης στρατιωτικού εξοπλισμού;",
]

export default function HermesChat() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [input, setInput] = useState("")
  const [backendUrl] = useState(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")

  const {
    state,
    currentConversation,
    setCurrentConversation,
    addUserMessage,
    addAssistantMessage,
    updateAssistantMessage,
    setSources,
    updateTitle,
    newConversation,
    deleteConversation,
  } = useConversations()

  const currentConversationId = currentConversation?.id ?? state.currentConversationId
  const messages = currentConversation?.messages || []

  const wsHandlers = useMemo(
    () => ({
      onSources: (sources: string[], mode?: string) => {
        setSources(currentConversationId, sources, mode)
      },
      onToken: (content: string, mode?: string) => {
        updateAssistantMessage(currentConversationId, (msg) => {
          if (mode !== "rag") {
            return { ...msg, content, mode }
          }
          return { ...msg, content: msg.content + content, mode }
        })
      },
      onDone: () => {},
      onError: (msg: string) => {
        updateAssistantMessage(currentConversationId, (m) => ({ ...m, content: `Σφάλμα: ${msg}`, mode: "error" }))
      },
    }),
    [currentConversationId, setSources, updateAssistantMessage],
  )

  const { isConnected, isLoading, sendMessage } = useHermesWS(backendUrl, wsHandlers)

  const handleSend = useCallback(
    async (text?: string) => {
      const messageToSend = text || input
      if (!messageToSend.trim()) return

      const convId = currentConversationId
      const conversation = state.conversations.find((c) => c.id === convId)
      const isFirstUserMessage = conversation ? conversation.messages.length === 1 && conversation.messages[0].role === "assistant" : false

      addUserMessage(convId, messageToSend, new Date())
      if (isFirstUserMessage) {
        updateTitle(convId, messageToSend.slice(0, 40) + (messageToSend.length > 40 ? "..." : ""))
      }
      addAssistantMessage(convId, "", new Date())
      setInput("")
      await sendMessage(messageToSend)
    },
    [addAssistantMessage, addUserMessage, currentConversationId, input, sendMessage, state.conversations, updateTitle],
  )

  const createNewConversation = () => {
    const now = new Date()
    const conv: Conversation = {
      id: Date.now().toString(),
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
    newConversation(conv)
  }

  const handleDeleteConversation = (id: string) => {
    deleteConversation(id)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  const visibleMessages = messages.filter((m) => !(m.role === "assistant" && m.content === ""))
  const lastMessage = visibleMessages[visibleMessages.length - 1]
  const showRetrievalLoader = isLoading && lastMessage?.mode === "rag"
  const showChatLoader = isLoading && !showRetrievalLoader

  return (
    <div className={cn("flex h-screen w-full flex-col md:flex-row overflow-hidden bg-background")}>
      <ChatSidebar
        conversations={state.conversations}
        currentId={currentConversationId}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNewConversation={createNewConversation}
        onDelete={handleDeleteConversation}
        onSelect={setCurrentConversation}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="mx-auto flex w-full max-w-5xl flex-col">
          <ScrollArea className="flex-1 px-6 py-8">
            <div className="space-y-6">
              {visibleMessages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  isLast={index === visibleMessages.length - 1}
                  isLoading={isLoading}
                />
              ))}

              {showRetrievalLoader && <ChatLoading variant="rag" />}
              {!showRetrievalLoader && showChatLoader && <ChatLoading variant="chat" />}
            </div>
          </ScrollArea>

          <div className="border-t border-border bg-card/50 p-4 md:p-6 backdrop-blur-sm">
            <div className="mx-auto max-w-4xl">
              <PlaceholdersAndVanishInput placeholders={placeholders} onChange={(e) => setInput(e.target.value)} onSubmit={(e) => { e.preventDefault(); handleSend(); }} />
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Απόρρητη Επικοινωνία • Εσωτερικό Δίκτυο KETAK • Ερμής v1.0 {isConnected ? "• Online" : "• Offline"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
