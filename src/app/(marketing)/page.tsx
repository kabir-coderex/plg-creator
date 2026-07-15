import Link from "next/link"
import { headers } from "next/headers"
import { ArrowRight, Filter, GraduationCap, Globe, Mail, Users, Workflow } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { McpConnectPanel } from "@/components/marketing/mcp-connect-panel"
import { resolvePublicOrigin } from "@/lib/request-origin"
import { MCP_SERVER_NAME } from "@/lib/mcp/constants"

const MODULES = [
  { title: "Website Builder", description: "Pages, blog, themes, SEO.", icon: Globe },
  { title: "Course Builder", description: "Lessons, quizzes, certificates.", icon: GraduationCap },
  { title: "Funnels", description: "Landing, checkout, upsells.", icon: Filter },
  { title: "Community", description: "Spaces, feed, events.", icon: Users },
  { title: "Email", description: "Broadcasts, sequences, AI writing.", icon: Mail },
  { title: "Automation", description: "Triggers, actions, workflows.", icon: Workflow },
]

async function getMcpUrl() {
  const headerList = await headers()
  const host = headerList.get("host") ?? "localhost:3000"
  return `${resolvePublicOrigin(host, headerList.get("x-forwarded-proto"))}/api/mcp`
}

export default async function LandingPage() {
  const mcpUrl = await getMcpUrl()
  const cliCommand = {
    claude: `claude mcp add --transport http ${MCP_SERVER_NAME} --scope user ${mcpUrl}`,
    gemini: `gemini mcp add --transport http ${MCP_SERVER_NAME} --scope user ${mcpUrl}`,
    chatgpt: `chatgpt mcp add --transport http ${MCP_SERVER_NAME} --scope user ${mcpUrl}`,
  };

  return (
    <>
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Build your entire creator business from your terminal.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Skillguy is the AI-native operating system for creators. Talk to
          Claude, Codex, Gemini, or the terminal — everything happens live on
          your website.
        </p>
        <div className="flex items-center gap-3">
          <Button size="lg" render={<Link href="/signup" />}>
            Get started <ArrowRight className="size-4" />
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/dashboard" />}>
            View dashboard
          </Button>
        </div>
      </section>

      <section id="connect-ai" className="mx-auto max-w-6xl px-6 pb-24 text-center">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">
          Or skip the form — connect your AI directly
        </h2>
        <McpConnectPanel mcpUrl={mcpUrl} cliCommand={cliCommand} />
      </section>

      <section id="modules" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module) => (
            <Card key={module.title}>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                  <module.icon className="size-4" />
                </div>
                <CardTitle className="text-base">{module.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {module.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  )
}
