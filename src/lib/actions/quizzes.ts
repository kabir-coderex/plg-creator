"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { generateDummyQuizQuestions } from "@/lib/quiz-dummy"

export async function createQuiz(courseId: string, orgId: string, courseTitle: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("quizzes").insert({
    org_id: orgId,
    course_id: courseId,
    title: `${courseTitle} Quiz`,
    questions: generateDummyQuizQuestions(),
    status: "draft",
  })

  if (error) {
    throw error
  }

  revalidatePath(`/dashboard/courses/${courseId}`)
}

export async function setQuizStatus(quizId: string, courseId: string, status: "draft" | "published") {
  const supabase = await createClient()
  const { error } = await supabase.from("quizzes").update({ status }).eq("id", quizId)

  if (error) {
    throw error
  }

  revalidatePath(`/dashboard/courses/${courseId}`)
}

export async function deleteQuiz(quizId: string, courseId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("quizzes").delete().eq("id", quizId)

  if (error) {
    throw error
  }

  revalidatePath(`/dashboard/courses/${courseId}`)
}
