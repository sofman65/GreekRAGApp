"use client"

import { cn } from "@/lib/utils"
import { motion } from "motion/react"

interface StreamingTextProps {
  content: string
  className?: string
  showCursor?: boolean
}

export function StreamingText({ content, className, showCursor = true }: StreamingTextProps) {
  return (
    <div className={cn("whitespace-pre-wrap text-pretty", className)}>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
      >
        {content}
      </motion.span>
      {showCursor && (
        <motion.span
          className="inline-block w-2 h-4 ml-0.5 bg-current align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      )}
    </div>
  )
}


