import './admin.css';

const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const appError = document.getElementById('app-error');
const appNotice = document.getElementById('app-notice');
const pageTitle = document.getElementById('page-title');
const notificationStatus = document.getElementById('notification-status');
let audioContext;
let notificationCursor;
let activeView = 'dashboard';
const pages = { quotes: 1, messages: 1 };
const viewTitles = { dashboard: 'Dashboard', quotes: 'Quote Requests', messages: 'Support / Messages' };

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'The request could not be completed.');
  return payload;
}

function showError(message) {
  appError.textContent = message;
  appError.hidden = false;
}

function clearError() {
  appError.hidden = true;
  appError.textContent = '';
}

function showLoginError(message) {
  loginError.textContent = message;
  loginError.hidden = false;
}

function createAudioContext() {
  if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
    const Context = window.AudioContext || window.webkitAudioContext;
    audioContext = new Context();
  }
  if (audioContext?.state === 'suspended') void audioContext.resume();
}

function playAlert() {
  if (!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  [880, 1175].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + index * 0.16);
    gain.gain.exponentialRampToValueAtTime(0.18, now + index * 0.16 + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.16 + 0.22);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now + index * 0.16);
    oscillator.stop(now + index * 0.16 + 0.23);
  });
}

async function requestNotifications() {
  if (!('Notification' in window)) {
    notificationStatus.textContent = 'Browser notifications unavailable';
    document.getElementById('enable-notifications').hidden = true;
    return;
  }
  try {
    const permission = await Notification.requestPermission();
    notificationStatus.textContent = permission === 'granted'
      ? 'Notifications enabled'
      : permission === 'denied'
        ? 'Notifications blocked — allow in browser settings'
        : 'Notifications are not enabled';
    document.getElementById('enable-notifications').hidden = permission === 'granted';
  } catch (error) {
    notificationStatus.textContent = `Unable to enable notifications: ${error.message}`;
    document.getElementById('enable-notifications').hidden = false;
  }
}

function formatDate(value) {
  if (!value) return 'Date not provided';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date not provided'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function humanize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function addField(container, label, value) {
  if (value === '' || value === null || value === undefined) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'record-field';
  const name = document.createElement('span');
  name.className = 'field-label';
  name.textContent = label;
  const content = document.createElement('span');
  content.className = 'field-value';
  content.textContent = String(value);
  wrapper.append(name, content);
  container.append(wrapper);
}

function createRecordCard(record, type) {
  const card = document.createElement('article');
  card.className = 'record-card';
  const heading = document.createElement('div');
  heading.className = 'record-heading';
  const identity = document.createElement('div');
  const name = document.createElement('h3');
  name.textContent = record.full_name || record.fullName || 'Customer';
  const email = document.createElement('a');
  email.className = 'record-email';
  email.href = `mailto:${encodeURIComponent(record.email || '')}`;
  email.textContent = record.email || '';
  const badge = document.createElement('span');
  badge.className = `record-badge ${type}`;
  badge.textContent = type === 'quote' ? 'Quote request' : 'Support message';
  identity.append(name, email);
  heading.append(identity, badge);
  card.append(heading);

  const fields = document.createElement('div');
  fields.className = 'record-fields';
  Object.entries(record).forEach(([key, value]) => {
    if (['_id', '__v', '_recordType', 'createdAt', 'updatedAt', 'email', 'full_name', 'fullName'].includes(key)) return;
    addField(fields, humanize(key), value);
  });
  addField(fields, 'Received', formatDate(record.createdAt));
  card.append(fields);
  return card;
}

function renderRecords(container, records, type) {
  container.replaceChildren();
  if (!records.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Nothing here yet. New submissions will appear automatically.';
    container.append(empty);
    return;
  }
  records.forEach((record) => container.append(createRecordCard(record, record._recordType || type)));
}

async function loadSummary() {
  const data = await api('/api/admin/summary');
  document.getElementById('quote-count').textContent = data.quotes;
  document.getElementById('message-count').textContent = data.messages;
  const recent = [
    ...data.latestQuotes.map((item) => ({ ...item, fullName: item.full_name, _recordType: 'quote' })),
    ...data.latestMessages.map((item) => ({ ...item, _recordType: 'message' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  renderRecords(document.getElementById('recent-list'), recent, 'message');
}

async function loadRecords(type) {
  const data = await api(`/api/admin/${type}?page=${pages[type]}&limit=20`);
  renderRecords(document.getElementById(`${type}-list`), data.items, type === 'quotes' ? 'quote' : 'message');
  document.getElementById(`${type}-total`).textContent = `${data.total} total`;
  document.getElementById(`${type}-page`).textContent = `Page ${data.page} of ${data.pages}`;
  document.getElementById(`${type}-prev`).disabled = data.page <= 1;
  document.getElementById(`${type}-next`).disabled = data.page >= data.pages;
}

async function loadView(view) {
  activeView = view;
  clearError();
  pageTitle.textContent = viewTitles[view];
  document.querySelectorAll('.view-panel').forEach((panel) => { panel.hidden = panel.id !== `${view}-view`; });
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });
  try {
    if (view === 'dashboard') await loadSummary();
    if (view === 'quotes' || view === 'messages') await loadRecords(view);
  } catch (error) {
    showError(error.message);
    if (error.message.includes('sign in')) signOut();
  }
}

async function pollNotifications() {
  try {
    const query = new URLSearchParams({ after: notificationCursor });
    const data = await api(`/api/admin/notifications?${query}`);
    notificationCursor = data.checkedAt;
    if (!data.items.length) return;
    playAlert();
    data.items.forEach((item) => {
      const label = item.type === 'quote' ? 'New quote request' : 'New support message';
      appNotice.textContent = `${label} from ${item.name || 'a customer'}`;
      appNotice.hidden = false;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(label, { body: `From ${item.name || 'a customer'}` });
      }
    });
    if (activeView === 'dashboard') await loadSummary();
    if (activeView === 'quotes' && data.items.some((item) => item.type === 'quote')) await loadRecords('quotes');
    if (activeView === 'messages' && data.items.some((item) => item.type === 'message')) await loadRecords('messages');
  } catch (error) {
    showError(error.message);
  }
}

async function enterAdmin(email, serverNow) {
  loginView.hidden = true;
  appView.hidden = false;
  document.getElementById('admin-email').textContent = email;
  notificationCursor = serverNow || new Date().toISOString();
  await requestNotifications();
  await loadView('dashboard');
  window.setInterval(pollNotifications, 10000);
}

async function signOut() {
  try {
    await api('/api/admin/logout', { method: 'POST' });
  } finally {
    window.location.reload();
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.hidden = true;
  createAudioContext();
  const formData = new FormData(loginForm);
  const submit = loginForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = 'Signing in…';
  try {
    const result = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });
    await enterAdmin(result.email, result.now);
  } catch (error) {
    showLoginError(error.message);
  } finally {
    submit.disabled = false;
    submit.textContent = 'Sign in';
  }
});

document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => { void loadView(button.dataset.view); });
});

document.getElementById('logout-button').addEventListener('click', () => { void signOut(); });
document.getElementById('enable-notifications').addEventListener('click', () => { void requestNotifications(); });

['quotes', 'messages'].forEach((type) => {
  document.getElementById(`${type}-prev`).addEventListener('click', () => {
    pages[type] -= 1;
    void loadRecords(type).catch((error) => showError(error.message));
  });
  document.getElementById(`${type}-next`).addEventListener('click', () => {
    pages[type] += 1;
    void loadRecords(type).catch((error) => showError(error.message));
  });
});

document.addEventListener('pointerdown', createAudioContext, { once: true });

api('/api/admin/session')
  .then((session) => enterAdmin(session.email, session.now))
  .catch((error) => {
    if (!error.message.includes('sign in')) showLoginError(error.message);
  });
