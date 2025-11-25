let currentLanguage =
  (typeof window.getCurrentLanguage === "function" && window.getCurrentLanguage()) ||
  localStorage.getItem("siteLanguage") ||
  "en";

const translate = (key) =>
  typeof window.getTranslation === "function" ? window.getTranslation(key, currentLanguage) : key;

function setLanguageHandlers() {
  if (typeof window.initTranslations === "function") {
    window.onLanguageChange = (lang) => {
      currentLanguage = lang;
      if (typeof window.applyTranslations === "function") {
        window.applyTranslations(lang);
      }
    };
    window.initTranslations();
  } else if (typeof window.applyTranslations === "function") {
    window.applyTranslations(currentLanguage);
  }
}

function checkAuth() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const isGuest = localStorage.getItem("guest") === "true";

  if (currentUser || isGuest) {
    window.location.href = "./Home.html";
  }
}

function continueAsVisitor() {
  localStorage.setItem("guest", "true");
  localStorage.removeItem("currentUser");
  window.location.href = "./Home.html";
}

function openForgotPasswordModal() {
  const loginModal = document.getElementById('loginModal');
  const forgotModal = document.getElementById('forgotPasswordModal');
  if (loginModal) closeModal(loginModal);
  if (forgotModal) openModal(forgotModal);
}

// Make it globally available
window.openForgotPasswordModal = openForgotPasswordModal;

function handleForgotPassword(event) {
  event.preventDefault();
  const email = document.getElementById("forgot_password_email")?.value.trim();
  const errorEl = document.getElementById("forgot_password_error");
  const successEl = document.getElementById("forgot_password_success");

  if (!email) {
    if (errorEl) {
      errorEl.textContent = translate("auth.emailRequired");
      errorEl.classList.add("show");
      successEl.style.display = 'none';
    }
    return;
  }

  // Clear previous messages
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.remove("show");
  }
  if (successEl) {
    successEl.style.display = 'none';
  }

  // Check if user exists - try Database first, then fallback to old users array
  let user = null;
  let useDatabase = false;
  let userIdentifier = null;

  // First, try Database module
  if (typeof Database !== 'undefined') {
    user = Database.getUserByEmail(email);
    if (user) {
      useDatabase = true;
      userIdentifier = user.userID;
    }
  }

  // If not found in Database, check old users array
  if (!user) {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    user = users.find((u) => u.email === email);
    if (user) {
      useDatabase = false;
      userIdentifier = email;
    }
  }

  // If still not found, show error
  if (!user) {
    if (errorEl) {
      errorEl.textContent = translate("auth.emailNotFound");
      errorEl.classList.add("show");
    }
    return;
  }

  // Show success message and allow password reset
  if (successEl) {
    const resetFunction = useDatabase ? `resetPassword('${userIdentifier}')` : `resetPasswordOld('${userIdentifier}')`;
    successEl.innerHTML = `
      <div style="margin-bottom: 16px;">
        <strong>${translate("auth.emailFound")}</strong><br>
        ${translate("auth.enterNewPassword")}
      </div>
      <div class="form-group">
        <label class="form-label" for="new_password">${translate("auth.newPassword")}</label>
        <div class="password-field">
          <input class="form-input" type="password" id="new_password" required placeholder="${translate("auth.newPasswordPlaceholder")}">
          <button type="button" class="toggle-password" onclick="togglePasswordVisibility('new_password', this)">
            <i class="fa-solid fa-eye"></i>
            <i class="fa-solid fa-eye-slash"></i>
          </button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="confirm_new_password">${translate("auth.confirmPassword")}</label>
        <div class="password-field">
          <input class="form-input" type="password" id="confirm_new_password" required placeholder="${translate("auth.confirmPasswordPlaceholder")}">
          <button type="button" class="toggle-password" onclick="togglePasswordVisibility('confirm_new_password', this)">
            <i class="fa-solid fa-eye"></i>
            <i class="fa-solid fa-eye-slash"></i>
          </button>
        </div>
      </div>
      <button type="button" class="form-submit secondary" onclick="${resetFunction}">${translate("auth.updatePassword")}</button>
    `;
    successEl.style.display = 'block';
  }
}

function resetPassword(userID) {
  const newPassword = document.getElementById("new_password")?.value;
  const confirmPassword = document.getElementById("confirm_new_password")?.value;
  const errorEl = document.getElementById("forgot_password_error");
  const successEl = document.getElementById("forgot_password_success");

  if (!newPassword || !confirmPassword) {
    if (errorEl) {
      errorEl.textContent = translate("auth.allFieldsRequired");
      errorEl.classList.add("show");
    }
    return;
  }

  if (newPassword !== confirmPassword) {
    if (errorEl) {
      errorEl.textContent = translate("auth.passwordsDoNotMatch");
      errorEl.classList.add("show");
    }
    return;
  }

  if (newPassword.length < 6) {
    if (errorEl) {
      errorEl.textContent = translate("auth.passwordTooShort");
      errorEl.classList.add("show");
    }
    return;
  }

  // Update password using Database module
  if (typeof Database !== 'undefined') {
    const passwordHash = Database.hashPassword(newPassword);
    Database.updateUser(userID, { passwordHash });

    // Show success and redirect to login
    if (successEl) {
      successEl.innerHTML = `<strong>${translate("auth.passwordResetSuccess")}</strong><br>${translate("auth.redirectingToLogin")}`;
      successEl.style.display = 'block';
    }
    if (errorEl) {
      errorEl.classList.remove("show");
    }

    setTimeout(() => {
      closeModal(document.getElementById('forgotPasswordModal'));
      openModal(document.getElementById('loginModal'));
      // Pre-fill email in login form
      const loginEmail = document.getElementById("login_email");
      const forgotEmail = document.getElementById("forgot_password_email");
      if (loginEmail && forgotEmail) {
        loginEmail.value = forgotEmail.value;
      }
    }, 2000);
  }
}

// Make resetPassword functions globally available
window.resetPassword = resetPassword;
window.resetPasswordOld = resetPasswordOld;
window.handleForgotPassword = handleForgotPassword;

function resetPasswordOld(email) {
  const newPassword = document.getElementById("new_password")?.value;
  const confirmPassword = document.getElementById("confirm_new_password")?.value;
  const errorEl = document.getElementById("forgot_password_error");
  const successEl = document.getElementById("forgot_password_success");

  if (!newPassword || !confirmPassword) {
    if (errorEl) {
      errorEl.textContent = translate("auth.allFieldsRequired");
      errorEl.classList.add("show");
    }
    return;
  }

  if (newPassword !== confirmPassword) {
    if (errorEl) {
      errorEl.textContent = translate("auth.passwordsDoNotMatch");
      errorEl.classList.add("show");
    }
    return;
  }

  if (newPassword.length < 6) {
    if (errorEl) {
      errorEl.textContent = translate("auth.passwordTooShort");
      errorEl.classList.add("show");
    }
    return;
  }

  // Update password in old users array
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const userIndex = users.findIndex((u) => u.email === email);
  
  if (userIndex !== -1) {
    users[userIndex].password = newPassword;
    localStorage.setItem("users", JSON.stringify(users));

    // Also update Database module if user exists there (keep them in sync)
    if (typeof Database !== 'undefined') {
      const dbUser = Database.getUserByEmail(email);
      if (dbUser) {
        const passwordHash = Database.hashPassword(newPassword);
        Database.updateUser(dbUser.userID, { passwordHash });
      }
    }

    // Show success and redirect to login
    if (successEl) {
      successEl.innerHTML = `<strong>${translate("auth.passwordResetSuccess")}</strong><br>${translate("auth.redirectingToLogin")}`;
      successEl.style.display = 'block';
    }
    if (errorEl) {
      errorEl.classList.remove("show");
    }

    setTimeout(() => {
      closeModal(document.getElementById('forgotPasswordModal'));
      openModal(document.getElementById('loginModal'));
      // Pre-fill email in login form
      const loginEmail = document.getElementById("login_email");
      const forgotEmail = document.getElementById("forgot_password_email");
      if (loginEmail && forgotEmail) {
        loginEmail.value = forgotEmail.value;
      }
    }, 2000);
  }
}

function closeModal(modal) {
  if (!modal) return;
  
  // Get modal content for closing animation
  const modalContent = modal.querySelector(".modal-content");
  
  // Add closing classes to trigger animation
  modal.classList.add("closing");
  if (modalContent) {
    modalContent.classList.add("closing");
  }
  
  // Wait for animation to complete before hiding
  setTimeout(() => {
    modal.classList.remove("active", "closing");
    if (modalContent) {
      modalContent.classList.remove("closing");
    }
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";

    const errorEl = modal.querySelector(".error-message");
    const successEl = modal.querySelector(".success-message");
    if (errorEl) {
      errorEl.classList.remove("show");
      errorEl.textContent = "";
    }

    if (successEl) {
      successEl.classList.remove("show");
      successEl.textContent = "";
    }

    // Reset login form if this is the login modal
    if (modal.id === "loginModal") {
      const loginEmail = document.getElementById("login_email");
      const loginPassword = document.getElementById("login_password");
      const recentUsersSection = document.getElementById("recent_users_section");
      const loginForm = document.getElementById("login_form");

      if (loginEmail) {
        loginEmail.value = "";
        loginEmail.readOnly = false;
      }
      if (loginPassword) {
        loginPassword.value = "";
      }
      if (recentUsersSection) {
        recentUsersSection.style.display = "none";
      }
      if (loginForm) {
        loginForm.style.display = "block";
      }
    }
  }, 300); // Match animation duration
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.add("active");
  document.body.classList.add("modal-open");
  
  // If opening login modal, display recent users if available
  if (modal.id === "loginModal") {
    setTimeout(() => {
      displayRecentUsers();
    }, 100);
  }
}

function setupModalTriggers() {
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");
  const loginButton = document.getElementById("loginButton");
  const signupButton = document.getElementById("signupButton");
  const visitorButton = document.getElementById("visitorButton");
  const closeButtons = document.querySelectorAll("[data-modal-close]");
  const modals = document.querySelectorAll(".modal");

  loginButton?.addEventListener("click", () => openModal(loginModal));
  signupButton?.addEventListener("click", () => openModal(signupModal));
  visitorButton?.addEventListener("click", continueAsVisitor);

  closeButtons.forEach((btn) => {
    const modalId = btn.getAttribute("data-modal-close");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const modal = document.getElementById(modalId);
      closeModal(modal);
    });
  });

  // Also handle direct .modal-close clicks (fallback)
  document.querySelectorAll('.modal-close').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const modal = btn.closest('.modal');
      if (modal) {
        closeModal(modal);
      }
    });
  });

  modals.forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      modals.forEach((modal) => {
        if (modal.classList.contains("active")) {
          closeModal(modal);
        }
      });
    }
  });
}

function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isVisible = input.type === "text";
  input.type = isVisible ? "password" : "text";
  const eyeIcon = button.querySelector(".fa-eye");
  const eyeSlashIcon = button.querySelector(".fa-eye-slash");
  if (eyeIcon && eyeSlashIcon) {
    eyeIcon.style.display = isVisible ? "inline" : "none";
    eyeSlashIcon.style.display = isVisible ? "none" : "inline";
  }
}

function setupPasswordToggles() {
  document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.closest(".password-field")?.querySelector("input");
      if (!input) return;
      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      button.classList.toggle("is-visible", !isVisible);
      button.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
      button.setAttribute("title", isVisible ? "Show password" : "Hide password");
    });
  });
}

// Make togglePasswordVisibility globally available
window.togglePasswordVisibility = togglePasswordVisibility;

function saveRecentUser(user) {
  const recentUsers = JSON.parse(localStorage.getItem("recentUsers") || "[]");
  
  // Remove user if already exists (to avoid duplicates)
  const filteredUsers = recentUsers.filter((u) => u.email !== user.email);
  
  // Add user to the beginning
  const updatedUsers = [
    {
      email: user.email,
      firstName: user.firstName || user.name?.split(" ")[0] || user.username?.split(" ")[0] || "",
      lastName: user.lastName || "",
      name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "",
    },
    ...filteredUsers,
  ];
  
  // Keep only the last 5 recent users
  const limitedUsers = updatedUsers.slice(0, 5);
  
  localStorage.setItem("recentUsers", JSON.stringify(limitedUsers));
}

function deleteRecentUser(email) {
  if (!confirm(`Are you sure you want to remove this account from recent users?`)) {
    return;
  }
  
  const recentUsers = JSON.parse(localStorage.getItem("recentUsers") || "[]");
  const filteredUsers = recentUsers.filter((u) => u.email !== email);
  localStorage.setItem("recentUsers", JSON.stringify(filteredUsers));
  
  // Refresh the display
  displayRecentUsers();
}

function displayRecentUsers() {
  const recentUsers = JSON.parse(localStorage.getItem("recentUsers") || "[]");
  const recentUsersSection = document.getElementById("recent_users_section");
  const recentUsersList = document.getElementById("recent_users_list");
  const loginForm = document.getElementById("login_form");
  
  if (!recentUsersSection || !recentUsersList || !loginForm) return;
  
  if (recentUsers.length > 0) {
    // Show recent users section, hide login form
    recentUsersSection.style.display = "block";
    loginForm.style.display = "none";
    
    // Clear previous list
    recentUsersList.innerHTML = "";
    
    // Create user cards
    recentUsers.forEach((user) => {
      const userCard = document.createElement("div");
      userCard.className = "recent-user-card";
      userCard.innerHTML = `
        <div class="recent-user-avatar">
          <span>${(user.firstName || user.name || user.email || "U")[0].toUpperCase()}</span>
        </div>
        <div class="recent-user-info">
          <div class="recent-user-name">${user.name || user.firstName || user.email}</div>
          <div class="recent-user-email">${user.email}</div>
        </div>
        <button class="recent-user-delete" aria-label="Delete user" title="Delete this account">
          <i class="fas fa-times"></i>
        </button>
      `;
      
      // Handle card click (for login)
      userCard.addEventListener("click", (e) => {
        // Don't trigger login if clicking the delete button
        if (!e.target.closest('.recent-user-delete')) {
          // Check if user has a deviceToken stored (for auto-login)
          const deviceToken = localStorage.getItem('deviceToken');
          let shouldAutoLogin = false;
          let tokenToUse = null;
          
          // First, check if there's a deviceToken in localStorage that matches this user
          if (deviceToken && typeof Database !== 'undefined') {
            const userByToken = Database.getUserByDeviceToken(deviceToken);
            if (userByToken && userByToken.email === user.email) {
              shouldAutoLogin = true;
              tokenToUse = deviceToken;
            }
          }
          
          // If not found, check if this user has a deviceToken stored in Database
          if (!shouldAutoLogin && typeof Database !== 'undefined') {
            const userFromDB = Database.getUserByEmail(user.email);
            if (userFromDB && userFromDB.deviceToken) {
              shouldAutoLogin = true;
              tokenToUse = userFromDB.deviceToken;
              localStorage.setItem('deviceToken', userFromDB.deviceToken);
            }
          }
          
          // If user has deviceToken, auto-login
          if (shouldAutoLogin && tokenToUse) {
            autoLoginWithDeviceToken(user.email, tokenToUse);
            return;
          }
          
          // If no deviceToken, show login form
          selectRecentUser(user.email);
        }
      });
      
      // Handle delete button click
      const deleteBtn = userCard.querySelector('.recent-user-delete');
      if (deleteBtn) {
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevent card click
          deleteRecentUser(user.email);
        });
      }
      
      recentUsersList.appendChild(userCard);
    });
  } else {
    // Hide recent users section, show login form
    recentUsersSection.style.display = "none";
    loginForm.style.display = "block";
  }
}

function autoLoginWithDeviceToken(email, deviceToken) {
  // Find user by email
  let user = null;
  let useDatabase = false;
  
  // First, try Database module
  if (typeof Database !== 'undefined') {
    user = Database.getUserByEmail(email);
    if (user) {
      useDatabase = true;
    }
  }
  
  // If not found in Database, check old users array
  if (!user) {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    user = users.find((u) => u.email === email);
  }
  
  if (!user) {
    // User not found, fall back to normal login
    selectRecentUser(email);
    return;
  }
  
  // Prepare user data
  let currentUserData;
  if (useDatabase) {
    currentUserData = {
      userID: user.userID,
      fullName: user.fullName || user.email,
      email: user.email,
      username: user.fullName || user.email
    };
  } else {
    currentUserData = {
      email: user.email,
      name: user.name || user.firstName || user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };
  }
  
  // Save current user
  localStorage.setItem("currentUser", JSON.stringify(currentUserData));
  localStorage.removeItem("guest");
  
  // Save deviceToken if not already saved
  if (deviceToken) {
    localStorage.setItem('deviceToken', deviceToken);
  }
  
  // Redirect to Home
  window.location.href = "./Home.html";
}

function selectRecentUser(email) {
  const loginEmail = document.getElementById("login_email");
  const loginPassword = document.getElementById("login_password");
  const recentUsersSection = document.getElementById("recent_users_section");
  const loginForm = document.getElementById("login_form");
  const loginError = document.getElementById("login_error");
  
  if (loginEmail) {
    loginEmail.value = email;
    loginEmail.readOnly = true;
  }
  
  if (loginPassword) {
    loginPassword.value = "";
    loginPassword.focus();
  }
  
  // Hide recent users, show login form
  if (recentUsersSection) {
    recentUsersSection.style.display = "none";
  }
  if (loginForm) {
    loginForm.style.display = "block";
  }
  
  // Clear any previous errors
  if (loginError) {
    loginError.textContent = "";
    loginError.classList.remove("show");
  }
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const email = document.getElementById("login_email")?.value.trim();
  const password = document.getElementById("login_password")?.value;
  const rememberDevice = document.getElementById("remember_device")?.checked || false;
  const errorEl = document.getElementById("login_error");

  let user = null;
  let useDatabase = false;
  let passwordValid = false;

  // First, try Database module
  if (typeof Database !== 'undefined') {
    user = Database.getUserByEmail(email);
    if (user && user.passwordHash) {
      // User exists in Database with hashed password
      passwordValid = Database.verifyPassword(password, user.passwordHash);
      useDatabase = true;
    }
  }

  // If not found in Database or password doesn't match, check old users array
  if (!user || !passwordValid) {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const oldUser = users.find((u) => u.email === email);
    
    if (oldUser) {
      // Check plain text password match
      if (oldUser.password === password) {
        user = oldUser;
        useDatabase = false;
        passwordValid = true;
      }
    }
  }

  // If still not valid, show error
  if (!user || !passwordValid) {
    if (errorEl) {
      errorEl.textContent = translate("auth.invalidCredentials");
      errorEl.classList.add("show");
    }
    return;
  }

  // Generate and save deviceToken if "Remember this device" is checked
  if (rememberDevice) {
    if (useDatabase && typeof Database !== 'undefined') {
      const deviceToken = Database.generateDeviceToken();
      Database.updateUser(user.userID, { deviceToken });
      localStorage.setItem('deviceToken', deviceToken);
    } else {
      // For old users, generate a simple device token
      const deviceToken = `DEV${Date.now()}${Math.random().toString(36).substr(2, 16)}`;
      localStorage.setItem('deviceToken', deviceToken);
    }
  }

  // Prepare user data
  let currentUserData;
  if (useDatabase) {
    currentUserData = {
      userID: user.userID,
      username: user.fullName || user.email,
      email: user.email,
      fullName: user.fullName,
      name: user.fullName || user.email
    };
  } else {
    // Old user format
    const derivedFirstName =
      user.firstName ||
      (user.name ? user.name.split(" ")[0] : undefined) ||
      (user.username ? user.username.split(" ")[0] : undefined) ||
      "";

    currentUserData = {
      username: user.username || user.firstName || user.name,
      email: user.email,
      name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      firstName: derivedFirstName,
      lastName: user.lastName || "",
    };
  }

  // Save to recent users
  saveRecentUser(currentUserData);

  localStorage.setItem("currentUser", JSON.stringify(currentUserData));
  localStorage.removeItem("guest");
  
  // Load recents, templates, groups
  // Then redirect to Home
  window.location.href = "./Home.html";
}

function handleSignupSubmit(event) {
  event.preventDefault();

  const firstName = document.getElementById("signup_first_name")?.value.trim();
  const lastName = document.getElementById("signup_last_name")?.value.trim();
  const email = document.getElementById("signup_email")?.value.trim();
  const password = document.getElementById("signup_password")?.value;
  const confirmPassword = document.getElementById("signup_confirm_password")?.value;
  const errorEl = document.getElementById("signup_error");

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    if (errorEl) {
      errorEl.textContent = translate("auth.allFieldsRequired") || "Please complete all fields.";
      errorEl.classList.add("show");
    }
    return;
  }

  if (password !== confirmPassword) {
    if (errorEl) {
      errorEl.textContent = translate("auth.passwordMismatch") || "Passwords do not match.";
      errorEl.classList.add("show");
    }
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "[]");
  if (users.some((u) => u.email === email)) {
    if (errorEl) {
      errorEl.textContent = translate("auth.accountExists") || "An account with this email already exists.";
      errorEl.classList.add("show");
    }
    return;
  }

  const newUser = {
    firstName,
    lastName,
    email,
    password,
    username: `${firstName} ${lastName}`.trim(),
  };

  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  const currentUserData = {
    username: newUser.username,
    email: newUser.email,
    name: newUser.username,
    firstName: newUser.firstName || newUser.username.split(" ")[0] || newUser.username,
    lastName: newUser.lastName || "",
  };

  // Save to recent users
  saveRecentUser(currentUserData);

  localStorage.setItem("currentUser", JSON.stringify(currentUserData));
  localStorage.removeItem("guest");
  window.location.href = "./Home.html";
}

function initAuthForms() {
  const loginForm = document.getElementById("login_form");
  const signupForm = document.getElementById("signup_form");
  const useDifferentAccountBtn = document.getElementById("use_different_account_btn");

  loginForm?.addEventListener("submit", handleLoginSubmit);
  signupForm?.addEventListener("submit", handleSignupSubmit);

  // Handle "Use another account" button
  useDifferentAccountBtn?.addEventListener("click", () => {
    const recentUsersSection = document.getElementById("recent_users_section");
    const loginForm = document.getElementById("login_form");
    const loginEmail = document.getElementById("login_email");
    const loginPassword = document.getElementById("login_password");
    const loginError = document.getElementById("login_error");

    if (recentUsersSection) {
      recentUsersSection.style.display = "none";
    }
    if (loginForm) {
      loginForm.style.display = "block";
    }
    if (loginEmail) {
      loginEmail.value = "";
      loginEmail.readOnly = false;
      loginEmail.focus();
    }
    if (loginPassword) {
      loginPassword.value = "";
    }
    if (loginError) {
      loginError.textContent = "";
      loginError.classList.remove("show");
    }
  });

  initSignupFlow();
}

function initAuthPage() {
  setLanguageHandlers();
  checkAuth();
  setupModalTriggers();
  setupPasswordToggles();
  initAuthForms();
}

document.addEventListener("DOMContentLoaded", initAuthPage);

function initSignupFlow() {
  const steps = document.querySelectorAll(".signup-step");
  if (!steps.length) return;

  const continueBtn = document.getElementById("signup_step_continue");
  const backBtn = document.getElementById("signup_step_back");
  const stepLabel = document.getElementById("signup_flow_step");
  const progressBar = document.getElementById("signup_flow_progress");
  const firstNameInput = document.getElementById("signup_first_name");
  const lastNameInput = document.getElementById("signup_last_name");
  const errorEl = document.getElementById("signup_error");

  let currentStep = 1;

  const showStep = (step) => {
    currentStep = step;
    steps.forEach((stepEl) => {
      const matches = Number(stepEl.dataset.step) === step;
      stepEl.classList.toggle("active", matches);
    });
    if (stepLabel) stepLabel.textContent = String(step);
    if (progressBar) progressBar.style.width = step === 1 ? "50%" : "100%";
    if (backBtn) backBtn.style.display = step === 2 ? "inline-flex" : "none";
  };

  showStep(1);

  continueBtn?.addEventListener("click", () => {
    const firstName = firstNameInput?.value.trim();
    const lastName = lastNameInput?.value.trim();
    if (!firstName || !lastName) {
      if (errorEl) {
        errorEl.textContent = translate("auth.allFieldsRequired") || "Please enter your first and last name to continue.";
        errorEl.classList.add("show");
      }
      return;
    }

    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.remove("show");
    }

    showStep(2);
    document.getElementById("signup_email")?.focus();
  });

  backBtn?.addEventListener("click", () => {
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.remove("show");
    }
    showStep(1);
    firstNameInput?.focus();
  });
}


