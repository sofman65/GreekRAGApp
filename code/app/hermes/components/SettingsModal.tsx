"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: Props) {
  const { theme, setTheme } = useTheme()
  const [temperature, setTemperature] = useState(0.1)
  const [topK, setTopK] = useState(6)
  const [enableReranker, setEnableReranker] = useState(true)
  const [enableRAG, setEnableRAG] = useState(true)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ρυθμίσεις</DialogTitle>
          <DialogDescription>Προσαρμόστε την εμπειρία σας με τον Ερμή</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Εμφάνιση</Label>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span className="text-sm">Θέμα</span>
              </div>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Φωτεινό</SelectItem>
                  <SelectItem value="dark">Σκούρο</SelectItem>
                  <SelectItem value="system">Σύστημα</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* RAG Settings */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Ρυθμίσεις RAG</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-rag">Ενεργοποίηση RAG</Label>
                <p className="text-xs text-muted-foreground">
                  Χρήση ανάκτησης εγγράφων για απαντήσεις
                </p>
              </div>
              <Switch id="enable-rag" checked={enableRAG} onCheckedChange={setEnableRAG} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="top-k">Πλήθος Εγγράφων (Top-K)</Label>
                <span className="text-sm text-muted-foreground">{topK}</span>
              </div>
              <Slider
                id="top-k"
                min={1}
                max={10}
                step={1}
                value={[topK]}
                onValueChange={(v) => setTopK(v[0])}
                disabled={!enableRAG}
              />
              <p className="text-xs text-muted-foreground">
                Αριθμός εγγράφων που θα ανακτώνται
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-reranker">Ενεργοποίηση Reranker</Label>
                <p className="text-xs text-muted-foreground">
                  Βελτίωση σειράς προτεραιότητας αποτελεσμάτων
                </p>
              </div>
              <Switch
                id="enable-reranker"
                checked={enableReranker}
                onCheckedChange={setEnableReranker}
                disabled={!enableRAG}
              />
            </div>
          </div>

          <Separator />

          {/* LLM Settings */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Ρυθμίσεις Μοντέλου</Label>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="temperature">Θερμοκρασία</Label>
                <span className="text-sm text-muted-foreground">{temperature.toFixed(2)}</span>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.05}
                value={[temperature]}
                onValueChange={(v) => setTemperature(v[0])}
              />
              <p className="text-xs text-muted-foreground">
                Χαμηλότερη = πιο συγκεκριμένες απαντήσεις, Υψηλότερη = πιο δημιουργικές
              </p>
            </div>

            <div className="space-y-2">
              <Label>Μοντέλο Chat</Label>
              <Select defaultValue="gemma2:9b">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemma2:9b">Gemma2 9B</SelectItem>
                  <SelectItem value="gpt-oss:20b">GPT-OSS 20B</SelectItem>
                  <SelectItem value="phi3.5:latest">Phi 3.5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* System Info */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Πληροφορίες Συστήματος</Label>
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Έκδοση:</span>
                <span className="font-mono">Ερμής v1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Backend:</span>
                <span className="font-mono">Weaviate + Ollama</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Embeddings:</span>
                <span className="font-mono text-xs">multilingual-e5-large</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

