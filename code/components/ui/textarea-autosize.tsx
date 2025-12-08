"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaAutosizeProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number
  maxRows?: number
}

const TextareaAutosize = React.forwardRef<HTMLTextAreaElement, TextareaAutosizeProps>(
  ({ className, minRows = 1, maxRows = 10, onChange, value, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
    const [textareaHeight, setTextareaHeight] = React.useState<string>("auto")

    React.useImperativeHandle(ref, () => textareaRef.current!)

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current
      if (!textarea) return

      textarea.style.height = "auto"
      const computed = window.getComputedStyle(textarea)
      const lineHeight = parseFloat(computed.lineHeight)
      const paddingTop = parseFloat(computed.paddingTop)
      const paddingBottom = parseFloat(computed.paddingBottom)

      const minHeight = lineHeight * minRows + paddingTop + paddingBottom
      const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom
      const scrollHeight = textarea.scrollHeight

      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
      setTextareaHeight(`${newHeight}px`)
    }, [minRows, maxRows])

    React.useEffect(() => {
      adjustHeight()
    }, [value, adjustHeight])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight()
      onChange?.(e)
    }

    return (
      <textarea
        ref={textareaRef}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          className,
        )}
        style={{ height: textareaHeight }}
        onChange={handleChange}
        value={value}
        {...props}
      />
    )
  },
)

TextareaAutosize.displayName = "TextareaAutosize"

export { TextareaAutosize }


