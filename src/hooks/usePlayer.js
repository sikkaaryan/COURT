import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "clutch_player";

function loadSavedPlayer() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return {
        queue: [],
        currentIndex: -1,
        playing: false
      };
    }

    const parsed = JSON.parse(saved);

    return {
      queue: Array.isArray(parsed.queue)
        ? parsed.queue
        : [],
      currentIndex:
        Number.isInteger(parsed.currentIndex)
          ? parsed.currentIndex
          : -1,
      playing: false
    };
  } catch {
    return {
      queue: [],
      currentIndex: -1,
      playing: false
    };
  }
}

export default function usePlayer() {
  const initial = useMemo(
    () => loadSavedPlayer(),
    []
  );

  const [queue, setQueue] = useState(initial.queue);

  const [currentIndex, setCurrentIndex] =
    useState(initial.currentIndex);

  const [playing, setPlaying] = useState(false);

  const current =
    currentIndex >= 0 &&
    currentIndex < queue.length
      ? queue[currentIndex]
      : null;

  /*
   * Persist queue and current track.
   */
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          queue,
          currentIndex
        })
      );
    } catch {
      // Ignore localStorage failures.
    }
  }, [queue, currentIndex]);

  const play = useCallback((track) => {
    if (!track?.videoId) {
      return;
    }

    setQueue((currentQueue) => {
      const existingIndex = currentQueue.findIndex(
        (item) => item.videoId === track.videoId
      );

      if (existingIndex !== -1) {
        setCurrentIndex(existingIndex);
        return currentQueue;
      }

      const nextQueue = [
        ...currentQueue,
        track
      ];

      setCurrentIndex(nextQueue.length - 1);

      return nextQueue;
    });

    setPlaying(true);
  }, []);

  const playIndex = useCallback((index) => {
    setQueue((currentQueue) => {
      if (
        index < 0 ||
        index >= currentQueue.length
      ) {
        return currentQueue;
      }

      setCurrentIndex(index);
      setPlaying(true);

      return currentQueue;
    });
  }, []);

  const pause = useCallback(() => {
    setPlaying(false);
  }, []);

  const resume = useCallback(() => {
    if (current) {
      setPlaying(true);
    }
  }, [current]);

  const togglePlay = useCallback(() => {
    if (!current) {
      return;
    }

    setPlaying((value) => !value);
  }, [current]);

  const next = useCallback(() => {
    setCurrentIndex((index) => {
      if (!queue.length) {
        return -1;
      }

      if (index >= queue.length - 1) {
        return 0;
      }

      return index + 1;
    });

    setPlaying(true);
  }, [queue.length]);

  const previous = useCallback(() => {
    setCurrentIndex((index) => {
      if (!queue.length) {
        return -1;
      }

      if (index <= 0) {
        return queue.length - 1;
      }

      return index - 1;
    });

    setPlaying(true);
  }, [queue.length]);

  const addToQueue = useCallback((track) => {
    if (!track?.videoId) {
      return;
    }

    setQueue((currentQueue) => {
      const exists = currentQueue.some(
        (item) => item.videoId === track.videoId
      );

      if (exists) {
        return currentQueue;
      }

      return [
        ...currentQueue,
        track
      ];
    });
  }, []);

  const removeFromQueue = useCallback(
    (index) => {
      setQueue((currentQueue) => {
        if (
          index < 0 ||
          index >= currentQueue.length
        ) {
          return currentQueue;
        }

        const nextQueue =
          currentQueue.filter(
            (_, itemIndex) =>
              itemIndex !== index
          );

        setCurrentIndex((currentIndexValue) => {
          if (index < currentIndexValue) {
            return currentIndexValue - 1;
          }

          if (
            index === currentIndexValue &&
            currentIndexValue >= nextQueue.length
          ) {
            return nextQueue.length - 1;
          }

          return currentIndexValue;
        });

        return nextQueue;
      });
    },
    []
  );

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(-1);
    setPlaying(false);
  }, []);

  const replaceQueue = useCallback(
    (tracks, startIndex = 0) => {
      const validTracks = Array.isArray(tracks)
        ? tracks.filter(
            (track) => track?.videoId
          )
        : [];

      setQueue(validTracks);

      if (!validTracks.length) {
        setCurrentIndex(-1);
        setPlaying(false);
        return;
      }

      const safeIndex = Math.min(
        Math.max(startIndex, 0),
        validTracks.length - 1
      );

      setCurrentIndex(safeIndex);
      setPlaying(true);
    },
    []
  );

  return {
    queue,
    current,
    currentIndex,
    playing,

    play,
    playIndex,
    pause,
    resume,
    togglePlay,

    next,
    previous,

    addToQueue,
    removeFromQueue,
    clearQueue,
    replaceQueue
  };
}
