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

  const playlistId =
    typeof req.query.playlistId === "string"
      ? req.query.playlistId.trim()
      : "";

  if (!playlistId) {
    return res.status(400).json({
      error: "playlistId is required."
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
      playlistId,
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
        `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`
      );

    if (!result.ok) {
      return res.status(
        result.status
      ).json(result.data);
    }

    const items =
      (result.data.items || [])
        .filter(
          (item) =>
            item.contentDetails
              ?.videoId
        )
        .map((item) => ({
          id: item.id,

          videoId:
            item.contentDetails.videoId,

          position:
            item.snippet?.position ??
            null,

          title:
            item.snippet?.title ||
            "Untitled",

          channel:
            item.snippet
              ?.videoOwnerChannelTitle ||
            item.snippet?.channelTitle ||
            "",

          description:
            item.snippet
              ?.description ||
            "",

          thumbnail:
            item.snippet?.thumbnails
              ?.maxres?.url ||
            item.snippet?.thumbnails
              ?.high?.url ||
            item.snippet?.thumbnails
              ?.medium?.url ||
            item.snippet?.thumbnails
              ?.default?.url ||
            null,

          publishedAt:
            item.snippet
              ?.publishedAt ||
            null
        }));

    return res.status(200).json({
      playlistId,

      items,

      nextPageToken:
        result.data.nextPageToken ||
        null,

      totalResults:
        result.data.pageInfo
          ?.totalResults ||
        items.length
    });
  } catch (error) {
    console.error(
      "Playlist items error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to load playlist items."
    });
  }
}
