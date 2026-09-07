import crypto from "node:crypto";

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [
          part.slice(0, index),
          decodeURIComponent(part.slice(index + 1))
        ];
      })
      .filter(([key]) => key)
  );
}

function decryptSession(session, secret) {
  const [ivEncoded, tagEncoded, encryptedEncoded] =
    session.split(".");

  if (!ivEncoded || !tagEncoded || !encryptedEncoded) {
    throw new Error("Invalid session.");
  }

  const key = crypto
    .createHash("sha256")
    .update(secret)
    .digest();

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivEncoded, "base64url")
  );

  decipher.setAuthTag(
    Buffer.from(tagEncoded, "base64url")
  );

  const decrypted = Buffer.concat([
    decipher.update(
      Buffer.from(encryptedEncoded, "base64url")
    ),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}

function getSession(req) {
  const secret = process.env.CLUTCH_SESSION_SECRET;

  if (!secret) {
    throw new Error("Session secret is not configured.");
  }

  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies.clutch_session;

  if (!sessionCookie) {
    return null;
  }

  return decryptSession(sessionCookie, secret);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  try {
    const session = getSession(req);

    if (!session?.access_token) {
      return res.status(401).json({
        error: "Not authenticated."
      });
    }

    const playlistId =
      typeof req.query.playlistId === "string"
        ? req.query.playlistId
        : "";

    if (!playlistId) {
      return res.status(400).json({
        error: "playlistId is required."
      });
    }

    const maxResults = Math.min(
      Math.max(
        Number.parseInt(req.query.maxResults || "50", 10),
        1
      ),
      50
    );

    const pageToken =
      typeof req.query.pageToken === "string"
        ? req.query.pageToken
        : "";

    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      playlistId,
      maxResults: String(maxResults)
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    );

    if (!response.ok) {
      const details = await response.text();

      console.error(
        "YouTube playlist items request failed:",
        details
      );

      return res.status(response.status).json({
        error: "Unable to load playlist items."
      });
    }

    const data = await response.json();

    const items = (data.items || [])
      .filter((item) => item.contentDetails?.videoId)
      .map((item) => ({
        id: item.id,

        videoId:
          item.contentDetails.videoId,

        position:
          item.snippet?.position ?? null,

        title:
          item.snippet?.title || "Untitled",

        channel:
          item.snippet?.videoOwnerChannelTitle ||
          item.snippet?.channelTitle ||
          "",

        description:
          item.snippet?.description || "",

        thumbnail:
          item.snippet?.thumbnails?.maxres?.url ||
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          null,

        publishedAt:
          item.snippet?.publishedAt || null
      }));

    return res.status(200).json({
      playlistId,

      items,

      nextPageToken:
        data.nextPageToken || null,

      totalResults:
        data.pageInfo?.totalResults || items.length
    });
  } catch (error) {
    console.error(
      "Playlist items error:",
      error
    );

    return res.status(500).json({
      error: "Failed to load playlist items."
    });
  }
}
