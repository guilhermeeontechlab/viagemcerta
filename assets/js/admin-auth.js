// ========================================
// Viagem Certa - Autenticação de Admin
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop();
  
  if (currentPage === 'admin-login.html') {
    initAdminLogin();
  }
  
  // Toggle Password Visibility
  initPasswordToggle();
});

// ========================================
// Admin Login
// ========================================
function initAdminLogin() {
  const loginForm = document.getElementById('admin-login-form');
  if (!loginForm) return;
  
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
  // Validação em tempo real
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      validateEmail(emailInput.value);
    });
    
    emailInput.addEventListener('input', () => {
      hideError('email');
    });
  }
  
  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      hideError('password');
    });
  }
  
  // Submit do formulário
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validações
    let isValid = true;
    
    if (!validateEmail(email)) {
      isValid = false;
    }
    
    if (!password) {
      showError('password', 'Senha é obrigatória');
      isValid = false;
    }
    
    if (!isValid) return;
    
    // Processar login
    await handleAdminLogin(email, password);
  });
}

async function handleAdminLogin(email, password) {
  setButtonLoading('submit-btn', true);
  hideGeneralError();
  
  try {
    console.log('🔐 Tentativa de login admin:', email);
    
    // Verificar se Supabase está disponível
    if (typeof supabaseClient === 'undefined') {
      throw new Error('Sistema temporariamente indisponível. Tente novamente em instantes.');
    }
    
    // Hash da senha
    const passwordHash = await hashPassword(password);
    console.log('🔑 Hash da senha gerado');
    
    // Buscar admin no banco de dados
    const { data, error } = await supabaseClient
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('senha', passwordHash)
      .single();
    
    if (error) {
      console.error('❌ Erro na autenticação:', error);
      
      // Verificar se é erro de tabela não existente
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        throw new Error('Sistema em configuração. Contate o administrador.');
      }
      
      throw new Error('E-mail ou senha incorretos');
    }
    
    if (!data) {
      throw new Error('E-mail ou senha incorretos');
    }
    
    console.log('✅ Admin autenticado:', data.nome);
    
    // Salvar dados do admin
    const adminData = {
      id: data.id_admin || data.id,
      email: data.email,
      nome: data.nome,
      is_admin: true,
      createdAt: data.created_at
    };
    
    storage.set('admin_user', adminData);
    storage.set('is_admin', true);
    
    // Registrar tentativa de acesso (log)
    console.log('📝 Acesso admin registrado:', {
      admin: data.nome,
      email: data.email,
      timestamp: new Date().toISOString()
    });
    
    // Feedback visual
    showToast('Login administrativo realizado com sucesso!', 'success');
    
    // Redirecionar para painel admin
    setTimeout(() => {
      window.location.href = 'admin.html';
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erro no login admin:', error);
    showGeneralError(error.message || 'Acesso negado. Credenciais inválidas.');
    setButtonLoading('submit-btn', false);
    
    // Log de tentativa falhada
    console.warn('⚠️ Tentativa de acesso admin falhada:', {
      email: email,
      timestamp: new Date().toISOString()
    });
  }
}

// ========================================
// Verificar Autenticação Admin
// ========================================
function checkAdminAuth() {
  const adminUser = storage.get('admin_user');
  const isAdmin = storage.get('is_admin');
  
  if (!adminUser || !isAdmin) {
    console.warn('⚠️ Acesso negado - redirecionando para login admin');
    window.location.href = 'admin-login.html';
    return false;
  }
  
  console.log('✅ Admin autenticado:', adminUser.nome);
  return true;
}

// ========================================
// Logout Admin
// ========================================
async function logoutAdmin() {
  try {
    const adminUser = storage.get('admin_user');
    
    console.log('👋 Logout admin:', adminUser?.nome);
    
    // Limpar storage
    storage.remove('admin_user');
    storage.remove('is_admin');
    
    showToast('Logout realizado com sucesso!', 'success');
    
    // Redirecionar para login admin
    setTimeout(() => {
      window.location.href = 'admin-login.html';
    }, 500);
    
  } catch (error) {
    console.error('❌ Erro no logout admin:', error);
    showToast('Erro ao fazer logout', 'error');
  }
}

// ========================================
// Toggle Password Visibility
// ========================================
function initPasswordToggle() {
  const toggleBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');
  const eyeIcon = document.getElementById('eye-icon');
  
  if (!toggleBtn || !passwordInput) return;
  
  toggleBtn.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    
    if (eyeIcon) {
      eyeIcon.classList.toggle('fa-eye');
      eyeIcon.classList.toggle('fa-eye-slash');
    }
  });
}

// ========================================
// Validações
// ========================================
function validateEmail(email) {
  if (!email) {
    showError('email', 'E-mail é obrigatório');
    return false;
  }
  
  if (!isValidEmail(email)) {
    showError('email', 'E-mail inválido');
    return false;
  }
  
  return true;
}

// ========================================
// Helpers de UI
// ========================================
function showGeneralError(message) {
  const errorDiv = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');
  
  if (errorDiv && errorText) {
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
  }
}

function hideGeneralError() {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.classList.add('hidden');
  }
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.checkAdminAuth = checkAdminAuth;
  window.logoutAdmin = logoutAdmin;
}

