// ========================================
// Viagem Certa - Configuração Supabase
// ========================================

// Configurações do Supabase
const SUPABASE_URL = 'https://mmacloqqolrelyonstpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tYWNsb3Fxb2xyZWx5b25zdHBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE3NTU0NCwiZXhwIjoyMDc2NzUxNTQ0fQ.bAmSDMxezgdWXguSc2ewBnHTwfUnw9s2SdS64AfegoA';

// Criar cliente Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verificar conexão
console.log('✅ Supabase conectado:', SUPABASE_URL);

// Exportar cliente para uso global
if (typeof window !== 'undefined') {
  window.supabaseClient = supabaseClient;
}

// Helper: Hash de senha simples (SHA-256)
// NOTA: Em produção, use bcrypt no backend
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Helper: Verificar senha
async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Helper: Validar CPF
function isValidCPF(cpf) {
  if (!cpf) return false;
  
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let digit1 = remainder >= 10 ? 0 : remainder;
  
  if (digit1 !== parseInt(cpf.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let digit2 = remainder >= 10 ? 0 : remainder;
  
  if (digit2 !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

// Máscara de CPF
function cpfMask(value) {
  if (!value) return '';
  value = value.replace(/\D/g, '');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return value.substring(0, 14);
}

// Exportar funções utilitárias
if (typeof window !== 'undefined') {
  window.hashPassword = hashPassword;
  window.verifyPassword = verifyPassword;
  window.isValidCPF = isValidCPF;
  window.cpfMask = cpfMask;
}

