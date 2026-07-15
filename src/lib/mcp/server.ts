import "server-only"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import type { McpAuthContext } from "@/lib/mcp/auth"
import { signupCreator } from "@/lib/mcp/signup"
import { signinCreator } from "@/lib/mcp/signin"
import { MCP_SERVER_NAME } from "@/lib/mcp/constants"
import { hashApiKey } from "@/lib/api-keys"
import { uniqueSlug } from "@/lib/slug"
import {
  mcpCreateCategory,
  mcpCreateCourse,
  mcpCreateLesson,
  mcpDeleteCategory,
  mcpDeleteCourse,
  mcpDeleteLesson,
  mcpListCategories,
  mcpListCourses,
  mcpListLessons,
  mcpSetCourseStatus,
  mcpUpdateCourse,
  mcpUpdateLesson,
} from "@/lib/mcp/courses"
import {
  mcpCreateFunnel,
  mcpDeleteFunnel,
  mcpListFunnels,
  mcpSetFunnelStatus,
} from "@/lib/mcp/funnels"
import { fetchYoutubePlaylist } from "@/lib/youtube"

const organizationShape = {
  id: z.string().describe("Organization UUID"),
  name: z.string().describe("Organization display name"),
  slug: z.string().describe("Organization URL slug"),
}

const courseShape = {
  id: z.string(),
  category_id: z.string().nullable(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
}

const lessonShape = {
  id: z.string(),
  course_id: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  video_url: z.string().nullable(),
  position: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
}

const categoryShape = {
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  created_at: z.string(),
}

const funnelShape = {
  id: z.string(),
  course_id: z.string(),
  name: z.string(),
  slug: z.string(),
  template_key: z.string(),
  headline: z.string(),
  subheadline: z.string().nullable(),
  description: z.string().nullable(),
  cta_text: z.string(),
  price_label: z.string(),
  thank_you_message: z.string(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
}

type ToolExtra = { authInfo?: { token?: string; extra?: Record<string, unknown> } }

// `extra.authInfo.extra` always carries `mcpUrl` (even anonymously); org fields
// (orgId/orgName/...) are only present once a valid API key was presented.
function getMcpUrl(extra: ToolExtra): string {
  return (extra.authInfo?.extra?.mcpUrl as string | undefined) ?? "http://localhost:3000/api/mcp"
}

// mcpUrl is always `${origin}/api/mcp` — strip the suffix to recover the site origin
// for building public-facing URLs (course/funnel pages) in tool responses.
function getSiteOrigin(extra: ToolExtra): string {
  return getMcpUrl(extra).replace(/\/api\/mcp\/?$/, "")
}

function requireAuth(extra: ToolExtra): McpAuthContext {
  const ctx = extra.authInfo?.extra as (McpAuthContext & { mcpUrl?: string }) | undefined
  if (!ctx?.orgId) {
    throw new Error("Missing org context — this tool must be called with a valid API key.")
  }
  return ctx
}

// Every courses/lessons/categories tool below is gated by a valid API key; the key's hash
// (not the org context) is what the mcp_* RPCs actually check — see docs/Milestone.md M3.
function getKeyHash(extra: ToolExtra): string {
  requireAuth(extra)
  const token = extra.authInfo?.token
  if (!token) {
    throw new Error("Missing org context — this tool must be called with a valid API key.")
  }
  return hashApiKey(token)
}

function reconnectBlock(mcpUrl: string, apiKey: string) {
  const commands = {
    claude: `claude mcp remove ${MCP_SERVER_NAME} 2>/dev/null; claude mcp add --transport http ${MCP_SERVER_NAME} --scope user ${mcpUrl} --header "Authorization: Bearer ${apiKey}"`,
    gemini: `gemini mcp remove ${MCP_SERVER_NAME} 2>/dev/null; gemini mcp add --transport http ${MCP_SERVER_NAME} --scope user ${mcpUrl} --header "Authorization: Bearer ${apiKey}"`,
    chatgpt: `chatgpt mcp remove ${MCP_SERVER_NAME} 2>/dev/null; chatgpt mcp add --transport http ${MCP_SERVER_NAME} --scope user ${mcpUrl} --header "Authorization: Bearer ${apiKey}"`,
  };

  const instructions =
    `If you have shell access, run this now to finish connecting (don't just print the key to the user):\n${commands.claude}\n\n` +
    "Then reconnect to this MCP server and call `whoami` to confirm before doing anything else. " +
    `If you have no shell access, tell the user their apiKey is: ${apiKey}`;

  return { commands, instructions };
}

export function createMcpServer() {
  const server = new McpServer({ name: "skillguy", version: "0.1.0" })

  // Permission: NONE — this is the one tool callable with no API key at all (that's the
  // point: it creates the very first org + key for a brand new creator). Prototype-only
  // shortcut: if email/password are omitted, both are generated and returned in the response
  // rather than requiring the human to provide real credentials up front.
  // Example prompt: "Sign me up, my business is called Acme Co."
  // Example response: { organization, credentials: { email, password, ... }, apiKey }
  server.registerTool(
    "signup",
    {
      title: "Sign up",
      description:
        "Create a brand new creator account, organization, and API key in one call. " +
        "Email/password are optional — omit either to have one generated and returned. " +
        "The returned apiKey must be used as the Bearer token for every other tool call.",
      inputSchema: {
        organization_name: z.string().min(2).describe("Name of the business/organization to create"),
        email: z
          .email()
          .optional()
          .describe(
            "Email for the new account. Omit to auto-generate a placeholder (prototype only — not a real inbox)."
          ),
        password: z
          .string()
          .min(8)
          .optional()
          .describe("Password for the new account. Omit to auto-generate a strong one."),
      },
      outputSchema: {
        organization: z.object(organizationShape),
        credentials: z.object({
          email: z.string(),
          password: z.string(),
          emailWasGenerated: z.boolean(),
          passwordWasGenerated: z.boolean(),
        }),
        apiKey: z
          .string()
          .describe("Bearer token for all other tools on this org. Shown only this once."),
        reconnect: z.object({
          commands: z.object({
            claude: z.string(),
            gemini: z.string(),
            chatgpt: z.string(),
          })
            .describe(
              "Shell command that re-registers this MCP connection with the new API key. " +
                "If you (the calling agent) have shell access, run this now instead of showing " +
                "the raw apiKey to the user, then reconnect to this MCP server and call `whoami` " +
                "to confirm before continuing."
            ),
        }),
      },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ organization_name, email, password }, extra) => {
      const result = await signupCreator({ organizationName: organization_name, email, password })
      const { commands, instructions } = reconnectBlock(getMcpUrl(extra), result.apiKey)

      return {
        content: [
          {
            type: "text",
            text:
              `Created organization "${result.organization.name}". ` +
              `Email: ${result.credentials.email}${result.credentials.emailWasGenerated ? " (auto-generated)" : ""}, ` +
              `password: ${result.credentials.password}${result.credentials.passwordWasGenerated ? " (auto-generated)" : ""}.\n\n` +
              instructions,
          },
        ],
        structuredContent: { ...result, reconnect: { commands } },
      }
    }
  )

  // Permission: NONE — for a creator who already has an account (via web signup or a
  // previous `signup` call) but needs a fresh API key, e.g. a new device or a lost key.
  // Always issues a brand new key rather than returning an existing one (keys are
  // write-once/shown-once by design — there's nothing to "look up" and show again).
  // Example prompt: "Sign me in, my email is jane@acme.com."
  // Example response: { organization, apiKey, reconnect: { command } }
  server.registerTool(
    "signin",
    {
      title: "Sign in",
      description:
        "Sign in to an existing account and issue a fresh API key for MCP access. Use this " +
        "instead of `signup` when the account already exists (created via the web dashboard " +
        "or a previous `signup` call) — e.g. reconnecting from a new device or a lost key.",
      inputSchema: {
        email: z.email().describe("Email of the existing account"),
        password: z.string().min(1).describe("Password of the existing account"),
      },
      outputSchema: {
        organization: z.object(organizationShape),
        apiKey: z
          .string()
          .describe("Newly issued bearer token for all other tools on this org. Shown only this once."),
        reconnect: z.object({
          commands: z.object({
            claude: z.string(),
            gemini: z.string(),
            chatgpt: z.string(),
          })
            .describe(
              "Shell command that re-registers this MCP connection with the new API key. " +
                "If you (the calling agent) have shell access, run this now instead of showing " +
                "the raw apiKey to the user, then reconnect to this MCP server and call `whoami` " +
                "to confirm before continuing."
            ),
        }),
      },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ email, password }, extra) => {
      const result = await signinCreator({ email, password })
      const { commands, instructions } = reconnectBlock(getMcpUrl(extra), result.apiKey)

      return {
        content: [
          {
            type: "text",
            text: `Signed in to organization "${result.organization.name}".\n\n${instructions}`,
          },
        ],
        structuredContent: { ...result, reconnect: { commands } },
      }
    }
  )

  // Permission: any valid, non-revoked API key. Scoped to the calling key's own org only.
  // Example prompt: "Who am I connected as?"
  // Example response: { organization: { id, name, slug }, key: { id, name } }
  server.registerTool(
    "whoami",
    {
      title: "Who am I",
      description:
        "Identify the organization and API key this request is authenticated as.",
      outputSchema: {
        organization: z.object(organizationShape),
        key: z.object({
          id: z.string().describe("API key UUID"),
          name: z.string().describe("API key label set by the creator"),
        }),
      },
    },
    async (extra) => {
      const ctx = requireAuth(extra)
      const structuredContent = {
        organization: { id: ctx.orgId, name: ctx.orgName, slug: ctx.orgSlug },
        key: { id: ctx.keyId, name: ctx.keyName },
      }
      return {
        content: [
          {
            type: "text",
            text: `Authenticated as "${ctx.keyName}" for organization "${ctx.orgName}".`,
          },
        ],
        structuredContent,
      }
    }
  )

  // Permission: any valid, non-revoked API key. Each key belongs to exactly one org, so this
  // always returns a single-element list — the shape is forward-compatible with any future
  // multi-org-per-key support.
  // Example prompt: "List my organizations."
  // Example response: { organizations: [{ id, name, slug }] }
  server.registerTool(
    "list_organizations",
    {
      title: "List organizations",
      description: "List the organization(s) accessible with this API key.",
      outputSchema: {
        organizations: z.array(z.object(organizationShape)),
      },
    },
    async (extra) => {
      const ctx = requireAuth(extra)
      const structuredContent = {
        organizations: [{ id: ctx.orgId, name: ctx.orgName, slug: ctx.orgSlug }],
      }
      return {
        content: [{ type: "text", text: `Organization: ${ctx.orgName} (${ctx.orgSlug})` }],
        structuredContent,
      }
    }
  )

  // ===== courses =====

  // Permission: any valid, non-revoked API key — scoped to that key's own org.
  // Example prompt: "Create a course called Intro to Baking."
  // Example response: { course: { id, title, status: "draft", ... } }
  server.registerTool(
    "create_course",
    {
      title: "Create course",
      description: "Create a new course. Add lessons afterward with `create_lesson`.",
      inputSchema: {
        title: z.string().min(2).describe("Course title"),
        description: z.string().optional().describe("What students will learn"),
        category_id: z.string().optional().describe("Existing category UUID — see `list_categories`"),
        status: z.enum(["draft", "published"]).optional().describe("Defaults to draft"),
      },
      outputSchema: { course: z.object(courseShape) },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ title, description, category_id, status }, extra) => {
      const keyHash = getKeyHash(extra)
      const course = await mcpCreateCourse(keyHash, {
        title,
        slug: uniqueSlug(title),
        description,
        categoryId: category_id,
        status,
      })
      return {
        content: [{ type: "text", text: `Created course "${course.title}" (${course.status}).` }],
        structuredContent: { course },
      }
    }
  )

  // Permission: any valid, non-revoked API key. Omitted fields are left unchanged.
  // Example prompt: "Update that course's description to ..."
  server.registerTool(
    "update_course",
    {
      title: "Update course",
      description:
        "Update a course's title, description, category, or thumbnail URL. Omitted fields are left unchanged.",
      inputSchema: {
        course_id: z.string().describe("Course UUID"),
        title: z.string().min(2).optional(),
        description: z.string().optional(),
        category_id: z.string().optional(),
        thumbnail_url: z
          .string()
          .optional()
          .describe("Publicly hosted image URL — this tool can't upload files directly"),
      },
      outputSchema: { course: z.object(courseShape) },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ course_id, title, description, category_id, thumbnail_url }, extra) => {
      const keyHash = getKeyHash(extra)
      const course = await mcpUpdateCourse(keyHash, {
        courseId: course_id,
        title,
        description,
        categoryId: category_id,
        thumbnailUrl: thumbnail_url,
      })
      return {
        content: [{ type: "text", text: `Updated course "${course.title}".` }],
        structuredContent: { course },
      }
    }
  )

  // Permission: any valid, non-revoked API key.
  // Example prompt: "Publish that course."
  server.registerTool(
    "publish_course",
    {
      title: "Publish course",
      description: "Mark a course as published.",
      inputSchema: { course_id: z.string().describe("Course UUID") },
      outputSchema: { course: z.object(courseShape), url: z.string().describe("Public course URL") },
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ course_id }, extra) => {
      const ctx = requireAuth(extra)
      const keyHash = getKeyHash(extra)
      const course = await mcpSetCourseStatus(keyHash, course_id, "published")
      const url = `${getSiteOrigin(extra)}/${ctx.orgSlug}/courses/${course.slug}`
      return {
        content: [{ type: "text", text: `Published "${course.title}" at ${url}` }],
        structuredContent: { course, url },
      }
    }
  )

  // Permission: any valid, non-revoked API key.
  // Example prompt: "Unpublish that course."
  server.registerTool(
    "unpublish_course",
    {
      title: "Unpublish course",
      description: "Revert a course to draft.",
      inputSchema: { course_id: z.string().describe("Course UUID") },
      outputSchema: { course: z.object(courseShape) },
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ course_id }, extra) => {
      const keyHash = getKeyHash(extra)
      const course = await mcpSetCourseStatus(keyHash, course_id, "draft")
      return {
        content: [{ type: "text", text: `Unpublished "${course.title}".` }],
        structuredContent: { course },
      }
    }
  )

  // Permission: any valid, non-revoked API key.
  // Example prompt: "Delete that course."
  server.registerTool(
    "delete_course",
    {
      title: "Delete course",
      description: "Permanently delete a course and all of its lessons.",
      inputSchema: { course_id: z.string().describe("Course UUID") },
      outputSchema: { deleted: z.boolean() },
      annotations: { destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ course_id }, extra) => {
      const keyHash = getKeyHash(extra)
      await mcpDeleteCourse(keyHash, course_id)
      return {
        content: [{ type: "text", text: "Course deleted." }],
        structuredContent: { deleted: true },
      }
    }
  )

  // Permission: any valid, non-revoked API key.
  // Example prompt: "List my courses." / "List my published courses."
  server.registerTool(
    "list_courses",
    {
      title: "List courses",
      description: "List this org's courses, optionally filtered by status.",
      inputSchema: { status: z.enum(["draft", "published"]).optional() },
      outputSchema: { courses: z.array(z.object(courseShape)) },
    },
    async ({ status }, extra) => {
      const keyHash = getKeyHash(extra)
      const courses = await mcpListCourses(keyHash, status)
      return {
        content: [{ type: "text", text: `${courses.length} course(s).` }],
        structuredContent: { courses },
      }
    }
  )

  // Permission: any valid, non-revoked API key. Reaches out to the YouTube Data API (public
  // playlists only — no OAuth, just the server's own YOUTUBE_API_KEY).
  // Example prompt: "Turn this YouTube playlist into a course: https://youtube.com/playlist?list=..."
  // Example response: { course, lessons_created, playlist_title }
  server.registerTool(
    "create_course_from_youtube_playlist",
    {
      title: "Create course from YouTube playlist",
      description:
        "Import a public YouTube playlist as a course — one lesson per video, in playlist order, " +
        "each lesson's video_url pointing at that video and its content set from the video's own " +
        "description. If title is omitted, the playlist's own title is used.",
      inputSchema: {
        playlist_url: z.string().describe("YouTube playlist URL (or raw playlist ID)"),
        title: z.string().min(2).optional().describe("Course title — defaults to the playlist's title"),
        category_id: z.string().optional().describe("Existing category UUID — see `list_categories`"),
      },
      outputSchema: {
        course: z.object(courseShape),
        lessons_created: z.number(),
        playlist_title: z.string(),
      },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ playlist_url, title, category_id }, extra) => {
      const keyHash = getKeyHash(extra)
      const playlist = await fetchYoutubePlaylist(playlist_url)

      if (playlist.videos.length === 0) {
        throw new Error("That playlist has no public videos to import.")
      }

      const courseTitle = title ?? playlist.title
      const course = await mcpCreateCourse(keyHash, {
        title: courseTitle,
        slug: uniqueSlug(courseTitle),
        categoryId: category_id,
      })

      for (const video of playlist.videos) {
        await mcpCreateLesson(keyHash, {
          courseId: course.id,
          title: video.title,
          content: video.description || undefined,
          videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
          position: video.position,
        })
      }

      return {
        content: [
          {
            type: "text",
            text:
              `Created course "${course.title}" with ${playlist.videos.length} lesson(s) ` +
              `from the playlist "${playlist.title}".`,
          },
        ],
        structuredContent: {
          course,
          lessons_created: playlist.videos.length,
          playlist_title: playlist.title,
        },
      }
    }
  )

  // ===== lessons =====

  // Permission: any valid, non-revoked API key.
  // Example prompt: "Add a lesson called Knife Skills to that course."
  server.registerTool(
    "create_lesson",
    {
      title: "Create lesson",
      description: "Add a lesson to a course.",
      inputSchema: {
        course_id: z.string().describe("Course UUID"),
        title: z.string().min(2),
        content: z.string().optional(),
        video_url: z.string().optional(),
        position: z.number().int().optional().describe("Sort order; defaults to appended at the end"),
      },
      outputSchema: { lesson: z.object(lessonShape) },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ course_id, title, content, video_url, position }, extra) => {
      const keyHash = getKeyHash(extra)
      const lesson = await mcpCreateLesson(keyHash, {
        courseId: course_id,
        title,
        content,
        videoUrl: video_url,
        position,
      })
      return {
        content: [{ type: "text", text: `Added lesson "${lesson.title}".` }],
        structuredContent: { lesson },
      }
    }
  )

  // Permission: any valid, non-revoked API key. Omitted fields are left unchanged.
  server.registerTool(
    "update_lesson",
    {
      title: "Update lesson",
      description:
        "Update a lesson's title, content, video URL, or position. Omitted fields are left unchanged.",
      inputSchema: {
        lesson_id: z.string().describe("Lesson UUID"),
        title: z.string().min(2).optional(),
        content: z.string().optional(),
        video_url: z.string().optional(),
        position: z.number().int().optional(),
      },
      outputSchema: { lesson: z.object(lessonShape) },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ lesson_id, title, content, video_url, position }, extra) => {
      const keyHash = getKeyHash(extra)
      const lesson = await mcpUpdateLesson(keyHash, {
        lessonId: lesson_id,
        title,
        content,
        videoUrl: video_url,
        position,
      })
      return {
        content: [{ type: "text", text: `Updated lesson "${lesson.title}".` }],
        structuredContent: { lesson },
      }
    }
  )

  // Permission: any valid, non-revoked API key.
  server.registerTool(
    "delete_lesson",
    {
      title: "Delete lesson",
      description: "Permanently delete a lesson.",
      inputSchema: { lesson_id: z.string().describe("Lesson UUID") },
      outputSchema: { deleted: z.boolean() },
      annotations: { destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ lesson_id }, extra) => {
      const keyHash = getKeyHash(extra)
      await mcpDeleteLesson(keyHash, lesson_id)
      return {
        content: [{ type: "text", text: "Lesson deleted." }],
        structuredContent: { deleted: true },
      }
    }
  )

  // Permission: any valid, non-revoked API key.
  // Example prompt: "List the lessons in that course."
  server.registerTool(
    "list_lessons",
    {
      title: "List lessons",
      description: "List a course's lessons in order.",
      inputSchema: { course_id: z.string().describe("Course UUID") },
      outputSchema: { lessons: z.array(z.object(lessonShape)) },
    },
    async ({ course_id }, extra) => {
      const keyHash = getKeyHash(extra)
      const lessons = await mcpListLessons(keyHash, course_id)
      return {
        content: [{ type: "text", text: `${lessons.length} lesson(s).` }],
        structuredContent: { lessons },
      }
    }
  )

  // ===== categories =====

  // Permission: any valid, non-revoked API key.
  server.registerTool(
    "create_category",
    {
      title: "Create category",
      description: "Create a course category.",
      inputSchema: { name: z.string().min(2) },
      outputSchema: { category: z.object(categoryShape) },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ name }, extra) => {
      const keyHash = getKeyHash(extra)
      const category = await mcpCreateCategory(keyHash, { name, slug: uniqueSlug(name) })
      return {
        content: [{ type: "text", text: `Created category "${category.name}".` }],
        structuredContent: { category },
      }
    }
  )

  // Permission: any valid, non-revoked API key.
  // Example prompt: "What course categories do I have?"
  server.registerTool(
    "list_categories",
    {
      title: "List categories",
      description: "List this org's course categories.",
      outputSchema: { categories: z.array(z.object(categoryShape)) },
    },
    async (extra) => {
      const keyHash = getKeyHash(extra)
      const categories = await mcpListCategories(keyHash)
      return {
        content: [
          {
            type: "text",
            text: `${categories.length} categor${categories.length === 1 ? "y" : "ies"}.`,
          },
        ],
        structuredContent: { categories },
      }
    }
  )

  // Permission: any valid, non-revoked API key.
  server.registerTool(
    "delete_category",
    {
      title: "Delete category",
      description: "Delete a course category. Courses using it fall back to no category.",
      inputSchema: { category_id: z.string().describe("Category UUID") },
      outputSchema: { deleted: z.boolean() },
      annotations: { destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ category_id }, extra) => {
      const keyHash = getKeyHash(extra)
      await mcpDeleteCategory(keyHash, category_id)
      return {
        content: [{ type: "text", text: "Category deleted." }],
        structuredContent: { deleted: true },
      }
    }
  )

  // ===== funnels =====

  // Permission: any valid, non-revoked API key — scoped to that key's own org. The course must
  // belong to the same org. Only one template exists (M4), so there's nothing to choose.
  // Example prompt: "Create a funnel for my baking course, headline 'Learn to bake like a pro'."
  // Example response: { funnel: { id, name, status: "draft", ... } }
  server.registerTool(
    "create_funnel",
    {
      title: "Create funnel",
      description:
        "Create a landing/checkout/thank-you funnel for a course, using the one built-in template. " +
        "Copy fields are optional and fall back to sensible defaults.",
      inputSchema: {
        course_id: z.string().describe("Course UUID this funnel sells — see `list_courses`"),
        name: z.string().min(2).describe("Internal funnel name"),
        headline: z.string().optional().describe("Landing page headline"),
        subheadline: z.string().optional(),
        description: z.string().optional().describe("Landing page body copy"),
        cta_text: z.string().optional().describe("Button text, defaults to 'Get instant access'"),
        price_label: z.string().optional().describe("Display-only price string, e.g. '$97'"),
        thank_you_message: z.string().optional(),
        status: z.enum(["draft", "published"]).optional().describe("Defaults to draft"),
      },
      outputSchema: { funnel: z.object(funnelShape) },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (
      { course_id, name, headline, subheadline, description, cta_text, price_label, thank_you_message, status },
      extra
    ) => {
      const keyHash = getKeyHash(extra)
      const funnel = await mcpCreateFunnel(keyHash, {
        courseId: course_id,
        name,
        slug: uniqueSlug(name),
        headline,
        subheadline,
        description,
        ctaText: cta_text,
        priceLabel: price_label,
        thankYouMessage: thank_you_message,
        status,
      })
      return {
        content: [{ type: "text", text: `Created funnel "${funnel.name}" (${funnel.status}).` }],
        structuredContent: { funnel },
      }
    }
  )

  // Permission: any valid, non-revoked API key.
  // Example prompt: "List my funnels." / "List my published funnels."
  server.registerTool(
    "list_funnels",
    {
      title: "List funnels",
      description: "List this org's funnels, optionally filtered by status.",
      inputSchema: { status: z.enum(["draft", "published"]).optional() },
      outputSchema: { funnels: z.array(z.object(funnelShape)) },
    },
    async ({ status }, extra) => {
      const keyHash = getKeyHash(extra)
      const funnels = await mcpListFunnels(keyHash, status)
      return {
        content: [{ type: "text", text: `${funnels.length} funnel(s).` }],
        structuredContent: { funnels },
      }
    }
  )

  // Permission: any valid, non-revoked API key.
  // Example prompt: "Publish that funnel."
  server.registerTool(
    "publish_funnel",
    {
      title: "Publish funnel",
      description: "Publish a funnel — makes its landing/checkout/thank-you pages publicly live.",
      inputSchema: { funnel_id: z.string().describe("Funnel UUID") },
      outputSchema: { funnel: z.object(funnelShape), url: z.string().describe("Public funnel URL") },
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ funnel_id }, extra) => {
      const ctx = requireAuth(extra)
      const keyHash = getKeyHash(extra)
      const funnel = await mcpSetFunnelStatus(keyHash, funnel_id, "published")
      const url = `${getSiteOrigin(extra)}/${ctx.orgSlug}/funnels/${funnel.slug}`
      return {
        content: [{ type: "text", text: `Published "${funnel.name}" at ${url}` }],
        structuredContent: { funnel, url },
      }
    }
  )

  // Permission: any valid, non-revoked API key.
  // Example prompt: "Unpublish that funnel."
  server.registerTool(
    "unpublish_funnel",
    {
      title: "Unpublish funnel",
      description: "Revert a funnel to draft, taking its public pages offline.",
      inputSchema: { funnel_id: z.string().describe("Funnel UUID") },
      outputSchema: { funnel: z.object(funnelShape) },
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ funnel_id }, extra) => {
      const keyHash = getKeyHash(extra)
      const funnel = await mcpSetFunnelStatus(keyHash, funnel_id, "draft")
      return {
        content: [{ type: "text", text: `Unpublished "${funnel.name}".` }],
        structuredContent: { funnel },
      }
    }
  )

  // Permission: any valid, non-revoked API key.
  // Example prompt: "Delete that funnel."
  server.registerTool(
    "delete_funnel",
    {
      title: "Delete funnel",
      description: "Permanently delete a funnel and any orders recorded through it.",
      inputSchema: { funnel_id: z.string().describe("Funnel UUID") },
      outputSchema: { deleted: z.boolean() },
      annotations: { destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ funnel_id }, extra) => {
      const keyHash = getKeyHash(extra)
      await mcpDeleteFunnel(keyHash, funnel_id)
      return {
        content: [{ type: "text", text: "Funnel deleted." }],
        structuredContent: { deleted: true },
      }
    }
  )

  return server
}
