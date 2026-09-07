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
    throw new Error("Invalid session");
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

async function getAccessToken(req) {
  const secret = process.env.CLUTCH_SESSION_SECRET;

  if (!secret) {
    throw new Error("Session secret is not configured.");
  }

  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies.clutch_session;

  if (!sessionCookie) {
    return null;
  }

  const session = decryptSession(
    sessionCookie,
    secret
  );

  return session.access_token || null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const accessToken = await getAccessToken(req);

    if (!accessToken) {
      return res.status(401).json({
        error: "Not authenticated."
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
      mine: "true",
      maxResults: String(maxResults)
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      const details = await response.text();

      console.error(
        "YouTube playlists request failed:",
        details
      );

      return res.status(response.status).json({
        error: "Unable to load YouTube playlists."
      });
    }

    const data = await response.json();

    const playlists = (data.items || []).map((playlist) => ({
      id: playlist.id,

      title:
        playlist.snippet?.title || "Untitled Playlist",

      description:
        playlist.snippet?.description || "",

      thumbnail:
        playlist.snippet?.thumbnails?.high?.url ||
        playlist.snippet?.thumbnails?.medium?.url ||
        playlist.snippet?.thumbnails?.default?.url ||
        null,

      itemCount:
        playlist.contentDetails?.itemCount || 0,

      publishedAt:
        playlist.snippet?.publishedAt || null
    }));

    return res.status(200).json({
      playlists,

      nextPageToken:
        data.nextPageToken || null,

      totalResults:
        data.pageInfo?.totalResults || playlists.length
    });
  } catch (error) {
    console.error(
      "YouTube playlists error:",
      error
    );

    return res.status(500).json({
      error: "Failed to load YouTube playlists."
    });
  }
}
