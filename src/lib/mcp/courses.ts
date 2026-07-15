import "server-only"

import { createAnonClient } from "@/lib/supabase/anon"

export type McpCourse = {
  id: string
  org_id: string
  category_id: string | null
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  status: string
  created_at: string
  updated_at: string
}

export type McpLesson = {
  id: string
  org_id: string
  course_id: string
  title: string
  content: string | null
  video_url: string | null
  position: number
  created_at: string
  updated_at: string
}

export type McpCategory = {
  id: string
  org_id: string
  name: string
  slug: string
  created_at: string
}

function raise(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message)
  }
}

export async function mcpListCourses(keyHash: string, status?: string): Promise<McpCourse[]> {
  const { data, error } = await createAnonClient().rpc("mcp_list_courses", {
    p_key_hash: keyHash,
    p_status: status ?? null,
  })
  raise(error)
  return (data ?? []) as McpCourse[]
}

export async function mcpCreateCourse(
  keyHash: string,
  input: {
    title: string
    slug: string
    description?: string
    categoryId?: string
    thumbnailUrl?: string
    status?: string
  }
): Promise<McpCourse> {
  const { data, error } = await createAnonClient().rpc("mcp_create_course", {
    p_key_hash: keyHash,
    p_title: input.title,
    p_slug: input.slug,
    p_description: input.description ?? null,
    p_category_id: input.categoryId ?? null,
    p_thumbnail_url: input.thumbnailUrl ?? null,
    p_status: input.status ?? "draft",
  })
  raise(error)
  return data as McpCourse
}

export async function mcpUpdateCourse(
  keyHash: string,
  input: {
    courseId: string
    title?: string
    description?: string
    categoryId?: string
    thumbnailUrl?: string
  }
): Promise<McpCourse> {
  const { data, error } = await createAnonClient().rpc("mcp_update_course", {
    p_key_hash: keyHash,
    p_course_id: input.courseId,
    p_title: input.title ?? null,
    p_description: input.description ?? null,
    p_category_id: input.categoryId ?? null,
    p_thumbnail_url: input.thumbnailUrl ?? null,
  })
  raise(error)
  return data as McpCourse
}

export async function mcpSetCourseStatus(
  keyHash: string,
  courseId: string,
  status: "draft" | "published"
): Promise<McpCourse> {
  const { data, error } = await createAnonClient().rpc("mcp_set_course_status", {
    p_key_hash: keyHash,
    p_course_id: courseId,
    p_status: status,
  })
  raise(error)
  return data as McpCourse
}

export async function mcpDeleteCourse(keyHash: string, courseId: string): Promise<void> {
  const { error } = await createAnonClient().rpc("mcp_delete_course", {
    p_key_hash: keyHash,
    p_course_id: courseId,
  })
  raise(error)
}

export async function mcpListLessons(keyHash: string, courseId: string): Promise<McpLesson[]> {
  const { data, error } = await createAnonClient().rpc("mcp_list_lessons", {
    p_key_hash: keyHash,
    p_course_id: courseId,
  })
  raise(error)
  return (data ?? []) as McpLesson[]
}

export async function mcpCreateLesson(
  keyHash: string,
  input: { courseId: string; title: string; content?: string; videoUrl?: string; position?: number }
): Promise<McpLesson> {
  const { data, error } = await createAnonClient().rpc("mcp_create_lesson", {
    p_key_hash: keyHash,
    p_course_id: input.courseId,
    p_title: input.title,
    p_content: input.content ?? null,
    p_video_url: input.videoUrl ?? null,
    p_position: input.position ?? null,
  })
  raise(error)
  return data as McpLesson
}

export async function mcpUpdateLesson(
  keyHash: string,
  input: {
    lessonId: string
    title?: string
    content?: string
    videoUrl?: string
    position?: number
  }
): Promise<McpLesson> {
  const { data, error } = await createAnonClient().rpc("mcp_update_lesson", {
    p_key_hash: keyHash,
    p_lesson_id: input.lessonId,
    p_title: input.title ?? null,
    p_content: input.content ?? null,
    p_video_url: input.videoUrl ?? null,
    p_position: input.position ?? null,
  })
  raise(error)
  return data as McpLesson
}

export async function mcpDeleteLesson(keyHash: string, lessonId: string): Promise<void> {
  const { error } = await createAnonClient().rpc("mcp_delete_lesson", {
    p_key_hash: keyHash,
    p_lesson_id: lessonId,
  })
  raise(error)
}

export async function mcpListCategories(keyHash: string): Promise<McpCategory[]> {
  const { data, error } = await createAnonClient().rpc("mcp_list_categories", {
    p_key_hash: keyHash,
  })
  raise(error)
  return (data ?? []) as McpCategory[]
}

export async function mcpCreateCategory(
  keyHash: string,
  input: { name: string; slug: string }
): Promise<McpCategory> {
  const { data, error } = await createAnonClient().rpc("mcp_create_category", {
    p_key_hash: keyHash,
    p_name: input.name,
    p_slug: input.slug,
  })
  raise(error)
  return data as McpCategory
}

export async function mcpDeleteCategory(keyHash: string, categoryId: string): Promise<void> {
  const { error } = await createAnonClient().rpc("mcp_delete_category", {
    p_key_hash: keyHash,
    p_category_id: categoryId,
  })
  raise(error)
}
