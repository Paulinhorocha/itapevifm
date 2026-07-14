// ══════════════════════════════════════════
//  SUPABASE CONFIG
//  IMPORTANTE: Substitua com a URL e a anon key do seu projeto
//  (Supabase → Project Settings → API)
// ══════════════════════════════════════════
const SUPABASE_URL = 'https://hfswzuptkerizyrrrlgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmc3d6dXB0a2VyaXp5cnJybGduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODY0MjQsImV4cCI6MjA5OTM2MjQyNH0.ZGs2G8tNt7qLROrKJPxqgzw2GDh3BbRm5BXbg1LeSxc';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ══════════════════════════════════════════
//  SEGURANÇA — Sanitização de inputs
// ══════════════════════════════════════════
function sanitize(str) {
  if (typeof str !== 'string') return String(str || '');
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ══════════════════════════════════════════
//  DADOS — Sincronizados via Supabase
// ══════════════════════════════════════════
const EQUIPE = [];
let programas = [];

const DIAS_SEMANA = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const DIAS_FULL   = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
const DAYS_SHORT  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const TIME_SLOTS = [
  '06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30',
  '10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30',
  '18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','22:00'
];

const PROG_COLORS = [
  'rgba(192,57,43,0.2)',
  'rgba(142,68,173,0.2)',
  'rgba(41,128,185,0.2)',
  'rgba(39,174,96,0.2)',
  'rgba(243,156,18,0.2)',
  'rgba(231,76,60,0.2)',
  'rgba(155,89,182,0.2)',
  'rgba(26,188,156,0.2)',
  'rgba(241,196,15,0.2)',
  'rgba(52,152,219,0.2)',
];

// ══════════════════════════════════════════
//  TABS
// ══════════════════════════════════════════
function openTab(e, id) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  e.currentTarget.classList.add('active');
}
function openTabByName(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('tab-' + name);
  if (panel) panel.classList.add('active');
  const btn = document.querySelector('.tab-btn[data-tab="'+name+'"]');
  if (btn) btn.classList.add('active');
  
  if (name === 'programacao') {
    mostrarDia(diaSelecionado);
  }
}

// ══════════════════════════════════════════
//  PLAYER
// ══════════════════════════════════════════
const audio = document.getElementById('radioAudio');
let playing = false;
let userWantsPlay = false;
let STREAM_URL = 'https://casthttps1.suaradionanet.net/10076/stream'; // fallback caso o Supabase ainda não tenha respondido

let reconnectTimer = null;
let watchdogInterval = null;
let lastCurrentTime = -1;
let stalledChecks = 0;
let reconnectAttempts = 0;

// A URL do stream agora é lida do Supabase (tabela config, chave streamUrl),
// gerenciada apenas pelo dashboard administrativo — não é mais editável no site público.
async function loadStreamUrl() {
  const { data } = await supabaseClient.from('config').select('value').eq('key', 'streamUrl').maybeSingle();
  if (data && data.value) {
    const changed = data.value !== STREAM_URL;
    STREAM_URL = data.value;
    if (changed && playing) { stopPlay(); setTimeout(startPlay, 200); }
  }
}
loadStreamUrl();
supabaseClient.channel('config-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'config' }, loadStreamUrl)
  .subscribe();

// Adiciona um parâmetro único a cada tentativa para evitar que o navegador
// reaproveite uma conexão antiga/travada com o servidor de stream (cache).
function buildStreamUrl() {
  if (!STREAM_URL) return STREAM_URL;
  const sep = STREAM_URL.includes('?') ? '&' : '?';
  return STREAM_URL + sep + '_cb=' + Date.now();
}

function startPlay() {
  if (!STREAM_URL) { alert('Configure a URL do stream primeiro (botão ⚙ Stream)'); return; }
  userWantsPlay = true;
  clearTimeout(reconnectTimer);

  const st = document.getElementById('playerStatus');
  st.textContent = 'Carregando…'; st.className = 'player-status buffering';

  audio.pause();
  audio.src = buildStreamUrl();
  audio.load();
  audio.volume = document.getElementById('volSlider').value / 100;

  audio.play().then(() => {
    playing = true;
    reconnectAttempts = 0;
    stalledChecks = 0;
    lastCurrentTime = -1;
    document.getElementById('playBtn').textContent = '⏸';
    document.getElementById('eqBars').classList.remove('paused');
    st.textContent = '● Ao vivo'; st.className = 'player-status live';
    setupMediaSession();
    startWatchdog();
  }).catch(() => {
    st.textContent = 'Erro'; st.className = 'player-status error';
    playing = false;
    scheduleReconnect();
  });
}

function stopPlay() {
  userWantsPlay = false;
  clearTimeout(reconnectTimer);
  stopWatchdog();
  audio.pause(); audio.src = '';
  playing = false;
  document.getElementById('playBtn').textContent = '▶';
  document.getElementById('eqBars').classList.add('paused');
  const st = document.getElementById('playerStatus');
  st.textContent = 'Pausado'; st.className = 'player-status';
}
function togglePlay() { playing ? stopPlay() : startPlay(); }
function setVolume(v) { audio.volume = v / 100; }

// Tenta reconectar automaticamente quando o stream cai ou trava,
// sem precisar que o ouvinte limpe o cache ou recarregue a página.
function scheduleReconnect() {
  if (!userWantsPlay) return;
  clearTimeout(reconnectTimer);
  stopWatchdog();

  reconnectAttempts++;
  const delay = Math.min(3000 + reconnectAttempts * 2000, 15000);

  const st = document.getElementById('playerStatus');
  st.textContent = 'Reconectando…'; st.className = 'player-status buffering';

  reconnectTimer = setTimeout(() => {
    if (userWantsPlay) startPlay();
  }, delay);
}

// Watchdog: alguns navegadores travam o stream sem disparar nenhum
// evento de erro. Aqui verificamos a cada 5s se o áudio realmente
// está avançando; se não estiver, forçamos a reconexão.
function startWatchdog() {
  stopWatchdog();
  watchdogInterval = setInterval(() => {
    if (!userWantsPlay) { stopWatchdog(); return; }

    if (audio.paused || audio.ended) {
      stalledChecks++;
    } else if (audio.currentTime === lastCurrentTime) {
      stalledChecks++;
    } else {
      stalledChecks = 0;
      lastCurrentTime = audio.currentTime;
    }

    if (stalledChecks >= 2) {
      stalledChecks = 0;
      playing = false;
      scheduleReconnect();
    }
  }, 5000);
}

function stopWatchdog() {
  if (watchdogInterval) { clearInterval(watchdogInterval); watchdogInterval = null; }
}

audio.addEventListener('error', () => {
  const st = document.getElementById('playerStatus');
  st.textContent = 'Indisponível'; st.className = 'player-status error';
  playing = false;
  document.getElementById('playBtn').textContent = '▶';
  document.getElementById('eqBars').classList.add('paused');
  stopWatchdog();
  scheduleReconnect();
});

// Quando o usuário volta para a aba/app, confere se o áudio ainda está
// realmente tocando — se não estiver, reconecta na hora.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && userWantsPlay && (audio.paused || audio.ended)) {
    startPlay();
  }
});
function setupMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const cur = getCurrentOnAir();
  navigator.mediaSession.metadata = new MediaMetadata({
    title: cur ? cur.prog : 'Itapevi FM 87.9',
    artist: cur ? cur.apres : 'Ao Vivo',
    album: 'Itapevi FM 87.9',
    artwork: [{ src: 'logo.jpg', sizes:'512x512', type:'image/jpeg' }]
  });
  navigator.mediaSession.setActionHandler('play', startPlay);
  navigator.mediaSession.setActionHandler('pause', stopPlay);
  navigator.mediaSession.setActionHandler('stop', stopPlay);
}

// ══════════════════════════════════════════
//  DETECÇÃO DO PROGRAMA NO AR
// ══════════════════════════════════════════
function timeToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getCurrentOnAir() {
  const now = new Date();
  const dayIdx = now.getDay();
  const dayName = DAYS_SHORT[dayIdx];
  const curMin = now.getHours() * 60 + now.getMinutes();

  return programas.find(p => {
    if (!p.dias.includes(dayName)) return false;
    const start = timeToMin(p.das);
    let end = timeToMin(p.ate);
    if (end === 0) end = 1440;
    return curMin >= start && curMin < end;
  }) || null;
}

function updateOnAirUI() {
  const cur = getCurrentOnAir();

  let loc = null;
  if (cur) {
    loc = EQUIPE.find(m =>
      m.nome.toLowerCase() === cur.apres.toLowerCase() ||
      cur.apres.toLowerCase().includes(m.nome.toLowerCase())
    ) || null;
  }

  const tbAvatar = document.getElementById('topbarAvatar');
  tbAvatar.innerHTML = '';
  if (loc && loc.foto) {
    const img = document.createElement('img');
    img.src = loc.foto;
    img.alt = loc.nome;
    tbAvatar.appendChild(img);
    tbAvatar.style.background = 'none';
  } else if (loc) {
    tbAvatar.textContent = loc.iniciais;
    tbAvatar.style.background = loc.cor;
  } else {
    tbAvatar.textContent = '🎵';
    tbAvatar.style.background = 'linear-gradient(135deg,var(--accent),var(--purple))';
  }
  document.getElementById('topbarProg').textContent    = cur ? cur.prog  : 'Itapevi FM no Ar';
  document.getElementById('topbarLocutor').textContent = cur ? cur.apres : 'Programação automática';
}

// ══════════════════════════════════════════
//  EQUIPE — render
// ══════════════════════════════════════════
function renderEquipe() {
  const grid = document.getElementById('equipeGrid');
  grid.innerHTML = '';
  EQUIPE.forEach((m, idx) => {
    const card = document.createElement('div');
    card.className = 'equipe-card';
    card.id = 'equipe-card-' + m.id;
    
    const photoDiv = document.createElement('div');
    photoDiv.className = 'equipe-photo';
    
    const placeholder = document.createElement('div');
    placeholder.className = 'equipe-photo-placeholder';
    placeholder.style.background = m.cor;
    
    if (m.foto) {
      const img = document.createElement('img');
      img.src = m.foto;
      img.alt = m.nome;
      placeholder.appendChild(img);
    } else {
      placeholder.textContent = m.iniciais;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'photo-overlay';
    
    const badge = document.createElement('span');
    badge.className = 'onair-badge-card';
    badge.innerHTML = '<span class="live-dot" style="width:5px;height:5px"></span> No ar';
    
    photoDiv.appendChild(placeholder);
    photoDiv.appendChild(overlay);
    photoDiv.appendChild(badge);
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'equipe-info';
    
    const nomeDiv = document.createElement('div');
    nomeDiv.className = 'equipe-nome';
    nomeDiv.textContent = m.nome;
    
    const funcaoArea = document.createElement('div');
    funcaoArea.className = 'equipe-funcao';
    funcaoArea.textContent = m.funcao || '—';
    
    infoDiv.appendChild(nomeDiv);
    infoDiv.appendChild(funcaoArea);
    
    card.appendChild(photoDiv);
    card.appendChild(infoDiv);
    grid.appendChild(card);
  });
}

// ══════════════════════════════════════════
//  PROGRAMAÇÃO POR DIA
// ══════════════════════════════════════════
let diaSelecionado = 'Seg';

function mostrarDia(dia) {
  diaSelecionado = dia;
  
  document.querySelectorAll('.dia-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.dia === dia) {
      btn.classList.add('active');
    }
  });
  
  const progsDoDia = programas.filter(p => p.dias.includes(dia));
  progsDoDia.sort((a, b) => timeToMin(a.das) - timeToMin(b.das));
  
  const lista = document.getElementById('progDiaLista');
  lista.innerHTML = '';
  
  if (progsDoDia.length === 0) {
    lista.innerHTML = '<div class="prog-dia-vazio">Nenhum programa cadastrado para este dia.</div>';
    return;
  }
  
  const cur = getCurrentOnAir();
  
  progsDoDia.forEach((prog, idx) => {
    const card = document.createElement('div');
    card.className = 'prog-card';
    
    const isLive = cur && cur.prog === prog.prog && cur.das === prog.das;
    if (isLive) {
      card.classList.add('is-live');
    }
    
    const progIdx = programas.indexOf(prog);
    const cor = PROG_COLORS[progIdx % PROG_COLORS.length];
    
    const colorBar = document.createElement('div');
    colorBar.className = 'prog-card-color';
    colorBar.style.background = cor.replace('0.2', '0.8');
    
    const content = document.createElement('div');
    content.className = 'prog-card-content';
    
    const time = document.createElement('div');
    time.className = 'prog-card-time';
    time.textContent = prog.das + ' — ' + prog.ate;
    
    const name = document.createElement('div');
    name.className = 'prog-card-name';
    name.textContent = prog.prog;
    
    const apres = document.createElement('div');
    apres.className = 'prog-card-apres';
    apres.textContent = prog.apres;
    
    content.appendChild(time);
    content.appendChild(name);
    content.appendChild(apres);
    
    const liveBadge = document.createElement('div');
    liveBadge.className = 'prog-card-live-badge';
    liveBadge.innerHTML = '<span class="live-dot" style="width:5px;height:5px;"></span> No ar';
    
    card.appendChild(colorBar);
    card.appendChild(content);
    card.appendChild(liveBadge);
    
    lista.appendChild(card);
  });
}

// ══════════════════════════════════════════
//  SUPABASE SYNC — Carregar dados em tempo real
// ══════════════════════════════════════════
function loadFromSupabase() {
  async function carregarEquipe() {
    const { data } = await supabaseClient.from('equipe').select('*');
    EQUIPE.length = 0;
    if (data) EQUIPE.push(...data);
    renderEquipe();
    updateOnAirUI();
  }
  async function carregarProgramas() {
    const { data } = await supabaseClient.from('programas').select('*');
    programas = data || [];
    mostrarDia(diaSelecionado);
    updateOnAirUI();
  }

  carregarEquipe();
  carregarProgramas();

  supabaseClient.channel('equipe-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'equipe' }, carregarEquipe)
    .subscribe();
  supabaseClient.channel('programas-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'programas' }, carregarProgramas)
    .subscribe();
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
console.log('Iniciando Itapevi FM com Supabase...');

// Carregar dados do Supabase
loadFromSupabase();

// Detectar dia atual
const todayIdx = new Date().getDay();
const todayDia = DAYS_SHORT[todayIdx];
if (DIAS_SEMANA.includes(todayDia)) {
  mostrarDia(todayDia);
  document.querySelectorAll('.dia-btn').forEach(btn => {
    if (btn.dataset.dia === todayDia) {
      btn.classList.add('today');
    }
  });
} else {
  mostrarDia('Seg');
}

setInterval(() => { 
  updateOnAirUI(); 
  mostrarDia(diaSelecionado);
  if (playing) setupMediaSession(); 
}, 60000);
