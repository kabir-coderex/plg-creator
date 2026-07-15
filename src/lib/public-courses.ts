import "server-only"

import { createClient } from "@/lib/supabase/server"

export type PublicCourse = {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  categoryName: string | null
}

export type PublicLesson = {
  id: string
  title: string
  content: string | null
  videoUrl: string | null
}

export async function getPublicCourse(
  orgSlug: string,
  courseSlug: string
): Promise<{ organization: { name: string; slug: string }; course: PublicCourse } | null> {
  const supabase = await createClient()

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .maybeSingle()

  if (orgError) {
    throw orgError
  }
  if (!org) {
    return null
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, description, thumbnail_url, categories (name)")
    .eq("org_id", org.id)
    .eq("slug", courseSlug)
    .eq("status", "published")
    .maybeSingle()

  if (courseError) {
    throw courseError
  }
  if (!course) {
    return null
  }

  const category = Array.isArray(course.categories) ? course.categories[0] : course.categories

  return {
    organization: { name: org.name, slug: org.slug },
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      categoryName: category?.name ?? null,
    },
  }
}

export async function getPublicLessons(courseId: string): Promise<PublicLesson[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, content, video_url")
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
  }))
}
