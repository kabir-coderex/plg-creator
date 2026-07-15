"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { uniqueSlug } from "@/lib/slug"

export type CourseFormState = { error?: string } | undefined

async function uploadThumbnail(orgId: string, file: File): Promise<string> {
  const supabase = await createClient()
  const ext = file.name.split(".").pop() || "jpg"
  const path = `${orgId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from("course-media").upload(path, file, { upsert: true })
  if (error) {
    throw new Error(`Thumbnail upload failed: ${error.message}`)
  }

  return supabase.storage.from("course-media").getPublicUrl(path).data.publicUrl
}

function getThumbnailFile(formData: FormData): File | null {
  const entry = formData.get("thumbnail")
  return entry instanceof File && entry.size > 0 ? entry : null
}

export async function createCourse(
  orgId: string,
  _prevState: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  const title = (formData.get("title") as string)?.trim()
  if (!title || title.length < 2) {
    return { error: "Title must be at least 2 characters." }
  }

  const description = (formData.get("description") as string)?.trim() || null
  const categoryId = (formData.get("category_id") as string) || null
  const thumbnailFile = getThumbnailFile(formData)

  let thumbnailUrl: string | null = null
  if (thumbnailFile) {
    try {
      thumbnailUrl = await uploadThumbnail(orgId, thumbnailFile)
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Thumbnail upload failed." }
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("courses")
    .insert({
      org_id: orgId,
      title,
      slug: uniqueSlug(title),
      description,
      category_id: categoryId,
      thumbnail_url: thumbnailUrl,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/courses")
  redirect(`/dashboard/courses/${data.id}`)
}

export async function updateCourse(
  courseId: string,
  orgId: string,
  _prevState: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  const title = (formData.get("title") as string)?.trim()
  if (!title || title.length < 2) {
    return { error: "Title must be at least 2 characters." }
  }

  const description = (formData.get("description") as string)?.trim() || null
  const categoryId = (formData.get("category_id") as string) || null
  const thumbnailFile = getThumbnailFile(formData)

  const updates: {
    title: string
    description: string | null
    category_id: string | null
    thumbnail_url?: string
  } = { title, description, category_id: categoryId }

  if (thumbnailFile) {
    try {
      updates.thumbnail_url = await uploadThumbnail(orgId, thumbnailFile)
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Thumbnail upload failed." }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("courses").update(updates).eq("id", courseId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/courses/${courseId}`)
  revalidatePath("/dashboard/courses")
  return undefined
}

export async function setCourseStatus(courseId: string, status: "draft" | "published") {
  const supabase = await createClient()
  const { error } = await supabase.from("courses").update({ status }).eq("id", courseId)

  if (error) {
    throw error
  }

  revalidatePath(`/dashboard/courses/${courseId}`)
  revalidatePath("/dashboard/courses")
}

export async function deleteCourse(courseId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("courses").delete().eq("id", courseId)

  if (error) {
    throw error
  }

  revalidatePath("/dashboard/courses")
  redirect("/dashboard/courses")
}

export type CategoryFormState = { error?: string } | undefined

export async function createCategory(
  orgId: string,
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const name = (formData.get("name") as string)?.trim()
  if (!name || name.length < 2) {
    return { error: "Name must be at least 2 characters." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("categories")
    .insert({ org_id: orgId, name, slug: uniqueSlug(name) })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/courses")
  return undefined
}
