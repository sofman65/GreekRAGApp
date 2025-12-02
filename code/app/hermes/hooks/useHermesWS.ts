import { useEffect, useRef, useState } from "react"

type Handlers = {
  onSources: (sources: string[], mode?: string) => void
  onToken: (content: string, mode?: string) => void
  onDone: () => void
  onError: (msg: string) => void
}

export function useHermesWS(backendUrl: string, handlers: Handlers) {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 3
  const handlersRef = useRef<Handlers>(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"

    const connect = () => {
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        return
      }
      try {
        const socket = new WebSocket(`${wsUrl}/api/ws/chat`)

        socket.onopen = () => {
          setIsConnected(true)
          reconnectAttempts.current = 0
        }

        socket.onclose = () => {
          setIsConnected(false)
          reconnectAttempts.current += 1
          setTimeout(connect, 3000)
        }

        socket.onerror = () => {
          setIsConnected(false)
        }

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data)
          const h = handlersRef.current
          if (data.type === "sources") {
            h.onSources(data.sources || [], data.mode)
          } else if (data.type === "token") {
            h.onToken(data.content, data.mode)
            if (data.mode !== "rag") {
              setIsLoading(false)
            }
          } else if (data.type === "done") {
            setIsLoading(false)
            h.onDone()
          } else if (data.type === "error") {
            setIsLoading(false)
            h.onError(data.content || "Σφάλμα backend")
          }
        }

        setWs(socket)
      } catch (err: any) {
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      ws?.close()
    }
  }, [])

  const sendMessage = async (question: string) => {
    setIsLoading(true)

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ question }))
      return
    }

    // REST fallback
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
      handlers.onToken(data.answer, data.mode)
      handlers.onSources(data.sources || [], data.mode)
    } catch (err: any) {
      handlers.onError(err.message || "Σφάλμα backend")
    } finally {
      setIsLoading(false)
      handlers.onDone()
    }
  }

  const stopGeneration = () => {
    setIsLoading(false)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "stop" }))
    }
  }

  return {
    isConnected,
    isLoading,
    sendMessage,
    stopGeneration,
  }
}
