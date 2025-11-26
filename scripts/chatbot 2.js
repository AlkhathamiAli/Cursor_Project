// ============================================
// AI Assistant Chatbot Module - Page-Aware with Persistent Memory
// Works on all pages: Home, Groups, Editor, Settings, etc.
// ============================================

class SlideMakerChatbot {
  constructor() {
    this.conversationHistory = [];
    this.isProcessing = false;
    this.recognition = null;
    this.isListening = false;
    this.currentPage = this.detectCurrentPage();
    this.memoryTimeout = 5 * 60 * 1000; // 5 minutes
    this.init();
  }

  detectCurrentPage() {
    // Detect page from URL or data attribute
    const path = window.location.pathname.toLowerCase();
    const pageData = document.body.getAttribute('data-page');
    
    if (pageData) return pageData;
    
    if (path.includes('home') || path.includes('index') || path.endsWith('/')) return 'home';
    if (path.includes('group')) return 'group';
    if (path.includes('setting')) return 'settings';
    if (path.includes('template')) return 'templates';
    if (path.includes('blank') || path.includes('slide') || path.includes('editor')) return 'slide';
    if (path.includes('welcome')) return 'welcome';
    
    return 'home'; // Default
  }

  init() {
    this.setupVoiceRecognition();
    this.setupEventListeners();
    this.loadConversationHistory();
    this.showWelcomeMessage();
  }

  // ============================================
  // 1. PERSISTENT MEMORY (5-Minute Auto-Clear)
  // ============================================
  loadConversationHistory() {
    try {
      const storageKey = `aiChatHistory-${this.currentPage}`;
      const saved = localStorage.getItem(storageKey);
      
      if (saved) {
        const data = JSON.parse(saved);
        const lastActive = data.lastActive || 0;
        const now = Date.now();
        
        // Check if within 5 minutes
        if (now - lastActive < this.memoryTimeout) {
          this.conversationHistory = data.messages || [];
          console.log(`Restored ${this.conversationHistory.length} messages from memory`);
        } else {
          // Clear expired memory
          localStorage.removeItem(storageKey);
          this.conversationHistory = [];
          console.log('Chat memory expired, starting fresh');
        }
      } else {
        this.conversationHistory = [];
      }
    } catch (e) {
      console.warn('Could not load conversation history:', e);
      this.conversationHistory = [];
    }
  }

  saveConversationHistory() {
    try {
      const storageKey = `aiChatHistory-${this.currentPage}`;
      const recentHistory = this.conversationHistory.slice(-20); // Keep last 20
      
      localStorage.setItem(storageKey, JSON.stringify({
        messages: recentHistory,
        lastActive: Date.now(),
        page: this.currentPage
      }));
    } catch (e) {
      console.warn('Could not save conversation history:', e);
    }
  }

  // ============================================
  // 2. VOICE RECOGNITION (Web Speech API)
  // ============================================
  setupVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateVoiceButton(true);
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById('chatbot-input');
      if (input) {
        input.value = transcript;
        setTimeout(() => {
          this.sendMessage();
        }, 300);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.stopListening();
      if (event.error === 'no-speech') {
        this.showNotification('No speech detected. Please try again.', 'warning');
      } else if (event.error === 'not-allowed') {
        this.showNotification('Microphone permission denied. Please enable it in your browser settings.', 'error');
      } else {
        this.showNotification('Voice recognition error. Please use text input.', 'error');
      }
    };

    this.recognition.onend = () => {
      this.stopListening();
    };
  }

  startListening() {
    if (!this.recognition) {
      this.showNotification('Voice recognition not supported in this browser.', 'error');
      return;
    }

    if (this.isListening) {
      this.stopListening();
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      this.showNotification('Could not start voice recognition. Please try again.', 'error');
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
      this.isListening = false;
      this.updateVoiceButton(false);
    }
  }

  updateVoiceButton(isListening) {
    const voiceBtn = document.getElementById('voice-input-btn');
    if (voiceBtn) {
      if (isListening) {
        voiceBtn.classList.add('listening');
        voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        voiceBtn.style.background = 'rgba(255, 0, 0, 0.3)';
      } else {
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceBtn.style.background = '';
      }
    }
  }

  // ============================================
  // 3. EVENT LISTENERS (Enter to Send, etc.)
  // ============================================
  setupEventListeners() {
    const chatInput = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('send-input-btn') || document.querySelector('.chatbot-send-btn');
    const voiceBtn = document.getElementById('voice-input-btn');

    // Enter to send, Shift+Enter for new line
    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        this.sendMessage();
      });
    }

    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        this.startListening();
      });
    }
  }

  // ============================================
  // 4. SEND MESSAGE (Prevent Duplicates)
  // ============================================
  async sendMessage() {
    if (this.isProcessing) {
      return;
    }

    const input = document.getElementById('chatbot-input');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    // Prevent duplicate messages
    const lastUserMessage = this.conversationHistory
      .filter(msg => msg.role === 'user')
      .pop();
    
    if (lastUserMessage && lastUserMessage.content === message) {
      return;
    }

    this.isProcessing = true;
    input.value = '';
    this.stopListening();

    // Add user message
    this.addMessage(message, 'user');
    this.conversationHistory.push({ role: 'user', content: message });

    // Show loading
    const loadingId = this.addMessage('Thinking...', 'assistant', true);

    try {
      const response = await this.getAIResponse(message);
      
      // Remove loading and add response
      this.removeMessage(loadingId);
      this.addMessage(response, 'assistant');
      this.conversationHistory.push({ role: 'assistant', content: response });
      
      // Save conversation history
      this.saveConversationHistory();
    } catch (error) {
      console.error('AI response error:', error);
      this.removeMessage(loadingId);
      this.addMessage(
        'Sorry, I encountered an error. Please try again or ask a different question.',
        'assistant'
      );
    } finally {
      this.isProcessing = false;
    }
  }

  // ============================================
  // 5. PAGE-AWARE AI RESPONSE
  // ============================================
  async getAIResponse(userMessage) {
    const apiKey = localStorage.getItem('gemini_api_key');
    
    if (!apiKey) {
      return this.getPageAwareFallbackResponse(userMessage);
    }

    try {
      const systemPrompt = this.getPageAwareSystemPrompt();
      const conversationContext = this.buildConversationContext();
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\n${conversationContext}\n\nUser: ${userMessage}\n\nAssistant:`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 300,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text.trim();
        // Trigger highlighting for relevant elements
        this.highlightRelevantElements(userMessage);
        return aiResponse;
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      const fallbackResponse = this.getPageAwareFallbackResponse(userMessage);
      this.highlightRelevantElements(userMessage);
      return fallbackResponse;
    }
  }

  getUserName() {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser && currentUser.fullName) {
        return currentUser.fullName;
      }
      if (currentUser && currentUser.username) {
        return currentUser.username;
      }
      const isGuest = localStorage.getItem('guest') === 'true';
      if (isGuest) {
        return 'Guest';
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  getPageAwareSystemPrompt() {
    const pageContext = this.getPageContext();
    const userName = this.getUserName();
    const userGreeting = userName ? `The user's name is ${userName}.` : '';
    
    return `You are a helpful AI assistant for SlideMaker, a professional presentation creation website by Aramco Digital.

${userGreeting}

CURRENT PAGE: ${pageContext.name}
${pageContext.description}

Your role is to help users understand and use SlideMaker effectively on THIS specific page. You MUST ONLY answer questions about:
- How to use features on ${pageContext.name} page
- ${pageContext.features.join('\n- ')}
- Website navigation and UI elements on this page
- Troubleshooting issues on this page

GREETING BEHAVIOR: When the user greets you (says "Hello", "Hi", "Hey", "Good morning", etc.), ALWAYS respond warmly with their name if available. Use this format: "Hi ${userName || 'there'}, I'm here to help you with SlideMaker! I can assist you with ${pageContext.suggestions.join(', ')} on ${pageContext.name}. What would you like to know?"

If asked about anything unrelated to SlideMaker or this page, politely redirect:
"I can only help with questions about using SlideMaker on ${pageContext.name}. Try asking about ${pageContext.suggestions.join(', ')}."

Keep responses:
- Concise (2-4 sentences)
- Helpful and actionable
- Friendly and professional
- Specific to ${pageContext.name} page features
- Always use the user's name when greeting them (if available)
- Be warm and welcoming in your tone`;
  }

  getPageContext() {
    const contexts = {
      home: {
        name: 'Home',
        description: 'This is the main dashboard where users manage presentations, templates, and groups.',
        features: [
          'Creating new presentations and groups',
          'Accessing recent presentations and templates',
          'Managing groups and collaborations',
          'Navigating to other sections'
        ],
        suggestions: ['creating presentations', 'managing groups', 'using templates', 'finding recent work']
      },
      group: {
        name: 'Groups',
        description: 'This is the groups page where users collaborate, manage members, and work on group presentations.',
        features: [
          'Adding members to groups',
          'Managing group roles and permissions',
          'Accessing group slides and presentations',
          'Viewing group activity logs',
          'Collaborating with team members'
        ],
        suggestions: ['adding members', 'group roles', 'group slides', 'collaboration']
      },
      settings: {
        name: 'Settings',
        description: 'This is the settings page where users configure preferences, themes, and account settings.',
        features: [
          'Changing themes and appearance',
          'Configuring preferences',
          'Managing API keys',
          'Account and security settings',
          'Notification preferences'
        ],
        suggestions: ['themes', 'preferences', 'API keys', 'account settings']
      },
      templates: {
        name: 'Templates',
        description: 'This is the templates page where users browse and select presentation templates.',
        features: [
          'Browsing template categories',
          'Previewing templates',
          'Selecting templates for new presentations',
          'Finding recent templates'
        ],
        suggestions: ['template categories', 'previewing templates', 'selecting templates']
      },
      slide: {
        name: 'Slide Editor',
        description: 'This is the slide editor where users create and edit presentation slides.',
        features: [
          'Using editing tools',
          'Formatting text and elements',
          'Adding images, charts, and shapes',
          'Layout and design guidance',
          'Exporting presentations'
        ],
        suggestions: ['editing tools', 'formatting', 'adding elements', 'layouts']
      }
    };

    return contexts[this.currentPage] || contexts.home;
  }

  buildConversationContext() {
    const recentHistory = this.conversationHistory.slice(-6);
    if (recentHistory.length === 0) return '';
    
    return 'Previous conversation:\n' + 
      recentHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n') +
      '\n\n';
  }

  // ============================================
  // 6. PAGE-AWARE FALLBACK RESPONSES
  // ============================================
  getPageAwareFallbackResponse(userMessage) {
    const message = userMessage.toLowerCase().trim();
    const userName = this.getUserName();
    const pageContext = this.getPageContext();
    
    // Check for greetings first (more comprehensive detection)
    const greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'howdy', 'sup', 'what\'s up'];
    const normalizedMessage = message.replace(/[!?.]/g, '').trim();
    const isGreeting = greetings.some(greeting => {
      const greetingLower = greeting.toLowerCase();
      return normalizedMessage === greetingLower || 
             normalizedMessage.startsWith(greetingLower + ' ') ||
             normalizedMessage === greetingLower ||
             message.includes(greetingLower);
    });
    
    if (isGreeting) {
      const namePart = userName ? `Hi ${userName}, ` : 'Hi there, ';
      const response = `${namePart}I'm here to help you with SlideMaker! I can assist you with ${pageContext.suggestions.join(', ')} on ${pageContext.name}. What would you like to know?`;
      this.highlightRelevantElements(userMessage);
      return response;
    }
    
    const knowledgeBase = this.getPageKnowledgeBase();
    
    // Semantic matching
    for (const [key, response] of Object.entries(knowledgeBase)) {
      if (message.includes(key)) {
        this.highlightRelevantElements(userMessage);
        return response;
      }
      
      // Fuzzy match
      const keyWords = key.split(' ');
      if (keyWords.length > 1) {
        const matchCount = keyWords.filter(word => message.includes(word)).length;
        if (matchCount >= keyWords.length * 0.7) {
          this.highlightRelevantElements(userMessage);
          return response;
        }
      }
    }

    // Contextual fallback
    const contextResponse = this.getContextualFallback(userMessage);
    this.highlightRelevantElements(userMessage);
    return contextResponse;
  }

  getPageKnowledgeBase() {
    const userName = this.getUserName();
    const namePart = userName ? `${userName}, ` : '';
    
    const bases = {
      home: {
        'what is this website': 'SlideMaker is a professional presentation creation website by Aramco Digital. On the Home page, you can create presentations, manage groups, and access templates. Use the sidebar to navigate.',
        'how do i create a group': `${namePart}To create a group: 1) Go to the Groups section in the sidebar, 2) Click "New Group", 3) Enter group details, 4) Add members by User ID, QR code, or invite link.`,
        'how do i create a presentation': `${namePart}To create a presentation: Click "New Presentation" in the Presentations section of the sidebar, or click the "New Presentation" card in the main area. You can also start from a template.`,
        'where are my recent presentations': `${namePart}Your recent presentations appear in the "Recent Presentations" section on the Home page. You can also find them in the sidebar under Presentations. Click any to open it.`,
        'templates': `${namePart}Templates are in the Templates section of the sidebar. Browse categories or check recent templates. Click a template to preview and use it for your presentation.`,
        'groups': `${namePart}Groups allow collaboration with team members. Find them in the Groups section of the sidebar. Click "New Group" to create one, or view your recent groups.`,
        'search': `${namePart}Use the search bar at the top to find your presentations, groups, and templates. Just type what you're looking for and results will appear instantly.`,
        'notifications': `${namePart}Check your notifications by clicking the bell icon in the top bar. You'll see group invites, mentions, and activity updates there.`,
        'settings': `${namePart}Access Settings from the sidebar at the bottom. You can change themes, preferences, add API keys, and manage your account there.`,
      },
      group: {
        'how do i add members': `${namePart}To add members to a group: 1) Open the group page, 2) Click "Add Member" button, 3) You can add by User ID (format: #AD1234), scan their QR code, or generate and share an invite link.`,
        'group roles': `${namePart}Group roles define permissions: Admins can manage members, settings, and all content. Members can edit group presentations and collaborate. Roles are shown next to each member's name.`,
        'group slides': `${namePart}Group slides are shared presentations that all group members can access and edit. Find them in the group page. All changes are saved automatically and visible to all members.`,
        'collaborate': `${namePart}Collaborate by working on group slides together. All members can edit simultaneously. Changes are saved automatically. Use the activity log to see what others are working on.`,
        'invite members': `${namePart}Invite members in three ways: 1) Enter their User ID (format: #AD1234), 2) Scan their QR code, 3) Generate an invite link and share it. Clicking the link automatically joins them to the group.`,
        'activity log': `${namePart}The activity log shows all group activity including member additions, slide updates, and comments. It's visible to all group members on the group page.`,
      },
      settings: {
        'themes': `${namePart}Change themes in Settings → Language & Theme. You can choose Light, Dark, or System Default. The theme applies immediately across the entire application.`,
        'preferences': `${namePart}Configure preferences in Settings → Preferences. You can adjust auto-save settings, font size, UI density, and animation preferences to customize your experience.`,
        'api key': `${namePart}Add your free Google Gemini API key in Settings → Preferences → AI Assistant API Key. This enhances AI responses with more intelligent and contextual answers. Get your free key from Google AI Studio.`,
        'account settings': `${namePart}Manage your account in Settings → Account & Security. You can update your profile information, change password, manage security options, and view account details.`,
        'language': `${namePart}Change language in Settings → Language & Theme. You can switch between English and Arabic. The interface will update immediately.`,
      },
      templates: {
        'browse templates': `${namePart}Browse templates by category in the Templates section. Categories include Business, Education, Marketing, and Project templates. Click any template to preview and use it.`,
        'template categories': `${namePart}Templates are organized by categories like Business, Creative, Corporate, Education, Marketing, and Project. Browse by category to find the perfect design for your presentation.`,
        'use template': `${namePart}Click a template to preview it. Then click "Use Template" to start a new presentation with that design. The template will open in the slide editor where you can customize it.`,
        'recent templates': `${namePart}Your recently used templates appear in the Templates section of the sidebar. Click any to use it again quickly. This saves time when working on similar presentations.`,
      },
      slide: {
        'editing tools': `${namePart}Use the toolbar at the top to add text, images, charts, shapes, tables, and more. Double-click the canvas to add text boxes. All tools are accessible from the top toolbar.`,
        'formatting': `${namePart}Select any element to format it. Use the right panel for colors, fonts, sizes, and styles. You can also use keyboard shortcuts for quick formatting.`,
        'add elements': `${namePart}Use toolbar buttons to add images, videos, charts, tables, and shapes. Drag elements to position them on the slide. Resize by dragging corners.`,
        'layouts': `${namePart}Change slide layout using the layout options in the toolbar. Choose from title slides, content slides, two-column layouts, and more to organize your content.`,
        'export': `${namePart}Export your presentation using File → Export or the export button. Choose PDF, PPTX, or image formats. Your presentation will be downloaded to your device.`,
        'save': `${namePart}Your work is auto-saved as you edit. You can also manually save using File → Save. Saved presentations appear in your Recent Presentations on the Home page.`,
        'undo redo': `${namePart}Use Ctrl+Z (Cmd+Z on Mac) to undo and Ctrl+Y (Cmd+Shift+Z on Mac) to redo. The undo/redo buttons are also in the toolbar.`,
      }
    };

    return bases[this.currentPage] || bases.home;
  }

  getContextualFallback(userMessage) {
    const message = userMessage.toLowerCase();
    const pageContext = this.getPageContext();
    
    if (message.includes('create') || message.includes('make') || message.includes('new')) {
      return `To create something on ${pageContext.name}, look for "New" buttons in the sidebar or toolbar. What would you like to create?`;
    }

    if (message.includes('find') || message.includes('where') || message.includes('locate')) {
      return `Use the sidebar on ${pageContext.name} to find what you need. Recent items are listed at the top of each section.`;
    }

    if (message.includes('help') || message.includes('how')) {
      return `I can help you with ${pageContext.suggestions.join(', ')} on ${pageContext.name}. What do you need help with?`;
    }

    return `I can help you with ${pageContext.suggestions.join(', ')} on ${pageContext.name}. What would you like to know?`;
  }

  // ============================================
  // 7. INTERACTIVE HIGHLIGHTING
  // ============================================
  highlightRelevantElements(userMessage) {
    const message = userMessage.toLowerCase();
    const highlightMap = this.getHighlightMap();
    
    for (const [keyword, selectors] of Object.entries(highlightMap)) {
      if (message.includes(keyword)) {
        selectors.forEach(selector => {
          this.highlightElement(selector);
        });
        break; // Only highlight first match
      }
    }
  }

  getHighlightMap() {
    const maps = {
      home: {
        'presentation': ['#presentations-content', 'button[onclick*="createNewPresentation"]', '[data-action="open_blank_page"]', '#recentGrid'],
        'group': ['#groups-content', 'button[onclick*="createNewGroup"]', '#recentGroupsGrid'],
        'template': ['#templates-content', '.template-grid', '.template-card'],
        'recent': ['.recent-grid', '#recentGrid', '#recentGroupsGrid'],
        'search': ['#searchForm', '#searchInput'],
        'notifications': ['#notificationsBtn', '#notificationsList'],
        'settings': ['.nav-menu a[href*="settings"]'],
        'new presentation': ['[data-action="open_blank_page"]', 'button[onclick*="createNewPresentation"]'],
        'new group': ['button[onclick*="createNewGroup"]'],
      },
      group: {
        'add member': ['button[onclick*="addMember"]', '.add-member-btn'],
        'member': ['.members-list', '.group-members'],
        'slide': ['.group-slides', '.slides-list'],
      },
      settings: {
        'theme': ['#language-theme', '.color-option'],
        'preference': ['#preferences', '.preference-row'],
        'api': ['#geminiApiKeyInput', '#saveApiKeyBtn'],
      },
      templates: {
        'template': ['.template-card', '.template-item'],
        'category': ['.template-categories'],
      },
      slide: {
        'tool': ['.toolbar-btn', '.topbar .btn'],
        'format': ['.format-panel', '.style-panel'],
        'export': ['button[onclick*="export"]', '.export-btn'],
      }
    };

    return maps[this.currentPage] || maps.home;
  }

  highlightElement(selector) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        element.style.transition = 'box-shadow 0.3s ease';
        element.style.boxShadow = '0 0 20px rgba(0, 200, 150, 0.8), 0 0 40px rgba(0, 200, 150, 0.4)';
        
        setTimeout(() => {
          element.style.boxShadow = '';
        }, 3000);
      }
    } catch (e) {
      console.warn('Could not highlight element:', selector);
    }
  }

  // ============================================
  // 8. MESSAGE DISPLAY (Auto-scroll)
  // ============================================
  addMessage(text, sender, isTemporary = false) {
    const chatMessages = document.getElementById('chatbot-messages');
    if (!chatMessages) return null;

    const messageDiv = document.createElement('div');
    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.setAttribute('data-message-id', messageId);
    if (isTemporary) {
      messageDiv.setAttribute('data-temporary', 'true');
    }
    
    const formattedText = text.replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = `
      <div class="message-content">${formattedText}</div>
      <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    this.scrollToBottom(chatMessages);
    
    return messageId;
  }

  removeMessage(messageId) {
    const message = document.querySelector(`[data-message-id="${messageId}"]`);
    if (message) {
      message.remove();
    }
  }

  scrollToBottom(container) {
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }

  // ============================================
  // 9. WELCOME MESSAGE
  // ============================================
  showWelcomeMessage() {
    setTimeout(() => {
      const chatMessages = document.getElementById('chatbot-messages');
      if (chatMessages && chatMessages.children.length === 0 && this.conversationHistory.length === 0) {
        const pageContext = this.getPageContext();
        const apiKey = localStorage.getItem('gemini_api_key');
        const userName = this.getUserName();
        const greeting = userName ? `Hello ${userName}!` : 'Hello!';
        let welcomeMsg = `${greeting} I'm your AI Assistant. I'm here to help you with ${pageContext.suggestions.join(', ')} on ${pageContext.name}. What would you like to know?`;
        
        if (!apiKey) {
          welcomeMsg += "\n\n💡 Tip: For enhanced AI responses, add a free Google Gemini API key in Settings → Preferences.";
        }
        
        this.addMessage(welcomeMsg, 'assistant');
      } else if (this.conversationHistory.length > 0) {
        // Restore previous messages
        this.conversationHistory.forEach(msg => {
          this.addMessage(msg.content, msg.role);
        });
      }
    }, 500);
  }

  // ============================================
  // 10. NOTIFICATIONS
  // ============================================
  showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
let chatbotInstance = null;

function initChatbot() {
  if (document.getElementById('chatbot-messages') || document.getElementById('ai-chatbot')) {
    if (!chatbotInstance) {
      chatbotInstance = new SlideMakerChatbot();
      window.slideMakerChatbot = chatbotInstance;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatbot);
} else {
  initChatbot();
}

function toggleChatbot() {
  const chatbot = document.getElementById('ai-chatbot');
  if (chatbot) {
    if (chatbot.classList) {
      chatbot.classList.toggle('active');
    }
    
    const input = document.getElementById('chatbot-input');
    if (input) {
      input.focus();
    }
    
    if (!chatbotInstance) {
      initChatbot();
    }
  }
}

window.toggleChatbot = toggleChatbot;
