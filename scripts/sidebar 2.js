// ============================================
// Global Sidebar Logic - Used across all pages
// ============================================

// Toggle sidebar visibility
function toggleSidebar() {
  const mainSidebar = document.getElementById('mainSidebar');
  if (mainSidebar) {
    mainSidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed');
  }
}

// Toggle section expand/collapse
function toggleSection(sectionId) {
  const header = document.querySelector(`#${sectionId}-arrow`)?.closest('.section-header');
  const content = document.getElementById(`${sectionId}-content`);
  const arrow = document.getElementById(`${sectionId}-arrow`);

  if (!header || !content || !arrow) return;

  if (content.classList.contains('expanded')) {
    content.classList.remove('expanded');
    header.classList.remove('active');
  } else {
    content.classList.add('expanded');
    header.classList.add('active');
  }
}

// Load sidebar data from database
function loadSidebarData() {
  if (typeof Database === 'undefined') {
    console.error('Database module not loaded');
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!currentUser.userID) {
    console.warn('No user logged in');
    return;
  }

  // Load Groups
  loadRecentGroupsSidebar(currentUser.userID);
  
  // Load Presentations
  loadRecentPresentationsSidebar(currentUser.userID);
  
  // Load Templates
  loadTemplatesSidebar(currentUser.userID);
}

function loadRecentGroupsSidebar(userID) {
  const userGroups = Database.getGroupsByUser(userID);
  const recents = Database.getRecents(userID);
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

  const container = document.getElementById('recent-groups');
  const seeMoreLink = document.getElementById('groups-see-more');
  
  if (!container) return;

  container.innerHTML = '';

  if (sortedGroups.length === 0) {
    const emptyItem = document.createElement('div');
    emptyItem.className = 'recent-item';
    emptyItem.style.color = 'rgba(255, 255, 255, 0.5)';
    emptyItem.innerHTML = '<span>No groups yet</span>';
    container.appendChild(emptyItem);
    if (seeMoreLink) seeMoreLink.style.display = 'none';
    return;
  }

  sortedGroups.slice(0, 3).forEach((group, index) => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    // Store groupID for edit functions
    const groupID = group.groupID;
    item.innerHTML = `
      <i class="fas fa-folder"></i>
      <span class="recent-item-name">${escapeHtml(group.groupName || 'Unnamed Group')}</span>
      <div class="recent-actions">
        <button class="recent-item-edit" onclick="event.stopPropagation(); toggleEditDropdownSidebar(event, 'group', '${groupID}')" title="Edit">
          <i class="fas fa-pencil-alt"></i>
        </button>
        <div class="edit-dropdown hidden" data-type="group" data-groupid="${groupID}">
          <div class="group-info-display">
            <div class="group-info-item">
              <span class="group-info-label">Title:</span>
              <span class="group-info-value">${escapeHtml(group.groupName || 'Unnamed Group')}</span>
            </div>
            <div class="group-info-item">
              <span class="group-info-label">Created:</span>
              <span class="group-info-value">${group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'Unknown'}</span>
            </div>
            <div class="group-info-item">
              <span class="group-info-label">Members:</span>
              <span class="group-info-value">${(group.members || []).length}</span>
            </div>
          </div>
          <div class="edit-dropdown-divider"></div>
          <button class="edit-dropdown-item" onclick="event.stopPropagation(); handleRenameSidebar('group', '${groupID}')">
            <i class="fas fa-edit"></i>
            <span>Rename</span>
          </button>
          <button class="edit-dropdown-item" onclick="event.stopPropagation(); handleDuplicateSidebar('group', '${groupID}')">
            <i class="fas fa-copy"></i>
            <span>Duplicate</span>
          </button>
          <button class="edit-dropdown-item" onclick="event.stopPropagation(); handleShareSidebar('group', '${groupID}')">
            <i class="fas fa-share"></i>
            <span>Share</span>
          </button>
          <div class="edit-dropdown-divider"></div>
          <button class="edit-dropdown-item edit-dropdown-item-danger" onclick="event.stopPropagation(); handleDeleteSidebar('group', '${groupID}')">
            <i class="fas fa-trash"></i>
            <span>Delete</span>
          </button>
        </div>
      </div>
    `;
    item.onclick = () => window.location.href = `./groups.html?group=${group.groupID}`;
    container.appendChild(item);
  });

  if (sortedGroups.length > 3 && seeMoreLink) {
    seeMoreLink.style.display = 'block';
  }
}

function loadRecentPresentationsSidebar(userID) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const isGuest = localStorage.getItem('guest') === 'true';
  let saved = [];
  
  if (currentUser) {
    saved = JSON.parse(localStorage.getItem(`presentations_${currentUser.username}`) || '[]');
  } else if (isGuest) {
    saved = JSON.parse(localStorage.getItem('presentations_guest') || '[]');
  }

  const container = document.getElementById('recent-presentations');
  const seeMoreLink = document.getElementById('presentations-see-more');
  
  if (!container) return;

  container.innerHTML = '';

  if (saved.length === 0) {
    const emptyItem = document.createElement('div');
    emptyItem.className = 'recent-item';
    emptyItem.style.color = 'rgba(255, 255, 255, 0.5)';
    emptyItem.innerHTML = '<span>No presentations yet</span>';
    container.appendChild(emptyItem);
    if (seeMoreLink) seeMoreLink.style.display = 'none';
    return;
  }

  // Sort by date (newest first)
  const sorted = saved.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  sorted.slice(0, 3).forEach(pres => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.innerHTML = `
      <i class="fas fa-file"></i>
      <span class="recent-item-name">${escapeHtml(pres.title || 'Untitled')}</span>
    `;
    item.onclick = () => {
      sessionStorage.setItem('loadPresentation', JSON.stringify(pres));
      window.location.href = './blank.html';
    };
    container.appendChild(item);
  });

  if (sorted.length > 3 && seeMoreLink) {
    seeMoreLink.style.display = 'block';
  }
}

function loadTemplatesSidebar(userID) {
  const allTemplates = Database.getAllTemplates();
  const userRecents = Database.getRecents(userID);
  const recentTemplateIDs = userRecents.recentTemplates || [];
  
  const categoriesContainer = document.getElementById('template-categories');
  const recentContainer = document.getElementById('recent-templates');
  
  if (!categoriesContainer || !recentContainer) return;

  // Clear existing items
  categoriesContainer.innerHTML = '';
  recentContainer.innerHTML = '';
  
  // Group templates by category
  const templatesByCategory = {};
  allTemplates.forEach(template => {
    const category = template.category || 'general';
    if (!templatesByCategory[category]) {
      templatesByCategory[category] = [];
    }
    templatesByCategory[category].push(template);
  });

  // Display categories
  Object.keys(templatesByCategory).forEach(category => {
    const categoryItem = document.createElement('div');
    categoryItem.className = 'template-category';
    categoryItem.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    categoryItem.onclick = () => window.location.href = `./templates.html?category=${category}`;
    categoriesContainer.appendChild(categoryItem);
  });

  // Display recent templates (up to 3)
  const recentTemplates = recentTemplateIDs
    .map(id => allTemplates.find(t => t.templateID === id))
    .filter(t => t !== undefined)
    .slice(0, 3);

  if (recentTemplates.length === 0) {
    const emptyItem = document.createElement('div');
    emptyItem.className = 'recent-item';
    emptyItem.style.color = 'rgba(255, 255, 255, 0.5)';
    emptyItem.innerHTML = '<span>No recent templates</span>';
    recentContainer.appendChild(emptyItem);
    return;
  }

  recentTemplates.forEach(template => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.innerHTML = `
      <i class="fas fa-image"></i>
      <span class="recent-item-name">${escapeHtml(template.templateName || 'Unnamed Template')}</span>
    `;
    item.onclick = () => window.location.href = `./templates.html?template=${template.templateID}`;
    recentContainer.appendChild(item);
  });
}

// Helper function
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize sidebar on page load
document.addEventListener('DOMContentLoaded', () => {
  // Setup sidebar toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    });
  }

  // Expand all sections by default
  ['presentations', 'templates', 'groups'].forEach(sectionId => {
    const header = document.querySelector(`#${sectionId}-arrow`)?.closest('.section-header');
    const content = document.getElementById(`${sectionId}-content`);
    if (header && content) {
      content.classList.add('expanded');
      header.classList.add('active');
    }
  });

  // Load data from database
  loadSidebarData();
});

// ============================================
// Sidebar Edit Dropdown Functions
// ============================================

function toggleEditDropdownSidebar(event, type, id) {
  event.stopPropagation();
  
  // Close all other dropdowns first
  document.querySelectorAll('.edit-dropdown').forEach(dropdown => {
    if (dropdown !== event.target.closest('.recent-actions')?.querySelector('.edit-dropdown')) {
      dropdown.classList.add('hidden');
    }
  });
  
  // Toggle the clicked dropdown
  const dropdown = event.target.closest('.recent-actions')?.querySelector('.edit-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}

function handleRenameSidebar(type, id) {
  document.querySelectorAll('.edit-dropdown').forEach(d => d.classList.add('hidden'));
  
  if (type === 'group' && typeof Database !== 'undefined') {
    const group = Database.getGroupByID(id);
    if (!group) return;
    
    const newName = prompt('Rename group:', group.groupName || 'Unnamed Group');
    if (!newName || newName.trim() === '' || newName === group.groupName) return;
    
    Database.updateGroup(id, { groupName: newName.trim() });
    if (typeof loadSidebarData === 'function') {
      loadSidebarData();
    } else {
      location.reload();
    }
  }
}

function handleDuplicateSidebar(type, id) {
  document.querySelectorAll('.edit-dropdown').forEach(d => d.classList.add('hidden'));
  
  if (type === 'group' && typeof Database !== 'undefined') {
    const group = Database.getGroupByID(id);
    if (!group) return;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      const userID = currentUser.userID || currentUser.email;
      const newGroup = Database.createGroup({
        groupName: `${group.groupName || 'Unnamed Group'} (Copy)`,
        createdBy: userID,
        members: [...(group.members || [])],
        roles: [...(group.roles || [])],
        slides: []
      });
      Database.addRecentGroup(userID, newGroup.groupID);
      if (typeof loadSidebarData === 'function') {
        loadSidebarData();
      } else {
        location.reload();
      }
    }
  }
}

function handleShareSidebar(type, id) {
  document.querySelectorAll('.edit-dropdown').forEach(d => d.classList.add('hidden'));
  
  if (type === 'group' && typeof Database !== 'undefined') {
    const group = Database.getGroupByID(id);
    if (!group) return;
    
    const shareLink = `${window.location.origin}${window.location.pathname.replace('groups.html', 'groups.html')}?group=${id}`;
    
    if (navigator.share) {
      navigator.share({
        title: group.groupName || 'Unnamed Group',
        text: `Join my group: ${group.groupName || 'Unnamed Group'}`,
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

function handleDeleteSidebar(type, id) {
  document.querySelectorAll('.edit-dropdown').forEach(d => d.classList.add('hidden'));
  
  if (type === 'group' && typeof Database !== 'undefined') {
    const group = Database.getGroupByID(id);
    if (!group) return;
    
    if (!confirm(`Are you sure you want to delete "${group.groupName || 'Unnamed Group'}"? This action cannot be undone.`)) {
      return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      const userID = currentUser.userID || currentUser.email;
      const recents = Database.getRecents(userID);
      recents.recentGroups = (recents.recentGroups || []).filter(gid => gid !== id);
      Database.updateRecents(userID, recents);
      if (typeof loadSidebarData === 'function') {
        loadSidebarData();
      } else {
        location.reload();
      }
    }
  }
}

// Export functions for global use
window.toggleSidebar = toggleSidebar;
window.toggleSection = toggleSection;
window.loadSidebarData = loadSidebarData;
window.toggleEditDropdownSidebar = toggleEditDropdownSidebar;
window.handleRenameSidebar = handleRenameSidebar;
window.handleDuplicateSidebar = handleDuplicateSidebar;
window.handleShareSidebar = handleShareSidebar;
window.handleDeleteSidebar = handleDeleteSidebar;

