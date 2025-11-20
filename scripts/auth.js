const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

if (isSafari) {
  // Disable features Safari doesn't support
  disableSpeechRecognition();
  useFallbackDownloader();
  fixButtonsSafari();
  enablePointerEventsFix();
}

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
      `;
      
      userCard.addEventListener("click", () => {
        selectRecentUser(user.email);
      });
      
      recentUsersList.appendChild(userCard);
    });
  } else {
    // Hide recent users section, show login form
    recentUsersSection.style.display = "none";
    loginForm.style.display = "block";
  }
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
  const errorEl = document.getElementById("login_error");

  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    if (errorEl) {
      errorEl.textContent = translate("auth.invalidCredentials");
      errorEl.classList.add("show");
    }
    return;
  }

  const derivedFirstName =
    user.firstName ||
    (user.name ? user.name.split(" ")[0] : undefined) ||
    (user.username ? user.username.split(" ")[0] : undefined) ||
    "";

  const currentUserData = {
    username: user.username || user.firstName || user.name,
    email: user.email,
    name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    firstName: derivedFirstName,
    lastName: user.lastName || "",
  };

  // Save to recent users
  saveRecentUser(currentUserData);

  localStorage.setItem("currentUser", JSON.stringify(currentUserData));
  localStorage.removeItem("guest");
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


