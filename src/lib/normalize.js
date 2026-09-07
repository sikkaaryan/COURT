export function normalizeTrack(track) {
  if (!track) {
    return null;
  }

  const videoId =
    track.videoId ||
    track.id?.videoId ||
    track.contentDetails?.videoId ||
    null;

  if (!videoId) {
    return null;
  }

  return {
    videoId,

    title:
      track.title ||
      track.snippet?.title ||
      "Untitled",

    channel:
      track.channel ||
      track.channelTitle ||
      track.snippet?.channelTitle ||
      track.snippet?.videoOwnerChannelTitle ||
      "",

    description:
      track.description ||
      track.snippet?.description ||
      "",

    thumbnail:
      track.thumbnail ||
      track.snippet?.thumbnails?.maxres?.url ||
      track.snippet?.thumbnails?.high?.url ||
      track.snippet?.thumbnails?.medium?.url ||
      track.snippet?.thumbnails?.default?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,

    publishedAt:
      track.publishedAt ||
      track.snippet?.publishedAt ||
      null
  };
}

export function normalizeTracks(tracks) {
  if (!Array.isArray(tracks)) {
    return [];
  }

  return tracks
    .map(normalizeTrack)
    .filter(Boolean);
}

export function normalizePlaylist(playlist) {
  if (!playlist) {
    return null;
  }

  return {
    id: playlist.id,

    title:
      playlist.title ||
      playlist.snippet?.title ||
      "Untitled Playlist",

    description:
      playlist.description ||
      playlist.snippet?.description ||
      "",

    thumbnail:
      playlist.thumbnail ||
      playlist.snippet?.thumbnails?.high?.url ||
      playlist.snippet?.thumbnails?.medium?.url ||
      playlist.snippet?.thumbnails?.default?.url ||
      null,

    itemCount:
      playlist.itemCount ||
      playlist.contentDetails?.itemCount ||
      0,

    publishedAt:
      playlist.publishedAt ||
      playlist.snippet?.publishedAt ||
      null
  };
}

export function normalizePlaylists(playlists) {
  if (!Array.isArray(playlists)) {
    return [];
  }

  return playlists
    .map(normalizePlaylist)
    .filter((playlist) => playlist?.id);
}
