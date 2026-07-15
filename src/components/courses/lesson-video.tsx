import { toYoutubeEmbedUrl } from "@/lib/video-embed"

export function LessonVideo({ url }: { url: string }) {
  const embedUrl = toYoutubeEmbedUrl(url)

  if (embedUrl) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
        <iframe
          src={embedUrl}
          title="Lesson video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-sm text-primary underline underline-offset-4"
    >
      Watch video ↗
    </a>
  )
}
