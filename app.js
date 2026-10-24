let videosData = [];
let favorites = JSON.parse(localStorage.getItem('mai_favorites')) || [];
let currentTab = 'todos';
let currentCategory = 'all';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  loadVideos();
  setupEventListeners();
});

async function loadVideos() {
  try {
    const response = await fetch('data.json');
    videosData = await response.json();
    renderVideos();
    updateFavBadge();
  } catch (error) {
    console.error('Erro ao carregar o data.json:', error);
    document.getElementById('videoGrid').innerHTML = '<p style="color:var(--text-muted); text-align:center; grid-column:1/-1;">Erro ao carregar os vídeos. Verifique o data.json.</p>';
  }
}

function setupEventListeners() {
  // Abas
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.getAttribute('data-tab');
      
      const suporteSection = document.getElementById('suporteSection');
      const videoGrid = document.getElementById('videoGrid');
      const categoriesBar = document.getElementById('categoriesBar');
      const sectionTitle = document.getElementById('sectionTitle');

      if (currentTab === 'suporte') {
        suporteSection.classList.remove('hidden');
        videoGrid.classList.add('hidden');
        categoriesBar.classList.add('hidden');
        sectionTitle.style.display = 'none';
      } else {
        suporteSection.classList.add('hidden');
        videoGrid.classList.remove('hidden');
        categoriesBar.classList.remove('hidden');
        sectionTitle.style.display = 'flex';
        
        if (currentTab === 'todos') {
          sectionTitle.innerHTML = '<i class="fa-solid fa-heart text-gold"></i> Todos os Vídeos Fofos';
        } else if (currentTab === 'lancamentos') {
          sectionTitle.innerHTML = '<i class="fa-solid fa-sparkles text-gold"></i> Últimos Lançados';
        } else if (currentTab === 'favoritos') {
          sectionTitle.innerHTML = '<i class="fa-solid fa-star text-gold"></i> Meus Favoritos';
        }
      }
      renderVideos();
    });
  });

  // Categorias
  const catChips = document.querySelectorAll('.cat-chip');
  catChips.forEach(chip => {
    chip.addEventListener('click', () => {
      catChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = chip.getAttribute('data-category');
      renderVideos();
    });
  });

  // Pesquisa
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase();
    renderVideos();
  });

  // Modais
  const apkModal = document.getElementById('apkModal');
  document.getElementById('openApkModal').addEventListener('click', () => apkModal.classList.remove('hidden'));
  document.getElementById('closeApkModalBtn').addEventListener('click', () => apkModal.classList.add('hidden'));

  const videoModal = document.getElementById('videoModal');
  document.getElementById('closeModalBtn').addEventListener('click', () => {
    videoModal.classList.add('hidden');
    const player = document.getElementById('modalVideoPlayer');
    player.pause();
    player.currentTime = 0;
  });

  // Fechar modal clicando fora
  window.addEventListener('click', (e) => {
    if (e.target === apkModal) apkModal.classList.add('hidden');
    if (e.target === videoModal) {
      videoModal.classList.add('hidden');
      const player = document.getElementById('modalVideoPlayer');
      player.pause();
      player.currentTime = 0;
    }
  });
}

function renderVideos() {
  const grid = document.getElementById('videoGrid');
  let filtered = [...videosData];

  if (currentTab === 'lancamentos') {
    filtered = filtered.filter(v => v.isRelease === true);
  } else if (currentTab === 'favoritos') {
    filtered = filtered.filter(v => favorites.includes(v.id));
  }

  if (currentCategory !== 'all') {
    filtered = filtered.filter(v => v.category === currentCategory);
  }

  if (currentSearch) {
    filtered = filtered.filter(v => v.title.toLowerCase().includes(currentSearch) || v.description.toLowerCase().includes(currentSearch));
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted); text-align:center; grid-column:1/-1; padding: 40px;">Nenhum vídeo encontrado aqui. ✨</p>';
    return;
  }

  grid.innerHTML = filtered.map(video => {
    const isFav = favorites.includes(video.id);
    return `
      <div class="video-card" onclick="openVideoModal(${video.id})">
        <div class="video-thumb-container">
          <img src="${video.thumbnail}" alt="${video.title}" class="video-thumb" />
          <span class="video-quality-badge">${video.quality}</span>
          <button class="card-fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${video.id})">
            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
        </div>
        <div class="video-card-info">
          <h3>${video.title}</h3>
          <p>${video.description}</p>
          <div class="video-meta">
            <span><i class="fa-solid fa-folder"></i> ${video.category}</span>
            <span><i class="fa-solid fa-calendar"></i> ${video.year}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openVideoModal(id) {
  const video = videosData.find(v => v.id === id);
  if (!video) return;

  const modal = document.getElementById('videoModal');
  const title = document.getElementById('modalTitle');
  const desc = document.getElementById('modalDesc');
  const quality = document.getElementById('modalQuality');
  const category = document.getElementById('modalCategory');
  const year = document.getElementById('modalYear');
  const player = document.getElementById('modalVideoPlayer');
  const source = document.getElementById('modalVideoSource');
  const iframe = document.getElementById('modalIframe');
  const favBtn = document.getElementById('modalFavBtn');

  title.textContent = video.title;
  desc.textContent = video.description;
  quality.textContent = video.quality;
  category.textContent = video.category;
  year.textContent = video.year;

  const isFav = favorites.includes(video.id);
  favBtn.innerHTML = `<i class="${isFav ? 'fa-solid text-gold' : 'fa-regular'} fa-heart"></i>`;
  favBtn.onclick = () => {
    toggleFavorite(video.id);
    openVideoModal(video.id);
  };

  if (video.videoUrl.endsWith('.mp4') || !video.videoUrl.startsWith('http')) {
    iframe.classList.add('hidden');
    player.classList.remove('hidden');
    source.src = video.videoUrl;
    player.load();
    player.play().catch(e => console.log("Autoplay restrito, clique em play.", e));
  } else {
    player.classList.add('hidden');
    player.pause();
    iframe.classList.remove('hidden');
    iframe.src = video.videoUrl;
  }

  renderEpisodes(video);
  modal.classList.remove('hidden');
}

function renderEpisodes(currentVideo) {
  const grid = document.getElementById('episodesGrid');
  const related = videosData.filter(v => v.category === currentVideo.category);
  
  grid.innerHTML = related.map(v => `
    <div class="episode-item ${v.id === currentVideo.id ? 'active-ep' : ''}" onclick="openVideoModal(${v.id})">
      <img src="${v.thumbnail}" alt="${v.title}">
      <div class="episode-meta">
        <h5>${v.title}</h5>
        <span>${v.quality}</span>
      </div>
    </div>
  `).join('');
}

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(favId => favId !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem('mai_favorites', JSON.stringify(favorites));
  updateFavBadge();
  renderVideos();
}

function updateFavBadge() {
  const badge = document.getElementById('favCountBadge');
  badge.textContent = favorites.length;
}
