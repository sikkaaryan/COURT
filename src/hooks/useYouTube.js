import { useCallback, useEffect, useState } from "react";
import api from "../lib/api";

export default function useYouTube() {
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [playlistError, setPlaylistError] = useState(null);

  const [playlistItems, setPlaylistItems] = useState({});
  const [loadingItems, setLoadingItems] = useState({});
  const [itemErrors, setItemErrors] = useState({});

  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const loadPlaylists = useCallback(async () => {
    setLoadingPlaylists(true);
    setPlaylistError(null);

    try {
      const data = await api.getPlaylists();

      setPlaylists(data.playlists || []);

      return data.playlists || [];
    } catch (error) {
      console.error("Failed to load playlists:", error);

      setPlaylistError(error.message);

      return [];
    } finally {
      setLoadingPlaylists(false);
    }
  }, []);

  const loadPlaylistItems = useCallback(
    async (playlistId) => {
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
        const data = await api.getPlaylistItems(
          playlistId
        );

        const items = data.items || [];

        setPlaylistItems((current) => ({
          ...current,
          [playlistId]: items
        }));

        return items;
      } catch (error) {
        console.error(
          "Failed to load playlist items:",
          error
        );

        setItemErrors((current) => ({
          ...current,
          [playlistId]: error.message
        }));

        return [];
      } finally {
        setLoadingItems((current) => ({
          ...current,
          [playlistId]: false
        }));
      }
    },
    []
  );

  const search = useCallback(async (query) => {
    const cleanQuery = query?.trim();

    if (!cleanQuery) {
      setSearchResults([]);
      setSearchError(null);
      return [];
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const data = await api.search(cleanQuery);

      const results = data.results || [];

      setSearchResults(results);

      return results;
    } catch (error) {
      console.error("YouTube search failed:", error);

      setSearchError(error.message);
      setSearchResults([]);

      return [];
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  return {
    playlists,
    loadingPlaylists,
    playlistError,

    playlistItems,
    loadingItems,
    itemErrors,

    searchResults,
    searchLoading,
    searchError,

    loadPlaylists,
    loadPlaylistItems,
    search
  };
}
