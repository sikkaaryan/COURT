export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "YouTube API key is not configured."
    });
  }

  const query =
    typeof req.query.q === "string"
      ? req.query.q.trim()
      : "";

  if (!query) {
    return res.status(400).json({
      error: "Search query is required."
    });
  }

  const maxResults = Math.min(
    Math.max(
      Number.parseInt(req.query.maxResults || "20", 10),
      1
    ),
    50
  );

  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      videoCategoryId: "10",
      maxResults: String(maxResults),
      key: apiKey
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
    );

    if (!response.ok) {
      const details = await response.text();

      console.error(
        "YouTube search failed:",
        details
      );

      return res.status(response.status).json({
        error: "YouTube search failed."
      });
    }

    const data = await response.json();

    const results = (data.items || [])
      .filter((item) => item.id?.videoId)
      .map((item) => ({
        videoId: item.id.videoId,

        title:
          item.snippet?.title || "Untitled",

        channel:
          item.snippet?.channelTitle || "",

        description:
          item.snippet?.description || "",

        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          null,

        publishedAt:
          item.snippet?.publishedAt || null
      }));

    return res.status(200).json({
      results,

      nextPageToken:
        data.nextPageToken || null,

      totalResults:
        data.pageInfo?.totalResults || results.length
    });
  } catch (error) {
    console.error(
      "YouTube search error:",
      error
    );

    return res.status(500).json({
      error: "Failed to search YouTube."
    });
  }
}
