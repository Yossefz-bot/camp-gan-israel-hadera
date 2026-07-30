'use strict';

const API_BASE = '/api';

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function setStatus(node, message, type = '') {
  if (!node) return;
  node.textContent = message;
  node.className = `form-status ${type}`.trim();
}

function initNavigation() {
  const toggle = qs('.menu-toggle');
  const nav = qs('#site-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

async function sendForm(form, endpoint, statusNode) {
  if (!form.reportValidity()) return;
  const payload = Object.fromEntries(new FormData(form).entries());
  if (form.elements.consent && !form.elements.consent.checked) {
    setStatus(statusNode, 'צריך לאשר קבלת עדכונים.', 'error');
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  setStatus(statusNode, 'שולח…');

  try {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'השירות עדיין לא חובר למסד הנתונים.');
    setStatus(statusNode, data.message || 'הפרטים נשמרו בהצלחה.', 'success');
    form.reset();
  } catch (error) {
    setStatus(statusNode, error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

function initForms() {
  const signup = qs('#signup-form');
  const contact = qs('#contact-form');
  signup?.addEventListener('submit', event => {
    event.preventDefault();
    sendForm(signup, 'subscribers', qs('#signup-status'));
  });
  contact?.addEventListener('submit', event => {
    event.preventDefault();
    sendForm(contact, 'contact', qs('#contact-status'));
  });
}

function initLightbox() {
  const lightbox = qs('#lightbox');
  if (!lightbox) return;
  const close = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
  };
  qs('.lightbox-close', lightbox)?.addEventListener('click', close);
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && lightbox.classList.contains('open')) close();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const year = qs('#year');
  if (year) year.textContent = new Date().getFullYear();
  initNavigation();
  initForms();
  initLightbox();
});
