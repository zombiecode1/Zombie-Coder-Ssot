"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useAdmin } from "@/lib/context/admin"
import { MessagesSquare, RefreshCw, Trash2, Eye, X, Loader2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Conversation {
  conversation_id: string
  title: string
  message_count: number
  created_at: string
  updated_at: string
}

interface Message {
  role: string
  content: string
  timestamp?: string
}

export default function ConversationsPage() {
  const { client } = useAdmin()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deletingAll, setDeletingAll] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const data = await client.get<{ conversations: Conversation[] }>("/api/admin/conversations")
      setConversations(data.conversations || [])
    } catch (err) {
      console.error("Failed to fetch conversations:", err)
    } finally {
      setLoading(false)
    }
  }

  const viewConversation = async (conversation: Conversation) => {
    try {
      setSelectedConversation(conversation)
      setLoadingMessages(true)
      const data = await client.get<{ messages: Message[] }>(
        `/api/admin/conversations/${conversation.conversation_id}`
      )
      setMessages(data.messages || [])
    } catch (err) {
      console.error("Failed to fetch messages:", err)
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  const deleteConversation = async (id: string) => {
    try {
      setDeleting(id)
      await client.delete(`/api/admin/conversations/${id}`)
      setConversations((prev) => prev.filter((c) => c.conversation_id !== id))
      if (selectedConversation?.conversation_id === id) {
        setSelectedConversation(null)
        setMessages([])
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err)
    } finally {
      setDeleting(null)
    }
  }

  const deleteAllConversations = async () => {
    try {
      setDeletingAll(true)
      await client.delete("/api/admin/conversations/all")
      setConversations([])
      setSelectedConversation(null)
      setMessages([])
    } catch (err) {
      console.error("Failed to delete all conversations:", err)
    } finally {
      setDeletingAll(false)
    }
  }

  const closeDetail = () => {
    setSelectedConversation(null)
    setMessages([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conversations</h1>
          <p className="text-muted-foreground mt-2">Chat conversation history</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-none"
            onClick={fetchConversations}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-none"
            onClick={deleteAllConversations}
            disabled={deletingAll || conversations.length === 0}
          >
            {deletingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete All
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        <Card className={`flex-1 rounded-none ${selectedConversation ? "w-1/2" : "w-full"}`}>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Messages</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Created</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((c) => (
                  <tr key={c.conversation_id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{c.title || "Untitled"}</td>
                    <td className="p-3 text-muted-foreground">{c.message_count || 0}</td>
                    <td className="p-3 text-muted-foreground text-xs">{c.created_at}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-none"
                          onClick={() => viewConversation(c)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-none"
                          onClick={() => deleteConversation(c.conversation_id)}
                          disabled={deleting === c.conversation_id}
                        >
                          {deleting === c.conversation_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {conversations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-muted-foreground">
                      <MessagesSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No conversations yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {selectedConversation && (
          <Card className="w-1/2 rounded-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedConversation.title || "Untitled"}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.message_count} messages
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-none" onClick={closeDetail}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-none ${
                        msg.role === "user"
                          ? "bg-primary/10 ml-8"
                          : "bg-muted mr-8"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-3 w-3" />
                        <span className="text-xs font-medium capitalize">{msg.role}</span>
                        {msg.timestamp && (
                          <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No messages in this conversation</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
