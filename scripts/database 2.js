/**
 * Database Module - Phase 0
 * 
 * Manages all data storage using localStorage with proper table structures.
 * Follows the requirements for Users, Groups, Recents, and Templates tables.
 */

const Database = {
  // Storage keys
  STORAGE_KEYS: {
    USERS: 'db_users',
    GROUPS: 'db_groups',
    RECENTS: 'db_recents',
    TEMPLATES: 'db_templates'
  },

  /**
   * Initialize database - create empty tables if they don't exist
   */
  init() {
    if (!localStorage.getItem(this.STORAGE_KEYS.USERS)) {
      localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.GROUPS)) {
      localStorage.setItem(this.STORAGE_KEYS.GROUPS, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.RECENTS)) {
      localStorage.setItem(this.STORAGE_KEYS.RECENTS, JSON.stringify({}));
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.TEMPLATES)) {
      localStorage.setItem(this.STORAGE_KEYS.TEMPLATES, JSON.stringify([]));
    }
  },

  // ============================================
  // USERS TABLE OPERATIONS
  // ============================================

  /**
   * Get all users
   * @returns {Array} Array of user objects
   */
  getAllUsers() {
    const users = localStorage.getItem(this.STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  },

  /**
   * Get user by userID
   * @param {string} userID - Format: #AD1234
   * @returns {Object|null} User object or null if not found
   */
  getUserByID(userID) {
    const users = this.getAllUsers();
    return users.find(user => user.userID === userID) || null;
  },

  /**
   * Get user by email
   * @param {string} email
   * @returns {Object|null} User object or null if not found
   */
  getUserByEmail(email) {
    const users = this.getAllUsers();
    return users.find(user => user.email === email) || null;
  },

  /**
   * Create a new user
   * @param {Object} userData - {fullName, email, passwordHash, avatar, qrcodeData, deviceToken}
   * @returns {Object} Created user object with generated userID
   */
  createUser(userData) {
    const users = this.getAllUsers();
    
    // Generate userID in format #AD1234
    const userID = this.generateUserID();
    
    const newUser = {
      userID,
      fullName: userData.fullName || '',
      email: userData.email,
      passwordHash: userData.passwordHash || '',
      avatar: userData.avatar || '',
      qrcodeData: userData.qrcodeData || '',
      deviceToken: userData.deviceToken || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
    
    return newUser;
  },

  /**
   * Update user
   * @param {string} userID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated user or null if not found
   */
  updateUser(userID, updates) {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(user => user.userID === userID);
    
    if (userIndex === -1) return null;

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
    return users[userIndex];
  },

  /**
   * Generate unique userID in format #AD1234
   * @returns {string} Generated userID
   */
  generateUserID() {
    const users = this.getAllUsers();
    let counter = 1;
    let userID;
    
    do {
      const num = String(counter).padStart(4, '0');
      userID = `#AD${num}`;
      counter++;
    } while (users.some(user => user.userID === userID));

    return userID;
  },

  // ============================================
  // GROUPS TABLE OPERATIONS
  // ============================================

  /**
   * Get all groups
   * @returns {Array} Array of group objects
   */
  getAllGroups() {
    const groups = localStorage.getItem(this.STORAGE_KEYS.GROUPS);
    return groups ? JSON.parse(groups) : [];
  },

  /**
   * Get group by groupID
   * @param {string} groupID
   * @returns {Object|null} Group object or null if not found
   */
  getGroupByID(groupID) {
    const groups = this.getAllGroups();
    return groups.find(group => group.groupID === groupID) || null;
  },

  /**
   * Get groups by userID (where user is a member)
   * @param {string} userID
   * @returns {Array} Array of group objects
   */
  getGroupsByUser(userID) {
    const groups = this.getAllGroups();
    return groups.filter(group => group.members.includes(userID));
  },

  /**
   * Create a new group
   * @param {Object} groupData - {groupName, createdBy, members, roles}
   * @returns {Object} Created group object with generated groupID
   */
  createGroup(groupData) {
    const groups = this.getAllGroups();
    
    const groupID = this.generateGroupID();
    
    const newGroup = {
      groupID,
      groupName: groupData.groupName || '',
      createdBy: groupData.createdBy || '',
      members: groupData.members || [],
      roles: groupData.roles || [],
      slides: groupData.slides || [],
      activityLog: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    groups.push(newGroup);
    localStorage.setItem(this.STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    
    // Add to activity log
    this.addGroupActivity(groupID, {
      type: 'group_created',
      userID: groupData.createdBy,
      message: `Group "${groupData.groupName}" was created`,
      timestamp: new Date().toISOString()
    });
    
    return newGroup;
  },

  /**
   * Update group
   * @param {string} groupID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated group or null if not found
   */
  updateGroup(groupID, updates) {
    const groups = this.getAllGroups();
    const groupIndex = groups.findIndex(group => group.groupID === groupID);
    
    if (groupIndex === -1) return null;

    groups[groupIndex] = {
      ...groups[groupIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    return groups[groupIndex];
  },

  /**
   * Add activity to group log
   * @param {string} groupID
   * @param {Object} activity - {type, userID, message, timestamp}
   */
  addGroupActivity(groupID, activity) {
    const group = this.getGroupByID(groupID);
    if (!group) return;

    group.activityLog.push(activity);
    this.updateGroup(groupID, { activityLog: group.activityLog });
  },

  /**
   * Generate unique groupID
   * @returns {string} Generated groupID
   */
  generateGroupID() {
    const groups = this.getAllGroups();
    return `GRP${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  },

  // ============================================
  // RECENTS TABLE OPERATIONS
  // ============================================

  /**
   * Get recents for a user
   * @param {string} userID
   * @returns {Object} Recents object
   */
  getRecents(userID) {
    const allRecents = this.getAllRecents();
    return allRecents[userID] || {
      recentGroups: [],
      recentPresentations: [],
      recentTemplates: [],
      lastActiveGroup: null
    };
  },

  /**
   * Get all recents (all users)
   * @returns {Object} Object with userID as keys
   */
  getAllRecents() {
    const recents = localStorage.getItem(this.STORAGE_KEYS.RECENTS);
    return recents ? JSON.parse(recents) : {};
  },

  /**
   * Update recents for a user
   * @param {string} userID
   * @param {Object} updates - {recentGroups, recentPresentations, recentTemplates, lastActiveGroup}
   */
  updateRecents(userID, updates) {
    const allRecents = this.getAllRecents();
    
    allRecents[userID] = {
      ...this.getRecents(userID),
      ...updates
    };

    localStorage.setItem(this.STORAGE_KEYS.RECENTS, JSON.stringify(allRecents));
  },

  /**
   * Add to recent groups
   * @param {string} userID
   * @param {string} groupID
   */
  addRecentGroup(userID, groupID) {
    const recents = this.getRecents(userID);
    let recentGroups = [...recents.recentGroups];
    
    // Remove if already exists
    recentGroups = recentGroups.filter(id => id !== groupID);
    // Add to beginning
    recentGroups.unshift(groupID);
    // Keep only last 10
    recentGroups = recentGroups.slice(0, 10);

    this.updateRecents(userID, { recentGroups });
  },

  /**
   * Add to recent presentations
   * @param {string} userID
   * @param {string} presentationID
   */
  addRecentPresentation(userID, presentationID) {
    const recents = this.getRecents(userID);
    let recentPresentations = [...recents.recentPresentations];
    
    recentPresentations = recentPresentations.filter(id => id !== presentationID);
    recentPresentations.unshift(presentationID);
    recentPresentations = recentPresentations.slice(0, 10);

    this.updateRecents(userID, { recentPresentations });
  },

  /**
   * Add to recent templates
   * @param {string} userID
   * @param {string} templateID
   */
  addRecentTemplate(userID, templateID) {
    const recents = this.getRecents(userID);
    let recentTemplates = [...recents.recentTemplates];
    
    recentTemplates = recentTemplates.filter(id => id !== templateID);
    recentTemplates.unshift(templateID);
    recentTemplates = recentTemplates.slice(0, 10);

    this.updateRecents(userID, { recentTemplates });
  },

  /**
   * Set last active group
   * @param {string} userID
   * @param {string} groupID
   */
  setLastActiveGroup(userID, groupID) {
    this.updateRecents(userID, { lastActiveGroup: groupID });
  },

  // ============================================
  // TEMPLATES TABLE OPERATIONS
  // ============================================

  /**
   * Get all templates
   * @returns {Array} Array of template objects
   */
  getAllTemplates() {
    const templates = localStorage.getItem(this.STORAGE_KEYS.TEMPLATES);
    return templates ? JSON.parse(templates) : [];
  },

  /**
   * Get template by templateID
   * @param {string} templateID
   * @returns {Object|null} Template object or null if not found
   */
  getTemplateByID(templateID) {
    const templates = this.getAllTemplates();
    return templates.find(template => template.templateID === templateID) || null;
  },

  /**
   * Get templates by category
   * @param {string} category
   * @returns {Array} Array of template objects
   */
  getTemplatesByCategory(category) {
    const templates = this.getAllTemplates();
    return templates.filter(template => template.category === category);
  },

  /**
   * Create a new template
   * @param {Object} templateData - {templateName, previewImage, category}
   * @returns {Object} Created template object with generated templateID
   */
  createTemplate(templateData) {
    const templates = this.getAllTemplates();
    
    const templateID = this.generateTemplateID();
    
    const newTemplate = {
      templateID,
      templateName: templateData.templateName || '',
      previewImage: templateData.previewImage || '',
      category: templateData.category || 'general',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    templates.push(newTemplate);
    localStorage.setItem(this.STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    
    return newTemplate;
  },

  /**
   * Update template
   * @param {string} templateID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated template or null if not found
   */
  updateTemplate(templateID, updates) {
    const templates = this.getAllTemplates();
    const templateIndex = templates.findIndex(template => template.templateID === templateID);
    
    if (templateIndex === -1) return null;

    templates[templateIndex] = {
      ...templates[templateIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    return templates[templateIndex];
  },

  /**
   * Generate unique templateID
   * @returns {string} Generated templateID
   */
  generateTemplateID() {
    const templates = this.getAllTemplates();
    return `TMP${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  },

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Check if deviceToken exists and get user
   * @param {string} deviceToken
   * @returns {Object|null} User object or null
   */
  getUserByDeviceToken(deviceToken) {
    const users = this.getAllUsers();
    return users.find(user => user.deviceToken === deviceToken) || null;
  },

  /**
   * Generate device token
   * @returns {string} Generated device token
   */
  generateDeviceToken() {
    return `DEV${Date.now()}${Math.random().toString(36).substr(2, 16)}`;
  },

  /**
   * Hash password (simple implementation - in production use proper hashing)
   * @param {string} password
   * @returns {string} Hashed password
   */
  hashPassword(password) {
    // Simple hash - in production, use bcrypt or similar
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  },

  /**
   * Verify password
   * @param {string} password
   * @param {string} hash
   * @returns {boolean} True if password matches hash
   */
  verifyPassword(password, hash) {
    return this.hashPassword(password) === hash;
  }
};

// Initialize database on load
if (typeof window !== 'undefined') {
  Database.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Database;
}


