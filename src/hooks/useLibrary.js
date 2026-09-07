import { useCallback, useState } from "react";
import api from "../lib/api";
import {
  normalizePlaylists,
  normalizeTracks
} from "../lib/normalize";
import {
  getLikedTracks,
  saveLikedTracks
} from "../lib/storage";

export default function useLibrary() {
  const [playlists, setPlaylists] = useState([]);
  const [playlistTracks, setPlaylistTracks] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingPlaylist, setLoadingPlaylist] =
    useState(null);
  const [error, setError] = useState(null);

  const [likedTracks, setLikedTracks] = useState(
    () => getLikedTracks()
  );

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getPlaylists();

      const normalized =
        normalizePlaylists(
          data.playlists
        );

      setPlaylists(normalized);

      return normalized;
    } catch (err) {
      console.error(
        "Failed to load playlists:",
        err
      );

      setError(err.message);

      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlaylist = useCallback(
    async (playlistId) => {
      if (!playlistId) {
        return [];
      }

      setLoadingPlaylist(playlistId);
      setError(null);

      try {
        const data =
          await api.getPlaylistItems(
            playlistId
          );

        const tracks =
          normalizeTracks(data.items);

        setPlaylistTracks((current) => ({
          ...current,
          [playlistId]: tracks
        }));

        return tracks;
      } catch (err) {
        console.error(
          "Failed to load playlist:",
          err
        );

        setError(err.message);

        return [];
      } finally {
        setLoadingPlaylist(null);
      }
    },
    []
  );

  const toggleLike = useCallback(
    (track) => {
      if (!track?.videoId) {
        return;
      }

      setLikedTracks((current) => {
        const exists = current.some(
          (item) =>
            item.videoId === track.videoId
        );

        const updated = exists
          ? current.filter(
              (item) =>
                item.videoId !==
                track.videoId
            )
          : [...current, track];

        saveLikedTracks(updated);

        return updated;
      });
    },
    []
  );

  const isLiked = useCallback(
    (videoId) => {
      return likedTracks.some(
        (track) =>
          track.videoId === videoId
      );
    },
    [likedTracks]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    playlists,
    playlistTracks,
    likedTracks,

    loading,
    loadingPlaylist,
    error,

    loadPlaylists,
    loadPlaylist,

    toggleLike,
    isLiked,

    clearError
  };
}
