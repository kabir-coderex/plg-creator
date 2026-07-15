import "server-only"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export async function getAuthedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

export type OrgMembership = {
  id: string
  name: string
  slug: string
  role: string
}

export async function getUserMemberships(): Promise<OrgMembership[]> {
  const user = await getAuthedUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("memberships")
    .select("role, organizations (id, name, slug)")
    .eq("user_id", user.id)

  if (error) {
    throw error
  }

  return (data ?? []).flatMap((row) => {
    const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations
    if (!org) return []
    return [{ id: org.id, name: org.name, slug: org.slug, role: row.role }]
  })
}

export type ApiKey = {
  id: string
  name: string
  keyPrefix: string
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
}

export async function getApiKeys(orgId: string): Promise<ApiKey[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, last_used_at, revoked_at, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    keyPrefix: row.key_prefix,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  }))
}

export type Category = { id: string; name: string; slug: string }

export async function getCategories(orgId: string): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("org_id", orgId)
    .order("name")

  if (error) {
    throw error
  }

  return data ?? []
}

export type Course = {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnailUrl: string | null
  status: "draft" | "published"
  categoryId: string | null
  categoryName: string | null
  createdAt: string
  updatedAt: string
}

const COURSE_SELECT =
  "id, title, slug, description, thumbnail_url, status, category_id, categories (name), created_at, updated_at"

function mapCourse(row: {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  status: string
  category_id: string | null
  categories: { name: string }[] | { name: string } | null
  created_at: string
  updated_at: string
}): Course {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    status: row.status as Course["status"],
    categoryId: row.category_id,
    categoryName: category?.name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getCourses(orgId: string): Promise<Course[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_SELECT)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(mapCourse)
}

export async function getCourse(orgId: string, courseId: string): Promise<Course | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_SELECT)
    .eq("org_id", orgId)
    .eq("id", courseId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapCourse(data) : null
}

export type Lesson = {
  id: string
  title: string
  content: string | null
  videoUrl: string | null
  position: number
}

export async function getLessons(orgId: string, courseId: string): Promise<Lesson[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, content, video_url, position")
    .eq("org_id", orgId)
    .eq("course_id", courseId)
    .order("position")

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    videoUrl: row.video_url,
    position: row.position,
  }))
}

export type QuizQuestion = {
  question: string
  options: string[]
  correct_answer: string
}

export type Quiz = {
  id: string
  title: string
  questions: QuizQuestion[]
  status: "draft" | "published"
}

export async function getQuizzes(orgId: string, courseId: string): Promise<Quiz[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("quizzes")
    .select("id, title, questions, status")
    .eq("org_id", orgId)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    questions: row.questions as QuizQuestion[],
    status: row.status as Quiz["status"],
  }))
}

export type Funnel = {
  id: string
  courseId: string
  courseTitle: string | null
  name: string
  slug: string
  headline: string
  subheadline: string | null
  description: string | null
  ctaText: string
  priceLabel: string
  thankYouMessage: string
  status: "draft" | "published"
  createdAt: string
  updatedAt: string
}

const FUNNEL_SELECT =
  "id, course_id, name, slug, headline, subheadline, description, cta_text, price_label, thank_you_message, status, created_at, updated_at, courses (title)"

function mapFunnel(row: {
  id: string
  course_id: string
  name: string
  slug: string
  headline: string
  subheadline: string | null
  description: string | null
  cta_text: string
  price_label: string
  thank_you_message: string
  status: string
  created_at: string
  updated_at: string
  courses: { title: string }[] | { title: string } | null
}): Funnel {
  const course = Array.isArray(row.courses) ? row.courses[0] : row.courses
  return {
    id: row.id,
    courseId: row.course_id,
    courseTitle: course?.title ?? null,
    name: row.name,
    slug: row.slug,
    headline: row.headline,
    subheadline: row.subheadline,
    description: row.description,
    ctaText: row.cta_text,
    priceLabel: row.price_label,
    thankYouMessage: row.thank_you_message,
    status: row.status as Funnel["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getFunnels(orgId: string): Promise<Funnel[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("funnels")
    .select(FUNNEL_SELECT)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(mapFunnel)
}

export async function getFunnel(orgId: string, funnelId: string): Promise<Funnel | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("funnels")
    .select(FUNNEL_SELECT)
    .eq("org_id", orgId)
    .eq("id", funnelId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapFunnel(data) : null
}

export type Order = {
  id: string
  funnelId: string
  customerName: string
  customerEmail: string
  status: string
  createdAt: string
}

export async function getOrders(orgId: string, funnelId?: string): Promise<Order[]> {
  const supabase = await createClient()

  let query = supabase
    .from("orders")
    .select("id, funnel_id, customer_name, customer_email, status, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (funnelId) {
    query = query.eq("funnel_id", funnelId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    funnelId: row.funnel_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    status: row.status,
    createdAt: row.created_at,
  }))
}

export type Contact = {
  id: string
  email: string
  name: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

export async function getContacts(orgId: string): Promise<Contact[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contacts")
    .select("id, email, name, tags, created_at, updated_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export type Automation = {
  id: string
  name: string
  triggerType: string
  triggerConfig: { funnel_id?: string }
  actionType: string
  actionConfig: { tag?: string }
  status: "draft" | "active"
  createdAt: string
  updatedAt: string
}

const AUTOMATION_SELECT =
  "id, name, trigger_type, trigger_config, action_type, action_config, status, created_at, updated_at"

function mapAutomation(row: {
  id: string
  name: string
  trigger_type: string
  trigger_config: { funnel_id?: string } | null
  action_type: string
  action_config: { tag?: string } | null
  status: string
  created_at: string
  updated_at: string
}): Automation {
  return {
    id: row.id,
    name: row.name,
    triggerType: row.trigger_type,
    triggerConfig: row.trigger_config ?? {},
    actionType: row.action_type,
    actionConfig: row.action_config ?? {},
    status: row.status as Automation["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getAutomations(orgId: string): Promise<Automation[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("automations")
    .select(AUTOMATION_SELECT)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(mapAutomation)
}

export async function getAutomation(orgId: string, automationId: string): Promise<Automation | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("automations")
    .select(AUTOMATION_SELECT)
    .eq("org_id", orgId)
    .eq("id", automationId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapAutomation(data) : null
}

export type AutomationRun = {
  id: string
  automationId: string
  contactEmail: string | null
  createdAt: string
}

export async function getAutomationRuns(orgId: string, automationId?: string): Promise<AutomationRun[]> {
  const supabase = await createClient()

  let query = supabase
    .from("automation_runs")
    .select("id, automation_id, created_at, contacts (email)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(20)

  if (automationId) {
    query = query.eq("automation_id", automationId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => {
    const contact = Array.isArray(row.contacts) ? row.contacts[0] : row.contacts
    return {
      id: row.id,
      automationId: row.automation_id,
      contactEmail: contact?.email ?? null,
      createdAt: row.created_at,
    }
  })
}
