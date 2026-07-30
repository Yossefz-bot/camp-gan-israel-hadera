(() => {
  const q = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mediaUrl = key => key ? `/api/media/${encodeURI(key)}` : '';
  const hebrewDate = value => { if (!value) return ''; try { return new Intl.DateTimeFormat('he-IL-u-ca-hebrew',{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${value}T12:00:00`)); } catch { return value; } };
  const state = { songs: [], current: -1, loop: false, shuffle: false };

  function setTheme(settings) {
    if (settings.theme_primary) document.documentElement.style.setProperty('--blue', settings.theme_primary);
    if (settings.theme_secondary) document.documentElement.style.setProperty('--ink', settings.theme_secondary);
    if (settings.theme_accent) document.documentElement.style.setProperty('--accent', settings.theme_accent);
  }

  function videoEmbed(url) {
    if (!url) return '';
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    if (yt) return `<iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="סרטון" loading="lazy" allowfullscreen></iframe>`;
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `<iframe src="https://player.vimeo.com/video/${vimeo[1]}" title="סרטון" loading="lazy" allowfullscreen></iframe>`;
    return `<video controls preload="metadata" src="${esc(url)}"></video>`;
  }

  function renderSettings(settings) {
    setTheme(settings);
    const siteTitle = settings.seo_title || settings.site_title || settings.camp_name || 'קעמפ גן ישראל חדרה';
    document.title = siteTitle;
    q('#metaDescription').content = settings.seo_description || settings.hero_text || '';
    q('#metaKeywords').content = settings.seo_keywords || '';
    q('#ogTitle').content = siteTitle;
    q('#ogDescription').content = settings.seo_description || settings.hero_text || '';
    q('#brandName').textContent = settings.camp_name || settings.site_title || 'קעמפ גן ישראל חדרה';
    q('#heroKicker').textContent = settings.hero_kicker || 'קיץ של חוויה • שליחות • חברות';
    q('#heroTitle').textContent = settings.hero_title || 'הקיץ שלא שוכחים';
    q('#heroText').textContent = settings.hero_text || 'רגעים, חוויות וזיכרונות מהקעמפ שלנו';
    if (settings.hero_image_key) q('#hero').style.setProperty('--hero-image', `url('${mediaUrl(settings.hero_image_key)}')`);
    if (settings.logo_key) { q('#brandLogo').src = mediaUrl(settings.logo_key); q('#brandLogo').classList.remove('hidden'); }
    if (settings.registration_button_url) q('#heroButtons').innerHTML += ` <a class="primary" href="${esc(settings.registration_button_url)}" target="_blank" rel="noopener">${esc(settings.registration_button_text || 'הרשמה לקעמפ')}</a>`;
    if (settings.registration_video_url) { q('#registrationSection').classList.remove('hidden'); q('#registrationVideo').className = `video-wrap ${settings.registration_video_aspect || 'landscape'}`; q('#registrationVideo').innerHTML = videoEmbed(settings.registration_video_url); }
    if (settings.story_title || settings.story_text) { q('#storySection').classList.remove('hidden'); q('#storyKicker').textContent = settings.story_kicker || ''; q('#storyTitle').textContent = settings.story_title || ''; q('#storyText').textContent = settings.story_text || ''; if (settings.story_image_key) q('#storyCard').style.setProperty('--story-image', `url('${mediaUrl(settings.story_image_key)}')`); }
    const logos = [settings.footer_logo_1_key, settings.footer_logo_2_key, settings.footer_logo_3_key].filter(Boolean);
    q('#footerLogos').innerHTML = logos.map(key => `<img src="${mediaUrl(key)}" alt="">`).join('');
    q('#footerText').innerHTML = esc(settings.footer_text || `© ${new Date().getFullYear()} ${settings.camp_name || 'קעמפ גן ישראל חדרה'}`);
  }

  function renderSongs(songs) {
    state.songs = songs;
    if (!songs.length) return;
    q('#songs').classList.remove('hidden');
    q('#songsList').innerHTML = songs.map((song, i) => `<article class="song-public-row" data-index="${i}"><button aria-label="נגן">▶</button><div><strong>${esc(song.title || song.original_name || 'המנון')}</strong><small>המנון הקעמפ</small></div><span>${i + 1}</span></article>`).join('');
    q('#songsList').querySelectorAll('.song-public-row').forEach(row => row.querySelector('button').onclick = () => playSong(Number(row.dataset.index)));
    q('#mainAudio').addEventListener('ended', nextSong);
  }

  function playSong(index) {
    if (!state.songs.length) return;
    state.current = index;
    const song = state.songs[index];
    q('#mainAudio').src = mediaUrl(song.object_key);
    q('#mainAudio').play().catch(() => {});
    q('#songsList').querySelectorAll('.song-public-row').forEach((row, i) => row.querySelector('button').textContent = i === index ? '❚❚' : '▶');
  }
  function nextSong() { if (state.loop) return playSong(state.current); const next = state.shuffle ? Math.floor(Math.random()*state.songs.length) : (state.current + 1) % state.songs.length; playSong(next); }

  function renderTestimonials(items) {
    if (!items.length) return;
    q('#testimonials').classList.remove('hidden');
    q('#testimonialGrid').innerHTML = items.map(t => `<article class="testimonial-card"><div class="stars">${'★'.repeat(Number(t.rating)||5)}</div><blockquote>${esc(t.message)}</blockquote><strong>${esc(t.name)}</strong></article>`).join('');
  }

  async function init() {
    q('#year')?.replaceChildren(String(new Date().getFullYear()));
    try {
      const response = await fetch('/api/site'); if (!response.ok) throw new Error('load');
      const data = await response.json(); renderSettings(data.settings || {});
      if (data.message) { q('#message').classList.remove('hidden'); q('#message').innerHTML = `<strong>${esc(data.message.title)}</strong><span>${esc(data.message.body)}</span>`; }
      q('#days').innerHTML = data.days?.length ? data.days.map(d => { const cover = d.cover_key || d.fallback_cover_key; return `<a class="day-card" href="/day.html?slug=${encodeURIComponent(d.slug)}" ${cover ? `style="--cover:url('${mediaUrl(cover)}')"` : ''}><div class="day-overlay"></div><div><span>${esc(d.label || hebrewDate(d.date) || 'יום בקעמפ')}</span><h3>${esc(d.title)}</h3><p>${esc(d.description || '')}</p><b>${d.media_count || 0} פריטים ←</b></div></a>`; }).join('') : '<div class="empty">עוד מעט יעלו כאן הגלריות הראשונות ✨</div>';
      renderSongs(data.songs || []); renderTestimonials(data.testimonials || []);
    } catch { q('#days').innerHTML = '<div class="empty">לא הצלחנו לטעון כרגע. נסו לרענן.</div>'; }
  }

  q('#shuffleSongs').onclick = () => { state.shuffle = !state.shuffle; q('#shuffleSongs').textContent = state.shuffle ? 'ערבוב: פעיל' : 'ערבוב'; };
  q('#loopSongs').onclick = () => { state.loop = !state.loop; q('#loopSongs').textContent = state.loop ? 'חזרה: פעיל' : 'חזרה: כבוי'; };
  q('#subscribe').addEventListener('submit', async e => { e.preventDefault(); q('#subStatus').textContent='שולח…'; const body=Object.fromEntries(new FormData(e.target)); const r=await fetch('/api/subscribe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}); q('#subStatus').textContent=r.ok?'נרשמת בהצלחה! 🎉':'לא הצלחנו לרשום כרגע'; if(r.ok)e.target.reset(); });
  q('#testimonialForm').addEventListener('submit', async e => { e.preventDefault(); q('#testimonialStatus').textContent='שולח…'; const body=Object.fromEntries(new FormData(e.target)); const r=await fetch('/api/testimonials',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}); q('#testimonialStatus').textContent=r.ok?'תודה! התגובה נשלחה לאישור.':'לא הצלחנו לשלוח כרגע'; if(r.ok)e.target.reset(); });
  init();
})();
