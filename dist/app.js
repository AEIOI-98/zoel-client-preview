const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const listeners = new AbortController();
const listen = (target, event, handler, options = {}) => {
  target?.addEventListener(event, handler, { ...options, signal: listeners.signal });
};

// Thumbnail selection changes only its gallery. Photographs stay still on hover.
$$('[data-gallery]').forEach(gallery => {
  const main = $('img.gallery-main', gallery);
  const buttons = $$('button[data-photo]', gallery);
  if (!main) return;
  buttons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.photo === main.getAttribute('src')));
    listen(button, 'click', () => {
      if (!button.dataset.photo) return;
      main.src = button.dataset.photo;
      if (button.dataset.alt) main.alt = button.dataset.alt;
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    });
  });
});

// A clear optical lens magnifies the real hero photograph beneath the pointer.
// Other photographs retain their ordinary click-to-enlarge controls.
const photoCursor = $('#photo-cursor');
const photoLens = $('.photo-lens', photoCursor || document);
const heroPhoto = $('.hero-photo');
const heroImage = $('img', heroPhoto || document);
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
function hidePhotoCursor() {
  heroPhoto?.classList.remove('is-inspecting');
  if (photoCursor) photoCursor.hidden = true;
}
if (photoCursor && photoLens && heroPhoto && heroImage) {
  const magnification = 2.25;
  const lensRadius = parseFloat(getComputedStyle(photoCursor).getPropertyValue('--lens-size')) / 2;
  let lensSource = '';
  const movePhotoCursor = event => {
    if (!finePointer.matches || event.pointerType === 'touch' ||
        !heroImage.complete || !heroImage.naturalWidth ||
        event.target.closest('.photo-open-label')) return hidePhotoCursor();
    const rect = heroImage.getBoundingClientRect();
    // Account for the real photograph's centered object-fit:contain rectangle.
    const scale = Math.min(rect.width / heroImage.naturalWidth, rect.height / heroImage.naturalHeight);
    const width = heroImage.naturalWidth * scale;
    const height = heroImage.naturalHeight * scale;
    const x = event.clientX - rect.left - (rect.width - width) / 2;
    const y = event.clientY - rect.top - (rect.height - height) / 2;
    if (x < 0 || y < 0 || x > width || y > height) return hidePhotoCursor();
    const source = heroImage.currentSrc || heroImage.src;
    if (source !== lensSource) {
      photoLens.style.backgroundImage = `url(${JSON.stringify(source)})`;
      lensSource = source;
    }
    photoLens.style.backgroundSize = `${width * magnification}px ${height * magnification}px`;
    photoLens.style.backgroundPosition = `${lensRadius - x * magnification}px ${lensRadius - y * magnification}px`;
    photoCursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    heroPhoto.classList.add('is-inspecting');
    photoCursor.hidden = false;
  };
  listen(heroPhoto, 'pointerenter', movePhotoCursor);
  listen(heroPhoto, 'pointermove', movePhotoCursor);
  listen(heroPhoto, 'pointerleave', hidePhotoCursor);
  listen(heroPhoto, 'pointerdown', event => { if (event.pointerType === 'touch') hidePhotoCursor(); });
  listen(heroPhoto, 'click', hidePhotoCursor);
  listen(window, 'blur', hidePhotoCursor);
  listen(window, 'resize', hidePhotoCursor);
  listen(window, 'scroll', hidePhotoCursor, { capture: true, passive: true });
  listen(finePointer, 'change', hidePhotoCursor);
  listen(document, 'visibilitychange', hidePhotoCursor);
  listen(document, 'keydown', hidePhotoCursor);
}

// The enlarged viewer displays only the supplied photograph, without effects.
const photoDialog = $('#photo-dialog');
const enlargedPhoto = $('#enlarged-photo');
const photoCaption = $('#photo-caption');
const photoPosition = $('#photo-position');
const previousPhoto = $('[data-photo-previous]');
const nextPhoto = $('[data-photo-next]');
let photoItems = [];
let photoIndex = 0;
function closePhoto() {
  document.body.classList.remove('photo-viewing');
  if (photoDialog?.open) photoDialog.close();
}
function showPhoto(index) {
  photoIndex = (index + photoItems.length) % photoItems.length;
  const item = photoItems[photoIndex];
  enlargedPhoto.src = item.src;
  enlargedPhoto.alt = item.alt;
  photoCaption.textContent = item.alt;
  photoPosition.textContent = `${photoIndex + 1} / ${photoItems.length}`;
  previousPhoto.hidden = nextPhoto.hidden = photoItems.length < 2;
}
if (photoDialog && enlargedPhoto) {
  $$('[data-view-photo]').forEach(button => {
    listen(button, 'click', () => {
      const current = $('img', button);
      const gallery = button.closest('[data-gallery]');
      const set = button.closest('[data-photo-set]');
      photoItems = gallery
        ? $$('[data-photo]', gallery).map(item => ({ src: item.dataset.photo, alt: item.dataset.alt }))
        : $$('[data-view-photo] img', set || button.parentElement).map(img => ({ src: img.getAttribute('src'), alt: img.alt }));
      if (!photoItems.length) photoItems = [{ src: current.getAttribute('src'), alt: current.alt }];
      showPhoto(Math.max(0, photoItems.findIndex(item => item.src === current.getAttribute('src'))));
      photoDialog.showModal();
      document.body.classList.add('photo-viewing');
    });
  });
  listen($('.photo-close', photoDialog), 'click', closePhoto);
  listen(photoDialog, 'cancel', event => { event.preventDefault(); closePhoto(); });
  listen(photoDialog, 'close', () => { if (!photoDialog.open) document.body.classList.remove('photo-viewing'); });
  listen(photoDialog, 'click', event => { if (event.target === photoDialog) closePhoto(); });
  listen(previousPhoto, 'click', () => showPhoto(photoIndex - 1));
  listen(nextPhoto, 'click', () => showPhoto(photoIndex + 1));
  listen(photoDialog, 'keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
}

const menuButton = $('.menu-toggle');
const nav = $('#main-nav');
const desktop = window.matchMedia('(min-width: 901px)');
function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  nav?.classList.remove('open');
}
if (menuButton && nav) {
  closeMenu();
  listen(menuButton, 'click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  });
  listen(nav, 'click', event => {
    if (event.target instanceof Element && event.target.closest('a')) closeMenu();
  });
  listen(document, 'keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus({ preventScroll: true });
    }
  });
  listen(desktop, 'change', event => { if (event.matches) closeMenu(); });
}

const form = $('#enquiry-form');
const interest = $('#interest');
listen(document, 'click', event => {
  const link = event.target instanceof Element ? event.target.closest('[data-preview-contact]') : null;
  if (link) $('#preview-enquiry-status').textContent = 'This is a design preview. Contact actions are shown for review only.';
});
listen(document, 'click', event => {
  const link = event.target instanceof Element ? event.target.closest('[data-interest]') : null;
  if (!link || !interest) return;
  const option = [...interest.options].find(item => item.value === link.dataset.interest);
  if (option) {
    interest.value = option.value;
    interest.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
if (form) {
  const fields = Object.fromEntries(['name', 'email', 'mobile', 'attraction', 'interest', 'message'].map(id => [id, $(`#${id}`, form)]));
  // Keep the HTML fallback disabled if the enquiry markup is incomplete.
  if (Object.values(fields).every(Boolean)) {
    listen(form, 'submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      $('#preview-enquiry-status').textContent = 'Preview complete. Your enquiry was not sent or stored.';
    });
    const submit = $('button[type="submit"]', form);
    if (submit) submit.disabled = false;
  }
}

let motionMedia = null;
let refreshFrame = 0;
let pageActive = true;
let heroPlayed = false;
const revealedRows = new WeakSet();

function iconTimeline(icon, gsap) {
  const timeline = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
  const kind = icon.dataset.iconMotion;
  const draw = $$('.icon-draw', icon);
  if (draw.length) timeline.fromTo(draw,
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, autoRound: false, duration: kind === 'governance' ? 0.95 : 0.75,
      stagger: 0.16, ease: 'power1.inOut', immediateRender: false }, kind === 'shared' ? 0.2 : 0);
  if (kind === 'certification') {
    timeline.fromTo(draw, { opacity: 0.4 }, { opacity: 1, duration: 0.5, immediateRender: false }, 0);
  }
  if (kind === 'delivery') {
    timeline.fromTo($('.icon-parcel', icon), { x: -5, y: -2 },
      { x: 0, y: 0, duration: 0.7, immediateRender: false }, 0);
    timeline.fromTo($('.icon-travel', icon), { x: -5, opacity: 0.2 },
      { x: 0, opacity: 1, duration: 0.6, immediateRender: false }, 0.25);
  }
  if (kind === 'shared') {
    timeline.fromTo($$('circle', icon), { scale: 0.6, opacity: 0.3, transformOrigin: '50% 50%' },
      { scale: 1, opacity: 1, duration: 0.4, stagger: 0.2, immediateRender: false }, 0);
  }
  if (kind === 'management') {
    timeline.fromTo($('.icon-shackle', icon), { y: -6 },
      { y: 0, duration: 0.7, immediateRender: false }, 0.15);
  }
  if (kind === 'conversation') {
    timeline.fromTo(draw, { y: 2, opacity: 0.2 },
      { y: 0, opacity: 1, duration: 0.45, stagger: 0.16, immediateRender: false }, 0.1);
  }
  return timeline;
}

function initContextIcons(gsap, ScrollTrigger) {
  const events = new AbortController();
  const timelines = [];
  $$('[data-icon-motion]').forEach(icon => {
    const surface = icon.closest('a, button') || icon.closest('article') || icon;
    const timeline = iconTimeline(icon, gsap);
    timelines.push(timeline);
    const play = () => {
      if (!document.hidden && !timeline.isActive()) timeline.restart();
    };
    const finish = () => timeline.progress(1).pause();
    // Replay on the whole related section, not just the small SVG target.
    surface.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') play();
    }, { signal: events.signal });
    surface.addEventListener('focusin', play, { signal: events.signal });
    ScrollTrigger.create({
      trigger: icon, start: 'top 80%', end: 'bottom 15%',
      onEnter: play, onEnterBack: play, onLeave: finish, onLeaveBack: finish,
    });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) timelines.forEach(timeline => timeline.progress(1).pause());
  }, { signal: events.signal });
  return () => events.abort();
}

function refreshMotion() {
  if (!pageActive || !motionMedia || refreshFrame) return;
  refreshFrame = requestAnimationFrame(() => {
    refreshFrame = 0;
    if (pageActive && motionMedia) window.ScrollTrigger?.refresh();
  });
}

function initMotion() {
  if (!pageActive || motionMedia || !window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  motionMedia = gsap.matchMedia();
  motionMedia.add('(prefers-reduced-motion: no-preference)', () => {
    if (!heroPlayed && window.scrollY < window.innerHeight * 0.5) {
      const heroText = $$('#hero-title, .hero-intro, .hero-actions');
      if (heroText.length) gsap.from(heroText, {
        y: 12, opacity: 0.8, duration: 0.75, stagger: 0.075,
        ease: 'power2.out', immediateRender: false,
      });
    }
    heroPlayed = true;
    $$('.specimen-row').forEach(row => {
      if (revealedRows.has(row)) return;
      // Never animate a gallery, a photograph, or an ancestor containing a photo.
      const text = [...row.children].filter(element => !element.matches('[data-gallery], img') && !element.querySelector('[data-gallery], img'));
      if (!text.length) return;
      if (row.getBoundingClientRect().bottom <= 0) {
        revealedRows.add(row);
        return;
      }
      gsap.from(text, {
        y: 10, opacity: 0.85, duration: 0.65, ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: row, start: 'top 88%', once: true,
          onEnter: () => revealedRows.add(row),
        },
      });
    });
    return initContextIcons(gsap, ScrollTrigger);
  });
  refreshMotion();
}

function disposeMotion() {
  cancelAnimationFrame(refreshFrame);
  refreshFrame = 0;
  motionMedia?.revert();
  motionMedia = null;
}

// Refresh after lazy photographs and font metrics finish changing the layout.
listen(document, 'load', event => {
  if (event.target instanceof HTMLImageElement) refreshMotion();
}, { capture: true });
document.fonts?.ready.then(refreshMotion);
if (document.readyState === 'complete') initMotion();
else listen(window, 'load', initMotion, { once: true });

listen(window, 'pagehide', event => {
  pageActive = false;
  closeMenu();
  closePhoto();
  hidePhotoCursor();
  disposeMotion();
  // Cached pages retain their UI listeners; a restored page gets fresh animations.
  if (!event.persisted) listeners.abort();
});
listen(window, 'pageshow', event => {
  if (!event.persisted) return;
  pageActive = true;
  initMotion();
  refreshMotion();
});
