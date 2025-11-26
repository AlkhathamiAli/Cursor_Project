// ============================================
// Groups Page - Slide Management
// ============================================

let currentGroupID = null;
let currentSlideID = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Database
  if (typeof Database !== 'undefined') {
    Database.init();
  }

  // Get group ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentGroupID = urlParams.get('group');

  if (currentGroupID) {
    loadGroup(currentGroupID);
  } else {
    // If no group ID, show groups list or redirect
    window.location.href = './Home.html';
  }

  // Setup slide strip scrolling with mouse wheel
  setupSlideStripScrolling();
});

// ============================================
// Group Loading
// ============================================

function loadGroup(groupID) {
  if (typeof Database === 'undefined') {
    console.error('Database module not loaded');
    alert('Database module not loaded. Please refresh the page.');
    return;
  }

  if (!groupID) {
    console.error('No group ID provided');
    alert('No group ID provided. Redirecting to home page.');
    window.location.href = './Home.html';
    return;
  }

  console.log('Loading group with ID:', groupID);
  const group = Database.getGroupByID(groupID);
  
  if (!group) {
    console.error('Group not found with ID:', groupID);
    console.log('Available groups:', Database.getAllGroups());
    alert(`Group not found (ID: ${groupID}). Redirecting to home page.`);
    window.location.href = './Home.html';
    return;
  }
  
  console.log('Group loaded successfully:', group);

  currentGroupID = groupID;

  // Update UI
  document.getElementById('groupName').textContent = group.groupName || 'Unnamed Group';
  document.getElementById('groupCreated').textContent = formatDate(group.createdAt);
  document.getElementById('groupMembersCount').textContent = (group.members || []).length;
  document.getElementById('groupStatus').textContent = 'Active';

  // Load members
  loadMembers(group.members || []);

  // Load slides
  loadSlides(group.slides || []);
}

// ============================================
// Members Management
// ============================================

function loadMembers(members) {
  const membersList = document.getElementById('membersList');
  if (!membersList) return;

  membersList.innerHTML = '';

  if (members.length === 0) {
    membersList.innerHTML = '<span style="color: rgba(255,255,255,0.5);">No members</span>';
    return;
  }

  members.forEach(memberID => {
    const user = Database.getUserByID(memberID);
    if (!user) return;

    const avatar = document.createElement('div');
    avatar.className = 'member-avatar';
    avatar.title = user.fullName || user.email;
    
    if (user.avatar) {
      avatar.innerHTML = `<img src="${user.avatar}" alt="${user.fullName}" />`;
    } else {
      const initial = (user.fullName || user.email || 'U')[0].toUpperCase();
      avatar.textContent = initial;
    }

    membersList.appendChild(avatar);
  });
}

// ============================================
// Slides Management
// ============================================

function loadSlides(slides) {
  const slideStrip = document.getElementById('slideStrip');
  const slideCount = document.getElementById('slideCount');
  
  if (!slideStrip) return;

  slideStrip.innerHTML = '';

  // Update count
  if (slideCount) {
    slideCount.textContent = `${slides.length} ${slides.length === 1 ? 'slide' : 'slides'}`;
  }

  // Render each slide
  slides.forEach((slide, index) => {
    const slideThumb = createSlideThumbnail(slide, index + 1);
    slideStrip.appendChild(slideThumb);
  });

  // Add "New Slide" button
  const newSlideBtn = document.createElement('div');
  newSlideBtn.className = 'new-slide-btn';
  newSlideBtn.innerHTML = '<i class="fas fa-plus"></i><span>New Slide</span>';
  newSlideBtn.onclick = createNewSlide;
  slideStrip.appendChild(newSlideBtn);
}


// ============================================
// Create New Slide
// ============================================

function createNewSlide() {
  if (!currentGroupID) return;

  const group = Database.getGroupByID(currentGroupID);
  if (!group) return;

  const slides = group.slides || [];
  const newSlide = {
    id: `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: `Slide ${slides.length + 1}`,
    owner: null,
    status: 'in-progress',
    content: {}
  };

  slides.push(newSlide);
  Database.updateGroup(currentGroupID, { slides });

  // Prepare slide data for blank.html
  const slideData = {
    id: newSlide.id,
    title: newSlide.title,
    content: newSlide.content || {},
    groupID: currentGroupID,
    slideID: newSlide.id,
    owner: newSlide.owner,
    status: newSlide.status
  };
  
  // Store in sessionStorage for blank.html to load
  sessionStorage.setItem('loadPresentation', JSON.stringify(slideData));
  sessionStorage.setItem('groupID', currentGroupID);
  sessionStorage.setItem('slideID', newSlide.id);
  
  // Open blank.html to edit the new slide
  window.location.href = './blank.html';
}

// ============================================
// Slide Modal
// ============================================

function openSlideModal(slideID) {
  if (!currentGroupID) return;

  const group = Database.getGroupByID(currentGroupID);
  if (!group) return;

  const slide = (group.slides || []).find(s => s.id === slideID);
  if (!slide) return;

  currentSlideID = slideID;

  // Populate modal
  document.getElementById('slideTitleInput').value = slide.title || '';
  
  // Populate owner select
  const ownerSelect = document.getElementById('slideOwnerSelect');
  ownerSelect.innerHTML = '<option value="">Unassigned</option>';
  
  (group.members || []).forEach(memberID => {
    const member = Database.getUserByID(memberID);
    if (member) {
      const option = document.createElement('option');
      option.value = memberID;
      option.textContent = member.fullName || member.email;
      option.selected = slide.owner === memberID;
      ownerSelect.appendChild(option);
    }
  });

  // Set status
  document.getElementById('slideStatusSelect').value = slide.status || 'in-progress';

  // Show modal
  document.getElementById('slideModal').style.display = 'flex';
}

function closeSlideModal() {
  document.getElementById('slideModal').style.display = 'none';
  currentSlideID = null;
}

function saveSlideChanges() {
  if (!currentGroupID || !currentSlideID) return;

  const group = Database.getGroupByID(currentGroupID);
  if (!group) return;

  const slides = group.slides || [];
  const slideIndex = slides.findIndex(s => s.id === currentSlideID);
  if (slideIndex === -1) return;

  // Update slide
  slides[slideIndex] = {
    ...slides[slideIndex],
    title: document.getElementById('slideTitleInput').value || `Slide ${slideIndex + 1}`,
    owner: document.getElementById('slideOwnerSelect').value || null,
    status: document.getElementById('slideStatusSelect').value || 'in-progress'
  };

  Database.updateGroup(currentGroupID, { slides });

  // Reload slides
  loadSlides(slides);

  // Close modal
  closeSlideModal();
}

function deleteCurrentSlide() {
  if (!currentGroupID || !currentSlideID) return;

  if (!confirm('Are you sure you want to delete this slide?')) return;

  const group = Database.getGroupByID(currentGroupID);
  if (!group) return;

  const slides = (group.slides || []).filter(s => s.id !== currentSlideID);
  Database.updateGroup(currentGroupID, { slides });

  // Reload slides
  loadSlides(slides);

  // Close modal
  closeSlideModal();
}

// ============================================
// Slide Editor Navigation
// ============================================

function openSlideEditor(slideID) {
  if (!currentGroupID || !slideID) return;
  
  // Get slide data from group
  const group = Database.getGroupByID(currentGroupID);
  if (!group) return;
  
  const slide = (group.slides || []).find(s => s.id === slideID);
  if (!slide) return;
  
  // Prepare slide data for blank.html
  const slideData = {
    id: slide.id,
    title: slide.title || `Slide ${slideID}`,
    content: slide.content || {},
    groupID: currentGroupID,
    slideID: slideID,
    owner: slide.owner,
    status: slide.status
  };
  
  // Store in sessionStorage for blank.html to load
  sessionStorage.setItem('loadPresentation', JSON.stringify(slideData));
  sessionStorage.setItem('groupID', currentGroupID);
  sessionStorage.setItem('slideID', slideID);
  
  // Open blank.html
  window.location.href = './blank.html';
}

// Update slide thumbnail click to open editor
function createSlideThumbnail(slide, slideNumber) {
  const thumb = document.createElement('div');
  thumb.className = 'group-slide-thumb';
  thumb.onclick = (e) => {
    // If clicking on assign badge, open modal
    if (e.target.closest('.assign-badge')) {
      e.stopPropagation();
      openSlideModal(slide.id);
      return;
    }
    // Otherwise, open editor
    openSlideEditor(slide.id);
  };

  // Get owner info
  let ownerAvatar = '';
  if (slide.owner) {
    const owner = Database.getUserByID(slide.owner);
    if (owner) {
      if (owner.avatar) {
        ownerAvatar = `<img class="slide-owner-avatar" src="${owner.avatar}" alt="${owner.fullName}" />`;
      } else {
        const initial = (owner.fullName || owner.email || 'U')[0].toUpperCase();
        ownerAvatar = `<div class="slide-owner-avatar">${initial}</div>`;
      }
    }
  } else {
    ownerAvatar = '<div class="assign-badge" title="Edit slide"><i class="fas fa-pencil-alt"></i></div>';
  }

  const statusClass = slide.status || 'in-progress';
  const statusText = statusClass === 'completed' ? 'Completed' : 'In Progress';

  thumb.innerHTML = `
    <div class="slide-preview"></div>
    <div class="slide-status ${statusClass}">${statusText}</div>
    <div class="slide-meta">
      <span class="slide-number">${slide.title || `Slide ${slideNumber}`}</span>
      ${ownerAvatar}
    </div>
  `;

  // Add context menu for slide options
  thumb.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    openSlideModal(slide.id);
  });

  return thumb;
}

// ============================================
// Slide Strip Scrolling
// ============================================

function setupSlideStripScrolling() {
  const slideStrip = document.getElementById('slideStrip');
  if (!slideStrip) return;

  // Mouse wheel scrolling
  slideStrip.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      slideStrip.scrollLeft += e.deltaY;
    }
  });

  // Trackpad support
  slideStrip.addEventListener('touchstart', (e) => {
    slideStrip.dataset.startX = e.touches[0].clientX;
    slideStrip.dataset.scrollLeft = slideStrip.scrollLeft;
  });

  slideStrip.addEventListener('touchmove', (e) => {
    if (!slideStrip.dataset.startX) return;
    const x = e.touches[0].clientX;
    const walk = (slideStrip.dataset.startX - x) * 2;
    slideStrip.scrollLeft = parseInt(slideStrip.dataset.scrollLeft) + walk;
  });
}

// ============================================
// Group Management
// ============================================

function createNewGroup() {
  // Check if user is logged in before opening modal
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const isGuest = localStorage.getItem('guest') === 'true';
  
  if (!currentUser && !isGuest) {
    alert('Please log in to create a group');
    return;
  }
  
  const modal = document.getElementById('newGroupModal');
  const input = document.getElementById('newGroupName');
  
  if (modal) {
    modal.style.display = 'flex';
    // Focus input after modal animation
    setTimeout(() => {
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  } else {
    console.error('New group modal not found');
  }
}

function closeNewGroupModal() {
  document.getElementById('newGroupModal').style.display = 'none';
  document.getElementById('newGroupName').value = '';
}

// Helper function to save group to recent groups
function saveGroup(group) {
  if (!group || !group.groupID) {
    console.error('Invalid group data:', group);
    return;
  }
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const userID = currentUser?.userID || currentUser?.email;
  
  if (!userID) {
    console.error('No user ID found for saving group');
    return;
  }
  
  // Ensure group has required structure
  const groupToSave = {
    groupID: group.groupID,
    name: group.groupName || group.name || 'Unnamed Group',
    createdAt: group.createdAt || new Date().toISOString(),
    members: group.members || []
  };
  
  try {
    // Add to Database recents
    if (typeof Database !== 'undefined') {
      Database.addRecentGroup(userID, groupToSave.groupID);
      console.log('Group saved to recents:', groupToSave.groupID);
    }
  } catch (e) {
    console.error('Error saving group:', e);
  }
}

// Helper function to render recent groups
function renderRecentGroups() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const userID = currentUser?.userID || currentUser?.email;
  
  if (!userID) {
    console.warn('No user ID found for rendering groups');
    return;
  }
  
  // Call sidebar reload function
  if (typeof loadSidebarData === 'function') {
    try {
      loadSidebarData();
    } catch (e) {
      console.warn('Could not reload sidebar:', e);
    }
  }
  
  // Also call specific sidebar group loader if available
  if (typeof loadRecentGroupsSidebar === 'function') {
    try {
      loadRecentGroupsSidebar(userID);
    } catch (e) {
      console.warn('Could not reload groups sidebar:', e);
    }
  }
}

function createGroup() {
  const groupName = document.getElementById('newGroupName').value.trim();
  if (!groupName) {
    alert('Please enter a group name');
    return;
  }

  // Check for current user - try multiple ways
  let currentUserStr = localStorage.getItem('currentUser');
  let currentUser = null;
  
  // Try to parse currentUser
  if (currentUserStr) {
    try {
      currentUser = JSON.parse(currentUserStr);
      // Check if it's an empty object
      if (currentUser && Object.keys(currentUser).length === 0) {
        currentUser = null;
      }
    } catch (e) {
      console.warn('Error parsing currentUser:', e);
      currentUser = null;
    }
  }
  
  const isGuest = localStorage.getItem('guest') === 'true';
  
  // If no currentUser but guest, create a guest user object
  if (!currentUser && isGuest) {
    currentUser = {
      userID: 'guest',
      email: 'guest@slidemaker.com',
      fullName: 'Guest',
      username: 'guest'
    };
  }
  
  // If still no user, check if user might be stored differently
  if (!currentUser) {
    // Try to get user from Database if email is available
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail && typeof Database !== 'undefined') {
      currentUser = Database.getUserByEmail(userEmail);
    }
  }
  
  // Final check - if still no user, show error with debug info
  if (!currentUser) {
    console.error('User authentication check failed:');
    console.error('- currentUser in localStorage:', currentUserStr);
    console.error('- guest status:', isGuest);
    console.error('- All localStorage keys:', Object.keys(localStorage));
    alert('Please log in to create a group. If you are logged in, please try logging out and back in.');
    return;
  }

  if (typeof Database === 'undefined') {
    alert('Database module not loaded. Please refresh the page.');
    return;
  }

  // Get user identifier - prefer userID, fallback to email
  const userID = currentUser.userID || currentUser.email;
  if (!userID) {
    alert('Unable to identify user. Please log in again.');
    console.error('User object missing ID:', currentUser);
    return;
  }

  const newGroup = Database.createGroup({
    groupName,
    createdBy: userID,
    members: [userID],
    roles: [{ userID: userID, role: 'admin' }],
    slides: []
  });

  // Save group to recent groups using helper function
  saveGroup(newGroup);
  
  // Render recent groups to update UI
  renderRecentGroups();
  
  console.log('Group created successfully:', newGroup);

  // Close modal
  closeNewGroupModal();

  // Redirect to the new group
  window.location.href = `./groups.html?group=${newGroup.groupID}`;
}

function showGroupSettings() {
  // TODO: Implement group settings modal
  alert('Group settings coming soon');
}

// ============================================
// Utility Functions
// ============================================

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Make functions globally available
window.createNewSlide = createNewSlide;
window.openSlideModal = openSlideModal;
window.closeSlideModal = closeSlideModal;
window.saveSlideChanges = saveSlideChanges;
window.deleteCurrentSlide = deleteCurrentSlide;
window.createNewGroup = createNewGroup;
window.closeNewGroupModal = closeNewGroupModal;
window.createGroup = createGroup;
window.saveGroup = saveGroup;
window.renderRecentGroups = renderRecentGroups;
window.showGroupSettings = showGroupSettings;

