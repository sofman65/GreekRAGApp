"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Copy, RotateCw, ThumbsUp, ThumbsDown, Check } from "lucide-react"
import { useState } from "react"

type Props = {
  content: string
  onRegenerate?: () => void
  isAssistant: boolean
  messageId?: string
}

export function MessageActions({ content, onRegenerate, isAssistant, messageId }: Props) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(type)
    // TODO: Send feedback to backend
    console.log(`Feedback ${type} for message ${messageId}`)
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? "Αντιγράφηκε!" : "Αντιγραφή"}</p>
          </TooltipContent>
        </Tooltip>

        {isAssistant && onRegenerate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRegenerate}>
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Αναδημιουργία απάντησης</p>
            </TooltipContent>
          </Tooltip>
        )}

        {isAssistant && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleFeedback("up")}
                  disabled={feedback !== null}
                >
                  <ThumbsUp
                    className={`h-3.5 w-3.5 ${feedback === "up" ? "fill-current text-green-500" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Καλή απάντηση</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleFeedback("down")}
                  disabled={feedback !== null}
                >
                  <ThumbsDown
                    className={`h-3.5 w-3.5 ${feedback === "down" ? "fill-current text-red-500" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Κακή απάντηση</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}

