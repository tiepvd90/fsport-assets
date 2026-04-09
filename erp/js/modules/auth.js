// ===== AUTH MODULE =====
(function() {
  const VALID_USERS = ERP_CONFIG.users.map(u => u.id);
  
  const loginScreen = document.getElementById('erpLoginScreen');
  const appEl = document.getElementById('erpApp');
  const loginInput = document.getElementById('erpLoginUserInput');
  const loginBtn = document.getElementById('erpLoginBtn');
  const loginError = document.getElementById('erpLoginError');
  const userBtn = document.getElementById('erpUserBtn');
  
  let currentUser = null;
  let onLoginSuccessCallback = null;
  
  function showError(message) {
    if (loginError) {
      loginError.textContent = message;
      loginError.classList.add('is-visible');
    }
  }
  
  function hideError() {
    if (loginError) {
      loginError.classList.remove('is-visible');
    }
  }
  
  function handleLogin() {
    const username = (loginInput?.value || '').trim().toLowerCase();
    
    hideError();
    
    if (!username) {
      showError('Vui lòng nhập tên người dùng');
      return;
    }
    
    if (!VALID_USERS.includes(username)) {
      // Thông báo chung chung, không tiết lộ user hợp lệ
      showError('Tên đăng nhập không đúng');
      return;
    }
    
    // Đăng nhập thành công
    currentUser = username;
    ERP_CONFIG.setCurrentUser(username);
    
    if (userBtn) {
      userBtn.textContent = username.charAt(0).toUpperCase();
    }
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (appEl) appEl.style.display = 'block';
    
    if (onLoginSuccessCallback) {
      onLoginSuccessCallback(username);
    }
    
    if (window.ERP_TOAST) {
      ERP_TOAST.success(`Chào ${username}!`);
    }
  }
  
  function logout() {
    currentUser = null;
    ERP_CONFIG.setCurrentUser(null);
    
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appEl) appEl.style.display = 'none';
    if (loginInput) loginInput.value = '';
    hideError();
  }
  
  function checkAuth() {
    const savedUser = ERP_CONFIG.getCurrentUser();
    if (savedUser) {
      currentUser = savedUser;
      if (userBtn) userBtn.textContent = savedUser.charAt(0).toUpperCase();
      if (loginScreen) loginScreen.style.display = 'none';
      if (appEl) appEl.style.display = 'block';
      return true;
    }
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appEl) appEl.style.display = 'none';
    return false;
  }
  
  function getCurrentUser() {
    return currentUser || ERP_CONFIG.getCurrentUser();
  }
  
  function onLoginSuccess(callback) {
    onLoginSuccessCallback = callback;
  }
  
  function init() {
    const isLoggedIn = checkAuth();
    
    if (loginBtn) {
      loginBtn.addEventListener('click', handleLogin);
    }
    
    if (loginInput) {
      loginInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleLogin();
        }
      });
      loginInput.addEventListener('input', hideError);
    }
    
    if (userBtn) {
      let pressTimer;
      const startPress = () => {
        pressTimer = setTimeout(() => {
          if (confirm('Đăng xuất?')) {
            logout();
          }
        }, 1000);
      };
      const cancelPress = () => clearTimeout(pressTimer);
      
      userBtn.addEventListener('mousedown', startPress);
      userBtn.addEventListener('mouseup', cancelPress);
      userBtn.addEventListener('mouseleave', cancelPress);
      userBtn.addEventListener('touchstart', startPress);
      userBtn.addEventListener('touchend', cancelPress);
    }
    
    return isLoggedIn;
  }
  
  window.ERP_AUTH = {
    init,
    getCurrentUser,
    onLoginSuccess,
    logout,
    checkAuth
  };
})();