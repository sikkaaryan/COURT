const api = {
  async get(url) {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json"
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error || `Request failed (${response.status})`
      );
    }

    return data;
  },

  async getProfile() {
    return this.get("/api/youtube/profile");
  },

  async getPlaylists({
    maxResults = 50,
    pageToken = ""
  } = {}) {
    const params = new URLSearchParams({
      maxResults: String(maxResults)
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    return this.get(
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
      throw new Error("playlistId is required.");
    }

    const params = new URLSearchParams({
      playlistId,
      maxResults: String(maxResults)
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    return this.get(
      `/api/youtube/playlist-items?${params.toString()}`
    );
  },

  async search(query, maxResults = 20) {
    const cleanQuery = query?.trim();

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

    return this.get(
      `/api/youtube/search?${params.toString()}`
    );
  },

  async getSession() {
    return this.get("/api/auth/session");
  },

  login() {
    window.location.href = "/api/auth/google";
  },

  logout() {
    window.location.href = "/api/auth/logout";
  }
};

export default api;
