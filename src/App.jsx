import { useState, useEffect, useRef } from 'react';
import { photos, letter, names } from './config';

const PLAYLIST_ID = 'PL7dUZZrT6S5kcjCRk6TeK-H1IV6FE8zfb';

// ── Love Gate ────────────────────────────────────────────────────────────────
function LoveGate({ onYes, done }) {
  const [noCount, setNoCount] = useState(0);
  const [noStyle, setNoStyle] = useState({});
  const [shake, setShake] = useState(false);

  const questions = [
    'Do you love Mohit?',
    'Are you absolutely sure?',
    'Okay, but think carefully...',
    'Last chance to be honest! 🌺',
    'The orchids say you do... 🌸',
  ];
  const noLabels = ['No', 'Hmm, no?', 'Really? 🥺', 'Sure??', 'Think again!'];
  const teases = [
    'Oops! Wrong button 🌺',
    'Nope, try again! 😄',
    "That can't be right! 💕",
    'Almost... try YES! 🌸',
  ];

  function runAway() {
    const top = 10 + Math.random() * 62;
    const left = 5 + Math.random() * 62;
    setNoStyle({
      position: 'fixed',
      top: `${top}%`,
      left: `${left}%`,
      transform: 'translate(-50%, -50%)',
      zIndex: 20001,
      margin: 0,
    });
    setNoCount((c) => c + 1);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  return (
    <div className={`love-gate${done ? ' love-gate-bye' : ''}`}>
      <div className="love-gate-card">
        <div className={`love-gate-orchid${shake ? ' orchid-shake' : ''}`}>🌺</div>
        <h2 className="love-gate-q">{questions[Math.min(noCount, questions.length - 1)]}</h2>
        <p className="love-gate-hint">
          {noCount === 0
            ? 'A very important question before we begin...'
            : noCount < 3
              ? 'Your heart knows the answer 💕'
              : "We both know it's yes! 🌸"}
        </p>
        {noCount > 0 && (
          <p className="love-gate-tease">{teases[Math.min(noCount - 1, teases.length - 1)]}</p>
        )}
        <div className="love-gate-btns">
          <button className="lg-yes" onClick={onYes}>
            Yes, always! 💕
          </button>
          <button
            className="lg-no"
            style={noStyle}
            onClick={runAway}
            onMouseEnter={noCount > 0 ? runAway : undefined}
          >
            {noLabels[Math.min(noCount, noLabels.length - 1)]}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [loveDone, setLoveDone] = useState(false);
  const [opened, setOpened] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [currentSongIdx, setCurrentSongIdx] = useState(null);
  const [nowPlaying, setNowPlaying] = useState('');
  const [showSongList, setShowSongList] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);

  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const pendingPlayRef = useRef(false);
  const ytDivRef = useRef(null);
  const fireworksCanvasRef = useRef(null);
  const floatingRef = useRef(null);
  const fetchTitlesRef = useRef(null);

  async function fetchTitles(videoIds) {
    setPlaylistLoading(true);
    try {
      const results = await Promise.all(
        videoIds.map((id) =>
          fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`)
            .then((r) => r.json())
            .then((d) => ({ videoId: id, title: d.title || id, artist: d.author_name || '' }))
            .catch(() => ({ videoId: id, title: id, artist: '' }))
        )
      );
      setPlaylistSongs(results);
    } finally {
      setPlaylistLoading(false);
    }
  }

  fetchTitlesRef.current = fetchTitles;

  useEffect(() => {
    window.onYouTubeIframeAPIReady = () => {
      const player = new window.YT.Player(ytDivRef.current, {
        height: '1',
        width: '1',
        playerVars: { listType: 'playlist', list: PLAYLIST_ID, autoplay: 0, controls: 0, loop: 1, modestbranding: 1 },
        events: {
          onReady() {
            // Mark as ready only now — the player can actually play
            ytReadyRef.current = true;
            ytPlayerRef.current = player;

            // Fetch playlist titles
            const tryFetch = (retries = 10) => {
              const ids = player.getPlaylist?.();
              if (ids?.length) fetchTitlesRef.current(ids);
              else if (retries > 0) setTimeout(() => tryFetch(retries - 1), 400);
            };
            tryFetch();

            // If the user already tapped open before the player was ready, play now
            if (pendingPlayRef.current) {
              player.playVideo();
              pendingPlayRef.current = false;
            }
          },
          onStateChange(e) {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setTimeout(() => {
                const data = player.getVideoData?.();
                if (data?.title) setNowPlaying(data.title);
              }, 500);
            }
          },
        },
      });
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
    return () => {
      delete window.onYouTubeIframeAPIReady;
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!opened) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('[data-animate]').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [opened]);

  useEffect(() => {
    const trailColors = ['#B05C7A', '#C87A93', '#E8B4C6', '#9a5daa', '#d4a0c4'];
    const onMove = (e) => {
      const t = document.createElement('div');
      t.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:7px;height:7px;background:${trailColors[Math.floor(Math.random() * trailColors.length)]};border-radius:50%;pointer-events:none;z-index:9999;transition:all 0.7s ease;opacity:0.6;`;
      document.body.appendChild(t);
      requestAnimationFrame(() => { t.style.transform = 'translateY(-25px) scale(0)'; t.style.opacity = '0'; });
      setTimeout(() => t.remove(), 700);
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const onResize = () => {
      const fw = fireworksCanvasRef.current;
      if (fw) { fw.width = window.innerWidth; fw.height = window.innerHeight; }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function launchFireworks() {
    const canvas = fireworksCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    const colors = ['#B05C7A', '#C87A93', '#E8B4C6', '#9a5daa', '#d4a0c4', '#f5c842', '#e87a9a', '#c4a0c4'];

    class P {
      constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        const a = Math.random() * Math.PI * 2, s = Math.random() * 6 + 2;
        this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s;
        this.alpha = 1; this.decay = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 3 + 1;
      }
      tick() { this.x += this.vx; this.y += this.vy; this.vy += 0.05; this.alpha -= this.decay; }
      draw() {
        ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }

    const boom = (x, y) => {
      const c = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 60; i++) particles.push(new P(x, y, c));
    };

    let frame = 0;
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (frame < 120 && frame % 15 === 0)
        boom(
          Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
          Math.random() * canvas.height * 0.5 + canvas.height * 0.1
        );
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].tick(); particles[i].draw();
        if (particles[i].alpha <= 0) particles.splice(i, 1);
      }
      frame++;
      if (frame < 300 || particles.length > 0) requestAnimationFrame(loop);
    };
    loop();
  }

  function startFloatingFlowers() {
    const c = floatingRef.current;
    if (!c) return;
    const emojis = ['🌺', '🌸', '🌻', '💜', '✨', '💕', '🦋', '💐', '🌼', '🍜'];
    const add = () => {
      const el = document.createElement('div');
      el.className = 'flower-float';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = Math.random() * 100 + '%';
      el.style.fontSize = (Math.random() * 18 + 14) + 'px';
      el.style.animationDuration = (Math.random() * 7 + 7) + 's';
      el.style.animationDelay = Math.random() * 2 + 's';
      c.appendChild(el);
      setTimeout(() => el.remove(), 16000);
    };
    setInterval(add, 850);
    for (let i = 0; i < 10; i++) setTimeout(add, i * 180);
  }

  function createSparkles() {
    const container = document.getElementById('sparkles');
    if (!container) return;
    const colors = ['#B05C7A', '#C87A93', '#E8B4C6', '#c07878', '#d4a0c4'];
    for (let i = 0; i < 45; i++) {
      const s = document.createElement('div');
      s.className = 'sparkle';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.background = colors[Math.floor(Math.random() * colors.length)];
      s.style.animationDelay = Math.random() * 3 + 's';
      s.style.animationDuration = (Math.random() * 2 + 2) + 's';
      container.appendChild(s);
    }
  }

  function startMusic() {
    if (ytReadyRef.current && ytPlayerRef.current) ytPlayerRef.current.playVideo();
    else pendingPlayRef.current = true;
    setMusicPlaying(true);
  }

  function pauseMusic() {
    if (ytReadyRef.current && ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
    setMusicPlaying(false);
  }

  function toggleMusic() { if (musicPlaying) pauseMusic(); else startMusic(); }

  function playSong(videoId, idx, title) {
    if (ytReadyRef.current && ytPlayerRef.current) {
      ytPlayerRef.current.loadVideoById(videoId);
      setNowPlaying(title);
      setMusicPlaying(true);
    } else {
      pendingPlayRef.current = true;
      setMusicPlaying(true);
    }
    setCurrentSongIdx(idx);
    setShowSongList(false);
  }

  function handleOpen() {
    setOpened(true);
    launchFireworks();
    startFloatingFlowers();
    createSparkles();
    setTimeout(startMusic, 800);
  }

  function triggerSurprise() {
    launchFireworks();
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(253,248,250,0.97);z-index:10000;display:flex;align-items:center;justify-content:center;flex-direction:column;cursor:pointer;overflow-y:auto;padding:30px 20px;';
    overlay.innerHTML = `
      <div style="max-width:520px;width:100%;text-align:center;">
        <div style="font-size:3.5rem;letter-spacing:8px;margin-bottom:12px;">🌺 💕 🌻</div>
        <h1 style="font-family:'Great Vibes',cursive;font-size:clamp(2.2rem,7vw,4.5rem);color:#B05C7A;margin:0 0 10px;text-shadow:0 2px 12px rgba(176,92,122,0.25);">I Love You, ${names.recipient}!</h1>
        <p style="font-family:'Dancing Script',cursive;font-size:clamp(1.1rem,3vw,1.35rem);color:#5c4a35;line-height:1.85;margin-bottom:28px;">
          My sunflower, my favourite orchid —<br>you are everything beautiful, all at once. 🌸
        </p>

        <div style="background:white;border-radius:20px;padding:28px 24px;box-shadow:0 8px 32px rgba(176,92,122,0.12);border:1px solid rgba(176,92,122,0.18);margin-bottom:24px;">
          <div style="font-size:1.5rem;margin-bottom:14px;">✍️</div>
          <p style="font-family:'Dancing Script',cursive;font-size:clamp(1.2rem,3.8vw,1.5rem);color:#B05C7A;line-height:2.2;font-style:italic;">
            Pass nahi ho firr bhi  Tumse pyaar karte hai,<br>
            Dekhkar tasveer tumhari Tumhi ko yaad karte hai,<br>
            Dil mein itni tadap Hai ki harr waqt,<br>
            Tere se milne ki hi Fariyaad karte hai
          </p>
          <p style="font-family:'Great Vibes',cursive;font-size:1.3rem;color:#8c6878;margin-top:16px;">— Sirf tera, Mohit 💕</p>
        </div>

        <p style="font-size:0.8rem;color:rgba(90,74,53,0.38);">tap anywhere to close</p>
      </div>
    `;
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
  }

  return (
    <>
      {/* Love Gate — fades out after "Yes" */}
      <LoveGate onYes={() => setLoveDone(true)} done={loveDone} />

      {/* Opening screen */}
      <div id="opening-screen" className={opened ? 'hidden' : ''} onClick={!opened ? handleOpen : undefined}>
        <div className="opening-container">
          <div className="opening-orchid-wrap">
            <div className="ripple-ring" />
            <div className="ripple-ring" />
            <div className="ripple-ring" />
            <div className="orchid-main">🌺</div>
          </div>
          <div className="opening-title">A Surprise for {names.recipient}</div>
          <div className="opening-tap">🌻 Tap to Open 🌻</div>
        </div>
      </div>

      <canvas ref={fireworksCanvasRef} id="fireworks-canvas" />
      <div className="floating-flowers" ref={floatingRef} />
      <div id="sparkles" />

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-flowers">🌺 🌻 💜</span>
          <h1>Happy Birthday {names.recipient}!</h1>
          <h2>Guddu Ki Gudiya</h2>
          <p className="subtitle">
            Today the whole world celebrates <span>YOU</span> — and so does guddu who loves you endlessly
          </p>
          <div className="birthday-cake">🎂</div>
        </div>
        <div className="scroll-indicator">
          <span>Scroll for More Surprises</span>
          <div className="arrow">⬇</div>
        </div>
      </section>

      {/* About */}
      <section className="section about-section">
        <h2 className="section-title">Why You're So Special</h2>
        <div className="about-cards">
          {[
            { icon: '📊', title: 'CA Simmu Mansukhani', text: "Balancing books by day, balancing hearts always. You didn't just crack CA — you conquered my heart like a queen. Numbers bow down to you so do I" },
            { icon: '💎', title: 'Heart of Gold', text: "Your kindness lights up every room you walk into. Jamnagar's most beautiful soul — inside and out, always and forever." },
            { icon: '🌟', title: 'Unstoppable Force', text: "From late-night call sessions to acing every day — you inspire everyone around you. The world isn't ready for what you'll do next!" },
            { icon: '💕', title: 'Because You Love Me', text: "Of all the reasons you're special, this one lives closest to my heart. You chose me — and that alone makes you the most extraordinary person in my entire world." },
          ].map((card, i) => (
            <div key={i} className="about-card" data-animate>
              <div className="icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Favorites */}
      <section className="section favorites-section">
        <h2 className="section-title">Things That Are So You 🌸</h2>
        <p className="fav-hint">Tap a button to send Mohit a hint 😄</p>
        <div className="favorites-grid">
          <div className="fav-card sunflower-card" data-animate>
            <div className="fav-icon">🌻</div>
            <h3>Sunflowers</h3>
            <a className="fav-want-btn" href="https://mail.google.com/mail/?view=cm&to=mohit.vaswani.work@gmail.com&su=I+want+sunflowers!&body=I+want+sunflowers!" target="_blank" rel="noreferrer">
              I want sunflowers!
            </a>
          </div>
          <div className="fav-card brownie-card" data-animate>
            <div className="fav-icon">🍫</div>
            <h3>Brownies</h3>
            <a className="fav-want-btn" href="https://mail.google.com/mail/?view=cm&to=mohit.vaswani.work@gmail.com&su=I+want+brownies!&body=I+want+brownies!" target="_blank" rel="noreferrer">
              I want brownies!
            </a>
          </div>
          <div className="fav-card orchid-card" data-animate>
            <div className="fav-badge">★ Her Favourite ★</div>
            <div className="fav-icon orchid-icon">🌺</div>
            <h3>Orchids</h3>
            <a className="fav-want-btn" href="https://mail.google.com/mail/?view=cm&to=mohit.vaswani.work@gmail.com&su=I+want+orchids!&body=I+want+orchids!" target="_blank" rel="noreferrer">
              I want orchids!
            </a>
          </div>
          <div className="fav-card noodles-card" data-animate>
            <div className="fav-icon">🍜</div>
            <h3>Noodles</h3>
            <a className="fav-want-btn" href="https://mail.google.com/mail/?view=cm&to=mohit.vaswani.work@gmail.com&su=I+want+noodles!&body=I+want+noodles!" target="_blank" rel="noreferrer">
              I want noodles!
            </a>
          </div>
          <div className="fav-card tiramisu-card" data-animate>
            <div className="fav-icon">🍰</div>
            <h3>Tiramisu</h3>
            <a className="fav-want-btn" href="https://mail.google.com/mail/?view=cm&to=mohit.vaswani.work@gmail.com&su=I+want+tiramisu!&body=I+want+tiramisu!" target="_blank" rel="noreferrer">
              I want tiramisu!
            </a>
          </div>
        </div>
      </section>

      {/* Love Letter */}
      <section className="section letter-section">
        <h2 className="section-title">A Little Note for You</h2>
        <div className="letter-box" data-animate>
          <p dangerouslySetInnerHTML={{ __html: letter.body.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>') }} />
          <div className="signature">{letter.signature}</div>
        </div>
      </section>

      {/* Photo Gallery — polaroid style */}
      {photos.length > 0 && (
        <section className="section gallery-photos-section">
          <h2 className="section-title">Us 💕</h2>
          <div className="polaroid-grid">
            {photos.map((photo, i) => (
              <div
                key={i}
                className="polaroid"
                data-animate
                onClick={() => setLightbox(photo)}
                style={{ transitionDelay: `${i * 0.055}s` }}
              >
                <img src={`${import.meta.env.BASE_URL}${photo.src.replace(/^\//, '')}`} alt={`Memory ${i + 1}`} loading="lazy" />
                <div className="polaroid-label">{photo.caption || ''}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Wishes */}
      <section className="section wishes-section">
        <h2 className="section-title">Birthday Wishes for You</h2>
        <div className="wishes-grid">
          {[
            { icon: '🌺', text: 'May your life always bloom like your favourite orchid — rare, stunning, and filling every room with beauty' },
            { icon: '🚀', text: "May your career soar to heights that even your wildest dreams haven't imagined yet" },
            { icon: '🌻', text: 'May every day bring you sunflower-level sunshine — bright, warm, and absolutely impossible to miss' },
            { icon: '✨', text: 'May all your dreams come true — because you deserve nothing less than absolutely everything' },
            { icon: '🍜', text: 'May every bowl of noodles be exactly perfect — you deserve the most delicious noodles, always 😄' },
            { icon: '💜', text: 'May you always know how deeply, truly, and completely you are loved' },
          ].map((w, i) => (
            <div key={i} className="wish-card" data-animate>
              <div className="wish-icon">{w.icon}</div>
              <p>{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Emoji Gallery */}
      <section className="section gallery-section">
        <h2 className="section-title">Celebrating Our Queen</h2>
        <div className="gallery-grid">
          {['🎓', '🌻', '🏆', '🌺', '💜', '🍜'].map((emoji, i) => (
            <div key={i} className="gallery-card" data-animate>{emoji}</div>
          ))}
        </div>
      </section>

      {/* Distance */}
      <section className="section distance-section">
        <h2 className="section-title">Across Every Distance</h2>
        <div className="distance-content" data-animate>
          <div className="distance-emoji">🌸</div>
          <h3>From Cary to Jamnagar</h3>
          <p>
            Distance is just a number, and no number is too big when you're a CA who conquers them all!
            Every kilometre between us is filled with love — and an imaginary shared bowl of chilli-garlic noodles.
            Soon, every distance will disappear. Until then, know that my heart is always in Jamnagar with you.
          </p>
          <div className="distance-badge">My Heart Lives Where You Are 🌺</div>
        </div>
      </section>

      {/* Surprise */}
      <section className="section surprise-section">
        <h2 className="section-title">One More Thing...</h2>
        <button className="surprise-btn" onClick={triggerSurprise}>🌺 Click for a Surprise 🌺</button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <h2>Happy Birthday, {names.recipient}!</h2>
        <p>Made with all my love, just for you 💕</p>
        <div className="flowers-row">🌺 💜 🌻 💜 🌺</div>
      </footer>

      {/* Hidden YouTube player */}
      <div
        ref={ytDivRef}
        style={{ position: 'fixed', width: 1, height: 1, opacity: 0, pointerEvents: 'none', bottom: 0, right: 0 }}
      />

      {/* Music Widget */}
      <div className="music-widget">
        {showSongList && (
          <div className="song-list-panel">
            <div className="song-list-header">
              🎵 Your Playlist
              {playlistLoading && <span className="song-list-loading-dot"> ···</span>}
            </div>
            <div className="song-list-scroll">
              {playlistLoading && playlistSongs.length === 0 ? (
                <div className="song-list-loading">Loading songs 🌺</div>
              ) : (
                playlistSongs.map((song, i) => (
                  <div
                    key={song.videoId || i}
                    className={`song-list-item${currentSongIdx === i ? ' active' : ''}`}
                    onClick={() => playSong(song.videoId, i, song.title)}
                  >
                    <span className="song-list-indicator">
                      {currentSongIdx === i && musicPlaying
                        ? <span className="mini-eq"><span /><span /><span /></span>
                        : '▶'}
                    </span>
                    <div>
                      <div className="song-list-title">{song.title}</div>
                      <div className="song-list-artist">{song.artist}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {musicPlaying && (
          <div className="song-info">
            <div className="now-playing">
              <div className="equalizer">
                <span /><span /><span /><span />
              </div>
              <span className="song-name">{nowPlaying || '🎵 Your Playlist'}</span>
            </div>
          </div>
        )}

        <div className="music-controls">
          <button
            className={`song-list-btn${showSongList ? ' active' : ''}`}
            onClick={() => setShowSongList((v) => !v)}
            title="Song list"
          >
            ♫
          </button>
          <button className={`music-btn${musicPlaying ? ' playing' : ''}`} onClick={toggleMusic}>
            {musicPlaying ? '🔊' : '🎵'}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            <img src={`${import.meta.env.BASE_URL}${lightbox.src.replace(/^\//, '')}`} alt={lightbox.caption || 'Photo'} />
            {lightbox.caption && <p className="lightbox-caption">{lightbox.caption}</p>}
          </div>
        </div>
      )}
    </>
  );
}
