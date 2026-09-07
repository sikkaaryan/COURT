import { useCallback, useEffect, useRef, useState } from "react";
import api from "../lib/api";
import { normalizeTracks } from "../lib/normalize";

export default function useSearch(delay = 350) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);

  const search = useCallback(async (value) => {
    const cleanQuery = value?.trim() || "";

    setQuery(value || "");

    if (!cleanQuery) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const data = await api.search(cleanQuery);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setResults(
        normalizeTracks(data.results || [])
      );
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error("Search failed:", err);

      setResults([]);
      setError(
        err.message || "Search failed."
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      return;
    }

    const timer = window.setTimeout(() => {
      search(query);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, delay, search]);

  const clearSearch = useCallback(() => {
    requestIdRef.current += 1;

    setQuery("");
    setResults([]);
    setLoading(false);
    setError(null);
  }, []);

  return {
    query,
    results,
    loading,
    error,
    setQuery,
    search,
    clearSearch
  };
}
