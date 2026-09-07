async function request(
  url,
  options = {}
) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {})
    }
  });

  const data =
    await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.error ||
        `Request failed (${response.status})`
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

const api = {
  get(url) {
    return request(url, {
      method: "GET"
    });
  },

  async getProfile() {
    return request(
      "/api/youtube/profile"
    );
  },

  async getMe() {
    return request(
      "/api/youtube/me"
    );
  },

  async getPlaylists({
    maxResults = 50,
    pageToken = ""
  } = {}) {
    const params = new URLSearchParams({
      maxResults: String(maxResults)
    });

    if (pageToken) {
      params.set(
        "pageToken",
        pageToken
      );
    }

    return request(
      `/api/youtube/playlists?${params.toString()}`
    );
  },

  async getPlaylistItems(
    playlistId,
    {
      maxResults = 50,
      pageToken = ""
    } = {}
  ) {
    if (!playlistId) {
      throw new Error(
        "playlistId is required."
      );
    }

    const params = new URLSearchParams({
      playlistId,
      maxResults: String(maxResults)
    });

    if (pageToken) {
      params.set(
        "pageToken",
        pageToken
      );
    }

    return request(
      `/api/youtube/playlist-items?${params.toString()}`
    );
  },

  async search(
    query,
    maxResults = 20
  ) {
    const cleanQuery =
      query?.trim() || "";

    if (!cleanQuery) {
      return {
        results: [],
        nextPageToken: null,
        totalResults: 0
      };
    }

    const params = new URLSearchParams({
      q: cleanQuery,
      maxResults: String(maxResults)
    });

    return request(
      `/api/youtube/search?${params.toString()}`
    );
  },

  getSession() {
    return request(
      "/api/auth/session"
    );
  },

  login() {
    window.location.assign(
      "/api/auth/google"
    );
  },

  logout() {
    window.location.assign(
      "/api/auth/logout"
    );
  }
};

export default api;
