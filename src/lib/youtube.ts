import "server-only"

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

export type YoutubePlaylistVideo = {
  videoId: string
  title: string
  description: string
  position: number
}

export type YoutubePlaylist = {
  id: string
  title: string
  videos: YoutubePlaylistVideo[]
}

export function extractPlaylistId(input: string): string {
  const trimmed = input.trim()

  try {
    const url = new URL(trimmed)
    const listId = url.searchParams.get("list")
    if (listId) {
      return listId
    }
  } catch {
    // Not a URL — treat the input as a raw playlist ID below.
  }

  if (/^[\w-]{10,}$/.test(trimmed)) {
    return trimmed
  }

  throw new Error(
    `Could not find a playlist ID in "${input}". Pass a playlist URL (with ?list=...) or the raw playlist ID.`
  )
}

function requireApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) {
    throw new Error(
      "YOUTUBE_API_KEY is not configured on the server — an admin needs to add it to .env.local."
    )
  }
  return key
}

async function youtubeGet(path: string, params: Record<string, string>) {
  const url = `${YOUTUBE_API_BASE}/${path}?${new URLSearchParams(params)}`
  const res = await fetch(url)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(`YouTube API error: ${json.error?.message ?? res.statusText}`)
  }

  return json
}

export async function fetchYoutubePlaylist(playlistUrlOrId: string): Promise<YoutubePlaylist> {
  const apiKey = requireApiKey()
  const playlistId = extractPlaylistId(playlistUrlOrId)

  const playlistJson = await youtubeGet("playlists", { part: "snippet", id: playlistId, key: apiKey })
  const playlistItem = playlistJson.items?.[0]

  if (!playlistItem) {
    throw new Error("Playlist not found, private, or unlisted — only public playlists can be imported.")
  }

  const videos: YoutubePlaylistVideo[] = []
  let pageToken: string | undefined

  do {
    const itemsJson = await youtubeGet("playlistItems", {
      part: "snippet",
      playlistId,
      maxResults: "50",
      key: apiKey,
      ...(pageToken ? { pageToken } : {}),
    })

    for (const item of itemsJson.items ?? []) {
      const snippet = item.snippet
      if (!snippet || snippet.title === "Private video" || snippet.title === "Deleted video") {
        continue
      }
      videos.push({
        videoId: snippet.resourceId?.videoId,
        title: snippet.title,
        description: snippet.description ?? "",
        position: videos.length,
      })
    }

    pageToken = itemsJson.nextPageToken
  } while (pageToken)

  return {
    id: playlistId,
    title: playlistItem.snippet?.title ?? "Imported playlist",
    videos,
  }
}
