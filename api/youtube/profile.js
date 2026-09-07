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
    const params =
      new URLSearchParams({
        part:
          "snippet,contentDetails,statistics",
        mine: "true"
      });

    const result =
      await youtubeRequest(
        req,
        res,
        `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`
      );

    if (!result.ok) {
      return res.status(
        result.status
      ).json(result.data);
    }

    const channel =
      result.data.items?.[0];

    if (!channel) {
      return res.status(404).json({
        error:
          "No YouTube channel found."
      });
    }

    return res.status(200).json({
      id: channel.id,

      name:
        channel.snippet?.title ||
        "",

      description:
        channel.snippet?.description ||
        "",

      avatar:
        channel.snippet?.thumbnails?.high
          ?.url ||
        channel.snippet?.thumbnails?.medium
          ?.url ||
        channel.snippet?.thumbnails?.default
          ?.url ||
        null,

      country:
        channel.snippet?.country ||
        null,

      statistics: {
        subscribers:
          channel.statistics
            ?.subscriberCount ||
          null,

        videos:
          channel.statistics
            ?.videoCount ||
          null,

        views:
          channel.statistics
            ?.viewCount ||
          null
      },

      uploadsPlaylistId:
        channel.contentDetails
          ?.relatedPlaylists
          ?.uploads ||
        null
    });
  } catch (error) {
    console.error(
      "YouTube profile error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to load YouTube profile."
    });
  }
}
