// Estado da Aplicação
let videosData = [];
let favorites = JSON.parse(localStorage.getItem('mai_sclass_favs')) || [];
let currentTab = 'todos';
let currentCategory = 'all';
let searchQuery = '';
let currentVideoPlaying = null;

// Inicialização assim que a página carrega
document.addEventListener('DOMContentLoaded', () => {
  fetchVideosData();
  setupEventListeners();
  updateFavBadge();
});

// Busca os dados do arquivo data.json
async function fetchVideosData() {
  try {
    const response = await fetch('data.json');
    videosData = await response.json();
    renderVideos();
  } catch (error) {
    console.error('Erro ao ler o arquivo data.json:', error);
  }
}

// Configurações de eventos de clique e busca
function setupEventListeners() {
  // Troca de Abas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      currentTab = target.dataset.tab;
      handleTabChange();
    });
  });

  // Filtro de Categorias
  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.dataset.category;
      renderVideos();
    });
  });

  // Campo de Busca
  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderVideos();
  });

  // Fechar e abrir modais
  document.getElementById('closeModalBtn').addEventListener('click', closeVideoModal);
  document.getElementById('openApkModal').addEventListener('click', () => {
    document.getElementById('apkModal').classList.remove('hidden');
  });
  document.getElementById('closeApkModalBtn').addEventListener('click', () => {
    document.getElementById('apkModal').classList.add('hidden');
  });

  // Botão de Favorito no Modal
  document.getElementById('modalFavBtn').addEventListener('click', () => {
    if (currentVideoPlaying) {
      toggleFavorite(currentVideoPlaying.id);
      updateModalFavState(currentVideoPlaying.id);
    }
  });
}

// Controle de exibição por abas
function handleTabChange() {
  const categoriesBar = document.getElementById('categoriesBar');
  const videoGrid = document.getElementById('videoGrid');
  const suporteSection = document.getElementById('suporteSection');
  const sectionTitle = document.getElementById('sectionTitle');

  if (currentTab === 'suporte') {
    categoriesBar.classList.add('hidden');
    videoGrid.classList.add('hidden');
    suporteSection.classList.remove('hidden');
    sectionTitle.innerHTML = `<i class="fa-solid fa-headset text-gold"></i> Suporte & Mensagens`;
  } else {
    categoriesBar.classList.remove('hidden');
    videoGrid.classList.remove('hidden');
    suporteSection.classList.add('hidden');

    if (currentTab === 'todos') {
      sectionTitle.innerHTML = `<i class="fa-solid fa-heart text-gold"></i> Todos os Vídeos Fofos`;
    } else if (currentTab === 'lancamentos') {
      sectionTitle.innerHTML = `<i class="fa-solid fa-sparkles text-gold"></i> Últimos Lançados`;
    } else if (currentTab === 'favoritos') {
      sectionTitle.innerHTML = `<i class="fa-solid fa-star text-gold"></i> Meus Favoritos`;
    }

    renderVideos();
  }
}

// Renderiza os cards de vídeos no grid
function renderVideos() {
  const grid = document.getElementById('videoGrid');
  grid.innerHTML = '';

  let filtered = videosData.filter(v => {
    if (currentTab === 'lancamentos' && !v.isRelease) return false;
    if (currentTab === 'favoritos' && !favorites.includes(v.id)) return false;
    if (currentCategory !== 'all' && v.category !== currentCategory) return false;
    if (searchQuery && !v.title.toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px 0; color: var(--text-muted);">
        <i class="fa-solid fa-video-slash" style="font-size: 3rem; margin-bottom: 10px;"></i>
        <p>Nenhum vídeo encontrado nesta categoria.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(video => {
    const isFav = favorites.includes(video.id);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="thumb-wrapper" onclick="openVideoModal(${video.id})">
        <img src="${video.thumbnail}" alt="${video.title}" loading="lazy" />
        <div class="play-overlay">
          <div class="play-icon"><i class="fa-solid fa-play"></i></div>
        </div>
        ${video.isRelease ? `<span class="card-badge new">NOVO</span>` : `<span class="card-badge">${video.quality}</span>`}
        <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavFromCard(${video.id})">
          <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>
      </div>
      <div class="card-info" onclick="openVideoModal(${video.id})">
        <div class="card-title">${video.title}</div>
        <div class="card-meta">
          <span>${video.category}</span>
          <span><i class="fa-solid fa-star text-gold"></i> ${video.rating}</span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Sistema de Favoritos no LocalStorage
function toggleFavorite(id) {
  const index = favorites.indexOf(id);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(id);
  }
  localStorage.setItem('mai_sclass_favs', JSON.stringify(favorites));
  updateFavBadge();
  renderVideos();
}

function toggleFavFromCard(id) {
  toggleFavorite(id);
}

function updateFavBadge() {
  document.getElementById('favCountBadge').innerText = favorites.length;
}

// Player Modal com Suporte para Vídeo MP4 Directo e Iframe
function openVideoModal(id) {
  const video = videosData.find(v => v.id === id);
  if (!video) return;

  currentVideoPlaying = video;

  document.getElementById('modalTitle').innerText = video.title;
  document.getElementById('modalQuality').innerText = video.quality;
  document.getElementById('modalCategory').innerText = video.category;
  document.getElementById('modalYear').innerText = video.year;
  document.getElementById('modalDesc').innerText = video.description;

  const videoPlayer = document.getElementById('modalVideoPlayer');
  const videoSource = document.getElementById('modalVideoSource');
  const iframePlayer = document.getElementById('modalIframe');

  // Verifica se o link é MP4 direto
  const isMp4 = video.videoUrl.endsWith('.mp4') || video.videoUrl.includes('.mp4?');

  if (isMp4) {
    iframePlayer.classList.add('hidden');
    iframePlayer.src = '';

    videoSource.src = video.videoUrl;
    videoPlayer.load();
    videoPlayer.classList.remove('hidden');
    videoPlayer.play().catch(() => console.log('Autoplay bloqueado pelo navegador'));
  } else {
    videoPlayer.pause();
    videoPlayer.classList.add('hidden');

    iframePlayer.src = video.videoUrl;
    iframePlayer.classList.remove('hidden');
  }

  updateModalFavState(video.id);

  // Renderiza partes / episódios
  const epGrid = document.getElementById('episodesGrid');
  const epSection = document.getElementById('episodesSection');
  epGrid.innerHTML = '';

  if (video.episodes && video.episodes.length > 0) {
    epSection.classList.remove('hidden');
    video.episodes.forEach((ep, index) => {
      const btn = document.createElement('button');
      btn.className = `ep-btn ${index === 0 ? 'active' : ''}`;
      btn.innerText = ep.title;
      btn.onclick = () => {
        document.querySelectorAll('.ep-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (ep.videoUrl.endsWith('.mp4') || ep.videoUrl.includes('.mp4?')) {
          iframePlayer.classList.add('hidden');
          iframePlayer.src = '';
          videoSource.src = ep.videoUrl;
          videoPlayer.load();
          videoPlayer.classList.remove('hidden');
          videoPlayer.play();
        } else {
          videoPlayer.pause();
          videoPlayer.classList.add('hidden');
          iframePlayer.src = ep.videoUrl;
          iframePlayer.classList.remove('hidden');
        }
      };
      epGrid.appendChild(btn);
    });
  } else {
    epSection.classList.add('hidden');
  }

  document.getElementById('videoModal').classList.remove('hidden');
}

// Fecha o Modal e Pausa qualquer reprodução
function closeVideoModal() {
  const videoPlayer = document.getElementById('modalVideoPlayer');
  const iframePlayer = document.getElementById('modalIframe');

  videoPlayer.pause();
  videoPlayer.classList.add('hidden');
  iframePlayer.src = '';
  iframePlayer.classList.add('hidden');

  document.getElementById('videoModal').classList.add('hidden');
  currentVideoPlaying = null;
}

function updateModalFavState(id) {
  const favBtn = document.getElementById('modalFavBtn');
  const isFav = favorites.includes(id);

  if (isFav) {
    favBtn.classList.add('active');
    favBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
  } else {
    favBtn.classList.remove('active');
    favBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
  }
}

function handleSupportSubmit(e) {
  e.preventDefault();
  alert('Mensagem enviada com sucesso!');
  document.getElementById('supportForm').reset();
}
