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

// Format date helper
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  } else if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    return 'Just now';
  }
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
    
    // Ensure all presentations have IDs (add if missing)
    let needsSave = false;
    saved = saved.map(pres => {
      if (!pres.id) {
        needsSave = true;
        return {
          ...pres,
          id: crypto.randomUUID ? crypto.randomUUID() : `pres-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
      }
      return pres;
    });
    
    // Save back if any IDs were added
    if (needsSave) {
      localStorage.setItem(`presentations_${currentUser.username}`, JSON.stringify(saved));
    }
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
    item.className = 'presentation-card';
    const title = escapeHtml(pres.title || 'Untitled');
    const date = pres.date ? formatDate(pres.date) : translate('common.unknown');
    const slideCount = pres.slides ? (typeof pres.slides === 'string' ? JSON.parse(pres.slides).length : pres.slides.length) : 1;
    const groupName = pres.groupName || null;
    
    item.innerHTML = `
      <div class="presentation-preview" data-id="${pres.id}">
        <div class="presentation-thumbnail">
          <span class="thumbnail-placeholder">PNG OF FIRST SLIDE</span>
        </div>
      </div>
      <div class="presentation-info-bar">
        <div class="presentation-name" title="${title}">${title}</div>
        <div class="presentation-actions">
          <button class="info-icon-btn" data-id="${pres.id}" title="Presentation Info">
            <i class="fas fa-info-circle"></i>
            <div class="info-tooltip">
              <div class="info-tooltip-item">
                <i class="fas fa-calendar"></i>
                <span>Created: ${date}</span>
              </div>
              <div class="info-tooltip-item">
                <i class="fas fa-file"></i>
                <span>${slideCount} ${slideCount === 1 ? 'slide' : 'slides'}</span>
              </div>
              ${groupName ? `
              <div class="info-tooltip-item">
                <i class="fas fa-users"></i>
                <span>Group: ${escapeHtml(groupName)}</span>
              </div>
              ` : ''}
            </div>
          </button>
          <button class="edit-pen-btn" data-id="${pres.id}" data-index="${index}" title="Edit Options">
            <i class="fas fa-pen"></i>
          </button>
          <div class="presentation-edit-menu" id="pres-edit-menu-${index}">
            <div class="menu-item" onclick="renamePresentationFromMenu(${index}, '${title.replace(/'/g, "\\'")}')">
              <i class="fas fa-edit"></i>
              <span>Rename</span>
            </div>
            <div class="menu-item danger" onclick="deletePresentationFromMenu(${index})">
              <i class="fas fa-trash"></i>
              <span>Delete</span>
            </div>
            <div class="menu-item" onclick="presentPresentationFromMenu('${pres.id}')">
              <i class="fas fa-play"></i>
              <span>Present</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Set up click handler for the preview to open presentation
    const preview = item.querySelector('.presentation-preview');
    if (preview) {
      preview.style.cursor = 'pointer';
      preview.addEventListener('click', (e) => {
        if (!e.target.closest('.presentation-actions')) {
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
  
  // Attach event listeners to Present buttons
  document.querySelectorAll(".present-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      if (!id || id === 'undefined') {
        console.error('Present button clicked but no ID found:', id);
        alert('Unable to present this presentation. Please try again.');
        return;
      }
      console.log('Presenting presentation with ID:', id);
      window.location.href = `slide-editor.html?id=${id}&present=true`;
    });
  });
  
  // FIXED: Attach event listeners to Edit pen buttons and info icons
  initPresentationCardButtons();
}

// FIXED: Initialize presentation card button handlers
function initPresentationCardButtons() {
  // Handle edit pen button clicks to toggle dropdown
  document.querySelectorAll(".edit-pen-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const index = btn.getAttribute("data-index");
      const menuId = `pres-edit-menu-${index}`;
      const menu = document.getElementById(menuId);
      
      // Close all other menus
      document.querySelectorAll('.presentation-edit-menu').forEach(m => {
        if (m.id !== menuId) m.classList.remove('show');
      });
      
      // Toggle this menu
      if (menu) {
        menu.classList.toggle('show');
      }
    });
  });
  
  // Close menus when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.edit-pen-btn') && !e.target.closest('.presentation-edit-menu')) {
      document.querySelectorAll('.presentation-edit-menu').forEach(m => m.classList.remove('show'));
    }
  });
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

  // Handle "See More" button for expandable templates section - IMPROVED
  const moreBox = document.getElementById("moreTemplates");
  const btn = document.getElementById("toggleMore");

  let open = false;

  if (btn && moreBox) {
    btn.addEventListener("click", () => {
      open = !open;

      if (open) {
        // Expand
        moreBox.classList.add("expanded");
        moreBox.style.maxHeight = moreBox.scrollHeight + "px";
        btn.textContent = "See Less";
        btn.style.marginTop = "30px";
      } else {
        // Collapse
        moreBox.classList.remove("expanded");
        moreBox.style.maxHeight = "0px";
        btn.textContent = "See More";
        btn.style.marginTop = "20px";
      }
    });
  }

  // Make All Template Cards Clickable
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener("click", async () => {
      const templateId = card.dataset.template || card.dataset.templateId;
      if (templateId) {
        await useTemplate(templateId);
      } else if (card.hasAttribute('onclick')) {
        // Let the onclick handler take care of it
      } else {
        console.warn('Template card has no template ID', card);
      }
    });
  });
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

// Helper function to update a presentation
function updatePresentation(id, updated) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const isGuest = localStorage.getItem('guest') === 'true';
  
  let storageKey = '';
  if (currentUser) {
    storageKey = `presentations_${currentUser.username}`;
  } else if (isGuest) {
    storageKey = 'presentations_guest';
  } else {
    console.error('No user found for updating presentation');
    return;
  }
  
  let recents = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  recents = recents.map(p => {
    if (p.id === id) return {...p, ...updated};
    return p;
  });
  
  localStorage.setItem(storageKey, JSON.stringify(recents));
  renderRecentPresentations();
  
  console.log('Presentation updated:', id, updated);
}

// Helper function to render recent presentations
function renderRecentPresentations() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const userID = currentUser?.userID || currentUser?.email;
  
  // Call sidebar reload function
  if (typeof loadSidebarData === 'function') {
    try {
      loadSidebarData();
    } catch (e) {
      console.warn('Could not reload sidebar:', e);
    }
  }
  
  // Also call specific sidebar presentation loader if available
  if (typeof loadRecentPresentationsSidebar === 'function' && userID) {
    try {
      loadRecentPresentationsSidebar(userID);
    } catch (e) {
      console.warn('Could not reload presentations sidebar:', e);
    }
  }
}

// Toggle edit menu
function toggleEditMenu(event, menuId) {
  event.stopPropagation();
  const menu = document.getElementById(menuId);
  
  // Close all other menus
  document.querySelectorAll('.edit-menu').forEach(m => {
    if (m.id !== menuId) m.classList.remove('show');
  });
  
  // Toggle this menu
  menu.classList.toggle('show');
}

// Close menus when clicking outside
document.addEventListener('click', function() {
  document.querySelectorAll('.edit-menu').forEach(m => m.classList.remove('show'));
});

// Menu action functions
function renamePresentationFromMenu(index, currentTitle) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser) return;
  
  const saved = JSON.parse(localStorage.getItem(`presentations_${currentUser.username}`) || '[]');
  const sorted = saved.sort((a, b) => new Date(b.date) - new Date(a.date));
  const pres = sorted[index];
  
  if (!pres) return;
  
  const newTitle = prompt('Enter new name:', currentTitle);
  if (newTitle && newTitle.trim() !== '' && newTitle !== currentTitle) {
    updatePresentation(pres.id, { title: newTitle.trim() });
    loadRecentPresentations();
  }
  
  // Close menu
  document.querySelectorAll('.edit-menu').forEach(m => m.classList.remove('show'));
}

function duplicatePresentationFromMenu(index) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser) return;
  
  const saved = JSON.parse(localStorage.getItem(`presentations_${currentUser.username}`) || '[]');
  const sorted = saved.sort((a, b) => new Date(b.date) - new Date(a.date));
  const pres = sorted[index];
  
  if (!pres) return;
  
  const duplicate = {
    ...pres,
    id: crypto.randomUUID ? crypto.randomUUID() : `pres-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: `${pres.title || 'Untitled'} (Copy)`,
    date: new Date().toISOString()
  };
  
  saved.push(duplicate);
  localStorage.setItem(`presentations_${currentUser.username}`, JSON.stringify(saved));
  loadRecentPresentations();
  
  // Close menu
  document.querySelectorAll('.edit-menu').forEach(m => m.classList.remove('show'));
}

function sharePresentationFromMenu(id) {
  // Simple share functionality
  const shareUrl = `${window.location.origin}/blank.html?share=${id}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Share Presentation',
      url: shareUrl
    }).catch(err => console.log('Share cancelled'));
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {
      prompt('Copy this link:', shareUrl);
    });
  }
  
  // Close menu
  document.querySelectorAll('.edit-menu').forEach(m => m.classList.remove('show'));
}

function deletePresentationFromMenu(index) {
  const confirmDelete = confirm('Are you sure you want to delete this presentation?');
  if (!confirmDelete) return;
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser) return;
  
  const saved = JSON.parse(localStorage.getItem(`presentations_${currentUser.username}`) || '[]');
  const sorted = saved.sort((a, b) => new Date(b.date) - new Date(a.date));
  const pres = sorted[index];
  
  if (!pres) return;
  
  // Find and remove from original array
  const originalIndex = saved.findIndex(p => p.id === pres.id);
  if (originalIndex !== -1) {
    saved.splice(originalIndex, 1);
    localStorage.setItem(`presentations_${currentUser.username}`, JSON.stringify(saved));
    loadRecentPresentations();
  }
  
  // Close menu
  document.querySelectorAll('.edit-menu').forEach(m => m.classList.remove('show'));
  document.querySelectorAll('.presentation-edit-menu').forEach(m => m.classList.remove('show'));
}

function presentPresentationFromMenu(id) {
  if (!id || id === 'undefined') {
    console.error('No presentation ID provided:', id);
    alert('Unable to present this presentation. Please try again.');
    return;
  }
  
  // Close all menus
  document.querySelectorAll('.presentation-edit-menu').forEach(m => m.classList.remove('show'));
  
  console.log('Presenting presentation with ID:', id);
  window.location.href = `slide-editor.html?id=${id}&present=true`;
}

// Present presentation function
function presentPresentation(id) {
  if (!id || id === 'undefined') {
    console.error('No presentation ID provided or ID is undefined:', id);
    alert('Unable to present this presentation. Please try again.');
    return;
  }
  console.log('Presenting presentation with ID:', id);
  window.location.href = `slide-editor.html?id=${id}&present=true`;
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
    if (editData && editData.id) {
      // Use the new updatePresentation helper
      updatePresentation(editData.id, { title: newName.trim() });
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
          id: crypto.randomUUID ? crypto.randomUUID() : `pres-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
window.updatePresentation = updatePresentation;
window.renderRecentPresentations = renderRecentPresentations;
window.presentPresentation = presentPresentation;
window.presentPresentationFromMenu = presentPresentationFromMenu;
window.toggleEditMenu = toggleEditMenu;
window.renamePresentationFromMenu = renamePresentationFromMenu;
window.duplicatePresentationFromMenu = duplicatePresentationFromMenu;
window.sharePresentationFromMenu = sharePresentationFromMenu;
window.deletePresentationFromMenu = deletePresentationFromMenu;
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

