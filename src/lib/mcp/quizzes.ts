import "server-only"

import { createAnonClient } from "@/lib/supabase/anon"
import type { DummyQuizQuestion } from "@/lib/quiz-dummy"

export type McpQuiz = {
  id: string
  org_id: string
  course_id: string
  title: string
  questions: DummyQuizQuestion[]
  status: string
  created_at: string
  updated_at: string
}

function raise(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message)
  }
}

export async function mcpCreateQuiz(
  keyHash: string,
  input: { courseId: string; title?: string; questions: DummyQuizQuestion[]; status?: string }
): Promise<McpQuiz> {
  const { data, error } = await createAnonClient().rpc("mcp_create_quiz", {
    p_key_hash: keyHash,
    p_course_id: input.courseId,
    p_title: input.title ?? null,
    p_questions: input.questions,
    p_status: input.status ?? "draft",
  })
  raise(error)
  return data as McpQuiz
}

export async function mcpListQuizzes(keyHash: string, courseId?: string): Promise<McpQuiz[]> {
  const { data, error } = await createAnonClient().rpc("mcp_list_quizzes", {
    p_key_hash: keyHash,
    p_course_id: courseId ?? null,
  })
  raise(error)
  return (data ?? []) as McpQuiz[]
}

export async function mcpDeleteQuiz(keyHash: string, quizId: string): Promise<void> {
  const { error } = await createAnonClient().rpc("mcp_delete_quiz", {
    p_key_hash: keyHash,
    p_quiz_id: quizId,
  })
  raise(error)
}
