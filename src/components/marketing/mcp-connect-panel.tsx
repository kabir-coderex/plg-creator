"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MCP_SERVER_NAME } from "@/lib/mcp/constants"

// Define an interface for the CLI commands
interface CLICommand {
  claude: string;
  gemini: string;
  chatgpt: string;
}

function CopyBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-start gap-2 rounded-lg border bg-muted p-2">
        <pre className="flex-1 overflow-x-auto font-mono text-xs whitespace-pre-wrap">
          {code}
        </pre>
        <Button size="icon-sm" variant="outline" onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
    </div>
  )
}

export function McpConnectPanel({
  mcpUrl,
  cliCommand,
}: {
  mcpUrl: string
  cliCommand: CLICommand; // Update the type to use the CLICommand interface
}) {
  const [selectedAI, setSelectedAI] = useState<keyof CLICommand>("claude");

  const configJson = JSON.stringify(
    { mcpServers: { [MCP_SERVER_NAME]: { url: mcpUrl } } },
    null,
    2
  )

  return (
    <Card className="mx-auto max-w-2xl text-left">
      <CardHeader>
        <CardTitle className="text-base">Connect your AI</CardTitle>
        <CardDescription>
          No account yet? Connect first, then just tell your AI: &quot;Sign
          me up, my business is called ___.&quot; It creates your account,
          organization, and API key for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Add a tab-like interface to switch between AI clients */}
        <div className="flex gap-2">
          <Button
            variant={selectedAI === "claude" ? "default" : "outline"}
            onClick={() => setSelectedAI("claude")}
          >
            Claude
          </Button>
          <Button
            variant={selectedAI === "gemini" ? "default" : "outline"}
            onClick={() => setSelectedAI("gemini")}
          >
            Gemini
          </Button>
          <Button
            variant={selectedAI === "chatgpt" ? "default" : "outline"}
            onClick={() => setSelectedAI("chatgpt")}
          >
            ChatGPT
          </Button>
        </div>

        {/* Display the CLI command for the selected AI client */}
        <CopyBlock
          label={`${selectedAI.charAt(0).toUpperCase() + selectedAI.slice(1)} Code (CLI) — global, one time`}
          code={cliCommand[selectedAI]}
        />
        <CopyBlock label="Other MCP clients (config JSON)" code={configJson} />
      </CardContent>
    </Card>
  )
}
