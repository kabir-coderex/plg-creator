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
