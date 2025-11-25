// ============================================
// Home Page Logic - Complete Implementation
// ============================================

// Global variables
let currentLanguage = window.getCurrentLanguage ? window.getCurrentLanguage() : (localStorage.getItem('siteLanguage') || 'en');
let currentSearchResults = null;

// Translation helper
const translate = (key) => window.getTranslation ? window.getTranslation(key, currentLanguage) : key;

// Escape HTML helper
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function handleSearch(event) {
  event.preventDefault();
  const searchInput = document.getElementById('searchInput');
  const query = searchInput.value.trim().toLowerCase();
  const resultsContainer = document.getElementById('searchResults');
  
  if (!query) {
    resultsContainer.style.display = 'none';
    return;
  }

  const results = performSearch(query);
  displaySearchResults(results, query);
}

function performSearch(query) {
  const results = {
    presentations: [],
    groups: [],
    templates: []
  };

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const isGuest = localStorage.getItem('guest') === 'true';

  // Search Presentations
  if (currentUser || isGuest) {
    const username = currentUser ? currentUser.username : 'guest';
    const saved = JSON.parse(localStorage.getItem(`presentations_${username}`) || '[]');
    results.presentations = saved.filter(pres => {
      const title = (pres.title || '').toLowerCase();
      return title.includes(query);
    });
  }

  // Search Groups
  if (currentUser && typeof Database !== 'undefined') {
    const userGroups = Database.getGroupsByUser(currentUser.userID);
    results.groups = userGroups.filter(group => {
      const name = (group.groupName || '').toLowerCase();
      return name.includes(query);
    });
  }

  // Search Templates
  if (typeof Database !== 'undefined') {
    const allTemplates = Database.getAllTemplates();
    results.templates = allTemplates.filter(template => {
      const name = (template.templateName || '').toLowerCase();
      const category = (template.category || '').toLowerCase();
      return name.includes(query) || category.includes(query);
    });
  }

  return results;
}

function displaySearchResults(results, query) {
  const resultsContainer = document.getElementById('searchResults');
  const totalResults = results.presentations.length + results.groups.length + results.templates.length;

  // Store results for click handlers
  currentSearchResults = results;

  if (totalResults === 0) {
    resultsContainer.innerHTML = `
      <div class="search-results-empty">
        No results found for "${escapeHtml(query)}"
      </div>
    `;
    resultsContainer.style.display = 'block';
    return;
  }

  let html = '';

  // Presentations Section
  if (results.presentations.length > 0) {
    html += '<div class="search-results-section">';
    html += '<div class="search-results-section-title">Presentations</div>';
    results.presentations.forEach((pres, index) => {
      const title = pres.title || 'Untitled';
      const date = pres.date ? new Date(pres.date).toLocaleDateString() : '';
      html += `
        <div class="search-result-item" data-pres-index="${index}" data-pres-type="presentation">
          <i class="fas fa-file-powerpoint"></i>
          <div class="search-result-item-content">
            <div class="search-result-item-title">${escapeHtml(title)}</div>
            ${date ? `<div class="search-result-item-subtitle">Last edited: ${date}</div>` : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  // Groups Section
  if (results.groups.length > 0) {
    html += '<div class="search-results-section">';
    html += '<div class="search-results-section-title">Groups</div>';
    results.groups.forEach(group => {
      const name = group.groupName || 'Unnamed Group';
      html += `
        <div class="search-result-item" onclick="window.location.href='./groups.html?group=${group.groupID}'">
          <i class="fas fa-folder"></i>
          <div class="search-result-item-content">
            <div class="search-result-item-title">${escapeHtml(name)}</div>
            <div class="search-result-item-subtitle">Group</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  // Templates Section
  if (results.templates.length > 0) {
    html += '<div class="search-results-section">';
    html += '<div class="search-results-section-title">Templates</div>';
    results.templates.forEach(template => {
      const name = template.templateName || 'Unnamed Template';
      const category = template.category || 'general';
      html += `
        <div class="search-result-item" onclick="useTemplate('${template.templateID || template.templateName}')">
          <i class="fas fa-layer-group"></i>
          <div class="search-result-item-content">
            <div class="search-result-item-title">${escapeHtml(name)}</div>
            <div class="search-result-item-subtitle">${category.charAt(0).toUpperCase() + category.slice(1)} Template</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  resultsContainer.innerHTML = html;
  resultsContainer.style.display = 'block';

  // Add click handlers for presentation items
  resultsContainer.querySelectorAll('[data-pres-type="presentation"]').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.getAttribute('data-pres-index'));
      if (currentSearchResults && currentSearchResults.presentations[index]) {
        openPresentation(currentSearchResults.presentations[index]);
      }
    });
  });
}

function openPresentation(pres) {
  if (pres && typeof pres === 'object') {
    sessionStorage.setItem('loadPresentation', JSON.stringify(pres));
    window.location.href = './blank.html';
  }
}

// Real-time search as user types
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length >= 2) {
          const results = performSearch(query);
          displaySearchResults(results, query);
        } else if (query.length === 0) {
          document.getElementById('searchResults').style.display = 'none';
        }
      }, 300);
    });
  }

  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    const searchForm = document.getElementById('searchForm');
    const resultsContainer = document.getElementById('searchResults');
    if (resultsContainer && !searchForm.contains(e.target) && !resultsContainer.contains(e.target)) {
      resultsContainer.style.display = 'none';
    }
  });
});

// ============================================
// PRESENTATION MANAGEMENT
// ============================================

function loadRecentPresentations() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const isGuest = localStorage.getItem('guest') === 'true';
  let saved = [];
  
  if (currentUser) {
    saved = JSON.parse(localStorage.getItem(`presentations_${currentUser.username}`) || '[]');
  } else if (isGuest) {
    const grid = document.getElementById('recentGrid');
    grid.innerHTML = `<div class="empty-state">${translate('home.recentSignIn')}</div>`;
    return;
  } else {
    const grid = document.getElementById('recentGrid');
    grid.innerHTML = `<div class="empty-state">${translate('home.recentLogin')}</div>`;
    return;
  }

  const grid = document.getElementById('recentGrid');
  
  if (saved.length === 0) {
    grid.innerHTML = `<div class="empty-state">${translate('home.recentEmpty')}</div>`;
    return;
  }

  // Sort by date (newest first)
  const sorted = saved.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  grid.innerHTML = '';
  sorted.forEach((pres, index) => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    const title = escapeHtml(pres.title || 'Untitled');
    const date = pres.date ? formatDate(pres.date) : translate('common.unknown');
    
    item.innerHTML = `
      <div class="recent-info">
        <div class="recent-title">${title}</div>
        <div class="recent-date">${date}</div>
      </div>
      <div class="recent-actions">
        <button class="edit-btn" data-type="presentation" data-id="${pres.id}" type="button">
          <i class="fas fa-pencil-alt"></i>
        </button>
      </div>
    `;
    
    // Set up click handler for the card (not the actions area)
    const recentInfo = item.querySelector('.recent-info');
    if (recentInfo) {
      recentInfo.style.cursor = 'pointer';
      recentInfo.addEventListener('click', (e) => {
        // Don't navigate if clicking on the edit button area
        if (!e.target.closest('.recent-actions')) {
          sessionStorage.setItem('loadPresentation', JSON.stringify(pres));
          window.location.href = './blank.html';
        }
      });
    }
    
    grid.appendChild(item);
  });
  
  // Initialize edit menu after items are rendered
  setTimeout(() => {
    initPresentationEditMenu();
  }, 100);
}

function createNewPresentation() {
  window.location.href = './blank.html';
}

async function useTemplate(templateName) {
  try {
    // Load template from JSON file
    if (typeof loadTemplate === 'function') {
      const slides = await loadTemplate(templateName);
      // Store slides in localStorage for the editor to load
      localStorage.setItem('importedSlides', JSON.stringify(slides));
      // Navigate to slide editor
      window.location.href = './blank.html';
    } else {
      // Fallback: use old method if loadTemplate is not available
      sessionStorage.setItem('selectedTemplate', templateName);
      window.location.href = `./blank.html?template=${templateName}`;
    }
  } catch (error) {
    console.error('Error loading template:', error);
    alert(`Failed to load template: ${error.message}`);
  }
}

// ============================================
// GROUP MANAGEMENT
// ============================================

function loadRecentGroups() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser || !currentUser.userID) {
    const grid = document.getElementById('recentGroupsGrid');
    grid.innerHTML = '<div class="empty-state">Please log in to view your groups.</div>';
    return;
  }

  if (typeof Database === 'undefined') {
    console.error('Database module not loaded');
    return;
  }

  const userGroups = Database.getGroupsByUser(currentUser.userID);
  const recents = Database.getRecents(currentUser.userID);
  const recentGroupIDs = recents.recentGroups || [];
  
  // Sort by recent activity
  const sortedGroups = userGroups.sort((a, b) => {
    const aIndex = recentGroupIDs.indexOf(a.groupID);
    const bIndex = recentGroupIDs.indexOf(b.groupID);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const grid = document.getElementById('recentGroupsGrid');
  
  if (sortedGroups.length === 0) {
    grid.innerHTML = '<div class="empty-state">No groups yet. Create your first group to get started!</div>';
    return;
  }

  grid.innerHTML = '';
  sortedGroups.slice(0, 6).forEach((group, index) => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    const title = escapeHtml(group.groupName || 'Unnamed Group');
    const memberCount = group.members ? group.members.length : 0;
    const date = group.createdAt ? formatDate(group.createdAt) : 'Unknown';
    
    item.innerHTML = `
      <div class="recent-info">
        <div class="recent-title">${title}</div>
        <div class="recent-date">${memberCount} ${memberCount === 1 ? 'member' : 'members'} • ${date}</div>
      </div>
      <div class="recent-actions">
        <button class="edit-btn" data-type="group" data-id="${group.groupID}" type="button">
          <i class="fas fa-pencil-alt"></i>
        </button>
      </div>
    `;
    
    // Set up click handler for the card (not the actions area)
    const recentInfo = item.querySelector('.recent-info');
    if (recentInfo) {
      recentInfo.style.cursor = 'pointer';
      recentInfo.addEventListener('click', (e) => {
        // Don't navigate if clicking on the edit button area
        if (!e.target.closest('.recent-actions')) {
          window.location.href = `./groups.html?group=${group.groupID}`;
        }
      });
    }
    
    grid.appendChild(item);
  });
  
  // Initialize edit menu after items are rendered
  setTimeout(() => {
    initGroupEditMenu();
  }, 100);
}

function createNewGroup() {
  // Check for current user
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  if (!currentUser || !currentUser.userID) {
    alert('Please log in to create a group');
    return;
  }

  // Open the modal instead of using prompt
  if (typeof openCreateGroupModal === 'function') {
    openCreateGroupModal();
  } else {
    // Fallback: try to open modal directly
    const modal = document.getElementById('createGroupModal');
    const input = document.getElementById('newGroupName');
    if (modal) {
      modal.classList.remove('hidden');
      setTimeout(() => {
        if (input) {
          input.focus();
          input.select();
        }
      }, 100);
    }
  }
}
  loadRecentGroups();
  window.location.href = `./groups.html?group=${newGroup.groupID}`;
}

function showAllGroups() {
  window.location.href = './groups.html';
}

function showAllPresentations() {
  window.location.href = './Home.html#recent';
}

// ============================================
// USER MANAGEMENT
// ============================================

function updateUserGreeting() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const isGuest = localStorage.getItem('guest') === 'true';
  const authButtons = document.getElementById('authButtons');
  const userInfo = document.getElementById('userInfo');
  const userName = document.getElementById('userName');

  if (currentUser || isGuest) {
    if (authButtons) authButtons.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
    if (userName) {
      const name = currentUser ? (currentUser.fullName || currentUser.username || 'User') : 'Guest';
      userName.textContent = `Welcome, ${name}`;
    }
  } else {
    if (authButtons) authButtons.style.display = 'flex';
    if (userInfo) userInfo.style.display = 'none';
  }
}

function handleLogout() {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('deviceToken');
  localStorage.removeItem('guest');
  window.location.href = './index.html';
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Route protection
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const isGuest = localStorage.getItem('guest') === 'true';
  
  if (!currentUser && !isGuest) {
    window.location.href = './index.html';
    return;
  }

  // Initialize translations
  if (typeof window.initTranslations === 'function') {
    window.onLanguageChange = (lang) => {
      currentLanguage = lang;
      updateUserGreeting();
      loadRecentPresentations();
    };
    window.initTranslations();
  } else if (typeof window.applyTranslations === 'function') {
    window.applyTranslations(currentLanguage);
  }

  // Update user greeting
  updateUserGreeting();

  // Load data
  loadRecentPresentations();
  loadRecentGroups();

  // Setup event listeners
  document.querySelector('[data-action="open_blank_page"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = './blank.html';
  });

  document.getElementById('btnLogOut')?.addEventListener('click', handleLogout);
  document.getElementById('btnLogIn')?.addEventListener('click', () => window.location.href = './index.html');
  document.getElementById('btnSignUp')?.addEventListener('click', () => window.location.href = './index.html');

  // Setup template card click handlers
  document.querySelectorAll('.template-card[data-template]').forEach(card => {
    card.addEventListener('click', async () => {
      const name = card.dataset.template;
      if (name) {
        await useTemplate(name);
      }
    });
  });
  
  // Also handle template cards with onclick attributes (for backward compatibility)
  document.querySelectorAll('.template-card').forEach(card => {
    // Only add listener if it doesn't already have onclick and doesn't have data-template
    if (!card.hasAttribute('onclick') && !card.hasAttribute('data-template')) {
      // This will be handled by existing onclick handlers
    }
  });

  // Note: The "See More" button for templates is now handled by inline script in Home.html
  // This was the old button that navigated to more_templates.html
});

// ============================================
// EDIT CONTEXT MENU FUNCTIONS
// ============================================

let currentEditType = null; // 'presentation' or 'group'
let currentEditIndex = null;
let currentEditData = null;

// ============================================
// Edit Menu System - Simple Global Menus
// ============================================

// Store current item ID for menu actions
let currentPresentationId = null;
let currentGroupId = null;

// Initialize Presentation Edit Menu
function initPresentationEditMenu() {
  const menu = document.getElementById('presentationEditMenu');
  if (!menu) return;
  
  // Remove old listeners by cloning
  document.querySelectorAll('.edit-btn[data-type="presentation"]').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });
  
  // Add click listeners to all presentation edit buttons
  document.querySelectorAll('.edit-btn[data-type="presentation"]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const itemId = this.getAttribute('data-id');
      currentPresentationId = itemId;
      
      // Position menu under the button
      const rect = this.getBoundingClientRect();
      menu.style.top = `${rect.bottom + 5}px`;
      menu.style.left = `${rect.left}px`;
      
      // Show menu
      menu.classList.remove('hidden');
      menu.classList.add('show');
    });
  });
  
  // Menu action handlers
  menu.querySelector('[data-action="rename"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentPresentationId) {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser) {
        const saved = JSON.parse(localStorage.getItem(`presentations_${currentUser.username}`) || '[]');
        const pres = saved.find(p => p.id === currentPresentationId);
        if (pres) {
          const index = saved.indexOf(pres);
          handleRename('presentation', index);
        }
      }
      closeEditMenu('presentation');
    }
  });
  
  menu.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentPresentationId) {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser) {
        const saved = JSON.parse(localStorage.getItem(`presentations_${currentUser.username}`) || '[]');
        const pres = saved.find(p => p.id === currentPresentationId);
        if (pres) {
          const index = saved.indexOf(pres);
          handleDelete('presentation', index);
        }
      }
      closeEditMenu('presentation');
    }
  });
}

// Initialize Group Edit Menu
function initGroupEditMenu() {
  const menu = document.getElementById('groupEditMenu');
  if (!menu) return;
  
  // Remove old listeners by cloning
  document.querySelectorAll('.edit-btn[data-type="group"]').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });
  
  // Add click listeners to all group edit buttons
  document.querySelectorAll('.edit-btn[data-type="group"]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const groupId = this.getAttribute('data-id');
      currentGroupId = groupId;
      
      // Load group info
      if (typeof Database !== 'undefined') {
        const group = Database.getGroupByID(groupId);
        if (group) {
          document.getElementById('groupInfoTitle').textContent = group.groupName || 'Unnamed Group';
          document.getElementById('groupInfoCreated').textContent = group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'Unknown';
          document.getElementById('groupInfoMembers').textContent = (group.members || []).length;
        }
      }
      
      // Position menu under the button
      const rect = this.getBoundingClientRect();
      menu.style.top = `${rect.bottom + 5}px`;
      menu.style.left = `${rect.left}px`;
      
      // Show menu
      menu.classList.remove('hidden');
      menu.classList.add('show');
    });
  });
  
  // Menu action handlers
  menu.querySelector('[data-action="rename"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentGroupId) {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser && typeof Database !== 'undefined') {
        const userID = currentUser.userID || currentUser.email;
        const userGroups = Database.getGroupsByUser(userID);
        const userRecents = Database.getRecents(userID);
        const recentGroupIDs = userRecents.recentGroups || [];
        const recentGroups = recentGroupIDs
          .map(id => userGroups.find(g => g.groupID === id))
          .filter(g => g !== undefined)
          .slice(0, 6);
        const index = recentGroups.findIndex(g => g.groupID === currentGroupId);
        if (index !== -1) {
          handleRename('group', index);
        }
      }
      closeEditMenu('group');
    }
  });
  
  menu.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentGroupId) {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser && typeof Database !== 'undefined') {
        const userID = currentUser.userID || currentUser.email;
        const userGroups = Database.getGroupsByUser(userID);
        const userRecents = Database.getRecents(userID);
        const recentGroupIDs = userRecents.recentGroups || [];
        const recentGroups = recentGroupIDs
          .map(id => userGroups.find(g => g.groupID === id))
          .filter(g => g !== undefined)
          .slice(0, 6);
        const index = recentGroups.findIndex(g => g.groupID === currentGroupId);
        if (index !== -1) {
          handleDelete('group', index);
        }
      }
      closeEditMenu('group');
    }
  });
}

// Close edit menu
function closeEditMenu(type) {
  const menu = type === 'presentation' ? document.getElementById('presentationEditMenu') : document.getElementById('groupEditMenu');
  if (menu) {
    menu.classList.add('hidden');
    menu.classList.remove('show');
  }
}

// Global click handler to close menus when clicking outside
if (!window.editMenuClickHandlerSet) {
  document.addEventListener('click', (e) => {
    const presentationMenu = document.getElementById('presentationEditMenu');
    const groupMenu = document.getElementById('groupEditMenu');
    
    // Close presentation menu if clicking outside
    if (presentationMenu && !presentationMenu.contains(e.target) && !e.target.closest('.edit-btn[data-type="presentation"]')) {
      closeEditMenu('presentation');
    }
    
    // Close group menu if clicking outside
    if (groupMenu && !groupMenu.contains(e.target) && !e.target.closest('.edit-btn[data-type="group"]')) {
      closeEditMenu('group');
    }
  });
  
  // Close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEditMenu('presentation');
      closeEditMenu('group');
    }
  });
  
  window.editMenuClickHandlerSet = true;
}

// Initialize menus on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      initPresentationEditMenu();
      initGroupEditMenu();
    }, 300);
  });
} else {
  setTimeout(() => {
    initPresentationEditMenu();
    initGroupEditMenu();
  }, 300);
}

function closeEditContextMenu() {
  const menu = document.getElementById('editContextMenu');
  if (menu) {
    menu.classList.add('hidden');
  }
  currentEditType = null;
  currentEditIndex = null;
  currentEditData = null;
}

function handleRename(type, index) {
  // Close all dropdowns
  document.querySelectorAll('.edit-dropdown').forEach(d => {
    d.classList.add('hidden');
    d.classList.remove('show');
  });
  
  let currentName = '';
  let editData = null;
  
  if (type === 'presentation') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      const saved = JSON.parse(localStorage.getItem(`presentations_${currentUser.username}`) || '[]');
      const sorted = saved.sort((a, b) => new Date(b.date) - new Date(a.date));
      editData = sorted[index];
      currentName = editData?.title || 'Untitled';
    }
  } else if (type === 'group') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser && typeof Database !== 'undefined') {
      const userID = currentUser.userID || currentUser.email;
      const userGroups = Database.getGroupsByUser(userID);
      const userRecents = Database.getRecents(userID);
      const recentGroupIDs = userRecents.recentGroups || [];
      const recentGroups = recentGroupIDs
        .map(id => userGroups.find(g => g.groupID === id))
        .filter(g => g !== undefined)
        .slice(0, 6);
      editData = recentGroups[index];
      currentName = editData?.groupName || 'Unnamed Group';
    }
  }
  
  if (!editData) return;
  
  const newName = prompt(`Rename ${type === 'presentation' ? 'presentation' : 'group'}:`, currentName);
  if (!newName || newName.trim() === '' || newName === currentName) return;
  
  if (type === 'presentation') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      const saved = JSON.parse(localStorage.getItem(`presentations_${currentUser.username}`) || '[]');
      const sorted = saved.sort((a, b) => new Date(b.date) - new Date(a.date));
      if (sorted[index]) {
        sorted[index].title = newName.trim();
        localStorage.setItem(`presentations_${currentUser.username}`, JSON.stringify(saved));
        if (typeof loadRecentPresentations === 'function') {
          loadRecentPresentations();
        } else {
          location.reload();
        }
      }
    }
  } else if (type === 'group') {
    if (typeof Database !== 'undefined' && editData && editData.groupID) {
      Database.updateGroup(editData.groupID, { groupName: newName.trim() });
      if (typeof loadRecentGroups === 'function') {
        loadRecentGroups();
      } else {
        location.reload();
      }
    }
  }
}

function handleDuplicate(type, index) {
  // Close dropdown
  document.querySelectorAll('.edit-dropdown').forEach(d => {
    d.classList.add('hidden');
    d.classList.remove('show');
  });
  
  let editData = null;
  
  if (type === 'presentation') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      const saved = JSON.parse(localStorage.getItem(`presentations_${currentUser.username}`) || '[]');
      const sorted = saved.sort((a, b) => new Date(b.date) - new Date(a.date));
      editData = sorted[index];
      if (editData) {
        const duplicate = {
          ...editData,
          title: `${editData.title || 'Untitled'} (Copy)`,
          date: new Date().toISOString()
        };
        saved.push(duplicate);
        localStorage.setItem(`presentations_${currentUser.username}`, JSON.stringify(saved));
        if (typeof loadRecentPresentations === 'function') {
          loadRecentPresentations();
        } else {
          location.reload();
        }
      }
    }
  } else if (type === 'group') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser && typeof Database !== 'undefined') {
      const userID = currentUser.userID || currentUser.email;
      const userGroups = Database.getGroupsByUser(userID);
      const userRecents = Database.getRecents(userID);
      const recentGroupIDs = userRecents.recentGroups || [];
      const recentGroups = recentGroupIDs
        .map(id => userGroups.find(g => g.groupID === id))
        .filter(g => g !== undefined)
        .slice(0, 6);
      editData = recentGroups[index];
      if (editData && editData.groupID) {
        const newGroup = Database.createGroup({
          groupName: `${editData.groupName || 'Unnamed Group'} (Copy)`,
          createdBy: userID,
          members: [...(editData.members || [])],
          roles: [...(editData.roles || [])],
          slides: []
        });
        Database.addRecentGroup(userID, newGroup.groupID);
        if (typeof loadRecentGroups === 'function') {
          loadRecentGroups();
        } else {
          location.reload();
        }
      }
    }
  }
}

function handleDelete(type, index) {
  // Close dropdown
  document.querySelectorAll('.edit-dropdown').forEach(d => {
    d.classList.add('hidden');
    d.classList.remove('show');
  });
  
  let editData = null;
  let itemName = '';
  
  if (type === 'presentation') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      const saved = JSON.parse(localStorage.getItem(`presentations_${currentUser.username}`) || '[]');
      const sorted = saved.sort((a, b) => new Date(b.date) - new Date(a.date));
      editData = sorted[index];
      itemName = editData?.title || 'Untitled';
    }
  } else if (type === 'group') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser && typeof Database !== 'undefined') {
      const userID = currentUser.userID || currentUser.email;
      const userGroups = Database.getGroupsByUser(userID);
      const userRecents = Database.getRecents(userID);
      const recentGroupIDs = userRecents.recentGroups || [];
      const recentGroups = recentGroupIDs
        .map(id => userGroups.find(g => g.groupID === id))
        .filter(g => g !== undefined)
        .slice(0, 6);
      editData = recentGroups[index];
      itemName = editData?.groupName || 'Unnamed Group';
    }
  }
  
  if (!editData) return;
  
  if (!confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
    return;
  }
  
  if (type === 'presentation') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      const saved = JSON.parse(localStorage.getItem(`presentations_${currentUser.username}`) || '[]');
      const sorted = saved.sort((a, b) => new Date(b.date) - new Date(a.date));
      const itemToDelete = sorted[index];
      if (itemToDelete) {
        const indexInSaved = saved.indexOf(itemToDelete);
        if (indexInSaved !== -1) {
          saved.splice(indexInSaved, 1);
          localStorage.setItem(`presentations_${currentUser.username}`, JSON.stringify(saved));
          if (typeof loadRecentPresentations === 'function') {
            loadRecentPresentations();
          } else {
            location.reload();
          }
        }
      }
    }
  } else if (type === 'group') {
    if (typeof Database !== 'undefined' && editData && editData.groupID) {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser) {
        const userID = currentUser.userID || currentUser.email;
        const recents = Database.getRecents(userID);
        recents.recentGroups = (recents.recentGroups || []).filter(id => id !== editData.groupID);
        Database.updateRecents(userID, recents);
        if (typeof loadRecentGroups === 'function') {
          loadRecentGroups();
        } else {
          location.reload();
        }
      }
    }
  }
}

function handleShare(type, index) {
  // Close dropdown
  document.querySelectorAll('.edit-dropdown').forEach(d => {
    d.classList.add('hidden');
    d.classList.remove('show');
  });
  
  let editData = null;
  
  if (type === 'presentation') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      const saved = JSON.parse(localStorage.getItem(`presentations_${currentUser.username}`) || '[]');
      const sorted = saved.sort((a, b) => new Date(b.date) - new Date(a.date));
      editData = sorted[index];
      if (editData) {
        const shareText = `Check out my presentation: ${editData.title || 'Untitled'}`;
        if (navigator.share) {
          navigator.share({
            title: editData.title || 'Untitled',
            text: shareText
          }).catch(err => console.log('Error sharing:', err));
        } else {
          navigator.clipboard.writeText(shareText).then(() => {
            alert('Share text copied to clipboard!');
          }).catch(() => {
            alert(shareText);
          });
        }
      }
    }
  } else if (type === 'group') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser && typeof Database !== 'undefined') {
      const userID = currentUser.userID || currentUser.email;
      const userGroups = Database.getGroupsByUser(userID);
      const userRecents = Database.getRecents(userID);
      const recentGroupIDs = userRecents.recentGroups || [];
      const recentGroups = recentGroupIDs
        .map(id => userGroups.find(g => g.groupID === id))
        .filter(g => g !== undefined)
        .slice(0, 6);
      editData = recentGroups[index];
      if (editData && editData.groupID) {
        const shareLink = `${window.location.origin}${window.location.pathname.replace('Home.html', 'groups.html')}?group=${editData.groupID}`;
        const shareText = `Join my group: ${editData.groupName || 'Unnamed Group'}\n${shareLink}`;
        
        if (navigator.share) {
          navigator.share({
            title: editData.groupName || 'Unnamed Group',
            text: `Join my group: ${editData.groupName || 'Unnamed Group'}`,
            url: shareLink
          }).catch(err => console.log('Error sharing:', err));
        } else {
          navigator.clipboard.writeText(shareLink).then(() => {
            alert('Group link copied to clipboard!');
          }).catch(() => {
            prompt('Copy this link:', shareLink);
          });
        }
      }
    }
  }
}

// Close dropdowns on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.edit-dropdown').forEach(d => {
      d.classList.add('hidden');
      d.classList.remove('show');
    });
  }
});

// Export functions for global use
window.handleSearch = handleSearch;
window.createNewPresentation = createNewPresentation;
window.createNewGroup = createNewGroup;
window.useTemplate = useTemplate;
window.showAllGroups = showAllGroups;
window.showAllPresentations = showAllPresentations;
window.handleLogout = handleLogout;
window.initPresentationEditMenu = initPresentationEditMenu;
window.initGroupEditMenu = initGroupEditMenu;
window.handleRename = handleRename;
window.handleDuplicate = handleDuplicate;
window.handleDelete = handleDelete;
window.handleShare = handleShare;

