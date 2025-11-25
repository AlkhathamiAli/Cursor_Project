// ============================================
// Template Loading System
// ============================================

/**
 * Load a template from the data/templates directory
 * @param {string} name - Template name (without .json extension)
 * @returns {Promise<Array>} Array of slides from the template
 */
async function loadTemplate(name) {
  try {
    const res = await fetch(`data/templates/${name}.json`);
    if (!res.ok) {
      throw new Error(`Failed to load template: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    
    // Return the slides array
    if (data.slides && Array.isArray(data.slides)) {
      return data.slides;
    }
    
    // If the JSON is just an array of slides, return it directly
    if (Array.isArray(data)) {
      return data;
    }
    
    throw new Error('Invalid template format: missing slides array');
  } catch (error) {
    console.error(`Error loading template "${name}":`, error);
    throw error;
  }
}

// Export for global use
window.loadTemplate = loadTemplate;

