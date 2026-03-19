/* ============================================
   NOVA — Space Chatbot App Logic
   ============================================ */

// ─── STARFIELD ────────────────────────────────
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

let stars = [];
let nebula = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initStars() {
  stars = Array.from({ length: 220 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.4 + 0.2,
    opacity: Math.random() * 0.7 + 0.1,
    speed: Math.random() * 0.015 + 0.002,
    twinkleOffset: Math.random() * Math.PI * 2,
  }));

  nebula = Array.from({ length: 4 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 280 + 120,
    hue: [200, 260, 180, 220][Math.floor(Math.random() * 4)],
    opacity: Math.random() * 0.045 + 0.01,
  }));
}

let frame = 0;
function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Nebula blobs
  nebula.forEach(n => {
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    g.addColorStop(0, `hsla(${n.hue}, 80%, 55%, ${n.opacity})`);
    g.addColorStop(1, `hsla(${n.hue}, 80%, 55%, 0)`);
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  });

  // Stars
  frame += 0.012;
  stars.forEach(s => {
    const twinkle = Math.sin(frame + s.twinkleOffset) * 0.3;
    const op = Math.max(0.05, s.opacity + twinkle);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220, 240, 255, ${op})`;
    ctx.fill();
  });

  requestAnimationFrame(drawStars);
}

window.addEventListener('resize', () => { resize(); initStars(); });
resize();
initStars();
drawStars();

// ─── STATE ────────────────────────────────────
const STORAGE_KEY = 'nova_api_key';
const HISTORY_KEY = 'nova_history';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_HISTORY = 20; // keep last 20 messages for context

let apiKey = localStorage.getItem(STORAGE_KEY) || '';
let conversationHistory = [];
let isLoading = false;

// ─── SYSTEM PROMPT ────────────────────────────
const SYSTEM_PROMPT = `You are NOVA (Neural Orbital Virtual Assistant), an expert AI guide specializing exclusively in space exploration, astronomy, astrophysics, NASA history, and the cosmos.

Your personality:
- Deeply knowledgeable, passionate, and precise about all things space
- Occasionally uses poetic language to convey the wonder of the universe
- Speaks with the authority of a mission specialist but the enthusiasm of a stargazer
- Uses mission codenames, NASA jargon, and astronomical terminology naturally
- Grounded in real science — you never invent facts or speculate without noting it

Your knowledge covers:
- All NASA missions (Mercury, Gemini, Apollo, Space Shuttle, ISS, Artemis, etc.)
- Space agencies worldwide: ESA, ISRO, Roscosmos, JAXA, CNSA, SpaceX, Blue Origin
- Planets, moons, asteroids, comets, nebulae, galaxies, black holes, neutron stars
- Telescopes: Hubble, James Webb, Chandra, Spitzer, and ground-based observatories
- Astronauts and cosmonauts — their missions, records, and stories
- Space physics: orbital mechanics, rocket propulsion, gravity, relativity
- Current and upcoming missions as of early 2025
- Space history, disasters (Challenger, Columbia), and lessons learned
- The search for extraterrestrial life and astrobiology
- Space colonization plans: Moon Gateway, Mars missions, SpaceX Starship

Formatting rules:
- Use **bold** for mission names, spacecraft names, and key terms
- Use line breaks between paragraphs for readability  
- For lists, use simple dash bullets
- When citing a specific data point (distance, date, speed), be precise
- Keep answers focused and engaging — not textbook dry, but not dumbed down either
- If asked about something outside space/astronomy, gently redirect: "That's outside my orbital trajectory — I'm specialized in space and astronomy. Ask me anything about the cosmos!"

Begin every first response in a conversation with a brief, enthusiastic acknowledgment before answering.`;

// ─── DOM REFS ────────────────────────────────
const landingScreen = document.getElementById('landing');
const chatScreen = document.getElementById('chat-screen');
const messagesEl = document.getElementById('messages');
const emptyState = document.getElementById('empty-state');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const keyModal = document.getElementById('key-modal');
const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');
const modalError = document.getElementById('modal-error');
const launchBtn = document.getElementById('launch-btn');
const backBtn = document.getElementById('back-btn');
const clearBtn = document.getElementById('clear-btn');

// ─── SCREEN TRANSITIONS ───────────────────────
function showChat() {
  landingScreen.classList.remove('active');
  chatScreen.style.display = 'flex';
  setTimeout(() => { chatScreen.style.opacity = '1'; }, 10);
  chatScreen.classList.add('active');
  userInput.focus();
}

function showLanding() {
  chatScreen.classList.remove('active');
  chatScreen.style.opacity = '0';
  setTimeout(() => {
    chatScreen.style.display = 'none';
    landingScreen.classList.add('active');
  }, 300);
}

launchBtn.addEventListener('click', () => {
  if (!apiKey) {
    keyModal.classList.add('visible');
    apiKeyInput.focus();
  } else {
    showChat();
  }
});

backBtn.addEventListener('click', showLanding);

// Starter pills on landing page
document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    const q = pill.dataset.q;
    if (!apiKey) {
      keyModal.classList.add('visible');
      apiKeyInput.dataset.pendingQ = q;
      apiKeyInput.focus();
    } else {
      showChat();
      setTimeout(() => sendMessage(q), 100);
    }
  });
});

// Suggestion cards in empty state
document.querySelectorAll('.suggestion-card').forEach(card => {
  card.addEventListener('click', () => {
    sendMessage(card.dataset.q);
  });
});

// ─── API KEY MODAL ────────────────────────────
saveKeyBtn.addEventListener('click', handleSaveKey);
apiKeyInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSaveKey();
});

function handleSaveKey() {
  const val = apiKeyInput.value.trim();
  if (!val.startsWith('sk-ant-')) {
    modalError.textContent = 'Invalid key format. Must start with sk-ant-…';
    return;
  }
  apiKey = val;
  localStorage.setItem(STORAGE_KEY, apiKey);
  keyModal.classList.remove('visible');
  modalError.textContent = '';

  const pendingQ = apiKeyInput.dataset.pendingQ;
  showChat();
  if (pendingQ) {
    delete apiKeyInput.dataset.pendingQ;
    setTimeout(() => sendMessage(pendingQ), 150);
  }
}

// ─── INPUT AUTO-RESIZE ────────────────────────
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 160) + 'px';
  sendBtn.disabled = !userInput.value.trim() || isLoading;
});

userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) handleSend();
  }
});

sendBtn.addEventListener('click', handleSend);

function handleSend() {
  const text = userInput.value.trim();
  if (!text || isLoading) return;
  sendMessage(text);
  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;
}

// ─── CLEAR CONVERSATION ───────────────────────
clearBtn.addEventListener('click', () => {
  conversationHistory = [];
  // Remove all messages except empty state
  const msgs = messagesEl.querySelectorAll('.message, .error-msg');
  msgs.forEach(m => m.remove());
  emptyState.style.display = 'flex';
});

// ─── SEND MESSAGE ─────────────────────────────
async function sendMessage(text) {
  if (!text.trim() || isLoading) return;

  // Hide empty state
  emptyState.style.display = 'none';

  // Add user message to UI
  appendMessage('user', text);

  // Add to history
  conversationHistory.push({ role: 'user', content: text });

  // Show typing indicator
  const typingEl = appendTyping();
  isLoading = true;
  sendBtn.disabled = true;

  try {
    const response = await callClaude(conversationHistory);

    // Remove typing indicator
    typingEl.remove();

    // Add assistant message
    appendMessage('bot', response);
    conversationHistory.push({ role: 'assistant', content: response });

    // Trim history to avoid token bloat
    if (conversationHistory.length > MAX_HISTORY) {
      conversationHistory = conversationHistory.slice(-MAX_HISTORY);
    }

  } catch (err) {
    typingEl.remove();
    appendError(err.message);
  }

  isLoading = false;
  sendBtn.disabled = !userInput.value.trim();
  scrollToBottom();
}

// ─── API CALL ─────────────────────────────────
async function callClaude(messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || '';

    if (res.status === 401) throw new Error('Invalid API key. Click the 🔑 icon to update it.');
    if (res.status === 429) throw new Error('Rate limit hit. Please wait a moment and try again.');
    if (res.status === 529) throw new Error('Claude is overloaded right now. Try again in a few seconds.');
    throw new Error(`API error (${res.status})${msg ? ': ' + msg : ''}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || 'No response received.';
}

// ─── DOM HELPERS ─────────────────────────────
function appendMessage(role, text) {
  const isBot = role === 'bot';
  const div = document.createElement('div');
  div.className = `message ${isBot ? 'bot' : 'user'}`;

  const avatar = document.createElement('div');
  avatar.className = `avatar ${isBot ? 'bot' : 'user-av'}`;
  avatar.textContent = isBot ? 'N' : '👤';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = formatText(text);

  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = getTime();

  const col = document.createElement('div');
  col.style.cssText = 'display:flex;flex-direction:column;gap:4px;max-width:calc(100% - 50px)';
  col.appendChild(bubble);
  col.appendChild(time);

  div.appendChild(avatar);
  div.appendChild(col);
  messagesEl.appendChild(div);
  scrollToBottom();
  return div;
}

function appendTyping() {
  const div = document.createElement('div');
  div.className = 'message bot';

  const avatar = document.createElement('div');
  avatar.className = 'avatar bot';
  avatar.textContent = 'N';

  const bubble = document.createElement('div');
  bubble.className = 'bubble typing-indicator';
  bubble.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

  div.appendChild(avatar);
  div.appendChild(bubble);
  messagesEl.appendChild(div);
  scrollToBottom();
  return div;
}

function appendError(message) {
  const div = document.createElement('div');
  div.className = 'error-msg';
  div.innerHTML = `<span class="error-icon">⚠️</span><span>${escapeHtml(message)}</span>`;
  messagesEl.appendChild(div);
  scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── TEXT FORMATTER ───────────────────────────
// Converts markdown-like text → HTML
function formatText(text) {
  let html = escapeHtml(text);

  // Headers: ### text
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* or _text_
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  // Inline code: `text`
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Bullet lists
  html = html.replace(/^[-•] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/gs, match => `<ul>${match}</ul>`);

  // Numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Paragraphs: double newline → <p>
  const lines = html.split(/\n{2,}/);
  html = lines.map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('<h3>') || block.startsWith('<ul>') || block.startsWith('<ol>')) return block;
    // single newlines within a block → <br>
    return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  return html;
}

// ─── KEYBOARD SHORTCUT ────────────────────────
document.addEventListener('keydown', e => {
  // Cmd/Ctrl + K to focus input
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if (chatScreen.classList.contains('active')) userInput.focus();
  }
});
