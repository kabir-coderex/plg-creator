import type { PublicLesson } from "@/lib/public-courses"

export type LessonKind = "video" | "pdf"

export function getLessonKind(lesson: Pick<PublicLesson, "videoUrl">): LessonKind {
  return lesson.videoUrl ? "video" : "pdf"
}

export function getLessonKindLabel(kind: LessonKind): string {
  return kind === "video" ? "Video" : "PDF"
}

// No duration is stored yet — estimate from content length so the UI has a
// realistic-looking number instead of a fixed placeholder everywhere.
export function estimateDurationMinutes(lesson: Pick<PublicLesson, "videoUrl" | "content">): number {
  const wordCount = lesson.content?.trim().split(/\s+/).filter(Boolean).length ?? 0
  if (lesson.videoUrl) {
    return Math.max(3, Math.round(wordCount / 120) || 4)
  }
  return Math.max(2, Math.round(wordCount / 160) || 3)
}
