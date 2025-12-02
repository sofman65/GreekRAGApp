"use client"

import { Logo } from "@/components/logo"
import { Card } from "@/components/ui/card"
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect"
import { motion } from "framer-motion"
import { FileText, Shield, Zap, BookOpen } from "lucide-react"

type Props = {
  onPromptClick: (prompt: string) => void
}

const starterPrompts = [
  {
    icon: FileText,
    title: "Διαδικασίες Αδειών",
    prompt: "Ποιες είναι οι διαδικασίες για άδεια στρατιωτικού προσωπικού;",
  },
  {
    icon: Shield,
    title: "Κανονισμοί Ασφαλείας",
    prompt: "Πώς εφαρμόζονται οι κανονισμοί ασφαλείας στις εγκαταστάσεις;",
  },
  {
    icon: BookOpen,
    title: "Στρατιωτικά Έγγραφα",
    prompt: "Ποια είναι η διαδικασία για την έκδοση στρατιωτικών εγγράφων;",
  },
  {
    icon: Zap,
    title: "Εκπαίδευση Προσωπικού",
    prompt: "Πώς διεξάγεται η εκπαίδευση νέων στρατιωτών;",
  },
]

export function EmptyState({ onPromptClick }: Props) {
  const words = [
    {
      text: "Καλωσήρθατε",
    },
    {
      text: "στην",
    },
    {
      text: "Πυθία",
      className: "text-primary dark:text-primary",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center max-w-3xl"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-6 shadow-lg ring-2 ring-accent/20 hover:ring-accent/50 transition-all">
          <Logo className="h-16 w-16" />
        </div>

        <TypewriterEffectSmooth words={words} className="mb-3" cursorClassName="bg-accent" />

        <p className="text-muted-foreground text-center mb-8 max-w-xl leading-relaxed">
          Είμαι εδώ για να σας βοηθήσω με τους διακλαδικούς κανονισμούς και τα στρατιωτικά έγγραφα. Κάντε μια
          ερώτηση ή επιλέξτε μία από τις παρακάτω προτάσεις για να ξεκινήσουμε.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
          {starterPrompts.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card
                  className="p-4 cursor-pointer hover:bg-accent/10 hover:border-accent/50 transition-all group"
                  onClick={() => onPromptClick(item.prompt)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Απόρρητη Επικοινωνία</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>RAG Powered</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Εσωτερικό Δίκτυο KETAK</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

