const PREFIX = "clutch:";

function getKey(key) {
  return `${PREFIX}${key}`;
}

export function readStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(
      getKey(key)
    );

    if (value === null) {
      return fallback;
    }

    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(
      getKey(key),
      JSON.stringify(value)
    );

    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key) {
  try {
    localStorage.removeItem(
      getKey(key)
    );

    return true;
  } catch {
    return false;
  }
}

export function clearClutchStorage() {
  try {
    Object.keys(localStorage)
      .filter((key) =>
        key.startsWith(PREFIX)
      )
      .forEach((key) =>
        localStorage.removeItem(key)
      );

    return true;
  } catch {
    return false;
  }
}

/* -------------------------------------------------- */
/* Player */
/* -------------------------------------------------- */

export function getSavedPlayer() {
  return readStorage("player", {
    queue: [],
    currentIndex: -1
  });
}

export function savePlayer({
  queue,
  currentIndex
}) {
  return writeStorage("player", {
    queue: Array.isArray(queue)
      ? queue
      : [],

    currentIndex:
      Number.isInteger(currentIndex)
        ? currentIndex
        : -1
  });
}

/* -------------------------------------------------- */
/* Liked tracks */
/* -------------------------------------------------- */

export function getLikedTracks() {
  return readStorage("liked", []);
}

export function saveLikedTracks(tracks) {
  return writeStorage(
    "liked",
    Array.isArray(tracks)
      ? tracks
      : []
  );
}

/* -------------------------------------------------- */
/* App preferences */
/* -------------------------------------------------- */

export function getPreferences() {
  return readStorage("preferences", {
    autoplay: true,
    volume: 100
  });
}

export function savePreferences(
  preferences
) {
  return writeStorage(
    "preferences",
    preferences
  );
}
