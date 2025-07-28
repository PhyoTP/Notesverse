"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Network, Download, Upload, Send } from "lucide-react"

export default function MindmapApp() {
  const [subjectName, setSubjectName] = useState("")
  const [mindmapContent, setMindmapContent] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  // New state for storing HTML
  const [iframeHTML, setIframeHTML] = useState("")
  const iframeRef = useRef(null)

  useEffect(() => {
    if (!isLoading && iframeRef.current && iframeHTML) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(iframeHTML)
        doc.close()
      }
    }
  }, [isLoading, iframeHTML])


  const handleSubmit = async () => {
    if (!subjectName.trim() || !mindmapContent.trim()) {
      alert("Please fill in both subject name and content")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("https://api.phyotp.dev/notesverse/make_graph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: subjectName.trim(),
          text: mindmapContent.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const html = await response.text()
      setIframeHTML(html)
    } catch (error) {
      console.error("Error submitting mindmap:", error)
      alert(`Error submitting mindmap: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }


  const handleExport = () => {
    if (!mindmapContent.trim()) {
      alert("No content to export")
      return
    }

    const dataStr = JSON.stringify(
      {
        subject: subjectName,
        content: mindmapContent,
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    )

    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `${subjectName || "mindmap"}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        if (data.subject) setSubjectName(data.subject)
        if (data.content) setMindmapContent(data.content)

        alert("File imported successfully!")
      } catch (error) {
        alert("Error reading file. Please make sure it's a valid JSON file.")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center space-x-2">
            <Network className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Notesverse</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Mindmap Display */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Mindmap</CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)]">
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center border rounded-md bg-muted">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Generating mindmap...</p>
                    </div>
                  </div>
                ) : (
                  <iframe
                    className="w-full h-full border rounded-md"
                    ref={iframeRef}
                    title="Mindmap Visualization"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">
            {/* Subject Input */}
            <Card>
              <CardHeader>
                <CardTitle>Subject</CardTitle>
                <CardDescription>Enter the main topic for your mindmap</CardDescription>
              </CardHeader>
              <CardContent>
                <Label htmlFor="subject">Subject Name</Label>
                <Input
                  id="subject"
                  placeholder="English, Math, etc"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* Content Input */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>Add your mindmap content, ideas, and structure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label htmlFor="content">Mindmap Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your mindmap content here..."
                  value={mindmapContent}
                  onChange={(e) => setMindmapContent(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <Button onClick={handleSubmit} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Submit Mindmap
                </Button>
              </CardContent>
            </Card>

            {/* File Operations */}
            <Card>
              <CardHeader>
                <CardTitle>File Operations</CardTitle>
                <CardDescription>Import or export your mindmap data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" onClick={handleImport} className="w-full bg-transparent">
                  <Upload className="w-4 h-4 mr-2" />
                  Import from File
                </Button>

                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="w-full bg-transparent"
                  disabled={!mindmapContent.trim()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to File
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
