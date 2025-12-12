"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const [email, setEmail] = useState("")
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName || email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Σφάλμα εγγραφής")
      }

      router.push("/login?registered=true")
    } catch (err: any) {
      setError(err.message || "Το email υπάρχει ήδη")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-primary/5">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Logo className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Εγγραφή στην Πυθία</CardTitle>
          <CardDescription>Δημιουργία λογαριασμού χειριστή</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Πλήρες Όνομα</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Υπηρεσίας</label>
              <Input
                type="email"
                placeholder="yourname@army.gr"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Κωδικός</label>
              <Input
                type="password"
                value={password}
                required
                minLength={4}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full h-11">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Εγγραφή"}
            </Button>

            <p className="text-sm text-center mt-2">
              Έχετε ήδη λογαριασμό;{" "}
              <Link href="/login" className="font-semibold text-primary">
                Είσοδος
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
