import { useCallback, useEffect, useState } from "react";
import {
  cleanTrack,
  cleanTracks,
  containsTrack,
  getSafeIndex
} from "../lib/player";
import {
  getSavedPlayer,
  savePlayer
} from "../lib/storage";

export default function usePlayer() {
  const saved = getSavedPlayer();

  const [queue, setQueue] = useState(
    cleanTracks(saved.queue)
  );

  const [currentIndex, setCurrentIndex] =
    useState(
      getSafeIndex(
        saved.currentIndex,
        saved.queue?.length || 0
      )
    );

  const [playing, setPlaying] = useState(false);

  const current =
    currentIndex >= 0 &&
    currentIndex < queue.length
      ? queue[currentIndex]
      : null;

  useEffect(() => {
    savePlayer({
      queue,
      currentIndex
    });
  }, [queue, currentIndex]);

  const play = useCallback((track) => {
    const clean = cleanTrack(track);

    if (!clean) {
      return;
    }

    setQueue((currentQueue) => {
      const existingIndex =
        currentQueue.findIndex(
          (item) =>
            item.videoId === clean.videoId
        );

      if (existingIndex !== -1) {
        setCurrentIndex(existingIndex);
        return currentQueue;
      }

      const nextQueue = [
        ...currentQueue,
        clean
      ];

      setCurrentIndex(
        nextQueue.length - 1
      );

      return nextQueue;
    });

    setPlaying(true);
  }, []);

  const playIndex = useCallback((index) => {
    setQueue((currentQueue) => {
      const safeIndex = getSafeIndex(
        index,
        currentQueue.length
      );

      if (safeIndex === -1) {
        return currentQueue;
      }

      setCurrentIndex(safeIndex);
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
    const clean = cleanTrack(track);

    if (!clean) {
      return;
    }

    setQueue((currentQueue) => {
      if (
        containsTrack(
          currentQueue,
          clean.videoId
        )
      ) {
        return currentQueue;
      }

      return [
        ...currentQueue,
        clean
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

        setCurrentIndex(
          (currentIndexValue) => {
            if (index < currentIndexValue) {
              return currentIndexValue - 1;
            }

            if (
              index === currentIndexValue
            ) {
              if (!nextQueue.length) {
                setPlaying(false);
                return -1;
              }

              return Math.min(
                currentIndexValue,
                nextQueue.length - 1
              );
            }

            return currentIndexValue;
          }
        );

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
      const validTracks =
        cleanTracks(tracks);

      if (!validTracks.length) {
        setQueue([]);
        setCurrentIndex(-1);
        setPlaying(false);
        return;
      }

      const safeIndex = getSafeIndex(
        startIndex,
        validTracks.length
      );

      setQueue(validTracks);
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
