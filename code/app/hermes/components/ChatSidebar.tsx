import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Logo } from "@/components/logo"
import { Plus, MessageSquare, Trash2, Search, Settings, LogOut, X } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Conversation } from "../types"
import { Sidebar, SidebarBody } from "@/components/ui/sidebar"

// Helper function to format relative time
const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Τώρα"
  if (minutes < 60) return `${minutes}λ πριν`
  if (hours < 24) return `${hours}ώ πριν`
  if (days < 7) return `${days}μ πριν`
  return new Date(date).toLocaleDateString("el-GR", { month: "short", day: "numeric" })
}

type Props = {
  conversations: Conversation[]
  currentId: string
  sidebarOpen: boolean
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
  onNewConversation: () => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  handleLogout: () => void
  onOpenSettings: () => void
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
  onOpenSettings,
}: Props) {
  const filtered = conversations.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))

  // Group conversations by date
  const groupedConversations = filtered.reduce((groups, conv) => {
    const now = new Date()
    const convDate = new Date(conv.updatedAt)
    const diffTime = now.getTime() - convDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    let group = "Παλαιότερα"
    if (diffDays === 0) group = "Σήμερα"
    else if (diffDays === 1) group = "Χθες"
    else if (diffDays < 7) group = "Τελευταίες 7 μέρες"
    else if (diffDays < 30) group = "Τελευταίες 30 μέρες"

    if (!groups[group]) groups[group] = []
    groups[group].push(conv)
    return groups
  }, {} as Record<string, Conversation[]>)

  const groupOrder = ["Σήμερα", "Χθες", "Τελευταίες 7 μέρες", "Τελευταίες 30 μέρες", "Παλαιότερα"]

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between bg-[#1A1A1A] text-[#E6E6E6]">

          {/* HEADER — ΠΥΘΙΑ */}
          <div className={cn(
            "flex items-center gap-3 px-3 py-4 border-b border-[#2A2A2A]",
            !sidebarOpen && "justify-center"
          )}>
            <div className="h-10 w-10 rounded-md bg-[#0A3D91] flex items-center justify-center">
              <Logo className="h-6 w-6 text-white" />
            </div>

            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <span className="text-sm font-semibold tracking-tight">Πυθία</span>
                <span className="flex items-center gap-1 text-[11px] text-[#8A8A8A]">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Online • AI System
                </span>
              </motion.div>
            )}
          </div>

          {/* NEW CHAT */}
          <div className="px-3 py-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onNewConversation}
                  className={cn(
                    "w-full bg-[#0A3D91] hover:bg-[#08407F] text-white rounded-md transition-all",
                    !sidebarOpen && "px-0 justify-center"
                  )}
                >
                  <Plus className="h-5 w-5" />
                  {sidebarOpen && <span className="ml-2">Νέα Συνομιλία</span>}
                </Button>
              </TooltipTrigger>
              {!sidebarOpen && (
                <TooltipContent side="right">
                  <p>Νέα Συνομιλία</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* SEARCH */}
          {sidebarOpen && (
            <div className="px-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8A8A]" />
                <Input
                  placeholder="Αναζήτηση συνομιλιών..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-md bg-[#1F1F1F] border-[#2A2A2A] text-sm"
                />
              </div>
            </div>
          )}

          {/* CONVERSATIONS */}
          <ScrollArea className="flex-1">
            {groupOrder.map((groupName) => {
              const groupConvs = groupedConversations[groupName]
              if (!groupConvs?.length) return null

              return (
                <div key={groupName} className="px-3 py-2">
                  {sidebarOpen && (
                    <div className="text-[10px] uppercase font-semibold text-[#7A7A7A] mb-1">
                      {groupName}
                    </div>
                  )}

                  {groupConvs.map((conv) => (
                    <Tooltip key={conv.id}>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => onSelect(conv.id)}
                          className={cn(
                            "flex items-center rounded-md px-2 py-2 text-sm cursor-pointer transition-all",
                            "hover:bg-[#2A2A2A]",
                            currentId === conv.id && "bg-[#2A2A2A] border border-[#3A3A3A]",
                            !sidebarOpen && "justify-center"
                          )}
                        >
                          <MessageSquare className="h-4 w-4 text-[#9A9A9A] shrink-0" />

                          {sidebarOpen && (
                            <div className="ml-3 flex-1 truncate">
                              <div className="truncate">{conv.title}</div>
                              <div className="text-[11px] text-[#7A7A7A]">
                                {formatRelativeTime(conv.updatedAt)}
                              </div>
                            </div>
                          )}

                          {sidebarOpen && conversations.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDelete(conv.id)
                              }}
                              className="ml-2 text-[#7A7A7A] hover:text-red-500 transition-colors shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </TooltipTrigger>
                      {!sidebarOpen && (
                        <TooltipContent side="right">
                          <p className="max-w-xs truncate">{conv.title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                </div>
              )
            })}
          </ScrollArea>

          {/* FOOTER — USER */}
          <div className="p-3 border-t border-[#2A2A2A]">
            {sidebarOpen ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-2 rounded-md bg-[#1F1F1F] border border-[#2A2A2A]"
              >
                <div className="h-9 w-9 rounded-full bg-[#0A3D91] flex items-center justify-center text-white text-xs font-semibold">
                  ΧΡ
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Χρήστης</span>
                  <span className="text-xs text-[#7A7A7A]">KETAK System</span>
                </div>
              </motion.div>
            ) : (
              <div className="flex justify-center mb-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-9 w-9 rounded-full bg-[#0A3D91] flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
                      ΧΡ
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Χρήστης</p>
                    <p className="text-xs text-muted-foreground">KETAK System</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            <div className="mt-3 flex flex-col gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "text-sm text-[#8A8A8A] hover:text-white hover:bg-[#2A2A2A] transition-all",
                      sidebarOpen ? "justify-start px-2" : "justify-center px-0"
                    )}
                    onClick={onOpenSettings}
                  >
                    <Settings className="h-4 w-4" />
                    {sidebarOpen && <span className="ml-2">Ρυθμίσεις</span>}
                  </Button>
                </TooltipTrigger>
                {!sidebarOpen && (
                  <TooltipContent side="right">
                    <p>Ρυθμίσεις</p>
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "text-sm text-[#8A8A8A] hover:text-red-500 hover:bg-red-500/10 transition-all",
                      sidebarOpen ? "justify-start px-2" : "justify-center px-0"
                    )}
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    {sidebarOpen && <span className="ml-2">Αποσύνδεση</span>}
                  </Button>
                </TooltipTrigger>
                {!sidebarOpen && (
                  <TooltipContent side="right">
                    <p>Αποσύνδεση</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>

        </SidebarBody>

      </Sidebar>
    </TooltipProvider>
  )
}
