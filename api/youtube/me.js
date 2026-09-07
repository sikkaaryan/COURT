import crypto from "node:crypto";

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");

        if (index === -1) {
          return null;
        }

        return [
          part.slice(0, index),
          decodeURIComponent(part.slice(index + 1))
        ];
      })
      .filter(Boolean)
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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  const secret = process.env.CLUTCH_SESSION_SECRET;

  if (!secret) {
    return res.status(500).json({
      error: "Session secret is not configured."
    });
  }

  try {
    const cookies = parseCookies(
      req.headers.cookie || ""
    );

    const sessionCookie =
      cookies.clutch_session;

    if (!sessionCookie) {
      return res.status(401).json({
        authenticated: false,
        error: "Not authenticated."
      });
    }

    const session = decryptSession(
      sessionCookie,
      secret
    );

    if (!session.access_token) {
      return res.status(401).json({
        authenticated: false,
        error: "Invalid session."
      });
    }

    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    );

    if (!response.ok) {
      return res.status(401).json({
        authenticated: false,
        error: "Google session is no longer valid."
      });
    }

    const profile = await response.json();

    return res.status(200).json({
      authenticated: true,

      user: {
        id: profile.sub || null,
        name: profile.name || "",
        firstName: profile.given_name || "",
        lastName: profile.family_name || "",
        email: profile.email || "",
        avatar: profile.picture || null
      }
    });
  } catch (error) {
    console.error(
      "Google identity lookup failed:",
      error
    );

    return res.status(401).json({
      authenticated: false,
      error: "Unable to verify your account."
    });
  }
}
