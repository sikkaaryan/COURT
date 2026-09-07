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

  const iv = Buffer.from(ivEncoded, "base64url");
  const authTag = Buffer.from(tagEncoded, "base64url");
  const encrypted = Buffer.from(
    encryptedEncoded,
    "base64url"
  );

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
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
        authenticated: false
      });
    }

    const session = decryptSession(
      sessionCookie,
      secret
    );

    if (
      !session.access_token ||
      !session.expires_at
    ) {
      return res.status(401).json({
        authenticated: false
      });
    }

    /*
     * Access token is still valid.
     */
    if (Date.now() < session.expires_at - 60000) {
      return res.status(200).json({
        authenticated: true
      });
    }

    /*
     * Access token expired.
     * Refresh it using Google's refresh token.
     */
    if (!session.refresh_token) {
      return res.status(401).json({
        authenticated: false,
        reason: "reauth_required"
      });
    }

    const refreshResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id:
            process.env.GOOGLE_CLIENT_ID,
          client_secret:
            process.env.GOOGLE_CLIENT_SECRET,
          refresh_token:
            session.refresh_token,
          grant_type: "refresh_token"
        })
      }
    );

    if (!refreshResponse.ok) {
      return res.status(401).json({
        authenticated: false,
        reason: "refresh_failed"
      });
    }

    const refreshed = await refreshResponse.json();

    const updatedSession = {
      access_token: refreshed.access_token,
      refresh_token:
        refreshed.refresh_token ||
        session.refresh_token,
      expires_at:
        Date.now() +
        Number(refreshed.expires_in || 3600) * 1000
    };

    const key = crypto
      .createHash("sha256")
      .update(secret)
      .digest();

    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      key,
      iv
    );

    const encrypted = Buffer.concat([
      cipher.update(
        JSON.stringify(updatedSession),
        "utf8"
      ),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    const newSession = [
      iv.toString("base64url"),
      authTag.toString("base64url"),
      encrypted.toString("base64url")
    ].join(".");

    res.setHeader(
      "Set-Cookie",
      [
        `clutch_session=${newSession}`,
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Path=/",
        "Max-Age=604800"
      ].join("; ")
    );

    return res.status(200).json({
      authenticated: true
    });
  } catch (error) {
    console.error(
      "Session validation failed:",
      error
    );

    return res.status(401).json({
      authenticated: false
    });
  }
}
