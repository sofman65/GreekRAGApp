import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Logo } from "@/components/logo"

type Props = {
  variant: "rag" | "chat"
}

export function ChatLoading({ variant }: Props) {
  const text = variant === "rag" ? "Αναζήτηση σε έγγραφα..." : "Σκέφτομαι την απάντηση..."
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Logo className="h-5 w-5" />
      </div>
      <Card className="flex items-center gap-2 bg-card px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{text}</span>
      </Card>
    </div>
  )
}
