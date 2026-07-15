export type DummyQuizQuestion = {
  question: string
  options: string[]
  correct_answer: string
}

const QUESTION_COUNT = 5

// Placeholder content — real AI-authored questions are a future upgrade (see docs/Milestone.md).
export function generateDummyQuizQuestions(): DummyQuizQuestion[] {
  return Array.from({ length: QUESTION_COUNT }, (_, i) => ({
    question: `Placeholder question ${i + 1} — replace with real content.`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correct_answer: "Option A",
  }))
}
