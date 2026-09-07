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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const secret = process.env.CLUTCH_SESSION_SECRET;

  if (!secret) {
    return res.status(500).json({
      error: "Session secret is not configured."
    });
  }

  try {
    const cookies = parseCookies(req.headers.cookie);
    const sessionCookie = cookies.clutch_session;

    if (!sessionCookie) {
      return res.status(401).json({
        error: "Not authenticated."
      });
    }

    const session = decryptSession(
      sessionCookie,
      secret
    );

    if (!session.access_token) {
      return res.status(401).json({
        error: "Invalid session."
      });
    }

    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true",
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    );

    if (!response.ok) {
      const details = await response.text();

      console.error(
        "YouTube profile request failed:",
        details
      );

      return res.status(response.status).json({
        error: "Unable to load YouTube profile."
      });
    }

    const data = await response.json();
    const channel = data.items?.[0];

    if (!channel) {
      return res.status(404).json({
        error: "No YouTube channel found."
      });
    }

    return res.status(200).json({
      id: channel.id,

      name: channel.snippet?.title || "",

      description:
        channel.snippet?.description || "",

      avatar:
        channel.snippet?.thumbnails?.high?.url ||
        channel.snippet?.thumbnails?.default?.url ||
        null,

      country:
        channel.snippet?.country || null,

      statistics: {
        subscribers:
          channel.statistics?.subscriberCount || null,

        videos:
          channel.statistics?.videoCount || null,

        views:
          channel.statistics?.viewCount || null
      },

      uploadsPlaylistId:
        channel.contentDetails?.relatedPlaylists?.uploads ||
        null
    });
  } catch (error) {
    console.error(
      "YouTube profile error:",
      error
    );

    return res.status(500).json({
      error: "Failed to load YouTube profile."
    });
  }
}
