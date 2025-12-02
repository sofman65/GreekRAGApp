"use client"

import { useCallback, useRef, useState } from "react"

type Handlers = {
  onSources: (sources: any[], mode?: string) => void
  onToken: (content: string, mode?: string) => void
  onDone: (data?: any) => void
  onError: (msg: string) => void
}

export function useHermesSSE(backendUrl: string, handlers: Handlers) {
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const handlersRef = useRef<Handlers>(handlers)

  // Keep handlers ref up to date
  handlersRef.current = handlers

  const sendMessage = useCallback(
    async (question: string) => {
      setIsLoading(true)

      // Create abort controller for this request
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        const response = await fetch(`${backendUrl}/api/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question }),
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        if (!response.body) {
          throw new Error("No response body")
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let currentEvent = ""
        let fullAnswer = "" // Accumulate the full answer

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true })

          // Process complete lines (SSE messages are separated by \n\n)
          while (buffer.includes("\n")) {
            const newlineIndex = buffer.indexOf("\n")
            const line = buffer.slice(0, newlineIndex)
            buffer = buffer.slice(newlineIndex + 1)

            // Skip empty lines (they mark end of SSE message)
            if (!line.trim()) {
              currentEvent = "" // Reset event type after empty line
              continue
            }

            // Parse SSE format
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim()
            } else if (line.startsWith("data: ")) {
              const data = line.slice(6)

              if (currentEvent === "sources") {
                // Parse sources JSON
                try {
                  const sources = JSON.parse(data)
                  handlersRef.current.onSources(sources, "rag")
                } catch (e) {
                  console.error("Failed to parse sources:", e)
                }
              } else if (currentEvent === "done") {
                // Parse done event
                try {
                  const doneData = JSON.parse(data)
                  handlersRef.current.onDone(doneData)
                } catch (e) {
                  handlersRef.current.onDone()
                }
                setIsLoading(false)
              } else if (currentEvent === "error") {
                // Handle error
                try {
                  const errorData = JSON.parse(data)
                  handlersRef.current.onError(errorData.error || "Unknown error")
                } catch (e) {
                  handlersRef.current.onError(data)
                }
                setIsLoading(false)
              } else {
                // Regular token data (no event prefix means it's a token)
                if (data && data !== "[DONE]") {
                  fullAnswer += data
                  // Send the FULL accumulated answer, not just the token
                  // This ensures smooth rendering without jumps
                  handlersRef.current.onToken(fullAnswer, "rag")
                }
              }
            }
          }
        }

        setIsLoading(false)
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Stream aborted by user")
        } else {
          console.error("Stream error:", error)
          handlersRef.current.onError(error.message || "Stream failed")
        }
        setIsLoading(false)
      } finally {
        abortControllerRef.current = null
      }
    },
    [backendUrl]
  )

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
    }
  }, [])

  return {
    isConnected,
    isLoading,
    sendMessage,
    stopGeneration,
  }
}
