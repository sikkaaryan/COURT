export function isPlayableTrack(track) {
  return Boolean(
    track?.videoId &&
    typeof track.videoId === "string"
  );
}

export function cleanTrack(track) {
  if (!isPlayableTrack(track)) {
    return null;
  }

  return {
    videoId: track.videoId,
    title: track.title || "Untitled",
    channel: track.channel || "",
    description: track.description || "",
    thumbnail: track.thumbnail || null,
    publishedAt: track.publishedAt || null
  };
}

export function cleanTracks(tracks) {
  if (!Array.isArray(tracks)) {
    return [];
  }

  return tracks
    .map(cleanTrack)
    .filter(Boolean);
}

export function containsTrack(queue, videoId) {
  if (!Array.isArray(queue) || !videoId) {
    return false;
  }

  return queue.some(
    (track) => track?.videoId === videoId
  );
}

export function findTrackIndex(queue, videoId) {
  if (!Array.isArray(queue) || !videoId) {
    return -1;
  }

  return queue.findIndex(
    (track) => track?.videoId === videoId
  );
}

export function getSafeIndex(index, length) {
  if (!length) {
    return -1;
  }

  return Math.min(
    Math.max(Number.isInteger(index) ? index : 0, 0),
    length - 1
  );
}
