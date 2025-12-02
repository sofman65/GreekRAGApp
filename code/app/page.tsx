"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TextareaAutosize } from "@/components/ui/textarea-autosize"
import { ChatSidebar } from "./hermes/components/ChatSidebar"
import { ChatMessage } from "./hermes/components/ChatMessage"
import { ChatLoading } from "./hermes/components/ChatLoading"
import { EmptyState } from "./hermes/components/EmptyState"
import { SettingsModal } from "./hermes/components/SettingsModal"
import { useConversations } from "./hermes/hooks/useConversations"
import { useHermesWS } from "./hermes/hooks/useHermesWS"
import { Conversation } from "./hermes/types"
import { cn } from "@/lib/utils"
import { Send, Square, ArrowDown } from "lucide-react"

export default function HermesChat() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [input, setInput] = useState("")
  const [backendUrl] = useState(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const { isConnected, isLoading, sendMessage, stopGeneration } = useHermesWS(backendUrl, wsHandlers)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (isLoading || messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length, isLoading, scrollToBottom])

  // Handle scroll to show/hide scroll button
  const handleScroll = useCallback((e: any) => {
    const element = e.target
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100
    setShowScrollButton(!isNearBottom && messages.length > 0)
  }, [messages.length])

  const handleSend = useCallback(
    async (text?: string) => {
      const messageToSend = text || input
      if (!messageToSend.trim() || isLoading) return

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
    [addAssistantMessage, addUserMessage, currentConversationId, input, isLoading, sendMessage, state.conversations, updateTitle],
  )

  const handleRegenerate = useCallback(() => {
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()
    if (lastUserMessage && !isLoading) {
      handleSend(lastUserMessage.content)
    }
  }, [handleSend, isLoading, messages])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
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
  const showEmptyState = visibleMessages.length === 0 || (visibleMessages.length === 1 && visibleMessages[0].role === "assistant" && visibleMessages[0].content.includes("Καλώς ήρθατε"))

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
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      <div className="flex flex-1 overflow-hidden">
        <div className="mx-auto flex w-full max-w-5xl flex-col relative">
          <ScrollArea className="flex-1 px-6 py-8" onScrollCapture={handleScroll}>
            {showEmptyState ? (
              <EmptyState onPromptClick={handleSend} />
            ) : (
              <div className="space-y-6">
                {visibleMessages.map((message, index) => (
                  <ChatMessage
                    key={index}
                    message={message}
                    isLast={index === visibleMessages.length - 1}
                    isLoading={isLoading}
                    onRegenerate={handleRegenerate}
                  />
                ))}

                {showRetrievalLoader && <ChatLoading variant="rag" />}
                {!showRetrievalLoader && showChatLoader && <ChatLoading variant="chat" />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {showScrollButton && (
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-32 right-8 rounded-full shadow-lg z-10"
              onClick={scrollToBottom}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}

          <div className="border-t border-border bg-card/50 p-4 md:p-6 backdrop-blur-sm">
            <div className="mx-auto max-w-4xl">
              <div className="relative flex items-end gap-2 rounded-lg border border-border bg-background p-2 shadow-sm">
                <TextareaAutosize
                  placeholder="Γράψτε το μήνυμά σας... (Shift+Enter για νέα γραμμή)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  minRows={1}
                  maxRows={6}
                  disabled={isLoading}
                  className="flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                
                {isLoading ? (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="shrink-0 h-10 w-10"
                    onClick={stopGeneration}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    disabled={!input.trim()}
                    onClick={() => handleSend()}
                    className="shrink-0 h-10 w-10 bg-accent hover:bg-accent/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
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
