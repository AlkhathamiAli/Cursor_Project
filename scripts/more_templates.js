// ============================================
// More Templates Page Logic
// ============================================

// Template definitions - all available templates
const TEMPLATE_DEFINITIONS = [
  {
    name: 'business',
    icon: 'fas fa-briefcase',
    title: 'Business',
    description: 'Professional slides for corporate presentations and meetings'
  },
  {
    name: 'education',
    icon: 'fas fa-graduation-cap',
    title: 'Education',
    description: 'Engaging designs perfect for educational content and training'
  },
  {
    name: 'project',
    icon: 'fas fa-project-diagram',
    title: 'Project',
    description: 'Structured layouts for project planning and progress tracking'
  },
  {
    name: 'weekly-report',
    icon: 'fas fa-calendar-week',
    title: 'Weekly Report',
    description: 'Weekly status updates and progress reports for teams'
  },
  {
    name: 'meeting-minutes',
    icon: 'fas fa-clipboard-list',
    title: 'Meeting Minutes',
    description: 'Professional templates for documenting meeting discussions'
  },
  {
    name: 'financial-report',
    icon: 'fas fa-chart-pie',
    title: 'Financial Report',
    description: 'Financial data visualization and quarterly reports'
  },
  {
    name: 'training',
    icon: 'fas fa-chalkboard-teacher',
    title: 'Training',
    description: 'Employee training materials and onboarding presentations'
  },
  {
    name: 'executive-summary',
    icon: 'fas fa-file-alt',
    title: 'Executive Summary',
    description: 'High-level summaries for executive briefings and reviews'
  },
  {
    name: 'marketing',
    icon: 'fas fa-chart-line',
    title: 'Marketing',
    description: 'Eye-catching layouts for marketing campaigns and pitches'
  }
];

// ============================================
// Template Loading and Rendering
// ============================================

/**
 * Render a single template card
 */
function renderTemplateCard(template) {
  const card = document.createElement('div');
  card.className = 'template-card';
  card.setAttribute('data-template', template.name);
  
  card.innerHTML = `
    <div class="card-shape shape1"></div>
    <div class="card-shape shape2"></div>
    <div class="card-shape shape3"></div>
    <div class="card-shape shape4"></div>
    <div class="card-shape shape5"></div>
    <i class="${template.icon}"></i>
    <h3>${template.title}</h3>
    <p>${template.description}</p>
  `;
  
  // Add click handler
  card.addEventListener('click', async () => {
    await loadAndUseTemplate(template.name);
  });
  
  return card;
}

/**
 * Load template and navigate to editor
 */
async function loadAndUseTemplate(templateName) {
  try {
    // Check if loadTemplate function is available
    if (typeof loadTemplate !== 'function') {
      console.error('loadTemplate function not found. Make sure templates.js is loaded.');
      alert('Error: Template loader not available. Please refresh the page.');
      return;
    }
    
    // Show loading state
    const grid = document.getElementById('templatesGrid');
    if (grid) {
      grid.classList.add('loading');
    }
    
    // Load the template
    const slides = await loadTemplate(templateName);
    
    // Store slides in localStorage for the editor to load
    localStorage.setItem('importedSlides', JSON.stringify(slides));
    
    // Navigate to slide editor
    window.location.href = './blank.html';
    
  } catch (error) {
    console.error('Error loading template:', error);
    alert(`Failed to load template: ${error.message}`);
    
    // Remove loading state
    const grid = document.getElementById('templatesGrid');
    if (grid) {
      grid.classList.remove('loading');
    }
  }
}

/**
 * Render all templates
 */
function renderAllTemplates() {
  const grid = document.getElementById('templatesGrid');
  if (!grid) {
    console.error('Templates grid not found');
    return;
  }
  
  // Clear existing content
  grid.innerHTML = '';
  
  // Render each template card
  TEMPLATE_DEFINITIONS.forEach(template => {
    const card = renderTemplateCard(template);
    grid.appendChild(card);
  });
}

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Route protection - check authentication
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const isGuest = localStorage.getItem('guest') === 'true';
  
  if (!currentUser && !isGuest) {
    window.location.href = './index.html';
    return;
  }
  
  // Render all templates
  renderAllTemplates();
  
  // Update user info if available
  const userName = document.getElementById('userName');
  if (userName && currentUser) {
    userName.textContent = currentUser.fullName || currentUser.username || 'User';
    document.getElementById('userInfo').style.display = 'flex';
  }
});

// Export for global use
window.loadAndUseTemplate = loadAndUseTemplate;
window.renderAllTemplates = renderAllTemplates;

