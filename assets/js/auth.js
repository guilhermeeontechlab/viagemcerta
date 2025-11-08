// ========================================
// Viagem Certa - Autenticação
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // Verifica qual página está ativa e inicializa
  const currentPage = window.location.pathname.split('/').pop();
  
  if (currentPage === 'login.html' || currentPage === '') {
    initLogin();
  } else if (currentPage === 'cadastro.html') {
    initCadastro();
  } else if (currentPage === 'recuperar-senha.html') {
    initRecuperarSenha();
  }
  
  // Toggle Password Visibility (usado em todas as páginas)
  initPasswordToggle();
});

// ========================================
// Login
// ========================================
function initLogin() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;
  
  // Validação em tempo real
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
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
    const remember = document.getElementById('remember')?.checked || false;
    
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
    await handleLogin(email, password, remember);
  });
}

async function handleLogin(email, password, remember) {
  setButtonLoading('submit-btn', true);
  hideGeneralError();
  
  try {
    // Buscar usuário no banco de dados
    const passwordHash = await hashPassword(password);
    
    const { data, error } = await supabaseClient
      .from('cadastros')
      .select('*')
      .eq('email', email)
      .eq('senha', passwordHash)
      .single();
    
    if (error || !data) {
      throw new Error('E-mail ou senha incorretos');
    }
    
    // Login bem-sucedido
    console.log('Login realizado:', { email, remember });
    
    // Salvar dados do usuário
    const userData = {
      id: data.id,
      email: data.email,
      nome: data.nome,
      telefone: data.telefone,
      cpf: data.cpf,
      createdAt: data.created_at
    };
    
    storage.set('auth_user', userData);
    if (remember) {
      storage.set('remember_me', true);
    }
    
    // Feedback visual
    showToast('Login realizado com sucesso!', 'success');
    
    // Redirecionar para dashboard
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
    
  } catch (error) {
    console.error('Erro no login:', error);
    showGeneralError(error.message || 'E-mail ou senha incorretos. Tente novamente.');
    setButtonLoading('submit-btn', false);
  }
}

// ========================================
// Cadastro
// ========================================
function initCadastro() {
  const cadastroForm = document.getElementById('cadastro-form');
  if (!cadastroForm) return;
  
  // Campos
  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  const telefoneInput = document.getElementById('telefone');
  const cpfInput = document.getElementById('cpf');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const termsInput = document.getElementById('terms');
  
  // Aplicar máscara de telefone
  if (telefoneInput) {
    applyPhoneMask(telefoneInput);
  }
  
  // Aplicar máscara de CPF
  if (cpfInput) {
    cpfInput.addEventListener('input', (e) => {
      e.target.value = cpfMask(e.target.value);
    });
  }
  
  // Indicador de força da senha
  if (passwordInput) {
    const strengthBars = [
      document.getElementById('strength-bar-1'),
      document.getElementById('strength-bar-2'),
      document.getElementById('strength-bar-3'),
      document.getElementById('strength-bar-4')
    ];
    const strengthText = document.getElementById('strength-text');
    
    passwordInput.addEventListener('input', () => {
      updatePasswordStrength(passwordInput.value, strengthBars, strengthText);
      hideError('password');
    });
  }
  
  // Validações em tempo real
  if (nomeInput) {
    nomeInput.addEventListener('blur', () => {
      if (!nomeInput.value.trim()) {
        showError('nome', 'Nome é obrigatório');
      }
    });
    nomeInput.addEventListener('input', () => hideError('nome'));
  }
  
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      validateEmail(emailInput.value);
    });
    emailInput.addEventListener('input', () => hideError('email'));
  }
  
  if (telefoneInput) {
    telefoneInput.addEventListener('blur', () => {
      if (!isValidPhone(telefoneInput.value)) {
        showError('telefone', 'Telefone inválido');
      }
    });
    telefoneInput.addEventListener('input', () => hideError('telefone'));
  }
  
  if (cpfInput) {
    cpfInput.addEventListener('blur', () => {
      if (cpfInput.value && !isValidCPF(cpfInput.value)) {
        showError('cpf', 'CPF inválido');
      }
    });
    cpfInput.addEventListener('input', () => hideError('cpf'));
  }
  
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', () => hideError('confirm-password'));
  }
  
  if (termsInput) {
    termsInput.addEventListener('change', () => hideError('terms'));
  }
  
  // Submit
  cadastroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();
    const telefone = telefoneInput.value.trim();
    const cpf = cpfInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const terms = termsInput.checked;
    
    // Validações
    let isValid = true;
    
    if (!nome) {
      showError('nome', 'Nome é obrigatório');
      isValid = false;
    }
    
    if (!validateEmail(email)) {
      isValid = false;
    }
    
    if (!isValidPhone(telefone)) {
      showError('telefone', 'Telefone inválido');
      isValid = false;
    }
    
    if (cpf && !isValidCPF(cpf)) {
      showError('cpf', 'CPF inválido');
      isValid = false;
    }
    
    if (password.length < 8) {
      showError('password', 'Senha deve ter no mínimo 8 caracteres');
      isValid = false;
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      showError('password', 'Senha deve conter letras maiúsculas, minúsculas e números');
      isValid = false;
    }
    
    if (password !== confirmPassword) {
      showError('confirm-password', 'As senhas não coincidem');
      isValid = false;
    }
    
    if (!terms) {
      showError('terms', 'Você deve aceitar os termos de uso');
      isValid = false;
    }
    
    if (!isValid) return;
    
    // Processar cadastro
    await handleCadastro({ nome, email, telefone, cpf, password });
  });
}

// Enviar dados de boas-vindas para webhook N8N
async function sendWelcomeWebhook(userData) {
  try {
    const webhookUrl = 'https://projetos-n8n.uhuqao.easypanel.host/webhook-test/boas-vindas';
    
    // Formatar telefone para padrão internacional
    const telefoneFormatado = formatPhoneToInternational(userData.telefone);
    
    const payload = {
      nome: userData.nome,
      telefone: telefoneFormatado,
      cpf: userData.cpf || '',
      email: userData.email
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      console.log('✅ Webhook de boas-vindas enviado com sucesso');
    } else {
      console.warn('⚠️ Webhook retornou status:', response.status);
    }
  } catch (error) {
    // Não bloquear o fluxo se o webhook falhar
    console.error('❌ Erro ao enviar webhook de boas-vindas:', error);
  }
}

async function handleCadastro(userData) {
  setButtonLoading('submit-btn', true);
  hideGeneralError();
  
  try {
    // Verificar se e-mail já existe
    const { data: existingUser } = await supabaseClient
      .from('cadastros')
      .select('email')
      .eq('email', userData.email)
      .single();
    
    if (existingUser) {
      throw new Error('Este e-mail já está cadastrado');
    }
    
    // Hash da senha
    const passwordHash = await hashPassword(userData.password);
    
    // Inserir novo usuário
    const { data, error } = await supabaseClient
      .from('cadastros')
      .insert([
        {
          nome: userData.nome,
          email: userData.email,
          telefone: userData.telefone,
          cpf: userData.cpf || null,
          senha: passwordHash
        }
      ])
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message || 'Erro ao criar conta');
    }
    
    console.log('Cadastro realizado:', data);
    
    // Enviar dados para webhook de boas-vindas
    await sendWelcomeWebhook({
      nome: data.nome,
      telefone: data.telefone,
      cpf: data.cpf,
      email: data.email
    });
    
    // Salvar dados do usuário
    const user = {
      id: data.id,
      email: data.email,
      nome: data.nome,
      telefone: data.telefone,
      cpf: data.cpf,
      createdAt: data.created_at
    };
    
    storage.set('auth_user', user);
    
    // Feedback visual
    showToast('Cadastro realizado com sucesso!', 'success');
    
    // Redirecionar para dashboard
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
    
  } catch (error) {
    console.error('Erro no cadastro:', error);
    showGeneralError(error.message || 'Erro ao criar conta. Tente novamente.');
    setButtonLoading('submit-btn', false);
  }
}

// ========================================
// Recuperar Senha
// ========================================
function initRecuperarSenha() {
  const recuperarForm = document.getElementById('recuperar-senha-form');
  if (!recuperarForm) return;
  
  const emailInput = document.getElementById('email');
  
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      validateEmail(emailInput.value);
    });
    emailInput.addEventListener('input', () => hideError('email'));
  }
  
  recuperarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!validateEmail(email)) {
      return;
    }
    
    await handleRecuperarSenha(email);
  });
}

async function handleRecuperarSenha(email) {
  setButtonLoading('submit-btn', true);
  hideGeneralError();
  hideSuccess();
  
  try {
    // Verificar se e-mail existe
    const { data } = await supabaseClient
      .from('cadastros')
      .select('email')
      .eq('email', email)
      .single();
    
    if (!data) {
      throw new Error('E-mail não encontrado');
    }
    
    // NOTA: Em produção, implemente envio de e-mail via Edge Function ou serviço de e-mail
    console.log('Link de recuperação enviado para:', email);
    
    // Mostrar mensagem de sucesso
    showSuccess();
    
    // Limpar formulário
    document.getElementById('recuperar-senha-form').reset();
    
    setButtonLoading('submit-btn', false);
    
  } catch (error) {
    console.error('Erro ao recuperar senha:', error);
    showGeneralError(error.message || 'Erro ao enviar link de recuperação. Tente novamente.');
    setButtonLoading('submit-btn', false);
  }
}

// ========================================
// Password Toggle Visibility
// ========================================
function initPasswordToggle() {
  const toggleButtons = [
    { btn: 'toggle-password', input: 'password', icon: 'eye-icon' },
    { btn: 'toggle-confirm-password', input: 'confirm-password', icon: 'eye-icon-confirm' }
  ];
  
  toggleButtons.forEach(({ btn, input, icon }) => {
    const toggleBtn = document.getElementById(btn);
    const passwordInput = document.getElementById(input);
    const eyeIcon = document.getElementById(icon);
    
    if (!toggleBtn || !passwordInput) return;
    
    toggleBtn.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      
      if (eyeIcon) {
        eyeIcon.classList.toggle('fa-eye');
        eyeIcon.classList.toggle('fa-eye-slash');
      }
    });
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
  
  showSuccess('email');
  return true;
}

// ========================================
// Helpers
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

function showSuccess() {
  const successDiv = document.getElementById('success-message');
  if (successDiv) {
    successDiv.classList.remove('hidden');
  }
}

function hideSuccess() {
  const successDiv = document.getElementById('success-message');
  if (successDiv) {
    successDiv.classList.add('hidden');
  }
}

// ========================================
// Logout (será usado no dashboard)
// ========================================
async function logout() {
  try {
    // TODO: Implementar logout com Supabase
    // const { error } = await supabase.auth.signOut()
    
    // Limpar storage
    storage.remove('auth_user');
    storage.remove('remember_me');
    
    showToast('Logout realizado com sucesso!', 'success');
    
    // Redirecionar para login
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
    
  } catch (error) {
    console.error('Erro no logout:', error);
    showToast('Erro ao fazer logout', 'error');
  }
}

// Exportar função logout
if (typeof window !== 'undefined') {
  window.logout = logout;
}



