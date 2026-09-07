import {
  useCallback,
  useEffect,
  useState
} from "react";
import api from "../lib/api";
import {
  normalizePlaylists,
  normalizeTracks
} from "../lib/normalize";

export default function useYouTube(
  isAuthenticated = false
) {
  const [playlists, setPlaylists] =
    useState([]);

  const [playlistItems, setPlaylistItems] =
    useState({});

  const [loadingPlaylists, setLoadingPlaylists] =
    useState(false);

  const [loadingItems, setLoadingItems] =
    useState({});

  const [playlistError, setPlaylistError] =
    useState(null);

  const [itemErrors, setItemErrors] =
    useState({});

  const [searchResults, setSearchResults] =
    useState([]);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [searchError, setSearchError] =
    useState(null);

  const loadPlaylists =
    useCallback(async () => {
      if (!isAuthenticated) {
        setPlaylists([]);
        return [];
      }

      setLoadingPlaylists(true);
      setPlaylistError(null);

      try {
        const data =
          await api.getPlaylists();

        const normalized =
          normalizePlaylists(
            data.playlists
          );

        setPlaylists(normalized);

        return normalized;
      } catch (error) {
        console.error(
          "Failed to load playlists:",
          error
        );

        setPlaylistError(
          error.message ||
            "Unable to load playlists."
        );

        return [];
      } finally {
        setLoadingPlaylists(false);
      }
    }, [isAuthenticated]);

  const loadPlaylistItems =
    useCallback(async (playlistId) => {
      if (!playlistId) {
        return [];
      }

      setLoadingItems((current) => ({
        ...current,
        [playlistId]: true
      }));

      setItemErrors((current) => ({
        ...current,
        [playlistId]: null
      }));

      try {
        const data =
          await api.getPlaylistItems(
            playlistId
          );

        const tracks =
          normalizeTracks(data.items);

        setPlaylistItems((current) => ({
          ...current,
          [playlistId]: tracks
        }));

        return tracks;
      } catch (error) {
        console.error(
          "Failed to load playlist items:",
          error
        );

        setItemErrors((current) => ({
          ...current,
          [playlistId]:
            error.message ||
            "Unable to load playlist."
        }));

        return [];
      } finally {
        setLoadingItems((current) => ({
          ...current,
          [playlistId]: false
        }));
      }
    }, []);

  const search =
    useCallback(async (query) => {
      const cleanQuery =
        query?.trim() || "";

      if (!cleanQuery) {
        setSearchResults([]);
        setSearchError(null);
        return [];
      }

      setSearchLoading(true);
      setSearchError(null);

      try {
        const data =
          await api.search(cleanQuery);

        const results =
          normalizeTracks(
            data.results || []
          );

        setSearchResults(results);

        return results;
      } catch (error) {
        console.error(
          "YouTube search failed:",
          error
        );

        setSearchResults([]);
        setSearchError(
          error.message ||
            "Search failed."
        );

        return [];
      } finally {
        setSearchLoading(false);
      }
    }, []);

  const clearSearch =
    useCallback(() => {
      setSearchResults([]);
      setSearchError(null);
    }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadPlaylists();
    } else {
      setPlaylists([]);
      setPlaylistItems({});
      setPlaylistError(null);
    }
  }, [
    isAuthenticated,
    loadPlaylists
  ]);

  return {
    playlists,
    playlistItems,

    loadingPlaylists,
    loadingItems,

    playlistError,
    itemErrors,

    searchResults,
    searchLoading,
    searchError,

    loadPlaylists,
    loadPlaylistItems,

    search,
    clearSearch
  };
}
