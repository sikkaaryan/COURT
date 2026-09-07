import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  Home,
  Search,
  Library,
  ListMusic,
  Settings,
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat2,
  MoreHorizontal,
  ChevronRight,
  Plus,
  Clock3,
  Disc3,
  UserRound,
  Download,
  SlidersHorizontal,
  X
} from "lucide-react";

import "./styles.css";


/* ─────────────────────────────
   DEMO MUSIC DATA
───────────────────────────── */

const tracks = [
  {
    id: "1",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "4:04",
    art: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg"
  },
  {
    id: "2",
    title: "Starboy",
    artist: "The Weeknd",
    album: "Starboy",
    duration: "3:50",
    art: "https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg"
  },
  {
    id: "3",
    title: "SICKO MODE",
    artist: "Travis Scott",
    album: "ASTROWORLD",
    duration: "5:12",
    art: "https://i.ytimg.com/vi/6ONRf7h3Mdk/hqdefault.jpg"
  },
  {
    id: "4",
    title: "Not Like Us",
    artist: "Kendrick Lamar",
    album: "Not Like Us",
    duration: "4:34",
    art: "https://i.ytimg.com/vi/H58vbez_m4E/hqdefault.jpg"
  },
  {
    id: "5",
    title: "Redbone",
    artist: "Childish Gambino",
    album: "Awaken, My Love!",
    duration: "5:27",
    art: "https://i.ytimg.com/vi/Kp7eSUU9oy8/hqdefault.jpg"
  },
  {
    id: "6",
    title: "FE!N",
    artist: "Travis Scott",
    album: "UTOPIA",
    duration: "3:11",
    art: "https://i.ytimg.com/vi/5Z8HOW0CUSw/hqdefault.jpg"
  }
];


const playlists = [
  {
    title: "Liked Music",
    sub: "1,243 songs",
    image: tracks[0].art
  },
  {
    title: "Hoops & Chill",
    sub: "432 songs",
    image:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=500&q=80"
  },
  {
    title: "Clutch Mode",
    sub: "318 songs",
    image:
      "https://images.unsplash.com/photo-1518407613690-d9fc990e795f?auto=format&fit=crop&w=500&q=80"
  },
  {
    title: "Late Nights",
    sub: "271 songs",
    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=500&q=80"
  }
];


/* ─────────────────────────────
   APP
───────────────────────────── */

function App() {
  const [tab, setTab] = useState("home");

  const [current, setCurrent] = useState(tracks[0]);

  const [playing, setPlaying] = useState(false);

  const [liked, setLiked] = useState(true);

  const [showPlayer, setShowPlayer] = useState(false);


  const queue = useMemo(
    () => [
      current,
      ...tracks.filter((track) => track.id !== current.id)
    ],
    [current]
  );


  const playTrack = (track) => {
    setCurrent(track);
    setPlaying(true);
    setShowPlayer(true);
  };


  return (
    <main className="app-shell">

      <div className="noise" />

      <div className="app">

        {tab === "home" && (
          <HomeScreen
            current={current}
            playing={playing}
            onPlay={() => setPlaying(!playing)}
            onOpenPlayer={() => setShowPlayer(true)}
            onTrack={playTrack}
          />
        )}


        {tab === "search" && (
          <SearchScreen
            onTrack={playTrack}
          />
        )}


        {tab === "library" && (
          <LibraryScreen
            onTrack={playTrack}
          />
        )}


        {tab === "queue" && (
          <QueueScreen
            queue={queue}
            current={current}
            onTrack={playTrack}
          />
        )}


        {tab === "settings" && (
          <SettingsScreen />
        )}


        <BottomNav
          tab={tab}
          setTab={setTab}
        />


        {showPlayer && (
          <NowPlaying
            track={current}
            playing={playing}
            setPlaying={setPlaying}
            liked={liked}
            setLiked={setLiked}
            onClose={() => setShowPlayer(false)}
            onTrack={playTrack}
          />
        )}

      </div>

    </main>
  );
}


/* ─────────────────────────────
   HEADER
───────────────────────────── */

function Header({
  eyebrow,
  title,
  action
}) {
  return (
    <header className="header">

      <div>

        {eyebrow && (
          <div className="eyebrow">
            {eyebrow}
          </div>
        )}

        <h1>
          {title}
        </h1>

      </div>

      {action}

    </header>
  );
}


/* ─────────────────────────────
   HOME
───────────────────────────── */

function HomeScreen({
  current,
  playing,
  onPlay,
  onOpenPlayer,
  onTrack
}) {
  return (
    <section className="screen home-screen">

      <Header
        eyebrow="MUSIC FUELS GREATNESS"
        title={
          <>
            Good evening,
            <br />
            <span>Aryan</span>
          </>
        }
        action={
          <button className="icon-button">
            <Search size={21} />
          </button>
        }
      />


      <p className="subline">
        Different game. Same energy.
      </p>


      <button
        className="hero-card"
        onClick={onOpenPlayer}
      >

        <img
          src="https://images.unsplash.com/photo-1518065896235-a4c93e088e7d?auto=format&fit=crop&w=900&q=85"
          alt=""
        />

        <div className="hero-overlay" />


        <div className="hero-copy">

          <span className="red-label">
            NOW PLAYING
          </span>

          <strong>
            {current.title}
          </strong>

          <span>
            {current.artist}
          </span>

        </div>


        <span
          className="hero-play"
          onClick={(event) => {
            event.stopPropagation();
            onPlay();
          }}
        >
          {playing ? (
            <Pause size={19} />
          ) : (
            <Play
              size={19}
              fill="currentColor"
            />
          )}
        </span>

      </button>


      <SectionTitle title="For Your Vibe" />


      <div className="horizontal-scroll">

        {playlists
          .slice(1)
          .map((playlist) => (

            <button
              className="mood-card"
              key={playlist.title}
            >

              <img
                src={playlist.image}
                alt=""
              />

              <div className="card-shade" />

              <b>
                {playlist.title}
              </b>

              <span>
                {playlist.sub}
              </span>

            </button>

          ))}

      </div>


      <SectionTitle title="Recently Played" />


      <div className="album-row">

        {tracks
          .slice(0, 4)
          .map((track) => (

            <button
              className="album-tile"
              key={track.id}
              onClick={() => onTrack(track)}
            >

              <img
                src={track.art}
                alt=""
              />

              <span>
                {track.title}
              </span>

            </button>

          ))}

      </div>


      <SectionTitle title="Your Playlists" />


      <div className="list-card">

        {playlists.map((playlist) => (

          <button
            className="library-row"
            key={playlist.title}
          >

            <img
              src={playlist.image}
              alt=""
            />

            <span>

              <b>
                {playlist.title}
              </b>

              <small>
                {playlist.sub}
              </small>

            </span>

            <ChevronRight size={18} />

          </button>

        ))}

      </div>

    </section>
  );
}


/* ─────────────────────────────
   SEARCH
───────────────────────────── */

function SearchScreen({
  onTrack
}) {

  const [query, setQuery] = useState("");


  const results = tracks.filter(
    (track) =>
      `${track.title} ${track.artist}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );


  return (
    <section className="screen">

      <Header
        title="Search"
        action={
          <button className="avatar">
            A
          </button>
        }
      />


      <p className="subline">
        Find your next soundtrack.
      </p>


      <div className="search-box">

        <Search size={19} />

        <input
          autoFocus
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Songs, artists, playlists..."
        />

        {query && (
          <X
            size={18}
            onClick={() => setQuery("")}
          />
        )}

      </div>


      <div className="filter-row">

        {[
          "All",
          "Songs",
          "Artists",
          "Playlists",
          "Albums"
        ].map((filter, index) => (

          <button
            className={
              index === 0
                ? "active"
                : ""
            }
            key={filter}
          >
            {filter}
          </button>

        ))}

      </div>


      <SectionTitle
        title={
          query
            ? "Results"
            : "Trending"
        }
      />


      <div className="trending-grid">

        {results
          .slice(0, 6)
          .map((track) => (

            <button
              className="trend-card"
              key={track.id}
              onClick={() =>
                onTrack(track)
              }
            >

              <img
                src={track.art}
                alt=""
              />

              <b>
                {track.title}
              </b>

              <span>
                {track.artist}
              </span>

            </button>

          ))}

      </div>

    </section>
  );
}


/* ─────────────────────────────
   LIBRARY
───────────────────────────── */

function LibraryScreen({
  onTrack
}) {

  const libraryItems = [
    [
      Heart,
      "Liked Music",
      "1,243 songs"
    ],
    [
      ListMusic,
      "Playlists",
      "32 playlists"
    ],
    [
      Disc3,
      "Albums",
      "217 albums"
    ],
    [
      UserRound,
      "Artists",
      "146 artists"
    ],
    [
      Clock3,
      "History",
      "Recently played"
    ],
    [
      Download,
      "Downloads",
      "Offline music"
    ]
  ];


  return (
    <section className="screen">

      <Header
        title="Library"
        action={
          <button className="icon-button">
            <Plus size={20} />
          </button>
        }
      />


      <p className="subline">
        Your music. Your way.
      </p>


      <div className="list-card library-big">

        {libraryItems.map(
          ([Icon, title, subtitle]) => (

            <button
              className="library-row big-row"
              key={title}
            >

              <span className="row-icon">
                <Icon size={20} />
              </span>

              <span>

                <b>
                  {title}
                </b>

                <small>
                  {subtitle}
                </small>

              </span>

              <ChevronRight size={18} />

            </button>

          )
        )}

      </div>


      <div className="quote-card">

        <span>
          DISCIPLINE
          <br />
          BUILDS
          <br />
          FREEDOM.
        </span>

        <div className="quote-ball">
          ●
        </div>

      </div>


      <SectionTitle title="Quick Play" />


      {tracks
        .slice(0, 3)
        .map((track) => (

          <TrackRow
            key={track.id}
            track={track}
            onPlay={() =>
              onTrack(track)
            }
          />

        ))}

    </section>
  );
}


/* ─────────────────────────────
   QUEUE
───────────────────────────── */

function QueueScreen({
  queue,
  current,
  onTrack
}) {
  return (
    <section className="screen">

      <Header
        title="Queue"
        action={
          <div className="header-actions">

            <button>
              Save
            </button>

            <button>
              Clear
            </button>

          </div>
        }
      />


      <p className="subline">
        Up next. Keep it going.
      </p>


      <div className="queue-list">

        {queue.map((track, index) => (

          <button
            className={`queue-row ${
              track.id === current.id
                ? "selected"
                : ""
            }`}
            key={`${track.id}-${index}`}
            onClick={() =>
              onTrack(track)
            }
          >

            <span className="queue-number">
              {index + 1}
            </span>

            <img
              src={track.art}
              alt=""
            />

            <span className="track-meta">

              <b>
                {track.title}
              </b>

              <small>
                {track.artist}
              </small>

            </span>

            <MoreHorizontal size={19} />

          </button>

        ))}

      </div>

    </section>
  );
}


/* ─────────────────────────────
   SETTINGS
───────────────────────────── */

function SettingsScreen() {

  const settings = [
    [
      SlidersHorizontal,
      "Theme",
      "Dark"
    ],
    [
      Play,
      "Playback",
      "YouTube"
    ],
    [
      UserRound,
      "Account",
      "Connected"
    ],
    [
      Download,
      "Offline Music",
      "Available"
    ],
    [
      Settings,
      "App",
      "PWA"
    ]
  ];


  return (
    <section className="screen">

      <Header
        title="Settings"
        action={
          <button className="avatar">
            A
          </button>
        }
      />


      <p className="subline">
        Make it yours.
      </p>


      <div className="profile-card">

        <div className="avatar large">
          A
        </div>

        <span>

          <b>
            Aryan
          </b>

          <small>
            Connected account
          </small>

        </span>

        <ChevronRight size={18} />

      </div>


      <div className="list-card settings-card">

        {settings.map(
          ([Icon, title, value]) => (

            <button
              className="library-row"
              key={title}
            >

              <span className="row-icon">
                <Icon size={19} />
              </span>

              <span>
                <b>
                  {title}
                </b>
              </span>

              <small className="setting-value">
                {value}
              </small>

              <ChevronRight size={17} />

            </button>

          )
        )}

      </div>


      <div className="basketball-footer">

        <span>
          GREAT PLAYERS
          <br />
          INSPIRE GREAT
          <br />
          PLAYLISTS.
        </span>

      </div>

    </section>
  );
}


/* ─────────────────────────────
   TRACK ROW
───────────────────────────── */

function TrackRow({
  track,
  onPlay
}) {

  return (
    <button
      className="track-row"
      onClick={onPlay}
    >

      <img
        src={track.art}
        alt=""
      />

      <span className="track-meta">

        <b>
          {track.title}
        </b>

        <small>
          {track.artist}
        </small>

      </span>

      <Play size={17} />

    </button>
  );
}


/* ─────────────────────────────
   NOW PLAYING
───────────────────────────── */

function NowPlaying({
  track,
  playing,
  setPlaying,
  liked,
  setLiked,
  onClose,
  onTrack
}) {

  const currentIndex =
    tracks.findIndex(
      (item) =>
        item.id === track.id
    );


  const next =
    tracks[
      (currentIndex + 1) %
        tracks.length
    ];


  const previous =
    tracks[
      (currentIndex - 1 +
        tracks.length) %
        tracks.length
    ];


  return (
    <div className="player-overlay">

      <div className="player-top">

        <button
          className="icon-button"
          onClick={onClose}
        >
          ⌄
        </button>


        <span>
          PLAYING FROM
          <br />

          <b>
            Liked Music
          </b>
        </span>


        <button className="icon-button">
          <MoreHorizontal size={21} />
        </button>

      </div>


      <div className="player-art">

        <img
          src={track.art}
          alt=""
        />

      </div>


      <div className="player-info">

        <div>

          <h2>
            {track.title}
          </h2>

          <p>
            {track.artist}
          </p>

        </div>


        <button
          className="heart"
          onClick={() =>
            setLiked(!liked)
          }
        >

          <Heart
            fill={
              liked
                ? "currentColor"
                : "none"
            }
          />

        </button>

      </div>


      <div className="progress">

        <span />

        <i />

      </div>


      <div className="times">

        <span>
          2:31
        </span>

        <span>
          {track.duration}
        </span>

      </div>


      <div className="controls">

        <button>
          <Shuffle size={20} />
        </button>


        <button
          onClick={() =>
            onTrack(previous)
          }
        >
          <SkipBack
            size={28}
            fill="currentColor"
          />
        </button>


        <button
          className="pause"
          onClick={() =>
            setPlaying(!playing)
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
          onClick={() =>
            onTrack(next)
          }
        >
          <SkipForward
            size={28}
            fill="currentColor"
          />
        </button>


        <button>
          <Repeat2 size={20} />
        </button>

      </div>


      <div className="quote">

        “Great players are made
        <br />
        in the moments nobody sees.”

        <b>
          — DESK MODE
        </b>

      </div>


      <div className="up-next">

        <span>
          UP NEXT
        </span>

        <ListMusic size={19} />

      </div>

    </div>
  );
}


/* ─────────────────────────────
   SECTION TITLE
───────────────────────────── */

function SectionTitle({
  title
}) {

  return (
    <div className="section-title">

      <h3>
        {title}
      </h3>

      <button>
        See all
      </button>

    </div>
  );
}


/* ─────────────────────────────
   BOTTOM NAVIGATION
───────────────────────────── */

function BottomNav({
  tab,
  setTab
}) {

  const items = [
    [
      Home,
      "Home",
      "home"
    ],
    [
      Search,
      "Search",
      "search"
    ],
    [
      Library,
      "Library",
      "library"
    ],
    [
      ListMusic,
      "Queue",
      "queue"
    ]
  ];


  return (
    <nav className="bottom-nav">

      {items.map(
        ([Icon, label, key]) => (

          <button
            className={
              tab === key
                ? "active"
                : ""
            }
            onClick={() =>
              setTab(key)
            }
            key={key}
          >

            <Icon size={20} />

            <span>
              {label}
            </span>

          </button>

        )
      )}

    </nav>
  );
}


/* ─────────────────────────────
   START APP
───────────────────────────── */

createRoot(
  document.getElementById("root")
).render(
  <App />
);
