import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Home,
  Search,
  Library,
  ListMusic,
  Settings,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  LogIn,
  LogOut,
  ChevronRight,
  X
} from "lucide-react";

import useAuth from "./hooks/useAuth";
import useYouTube from "./hooks/useYouTube";
import usePlayer from "./hooks/usePlayer";
import YouTubePlayer from "./components/YouTubePlayer";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
  { id: "library", label: "Library", icon: Library },
  { id: "queue", label: "Queue", icon: ListMusic },
  { id: "settings", label: "Settings", icon: Settings }
];

function App() {
  const {
    user,
    loading: authLoading,
    isAuthenticated,
    login,
    logout
  } = useAuth();

  const {
    playlists,
    loadingPlaylists,
    playlistError,
    playlistItems,
    loadingItems,
    loadPlaylistItems,
    searchResults,
    searchLoading,
    searchError,
    search
  } = useYouTube();

  const {
    queue,
    current,
    currentIndex,
    playing,
    play,
    togglePlay,
    next,
    previous,
    addToQueue,
    removeFromQueue,
    clearQueue,
    replaceQueue
  } = usePlayer();

  const [tab, setTab] = useState("home");
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] =
    useState(null);

  const [query, setQuery] = useState("");

  const [likedTracks, setLikedTracks] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("clutch_liked") || "[]"
      );
    } catch {
      return [];
    }
  });

  /*
   * Persist likes locally.
   */
  useEffect(() => {
    localStorage.setItem(
      "clutch_liked",
      JSON.stringify(likedTracks)
    );
  }, [likedTracks]);

  const isLiked = useCallback(
    (videoId) =>
      likedTracks.some(
        (track) => track.videoId === videoId
      ),
    [likedTracks]
  );

  const toggleLike = useCallback((track) => {
    if (!track?.videoId) {
      return;
    }

    setLikedTracks((currentLikes) => {
      const exists = currentLikes.some(
        (item) => item.videoId === track.videoId
      );

      if (exists) {
        return currentLikes.filter(
          (item) => item.videoId !== track.videoId
        );
      }

      return [...currentLikes, track];
    });
  }, []);

  /*
   * Open a track in Clutch's player.
   */
  const handlePlay = useCallback(
    (track) => {
      play(track);
      setShowPlayer(true);
    },
    [play]
  );

  /*
   * Open an entire playlist.
   */
  const handlePlaylist = useCallback(
    async (playlist) => {
      setSelectedPlaylist(playlist);

      let items = playlistItems[playlist.id];

      if (!items) {
        items = await loadPlaylistItems(
          playlist.id
        );
      }

      if (items.length) {
        replaceQueue(items, 0);
        setShowPlayer(true);
      }
    },
    [
      playlistItems,
      loadPlaylistItems,
      replaceQueue
    ]
  );

  /*
   * Search with a small debounce.
   */
  useEffect(() => {
    if (tab !== "search") {
      return;
    }

    const cleanQuery = query.trim();

    if (!cleanQuery) {
      return;
    }

    const timer = setTimeout(() => {
      search(cleanQuery);
    }, 450);

    return () => clearTimeout(timer);
  }, [query, tab, search]);

  /*
   * Keyboard shortcuts for desktop testing.
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
      }

      if (event.code === "ArrowRight") {
        next();
      }

      if (event.code === "ArrowLeft") {
        previous();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [togglePlay, next, previous]);

  const currentPlaylistItems = useMemo(() => {
    if (!selectedPlaylist) {
      return [];
    }

    return playlistItems[selectedPlaylist.id] || [];
  }, [selectedPlaylist, playlistItems]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={login}
        error={new URLSearchParams(
          window.location.search
        ).get("auth_error")}
      />
    );
  }

  return (
    <div className="app-shell">
      <Header
        user={user}
        onProfile={() => setTab("settings")}
      />

      <main className="app-content">
        {tab === "home" && (
          <HomeScreen
            user={user}
            playlists={playlists}
            loading={loadingPlaylists}
            error={playlistError}
            onPlaylist={handlePlaylist}
            onPlay={handlePlay}
            onOpenSearch={() => setTab("search")}
          />
        )}

        {tab === "search" && (
          <SearchScreen
            query={query}
            setQuery={setQuery}
            results={searchResults}
            loading={searchLoading}
            error={searchError}
            onPlay={handlePlay}
            onQueue={addToQueue}
            isLiked={isLiked}
            onLike={toggleLike}
          />
        )}

        {tab === "library" && (
          <LibraryScreen
            playlists={playlists}
            loading={loadingPlaylists}
            error={playlistError}
            likedTracks={likedTracks}
            onPlaylist={handlePlaylist}
            onPlay={handlePlay}
          />
        )}

        {tab === "queue" && (
          <QueueScreen
            queue={queue}
            currentIndex={currentIndex}
            playing={playing}
            onPlayIndex={(index) => {
              if (index >= 0 && index < queue.length) {
                play(queue[index]);
                setShowPlayer(true);
              }
            }}
            onRemove={removeFromQueue}
            onClear={clearQueue}
          />
        )}

        {tab === "settings" && (
          <SettingsScreen
            user={user}
            onLogout={logout}
          />
        )}

        {selectedPlaylist && tab === "library" && (
          <PlaylistDetail
            playlist={selectedPlaylist}
            items={currentPlaylistItems}
            loading={
              loadingItems[selectedPlaylist.id]
            }
            onClose={() =>
              setSelectedPlaylist(null)
            }
            onPlay={handlePlay}
            onQueue={addToQueue}
          />
        )}
      </main>

      {current && (
        <MiniPlayer
          track={current}
          playing={playing}
          onPlayPause={togglePlay}
          onPrevious={previous}
          onNext={next}
          onOpen={() => setShowPlayer(true)}
        />
      )}

      <BottomNav
        active={tab}
        onChange={setTab}
        queueCount={queue.length}
      />

      {showPlayer && current && (
        <NowPlaying
          track={current}
          playing={playing}
          liked={isLiked(current.videoId)}
          onLike={() => toggleLike(current)}
          onPlayPause={togglePlay}
          onPrevious={previous}
          onNext={next}
          onClose={() => setShowPlayer(false)}
        />
      )}

      <YouTubePlayer
        track={current}
        playing={playing}
        onEnded={next}
      />
    </div>
  );
}

/* -------------------------------------------------- */
/* Login */
/* -------------------------------------------------- */

function LoginScreen({ onLogin, error }) {
  return (
    <div className="login-screen">
      <div className="login-brand">
        <div className="brand-mark">C</div>

        <p className="eyebrow">
          CLUTCH / MUSIC CONSOLE
        </p>

        <h1>
          Your music.
          <br />
          <span>Your court.</span>
        </h1>

        <p className="login-copy">
          A custom basketball-inspired music
          experience built for your phone.
        </p>

        {error && (
          <div className="error-card">
            Authentication failed. Please try
            signing in again.
          </div>
        )}

        <button
          className="primary-button login-button"
          onClick={onLogin}
        >
          <LogIn size={19} />
          Continue with Google
        </button>

        <p className="login-note">
          Clutch uses your Google account to access
          supported YouTube data.
        </p>
      </div>

      <div className="login-number">
        23
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* Header */
/* -------------------------------------------------- */

function Header({ user, onProfile }) {
  return (
    <header className="top-header">
      <div>
        <div className="brand-line">
          <span className="brand-name">
            CLUTCH
          </span>

          <span className="brand-dot" />
        </div>

        <p className="header-subtitle">
          MUSIC / GAME TIME
        </p>
      </div>

      <button
        className="avatar-button"
        onClick={onProfile}
        aria-label="Open settings"
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt=""
          />
        ) : (
          "C"
        )}
      </button>
    </header>
  );
}

/* -------------------------------------------------- */
/* Home */
/* -------------------------------------------------- */

function HomeScreen({
  user,
  playlists,
  loading,
  error,
  onPlaylist,
  onPlay,
  onOpenSearch
}) {
  const featured = playlists.slice(0, 4);

  return (
    <section className="screen">
      <div className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            WELCOME BACK
          </p>

          <h1>
            {user?.name
              ? user.name.split(" ")[0]
              : "PLAYER"}
          </h1>

          <p>
            What are we running
            <br />
            tonight?
          </p>

          <button
            className="hero-button"
            onClick={onOpenSearch}
          >
            Find something
            <ChevronRight size={17} />
          </button>
        </div>

        <div className="hero-number">
          23
        </div>

        <div className="basketball-lines" />
      </div>

      <SectionTitle
        title="YOUR PLAYLISTS"
        action="VIEW ALL"
      />

      {loading && (
        <div className="loading-card">
          Loading your playlists...
        </div>
      )}

      {error && (
        <div className="error-card">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="playlist-grid">
          {featured.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onClick={() =>
                onPlaylist(playlist)
              }
            />
          ))}
        </div>
      )}

      <div className="quote-card">
        <div className="quote-number">
          30
        </div>

        <div>
          <p className="quote">
            "The key to success
            <br />
            is failure."
          </p>

          <span>
            — MICHAEL JORDAN
          </span>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* Search */
/* -------------------------------------------------- */

function SearchScreen({
  query,
  setQuery,
  results,
  loading,
  error,
  onPlay,
  onQueue,
  isLiked,
  onLike
}) {
  return (
    <section className="screen">
      <SectionTitle title="SEARCH" />

      <div className="search-box">
        <Search size={20} />

        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Search music..."
          autoComplete="off"
          spellCheck="false"
        />

        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {!query && (
        <div className="search-empty">
          <div className="search-ball">
            ◎
          </div>

          <h2>SEARCH THE COURT</h2>

          <p>
            Find songs, artists and music
            across YouTube.
          </p>
        </div>
      )}

      {loading && (
        <div className="loading-card">
          Searching...
        </div>
      )}

      {error && (
        <div className="error-card">
          {error}
        </div>
      )}

      {!loading && query && (
        <div className="track-list">
          {results.map((track) => (
            <TrackRow
              key={track.videoId}
              track={track}
              onPlay={() => onPlay(track)}
              onQueue={() => onQueue(track)}
              liked={isLiked(track.videoId)}
              onLike={() => onLike(track)}
            />
          ))}

          {!results.length && (
            <div className="loading-card">
              No results found.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------- */
/* Library */
/* -------------------------------------------------- */

function LibraryScreen({
  playlists,
  loading,
  error,
  likedTracks,
  onPlaylist,
  onPlay
}) {
  return (
    <section className="screen">
      <SectionTitle title="LIBRARY" />

      <div className="library-profile">
        <div className="library-icon">
          ♡
        </div>

        <div>
          <strong>Liked Music</strong>
          <span>
            {likedTracks.length} tracks
          </span>
        </div>
      </div>

      {loading && (
        <div className="loading-card">
          Loading library...
        </div>
      )}

      {error && (
        <div className="error-card">
          {error}
        </div>
      )}

      <div className="library-list">
        {playlists.map((playlist) => (
          <button
            className="library-row"
            key={playlist.id}
            onClick={() =>
              onPlaylist(playlist)
            }
          >
            <img
              src={playlist.thumbnail}
              alt=""
            />

            <div>
              <strong>
                {playlist.title}
              </strong>

              <span>
                {playlist.itemCount} tracks
              </span>
            </div>

            <ChevronRight size={18} />
          </button>
        ))}
      </div>

      {likedTracks.length > 0 && (
        <>
          <SectionTitle
            title="LIKED MUSIC"
            action={`${likedTracks.length}`}
          />

          <div className="track-list">
            {likedTracks
              .slice(0, 10)
              .map((track) => (
                <TrackRow
                  key={track.videoId}
                  track={track}
                  onPlay={() =>
                    onPlay(track)
                  }
                />
              ))}
          </div>
        </>
      )}
    </section>
  );
}

/* -------------------------------------------------- */
/* Queue */
/* -------------------------------------------------- */

function QueueScreen({
  queue,
  currentIndex,
  onPlayIndex,
  onRemove,
  onClear
}) {
  return (
    <section className="screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            UP NEXT
          </p>

          <h2>QUEUE</h2>
        </div>

        {queue.length > 0 && (
          <button
            className="text-button"
            onClick={onClear}
          >
            CLEAR
          </button>
        )}
      </div>

      {!queue.length && (
        <div className="search-empty">
          <ListMusic size={42} />

          <h2>QUEUE IS EMPTY</h2>

          <p>
            Add music from Search or your
            Library.
          </p>
        </div>
      )}

      <div className="track-list">
        {queue.map((track, index) => (
          <div
            className={`queue-row ${
              index === currentIndex
                ? "active"
                : ""
            }`}
            key={`${track.videoId}-${index}`}
          >
            <button
              className="queue-play"
              onClick={() =>
                onPlayIndex(index)
              }
            >
              {index === currentIndex ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )}
            </button>

            <img
              src={track.thumbnail}
              alt=""
            />

            <div className="track-info">
              <strong>
                {track.title}
              </strong>

              <span>
                {track.channel}
              </span>
            </div>

            <button
              className="icon-button"
              onClick={() =>
                onRemove(index)
              }
              aria-label="Remove from queue"
            >
              <X size={17} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* Settings */
/* -------------------------------------------------- */

function SettingsScreen({ user, onLogout }) {
  return (
    <section className="screen">
      <SectionTitle title="SETTINGS" />

      <div className="profile-card">
        {user?.avatar && (
          <img
            src={user.avatar}
            alt=""
          />
        )}

        <div>
          <strong>
            {user?.name || "YouTube Player"}
          </strong>

          <span>
            Connected to YouTube
          </span>
        </div>
      </div>

      <div className="settings-group">
        <div className="setting-row">
          <div>
            <strong>ACCOUNT</strong>
            <span>
              Google / YouTube
            </span>
          </div>

          <span className="status-dot">
            CONNECTED
          </span>
        </div>

        <div className="setting-row">
          <div>
            <strong>PLAYER</strong>
            <span>
              YouTube IFrame Player
            </span>
          </div>
        </div>

        <div className="setting-row">
          <div>
            <strong>VERSION</strong>
            <span>
              Clutch 1.0.0
            </span>
          </div>
        </div>
      </div>

      <button
        className="logout-button"
        onClick={onLogout}
      >
        <LogOut size={18} />
        Sign out
      </button>

      <div className="settings-footer">
        <span>CLUTCH</span>
        <span>23 / 30</span>
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* Playlist Detail */
/* -------------------------------------------------- */

function PlaylistDetail({
  playlist,
  items,
  loading,
  onClose,
  onPlay,
  onQueue
}) {
  return (
    <div className="detail-overlay">
      <div className="detail-sheet">
        <button
          className="detail-close"
          onClick={onClose}
          aria-label="Close playlist"
        >
          <X size={20} />
        </button>

        <img
          className="detail-cover"
          src={playlist.thumbnail}
          alt=""
        />

        <p className="eyebrow">
          PLAYLIST
        </p>

        <h2>{playlist.title}</h2>

        <p className="detail-description">
          {playlist.description ||
            `${playlist.itemCount} tracks`}
        </p>

        {loading && (
          <div className="loading-card">
            Loading tracks...
          </div>
        )}

        {!loading && (
          <div className="track-list">
            {items.map((track) => (
              <TrackRow
                key={track.videoId}
                track={track}
                onPlay={() =>
                  onPlay(track)
                }
                onQueue={() =>
                  onQueue(track)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* Components */
/* -------------------------------------------------- */

function PlaylistCard({ playlist, onClick }) {
  return (
    <button
      className="playlist-card"
      onClick={onClick}
    >
      <img
        src={playlist.thumbnail}
        alt=""
      />

      <div className="playlist-overlay">
        <span>
          {playlist.itemCount} TRACKS
        </span>

        <strong>
          {playlist.title}
        </strong>
      </div>
    </button>
  );
}

function TrackRow({
  track,
  onPlay,
  onQueue,
  liked,
  onLike
}) {
  return (
    <div className="track-row">
      <button
        className="track-cover-button"
        onClick={onPlay}
      >
        <img
          src={track.thumbnail}
          alt=""
        />

        <span className="track-play">
          <Play size={15} fill="currentColor" />
        </span>
      </button>

      <button
        className="track-main"
        onClick={onPlay}
      >
        <strong>{track.title}</strong>

        <span>
          {track.channel}
        </span>
      </button>

      {onLike && (
        <button
          className={`icon-button ${
            liked ? "liked" : ""
          }`}
          onClick={onLike}
          aria-label={
            liked
              ? "Unlike"
              : "Like"
          }
        >
          <Heart
            size={18}
            fill={
              liked
                ? "currentColor"
                : "none"
            }
          />
        </button>
      )}

      {onQueue && (
        <button
          className="icon-button"
          onClick={onQueue}
          aria-label="Add to queue"
        >
          <ListMusic size={18} />
        </button>
      )}
    </div>
  );
}

function MiniPlayer({
  track,
  playing,
  onPlayPause,
  onPrevious,
  onNext,
  onOpen
}) {
  return (
    <div
      className="mini-player"
      onClick={onOpen}
    >
      <img
        src={track.thumbnail}
        alt=""
      />

      <div className="mini-info">
        <strong>{track.title}</strong>
        <span>{track.channel}</span>
      </div>

      <button
        className="mini-control"
        onClick={(event) => {
          event.stopPropagation();
          onPrevious();
        }}
        aria-label="Previous"
      >
        <SkipBack size={16} />
      </button>

      <button
        className="mini-control play"
        onClick={(event) => {
          event.stopPropagation();
          onPlayPause();
        }}
        aria-label={
          playing ? "Pause" : "Play"
        }
      >
        {playing ? (
          <Pause size={17} />
        ) : (
          <Play size={17} fill="currentColor" />
        )}
      </button>

      <button
        className="mini-control"
        onClick={(event) => {
          event.stopPropagation();
          onNext();
        }}
        aria-label="Next"
      >
        <SkipForward size={16} />
      </button>
    </div>
  );
}

function NowPlaying({
  track,
  playing,
  liked,
  onLike,
  onPlayPause,
  onPrevious,
  onNext,
  onClose
}) {
  return (
    <div className="now-playing">
      <div className="now-playing-top">
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close player"
        >
          <X size={22} />
        </button>

        <span>
          NOW PLAYING
        </span>

        <div />
      </div>

      <div className="now-playing-art">
        <img
          src={track.thumbnail}
          alt=""
        />

        <div className="art-ring" />
      </div>

      <div className="now-playing-info">
        <p className="eyebrow">
          ON THE COURT
        </p>

        <h1>{track.title}</h1>

        <p>{track.channel}</p>
      </div>

      <div className="now-playing-actions">
        <button
          className={`icon-button ${
            liked ? "liked" : ""
          }`}
          onClick={onLike}
        >
          <Heart
            size={21}
            fill={
              liked
                ? "currentColor"
                : "none"
            }
          />
        </button>
      </div>

      <div className="player-controls">
        <button onClick={onPrevious}>
          <SkipBack size={26} />
        </button>

        <button
          className="main-play-button"
          onClick={onPlayPause}
        >
          {playing ? (
            <Pause
              size={27}
              fill="currentColor"
            />
          ) : (
            <Play
              size={27}
              fill="currentColor"
            />
          )}
        </button>

        <button onClick={onNext}>
          <SkipForward size={26} />
        </button>
      </div>

      <div className="now-playing-number">
        23
      </div>
    </div>
  );
}

function BottomNav({
  active,
  onChange,
  queueCount
}) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            className={
              active === item.id
                ? "active"
                : ""
            }
            onClick={() =>
              onChange(item.id)
            }
          >
            <span className="nav-icon-wrap">
              <Icon size={19} />

              {item.id === "queue" &&
                queueCount > 0 && (
                  <b>
                    {queueCount}
                  </b>
                )}
            </span>

            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function SectionTitle({ title, action }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>

      {action && (
        <span className="section-action">
          {action}
        </span>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        C
      </div>

      <p>LOADING CLUTCH...</p>
    </div>
  );
}

export default App;
