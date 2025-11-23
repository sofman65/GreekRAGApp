"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { FileText, Loader2, Upload, AlertCircle, Plus, MessageSquare, Trash2, Search } from "lucide-react"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input"
import { Input } from "@/components/ui/input"
import { TextGenerateEffect } from "@/components/ui/text-generate-effect"
import { Logo } from "@/components/logo"

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: string[]
  timestamp: Date
  mode?: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export default function HermesChat() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Νέα Συνομιλία",
      messages: [
        {
          role: "assistant",
          content:
            "Καλώς ήρθατε στο Ερμής. Είμαι εδώ για να σας βοηθήσω με τους διακλαδικούς κανονισμούς και τα στρατιωτικά έγγραφα. Πώς μπορώ να σας βοηθήσω σήμερα;",
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])
  const [currentConversationId, setCurrentConversationId] = useState<string>("1")
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentConversation = conversations.find((c) => c.id === currentConversationId)
  const messages = currentConversation?.messages || []

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null)
  const [showSetupInstructions, setShowSetupInstructions] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [backendUrl] = useState(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 3

  const updateAssistantMessage = (cb: (msg: Message) => void) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== currentConversationId) return conv
        const newMessages = [...conv.messages]
        const lastMsg = newMessages[newMessages.length - 1]
        if (lastMsg?.role === "assistant") {
          cb(lastMsg)
        }
        return { ...conv, messages: newMessages, updatedAt: new Date() }
      }),
    )
  }

  const addAssistantError = (msg: string) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== currentConversationId) return conv
        return {
          ...conv,
          messages: [
            ...conv.messages,
            { role: "assistant", content: msg, timestamp: new Date(), mode: "error" },
          ],
        }
      }),
    )
  }

  const placeholders = [
    "Ποιες είναι οι διαδικασίες για άδεια στρατιωτικού προσωπικού;",
    "Πώς εφαρμόζονται οι κανονισμοί ασφαλείας στις εγκαταστάσεις;",
    "Ποια είναι η διαδικασία για την έκδοση στρατιωτικών εγγράφων;",
    "Πώς διεξάγεται η εκπαίδευση νέων στρατιωτών;",
    "Ποιοι είναι οι κανόνες χρήσης στρατιωτικού εξοπλισμού;",
  ]

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/health`, {
          method: "GET",
          signal: AbortSignal.timeout(2000),
        })
        if (response.ok) {
          setBackendAvailable(true)
        } else {
          setBackendAvailable(false)
        }
      } catch (error) {
        setBackendAvailable(false)
      }
    }

    checkBackend()
  }, [backendUrl])

  // useEffect(() => {
  //   const token = localStorage.getItem("token")
  //   if (!token) {
  //     window.location.href = "/login"
  //   }
  // }, [])

  useEffect(() => {
    if (backendAvailable === false) {
      return
    }

    const connectWebSocket = () => {
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.log("[v0] Max WebSocket reconnection attempts reached")
        setBackendAvailable(false)
        return
      }

      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
        const websocket = new WebSocket(`${wsUrl}/api/ws/chat`)

        websocket.onopen = () => {
          setIsConnected(true)
          setBackendAvailable(true)
          reconnectAttempts.current = 0
        }

        websocket.onclose = () => {
          setIsConnected(false)
          reconnectAttempts.current++

          if (reconnectAttempts.current < maxReconnectAttempts) {
            setTimeout(connectWebSocket, 3000)
          } else {
            setBackendAvailable(false)
          }
        }

        websocket.onerror = () => {
          setIsConnected(false)
        }

        websocket.onmessage = (event) => {
          const data = JSON.parse(event.data)

          if (data.type === "sources") {
            updateAssistantMessage((lastMsg) => {
              lastMsg.sources = data.sources?.map((s: any) => s.source) || []
              lastMsg.mode = data.mode
            })
          } else if (data.type === "token") {
            updateAssistantMessage((lastMsg) => {
              if (data.mode !== "rag") {
                lastMsg.content = data.content
              } else {
                lastMsg.content += data.content
              }
              lastMsg.mode = data.mode
            })
            if (data.mode !== "rag") {
              setIsLoading(false)
            }
          } else if (data.type === "done") {
            setIsLoading(false)
          } else if (data.type === "error") {
            addAssistantError(`Σφάλμα: ${data.content}`)
            setIsLoading(false)
          }
        }

        setWs(websocket)
      } catch (error) {
        setIsConnected(false)
        setBackendAvailable(false)
      }
    }

    connectWebSocket()

    return () => {
      ws?.close()
    }
  }, [backendAvailable, currentConversationId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "Νέα Συνομιλία",
      messages: [
        {
          role: "assistant",
          content:
            "Καλώς ήρθατε στο Ερμής. Είμαι εδώ για να σας βοηθήσω με τους διακλαδικούς κανονισμούς και τα στρατιωτικά έγγραφα. Πώς μπορώ να σας βοηθήσω σήμερα;",
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setConversations((prev) => [newConv, ...prev])
    setCurrentConversationId(newConv.id)
  }

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (currentConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id)
      if (remaining.length > 0) {
        setCurrentConversationId(remaining[0].id)
      } else {
        createNewConversation()
      }
    }
  }

  const updateConversationTitle = (id: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? "..." : "")
    setConversations((prev) => prev.map((conv) => (conv.id === id ? { ...conv, title } : conv)))
  }

  const sendMessage = async (messageText?: string) => {
    const messageToSend = messageText || input
    if (!messageToSend.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
    }

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === currentConversationId) {
          const isFirstUserMessage = conv.messages.length === 1 && conv.messages[0].role === "assistant"
          if (isFirstUserMessage) {
            updateConversationTitle(conv.id, messageToSend)
          }
          return {
            ...conv,
            messages: [...conv.messages, userMessage],
            updatedAt: new Date(),
          }
        }
        return conv
      }),
    )

    const question = messageToSend
    setInput("")
    setIsLoading(true)

    if (backendAvailable === false) {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              messages: [
                ...conv.messages,
                {
                  role: "assistant",
                  content:
                    "🔧 Το backend δεν είναι διαθέσιμο. Για να χρησιμοποιήσετε το πλήρες σύστημα RAG:\n\n" +
                    "1. Εγκαταστήστε το Ollama και τα μοντέλα\n" +
                    "2. Εκκινήστε το Weaviate (Docker)\n" +
                    "3. Τρέξτε: python scripts/main.py\n\n" +
                    "Δείτε το README.md για αναλυτικές οδηγίες.",
                  timestamp: new Date(),
                },
              ],
              updatedAt: new Date(),
            }
          }
          return conv
        }),
      )
      setIsLoading(false)
      return
    }

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [
              ...conv.messages,
              {
                role: "assistant",
                content: "",
                timestamp: new Date(),
              },
            ],
            updatedAt: new Date(),
          }
        }
        return conv
      }),
    )

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ question }))
    } else {
      try {
        const response = await fetch(`${backendUrl}/api/query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question }),
        })

        if (!response.ok) throw new Error("Failed to fetch")

        const data = await response.json()

        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === currentConversationId) {
              const newMessages = [...conv.messages]
              const lastMsg = newMessages[newMessages.length - 1]
          if (lastMsg && lastMsg.role === "assistant") {
            lastMsg.content = data.answer || "Συγγνώμη, δεν μπόρεσα να επεξεργαστώ την ερώτηση."
            lastMsg.sources = data.sources?.map((s: any) => s.source) || []
            lastMsg.mode = data.mode
          }
          return { ...conv, messages: newMessages, updatedAt: new Date() }
        }
        return conv
      }),
    )
        if (data.mode && data.mode !== "rag") {
          setIsLoading(false)
        }
      } catch (error) {
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === currentConversationId) {
              const newMessages = [...conv.messages]
              const lastMsg = newMessages[newMessages.length - 1]
              if (lastMsg && lastMsg.role === "assistant") {
                lastMsg.content =
                  "Σφάλμα σύνδεσης με το backend. Παρακαλώ ελέγξτε ότι το FastAPI server τρέχει στο http://localhost:8000"
              }
              return { ...conv, messages: newMessages, updatedAt: new Date() }
            }
            return conv
          }),
        )
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleInputSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    sendMessage()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleLogout = async () => {
    const token = localStorage.getItem("token")
    try {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: "POST",
        headers,
      })
    } catch (error) {
      console.error("Logout request failed", error)
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
  }

  const visibleMessages = messages.filter((m) => !(m.role === "assistant" && m.content === ""))
  const lastMessage = visibleMessages[visibleMessages.length - 1]
  const showRetrievalLoader = isLoading && lastMessage?.mode === "rag"
  const showChatLoader =
    isLoading && !showRetrievalLoader && (lastMessage?.mode === "chat" || lastMessage?.mode === undefined)

  return (
    <div className={cn("flex h-screen w-full flex-col md:flex-row overflow-hidden bg-background")}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-6">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* Logo */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo className="h-12 w-12" />
                </div>
                {sidebarOpen && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">Ερμής</span>
                    <span className="text-xs text-muted-foreground">RAG System</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* New Chat Button */}
            <Button
              onClick={createNewConversation}
              className={cn("mb-4 w-full gap-2", sidebarOpen ? "justify-start" : "justify-center px-0")}
              variant="default"
            >
              <Plus className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Νέα Συνομιλία</span>}
            </Button>

            {/* Search */}
            {sidebarOpen && (
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Αναζήτηση..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            {/* Conversation List */}
            <div className="flex flex-col gap-2">
              {sidebarOpen && (
                <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Συνομιλίες</div>
              )}
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-1">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg p-2 transition-colors bg-black/40 dark:bg-black/60 hover:bg-accent",
                        currentConversationId === conv.id && "bg-accent",
                        !sidebarOpen && "justify-center",
                      )}
                    >
                      <button
                        onClick={() => setCurrentConversationId(conv.id)}
                        className={cn(
                          "flex items-center gap-2 overflow-hidden text-left",
                          sidebarOpen ? "flex-1" : "shrink-0",
                        )}
                      >
                        <MessageSquare className="h-5 w-5 shrink-0 text-muted-foreground" />
                        {sidebarOpen && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="truncate text-sm text-white"
                          >
                            {conv.title}
                          </motion.span>
                        )}
                      </button>
                      {sidebarOpen && conversations.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteConversation(conv.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-2">
            {sidebarOpen && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Αποσύνδεση
              </Button>
            )}
            <SidebarLink
              link={{
                label: "Χειριστής ΕΔ",
                href: "#",
                icon: (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                    ΧΡ
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col bg-background overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-lg md:text-xl font-bold leading-tight text-foreground truncate">
                  {currentConversation?.title || "Ερμής"}
                </h1>
                <p className="hidden lg:block text-xs text-muted-foreground whitespace-nowrap">
                  Σύστημα RAG Ελληνικών Ενόπλων Δυνάμεων
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="gap-1.5 text-xs">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isConnected
                      ? "bg-green-500 animate-pulse"
                      : backendAvailable === false
                        ? "bg-red-500"
                        : "bg-yellow-500 animate-pulse"
                  }`}
                />
                <span className="hidden sm:inline">
                  {isConnected ? "Συνδεδεμένο" : backendAvailable === false ? "Offline" : "Σύνδεση..."}
                </span>
              </Badge>
              {backendAvailable === false && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSetupInstructions(!showSetupInstructions)}
                  className="text-xs hidden sm:flex"
                >
                  <AlertCircle className="mr-1 h-4 w-4" />
                  Οδηγίες
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Upload className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {backendAvailable === false && showSetupInstructions && (
          <div className="border-b border-border bg-yellow-500/10 px-6 py-4">
            <div className="mx-auto max-w-5xl">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <AlertCircle className="h-4 w-4" />
                Backend Setup Required
              </h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Για να ενεργοποιήσετε το πλήρες σύστημα RAG:</p>
                <ol className="ml-4 list-decimal space-y-1">
                  <li>Εγκαταστήστε Ollama και κατεβάστε τα μοντέλα (llama3.2, nomic-embed-text)</li>
                  <li>Εκκινήστε Weaviate: docker run -p 8080:8080 semitechnologies/weaviate:1.32.1</li>
                  <li>Εγκαταστήστε dependencies: pip install -r scripts/requirements.txt</li>
                  <li>Τρέξτε backend: python scripts/main.py</li>
                </ol>
                <p className="mt-2">
                  Δείτε το <span className="font-semibold">README.md</span> για περισσότερες λεπτομέρειες.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex flex-1 overflow-hidden">
          <div className="mx-auto flex w-full max-w-5xl flex-col">
            <ScrollArea className="flex-1 px-6 py-8" ref={scrollRef}>
              <div className="space-y-6">
                {visibleMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Logo className="h-5 w-5" />
                      </div>
                    )}

                    <div
                      className={`flex max-w-[70%] flex-col gap-2 ${
                        message.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <Card
                        className={`px-4 py-3 ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"
                        }`}
                      >
                        {message.role === "assistant" &&
                        message.content &&
                        isLoading &&
                        index === messages.length - 1 ? (
                          <TextGenerateEffect
                            words={message.content}
                            className="font-normal text-sm leading-relaxed"
                            filter={true}
                            duration={0.3}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap text-pretty text-sm leading-relaxed">{message.content}</p>
                        )}
                      </Card>

                      {message.sources && message.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {message.sources.slice(0, 3).map((source, i) => (
                            <Badge key={i} variant="secondary" className="gap-1 text-xs">
                              <FileText className="h-3 w-3" />
                              Πηγή {i + 1}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString("el-GR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {message.role === "user" && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                        <div className="text-sm font-semibold">ΧΡ</div>
                      </div>
                    )}
                  </div>
                ))}

                {showRetrievalLoader && (
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Logo className="h-5 w-5" />
                    </div>
                    <Card className="flex items-center gap-2 bg-card px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Αναζήτηση σε έγγραφα...</span>
                    </Card>
                  </div>
                )}
                {!showRetrievalLoader && showChatLoader && (
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Logo className="h-5 w-5" />
                    </div>
                    <Card className="flex items-center gap-2 bg-card px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Σκέφτομαι την απάντηση...</span>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-border bg-card/50 p-4 md:p-6 backdrop-blur-sm">
              <div className="mx-auto max-w-4xl">
                <PlaceholdersAndVanishInput
                  placeholders={placeholders}
                  onChange={handleInputChange}
                  onSubmit={handleInputSubmit}
                />
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Απόρρητη Επικοινωνία • Εσωτερικό Δίκτυο ΕΔ • Ερμής v1.0
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
