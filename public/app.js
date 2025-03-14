
// DOM Elements
const elements = {
  // Navigation
  authLink: document.getElementById('auth-link'),
  dashboardLink: document.getElementById('dashboard-link'),
  logoutLink: document.getElementById('logout-link'),
  homeLink: document.getElementById('home-link'),

  // Containers
  authContainer: document.getElementById('auth-container'),
  homeContainer: document.getElementById('home-container'),
  dashboardContainer: document.getElementById('dashboard-container'),
  articleFormContainer: document.getElementById('article-form-container'),
  articleDetailContainer: document.getElementById('article-detail-container'),
  locationUpdateForm: document.getElementById('location-update-form'),

  // Auth Forms
  loginTab: document.getElementById('login-tab'),
  registerTab: document.getElementById('register-tab'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  
  // Location Controls
  getLocationBtn: document.getElementById('get-location-btn'),
  dashboardGetLocationBtn: document.getElementById('dashboard-get-location-btn'),
  articleGetLocationBtn: document.getElementById('article-get-location-btn'),
  
  // Dashboard Controls
  createArticleBtn: document.getElementById('create-article-btn'),
  updateLocationBtn: document.getElementById('update-location-btn'),
  saveLocationBtn: document.getElementById('save-location-btn'),
  
  // Article Form
  articleForm: document.getElementById('article-form'),
  cancelArticleBtn: document.getElementById('cancel-article-btn'),
  
  // Article List and Detail
  articlesContainer: document.getElementById('articles-container'),
  userArticlesContainer: document.getElementById('user-articles'),
  articleDetailContent: document.getElementById('article-detail-content'),
  backToArticlesBtn: document.getElementById('back-to-articles'),
  
  // Search and Sort
  tagSearch: document.getElementById('tag-search'),
  searchBtn: document.getElementById('search-btn'),
  sortSelect: document.getElementById('sort-select')
};

// App State
const state = {
  user: null,
  articles: [],
  userArticles: [],
  currentArticle: null,
  isEditing: false
};

// API Functions
const api = {
  // Auth
  register: async (userData) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },
  
  login: async (credentials) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Logout failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      const response = await fetch('/api/user');
      
      if (!response.ok) {
        if (response.status === 401) {
          return null; // Not authenticated
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to get user');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },
  
  updateUserLocation: async (location) => {
    try {
      const response = await fetch('/api/user/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update location');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update location error:', error);
      throw error;
    }
  },
  
  // Articles
  getArticles: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.tags) queryParams.append('tags', params.tags);
      if (params.latitude) queryParams.append('latitude', params.latitude);
      if (params.longitude) queryParams.append('longitude', params.longitude);
      if (params.userId) queryParams.append('userId', params.userId);
      
      const url = `/api/articles${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch articles');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get articles error:', error);
      throw error;
    }
  },
  
  getArticle: async (id) => {
    try {
      const response = await fetch(`/api/articles/${id}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch article');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get article error:', error);
      throw error;
    }
  },
  
  createArticle: async (articleData) => {
    try {
      const formData = new FormData();
      
      for (const key in articleData) {
        if (key === 'image' && articleData[key]) {
          formData.append('image', articleData[key]);
        } else if (key === 'tags' && Array.isArray(articleData[key])) {
          formData.append('tags', articleData[key].join(','));
        } else {
          formData.append(key, articleData[key]);
        }
      }
      
      const response = await fetch('/api/articles', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create article');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create article error:', error);
      throw error;
    }
  },
  
  updateArticle: async (id, articleData) => {
    try {
      const formData = new FormData();
      
      for (const key in articleData) {
        if (key === 'image' && articleData[key]) {
          formData.append('image', articleData[key]);
        } else if (key === 'tags' && Array.isArray(articleData[key])) {
          formData.append('tags', articleData[key].join(','));
        } else {
          formData.append(key, articleData[key]);
        }
      }
      
      const response = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update article');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update article error:', error);
      throw error;
    }
  },
  
  deleteArticle: async (id) => {
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete article');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Delete article error:', error);
      throw error;
    }
  },
  
  likeArticle: async (id) => {
    try {
      const response = await fetch(`/api/articles/${id}/like`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to like article');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Like article error:', error);
      throw error;
    }
  }
};

// UI Functions
const ui = {
  showPage: (page) => {
    // Hide all containers
    elements.authContainer.classList.add('hidden');
    elements.homeContainer.classList.add('hidden');
    elements.dashboardContainer.classList.add('hidden');
    elements.articleFormContainer.classList.add('hidden');
    elements.articleDetailContainer.classList.add('hidden');
    
    // Show the selected container
    switch (page) {
      case 'auth':
        elements.authContainer.classList.remove('hidden');
        break;
      case 'home':
        elements.homeContainer.classList.remove('hidden');
        break;
      case 'dashboard':
        elements.dashboardContainer.classList.remove('hidden');
        break;
      case 'articleForm':
        elements.articleFormContainer.classList.remove('hidden');
        break;
      case 'articleDetail':
        elements.articleDetailContainer.classList.remove('hidden');
        break;
    }
  },
  
  updateNavigation: () => {
    if (state.user) {
      elements.authLink.classList.add('hidden');
      elements.dashboardLink.classList.remove('hidden');
      elements.logoutLink.classList.remove('hidden');
    } else {
      elements.authLink.classList.remove('hidden');
      elements.dashboardLink.classList.add('hidden');
      elements.logoutLink.classList.add('hidden');
    }
  },
  
  showAuthForm: (form) => {
    if (form === 'login') {
      elements.loginForm.classList.remove('hidden');
      elements.registerForm.classList.add('hidden');
      elements.loginTab.classList.add('active');
      elements.registerTab.classList.remove('active');
    } else {
      elements.loginForm.classList.add('hidden');
      elements.registerForm.classList.remove('hidden');
      elements.loginTab.classList.remove('active');
      elements.registerTab.classList.add('active');
    }
  },
  
  renderArticles: (articles, container) => {
    container.innerHTML = '';
    
    if (articles.length === 0) {
      container.innerHTML = '<p class="no-articles">No articles found</p>';
      return;
    }
    
    articles.forEach(article => {
      const card = document.createElement('div');
      card.className = 'article-card';
      
      // Create image element if available
      let imageHtml = '';
      if (article.image_url) {
        imageHtml = `<div class="article-image" style="background-image: url('${article.image_url}')"></div>`;
      } else {
        imageHtml = `<div class="article-image" style="background-color: #ddd"></div>`;
      }
      
      // Create tags HTML
      const tagsHtml = article.tags && article.tags.length > 0
        ? `<div class="article-tags">${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
        : '';
      
      // Create article excerpt - limit to 100 characters
      const excerpt = article.content.length > 100
        ? article.content.substring(0, 100) + '...'
        : article.content;
      
      // Create edit and delete buttons for user articles
      let userActionBtns = '';
      if (container === elements.userArticlesContainer) {
        userActionBtns = `
          <div class="article-actions">
            <button class="btn primary-btn article-action-btn edit-article" data-id="${article.id}">Edit</button>
            <button class="btn danger-btn article-action-btn delete-article" data-id="${article.id}">Delete</button>
          </div>
        `;
      }
      
      // Create card HTML
      card.innerHTML = `
        ${imageHtml}
        <div class="article-content">
          <h3 class="article-title">${article.title}</h3>
          <div class="article-meta">
            <span>By ${article.author || 'Unknown'}</span>
            <span>Location: ${article.latitude.toFixed(2)}, ${article.longitude.toFixed(2)}</span>
          </div>
          <p class="article-excerpt">${excerpt}</p>
          ${tagsHtml}
        </div>
        <div class="article-footer">
          <button class="like-btn ${article.liked ? 'active' : ''}" data-id="${article.id}">
            <i class="fas fa-heart"></i> ${article.like_count || 0}
          </button>
          ${userActionBtns}
          <a href="#" class="read-more" data-id="${article.id}">Read More</a>
        </div>
      `;
      
      container.appendChild(card);
    });
    
    // Add event listeners to the new elements
    container.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        
        if (!state.user) {
          alert('Please log in to like articles');
          ui.showPage('auth');
          return;
        }
        
        try {
          const result = await api.likeArticle(id);
          
          // Update the button
          if (result.liked) {
            btn.classList.add('active');
            btn.innerHTML = `<i class="fas fa-heart"></i> ${parseInt(btn.innerText.trim()) + 1}`;
          } else {
            btn.classList.remove('active');
            btn.innerHTML = `<i class="fas fa-heart"></i> ${parseInt(btn.innerText.trim()) - 1}`;
          }
          
          // Refresh lists
          await loadArticles();
          if (state.user) {
            await loadUserArticles();
          }
        } catch (error) {
          alert(error.message);
        }
      });
    });
    
    container.querySelectorAll('.read-more').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = link.dataset.id;
        await loadArticleDetail(id);
      });
    });
    
    if (container === elements.userArticlesContainer) {
      container.querySelectorAll('.edit-article').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const id = btn.dataset.id;
          await loadArticleForEdit(id);
        });
      });
      
      container.querySelectorAll('.delete-article').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const id = btn.dataset.id;
          
          if (confirm('Are you sure you want to delete this article?')) {
            try {
              await api.deleteArticle(id);
              await loadUserArticles();
              alert('Article deleted successfully');
            } catch (error) {
              alert(error.message);
            }
          }
        });
      });
    }
  },
  
  renderArticleDetail: (article) => {
    let tagsHtml = '';
    if (article.tags && article.tags.length > 0) {
      tagsHtml = `
        <div class="article-tags">
          ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      `;
    }
    
    let imageHtml = '';
    if (article.image_url) {
      imageHtml = `<img src="${article.image_url}" alt="${article.title}" class="article-detail-image">`;
    }
    
    elements.articleDetailContent.innerHTML = `
      <div class="article-detail-header">
        <h1 class="article-detail-title">${article.title}</h1>
        <div class="article-detail-meta">
          <span>By ${article.author || 'Unknown'}</span>
          <span>Location: ${article.latitude.toFixed(6)}, ${article.longitude.toFixed(6)}</span>
          <span>Posted on ${new Date(article.created_at).toLocaleDateString()}</span>
        </div>
        ${tagsHtml}
      </div>
      ${imageHtml}
      <div class="article-detail-body">
        ${article.content.split('\n').map(para => `<p>${para}</p>`).join('')}
      </div>
      <div class="article-detail-footer">
        <button class="like-btn ${article.liked ? 'active' : ''}" data-id="${article.id}">
          <i class="fas fa-heart"></i> ${article.like_count || 0} Likes
        </button>
      </div>
    `;
    
    // Add event listener to like button
    elements.articleDetailContent.querySelector('.like-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      const id = e.currentTarget.dataset.id;
      
      if (!state.user) {
        alert('Please log in to like articles');
        ui.showPage('auth');
        return;
      }
      
      try {
        const result = await api.likeArticle(id);
        
        // Update the button
        if (result.liked) {
          e.currentTarget.classList.add('active');
          e.currentTarget.innerHTML = `<i class="fas fa-heart"></i> ${parseInt(e.currentTarget.innerText) + 1} Likes`;
        } else {
          e.currentTarget.classList.remove('active');
          e.currentTarget.innerHTML = `<i class="fas fa-heart"></i> ${parseInt(e.currentTarget.innerText) - 1} Likes`;
        }
        
        // Refresh the article
        await loadArticleDetail(id);
      } catch (error) {
        alert(error.message);
      }
    });
  },
  
  setupArticleForm: (article = null) => {
    const titleElement = document.getElementById('article-form-title');
    const idElement = document.getElementById('article-id');
    const titleInput = document.getElementById('article-title');
    const contentInput = document.getElementById('article-content');
    const latitudeInput = document.getElementById('article-latitude');
    const longitudeInput = document.getElementById('article-longitude');
    const tagsInput = document.getElementById('article-tags');
    const imageInput = document.getElementById('article-image');
    
    // Reset form
    elements.articleForm.reset();
    
    if (article) {
      // Editing existing article
      titleElement.textContent = 'Edit Article';
      idElement.value = article.id;
      titleInput.value = article.title;
      contentInput.value = article.content;
      latitudeInput.value = article.latitude;
      longitudeInput.value = article.longitude;
      tagsInput.value = article.tags.join(', ');
      
      state.isEditing = true;
    } else {
      // Creating new article
      titleElement.textContent = 'Create Article';
      idElement.value = '';
      
      // If user has location, use it as default
      if (state.user && state.user.latitude && state.user.longitude) {
        latitudeInput.value = state.user.latitude;
        longitudeInput.value = state.user.longitude;
      }
      
      state.isEditing = false;
    }
  }
};

// Event Handlers
async function loadArticles() {
  try {
    const params = {};
    
    // Get sort option
    const sortValue = elements.sortSelect.value;
    if (sortValue) {
      params.sort = sortValue;
    }
    
    // Get tags if any
    const tagsValue = elements.tagSearch.value.trim();
    if (tagsValue) {
      params.tags = tagsValue;
    }
    
    // Add user location if sorting by distance
    if (sortValue === 'distance' && state.user && state.user.latitude && state.user.longitude) {
      params.latitude = state.user.latitude;
      params.longitude = state.user.longitude;
    }
    
    const articles = await api.getArticles(params);
    state.articles = articles;
    ui.renderArticles(articles, elements.articlesContainer);
  } catch (error) {
    console.error('Error loading articles:', error);
    alert('Failed to load articles: ' + error.message);
  }
}

async function loadUserArticles() {
  try {
    if (!state.user) return;
    
    const articles = await api.getArticles({ userId: state.user.id });
    state.userArticles = articles;
    ui.renderArticles(articles, elements.userArticlesContainer);
  } catch (error) {
    console.error('Error loading user articles:', error);
    alert('Failed to load your articles: ' + error.message);
  }
}

async function loadArticleDetail(id) {
  try {
    const article = await api.getArticle(id);
    state.currentArticle = article;
    ui.renderArticleDetail(article);
    ui.showPage('articleDetail');
  } catch (error) {
    console.error('Error loading article detail:', error);
    alert('Failed to load article: ' + error.message);
  }
}

async function loadArticleForEdit(id) {
  try {
    const article = await api.getArticle(id);
    ui.setupArticleForm(article);
    ui.showPage('articleForm');
  } catch (error) {
    console.error('Error loading article for edit:', error);
    alert('Failed to load article: ' + error.message);
  }
}

async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Failed to get location: ${error.message}`));
        }
      );
    }
  });
}

// Event Listeners
function setupEventListeners() {
  // Navigation
  elements.authLink.addEventListener('click', (e) => {
    e.preventDefault();
    ui.showPage('auth');
  });
  
  elements.dashboardLink.addEventListener('click', (e) => {
    e.preventDefault();
    ui.showPage('dashboard');
    loadUserArticles();
  });
  
  elements.homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    ui.showPage('home');
    loadArticles();
  });
  
  elements.logoutLink.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await api.logout();
      state.user = null;
      ui.updateNavigation();
      ui.showPage('home');
      loadArticles();
    } catch (error) {
      alert(error.message);
    }
  });
  
  // Auth Tabs
  elements.loginTab.addEventListener('click', () => {
    ui.showAuthForm('login');
  });
  
  elements.registerTab.addEventListener('click', () => {
    ui.showAuthForm('register');
  });
  
  // Auth Forms
  elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      const user = await api.login({ email, password });
      state.user = user;
      ui.updateNavigation();
      ui.showPage('home');
      loadArticles();
    } catch (error) {
      alert(error.message);
    }
  });
  
  elements.registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
      const user = await api.register({ 
        username, 
        email, 
        password
      });
      
      state.user = user;
      ui.updateNavigation();
      ui.showPage('home');
      loadArticles();
    } catch (error) {
      alert(error.message);
    }
  });
  
  elements.dashboardGetLocationBtn.addEventListener('click', async () => {
    try {
      const location = await getCurrentLocation();
      document.getElementById('user-latitude').value = location.latitude;
      document.getElementById('user-longitude').value = location.longitude;
    } catch (error) {
      alert(error.message);
    }
  });
  
  elements.articleGetLocationBtn.addEventListener('click', async () => {
    try {
      if (state.user && state.user.latitude && state.user.longitude) {
        document.getElementById('article-latitude').value = state.user.latitude;
        document.getElementById('article-longitude').value = state.user.longitude;
      } else {
        const location = await getCurrentLocation();
        document.getElementById('article-latitude').value = location.latitude;
        document.getElementById('article-longitude').value = location.longitude;
      }
    } catch (error) {
      alert(error.message);
    }
  });
  
  // Dashboard Controls
  elements.createArticleBtn.addEventListener('click', () => {
    ui.setupArticleForm();
    ui.showPage('articleForm');
  });
  
  elements.updateLocationBtn.addEventListener('click', () => {
    // Toggle location update form
    elements.locationUpdateForm.classList.toggle('hidden');
    
    // Fill in current location if available
    if (state.user && state.user.latitude && state.user.longitude) {
      document.getElementById('user-latitude').value = state.user.latitude;
      document.getElementById('user-longitude').value = state.user.longitude;
    }
  });
  
  elements.saveLocationBtn.addEventListener('click', async () => {
    const latitude = document.getElementById('user-latitude').value;
    const longitude = document.getElementById('user-longitude').value;
    
    if (!latitude || !longitude) {
      alert('Please provide both latitude and longitude');
      return;
    }
    
    try {
      const updated = await api.updateUserLocation({ latitude, longitude });
      
      if (state.user) {
        state.user.latitude = updated.latitude;
        state.user.longitude = updated.longitude;
      }
      
      elements.locationUpdateForm.classList.add('hidden');
      alert('Location updated successfully');
    } catch (error) {
      alert(error.message);
    }
  });
  
  // Article Form
  elements.articleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('article-id').value;
    const title = document.getElementById('article-title').value;
    const content = document.getElementById('article-content').value;
    const latitude = document.getElementById('article-latitude').value;
    const longitude = document.getElementById('article-longitude').value;
    const tags = document.getElementById('article-tags').value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    const imageFile = document.getElementById('article-image').files[0];
    
    const articleData = {
      title,
      content,
      latitude,
      longitude,
      tags
    };
    
    if (imageFile) {
      articleData.image = imageFile;
    }
    
    try {
      if (state.isEditing) {
        await api.updateArticle(id, articleData);
        alert('Article updated successfully');
      } else {
        await api.createArticle(articleData);
        alert('Article created successfully');
      }
      
      ui.showPage('dashboard');
      await loadUserArticles();
    } catch (error) {
      alert(error.message);
    }
  });
  
  elements.cancelArticleBtn.addEventListener('click', () => {
    ui.showPage('dashboard');
  });
  
  // Back button in article detail
  elements.backToArticlesBtn.addEventListener('click', () => {
    ui.showPage('home');
  });
  
  // Search and Sort
  elements.searchBtn.addEventListener('click', () => {
    loadArticles();
  });
  
  elements.sortSelect.addEventListener('change', () => {
    loadArticles();
  });
  
  elements.tagSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      loadArticles();
    }
  });
}

// Initialization
async function init() {
  setupEventListeners();
  
  // Check if user is logged in
  const user = await api.getCurrentUser();
  if (user) {
    state.user = user;
    ui.updateNavigation();
  }
  
  // Load articles
  await loadArticles();
  
  // Show home page
  ui.showPage('home');
}

// Start the app
init();
