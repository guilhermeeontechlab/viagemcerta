// ========================================
// Viagem Certa - Funções Utilitárias
// ========================================

// Validação de Email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validação de Telefone (formato brasileiro)
function isValidPhone(phone) {
  if (!phone) return false;
  const phoneDigits = phone.replace(/\D/g, '');
  // Aceita telefones com 10 ou 11 dígitos (fixo ou celular)
  return phoneDigits.length === 10 || phoneDigits.length === 11;
}

// Máscara de Telefone
function phoneMask(value) {
  if (!value) return '';
  value = value.replace(/\D/g, '');
  
  // Limitar a 11 dígitos
  value = value.substring(0, 11);
  
  // Aplicar máscara baseada no tamanho
  if (value.length <= 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
  } else {
    // Celular: (XX) 9 XXXX-XXXX
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d{1})(\d{4})(\d{4})$/, '$1 $2-$3');
  }
  
  return value;
}

// Aplicar máscara de telefone em tempo real
function applyPhoneMask(input) {
  input.addEventListener('input', (e) => {
    e.target.value = phoneMask(e.target.value);
  });
}

// Formatar telefone para padrão internacional (adiciona código do país 55)
function formatPhoneToInternational(phone) {
  if (!phone) return '';
  // Remove todos os caracteres não numéricos
  const phoneDigits = phone.replace(/\D/g, '');
  // Adiciona código do país 55 (Brasil)
  return '55' + phoneDigits;
}

// Validação de Força da Senha
function getPasswordStrength(password) {
  if (!password) return { strength: 0, text: '' };
  
  let strength = 0;
  
  // Comprimento
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  
  // Contém número
  if (/\d/.test(password)) strength++;
  
  // Contém letra maiúscula e minúscula
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  
  // Contém caractere especial
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  const strengthLevel = Math.min(strength, 4);
  const strengthTexts = ['', 'Fraca', 'Regular', 'Boa', 'Forte'];
  
  return {
    strength: strengthLevel,
    text: strengthTexts[strengthLevel]
  };
}

// Atualizar indicador visual de força da senha
function updatePasswordStrength(password, bars, textElement) {
  const { strength, text } = getPasswordStrength(password);
  
  const colors = ['', '#ef4444', '#f59e0b', '#10b981', '#059669'];
  
  bars.forEach((bar, index) => {
    if (index < strength) {
      bar.style.backgroundColor = colors[strength];
    } else {
      bar.style.backgroundColor = '#e5e7eb';
    }
  });
  
  if (textElement) {
    textElement.textContent = text;
    textElement.style.color = colors[strength] || '#9ca3af';
  }
}

// Formatação de Data (DD/MM/YYYY)
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Formatação de Data e Hora (DD/MM/YYYY HH:MM)
function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Formatação de Moeda (R$)
function formatCurrency(value) {
  if (!value && value !== 0) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Debounce Function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Toast Notification
function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'check-circle' : 
               type === 'error' ? 'exclamation-circle' : 
               'info-circle';
  
  toast.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
    <button class="ml-4 text-gray-600 hover:text-gray-900" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Create Toast Container if not exists
function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// Show Error Message
function showError(element, message) {
  const input = document.getElementById(element);
  const errorElement = document.getElementById(`${element}-error`);
  
  if (input) {
    input.classList.add('error');
    input.classList.remove('success');
  }
  
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
  }
}

// Hide Error Message
function hideError(element) {
  const input = document.getElementById(element);
  const errorElement = document.getElementById(`${element}-error`);
  
  if (input) {
    input.classList.remove('error');
  }
  
  if (errorElement) {
    errorElement.classList.remove('show');
  }
}

// Show Success (green border)
function showSuccess(element) {
  const input = document.getElementById(element);
  if (input) {
    input.classList.add('success');
    input.classList.remove('error');
  }
}

// Clear all errors in form
function clearFormErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  const inputs = form.querySelectorAll('.form-input');
  const errors = form.querySelectorAll('.form-error');
  
  inputs.forEach(input => {
    input.classList.remove('error', 'success');
  });
  
  errors.forEach(error => {
    error.classList.remove('show');
  });
}

// Loading State for Button
function setButtonLoading(buttonId, isLoading) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  
  const btnText = button.querySelector('#btn-text');
  const btnLoading = button.querySelector('#btn-loading');
  
  if (isLoading) {
    button.disabled = true;
    button.style.opacity = '0.7';
    if (btnText) btnText.classList.add('hidden');
    if (btnLoading) btnLoading.classList.remove('hidden');
  } else {
    button.disabled = false;
    button.style.opacity = '1';
    if (btnText) btnText.classList.remove('hidden');
    if (btnLoading) btnLoading.classList.add('hidden');
  }
}

// Local Storage Helper
const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error saving to localStorage:', e);
      return false;
    }
  },
  
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return null;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from localStorage:', e);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Error clearing localStorage:', e);
      return false;
    }
  }
};

// ========================================
// Tratamento de Erros e Retry Logic
// ========================================

// Verificar conectividade
async function checkConnection() {
  try {
    const { data, error } = await supabaseClient
      .from('cadastros')
      .select('count')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}

// Retry com backoff exponencial
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Tentativa ${i + 1} falhou. Tentando novamente em ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Executar operação com tratamento de erro de conexão
async function executeWithConnectionCheck(fn, errorMessage = 'Erro ao executar operação') {
  try {
    // Verificar conexão primeiro
    const isConnected = await checkConnection();
    if (!isConnected) {
      throw new Error('Sem conexão com o servidor. Verifique sua internet.');
    }
    
    // Executar função com retry
    return await retryWithBackoff(fn);
    
  } catch (error) {
    console.error(errorMessage, error);
    
    // Mostrar mensagem apropriada
    if (error.message.includes('conexão') || error.message.includes('network')) {
      showToast('Erro de conexão. Verifique sua internet e tente novamente.', 'error', 5000);
    } else {
      showToast(error.message || errorMessage, 'error');
    }
    
    throw error;
  }
}

// Indicador de conexão
function updateConnectionStatus(isOnline) {
  const indicator = document.getElementById('connection-indicator');
  if (!indicator) return;
  
  if (isOnline) {
    indicator.classList.add('hidden');
  } else {
    indicator.classList.remove('hidden');
  }
}

// Monitorar status de conexão
function initConnectionMonitor() {
  // Criar indicador se não existir
  if (!document.getElementById('connection-indicator')) {
    const indicator = document.createElement('div');
    indicator.id = 'connection-indicator';
    indicator.className = 'hidden fixed bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
    indicator.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <span>Sem conexão</span>
    `;
    document.body.appendChild(indicator);
  }
  
  // Listener de eventos de conexão
  window.addEventListener('online', () => {
    updateConnectionStatus(true);
    showToast('Conexão restabelecida', 'success');
  });
  
  window.addEventListener('offline', () => {
    updateConnectionStatus(false);
    showToast('Você está offline', 'warning');
  });
  
  // Verificar periodicamente
  setInterval(async () => {
    const isOnline = await checkConnection();
    updateConnectionStatus(isOnline);
  }, 30000); // A cada 30 segundos
}

// Inicializar monitor de conexão quando o DOM carregar
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConnectionMonitor);
  } else {
    initConnectionMonitor();
  }
}

// API Fetch Wrapper (preparado para Supabase)
async function apiRequest(url, options = {}) {
  try {
    // TODO: Adicionar token de autenticação quando integrar com Supabase
    // const token = storage.get('auth_token');
    // if (token) {
    //   options.headers = {
    //     ...options.headers,
    //     'Authorization': `Bearer ${token}`
    //   };
    // }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro na requisição');
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: error.message };
  }
}

// Get User Initials for Avatar
function getUserInitials(name) {
  if (!name) return 'U';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Smooth Scroll to Element
function smoothScrollTo(elementId) {
  const element = document.querySelector(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Animate Counter (smooth counting animation)
function animateCounter(element, target, duration = 1000) {
  if (!element) return;
  
  const start = parseInt(element.textContent) || 0;
  const increment = (target - start) / (duration / 16); // 60fps
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    
    if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.round(current);
    }
  }, 16);
}

// Check if user is authenticated
function isAuthenticated() {
  // TODO: Verificar token válido do Supabase
  const authData = storage.get('auth_user');
  return authData !== null;
}

// Get current user data
function getCurrentUser() {
  // TODO: Buscar dados do Supabase
  return storage.get('auth_user');
}

// Export functions (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isValidEmail,
    isValidPhone,
    phoneMask,
    applyPhoneMask,
    getPasswordStrength,
    updatePasswordStrength,
    formatDate,
    formatDateTime,
    formatCurrency,
    debounce,
    showToast,
    showError,
    hideError,
    showSuccess,
    clearFormErrors,
    setButtonLoading,
    storage,
    apiRequest,
    getUserInitials,
    smoothScrollTo,
    isAuthenticated,
    getCurrentUser
  };
}


