import {
  getSession,
  setSessionCookie
} from "./session.js";

const GOOGLE_TOKEN_URL =
  "https://oauth2.googleapis.com/token";

async function refreshAccessToken(
  session
) {
  if (!session?.refresh_token) {
    return null;
  }

  const response = await fetch(
    GOOGLE_TOKEN_URL,
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
        grant_type:
          "refresh_token"
      })
    }
  );

  if (!response.ok) {
    console.error(
      "Google token refresh failed:",
      await response.text()
    );

    return null;
  }

  const tokens =
    await response.json();

  if (!tokens.access_token) {
    return null;
  }

  return {
    access_token:
      tokens.access_token,

    refresh_token:
      tokens.refresh_token ||
      session.refresh_token,

    expires_at:
      Date.now() +
      Number(
        tokens.expires_in || 3600
      ) * 1000
  };
}

export async function getValidSession(
  req,
  res
) {
  const session = getSession(req);

  if (!session?.access_token) {
    return null;
  }

  const expiresAt =
    Number(session.expires_at || 0);

  if (
    expiresAt &&
    Date.now() <
      expiresAt - 60_000
  ) {
    return session;
  }

  const refreshed =
    await refreshAccessToken(
      session
    );

  if (!refreshed) {
    return null;
  }

  setSessionCookie(
    res,
    refreshed
  );

  return refreshed;
}

export async function youtubeRequest(
  req,
  res,
  url
) {
  let session =
    await getValidSession(
      req,
      res
    );

  if (!session) {
    return {
      ok: false,
      status: 401,
      data: {
        error:
          "Not authenticated."
      }
    };
  }

  let response = await fetch(
    url,
    {
      headers: {
        Authorization:
          `Bearer ${session.access_token}`
      }
    }
  );

  /*
   * The token may have been revoked or
   * expired unexpectedly. Try one refresh
   * before giving up.
   */
  if (response.status === 401) {
    const refreshed =
      await refreshAccessToken(
        session
      );

    if (!refreshed) {
      return {
        ok: false,
        status: 401,
        data: {
          error:
            "Google session is no longer valid."
        }
      };
    }

    setSessionCookie(
      res,
      refreshed
    );

    session = refreshed;

    response = await fetch(
      url,
      {
        headers: {
          Authorization:
            `Bearer ${session.access_token}`
        }
      }
    );
  }

  const text =
    await response.text();

  let data = {};

  try {
    data = text
      ? JSON.parse(text)
      : {};
  } catch {
    data = {
      error: text
    };
  }

  return {
    ok: response.ok,
    status: response.status,
    data
  };
}
