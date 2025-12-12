"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("username", email) // backend expects "username"
      formData.append("password", password)

      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Σφάλμα σύνδεσης")
      }

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
            <CardTitle className="text-2xl font-bold">Είσοδος στην Πυθία</CardTitle>
            <CardDescription className="mt-2">
              Σύστημα RAG Ελληνικών Ενόπλων Δυνάμεων
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Υπηρεσίας
              </label>
              <Input
                id="email"
                type="email"
                placeholder="yourname@army.gr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

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

            <div className="text-center text-sm text-muted-foreground mt-1">
              Δεν έχετε λογαριασμό;{" "}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Εγγραφή
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
