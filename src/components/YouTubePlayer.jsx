import { useEffect, useRef, useState } from "react";

const PLAYER_SCRIPT =
  "https://www.youtube.com/iframe_api";

export default function YouTubePlayer({
  track,
  playing,
  onEnded,
  onReady
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  const [ready, setReady] = useState(false);

  /*
   * Load the official YouTube IFrame Player API.
   */
  useEffect(() => {
    if (window.YT?.Player) {
      setReady(true);
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${PLAYER_SCRIPT}"]`
    );

    if (existingScript) {
      const previousCallback =
        window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        setReady(true);
      };

      return;
    }

    const previousCallback =
      window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      setReady(true);
    };

    const script = document.createElement("script");

    script.src = PLAYER_SCRIPT;
    script.async = true;

    document.head.appendChild(script);

    return () => {
      if (
        window.onYouTubeIframeAPIReady &&
        window.onYouTubeIframeAPIReady !== previousCallback
      ) {
        window.onYouTubeIframeAPIReady =
          previousCallback;
      }
    };
  }, []);

  /*
   * Create the YouTube player once the API is ready.
   */
  useEffect(() => {
    if (!ready || !containerRef.current) {
      return;
    }

    if (playerRef.current) {
      return;
    }

    playerRef.current = new window.YT.Player(
      containerRef.current,
      {
        width: "1",
        height: "1",

        playerVars: {
          autoplay: 0,
          controls: 0,
          playsinline: 1,
          rel: 0,
          modestbranding: 1
        },

        events: {
          onReady: (event) => {
            onReady?.(event);
          },

          onStateChange: (event) => {
            if (
              event.data ===
              window.YT.PlayerState.ENDED
            ) {
              onEnded?.();
            }
          }
        }
      }
    );

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [ready, onEnded, onReady]);

  /*
   * Load the selected track.
   */
  useEffect(() => {
    const player = playerRef.current;

    if (!player || !track?.videoId) {
      return;
    }

    player.loadVideoById(track.videoId);
  }, [track?.videoId]);

  /*
   * Play / pause.
   */
  useEffect(() => {
    const player = playerRef.current;

    if (!player || !track?.videoId) {
      return;
    }

    if (playing) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [playing, track?.videoId]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        width: 1,
        height: 1,
        left: -9999,
        bottom: 0,
        overflow: "hidden",
        opacity: 0,
        pointerEvents: "none"
      }}
    />
  );
}
