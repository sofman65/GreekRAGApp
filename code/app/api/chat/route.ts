export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    const response = await fetch("http://localhost:8000/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: message }),
    })

    if (!response.ok) {
      throw new Error("Backend request failed")
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return Response.json({ error: "Failed to communicate with backend" }, { status: 500 })
  }
}
