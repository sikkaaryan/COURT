import {
  youtubeRequest
} from "../../lib/server/youtube.js";

export default async function handler(
  req,
  res
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  try {
    const maxResults = Math.min(
      Math.max(
        Number.parseInt(
          req.query.maxResults || "50",
          10
        ),
        1
      ),
      50
    );

    const pageToken =
      typeof req.query.pageToken === "string"
        ? req.query.pageToken
        : "";

    const params = new URLSearchParams({
      part:
        "snippet,contentDetails",
      mine: "true",
      maxResults: String(maxResults)
    });

    if (pageToken) {
      params.set(
        "pageToken",
        pageToken
      );
    }

    const result =
      await youtubeRequest(
        req,
        res,
        `https://www.googleapis.com/youtube/v3/playlists?${params.toString()}`
      );

    if (!result.ok) {
      return res.status(
        result.status
      ).json(result.data);
    }

    const playlists =
      (result.data.items || []).map(
        (playlist) => ({
          id: playlist.id,

          title:
            playlist.snippet?.title ||
            "Untitled Playlist",

          description:
            playlist.snippet
              ?.description ||
            "",

          thumbnail:
            playlist.snippet?.thumbnails
              ?.high?.url ||
            playlist.snippet?.thumbnails
              ?.medium?.url ||
            playlist.snippet?.thumbnails
              ?.default?.url ||
            null,

          itemCount:
            playlist.contentDetails
              ?.itemCount || 0,

          publishedAt:
            playlist.snippet
              ?.publishedAt ||
            null
        })
      );

    return res.status(200).json({
      playlists,

      nextPageToken:
        result.data.nextPageToken ||
        null,

      totalResults:
        result.data.pageInfo
          ?.totalResults ||
        playlists.length
    });
  } catch (error) {
    console.error(
      "YouTube playlists error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to load YouTube playlists."
    });
  }
}
