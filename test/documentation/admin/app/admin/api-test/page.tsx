"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdmin } from "@/lib/context/admin"
import { FlaskConical, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ApiTestPage() {
  const { client } = useAdmin()
  const [model, setModel] = useState("auto")
  const [prompt, setPrompt] = useState("Hello, what is 2+2?")
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendTest = async () => {
    try {
      setLoading(true)
      setError(null)
      setResponse(null)
      const result = await client.post("/v1/chat/completions", {
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 256,
      })
      setResponse(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Test</h1>
        <p className="text-muted-foreground mt-2">Test chat completions through the gateway</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chat Completion Test</CardTitle>
          <CardDescription>Send a test request to any model</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="auto or model ID"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm resize-none"
            />
          </div>
          <Button onClick={sendTest} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Request
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="py-4">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {response && (
        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(response, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
