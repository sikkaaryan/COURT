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

function decryptSession(
  sessionCookie,
  secret
) {
  const [
    ivEncoded,
    tagEncoded,
    encryptedEncoded
  ] = sessionCookie.split(".");

  if (
    !ivEncoded ||
    !tagEncoded ||
    !encryptedEncoded
  ) {
    throw new Error(
      "Invalid session format."
    );
  }

  const key = crypto
    .createHash("sha256")
    .update(secret)
    .digest();

  const decipher =
    crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(
        ivEncoded,
        "base64url"
      )
    );

  decipher.setAuthTag(
    Buffer.from(
      tagEncoded,
      "base64url"
    )
  );

  const decrypted =
    Buffer.concat([
      decipher.update(
        Buffer.from(
          encryptedEncoded,
          "base64url"
        )
      ),
      decipher.final()
    ]);

  return JSON.parse(
    decrypted.toString("utf8")
  );
}

export function getSession(req) {
  const secret =
    process.env.CLUTCH_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "Session secret is not configured."
    );
  }

  const cookies = parseCookies(
    req.headers.cookie || ""
  );

  const sessionCookie =
    cookies.clutch_session;

  if (!sessionCookie) {
    return null;
  }

  return decryptSession(
    sessionCookie,
    secret
  );
}

export function getAccessToken(req) {
  const session = getSession(req);

  if (!session?.access_token) {
    return null;
  }

  return session.access_token;
}

export function setSessionCookie(
  res,
  session
) {
  const secret =
    process.env.CLUTCH_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "Session secret is not configured."
    );
  }

  const key = crypto
    .createHash("sha256")
    .update(secret)
    .digest();

  const iv =
    crypto.randomBytes(12);

  const cipher =
    crypto.createCipheriv(
      "aes-256-gcm",
      key,
      iv
    );

  const encrypted =
    Buffer.concat([
      cipher.update(
        JSON.stringify(session),
        "utf8"
      ),
      cipher.final()
    ]);

  const authTag =
    cipher.getAuthTag();

  const encoded = [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(".");

  res.setHeader(
    "Set-Cookie",
    [
      [
        `clutch_session=${encoded}`,
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Path=/",
        "Max-Age=604800"
      ].join("; ")
    ]
  );
}
