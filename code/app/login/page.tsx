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

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("username", username)
      formData.append("password", password)

      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || "Σφάλμα σύνδεσης")
      }

      const data = await response.json()
      localStorage.setItem("token", data.access_token)
      localStorage.setItem("user", JSON.stringify(data.user))

      router.push("/")
    } catch (err: any) {
      setError(err.message || "Λάθος στοιχεία σύνδεσης")
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
            <CardTitle className="text-2xl font-bold">Είσοδος στο Ερμής</CardTitle>
            <CardDescription className="mt-2">Σύστημα RAG Ελληνικών Ενόπλων Δυνάμεων</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Όνομα Χρήστη
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Εισάγετε το όνομα χρήστη σας"
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
                placeholder="Εισάγετε τον κωδικό σας"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <Button type="submit" className="h-11 w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Σύνδεση...
                </>
              ) : (
                "Είσοδος"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Δεν έχετε λογαριασμό;{" "}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Εγγραφή
              </Link>
            </div>
          </form>

          <div className="mt-6 space-y-2 rounded-lg bg-muted/50 p-4">
            <p className="text-xs font-semibold text-muted-foreground">Demo Credentials:</p>
            <p className="text-xs text-muted-foreground">Username: admin</p>
            <p className="text-xs text-muted-foreground">Password: 1234</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
