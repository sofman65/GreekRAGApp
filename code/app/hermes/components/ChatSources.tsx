import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"

type Props = {
  sources?: string[]
}

export function ChatSources({ sources }: Props) {
  if (!sources || sources.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {sources.slice(0, 3).map((source, i) => (
        <Badge key={i} variant="secondary" className="gap-1 text-xs">
          <FileText className="h-3 w-3" />
          Πηγή {i + 1}
        </Badge>
      ))}
    </div>
  )
}
