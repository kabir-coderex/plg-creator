"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type LessonFormState = { error?: string } | undefined

export async function createLesson(
  courseId: string,
  orgId: string,
  _prevState: LessonFormState,
  formData: FormData
): Promise<LessonFormState> {
  const title = (formData.get("title") as string)?.trim()
  if (!title || title.length < 2) {
    return { error: "Title must be at least 2 characters." }
  }

  const content = (formData.get("content") as string)?.trim() || null
  const videoUrl = (formData.get("video_url") as string)?.trim() || null

  const supabase = await createClient()
  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)

  const { error } = await supabase.from("lessons").insert({
    org_id: orgId,
    course_id: courseId,
    title,
    content,
    video_url: videoUrl,
    position: count ?? 0,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/courses/${courseId}`)
  return undefined
}

export async function updateLesson(
  lessonId: string,
  courseId: string,
  _prevState: LessonFormState,
  formData: FormData
): Promise<LessonFormState> {
  const title = (formData.get("title") as string)?.trim()
  if (!title || title.length < 2) {
    return { error: "Title must be at least 2 characters." }
  }

  const content = (formData.get("content") as string)?.trim() || null
  const videoUrl = (formData.get("video_url") as string)?.trim() || null

  const supabase = await createClient()
  const { error } = await supabase
    .from("lessons")
    .update({ title, content, video_url: videoUrl })
    .eq("id", lessonId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/courses/${courseId}`)
  return undefined
}

export async function deleteLesson(lessonId: string, courseId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId)

  if (error) {
    throw error
  }

  revalidatePath(`/dashboard/courses/${courseId}`)
}
