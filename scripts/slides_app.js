// ============================================
// Group Slide Editor - Main JavaScript
// ============================================

// Global State
const storageKey = 'slides.web.v2';
let slides = [];
let selectedId = null;
let fileName = 'Untitled presentation';
let isGroupMode = false;
let currentGroupID = null;
let currentSlideID = null;
let currentGroup = null;
let groupMembers = [];
let currentUser = null;

// DOM Elements
const el = (id) => document.getElementById(id);
const app = document.getElementById('app');
const slidesEl = el('slidesVertical');
const slidesStripEl = el('slidesStrip');
const titleEl = el('title');
const contentEl = el('content');
const countVerticalEl = el('countVertical');
const countHorizontalEl = el('countHorizontal');
const fileNameEl = el('fileName');
const saveNotification = el('saveNotification');
const exportModal = el('exportModal');
const exportNameInput = el('exportName');
const exportSaveButton = el('exportSaveButton');
const backToGroupBtn = el('backToGroupBtn');
const collaborationBar = el('collaborationBar');
const membersAvatars = el('membersAvatars');
const currentEditorEl = el('currentEditor');
const slideOwnerNameEl = el('slideOwnerName');
const statusSelectTop = el('statusSelectTop');
const commentPanel = el('commentPanel');
const commentsList = el('commentsList');
const commentInput = el('commentInput');
const commentSendBtn = el('commentSendBtn');

// ============================================
// Initialization
// ============================================

function init() {
  // Check for group mode
  const urlParams = new URLSearchParams(window.location.search);
  currentGroupID = urlParams.get('group');
  currentSlideID = urlParams.get('slide');

  if (currentGroupID) {
    activateGroupMode();
  } else {
    activateNormalMode();
  }

  // Initialize Database
  if (typeof Database !== 'undefined') {
    Database.init();
  }

  // Load current user
  const currentUserStr = localStorage.getItem('currentUser');
  if (currentUserStr) {
    try {
      currentUser = JSON.parse(currentUserStr);
    } catch (e) {
      console.warn('Error parsing currentUser:', e);
    }
  }

  // Setup event listeners
  setupEventListeners();

  // Load slides
  if (isGroupMode) {
    loadGroupSlides();
  } else {
    loadNormalSlides();
  }
}

// ============================================
// Mode Activation
// ============================================

function activateGroupMode() {
  isGroupMode = true;
  document.body.classList.add('group-mode');

  if (typeof Database === 'undefined') {
    console.error('Database module not loaded');
    alert('Database module not loaded. Please refresh the page.');
    return;
  }

  currentGroup = Database.getGroupByID(currentGroupID);
  if (!currentGroup) {
    console.error('Group not found:', currentGroupID);
    alert('Group not found. Redirecting to home.');
    window.location.href = './Home.html';
    return;
  }

  // Load group members
  groupMembers = (currentGroup.members || []).map(memberID => {
    const member = Database.getUserByID(memberID);
    return member || { userID: memberID, fullName: memberID, email: memberID };
  });

  // Show group-specific UI elements
  if (backToGroupBtn) backToGroupBtn.style.display = 'flex';
  if (collaborationBar) collaborationBar.style.display = 'flex';
  if (commentPanel) commentPanel.style.display = 'flex';

  // Hide normal mode elements
  const normalModeElements = document.querySelectorAll('.normal-mode-only');
  normalModeElements.forEach(el => el.style.display = 'none');

  // Show group mode elements
  const groupModeElements = document.querySelectorAll('.group-mode-only');
  groupModeElements.forEach(el => el.style.display = 'block');

  // Update collaboration bar
  updateCollaborationBar();
  loadComments();
}

function activateNormalMode() {
  isGroupMode = false;
  document.body.classList.remove('group-mode');

  // Hide group-specific UI elements
  if (backToGroupBtn) backToGroupBtn.style.display = 'none';
  if (collaborationBar) collaborationBar.style.display = 'none';
  if (commentPanel) commentPanel.style.display = 'none';

  // Show normal mode elements
  const normalModeElements = document.querySelectorAll('.normal-mode-only');
  normalModeElements.forEach(el => el.style.display = 'block');

  // Hide group mode elements
  const groupModeElements = document.querySelectorAll('.group-mode-only');
  groupModeElements.forEach(el => el.style.display = 'none');
}

// ============================================
// Group Mode Functions
// ============================================

function loadGroupSlides() {
  if (!currentGroup) return;

  const groupSlides = currentGroup.slides || [];
  slides = groupSlides.map(slide => ({
    id: slide.id,
    title: slide.title || 'Untitled Slide',
    content: slide.content?.html || slide.content?.text || ''
  }));

  if (slides.length === 0) {
    // Create initial slide if none exist
    const newSlide = {
      id: `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'Slide 1',
      owner: null,
      status: 'in-progress',
      content: {}
    };
    slides.push({
      id: newSlide.id,
      title: newSlide.title,
      content: ''
    });
    currentGroup.slides = [newSlide];
    Database.updateGroup(currentGroupID, { slides: currentGroup.slides });
  }

  // Load current slide if specified
  if (currentSlideID) {
    const slideIndex = slides.findIndex(s => s.id === currentSlideID);
    if (slideIndex !== -1) {
      selectedId = slides[slideIndex].id;
    } else {
      selectedId = slides[0].id;
    }
  } else {
    selectedId = slides[0].id;
  }

  renderSlides();
  loadCurrentSlide();
}

function loadNormalSlides() {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      slides = data.slides || [];
      fileName = data.fileName || 'Untitled presentation';
      if (fileNameEl) fileNameEl.value = fileName;
      if (slides.length > 0) {
        selectedId = slides[0].id;
      }
    } catch (e) {
      console.error('Error loading slides:', e);
      slides = [];
    }
  }

  if (slides.length === 0) {
    addSlide();
  }

  renderSlides();
  loadCurrentSlide();
}

function updateCollaborationBar() {
  if (!isGroupMode) return;

  // Update member avatars
  if (membersAvatars) {
    membersAvatars.innerHTML = '';
    groupMembers.slice(0, 5).forEach(member => {
      const avatar = document.createElement('div');
      avatar.className = 'member-avatar-small';
      if (member.avatar) {
        const img = document.createElement('img');
        img.src = member.avatar;
        img.alt = member.fullName || member.email;
        avatar.appendChild(img);
      } else {
        const initial = (member.fullName || member.email || 'U')[0].toUpperCase();
        avatar.textContent = initial;
      }
      avatar.title = member.fullName || member.email;
      membersAvatars.appendChild(avatar);
    });
  }

  // Update current editor
  if (currentEditorEl && currentUser) {
    currentEditorEl.textContent = currentUser.fullName || currentUser.email || 'You';
  }

  // Update slide owner
  updateSlideOwnerDisplay();
}

function updateSlideOwnerDisplay() {
  if (!isGroupMode || !currentSlideID) return;

  const slide = (currentGroup.slides || []).find(s => s.id === currentSlideID);
  if (slide && slide.owner) {
    const owner = groupMembers.find(m => (m.userID || m.email) === slide.owner);
    if (slideOwnerNameEl) {
      slideOwnerNameEl.textContent = owner ? (owner.fullName || owner.email) : 'Unknown';
    }
    if (statusSelectTop) {
      statusSelectTop.value = slide.status || 'in-progress';
    }
  } else {
    if (slideOwnerNameEl) slideOwnerNameEl.textContent = 'Unassigned';
  }
}

function goBackToGroup() {
  if (currentGroupID) {
    window.location.href = `./groups.html?group=${currentGroupID}`;
  } else {
    window.location.href = './Home.html';
  }
}

// ============================================
// Slide Management
// ============================================

function renderSlides() {
  if (isGroupMode) {
    renderGroupSlides();
  } else {
    renderNormalSlides();
  }
}

function renderGroupSlides() {
  if (!slidesStripEl) return;

  slidesStripEl.innerHTML = '';

  slides.forEach((slide, index) => {
    const slideData = (currentGroup.slides || []).find(s => s.id === slide.id);
    const thumb = createGroupSlideThumbnail(slide, slideData, index + 1);
    slidesStripEl.appendChild(thumb);
  });

  // Add "New Slide" button
  const newSlideBtn = document.createElement('div');
  newSlideBtn.className = 'new-slide-btn-horizontal';
  newSlideBtn.innerHTML = '<i class="fas fa-plus"></i><span>Add Slide</span>';
  newSlideBtn.onclick = addSlide;
  slidesStripEl.appendChild(newSlideBtn);

  // Update count
  if (countHorizontalEl) {
    countHorizontalEl.textContent = `${slides.length} ${slides.length === 1 ? 'slide' : 'slides'}`;
  }
}

function renderNormalSlides() {
  if (!slidesEl) return;

  slidesEl.innerHTML = '';

  slides.forEach((slide, index) => {
    const item = createNormalSlideItem(slide, index);
    slidesEl.appendChild(item);
  });

  // Update count
  if (countVerticalEl) {
    countVerticalEl.textContent = slides.length;
  }
}

function createGroupSlideThumbnail(slide, slideData, slideNumber) {
  const thumb = document.createElement('div');
  thumb.className = 'slide-thumb-horizontal';
  if (slide.id === selectedId) {
    thumb.classList.add('active');
  }

  // Get owner info
  let ownerAvatar = '';
  if (slideData && slideData.owner) {
    const owner = groupMembers.find(m => (m.userID || m.email) === slideData.owner);
    if (owner) {
      if (owner.avatar) {
        ownerAvatar = `<img class="slide-owner-avatar-thumb" src="${owner.avatar}" alt="${owner.fullName}" />`;
      } else {
        const initial = (owner.fullName || owner.email || 'U')[0].toUpperCase();
        ownerAvatar = `<div class="slide-owner-avatar-thumb">${initial}</div>`;
      }
    }
  }

  const status = slideData?.status || 'in-progress';
  const statusClass = status === 'completed' ? 'completed' : 'in-progress';
  const statusText = status === 'completed' ? 'Done' : 'In Progress';

  thumb.innerHTML = `
    <div class="slide-preview-thumb"></div>
    <div class="slide-status-badge-thumb ${statusClass}">${statusText}</div>
    <div class="slide-meta-horizontal">
      <span class="slide-number-horizontal">${slide.title || `Slide ${slideNumber}`}</span>
      ${ownerAvatar || '<div class="slide-owner-avatar-thumb" style="opacity: 0.5;">?</div>'}
    </div>
  `;

  thumb.onclick = () => selectSlide(slide.id);

  return thumb;
}

function createNormalSlideItem(slide, index) {
  const item = document.createElement('div');
  item.className = 'slide-item-vertical';
  if (slide.id === selectedId) {
    item.classList.add('active');
  }

  item.innerHTML = `
    <div class="slide-thumb-vertical">
      <div class="mini">${slide.content || ''}</div>
    </div>
    <div class="slide-title-vertical">${slide.title || `Slide ${index + 1}`}</div>
  `;

  item.onclick = () => selectSlide(slide.id);

  return item;
}

function selectSlide(id) {
  selectedId = id;
  renderSlides();
  loadCurrentSlide();
  
  if (isGroupMode) {
    currentSlideID = id;
    updateSlideOwnerDisplay();
    loadComments();
  }
}

function loadCurrentSlide() {
  const slide = slides.find(s => s.id === selectedId);
  if (!slide) return;

  if (titleEl) titleEl.value = slide.title || '';
  if (contentEl) {
    contentEl.innerHTML = slide.content || '';
    if (!slide.content) {
      contentEl.textContent = '';
    }
  }
}

function addSlide() {
  const newSlide = {
    id: `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: `Slide ${slides.length + 1}`,
    content: ''
  };

  slides.push(newSlide);
  selectedId = newSlide.id;

  if (isGroupMode) {
    // Add to group
    const groupSlide = {
      id: newSlide.id,
      title: newSlide.title,
      owner: null,
      status: 'in-progress',
      content: {}
    };
    if (!currentGroup.slides) currentGroup.slides = [];
    currentGroup.slides.push(groupSlide);
    Database.updateGroup(currentGroupID, { slides: currentGroup.slides });
    currentSlideID = newSlide.id;
  } else {
    saveSlides();
  }

  renderSlides();
  loadCurrentSlide();
}

function duplicateSlide() {
  const slide = slides.find(s => s.id === selectedId);
  if (!slide) return;

  const newSlide = {
    id: `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: `${slide.title} (Copy)`,
    content: slide.content
  };

  const currentIndex = slides.findIndex(s => s.id === selectedId);
  slides.splice(currentIndex + 1, 0, newSlide);
  selectedId = newSlide.id;

  if (isGroupMode) {
    const groupSlide = {
      id: newSlide.id,
      title: newSlide.title,
      owner: null,
      status: 'in-progress',
      content: { html: newSlide.content, text: contentEl?.textContent || '' }
    };
    if (!currentGroup.slides) currentGroup.slides = [];
    currentGroup.slides.splice(currentIndex + 1, 0, groupSlide);
    Database.updateGroup(currentGroupID, { slides: currentGroup.slides });
    currentSlideID = newSlide.id;
  } else {
    saveSlides();
  }

  renderSlides();
  loadCurrentSlide();
}

function deleteSlide() {
  if (slides.length <= 1) {
    alert('Cannot delete the last slide.');
    return;
  }

  if (!confirm('Are you sure you want to delete this slide?')) return;

  const index = slides.findIndex(s => s.id === selectedId);
  slides.splice(index, 1);

  if (isGroupMode) {
    currentGroup.slides = currentGroup.slides.filter(s => s.id !== selectedId);
    Database.updateGroup(currentGroupID, { slides: currentGroup.slides });
    currentSlideID = null;
  } else {
    saveSlides();
  }

  selectedId = slides[0].id;
  renderSlides();
  loadCurrentSlide();
}

// ============================================
// Save Functions
// ============================================

function saveSlides() {
  if (isGroupMode) {
    saveGroupSlide();
  } else {
    saveNormalSlides();
  }
}

function saveGroupSlide() {
  if (!currentGroupID || !currentSlideID || typeof Database === 'undefined') return;

  const slide = slides.find(s => s.id === selectedId);
  if (!slide) return;

  const groupSlide = (currentGroup.slides || []).find(s => s.id === currentSlideID);
  if (!groupSlide) return;

  // Update slide data
  groupSlide.title = titleEl?.value || slide.title;
  groupSlide.content = {
    html: contentEl?.innerHTML || '',
    text: contentEl?.textContent || ''
  };
  groupSlide.owner = groupSlide.owner || null;
  groupSlide.status = statusSelectTop?.value || groupSlide.status || 'in-progress';
  groupSlide.updatedAt = new Date().toISOString();

  // Update local slide
  slide.title = groupSlide.title;
  slide.content = groupSlide.content.html;

  Database.updateGroup(currentGroupID, { slides: currentGroup.slides });
  showToast('Slide saved to group');
}

function saveNormalSlides() {
  const data = {
    slides: slides,
    fileName: fileName
  };
  localStorage.setItem(storageKey, JSON.stringify(data));
  showToast('Presentation saved');
}

// ============================================
// Comments System (Group Mode Only)
// ============================================

function loadComments() {
  if (!isGroupMode || !currentSlideID || !commentsList) return;

  const slide = (currentGroup.slides || []).find(s => s.id === currentSlideID);
  if (!slide) {
    commentsList.innerHTML = '<div class="comment-item"><div class="comment-text">No comments yet</div></div>';
    return;
  }

  const comments = slide.comments || [];
  commentsList.innerHTML = '';

  if (comments.length === 0) {
    commentsList.innerHTML = '<div class="comment-item"><div class="comment-text" style="color: rgba(255,255,255,0.5);">No comments yet. Start the conversation!</div></div>';
    return;
  }

  comments.forEach(comment => {
    const commentEl = createCommentElement(comment);
    commentsList.appendChild(commentEl);
  });

  // Scroll to bottom
  commentsList.scrollTop = commentsList.scrollHeight;
}

function createCommentElement(comment) {
  const commentEl = document.createElement('div');
  commentEl.className = 'comment-item';

  const author = groupMembers.find(m => (m.userID || m.email) === comment.authorID) || 
                 { fullName: comment.authorID, email: comment.authorID };
  const initial = (author.fullName || author.email || 'U')[0].toUpperCase();
  const time = new Date(comment.timestamp).toLocaleString();

  commentEl.innerHTML = `
    <div class="comment-header">
      <div class="comment-avatar">${initial}</div>
      <div class="comment-author">${author.fullName || author.email}</div>
      <div class="comment-time">${time}</div>
    </div>
    <div class="comment-text">${escapeHtml(comment.text)}</div>
  `;

  return commentEl;
}

function sendComment() {
  if (!isGroupMode || !currentSlideID || !commentInput) return;

  const text = commentInput.value.trim();
  if (!text) return;

  if (!currentUser) {
    alert('Please log in to add comments.');
    return;
  }

  const slide = (currentGroup.slides || []).find(s => s.id === currentSlideID);
  if (!slide) return;

  if (!slide.comments) slide.comments = [];

  const comment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    authorID: currentUser.userID || currentUser.email,
    text: text,
    timestamp: new Date().toISOString()
  };

  slide.comments.push(comment);
  Database.updateGroup(currentGroupID, { slides: currentGroup.slides });

  // Clear input
  commentInput.value = '';

  // Reload comments
  loadComments();
}

function toggleCommentPanel() {
  if (commentPanel) {
    commentPanel.classList.toggle('collapsed');
  }
}

// ============================================
// Export Functions
// ============================================

function openExportModal() {
  const defaultName = fileName || 'presentation';
  if (exportNameInput) {
    exportNameInput.value = defaultName;
  }
  if (exportModal) {
    exportModal.classList.add('show');
  }
}

function closeExportModal() {
  if (exportModal) {
    exportModal.classList.remove('show');
  }
}

async function exportSlides(format, fileName) {
  const slideArea = document.querySelector('.slide-canvas');
  if (!slideArea) {
    alert('No slide area found!');
    return;
  }

  try {
    const canvas = await html2canvas(slideArea, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    switch (format) {
      case 'pdf': {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('l', 'pt', 'a4');
        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        pdf.save(`${fileName}.pdf`);
        break;
      }

      case 'pptx': {
        const pptx = new PptxGenJS();
        const slide = pptx.addSlide();
        slide.addImage({ data: imgData, x: 0, y: 0, w: 10, h: 5.625 });
        await pptx.writeFile({ fileName: `${fileName}.pptx` });
        break;
      }

      case 'png': {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${fileName}.png`;
        link.click();
        break;
      }

      case 'jpg': {
        const jpgData = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.href = jpgData;
        link.download = `${fileName}.jpg`;
        link.click();
        break;
      }

      case 'html': {
        const blob = new Blob([slideArea.outerHTML], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.html`;
        link.click();
        break;
      }

      case 'json': {
        const slide = slides.find(s => s.id === selectedId);
        const data = { slide: slide, exportedAt: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.json`;
        link.click();
        break;
      }

      default:
        alert('Please select a valid format.');
    }

    closeExportModal();
    showToast('Export completed');
  } catch (err) {
    alert(`Export failed: ${err.message}`);
    console.error(err);
  }
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
  // Toolbar buttons
  document.querySelectorAll('.toolbar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cmd = btn.getAttribute('data-cmd');
      const value = btn.getAttribute('data-value');
      document.execCommand(cmd, false, value || null);
      if (contentEl) contentEl.focus();
    });
  });

  // Action buttons
  if (el('btn-new')) el('btn-new').addEventListener('click', addSlide);
  if (el('btn-duplicate')) el('btn-duplicate').addEventListener('click', duplicateSlide);
  if (el('btn-delete')) el('btn-delete').addEventListener('click', deleteSlide);
  if (el('btn-export')) el('btn-export').addEventListener('click', openExportModal);

  // Title and content changes
  if (titleEl) {
    let titleTimeout;
    titleEl.addEventListener('input', () => {
      const slide = slides.find(s => s.id === selectedId);
      if (slide) {
        slide.title = titleEl.value;
        clearTimeout(titleTimeout);
        titleTimeout = setTimeout(() => {
          saveSlides();
          renderSlides();
        }, 1000);
      }
    });
  }

  if (contentEl) {
    let contentTimeout;
    contentEl.addEventListener('input', () => {
      const slide = slides.find(s => s.id === selectedId);
      if (slide) {
        slide.content = contentEl.innerHTML;
        clearTimeout(contentTimeout);
        contentTimeout = setTimeout(() => {
          saveSlides();
        }, 1000);
      }
    });
  }

  // File name
  if (fileNameEl) {
    fileNameEl.addEventListener('change', () => {
      fileName = fileNameEl.value;
      if (!isGroupMode) {
        saveNormalSlides();
      }
    });
  }

  // Status select (group mode)
  if (statusSelectTop) {
    statusSelectTop.addEventListener('change', () => {
      if (isGroupMode) {
        saveGroupSlide();
      }
    });
  }

  // Comment input
  if (commentInput) {
    commentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendComment();
      }
    });
  }

  if (commentSendBtn) {
    commentSendBtn.addEventListener('click', sendComment);
  }

  // Export modal
  if (exportSaveButton) {
    exportSaveButton.addEventListener('click', () => {
      const selectedFormat = document.querySelector('input[name="format"]:checked');
      if (!selectedFormat) {
        alert('Please select a format.');
        return;
      }
      const name = exportNameInput?.value || 'presentation';
      exportSlides(selectedFormat.value, name);
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + Enter to add slide
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      addSlide();
    }

    // Escape to close modals
    if (e.key === 'Escape') {
      closeExportModal();
    }
  });
}

// ============================================
// Utility Functions
// ============================================

function showToast(message, duration = 2400) {
  if (!saveNotification) return;
  saveNotification.querySelector('span').textContent = message;
  saveNotification.classList.add('show');
  setTimeout(() => {
    saveNotification.classList.remove('show');
  }, duration);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// Initialize on Load
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export functions for global access
window.goBackToGroup = goBackToGroup;
window.toggleCommentPanel = toggleCommentPanel;
window.sendComment = sendComment;
window.closeExportModal = closeExportModal;

