import { Card } from "@/components/ui/card"
import { StreamingText } from "@/components/ui/streaming-text"
import { Logo } from "@/components/logo"
import { ChatSources } from "./ChatSources"
import { MessageActions } from "./MessageActions"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { Message } from "../types"

type Props = {
  message: Message
  isLast: boolean
  isLoading: boolean
  onRegenerate?: () => void
}

export function ChatMessage({ message, isLast, isLoading, onRegenerate }: Props) {
  return (
    <div className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"} group`}>
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
          {message.role === "assistant" && isLoading && isLast ? (
            <StreamingText
              content={message.content}
              className="text-sm leading-relaxed"
              showCursor={true}
            />
          ) : message.role === "assistant" ? (
            <MarkdownRenderer content={message.content} className="text-sm" />
          ) : (
            <p className="whitespace-pre-wrap text-pretty text-sm leading-relaxed">{message.content}</p>
          )}
        </Card>

        {message.sources && message.sources.length > 0 && <ChatSources sources={message.sources} />}

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString("el-GR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <MessageActions
            content={message.content}
            onRegenerate={message.role === "assistant" && isLast && !isLoading ? onRegenerate : undefined}
            isAssistant={message.role === "assistant"}
          />
        </div>
      </div>

      {message.role === "user" && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <div className="text-sm font-semibold">ΧΡ</div>
        </div>
      )}
    </div>
  )
}
