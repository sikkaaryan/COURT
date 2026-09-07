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

function encryptSession(payload, secret) {
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
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(".");
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    CLUTCH_SESSION_SECRET
  } = process.env;

  if (
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GOOGLE_REDIRECT_URI ||
    !CLUTCH_SESSION_SECRET
  ) {
    return res.status(500).json({
      error: "Google OAuth is not configured."
    });
  }

  const {
    code,
    state,
    error
  } = req.query;

  if (error) {
    return res.redirect(
      `/?auth_error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return res.status(400).json({
      error: "Missing OAuth parameters."
    });
  }

  const cookies = parseCookies(
    req.headers.cookie
  );

  const savedState =
    cookies.clutch_oauth_state;

  if (
    !savedState ||
    savedState !== state
  ) {
    return res.status(400).json({
      error: "Invalid OAuth state."
    });
  }

  try {
    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },

        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: "authorization_code"
        })
      }
    );

    if (!tokenResponse.ok) {
      console.error(
        "Google token exchange failed:",
        await tokenResponse.text()
      );

      return res.status(401).json({
        error:
          "Google authentication failed."
      });
    }

    const tokens =
      await tokenResponse.json();

    if (!tokens.access_token) {
      return res.status(401).json({
        error:
          "Google did not return an access token."
      });
    }

    const session = encryptSession(
      {
        access_token:
          tokens.access_token,

        refresh_token:
          tokens.refresh_token || null,

        expires_at:
          Date.now() +
          Number(tokens.expires_in || 3600) *
            1000
      },
      CLUTCH_SESSION_SECRET
    );

    res.setHeader("Set-Cookie", [
      [
        `clutch_session=${session}`,
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Path=/",
        "Max-Age=604800"
      ].join("; "),

      [
        "clutch_oauth_state=",
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Path=/",
        "Max-Age=0"
      ].join("; ")
    ]);

    return res.redirect("/");
  } catch (err) {
    console.error(
      "OAuth callback error:",
      err
    );

    return res.status(500).json({
      error:
        "Unable to complete Google authentication."
    });
  }
}
