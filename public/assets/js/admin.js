(() => {
  'use strict';

  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const attr = value => esc(value).replace(/`/g, '&#96;');
  const fmt = value => new Intl.NumberFormat('he-IL').format(Number(value) || 0);
  const state = { token: localStorage.getItem('campAdminToken') || '', days: [], media: [], settings: {}, testimonials: [], subscribers: [], messages: [], stats: {}, coverDayId: null, activeTab: 'dashboard' };
  const tabTitles = { dashboard:'לוח בקרה', days:'ימים וגלריות', upload:'העלאת מדיה', site:'תוכן ועיצוב', media:'מדיה כללית', songs:'המנונים', messages:'הודעות באתר', testimonials:'תגובות הורים', subscribers:'נרשמים לעדכונים', tools:'כלים ואבטחה' };

  function headers(json = false) {
    const h = { 'x-admin-token': state.token };
    if (json) h['content-type'] = 'application/json';
    return h;
  }

  async function api(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { ...(options.headers || {}), ...headers(Boolean(options.body && typeof options.body === 'string')) } });
    const type = response.headers.get('content-type') || '';
    const data = type.includes('application/json') ? await response.json().catch(() => ({})) : await response.text();
    if (!response.ok) {
      const error = new Error((data && data.error) || (typeof data === 'string' ? data : 'הפעולה נכשלה'));
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function busy(active, text = 'מבצע פעולה…') {
    q('#adminBusyText').textContent = text;
    q('#adminBusy').classList.toggle('hidden', !active);
  }

  function toast(message, type = 'success') {
    const el = q('#adminToast');
    el.textContent = message;
    el.className = `admin-toast show ${type}`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.className = 'admin-toast', 3400);
  }

  function hebrewDate(value) {
    if (!value) return '';
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return '';
    try {
      return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day:'numeric', month:'long', year:'numeric' }).format(date);
    } catch {
      return value;
    }
  }

  function mediaUrl(key) { return key ? `/api/media/${encodeURI(key)}` : ''; }
  function dateText(value) { return value ? hebrewDate(value) : 'ללא תאריך'; }
  function bytes(value) {
    const n = Number(value) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
    return `${(n / 1024 ** 3).toFixed(1)} GB`;
  }

  async function login(event) {
    event.preventDefault();
    const token = q('#tokenInput').value.trim();
    q('#loginStatus').textContent = 'בודק…';
    try {
      const response = await fetch('/api/admin/check', { headers: { 'x-admin-token': token } });
      if (!response.ok) throw new Error('קוד שגוי');
      state.token = token;
      localStorage.setItem('campAdminToken', token);
      await enterAdmin();
    } catch (error) {
      q('#loginStatus').textContent = error.message || 'הכניסה נכשלה';
    }
  }

  async function checkStoredToken() {
    if (!state.token) return;
    try {
      await api('/api/admin/check');
      await enterAdmin();
    } catch {
      localStorage.removeItem('campAdminToken');
      state.token = '';
    }
  }

  async function enterAdmin() {
    q('#loginScreen').classList.add('hidden');
    q('#adminApp').classList.remove('hidden');
    await loadAll();
  }

  function logout() {
    localStorage.removeItem('campAdminToken');
    state.token = '';
    location.reload();
  }

  async function loadAll() {
    busy(true, 'טוען את מערכת הניהול…');
    try {
      const [dashboard, days, media, settings, testimonials, subscribers, messages] = await Promise.all([
        api('/api/admin/dashboard'), api('/api/admin/days'), api('/api/admin/media?limit=1000'), api('/api/admin/settings'),
        api('/api/admin/testimonials'), api('/api/admin/subscribers'), api('/api/admin/messages')
      ]);
      state.stats = dashboard.stats || {};
      state.days = days.days || [];
      state.media = media.media || [];
      state.settings = settings.settings || {};
      state.testimonials = testimonials.testimonials || [];
      state.subscribers = subscribers.subscribers || [];
      state.messages = messages.messages || [];
      renderAll();
    } catch (error) {
      if (error.status === 401) return logout();
      q('#bindingAlert').classList.remove('hidden');
      q('#bindingAlert').textContent = `לא הצלחנו לטעון את כל הנתונים: ${error.message}. ודא שהרצת את קובץ 0002_upgrade.sql וש־DB ו־MEDIA מחוברים.`;
      toast(error.message, 'error');
    } finally {
      busy(false);
    }
  }

  function selectTab(name) {
    state.activeTab = name;
    qa('.admin-tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    qa('.admin-panel').forEach(p => p.classList.toggle('hidden', p.id !== `panel-${name}`));
    q('#activeTabTitle').textContent = tabTitles[name] || name;
    q('#adminSidebar').classList.remove('open');
    if (name === 'media') renderMedia();
    if (name === 'subscribers') renderSubscribers();
    if (name === 'testimonials') renderTestimonials();
  }

  function renderAll() {
    renderDashboard();
    renderDayOptions();
    renderDays();
    renderSettings();
    renderMedia();
    renderSongs();
    renderMessages();
    renderTestimonials();
    renderSubscribers();
  }

  function renderDashboard() {
    q('#statDays').textContent = fmt(state.stats.days);
    q('#statImages').textContent = fmt(state.stats.images);
    q('#statVideos').textContent = fmt(state.stats.videos);
    q('#statSongs').textContent = fmt(state.stats.songs);
    q('#statPendingTestimonials').textContent = fmt(state.stats.pending_testimonials);
    q('#statSubscribers').textContent = fmt(state.stats.subscribers);
    const items = state.media.slice(0, 8);
    q('#recentMedia').innerHTML = items.length ? items.map(m => `<div class="compact-row"><span class="media-icon">${m.kind === 'image' ? '🖼️' : m.kind === 'video' ? '🎥' : '🎵'}</span><div><strong>${esc(m.title || m.original_name || m.object_key.split('/').pop())}</strong><small>${esc(m.day_title || 'מדיה כללית')} · ${bytes(m.size_bytes)}</small></div></div>`).join('') : '<div class="admin-empty">עדיין לא הועלתה מדיה.</div>';
  }

  function renderDayOptions() {
    const options = state.days.map(d => `<option value="${d.id}">${esc(d.title)}</option>`).join('');
    q('#uploadDay').innerHTML = `<option value="">מדיה כללית</option>${options}`;
    q('#mediaDayFilter').innerHTML = `<option value="">כל הימים</option><option value="general">ללא יום</option>${options}`;
  }

  function renderDays() {
    const list = q('#daysList');
    if (!state.days.length) {
      list.innerHTML = '<div class="admin-empty">עדיין אין ימים. לחץ על “יצירת יום חדש”.</div>';
      return;
    }
    list.innerHTML = state.days.map((day, index) => {
      const cover = day.cover_key || day.fallback_cover_key;
      return `<article class="day-admin-card" data-day-id="${day.id}">
        <div class="day-admin-summary">
          <div class="admin-cover">${cover ? `<img src="${mediaUrl(cover)}" alt="">` : '<span>📷</span>'}</div>
          <div class="admin-day-info"><span class="status-pill ${day.is_published ? 'approved' : 'rejected'}">${day.is_published ? 'מוצג באתר' : 'מוסתר'}</span><h3>${esc(day.title)}</h3><p>${esc(day.label || dateText(day.date))} · ${fmt(day.media_count)} פריטים</p></div>
          <div class="admin-day-actions"><button class="admin-btn ghost" data-action="toggle-edit">עריכה</button><button class="admin-btn ghost" data-action="cover">תמונת שער</button><button class="admin-btn ghost" data-action="move-up" ${index === 0 ? 'disabled' : ''}>למעלה</button><button class="admin-btn ghost" data-action="move-down" ${index === state.days.length - 1 ? 'disabled' : ''}>למטה</button></div>
        </div>
        <form class="day-edit hidden">
          <div class="admin-form-grid">
            <label>שם היום<input name="title" value="${attr(day.title)}" required></label>
            <label>תווית קצרה<input name="label" value="${attr(day.label || '')}"></label>
            <label>תאריך לועזי<input class="day-date-input" name="date" type="date" value="${attr(day.date || '')}"><small class="hebrew-date-preview">${esc(dateText(day.date))}</small></label>
            <label>כתובת באנגלית<input name="slug" value="${attr(day.slug)}" required></label>
            <label>סדר תצוגה<input name="sort_order" type="number" value="${Number(day.sort_order) || 0}"></label>
            <label>סטטוס<select name="is_published"><option value="1" ${day.is_published ? 'selected' : ''}>מוצג באתר</option><option value="0" ${!day.is_published ? 'selected' : ''}>מוסתר</option></select></label>
            <label>יחס סרטון<select name="video_aspect">${aspectOptions(day.video_aspect)}</select></label>
            <label class="full">קישור סרטון סיכום<input name="video_url" value="${attr(day.video_url || '')}"></label>
            <label class="full">תיאור<textarea name="description" rows="3">${esc(day.description || '')}</textarea></label>
          </div>
          <div class="admin-toolbar"><button class="admin-btn primary" type="submit">שמירת היום</button><button class="admin-btn ghost" type="button" data-action="upload-day">העלאת קבצים ליום</button><button class="admin-btn danger" type="button" data-action="delete">מחיקת היום</button></div>
        </form>
      </article>`;
    }).join('');

    qa('.day-admin-card', list).forEach(card => bindDayCard(card));
  }

  function bindDayCard(card) {
    const id = Number(card.dataset.dayId);
    card.addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const action = button.dataset.action;
      if (action === 'toggle-edit') q('.day-edit', card).classList.toggle('hidden');
      if (action === 'cover') openCoverDialog(id);
      if (action === 'move-up') reorderDay(id, -1);
      if (action === 'move-down') reorderDay(id, 1);
      if (action === 'upload-day') { q('#uploadDay').value = String(id); selectTab('upload'); }
      if (action === 'delete') deleteDay(id);
    });
    q('.day-edit', card).addEventListener('submit', event => saveDay(event, id));
    const input = q('.day-date-input', card);
    input.addEventListener('change', () => q('.hebrew-date-preview', card).textContent = dateText(input.value));
  }

  async function createDay(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    body.sort_order = Number(body.sort_order || 0);
    busy(true, 'יוצר את היום…');
    try {
      await api('/api/admin/days', { method:'POST', body:JSON.stringify(body) });
      event.currentTarget.reset();
      q('#newDayForm').classList.add('hidden');
      await loadAll();
      toast('היום נוצר בהצלחה');
    } catch (error) { toast(error.message, 'error'); }
    finally { busy(false); }
  }

  async function saveDay(event, id) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    body.id = id;
    body.sort_order = Number(body.sort_order || 0);
    body.is_published = Number(body.is_published || 0);
    busy(true, 'שומר את היום…');
    try { await api('/api/admin/days', { method:'PATCH', body:JSON.stringify(body) }); await loadAll(); toast('היום נשמר'); }
    catch (error) { toast(error.message, 'error'); }
    finally { busy(false); }
  }

  async function reorderDay(id, direction) {
    const ids = state.days.map(d => d.id);
    const i = ids.indexOf(id), j = i + direction;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    busy(true, 'משנה את הסדר…');
    try { await api('/api/admin/days', { method:'PATCH', body:JSON.stringify({ action:'reorder', ids }) }); await loadAll(); }
    catch (error) { toast(error.message, 'error'); }
    finally { busy(false); }
  }

  async function deleteDay(id) {
    const day = state.days.find(d => d.id === id);
    if (!day || !confirm(`למחוק את “${day.title}”?\n\nאישור ימחק גם את כל הקבצים של היום מ־R2.`)) return;
    busy(true, 'מוחק את היום והמדיה…');
    try { await api('/api/admin/days', { method:'DELETE', body:JSON.stringify({ id, delete_media:true }) }); await loadAll(); toast('היום נמחק'); }
    catch (error) { toast(error.message, 'error'); }
    finally { busy(false); }
  }

  function openCoverDialog(dayId) {
    state.coverDayId = dayId;
    const images = state.media.filter(m => Number(m.day_id) === dayId && m.kind === 'image');
    q('#coverChoices').innerHTML = images.length ? images.map(m => `<button class="media-tile" data-key="${attr(m.object_key)}"><img src="${mediaUrl(m.object_key)}" alt=""><span>${esc(m.title || m.original_name || 'תמונה')}</span></button>`).join('') : '<div class="admin-empty">אין עדיין תמונות ביום הזה.</div>';
    qa('[data-key]', q('#coverChoices')).forEach(b => b.onclick = () => chooseCover(b.dataset.key));
    q('#coverDialog').showModal();
  }

  async function chooseCover(key) {
    busy(true, 'שומר תמונת שער…');
    try { await api('/api/admin/days', { method:'PATCH', body:JSON.stringify({ id:state.coverDayId, cover_key:key }) }); q('#coverDialog').close(); await loadAll(); toast('תמונת השער עודכנה'); }
    catch (error) { toast(error.message, 'error'); }
    finally { busy(false); }
  }

  async function uploadMedia(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const files = [...q('#uploadFiles').files];
    if (!files.length) return toast('לא נבחרו קבצים', 'error');
    q('#uploadStatus').textContent = `מעלה ${files.length} קבצים…`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/upload');
    xhr.setRequestHeader('x-admin-token', state.token);
    xhr.upload.onprogress = e => { if (e.lengthComputable) q('#uploadProgress').value = Math.round(e.loaded / e.total * 100); };
    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const result = JSON.parse(xhr.responseText || '{}');
        q('#uploadStatus').textContent = `${result.items?.length || files.length} קבצים עלו בהצלחה`;
        form.reset(); q('#selectedFiles').innerHTML = ''; q('#uploadProgress').value = 0;
        await loadAll(); toast('הקבצים הועלו ל־R2');
      } else {
        let message = 'ההעלאה נכשלה';
        try { message = JSON.parse(xhr.responseText).error || message; } catch {}
        q('#uploadStatus').textContent = message; toast(message, 'error');
      }
    };
    xhr.onerror = () => { q('#uploadStatus').textContent = 'שגיאת רשת בהעלאה'; toast('שגיאת רשת בהעלאה', 'error'); };
    xhr.send(new FormData(form));
  }

  function renderSelectedFiles() {
    const files = [...q('#uploadFiles').files];
    q('#selectedFiles').innerHTML = files.map(f => `<span>${esc(f.name)} <small>${bytes(f.size)}</small></span>`).join('');
  }

  function renderSettings() {
    const form = q('#settingsForm');
    qa('[name]', form).forEach(input => {
      if (Object.prototype.hasOwnProperty.call(state.settings, input.name)) input.value = state.settings[input.name] ?? '';
    });
    qa('[data-color-for]').forEach(picker => {
      const name = picker.dataset.colorFor;
      const value = state.settings[name] || (name === 'theme_primary' ? '#2463eb' : name === 'theme_secondary' ? '#101c3d' : '#f0b429');
      picker.value = /^#[0-9a-f]{6}$/i.test(value) ? value : '#2463eb';
    });
  }

  async function saveSettings(event) {
    if (event) event.preventDefault();
    const body = Object.fromEntries(new FormData(q('#settingsForm')));
    busy(true, 'שומר את תוכן האתר…');
    try { const data = await api('/api/admin/settings', { method:'PUT', body:JSON.stringify(body) }); state.settings = data.settings || body; renderSettings(); toast('הגדרות האתר נשמרו'); }
    catch (error) { toast(error.message, 'error'); }
    finally { busy(false); }
  }

  function filteredMedia() {
    const search = q('#mediaSearch').value.trim().toLowerCase();
    const kind = q('#mediaKindFilter').value;
    const day = q('#mediaDayFilter').value;
    return state.media.filter(m => {
      const hay = `${m.title || ''} ${m.original_name || ''} ${m.object_key}`.toLowerCase();
      return (!search || hay.includes(search)) && (!kind || m.kind === kind) && (!day || (day === 'general' ? !m.day_id : String(m.day_id) === day));
    });
  }

  function renderMedia() {
    const grid = q('#mediaGrid');
    if (!grid) return;
    const items = filteredMedia();
    grid.innerHTML = items.length ? items.map(m => {
      const preview = m.kind === 'image' ? `<img loading="lazy" src="${mediaUrl(m.object_key)}" alt="">` : m.kind === 'video' ? `<video src="${mediaUrl(m.object_key)}" preload="metadata"></video>` : '<div class="audio-preview">♫</div>';
      return `<article class="media-admin-card" data-media-id="${m.id}"><div class="media-preview">${preview}</div><div class="media-meta"><strong>${esc(m.title || m.original_name || m.object_key.split('/').pop())}</strong><small>${esc(m.day_title || 'מדיה כללית')} · ${bytes(m.size_bytes)}</small></div><div class="media-actions"><button class="admin-btn ghost" data-action="copy">העתקת מפתח</button>${m.kind === 'image' ? '<button class="admin-btn ghost" data-action="use">שימוש באתר</button>' : ''}<button class="admin-btn danger" data-action="delete">מחיקה</button></div></article>`;
    }).join('') : '<div class="admin-empty">לא נמצאו קבצים.</div>';
    qa('.media-admin-card', grid).forEach(card => card.onclick = e => handleMediaAction(e, Number(card.dataset.mediaId)));
  }

  async function handleMediaAction(event, id) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const item = state.media.find(m => m.id === id);
    if (!item) return;
    if (button.dataset.action === 'copy') { await navigator.clipboard.writeText(item.object_key); toast('מפתח הקובץ הועתק'); }
    if (button.dataset.action === 'delete') await deleteMedia(item);
    if (button.dataset.action === 'use') useMediaInSite(item);
  }

  function useMediaInSite(item) {
    const choice = prompt('לאיזה מקום לשייך את התמונה?\n1 = תמונת פתיחה\n2 = תמונת סיפור\n3 = לוגו ראשי\n4 = לוגו תחתון 1\n5 = לוגו תחתון 2\n6 = לוגו תחתון 3');
    const map = { '1':'hero_image_key', '2':'story_image_key', '3':'logo_key', '4':'footer_logo_1_key', '5':'footer_logo_2_key', '6':'footer_logo_3_key' };
    if (!map[choice]) return;
    q(`[name="${map[choice]}"]`, q('#settingsForm')).value = item.object_key;
    selectTab('site');
    toast('התמונה שובצה בטופס. לחץ שמירת שינויים.');
  }

  async function deleteMedia(item) {
    if (!confirm(`למחוק לצמיתות את הקובץ “${item.title || item.original_name || item.object_key}”?`)) return;
    busy(true, 'מוחק את הקובץ…');
    try { await api('/api/admin/media', { method:'DELETE', body:JSON.stringify({ id:item.id }) }); await loadAll(); toast('הקובץ נמחק'); }
    catch (error) { toast(error.message, 'error'); }
    finally { busy(false); }
  }

  function renderSongs() {
    const songs = state.media.filter(m => m.kind === 'audio');
    q('#songsList').innerHTML = songs.length ? songs.map((m, index) => `<article class="song-admin-row" data-media-id="${m.id}"><span class="song-index">${index + 1}</span><div><strong>${esc(m.title || m.original_name || 'המנון')}</strong><small>${bytes(m.size_bytes)} · ${m.is_published ? 'מוצג באתר' : 'מוסתר'}</small><audio controls preload="none" src="${mediaUrl(m.object_key)}"></audio></div><div class="admin-toolbar"><button class="admin-btn ghost" data-action="rename">שינוי שם</button><button class="admin-btn ghost" data-action="toggle">${m.is_published ? 'הסתרה' : 'פרסום'}</button><button class="admin-btn ghost" data-action="up" ${index === 0 ? 'disabled' : ''}>↑</button><button class="admin-btn ghost" data-action="down" ${index === songs.length - 1 ? 'disabled' : ''}>↓</button><button class="admin-btn danger" data-action="delete">מחיקה</button></div></article>`).join('') : '<div class="admin-empty">עדיין לא הועלו המנונים.</div>';
    qa('.song-admin-row').forEach(row => row.onclick = e => handleSongAction(e, Number(row.dataset.mediaId), songs));
  }

  async function handleSongAction(event, id, songs) {
    const button = event.target.closest('[data-action]'); if (!button) return;
    const song = songs.find(s => s.id === id); if (!song) return;
    if (button.dataset.action === 'delete') return deleteMedia(song);
    if (button.dataset.action === 'rename') {
      const title = prompt('שם ההמנון', song.title || song.original_name || ''); if (title === null) return;
      await updateMedia({ id, title });
    }
    if (button.dataset.action === 'toggle') await updateMedia({ id, is_published: song.is_published ? 0 : 1 });
    if (button.dataset.action === 'up' || button.dataset.action === 'down') {
      const ids = songs.map(s => s.id), i = ids.indexOf(id), j = i + (button.dataset.action === 'up' ? -1 : 1);
      if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]];
      await updateMedia({ action:'reorder', ids });
    }
  }

  async function updateMedia(body) {
    busy(true, 'מעדכן מדיה…');
    try { await api('/api/admin/media', { method:'PATCH', body:JSON.stringify(body) }); await loadAll(); toast('המדיה עודכנה'); }
    catch (error) { toast(error.message, 'error'); }
    finally { busy(false); }
  }

  function renderMessages() {
    q('#messagesList').innerHTML = state.messages.length ? state.messages.map(m => `<article class="compact-row"><span class="status-pill ${m.is_active ? 'approved' : 'rejected'}">${m.is_active ? 'פעילה' : 'מוסתרת'}</span><div><strong>${esc(m.title)}</strong><small>${esc(m.body)}</small></div><div class="admin-toolbar"><button class="admin-btn ghost" data-message-id="${m.id}" data-action="toggle">${m.is_active ? 'הסתרה' : 'הפעלה'}</button><button class="admin-btn danger" data-message-id="${m.id}" data-action="delete">מחיקה</button></div></article>`).join('') : '<div class="admin-empty">אין הודעות.</div>';
    qa('[data-message-id]').forEach(b => b.onclick = () => messageAction(Number(b.dataset.messageId), b.dataset.action));
  }

  async function createMessage(event) {
    event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); body.is_active = Number(body.is_active);
    busy(true, 'שומר הודעה…');
    try { await api('/api/admin/messages', { method:'POST', body:JSON.stringify(body) }); event.currentTarget.reset(); event.currentTarget.classList.add('hidden'); await loadAll(); toast('ההודעה נשמרה'); }
    catch (error) { toast(error.message, 'error'); }
    finally { busy(false); }
  }

  async function messageAction(id, action) {
    const m = state.messages.find(x => x.id === id); if (!m) return;
    busy(true, 'מעדכן הודעה…');
    try {
      if (action === 'delete') { if (!confirm('למחוק את ההודעה?')) return; await api('/api/admin/messages', { method:'DELETE', body:JSON.stringify({ id }) }); }
      else await api('/api/admin/messages', { method:'PATCH', body:JSON.stringify({ id, is_active:m.is_active ? 0 : 1 }) });
      await loadAll(); toast('ההודעה עודכנה');
    } catch (error) { toast(error.message, 'error'); }
    finally { busy(false); }
  }

  function renderTestimonials() {
    const filter = q('#testimonialFilter')?.value || '';
    const items = state.testimonials.filter(t => !filter || t.status === filter);
    q('#testimonialsList').innerHTML = items.length ? items.map(t => `<article class="testimonial-admin-card"><div class="testimonial-head"><div><span class="status-pill ${t.status}">${statusText(t.status)}</span><h3>${esc(t.name)}</h3><small>${'★'.repeat(Number(t.rating) || 5)} ${esc(t.phone || '')}</small></div><div class="admin-toolbar"><button class="admin-btn ghost" data-testimonial-id="${t.id}" data-action="approve">אישור</button><button class="admin-btn ghost" data-testimonial-id="${t.id}" data-action="reject">דחייה</button><button class="admin-btn ghost" data-testimonial-id="${t.id}" data-action="edit">עריכה</button><button class="admin-btn danger" data-testimonial-id="${t.id}" data-action="delete">מחיקה</button></div></div><blockquote>${esc(t.message)}</blockquote></article>`).join('') : '<div class="admin-empty">אין תגובות בסטטוס הזה.</div>';
    qa('[data-testimonial-id]').forEach(b => b.onclick = () => testimonialAction(Number(b.dataset.testimonialId), b.dataset.action));
  }

  async function createTestimonial(event) {
    event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); body.rating = Number(body.rating);
    busy(true, 'שומר תגובה…');
    try { await api('/api/admin/testimonials', { method:'POST', body:JSON.stringify(body) }); event.currentTarget.reset(); event.currentTarget.classList.add('hidden'); await loadAll(); toast('התגובה נשמרה'); }
    catch (error) { toast(error.message, 'error'); }
    finally { busy(false); }
  }

  async function testimonialAction(id, action) {
    const t = state.testimonials.find(x => x.id === id); if (!t) return;
    if (action === 'delete' && !confirm('למחוק את התגובה?')) return;
    let body = { id };
    if (action === 'approve') body.status = 'approved';
    if (action === 'reject') body.status = 'rejected';
    if (action === 'edit') {
      const message = prompt('עריכת התגובה', t.message); if (message === null) return; body.message = message;
    }
    busy(true, 'מעדכן תגובה…');
    try { await api('/api/admin/testimonials', { method:action === 'delete' ? 'DELETE' : 'PATCH', body:JSON.stringify(body) }); await loadAll(); toast('התגובה עודכנה'); }
    catch (error) { toast(error.message, 'error'); }
    finally { busy(false); }
  }

  function renderSubscribers() {
    const search = q('#subscriberSearch')?.value.trim().toLowerCase() || '';
    const status = q('#subscriberStatus')?.value || '';
    const items = state.subscribers.filter(s => (!search || `${s.name} ${s.email}`.toLowerCase().includes(search)) && (!status || s.status === status));
    q('#subscribersBody').innerHTML = items.length ? items.map(s => `<tr><td>${esc(s.name || '—')}</td><td>${esc(s.email)}</td><td><span class="status-pill ${s.status === 'active' ? 'approved' : 'rejected'}">${s.status === 'active' ? 'פעיל' : 'הוסר'}</span></td><td>${esc(new Date(s.created_at).toLocaleDateString('he-IL'))}</td><td><div class="admin-toolbar"><button class="admin-btn ghost" data-subscriber-id="${s.id}" data-action="copy">העתקה</button><button class="admin-btn ghost" data-subscriber-id="${s.id}" data-action="toggle">${s.status === 'active' ? 'הסרה' : 'החזרה'}</button><button class="admin-btn danger" data-subscriber-id="${s.id}" data-action="delete">מחיקה</button></div></td></tr>`).join('') : '<tr><td colspan="5" class="admin-empty">לא נמצאו נרשמים.</td></tr>';
    qa('[data-subscriber-id]').forEach(b => b.onclick = () => subscriberAction(Number(b.dataset.subscriberId), b.dataset.action));
  }

  async function subscriberAction(id, action) {
    const s = state.subscribers.find(x => x.id === id); if (!s) return;
    if (action === 'copy') { await navigator.clipboard.writeText(s.email); return toast('האימייל הועתק'); }
    if (action === 'delete' && !confirm('למחוק את הנרשם לצמיתות?')) return;
    busy(true, 'מעדכן נרשם…');
    try {
      await api('/api/admin/subscribers', { method:action === 'delete' ? 'DELETE' : 'PATCH', body:JSON.stringify(action === 'delete' ? { id } : { id, status:s.status === 'active' ? 'unsubscribed' : 'active' }) });
      await loadAll(); toast('רשימת הנרשמים עודכנה');
    } catch (error) { toast(error.message, 'error'); }
    finally { busy(false); }
  }

  function exportSubscribers() {
    const rows = [['שם','אימייל','סטטוס','תאריך'], ...state.subscribers.map(s => [s.name, s.email, s.status, s.created_at])];
    const csv = '\ufeff' + rows.map(row => row.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8' })); a.download = `camp-subscribers-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  async function healthCheck() {
    q('#healthResult').textContent = 'בודק…';
    try { const data = await api('/api/admin/health'); q('#healthResult').textContent = JSON.stringify(data, null, 2); }
    catch (error) { q('#healthResult').textContent = error.message; }
  }

  function aspectOptions(selected) {
    return [['landscape','אופקי 16:9'],['portrait','אנכי 9:16'],['square','ריבוע 1:1']].map(([v,t]) => `<option value="${v}" ${selected === v ? 'selected' : ''}>${t}</option>`).join('');
  }
  function statusText(status) { return status === 'approved' ? 'מאושר' : status === 'rejected' ? 'נדחה' : 'ממתין'; }

  function bindEvents() {
    q('#loginForm').addEventListener('submit', login);
    q('#logoutButton').addEventListener('click', logout);
    q('#logoutEverywhereButton').addEventListener('click', logout);
    q('#mobileMenuButton').addEventListener('click', () => q('#adminSidebar').classList.toggle('open'));
    q('#adminTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) selectTab(b.dataset.tab); });
    document.addEventListener('click', e => { const b = e.target.closest('[data-go-tab]'); if (b) selectTab(b.dataset.goTab); });
    q('#refreshDashboard').addEventListener('click', loadAll);
    q('#newDayButton').addEventListener('click', () => q('#newDayForm').classList.remove('hidden'));
    q('#cancelNewDay').addEventListener('click', () => q('#newDayForm').classList.add('hidden'));
    q('#newDayForm').addEventListener('submit', createDay);
    q('#newDayDate').addEventListener('change', e => q('#newDayHebrewDate').textContent = dateText(e.target.value));
    q('#uploadForm').addEventListener('submit', uploadMedia);
    q('#uploadFiles').addEventListener('change', renderSelectedFiles);
    q('#uploadKind').addEventListener('change', e => { const category = q('[name="category"]', q('#uploadForm')); category.value = e.target.value === 'audio' ? 'song' : e.target.value === 'image' && !q('#uploadDay').value ? 'general' : 'gallery'; });
    q('#settingsForm').addEventListener('submit', saveSettings);
    q('#saveSettingsTop').addEventListener('click', saveSettings);
    qa('[data-color-for]').forEach(picker => {
      picker.addEventListener('input', () => { q(`[name="${picker.dataset.colorFor}"]`, q('#settingsForm')).value = picker.value; });
      q(`[name="${picker.dataset.colorFor}"]`, q('#settingsForm')).addEventListener('input', e => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) picker.value = e.target.value; });
    });
    q('#mediaSearch').addEventListener('input', renderMedia); q('#mediaKindFilter').addEventListener('change', renderMedia); q('#mediaDayFilter').addEventListener('change', renderMedia);
    q('#newMessageButton').addEventListener('click', () => q('#messageForm').classList.toggle('hidden')); q('#messageForm').addEventListener('submit', createMessage);
    q('#newTestimonialButton').addEventListener('click', () => q('#testimonialForm').classList.toggle('hidden')); q('#testimonialForm').addEventListener('submit', createTestimonial); q('#testimonialFilter').addEventListener('change', renderTestimonials);
    q('#subscriberSearch').addEventListener('input', renderSubscribers); q('#subscriberStatus').addEventListener('change', renderSubscribers); q('#exportSubscribers').addEventListener('click', exportSubscribers);
    q('#healthCheckButton').addEventListener('click', healthCheck);
    q('#closeCoverDialog').addEventListener('click', () => q('#coverDialog').close());
    q('#coverDialog').addEventListener('click', e => { if (e.target === q('#coverDialog')) q('#coverDialog').close(); });
  }

  bindEvents();
  checkStoredToken();
})();
