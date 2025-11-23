import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Logo } from "@/components/logo"
import { Plus, MessageSquare, Trash2, Search } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Conversation } from "../types"
import { Sidebar, SidebarBody } from "@/components/ui/sidebar"

type Props = {
  conversations: Conversation[]
  currentId: string
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  onNewConversation: () => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  handleLogout: () => void
}

export function ChatSidebar({
  conversations,
  currentId,
  sidebarOpen,
  setSidebarOpen,
  onNewConversation,
  onDelete,
  onSelect,
  searchQuery,
  setSearchQuery,
  handleLogout,
}: Props) {
  const filtered = conversations.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
      <SidebarBody className="justify-between gap-6">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
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

          <Button
            onClick={onNewConversation}
            className={cn("mb-4 w-full gap-2", sidebarOpen ? "justify-start" : "justify-center px-0")}
            variant="default"
          >
            <Plus className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Νέα Συνομιλία</span>}
          </Button>

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

          <div className="flex flex-col gap-2">
            {sidebarOpen && (
              <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Συνομιλίες</div>
            )}
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-1">
                {filtered.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg p-2 transition-colors bg-black/40 dark:bg-black/60 hover:bg-accent",
                      currentId === conv.id && "bg-accent",
                      !sidebarOpen && "justify-center",
                    )}
                  >
                    <button
                      onClick={() => onSelect(conv.id)}
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
                          onDelete(conv.id)
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

        <div className="space-y-2">
          {sidebarOpen && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              Αποσύνδεση
            </Button>
          )}
        </div>
      </SidebarBody>
    </Sidebar>
  )
}
