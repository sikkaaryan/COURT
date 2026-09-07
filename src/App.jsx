import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
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
import useLibrary from "./hooks/useLibrary";
import useSearch from "./hooks/useSearch";
import usePlayer from "./hooks/usePlayer";
import usePwa from "./hooks/usePwa";
import YouTubePlayer from "./components/YouTubePlayer";

const NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    icon: Home
  },
  {
    id: "search",
    label: "Search",
    icon: Search
  },
  {
    id: "library",
    label: "Library",
    icon: Library
  },
  {
    id: "queue",
    label: "Queue",
    icon: ListMusic
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings
  }
];

const DEFAULT_QUOTES = [
  {
    number: "23",
    text: "Talent wins games. Teamwork and intelligence win championships."
  },
  {
    number: "30",
    text: "You miss 100% of the shots you don't take."
  },
  {
    number: "24",
    text: "Great things come from hard work and perseverance."
  }
];

export default function App() {
  const {
    user,
    loading: authLoading,
    error: authError,
    isAuthenticated,
    login,
    logout,
    refresh: refreshAuth,
    dismissError
  } = useAuth();

  const {
    playlists,
    playlistTracks,
    likedTracks,
    loading: libraryLoading,
    loadingPlaylist,
    error: libraryError,
    loadPlaylists,
    loadPlaylist,
    toggleLike,
    isLiked,
    clearError
  } = useLibrary();

  const {
    query,
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    setQuery,
    clearSearch
  } = useSearch();

  const {
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
  } = usePlayer();

  const {
    isInstalled
  } = usePwa();

  const [tab, setTab] =
    useState("home");

  const [showPlayer, setShowPlayer] =
    useState(false);

  const [selectedPlaylist, setSelectedPlaylist] =
    useState(null);

  const [appError, setAppError] =
    useState(null);

  const profileName =
    user?.name || "Player";

  const profileAvatar =
    user?.avatar || null;

  const visibleError =
    authError ||
    libraryError ||
    searchError ||
    appError;

  const dismissVisibleError =
    useCallback(() => {
      dismissError?.();
      clearError?.();
      setAppError(null);
    }, [
      dismissError,
      clearError
    ]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedPlaylist(null);
      setShowPlayer(false);
    }
  }, [isAuthenticated]);

  const handlePlay =
    useCallback(
      (track) => {
        if (!track?.videoId) {
          return;
        }

        play(track);
        setShowPlayer(true);
      },
      [play]
    );

  const handlePlayIndex =
    useCallback(
      (index) => {
        playIndex(index);
        setShowPlayer(true);
      },
      [playIndex]
    );

  const handlePlaylist =
    useCallback(
      async (playlist) => {
        if (!playlist?.id) {
          return;
        }

        setSelectedPlaylist(playlist);
        setTab("library");

        let tracks =
          playlistTracks[playlist.id];

        if (!tracks) {
          tracks =
            await loadPlaylist(
              playlist.id
            );
        }

        if (tracks?.length) {
          replaceQueue(tracks, 0);
          setShowPlayer(true);
        }
      },
      [
        playlistTracks,
        loadPlaylist,
        replaceQueue
      ]
    );

  const handlePlayAll =
    useCallback(
      (tracks) => {
        if (!tracks?.length) {
          return;
        }

        replaceQueue(tracks, 0);
        setShowPlayer(true);
      },
      [replaceQueue]
    );

  const handleAddToQueue =
    useCallback(
      (track) => {
        addToQueue(track);
      },
      [addToQueue]
    );

  const handleToggleLike =
    useCallback(
      (track) => {
        toggleLike(track);
      },
      [toggleLike]
    );

  const handleSearchSubmit =
    useCallback(
      (event) => {
        event.preventDefault();
      },
      []
    );

  const handleNavigate =
    useCallback((nextTab) => {
      setTab(nextTab);
      setSelectedPlaylist(null);
    }, []);

  const handleLogout =
    useCallback(() => {
      logout();
    }, [logout]);

  const handlePlayerEnded =
    useCallback(() => {
      next();
    }, [next]);

  const activeTracks = useMemo(() => {
    if (!selectedPlaylist) {
      return [];
    }

    return (
      playlistTracks[
        selectedPlaylist.id
      ] || []
    );
  }, [
    selectedPlaylist,
    playlistTracks
  ]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={login}
        error={authError}
        onDismissError={dismissVisibleError}
      />
    );
  }

  return (
    <div className="app-shell">
      <Header
        name={profileName}
        avatar={profileAvatar}
      />

      {visibleError && (
        <div className="error-card">
          <span>{visibleError}</span>

          <button
            type="button"
            onClick={dismissVisibleError}
            className="icon-button"
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <main className="app-content">
        {tab === "home" && (
          <HomeScreen
            playlists={playlists}
            loading={libraryLoading}
            onPlaylist={handlePlaylist}
            onPlay={handlePlay}
            likedTracks={likedTracks}
          />
        )}

        {tab === "search" && (
          <SearchScreen
            query={query}
            results={searchResults}
            loading={searchLoading}
            onChange={setQuery}
            onPlay={handlePlay}
            onAddToQueue={
              handleAddToQueue
            }
            onToggleLike={
              handleToggleLike
            }
            isLiked={isLiked}
            onClear={clearSearch}
          />
        )}

        {tab === "library" && (
          selectedPlaylist ? (
            <PlaylistDetail
              playlist={selectedPlaylist}
              tracks={activeTracks}
              loading={
                loadingPlaylist ===
                selectedPlaylist.id
              }
              onBack={() =>
                setSelectedPlaylist(null)
              }
              onPlay={handlePlay}
              onPlayAll={handlePlayAll}
              onAddToQueue={
                handleAddToQueue
              }
              onToggleLike={
                handleToggleLike
              }
              isLiked={isLiked}
            />
          ) : (
            <LibraryScreen
              playlists={playlists}
              likedTracks={likedTracks}
              loading={libraryLoading}
              onPlaylist={
                handlePlaylist
              }
              onPlay={handlePlay}
              onPlayAll={
                handlePlayAll
              }
              onToggleLike={
                handleToggleLike
              }
              isLiked={isLiked}
              onRefresh={
                loadPlaylists
              }
            />
          )
        )}

        {tab === "queue" && (
          <QueueScreen
            queue={queue}
            currentIndex={currentIndex}
            playing={playing}
            onPlayIndex={
              handlePlayIndex
            }
            onRemove={
              removeFromQueue
            }
            onClear={clearQueue}
          />
        )}

        {tab === "settings" && (
          <SettingsScreen
            user={user}
            isInstalled={isInstalled}
            onLogout={handleLogout}
            onRefresh={
              refreshAuth
            }
          />
        )}
      </main>

      {current && (
        <MiniPlayer
          track={current}
          playing={playing}
          onTogglePlay={
            togglePlay
          }
          onPrevious={
            previous
          }
          onNext={next}
          onOpen={() =>
            setShowPlayer(true)
          }
        />
      )}

      <BottomNav
        activeTab={tab}
        onNavigate={
          handleNavigate
        }
      />

      {showPlayer && current && (
        <NowPlaying
          track={current}
          playing={playing}
          onClose={() =>
            setShowPlayer(false)
          }
          onTogglePlay={
            togglePlay
          }
          onPrevious={
            previous
          }
          onNext={next}
          onToggleLike={
            handleToggleLike
          }
          liked={isLiked(
            current.videoId
          )}
        />
      )}

      <YouTubePlayer
        track={current}
        playing={playing}
        onEnded={
          handlePlayerEnded
        }
      />
    </div>
  );
}

function Header({
  name,
  avatar
}) {
  return (
    <header className="top-header">
      <div>
        <div className="brand-line">
          <span className="brand-name">
            CLUTCH
          </span>

          <span className="brand-dot" />
        </div>

        <div className="header-subtitle">
          MUSIC CONSOLE
        </div>
      </div>

      <button
        type="button"
        className="avatar-button"
        aria-label="Profile"
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
          />
        ) : (
          name
            ?.charAt(0)
            ?.toUpperCase() || "P"
        )}
      </button>
    </header>
  );
}

function HomeScreen({
  playlists,
  loading,
  onPlaylist,
  onPlay,
  likedTracks
}) {
  const featured =
    playlists.slice(0, 4);

  const recentTracks =
    likedTracks.slice(-5).reverse();

  return (
    <div className="screen">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            GAME DAY
          </span>

          <h1>
            YOUR
            <br />
            <strong>ROTATION.</strong>
          </h1>

          <p>
            Your music. Your court.
            Your rules.
          </p>
        </div>

        <div className="hero-number">
          23
        </div>

        <div className="basketball-lines" />

        <button
          type="button"
          className="hero-button"
          onClick={() =>
            onPlay?.(
              recentTracks[0]
            )
          }
          disabled={!recentTracks.length}
        >
          <Play size={18} fill="currentColor" />
          PLAY YOUR ROTATION
        </button>
      </section>

      <SectionTitle
        title="YOUR PLAYLISTS"
        action="VIEW ALL"
      />

      {loading ? (
        <LoadingCard />
      ) : (
        <div className="playlist-grid">
          {featured.map(
            (playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onClick={() =>
                  onPlaylist(
                    playlist
                  )
                }
              />
            )
          )}
        </div>
      )}

      <SectionTitle
        title="RECENTLY LIKED"
      />

      {recentTracks.length ? (
        <div className="track-list">
          {recentTracks.map(
            (track, index) => (
              <TrackRow
                key={
                  track.videoId
                }
                track={track}
                index={index}
                onPlay={() =>
                  onPlay(track)
                }
              />
            )
          )}
        </div>
      ) : (
        <div className="search-empty">
          <div className="search-ball">
            23
          </div>
          <p>
            Like tracks to build
            your rotation.
          </p>
        </div>
      )}

      <QuoteCard />
    </div>
  );
}

function SearchScreen({
  query,
  results,
  loading,
  onChange,
  onPlay,
  onAddToQueue,
  onToggleLike,
  isLiked,
  onClear
}) {
  return (
    <div className="screen">
      <div className="eyebrow">
        SCOUTING
      </div>

      <h2 className="section-heading">
        SEARCH
      </h2>

      <form
        className="search-box"
        onSubmit={(event) =>
          event.preventDefault()
        }
      >
        <Search size={19} />

        <input
          value={query}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder="Search music..."
          autoComplete="off"
        />

        {query && (
          <button
            type="button"
            onClick={onClear}
            className="icon-button"
            aria-label="Clear search"
          >
            <X size={17} />
          </button>
        )}
      </form>

      {loading && (
        <div className="loading-card">
          SEARCHING THE COURT...
        </div>
      )}

      {!loading &&
        query &&
        !results.length && (
          <div className="search-empty">
            <div className="search-ball">
              ?
            </div>
            <p>
              No tracks found.
            </p>
          </div>
        )}

      {!query && (
        <div className="search-empty">
          <div className="search-ball">
            30
          </div>
          <p>
            Search for a track,
            artist, or album.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="track-list">
          {results.map(
            (track, index) => (
              <TrackRow
                key={
                  track.videoId
                }
                track={track}
                index={index}
                onPlay={() =>
                  onPlay(track)
                }
                onAddToQueue={() =>
                  onAddToQueue(track)
                }
                onToggleLike={() =>
                  onToggleLike(track)
                }
                liked={isLiked(
                  track.videoId
                )}
                showActions
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function LibraryScreen({
  playlists,
  likedTracks,
  loading,
  onPlaylist,
  onPlay,
  onPlayAll,
  onToggleLike,
  isLiked,
  onRefresh
}) {
  return (
    <div className="screen">
      <div className="library-profile">
        <div>
          <span className="eyebrow">
            THE LOCKER ROOM
          </span>

          <h2 className="section-heading">
            LIBRARY
          </h2>
        </div>

        <button
          type="button"
          className="text-button"
          onClick={onRefresh}
        >
          REFRESH
        </button>
      </div>

      <SectionTitle
        title={`PLAYLISTS · ${playlists.length}`}
      />

      {loading ? (
        <LoadingCard />
      ) : (
        <div className="library-list">
          {playlists.map(
            (playlist) => (
              <button
                key={playlist.id}
                type="button"
                className="library-row"
                onClick={() =>
                  onPlaylist(
                    playlist
                  )
                }
              >
                {playlist.thumbnail ? (
                  <img
                    src={
                      playlist.thumbnail
                    }
                    alt=""
                  />
                ) : (
                  <div className="library-placeholder">
                    23
                  </div>
                )}

                <span>
                  <strong>
                    {playlist.title}
                  </strong>
                  <small>
                    {playlist.itemCount}{" "}
                    tracks
                  </small>
                </span>

                <ChevronRight
                  size={18}
                />
              </button>
            )
          )}
        </div>
      )}

      <SectionTitle
        title={`LIKED · ${likedTracks.length}`}
      />

      {likedTracks.length ? (
        <div className="track-list">
          {likedTracks.map(
            (track, index) => (
              <TrackRow
                key={
                  track.videoId
                }
                track={track}
                index={index}
                onPlay={() =>
                  onPlay(track)
                }
                onToggleLike={() =>
                  onToggleLike(track)
                }
                liked={isLiked(
                  track.videoId
                )}
              />
            )
          )}

          <button
            type="button"
            className="hero-button"
            onClick={() =>
              onPlayAll(
                likedTracks
              )
            }
          >
            <Play
              size={18}
              fill="currentColor"
            />
            PLAY LIKED
          </button>
        </div>
      ) : (
        <div className="search-empty">
          <div className="search-ball">
            ♥
          </div>
          <p>
            Your liked tracks
            appear here.
          </p>
        </div>
      )}
    </div>
  );
}

function PlaylistDetail({
  playlist,
  tracks,
  loading,
  onBack,
  onPlay,
  onPlayAll,
  onAddToQueue,
  onToggleLike,
  isLiked
}) {
  return (
    <div className="screen">
      <button
        type="button"
        className="text-button"
        onClick={onBack}
      >
        ← LIBRARY
      </button>

      <div className="detail-overlay">
        <div className="detail-sheet">
          {playlist.thumbnail ? (
            <img
              className="detail-cover"
              src={playlist.thumbnail}
              alt=""
            />
          ) : (
            <div className="detail-cover">
              23
            </div>
          )}

          <div className="eyebrow">
            PLAYLIST
          </div>

          <h2 className="section-heading">
            {playlist.title}
          </h2>

          <p>
            {playlist.description ||
              `${playlist.itemCount} tracks`}
          </p>

          <button
            type="button"
            className="hero-button"
            onClick={() =>
              onPlayAll(tracks)
            }
            disabled={!tracks.length}
          >
            <Play
              size={18}
              fill="currentColor"
            />
            PLAY ALL
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingCard />
      ) : tracks.length ? (
        <div className="track-list">
          {tracks.map(
            (track, index) => (
              <TrackRow
                key={
                  track.videoId
                }
                track={track}
                index={index}
                onPlay={() =>
                  onPlay(track)
                }
                onAddToQueue={() =>
                  onAddToQueue(track)
                }
                onToggleLike={() =>
                  onToggleLike(track)
                }
                liked={isLiked(
                  track.videoId
                )}
                showActions
              />
            )
          )}
        </div>
      ) : (
        <div className="search-empty">
          <p>
            This playlist has no
            playable tracks.
          </p>
        </div>
      )}
    </div>
  );
}

function QueueScreen({
  queue,
  currentIndex,
  playing,
  onPlayIndex,
  onRemove,
  onClear
}) {
  return (
    <div className="screen">
      <div className="library-profile">
        <div>
          <span className="eyebrow">
            GAME PLAN
          </span>

          <h2 className="section-heading">
            QUEUE
          </h2>
        </div>

        {queue.length > 0 && (
          <button
            type="button"
            className="text-button"
            onClick={onClear}
          >
            CLEAR
          </button>
        )}
      </div>

      {!queue.length ? (
        <div className="search-empty">
          <div className="search-ball">
            23
          </div>
          <p>
            Your queue is empty.
          </p>
        </div>
      ) : (
        <div className="track-list">
          {queue.map(
            (track, index) => (
              <div
                key={`${track.videoId}-${index}`}
                className={`queue-row ${
                  index === currentIndex
                    ? "active"
                    : ""
                }`}
              >
                <button
                  type="button"
                  className="queue-play"
                  onClick={() =>
                    onPlayIndex(index)
                  }
                >
                  {index ===
                    currentIndex &&
                  playing ? (
                    <Pause
                      size={16}
                      fill="currentColor"
                    />
                  ) : (
                    <Play
                      size={16}
                      fill="currentColor"
                    />
                  )}
                </button>

                <div className="track-info">
                  <strong>
                    {track.title}
                  </strong>
                  <span>
                    {track.channel}
                  </span>
                </div>

                <button
                  type="button"
                  className="icon-button"
                  onClick={() =>
                    onRemove(index)
                  }
                  aria-label="Remove from queue"
                >
                  <X size={17} />
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function SettingsScreen({
  user,
  isInstalled,
  onLogout,
  onRefresh
}) {
  return (
    <div className="screen">
      <span className="eyebrow">
        CONTROL CENTER
      </span>

      <h2 className="section-heading">
        SETTINGS
      </h2>

      <div className="profile-card">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt=""
          />
        ) : (
          <div className="library-placeholder">
            23
          </div>
        )}

        <div>
          <strong>
            {user?.name ||
              "Clutch Player"}
          </strong>

          <span>
            YouTube account
          </span>
        </div>
      </div>

      <div className="settings-group">
        <div className="setting-row">
          <span>
            Account status
          </span>

          <span className="status-dot">
            CONNECTED
          </span>
        </div>

        <div className="setting-row">
          <span>
            PWA status
          </span>

          <span className="status-dot">
            {isInstalled
              ? "INSTALLED"
              : "BROWSER"}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="primary-button"
        onClick={onRefresh}
      >
        REFRESH ACCOUNT
      </button>

      <button
        type="button"
        className="logout-button"
        onClick={onLogout}
      >
        <LogOut size={17} />
        SIGN OUT
      </button>

      <div className="settings-footer">
        CLUTCH · 23
      </div>
    </div>
  );
}

function TrackRow({
  track,
  index,
  onPlay,
  onAddToQueue,
  onToggleLike,
  liked = false,
  showActions = false
}) {
  return (
    <div className="track-row">
      <button
        type="button"
        className="track-cover-button"
        onClick={onPlay}
      >
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt=""
          />
        ) : (
          <div className="track-cover-fallback">
            {String(
              index + 1
            ).padStart(2, "0")}
          </div>
        )}

        <span className="track-play">
          <Play
            size={14}
            fill="currentColor"
          />
        </span>
      </button>

      <button
        type="button"
        className="track-main"
        onClick={onPlay}
      >
        <strong>
          {track.title}
        </strong>

        <span>
          {track.channel}
        </span>
      </button>

      {showActions && (
        <>
          <button
            type="button"
            className={`icon-button ${
              liked ? "liked" : ""
            }`}
            onClick={() =>
              onToggleLike?.()
            }
            aria-label={
              liked
                ? "Unlike"
                : "Like"
            }
          >
            <Heart
              size={17}
              fill={
                liked
                  ? "currentColor"
                  : "none"
              }
            />
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={() =>
              onAddToQueue?.()
            }
            aria-label="Add to queue"
          >
            <ListMusic size={17} />
          </button>
        </>
      )}
    </div>
  );
}

function PlaylistCard({
  playlist,
  onClick
}) {
  return (
    <button
      type="button"
      className="playlist-card"
      onClick={onClick}
    >
      {playlist.thumbnail ? (
        <img
          src={playlist.thumbnail}
          alt=""
        />
      ) : (
        <div className="playlist-placeholder">
          23
        </div>
      )}

      <div className="playlist-overlay">
        <strong>
          {playlist.title}
        </strong>

        <span>
          {playlist.itemCount} TRACKS
        </span>
      </div>
    </button>
  );
}

function SectionTitle({
  title,
  action
}) {
  return (
    <div className="library-profile">
      <h3 className="section-heading">
        {title}
      </h3>

      {action && (
        <button
          type="button"
          className="text-button"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function MiniPlayer({
  track,
  playing,
  onTogglePlay,
  onPrevious,
  onNext,
  onOpen
}) {
  return (
    <div
      className="mini-player"
      onClick={onOpen}
    >
      {track.thumbnail ? (
        <img
          src={track.thumbnail}
          alt=""
        />
      ) : (
        <div className="track-cover-fallback">
          23
        </div>
      )}

      <div className="track-info">
        <strong>
          {track.title}
        </strong>

        <span>
          {track.channel}
        </span>
      </div>

      <button
        type="button"
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
        type="button"
        className="mini-control"
        onClick={(event) => {
          event.stopPropagation();
          onTogglePlay();
        }}
        aria-label={
          playing
            ? "Pause"
            : "Play"
        }
      >
        {playing ? (
          <Pause
            size={17}
            fill="currentColor"
          />
        ) : (
          <Play
            size={17}
            fill="currentColor"
          />
        )}
      </button>

      <button
        type="button"
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
  onClose,
  onTogglePlay,
  onPrevious,
  onNext,
  onToggleLike,
  liked
}) {
  return (
    <div className="now-playing">
      <div className="now-playing-top">
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Close player"
        >
          <X size={21} />
        </button>

        <span className="eyebrow">
          NOW PLAYING
        </span>

        <span />
      </div>

      <div className="now-playing-art">
        <div className="art-ring">
          {track.thumbnail ? (
            <img
              src={track.thumbnail}
              alt=""
            />
          ) : (
            <div className="track-cover-fallback">
              23
            </div>
          )}
        </div>
      </div>

      <div className="now-playing-info">
        <span className="eyebrow">
          {track.channel}
        </span>

        <h2>
          {track.title}
        </h2>

        <p>
          {track.description ||
            "Clutch rotation"}
        </p>
      </div>

      <div className="now-playing-actions">
        <button
          type="button"
          className={`icon-button ${
            liked ? "liked" : ""
          }`}
          onClick={() =>
            onToggleLike(track)
          }
          aria-label={
            liked
              ? "Unlike"
              : "Like"
          }
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
        <button
          type="button"
          className="mini-control"
          onClick={onPrevious}
          aria-label="Previous"
        >
          <SkipBack size={23} />
        </button>

        <button
          type="button"
          className="main-play-button"
          onClick={onTogglePlay}
          aria-label={
            playing
              ? "Pause"
              : "Play"
          }
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

        <button
          type="button"
          className="mini-control"
          onClick={onNext}
          aria-label="Next"
        >
          <SkipForward size={23} />
        </button>
      </div>

      <div className="now-playing-number">
        23
      </div>
    </div>
  );
}

function BottomNav({
  activeTab,
  onNavigate
}) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(
        ({
          id,
          label,
          icon: Icon
        }) => (
          <button
            key={id}
            type="button"
            className={
              activeTab === id
                ? "active"
                : ""
            }
            onClick={() =>
              onNavigate(id)
            }
          >
            <span className="nav-icon-wrap">
              <Icon size={19} />
            </span>

            <span>{label}</span>
          </button>
        )
      )}
    </nav>
  );
}

function QuoteCard() {
  const quote =
    DEFAULT_QUOTES[
      Math.floor(
        Math.random() *
          DEFAULT_QUOTES.length
      )
    ];

  return (
    <div className="quote-card">
      <span className="quote-number">
        {quote.number}
      </span>

      <p className="quote">
        “{quote.text}”
      </p>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="loading-card">
      LOADING...
    </div>
  );
}

function LoginScreen({
  onLogin,
  error,
  onDismissError
}) {
  return (
    <div className="login-screen">
      <div className="login-brand">
        <div className="brand-mark">
          23
        </div>

        <span>
          CLUTCH
        </span>
      </div>

      <div>
        <h1>
          YOUR MUSIC.
          <br />
          <strong>YOUR GAME.</strong>
        </h1>

        <p className="login-copy">
          Connect your Google /
          YouTube account and
          turn your library into
          your own music console.
        </p>
      </div>

      {error && (
        <div className="error-card">
          <span>{error}</span>

          <button
            type="button"
            className="icon-button"
            onClick={
              onDismissError
            }
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <button
        type="button"
        className="primary-button login-button"
        onClick={onLogin}
      >
        <LogIn size={18} />
        CONNECT GOOGLE
      </button>

      <p className="login-note">
        Clutch uses supported
        Google and YouTube APIs.
        Your Google password is
        never handled by Clutch.
      </p>

      <div className="login-number">
        23
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        23
      </div>

      <span>
        CLUTCH
      </span>
    </div>
  );
}
