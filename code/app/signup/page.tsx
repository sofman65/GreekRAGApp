"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch(`${apiUrl}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          full_name: fullName || username,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || "Σφάλμα εγγραφής")
      }

      router.push("/login?registered=true")
    } catch (err: any) {
      setError(err.message || "Το όνομα χρήστη υπάρχει ήδη")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <Logo className="h-16 w-16 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Εγγραφή στο Ερμής</CardTitle>
            <CardDescription className="mt-2">Δημιουργήστε νέο λογαριασμό χειριστή</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Πλήρες Όνομα
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="π.χ. Ιωάννης Παπαδόπουλος"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Όνομα Χρήστη
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Επιλέξτε όνομα χρήστη"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Κωδικός Πρόσβασης
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Δημιουργήστε ασφαλή κωδικό"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
                minLength={4}
              />
            </div>

            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <Button type="submit" className="h-11 w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Δημιουργία...
                </>
              ) : (
                "Δημιουργία Λογαριασμού"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Έχετε ήδη λογαριασμό;{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Είσοδος
              </Link>
            </div>
          </form>

          <div className="mt-6 rounded-lg bg-yellow-500/10 p-4">
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              <strong>Σημείωση:</strong> Η εγγραφή είναι διαθέσιμη μόνο για εξουσιοδοτημένο στρατιωτικό προσωπικό.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
