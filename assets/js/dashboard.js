// ========================================
// Viagem Certa - Dashboard
// ========================================

// Instância global do gerenciador de notificações
let notificationManager = null;
let viagensCache = [];
let currentModalViagem = null;

document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticação
  checkAuth();
  
  // Inicializar componentes
  initSidebar();
  initNavigation();
  initUserData();
  initNotifications();
  initDashboard();
  initLogout();
  initPriceCalculator();
  
  // Auto-refresh a cada 30 segundos
  setInterval(() => {
    loadViagensAtivas();
    loadDashboardStats();
  }, 30000);
});

// ========================================
// Verificar Autenticação
// ========================================
function checkAuth() {
  const user = storage.get('auth_user');
  
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
}

// ========================================
// Sidebar Mobile
// ========================================
function initSidebar() {
  const sidebarOpenBtn = document.getElementById('sidebar-open');
  const sidebarCloseBtn = document.getElementById('sidebar-close');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  
  if (!sidebar) return;
  
  if (sidebarOpenBtn) {
    sidebarOpenBtn.addEventListener('click', () => {
      sidebar.classList.remove('-translate-x-full');
      sidebarOverlay.classList.remove('hidden');
    });
  }
  
  const closeSidebar = () => {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
  };
  
  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', closeSidebar);
  }
  
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }
  
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 1024) {
        closeSidebar();
      }
    });
  });
}

// ========================================
// Navegação entre páginas
// ========================================
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const pageContents = document.querySelectorAll('.page-content');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const pageName = link.dataset.page;
      navigateToPage(pageName);
    });
  });
  
  // Navegação por hash (deep linking)
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
}

function navigateToPage(pageName) {
  const navLinks = document.querySelectorAll('.nav-link');
  const pageContents = document.querySelectorAll('.page-content');
      
      // Atualizar links ativos
      navLinks.forEach(l => l.classList.remove('active', 'bg-blue-50', 'text-blue-900'));
  const activeLink = document.querySelector(`[data-page="${pageName}"]`);
  if (activeLink) {
    activeLink.classList.add('active', 'bg-blue-50', 'text-blue-900');
  }
      
      // Mostrar conteúdo correspondente
      pageContents.forEach(content => content.classList.add('hidden'));
      const activeContent = document.getElementById(`content-${pageName}`);
      if (activeContent) {
        activeContent.classList.remove('hidden');
    
    // Scroll suave para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
      // Atualizar título da página
      updatePageTitle(pageName);
  
  // Atualizar URL hash
  window.location.hash = pageName;
  
  // Carregar dados específicos da página
  loadPageData(pageName);
}

function handleHashChange() {
  const hash = window.location.hash.substring(1);
  if (hash) {
    navigateToPage(hash);
  }
}

function loadPageData(pageName) {
  switch(pageName) {
    case 'dashboard':
      loadDashboardStats();
      loadViagensAtivas();
      break;
    case 'viagens':
      loadTodasViagens();
      break;
    case 'historico':
      loadHistorico();
      break;
  }
}

function updatePageTitle(pageName) {
  const titles = {
    'dashboard': { title: 'Dashboard', subtitle: 'Bem-vindo de volta!' },
    'viagens': { title: 'Minhas Viagens', subtitle: 'Gerencie todas as suas viagens' },
    'solicitar': { title: 'Solicitar Transporte', subtitle: 'Agende uma nova viagem' },
    'historico': { title: 'Histórico', subtitle: 'Visualize suas viagens anteriores' },
    'perfil': { title: 'Meu Perfil', subtitle: 'Gerencie suas informações' },
    'configuracoes': { title: 'Configurações', subtitle: 'Personalize sua conta' }
  };
  
  const pageInfo = titles[pageName] || { title: 'Dashboard', subtitle: '' };
  
  const titleElement = document.getElementById('page-title');
  const subtitleElement = document.getElementById('page-subtitle');
  
  if (titleElement) titleElement.textContent = pageInfo.title;
  if (subtitleElement) subtitleElement.textContent = pageInfo.subtitle;
}

// ========================================
// Carregar Dados do Usuário
// ========================================
function initUserData() {
  const user = storage.get('auth_user');
  
  if (!user) return;
  
  const userNameElement = document.getElementById('user-name');
  const userEmailElement = document.getElementById('user-email');
  const userAvatarElement = document.getElementById('user-avatar');
  
  if (userNameElement) {
    userNameElement.textContent = user.nome || 'Usuário';
  }
  
  if (userEmailElement) {
    userEmailElement.textContent = user.email || '';
  }
  
  if (userAvatarElement) {
    const initials = getUserInitials(user.nome || user.email);
    userAvatarElement.textContent = initials;
  }
  
  const perfilNome = document.getElementById('perfil-nome');
  const perfilEmail = document.getElementById('perfil-email');
  const perfilTelefone = document.getElementById('perfil-telefone');
  
  if (perfilNome) perfilNome.value = user.nome || '';
  if (perfilEmail) perfilEmail.value = user.email || '';
  if (perfilTelefone) perfilTelefone.value = user.telefone || '';
  
  if (perfilTelefone) {
    applyPhoneMask(perfilTelefone);
  }
}

// ========================================
// Inicializar Notificações
// ========================================
function initNotifications() {
  const user = storage.get('auth_user');
  if (!user || !user.email) return;
  
  // Tentar inicializar notificações (pode falhar se tabela não existir)
  try {
    notificationManager = new NotificationManager();
    notificationManager.init(user.email);
    window.notificationManager = notificationManager;
  } catch (error) {
    console.log('⚠️ Notificações desabilitadas (tabela não existe no banco)');
    console.log('💡 Para ativar: Execute supabase-setup.sql no Supabase SQL Editor');
  }
}

// ========================================
// Diagnóstico - Chamar no console para debug
// ========================================
window.diagnosticoViagens = async function() {
  console.log('🔍 DIAGNÓSTICO DE VIAGENS');
  console.log('========================');
  
  const user = storage.get('auth_user');
  console.log('👤 Usuário logado:', user);
  
  if (!user) {
    console.log('❌ Nenhum usuário encontrado no localStorage!');
    return;
  }
  
  console.log('📝 Buscando viagens com email_cliente =', user.email);
  
  // Buscar por email (método atual)
  const { data: viagensPorEmail, error: erro1 } = await supabaseClient
    .from('viagens')
    .select('*')
    .eq('email_cliente', user.email);
  
  console.log(`✅ Viagens encontradas por EMAIL (${user.email}):`, viagensPorEmail?.length || 0, viagensPorEmail);
  
  // Buscar por nome (para comparação/debug)
  const { data: viagensPorNome, error: erro2 } = await supabaseClient
    .from('viagens')
    .select('*')
    .ilike('nome_cliente', user.nome);
  
  console.log(`⚠️ Viagens encontradas por NOME (${user.nome}) - método antigo:`, viagensPorNome?.length || 0, viagensPorNome);
  
  // Buscar TODAS as viagens para comparação
  const { data: todasViagens, error: erro3 } = await supabaseClient
    .from('viagens')
    .select('*')
    .limit(10);
  
  console.log('📋 Últimas 10 viagens no banco:', todasViagens);
  
  if (todasViagens && todasViagens.length > 0) {
    console.log('🔍 Nomes de clientes no banco:', [...new Set(todasViagens.map(v => v.nome_cliente))]);
  }
  
  console.log('========================');
  console.log('💡 Se as viagens não aparecem, verifique:');
  console.log('1. Se o email do cliente na viagem corresponde a:', user.email);
  console.log('2. Se a viagem foi realmente criada no banco (veja "Últimas 10 viagens")');
  console.log('3. Se o email_cliente está preenchido corretamente na tabela viagens');
};

// ========================================
// Inicializar Dashboard
// ========================================
function initDashboard() {
  loadDashboardStats();
  loadViagensAtivas();
  initForms();
  
  // Mostrar diagnóstico no console
  console.log('💡 Para diagnosticar problemas, digite no console: diagnosticoViagens()');
}

// Carregar estatísticas
async function loadDashboardStats() {
  try {
    const user = storage.get('auth_user');
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('📊 Carregando estatísticas para:', user.email);
    
    // Buscar por email (único e mais seguro)
    const { data: viagens, error } = await supabaseClient
      .from('viagens')
      .select('*')
      .eq('email_cliente', user.email);
    
    if (error) {
      console.error('❌ Erro ao buscar viagens:', error);
      return;
    }
    
    console.log(`✅ Viagens encontradas: ${viagens?.length || 0}`, viagens);
    
    const stats = {
      ativos: (viagens || []).filter(v => v.status === 'ativo').length,
      proximas: (viagens || []).filter(v => v.status === 'agendado' || v.status === 'pendente').length,
      total: (viagens || []).filter(v => v.status === 'concluido').length
    };
    
    const statAtivos = document.getElementById('stat-ativos');
    const statProximas = document.getElementById('stat-proximas');
    const statTotal = document.getElementById('stat-total');
    
    if (statAtivos) animateCounter(statAtivos, stats.ativos);
    if (statProximas) animateCounter(statProximas, stats.proximas);
    if (statTotal) animateCounter(statTotal, stats.total);
    
  } catch (error) {
    console.error('❌ Erro ao carregar estatísticas:', error);
  }
}

// Carregar viagens ativas
async function loadViagensAtivas() {
  try {
    const user = storage.get('auth_user');
    if (!user) {
      console.log('❌ Usuário não encontrado ao carregar viagens');
      return;
    }
    
    console.log('🚗 Carregando viagens para:', user.nome, '| Email:', user.email);
    
    showViagensLoading();
    
    // Buscar por email (único e mais seguro)
    const { data: viagens, error } = await supabaseClient
      .from('viagens')
      .select('*')
      .eq('email_cliente', user.email)
      .in('status', ['ativo', 'agendado', 'pendente'])
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar viagens:', error);
      showToast('Erro ao carregar viagens. Verifique o console (F12)', 'error');
      renderViagens([]);
      return;
    }
    
    console.log(`✅ ${viagens?.length || 0} viagens encontradas:`, viagens);
    
    if (viagens && viagens.length > 0) {
      console.log('📍 Primeira viagem:', viagens[0]);
    }
    
    viagensCache = viagens || [];
    renderViagens(viagens || []);
    
  } catch (error) {
    console.error('❌ Erro ao carregar viagens:', error);
    showToast('Erro ao carregar viagens. Verifique o console (F12)', 'error');
    renderViagens([]);
  }
}

function showViagensLoading() {
  const tbody = document.getElementById('viagens-tbody');
  const cardsContainer = document.getElementById('viagens-cards');
  
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8">
          <div class="loading-dots justify-center">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p class="text-gray-500 mt-2">Carregando viagens...</p>
        </td>
      </tr>
    `;
  }
  
  if (cardsContainer) {
    cardsContainer.innerHTML = `
      <div class="text-center py-8">
        <div class="loading-dots justify-center">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p class="text-gray-500 mt-2">Carregando viagens...</p>
      </div>
    `;
  }
}

function hideViagensLoading() {
  // Função auxiliar - renderViagens cuida da limpeza
}

function renderViagens(viagens) {
  const tbody = document.getElementById('viagens-tbody');
  const cardsContainer = document.getElementById('viagens-cards');
  
  if (!viagens || viagens.length === 0) {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-12 text-gray-500">
            <i class="fas fa-inbox text-4xl mb-3"></i>
            <p>Nenhuma viagem ativa no momento</p>
            <p class="text-sm mt-2">Clique em "Nova viagem" para solicitar um transporte</p>
          </td>
        </tr>
      `;
    }
    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-inbox text-4xl mb-3"></i>
          <p>Nenhuma viagem ativa no momento</p>
          <p class="text-sm mt-2">Clique em "Nova viagem" para solicitar um transporte</p>
        </div>
      `;
    }
    return;
  }
  
  if (tbody) {
    tbody.innerHTML = viagens.map(viagem => `
      <tr class="hover:bg-gray-50 transition">
        <td class="px-4 py-3 text-sm text-gray-900 font-medium">${viagem.data_viagem ? formatDate(viagem.data_viagem) : 'Não informada'}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${formatDateTime(viagem.created_at)}</td>
        <td class="px-4 py-3 text-sm text-gray-900">${viagem.origem}</td>
        <td class="px-4 py-3 text-sm text-gray-900">${viagem.destino}</td>
        <td class="px-4 py-3">
          ${getStatusBadge(viagem.status)}
        </td>
        <td class="px-4 py-3 text-center">
          <button onclick="verDetalhes(${viagem.id_viagem})" class="text-blue-900 hover:text-blue-700 mr-2" title="Ver detalhes">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="cancelarViagem(${viagem.id_viagem})" class="text-red-600 hover:text-red-700" title="Cancelar">
            <i class="fas fa-times"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }
  
  if (cardsContainer) {
    cardsContainer.innerHTML = viagens.map(viagem => `
      <div class="bg-white rounded-lg p-4 border border-gray-200 animate-fadeInUp">
        <div class="flex justify-between items-start mb-3">
          <div class="text-sm font-semibold text-gray-900">
            <i class="far fa-calendar text-blue-900"></i> ${viagem.data_viagem ? formatDate(viagem.data_viagem) : 'Não informada'}
          </div>
          ${getStatusBadge(viagem.status)}
        </div>
        <div class="space-y-2 mb-3">
          <div class="flex items-center gap-2 text-sm">
            <i class="fas fa-map-marker-alt text-blue-900"></i>
            <span class="text-gray-900">${viagem.origem}</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <i class="fas fa-map-marker-alt text-green-600"></i>
            <span class="text-gray-900">${viagem.destino}</span>
          </div>
          ${viagem.observacao ? `
            <div class="flex items-start gap-2 text-sm mt-2 pt-2 border-t">
              <i class="fas fa-comment text-gray-400 mt-0.5"></i>
              <span class="text-gray-600 text-xs">${viagem.observacao}</span>
            </div>
          ` : ''}
        </div>
        <div class="flex gap-2">
          <button onclick="verDetalhes(${viagem.id_viagem})" class="btn-primary text-sm px-4 py-2 flex-1">
            Ver detalhes
          </button>
          <button onclick="cancelarViagem(${viagem.id_viagem})" class="btn-outline text-sm px-4 py-2 text-red-600 border-red-600 hover:bg-red-50">
            Cancelar
          </button>
        </div>
      </div>
    `).join('');
  }
}

function getStatusBadge(status) {
  const badges = {
    'ativo': '<span class="badge badge-success">Em andamento</span>',
    'agendado': '<span class="badge badge-info">Agendado</span>',
    'pendente': '<span class="badge badge-warning">Pendente</span>',
    'concluido': '<span class="badge badge-success">Concluído</span>',
    'cancelado': '<span class="badge badge-error">Cancelado</span>'
  };
  
  return badges[status] || '<span class="badge">Desconhecido</span>';
}

// ========================================
// Ações de Viagem
// ========================================
window.verDetalhes = async function(viagemId) {
  try {
    const { data, error } = await supabaseClient
      .from('viagens')
      .select('*')
      .eq('id_viagem', viagemId)
      .single();
    
    if (error || !data) {
      showToast('Erro ao carregar detalhes da viagem', 'error');
      return;
    }
    
    currentModalViagem = data;
    openModalViagem(data);
    
  } catch (error) {
    console.error('Erro:', error);
    showToast('Erro ao carregar detalhes', 'error');
  }
};

function openModalViagem(viagem) {
  const modal = document.getElementById('modal-viagem');
  const modalContent = modal.querySelector('.modal-content');
  const contentDiv = document.getElementById('modal-content-cliente');
  
  // Preencher conteúdo com todos os detalhes
  contentDiv.innerHTML = `
    <!-- Informações Gerais -->
    <div class="grid md:grid-cols-3 gap-4">
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <label class="text-xs font-semibold text-gray-600 uppercase block mb-2">Tipo de Serviço</label>
        <div class="flex items-center gap-2">
          <i class="fas ${viagem.tipo_servico === 'passageiro' ? 'fa-user' : viagem.tipo_servico === 'mercadoria' ? 'fa-boxes' : 'fa-car'} text-[#8b8360]"></i>
          <span class="font-semibold">${
            viagem.tipo_servico === 'passageiro' ? 'Transporte de Passageiro' :
            viagem.tipo_servico === 'mercadoria' ? 'Transporte de Mercadoria' :
            viagem.tipo_servico === 'executivo' ? 'Viagem Executiva' : 'Não informado'
          }</span>
        </div>
      </div>
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <label class="text-xs font-semibold text-gray-600 uppercase block mb-2">Status</label>
        ${getStatusBadge(viagem.status)}
      </div>
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <label class="text-xs font-semibold text-gray-600 uppercase block mb-2">Data e Horário</label>
        <p class="text-gray-900 font-semibold">${viagem.data_viagem ? formatDate(viagem.data_viagem) : 'Não informada'}</p>
        ${viagem.horario_viagem ? `<p class="text-sm text-gray-600">${viagem.horario_viagem}</p>` : ''}
      </div>
    </div>

    <!-- Informações da Solicitação -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <label class="text-xs font-semibold text-gray-600 uppercase block mb-2">
        <i class="fas fa-info-circle mr-1"></i>Informações da Solicitação
      </label>
      <div class="text-sm text-gray-600">
        <div>Solicitado em: <span class="font-semibold text-gray-900">${formatDateTime(viagem.created_at)}</span></div>
        ${(() => {
          const distancia = parseFloat(viagem.distancia_km);
          const precoPorKm = 0.50; // R$ 0,50 por km
          
          // Se tiver distância, calcular o preço baseado em R$3/km
          if (!isNaN(distancia) && distancia > 0) {
            const precoCalculado = distancia * precoPorKm;
            return `
              <div class="mt-1">
                Preço Estimado: <span class="font-semibold text-green-600">R$ ${precoCalculado.toFixed(2)}</span>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                <i class="fas fa-calculator mr-1"></i>
                ${distancia.toFixed(2)} km × R$ ${precoPorKm.toFixed(2)}/km
              </div>
            `;
          }
          return '';
        })()}
        ${(() => {
          const distancia = parseFloat(viagem.distancia_km);
          return !isNaN(distancia) && distancia > 0 ? `<div>Distância: <span class="font-semibold text-gray-900">${distancia.toFixed(2)} km</span></div>` : '';
        })()}
      </div>
    </div>
    
    <!-- Endereço de Origem -->
    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
      <label class="text-xs font-semibold text-green-800 uppercase block mb-3">
        <i class="fas fa-map-marker-alt mr-1"></i>Endereço de Origem
        ${viagem.origem_tipo ? `<span class="ml-2 text-xs font-normal">(${viagem.origem_tipo === 'rodoviaria' ? 'Rodoviária' : 'Residência'})</span>` : ''}
      </label>
      ${viagem.origem_endereco ? `
        <div class="space-y-2 text-sm">
          <div><strong>Endereço:</strong> ${viagem.origem_endereco}</div>
          ${viagem.origem_complemento ? `<div><strong>Complemento:</strong> ${viagem.origem_complemento}</div>` : ''}
          <div><strong>Bairro:</strong> ${viagem.origem_bairro || '-'}</div>
          <div><strong>Cidade:</strong> ${viagem.origem_cidade || '-'}</div>
          <div><strong>Estado:</strong> ${viagem.origem_estado || '-'}</div>
          ${viagem.origem_cep ? `<div><strong>CEP:</strong> ${viagem.origem_cep}</div>` : ''}
        </div>
      ` : `
        <div class="text-gray-900 font-semibold">${viagem.origem}</div>
      `}
    </div>

    <!-- Endereço de Destino -->
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <label class="text-xs font-semibold text-red-800 uppercase block mb-3">
        <i class="fas fa-map-marker-alt mr-1"></i>Endereço de Destino
        ${viagem.destino_tipo ? `<span class="ml-2 text-xs font-normal">(${viagem.destino_tipo === 'rodoviaria' ? 'Rodoviária' : 'Residência'})</span>` : ''}
      </label>
      ${viagem.destino_endereco ? `
        <div class="space-y-2 text-sm">
          <div><strong>Endereço:</strong> ${viagem.destino_endereco}</div>
          ${viagem.destino_complemento ? `<div><strong>Complemento:</strong> ${viagem.destino_complemento}</div>` : ''}
          <div><strong>Bairro:</strong> ${viagem.destino_bairro || '-'}</div>
          <div><strong>Cidade:</strong> ${viagem.destino_cidade || '-'}</div>
          <div><strong>Estado:</strong> ${viagem.destino_estado || '-'}</div>
          ${viagem.destino_cep ? `<div><strong>CEP:</strong> ${viagem.destino_cep}</div>` : ''}
        </div>
      ` : `
        <div class="text-gray-900 font-semibold">${viagem.destino}</div>
      `}
    </div>

    <!-- Informações de Passageiros -->
    ${(viagem.tipo_servico === 'passageiro' || viagem.tipo_servico === 'executivo') && viagem.quantidade_passageiros ? `
      <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <label class="text-xs font-semibold text-purple-800 uppercase block mb-3">
          <i class="fas fa-users mr-1"></i>Informações dos Passageiros
        </label>
        <div class="space-y-2 text-sm">
          <div><strong>Quantidade de Passageiros:</strong> ${parseInt(viagem.quantidade_passageiros) || viagem.quantidade_passageiros}</div>
          ${viagem.possui_bagagem ? `<div><strong>Possui Bagagem:</strong> Sim${viagem.quantidade_bagagens ? ` (${parseInt(viagem.quantidade_bagagens) || viagem.quantidade_bagagens} bagagens)` : ''}</div>` : '<div><strong>Possui Bagagem:</strong> Não</div>'}
          ${viagem.necessidades_especiais ? `
            <div>
              <strong>Necessidades Especiais:</strong>
              <p class="mt-1 text-gray-700">${viagem.necessidades_especiais}</p>
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}

    <!-- Informações de Carga -->
    ${viagem.tipo_servico === 'mercadoria' && viagem.descricao_carga ? `
      <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <label class="text-xs font-semibold text-orange-800 uppercase block mb-3">
          <i class="fas fa-boxes mr-1"></i>Informações da Carga
        </label>
        <div class="space-y-2 text-sm">
          <div>
            <strong>Descrição:</strong>
            <p class="mt-1 text-gray-700">${viagem.descricao_carga}</p>
          </div>
          ${(() => {
            const peso = parseFloat(viagem.peso_kg);
            return !isNaN(peso) && peso > 0 ? `<div><strong>Peso:</strong> ${peso} kg ${peso > 1000 ? '<span class="text-red-600">(Acima do limite de 1 tonelada!)</span>' : ''}</div>` : '';
          })()}
          ${(() => {
            const altura = parseFloat(viagem.dimensao_altura_cm);
            const largura = parseFloat(viagem.dimensao_largura_cm);
            const profundidade = parseFloat(viagem.dimensao_profundidade_cm);
            const temDimensoes = viagem.dimensao_altura_cm || viagem.dimensao_largura_cm || viagem.dimensao_profundidade_cm;
            
            if (!temDimensoes) return '';
            
            let volumeText = '';
            if (!isNaN(altura) && !isNaN(largura) && !isNaN(profundidade) && altura > 0 && largura > 0 && profundidade > 0) {
              const volume = (altura * largura * profundidade) / 1000000;
              volumeText = `<span class="text-[#8b8360] font-semibold ml-2">(${volume.toFixed(4)} m³)</span>`;
            }
            
            return `<div><strong>Dimensões:</strong> ${viagem.dimensao_altura_cm || '?'} x ${viagem.dimensao_largura_cm || '?'} x ${viagem.dimensao_profundidade_cm || '?'} cm ${volumeText}</div>`;
          })()}
          ${(() => {
            const valor = parseFloat(viagem.valor_declarado);
            return !isNaN(valor) && valor > 0 ? `<div><strong>Valor Declarado:</strong> R$ ${valor.toFixed(2)}</div>` : '';
          })()}
          ${viagem.carga_fragil ? `<div class="text-yellow-700"><i class="fas fa-exclamation-triangle"></i> <strong>Carga frágil - Manuseio cuidadoso necessário</strong></div>` : ''}
          ${viagem.requer_embalagem_especial ? `<div class="text-orange-700"><i class="fas fa-box"></i> <strong>Requer embalagem especial</strong></div>` : ''}
        </div>
      </div>
    ` : ''}
    
    <!-- Observações -->
    ${viagem.observacao ? `
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label class="text-xs font-semibold text-gray-600 uppercase block mb-2">
          <i class="fas fa-comment mr-1"></i>Observações Adicionais
        </label>
        <p class="text-gray-700 whitespace-pre-wrap">${viagem.observacao}</p>
      </div>
    ` : ''}
  `;
  
  const btnCancelar = document.getElementById('modal-btn-cancelar');
  if (viagem.status !== 'cancelado' && viagem.status !== 'concluido') {
    btnCancelar.classList.remove('hidden');
  } else {
    btnCancelar.classList.add('hidden');
  }
  
  modal.classList.remove('hidden');
  setTimeout(() => {
    modalContent.classList.remove('scale-95', 'opacity-0');
    modalContent.classList.add('scale-100', 'opacity-100');
  }, 10);
  
  document.body.style.overflow = 'hidden';
}

window.closeModalViagem = function() {
  const modal = document.getElementById('modal-viagem');
  const modalContent = modal.querySelector('.modal-content');
  
  modalContent.classList.add('scale-95', 'opacity-0');
  modalContent.classList.remove('scale-100', 'opacity-100');
  
  setTimeout(() => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    currentModalViagem = null;
  }, 300);
};

window.cancelarViagemModal = async function() {
  if (!currentModalViagem) return;
  
  if (!confirm('Tem certeza que deseja cancelar esta viagem?')) {
    return;
  }
  
  await cancelarViagem(currentModalViagem.id_viagem);
  closeModalViagem();
};

document.addEventListener('click', (e) => {
  const modal = document.getElementById('modal-viagem');
  if (modal && e.target === modal) {
    closeModalViagem();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('modal-viagem');
    if (modal && !modal.classList.contains('hidden')) {
      closeModalViagem();
    }
  }
});

window.cancelarViagem = async function(viagemId) {
  if (!confirm('Tem certeza que deseja cancelar esta viagem?')) {
    return;
  }
  
  try {
    const { error } = await supabaseClient
      .from('viagens')
      .update({ status: 'cancelado' })
      .eq('id_viagem', viagemId);
    
    if (error) {
      throw new Error(error.message);
    }
    
    showToast('Viagem cancelada com sucesso', 'success');
    loadViagensAtivas();
    loadDashboardStats();
    
  } catch (error) {
    console.error('Erro:', error);
    showToast('Erro ao cancelar viagem', 'error');
  }
};

// ========================================
// Formulários
// ========================================
function initForms() {
  const solicitarForm = document.getElementById('solicitar-form');
  if (solicitarForm) {
    solicitarForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const user = storage.get('auth_user');
      if (!user) {
        showToast('Erro: usuário não autenticado', 'error');
        return;
      }
      
      const formData = new FormData(solicitarForm);
      
      // Coletar dados básicos
      const tipoServico = formData.get('tipo_servico');
      const dataViagem = formData.get('data_viagem');
      const horarioViagem = formData.get('horario_viagem');
      
      // Coletar endereços detalhados
      const origemEndereco = formData.get('origem_endereco');
      const origemCEP = formData.get('origem_cep');
      const origemComplemento = formData.get('origem_complemento');
      const origemBairro = formData.get('origem_bairro');
      const origemCidade = formData.get('origem_cidade');
      const origemEstado = formData.get('origem_estado');
      
      const destinoEndereco = formData.get('destino_endereco');
      const destinoCEP = formData.get('destino_cep');
      const destinoComplemento = formData.get('destino_complemento');
      const destinoBairro = formData.get('destino_bairro');
      const destinoCidade = formData.get('destino_cidade');
      const destinoEstado = formData.get('destino_estado');
      
      // Validações básicas
      if (!tipoServico || !dataViagem || !origemCidade || !destinoCidade) {
        showToast('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
      }
      
      // Verificar se o preço foi calculado e mostrar confirmação
      const secaoPreco = document.getElementById('secao-preco');
      const precoTotal = document.getElementById('preco-total')?.textContent;
      const distanciaKm = document.getElementById('distancia-km')?.textContent;
      const precoVisivel = secaoPreco && !secaoPreco.classList.contains('hidden');
      
      // Se o preço foi calculado, mostrar confirmação com o valor
      if (precoVisivel && precoTotal && precoTotal !== '--') {
        const confirmMessage = `Preço estimado da viagem: R$ ${precoTotal}\nDistância: ${distanciaKm} km\n\nDeseja confirmar a solicitação?`;
        if (!confirm(confirmMessage)) {
          return;
        }
      } else {
        // Se o preço não foi calculado, avisar o usuário
        const confirmSemPreco = `Não foi possível calcular o preço estimado automaticamente.\n\nO valor será informado pelo administrador após análise.\n\nDeseja continuar mesmo assim?`;
        if (!confirm(confirmSemPreco)) {
          return;
        }
      }
      
      // Montar endereços resumidos para compatibilidade
      const origemResumo = `${origemCidade} - ${origemEstado}`;
      const destinoResumo = `${destinoCidade} - ${destinoEstado}`;
      
      const submitBtn = document.getElementById('solicitar-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.querySelector('#btn-text').classList.add('hidden');
        submitBtn.querySelector('#btn-loading').classList.remove('hidden');
      }
      
      try {
        console.log('📝 Criando viagem para:', user.nome, '| Email:', user.email);
        console.log('📍 Tipo de serviço:', tipoServico);
        
        // Obter preço calculado (se disponível)
        const precoCalculado = document.getElementById('preco-total')?.textContent;
        const distanciaCalculada = document.getElementById('distancia-km')?.textContent;
        const secaoPreco = document.getElementById('secao-preco');
        const precoVisivel = secaoPreco && !secaoPreco.classList.contains('hidden');
        
        // Montar objeto base da viagem
        const viagemData = {
          nome_cliente: user.nome,
          email_cliente: user.email,
          tipo_servico: tipoServico,
          data_viagem: dataViagem,
          horario_viagem: horarioViagem || null,
          
          // Endereços resumidos (compatibilidade)
          origem: origemResumo,
          destino: destinoResumo,
          
          // Endereços detalhados - Origem
          origem_endereco: origemEndereco,
          origem_cep: origemCEP,
          origem_complemento: origemComplemento || null,
          origem_bairro: origemBairro,
          origem_cidade: origemCidade,
          origem_estado: origemEstado,
          
          // Tipo de local de origem
          origem_tipo: formData.get('origem_tipo') || 'casa',
          
          // Endereços detalhados - Destino
          destino_endereco: destinoEndereco,
          destino_cep: destinoCEP,
          destino_complemento: destinoComplemento || null,
          destino_bairro: destinoBairro,
          destino_cidade: destinoCidade,
          destino_estado: destinoEstado,
          
          // Tipo de local de destino
          destino_tipo: formData.get('destino_tipo') || 'casa',
          
          // Preço e distância calculados
          preco_estimado: precoVisivel && precoCalculado !== '--' ? parseFloat(precoCalculado.replace(',', '.')) : null,
          distancia_km: precoVisivel && distanciaCalculada !== '--' ? parseFloat(distanciaCalculada) : null,
          
          observacao: formData.get('observacao') || null,
          status: 'pendente'
        };
        
        // Adicionar campos específicos por tipo de serviço
        if (tipoServico === 'passageiro' || tipoServico === 'executivo') {
          viagemData.quantidade_passageiros = parseInt(formData.get('quantidade_passageiros')) || null;
          viagemData.necessidades_especiais = formData.get('necessidades_especiais') || null;
          viagemData.possui_bagagem = formData.get('possui_bagagem') === 'on';
          viagemData.quantidade_bagagens = parseInt(formData.get('quantidade_bagagens')) || null;
          
          console.log('👥 Dados de passageiros:', {
            quantidade: viagemData.quantidade_passageiros,
            bagagem: viagemData.possui_bagagem
          });
          
        } else if (tipoServico === 'mercadoria') {
          viagemData.descricao_carga = formData.get('descricao_carga');
          viagemData.peso_kg = parseFloat(formData.get('peso_kg')) || null;
          viagemData.dimensao_altura_cm = parseFloat(formData.get('dimensao_altura_cm')) || null;
          viagemData.dimensao_largura_cm = parseFloat(formData.get('dimensao_largura_cm')) || null;
          viagemData.dimensao_profundidade_cm = parseFloat(formData.get('dimensao_profundidade_cm')) || null;
          viagemData.valor_declarado = parseFloat(formData.get('valor_declarado')) || null;
          viagemData.carga_fragil = formData.get('carga_fragil') === 'on';
          viagemData.requer_embalagem_especial = formData.get('requer_embalagem_especial') === 'on';
          
          console.log('📦 Dados de carga:', {
            peso: viagemData.peso_kg,
            dimensoes: `${viagemData.dimensao_altura_cm}x${viagemData.dimensao_largura_cm}x${viagemData.dimensao_profundidade_cm}cm`
          });
        }
        
        const { data, error} = await supabaseClient
          .from('viagens')
          .insert([viagemData])
          .select()
          .single();
        
        if (error) {
          console.error('❌ Erro ao criar viagem:', error);
          console.error('❌ Detalhes do erro:', error);
          throw new Error(error.message);
        }
        
        console.log('✅ Viagem criada com sucesso:', data);
        console.log('✅ ID da viagem:', data.id_viagem);
        
        showToast('Solicitação enviada com sucesso!', 'success');
        solicitarForm.reset();
        toggleCamposCondicionais(); // Limpar campos condicionais
        
        // Limpar volume calculado
        const volumeDisplay = document.getElementById('volume-total');
        if (volumeDisplay) {
          volumeDisplay.textContent = '0 m³';
        }
        
        // Aguardar um pouco para o banco processar
        console.log('⏳ Aguardando 1 segundo para sincronizar...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Recarregar dados
        console.log('🔄 Recarregando viagens...');
        await loadViagensAtivas();
        await loadDashboardStats();
        
        console.log('✅ Dados recarregados. Voltando para dashboard...');
        
        setTimeout(() => {
          navigateToPage('dashboard');
        }, 500);
        
      } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao enviar solicitação: ' + error.message, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.querySelector('#btn-text').classList.remove('hidden');
          submitBtn.querySelector('#btn-loading').classList.add('hidden');
        }
      }
    });
  }
  
  const perfilForm = document.getElementById('perfil-form');
  if (perfilForm) {
    perfilForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const user = storage.get('auth_user');
      if (!user) {
        showToast('Erro: usuário não autenticado', 'error');
        return;
      }
      
      const nome = document.getElementById('perfil-nome').value.trim();
      const telefone = document.getElementById('perfil-telefone').value.trim();
      
      if (!nome) {
        showToast('Nome é obrigatório', 'error');
        return;
      }
      
      if (!isValidPhone(telefone)) {
        showToast('Telefone inválido', 'error');
        return;
      }
      
      const submitBtn = perfilForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner mx-auto"></div>';
      
      try {
        const { error } = await supabaseClient
          .from('cadastros')
          .update({ 
            nome: nome, 
            telefone: telefone 
          })
          .eq('id', user.id);
        
        if (error) throw error;
        
      user.nome = nome;
      user.telefone = telefone;
      storage.set('auth_user', user);
      
      initUserData();
      
        await supabaseClient
          .from('viagens')
          .update({ nome_cliente: nome })
          .eq('email_cliente', user.email);
      
      showToast('Perfil atualizado com sucesso!', 'success');
        
      } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        showToast('Erro ao atualizar perfil: ' + error.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
}

// ========================================
// Logout
// ========================================
function initLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('Tem certeza que deseja sair?')) {
        await logout();
      }
    });
  }
}

// ========================================
// Filtros e Busca
// ========================================
window.applyFilters = function() {
  const statusFilter = document.getElementById('filter-viagens-status')?.value || '';
  
  let filtered = viagensCache;
  
  if (statusFilter) {
    filtered = filtered.filter(v => v.status === statusFilter);
  }
  
  renderViagens(filtered);
};

// ========================================
// Exportar para CSV
// ========================================
window.exportViagensCSV = async function() {
  try {
    const user = storage.get('auth_user');
    if (!user) return;
    
    // Buscar por email (único e mais seguro)
    const { data: viagens, error } = await supabaseClient
      .from('viagens')
      .select('*')
      .eq('email_cliente', user.email)
      .order('created_at', { ascending: false});
    
    if (error) throw error;
    
    if (!viagens || viagens.length === 0) {
      showToast('Nenhuma viagem para exportar', 'warning');
      return;
    }
    
    const headers = ['ID', 'Data', 'Origem', 'Destino', 'Status', 'Observações'];
    const rows = viagens.map(v => [
      v.id_viagem,
      formatDateTime(v.created_at),
      v.origem,
      v.destino,
      v.status,
      v.observacao || ''
    ]);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `viagens_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Viagens exportadas com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao exportar:', error);
    showToast('Erro ao exportar viagens', 'error');
  }
};

// ========================================
// Minhas Viagens (Página Completa)
// ========================================
async function loadTodasViagens() {
  try {
    const user = storage.get('auth_user');
    if (!user) {
      console.log('❌ Usuário não encontrado em loadTodasViagens');
      return;
    }
    
    console.log('📋 Carregando todas as viagens para:', user.nome, '| Email:', user.email);
    
    // Buscar por email (único e mais seguro)
    const { data: viagens, error } = await supabaseClient
      .from('viagens')
      .select('*')
      .eq('email_cliente', user.email)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao carregar todas as viagens:', error);
      throw error;
    }
    
    console.log(`✅ ${viagens?.length || 0} viagens carregadas (todas)`, viagens);
    
    renderMinhasViagens(viagens || []);
    
  } catch (error) {
    console.error('❌ Erro ao carregar viagens:', error);
    showToast('Erro ao carregar viagens', 'error');
  }
}

function renderMinhasViagens(viagens) {
  const container = document.getElementById('content-viagens');
  if (!container) return;
  
  container.innerHTML = `
    <div class="card">
      <h2 class="text-2xl font-bold text-blue-900 mb-6">Todas as Minhas Viagens</h2>
      
      <!-- Tabs -->
      <div class="flex flex-wrap gap-2 mb-6 border-b pb-4">
        <button onclick="filterMinhasViagens('todas')" class="px-4 py-2 rounded-lg font-medium transition tab-btn active">
          Todas (${viagens.length})
        </button>
        <button onclick="filterMinhasViagens('pendente')" class="px-4 py-2 rounded-lg font-medium transition tab-btn">
          Pendentes (${viagens.filter(v => v.status === 'pendente').length})
        </button>
        <button onclick="filterMinhasViagens('agendado')" class="px-4 py-2 rounded-lg font-medium transition tab-btn">
          Agendadas (${viagens.filter(v => v.status === 'agendado').length})
        </button>
        <button onclick="filterMinhasViagens('concluido')" class="px-4 py-2 rounded-lg font-medium transition tab-btn">
          Concluídas (${viagens.filter(v => v.status === 'concluido').length})
        </button>
        <button onclick="filterMinhasViagens('cancelado')" class="px-4 py-2 rounded-lg font-medium transition tab-btn">
          Canceladas (${viagens.filter(v => v.status === 'cancelado').length})
        </button>
      </div>
      
      <!-- Lista -->
      <div id="minhas-viagens-lista" class="space-y-4">
        ${viagens.length === 0 ? `
          <div class="text-center py-12 text-gray-500">
            <i class="fas fa-inbox text-4xl mb-3"></i>
            <p>Nenhuma viagem encontrada</p>
          </div>
        ` : viagens.map(v => `
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
            <div class="flex justify-between items-start mb-2">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-semibold text-gray-900">${v.origem}</span>
                  <i class="fas fa-arrow-right text-gray-400"></i>
                  <span class="font-semibold text-gray-900">${v.destino}</span>
                </div>
                <p class="text-sm text-gray-600">
                  <i class="far fa-calendar"></i> ${v.data_viagem ? formatDate(v.data_viagem) : 'Data não informada'}
                </p>
                <p class="text-xs text-gray-500">
                  Solicitado: ${formatDateTime(v.created_at)}
                </p>
              </div>
              <div>
                ${getStatusBadge(v.status)}
              </div>
            </div>
            ${v.observacao ? `<p class="text-sm text-gray-600 mt-2"><i class="fas fa-comment"></i> ${v.observacao}</p>` : ''}
            <div class="flex gap-2 mt-3">
              <button onclick="verDetalhes(${v.id_viagem})" class="btn-primary text-sm px-4 py-1">
                Ver Detalhes
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  // Guardar viagens para filtro
  window.todasViagensCache = viagens;
}

window.filterMinhasViagens = function(status) {
  const viagens = window.todasViagensCache || [];
  const lista = document.getElementById('minhas-viagens-lista');
  const tabs = document.querySelectorAll('.tab-btn');
  
  // Atualizar tabs
  tabs.forEach(tab => tab.classList.remove('active', 'bg-blue-900', 'text-white'));
  event.target.classList.add('active', 'bg-blue-900', 'text-white');
  
  // Filtrar
  const filtered = status === 'todas' ? viagens : viagens.filter(v => v.status === status);
  
  // Renderizar
  lista.innerHTML = filtered.length === 0 ? `
    <div class="text-center py-12 text-gray-500">
      <i class="fas fa-inbox text-4xl mb-3"></i>
      <p>Nenhuma viagem encontrada</p>
    </div>
  ` : filtered.map(v => `
    <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="font-semibold text-gray-900">${v.origem}</span>
            <i class="fas fa-arrow-right text-gray-400"></i>
            <span class="font-semibold text-gray-900">${v.destino}</span>
          </div>
          <p class="text-sm text-gray-600">
            <i class="far fa-calendar"></i> ${v.data_viagem ? formatDate(v.data_viagem) : 'Data não informada'}
          </p>
          <p class="text-xs text-gray-500">
            Solicitado: ${formatDateTime(v.created_at)}
          </p>
        </div>
        <div>
          ${getStatusBadge(v.status)}
        </div>
      </div>
      ${v.observacao ? `<p class="text-sm text-gray-600 mt-2"><i class="fas fa-comment"></i> ${v.observacao}</p>` : ''}
      <div class="flex gap-2 mt-3">
        <button onclick="verDetalhes(${v.id_viagem})" class="btn-primary text-sm px-4 py-1">
          Ver Detalhes
        </button>
      </div>
    </div>
  `).join('');
};

// ========================================
// Histórico (Página Completa)
// ========================================
async function loadHistorico() {
  try {
    const user = storage.get('auth_user');
    if (!user) {
      console.log('❌ Usuário não encontrado em loadHistorico');
      return;
    }
    
    console.log('📜 Carregando histórico para:', user.nome, '| Email:', user.email);
    
    // Buscar por email (único e mais seguro)
    const { data: viagens, error } = await supabaseClient
      .from('viagens')
      .select('*')
      .eq('email_cliente', user.email)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao carregar histórico:', error);
      throw error;
    }
    
    console.log(`✅ ${viagens?.length || 0} viagens no histórico`, viagens);
    
    renderHistorico(viagens || []);
    
  } catch (error) {
    console.error('❌ Erro ao carregar histórico:', error);
    showToast('Erro ao carregar histórico', 'error');
  }
}

function renderHistorico(viagens) {
  const container = document.getElementById('content-historico');
  if (!container) return;
  
  // Calcular estatísticas
  const totalViagens = viagens.length;
  const concluidas = viagens.filter(v => v.status === 'concluido').length;
  const destinos = [...new Set(viagens.map(v => v.destino))];
  const destinoMaisFrequente = destinos.sort((a, b) => 
    viagens.filter(v => v.destino === b).length - viagens.filter(v => v.destino === a).length
  )[0] || 'Nenhum';
  
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Estatísticas -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card text-center">
          <div class="text-4xl font-bold text-blue-900 mb-2">${totalViagens}</div>
          <div class="text-gray-600">Total de Viagens</div>
        </div>
        <div class="card text-center">
          <div class="text-4xl font-bold text-green-600 mb-2">${concluidas}</div>
          <div class="text-gray-600">Viagens Concluídas</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-blue-900 mb-2">${destinoMaisFrequente}</div>
          <div class="text-gray-600 text-sm">Destino Mais Frequente</div>
        </div>
      </div>
      
      <!-- Timeline -->
      <div class="card">
        <h2 class="text-2xl font-bold text-blue-900 mb-6">Timeline de Viagens</h2>
        
        ${viagens.length === 0 ? `
          <div class="text-center py-12 text-gray-500">
            <i class="fas fa-history text-4xl mb-3"></i>
            <p>Nenhuma viagem no histórico</p>
          </div>
        ` : `
          <div class="space-y-6">
            ${viagens.map((v, index) => `
              <div class="flex gap-4">
                <div class="flex flex-col items-center">
                  <div class="w-3 h-3 bg-blue-900 rounded-full"></div>
                  ${index < viagens.length - 1 ? '<div class="w-0.5 h-full bg-gray-300 flex-1"></div>' : ''}
                </div>
                <div class="flex-1 pb-6">
                    <div class="bg-gray-50 rounded-lg p-4">
                      <div class="flex justify-between items-start mb-2">
                        <div>
                          <div class="flex items-center gap-2 mb-1">
                            <span class="font-semibold text-gray-900">${v.origem}</span>
                            <i class="fas fa-arrow-right text-gray-400"></i>
                            <span class="font-semibold text-gray-900">${v.destino}</span>
                          </div>
                          <p class="text-sm text-gray-600">
                            <i class="far fa-calendar"></i> ${v.data_viagem ? formatDate(v.data_viagem) : 'Data não informada'}
                          </p>
                          <p class="text-xs text-gray-500">Solicitado: ${formatDateTime(v.created_at)}</p>
                        </div>
                        ${getStatusBadge(v.status)}
                      </div>
                      ${v.observacao ? `<p class="text-sm text-gray-600 mt-2">${v.observacao}</p>` : ''}
                    </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

// Verificar se o usuário atual é admin
function isUserAdmin() {
  return storage.get('is_admin') === true;
}

// ========================================
// NOVO: Funcionalidades do Formulário Aprimorado
// ========================================

// Inicializar funcionalidades do formulário aprimorado
document.addEventListener('DOMContentLoaded', () => {
  initFormularioCompleto();
});

function initFormularioCompleto() {
  // Campos condicionais baseados no tipo de serviço
  const tipoServico = document.getElementById('tipo-servico');
  if (tipoServico) {
    tipoServico.addEventListener('change', toggleCamposCondicionais);
  }
  
  // Busca de CEP
  initBuscaCEP();
  
  // Máscaras de input
  initMascaras();
  
  // Cálculo de volume automático
  initCalculoVolume();
  
  // Checkbox de bagagem
  const possuiBagagem = document.getElementById('possui-bagagem');
  if (possuiBagagem) {
    possuiBagagem.addEventListener('change', function() {
      const campoBagagens = document.getElementById('campo-quantidade-bagagens');
      const especificacoesBagagens = document.getElementById('especificacoes-bagagens');
      
      if (this.checked) {
        if (campoBagagens) {
          campoBagagens.classList.remove('hidden');
        }
        if (especificacoesBagagens) {
          especificacoesBagagens.classList.remove('hidden');
        }
      } else {
        if (campoBagagens) {
          campoBagagens.classList.add('hidden');
        }
        if (especificacoesBagagens) {
          especificacoesBagagens.classList.add('hidden');
        }
      }
    });
  }
}

// ========================================
// Campos Condicionais
// ========================================
function toggleCamposCondicionais() {
  const tipoServico = document.getElementById('tipo-servico')?.value;
  const secaoPassageiros = document.getElementById('secao-passageiros');
  const secaoCarga = document.getElementById('secao-carga');
  
  // Limpar required dos campos antes de ocultar
  limparRequiredCondicionais();
  
  if (tipoServico === 'passageiro' || tipoServico === 'executivo') {
    // Mostrar seção de passageiros
    if (secaoPassageiros) {
      secaoPassageiros.classList.remove('hidden');
      // Adicionar required aos campos de passageiros
      document.getElementById('quantidade-passageiros')?.setAttribute('required', 'required');
    }
    if (secaoCarga) {
      secaoCarga.classList.add('hidden');
    }
  } else if (tipoServico === 'mercadoria') {
    // Mostrar seção de carga
    if (secaoCarga) {
      secaoCarga.classList.remove('hidden');
      // Adicionar required aos campos de carga
      document.getElementById('descricao-carga')?.setAttribute('required', 'required');
      document.getElementById('peso-kg')?.setAttribute('required', 'required');
      document.getElementById('dimensao-altura')?.setAttribute('required', 'required');
      document.getElementById('dimensao-largura')?.setAttribute('required', 'required');
      document.getElementById('dimensao-profundidade')?.setAttribute('required', 'required');
    }
    if (secaoPassageiros) {
      secaoPassageiros.classList.add('hidden');
    }
  } else {
    // Ocultar ambas
    if (secaoPassageiros) secaoPassageiros.classList.add('hidden');
    if (secaoCarga) secaoCarga.classList.add('hidden');
  }
}

function limparRequiredCondicionais() {
  // Remover required dos campos condicionais
  document.getElementById('quantidade-passageiros')?.removeAttribute('required');
  document.getElementById('descricao-carga')?.removeAttribute('required');
  document.getElementById('peso-kg')?.removeAttribute('required');
  document.getElementById('dimensao-altura')?.removeAttribute('required');
  document.getElementById('dimensao-largura')?.removeAttribute('required');
  document.getElementById('dimensao-profundidade')?.removeAttribute('required');
}

// Tornar função global
window.toggleCamposCondicionais = toggleCamposCondicionais;

// ========================================
// Busca de CEP via ViaCEP
// ========================================
function initBuscaCEP() {
  const origemCEP = document.getElementById('origem-cep');
  const destinoCEP = document.getElementById('destino-cep');
  
  if (origemCEP) {
    origemCEP.addEventListener('blur', () => buscarCEP('origem'));
    origemCEP.addEventListener('input', (e) => aplicarMascaraCEP(e.target));
  }
  
  if (destinoCEP) {
    destinoCEP.addEventListener('blur', () => buscarCEP('destino'));
    destinoCEP.addEventListener('input', (e) => aplicarMascaraCEP(e.target));
  }
}

async function buscarCEP(tipo) {
  const cepInput = document.getElementById(`${tipo}-cep`);
  const cep = cepInput.value.replace(/\D/g, '');
  
  if (cep.length !== 8) return;
  
  // Adicionar loading visual
  cepInput.style.backgroundColor = '#f3f4f6';
  cepInput.disabled = true;
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      showToast('CEP não encontrado', 'warning');
      return;
    }
    
    // Preencher campos automaticamente
    document.getElementById(`${tipo}-endereco`).value = data.logradouro || '';
    document.getElementById(`${tipo}-bairro`).value = data.bairro || '';
    document.getElementById(`${tipo}-cidade`).value = data.localidade || '';
    document.getElementById(`${tipo}-estado`).value = data.uf || '';
    
    // Focar no campo de número se endereço foi preenchido
    if (data.logradouro) {
      const enderecoInput = document.getElementById(`${tipo}-endereco`);
      if (enderecoInput && !enderecoInput.value.match(/\d+/)) {
        enderecoInput.focus();
        enderecoInput.setSelectionRange(enderecoInput.value.length, enderecoInput.value.length);
      }
    }
    
    showToast('Endereço encontrado!', 'success');
    
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    showToast('Erro ao buscar CEP. Preencha manualmente.', 'error');
  } finally {
    cepInput.style.backgroundColor = '';
    cepInput.disabled = false;
  }
}

// ========================================
// Máscaras de Input
// ========================================
function initMascaras() {
  // CEP já tem máscara no initBuscaCEP
  
  // Peso e dimensões - permitir apenas números e ponto decimal
  const camposNumericos = ['peso-kg', 'dimensao-altura', 'dimensao-largura', 'dimensao-profundidade'];
  camposNumericos.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.addEventListener('input', function(e) {
        // Permitir apenas números, ponto e vírgula
        this.value = this.value.replace(/[^\d.,]/g, '').replace(',', '.');
      });
    }
  });
}

function aplicarMascaraCEP(input) {
  let valor = input.value.replace(/\D/g, '');
  if (valor.length > 8) valor = valor.substring(0, 8);
  if (valor.length > 5) {
    valor = valor.substring(0, 5) + '-' + valor.substring(5);
  }
  input.value = valor;
}

// ========================================
// Cálculo de Volume Automático
// ========================================
function initCalculoVolume() {
  const altura = document.getElementById('dimensao-altura');
  const largura = document.getElementById('dimensao-largura');
  const profundidade = document.getElementById('dimensao-profundidade');
  
  if (altura && largura && profundidade) {
    [altura, largura, profundidade].forEach(campo => {
      campo.addEventListener('input', calcularVolume);
    });
  }
}

function calcularVolume() {
  const altura = parseFloat(document.getElementById('dimensao-altura')?.value || 0);
  const largura = parseFloat(document.getElementById('dimensao-largura')?.value || 0);
  const profundidade = parseFloat(document.getElementById('dimensao-profundidade')?.value || 0);
  
  // Calcular volume em m³ (converter de cm para m)
  const volumeM3 = (altura * largura * profundidade) / 1000000;
  
  const volumeDisplay = document.getElementById('volume-total');
  if (volumeDisplay) {
    if (volumeM3 > 0) {
      volumeDisplay.textContent = volumeM3.toFixed(4) + ' m³';
    } else {
      volumeDisplay.textContent = '0 m³';
    }
  }
}

// ========================================
// Sistema de Cálculo de Preço por KM
// ========================================
let priceCalc = null;
let priceCalculationTimeout = null;

function initPriceCalculator() {
  console.log('🧮 Inicializando calculadora de preço...');
  
  if (typeof PriceCalculator === 'undefined') {
    console.error('❌ PriceCalculator não foi carregado!');
    return;
  }
  
  priceCalc = new PriceCalculator();
  console.log('✅ PriceCalculator criado com sucesso');
  
  // Event listeners para tipo de origem/destino
  const origemTipoRadios = document.querySelectorAll('input[name="origem_tipo"]');
  const destinoTipoRadios = document.querySelectorAll('input[name="destino_tipo"]');
  
  console.log(`📻 Encontrados ${origemTipoRadios.length} radios de origem e ${destinoTipoRadios.length} radios de destino`);
  
  origemTipoRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      console.log('🔄 Origem tipo mudou para:', e.target.value);
      toggleOriginFields(e);
    });
  });
  
  destinoTipoRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      console.log('🔄 Destino tipo mudou para:', e.target.value);
      toggleDestinationFields(e);
    });
  });
  
  // Event listeners para calcular preço automaticamente
  const fields = {
    'origem-cidade': 'Origem Cidade',
    'origem-estado': 'Origem Estado',
    'origem-endereco': 'Origem Endereço',
    'destino-cidade': 'Destino Cidade',
    'destino-estado': 'Destino Estado',
    'destino-endereco': 'Destino Endereço'
  };
  
  Object.keys(fields).forEach(id => {
    const field = document.getElementById(id);
    if (field) {
      console.log(`✅ Campo encontrado: ${fields[id]} (${id})`);
      
      // Para selects, usar 'change', para inputs usar 'blur' e 'input'
      if (field.tagName === 'SELECT') {
        field.addEventListener('change', () => {
          console.log(`📝 ${fields[id]} mudou para:`, field.value);
          debouncePriceCalculation();
        });
      } else {
        field.addEventListener('blur', () => {
          console.log(`📝 ${fields[id]} blur:`, field.value);
          debouncePriceCalculation();
        });
        field.addEventListener('input', () => {
          debouncePriceCalculation();
        });
      }
    } else {
      console.warn(`⚠️ Campo não encontrado: ${fields[id]} (${id})`);
    }
  });
  
  console.log('✅ Calculadora de preço inicializada com sucesso!');
}

function debouncePriceCalculation() {
  if (priceCalculationTimeout) {
    clearTimeout(priceCalculationTimeout);
  }
  
  console.log('⏱️ Agendando cálculo de preço em 1 segundo...');
  
  priceCalculationTimeout = setTimeout(() => {
    console.log('🚀 Disparando cálculo de preço');
    calculatePriceEstimate();
  }, 1000);
}

function toggleOriginFields(e) {
  const isRodoviaria = e.target.value === 'rodoviaria';
  const camposEndereco = document.getElementById('origem-campos-endereco');
  
  if (camposEndereco) {
    if (isRodoviaria) {
      camposEndereco.style.display = 'none';
      camposEndereco.querySelectorAll('input').forEach(input => {
        input.removeAttribute('required');
      });
    } else {
      camposEndereco.style.display = 'grid';
      document.getElementById('origem-cep')?.setAttribute('required', '');
      document.getElementById('origem-bairro')?.setAttribute('required', '');
      document.getElementById('origem-endereco')?.setAttribute('required', '');
    }
  }
  
  calculatePriceEstimate();
}

function toggleDestinationFields(e) {
  const isRodoviaria = e.target.value === 'rodoviaria';
  const camposEndereco = document.getElementById('destino-campos-endereco');
  
  if (camposEndereco) {
    if (isRodoviaria) {
      camposEndereco.style.display = 'none';
      camposEndereco.querySelectorAll('input').forEach(input => {
        input.removeAttribute('required');
      });
    } else {
      camposEndereco.style.display = 'grid';
      document.getElementById('destino-cep')?.setAttribute('required', '');
      document.getElementById('destino-bairro')?.setAttribute('required', '');
      document.getElementById('destino-endereco')?.setAttribute('required', '');
    }
  }
  
  calculatePriceEstimate();
}

async function calculatePriceEstimate() {
  console.log('🧮 calculatePriceEstimate chamado');
  
  if (!priceCalc) {
    console.error('❌ priceCalc não está inicializado');
    return;
  }
  
  if (priceCalc.getCalculatingStatus()) {
    console.log('⏳ Cálculo já em andamento, aguardando...');
    return;
  }
  
  try {
    const originType = document.querySelector('input[name="origem_tipo"]:checked')?.value;
    const destType = document.querySelector('input[name="destino_tipo"]:checked')?.value;
    
    const originCity = document.getElementById('origem-cidade')?.value?.trim() || '';
    const originState = document.getElementById('origem-estado')?.value || '';
    const originAddress = document.getElementById('origem-endereco')?.value?.trim() || '';
    
    const destCity = document.getElementById('destino-cidade')?.value?.trim() || '';
    const destState = document.getElementById('destino-estado')?.value || '';
    const destAddress = document.getElementById('destino-endereco')?.value?.trim() || '';
    
    console.log('📍 Dados coletados:', {
      origem: { tipo: originType, cidade: originCity, estado: originState, endereco: originAddress },
      destino: { tipo: destType, cidade: destCity, estado: destState, endereco: destAddress }
    });
    
    if (!originCity || !originState || !destCity || !destState) {
      console.log('⚠️ Campos obrigatórios não preenchidos');
      hidePrice();
      return;
    }
    
    if (originType === 'casa' && !originAddress) {
      console.log('⚠️ Tipo casa selecionado mas endereço de origem não preenchido');
      hidePrice();
      return;
    }
    
    if (destType === 'casa' && !destAddress) {
      console.log('⚠️ Tipo casa selecionado mas endereço de destino não preenchido');
      hidePrice();
      return;
    }
    
    console.log('✅ Todos os campos necessários preenchidos, iniciando cálculo...');
    showPriceLoading();
    priceCalc.setCalculatingStatus(true);
    
    // Buscar coordenadas de origem
    console.log(`🔍 Buscando coordenadas de origem (${originType})...`);
    let originCoords;
    if (originType === 'rodoviaria') {
      originCoords = await priceCalc.getBusStationCoords(originCity, originState);
    } else {
      originCoords = await priceCalc.getAddressCoords(originAddress, originCity, originState);
    }
    
    if (!originCoords) {
      console.error('❌ Não foi possível localizar origem');
      showPriceError('Não foi possível localizar o endereço de origem');
      priceCalc.setCalculatingStatus(false);
      return;
    }
    console.log('✅ Coordenadas de origem:', originCoords);
    
    // Buscar coordenadas de destino
    console.log(`🔍 Buscando coordenadas de destino (${destType})...`);
    let destCoords;
    if (destType === 'rodoviaria') {
      destCoords = await priceCalc.getBusStationCoords(destCity, destState);
    } else {
      destCoords = await priceCalc.getAddressCoords(destAddress, destCity, destState);
    }
    
    if (!destCoords) {
      console.error('❌ Não foi possível localizar destino');
      showPriceError('Não foi possível localizar o endereço de destino');
      priceCalc.setCalculatingStatus(false);
      return;
    }
    console.log('✅ Coordenadas de destino:', destCoords);
    
    // Calcular distância
    console.log('📏 Calculando distância...');
    const distance = await priceCalc.calculateDistance(originCoords, destCoords);
    
    if (!distance || distance <= 0) {
      console.error('❌ Não foi possível calcular distância');
      showPriceError('Erro ao calcular a distância. Verifique os endereços informados.');
      priceCalc.setCalculatingStatus(false);
      return;
    }
    console.log('✅ Distância calculada:', distance, 'km');
    
    // Calcular preço
    const price = priceCalc.calculatePrice(distance);
    console.log('💰 Preço calculado: R$', price);
    
    showPriceResult(distance, price);
    priceCalc.setCalculatingStatus(false);
    console.log('✅ Cálculo de preço concluído com sucesso!');
    
  } catch (error) {
    console.error('Erro ao calcular preço:', error);
    showPriceError('Erro ao calcular o preço da viagem');
    priceCalc.setCalculatingStatus(false);
  }
}

function showPriceLoading() {
  const secaoPreco = document.getElementById('secao-preco');
  const precoTotal = document.getElementById('preco-total');
  const distanciaKm = document.getElementById('distancia-km');
  
  if (secaoPreco && precoTotal && distanciaKm) {
    secaoPreco.classList.remove('hidden');
    precoTotal.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    distanciaKm.textContent = '...';
  }
}

function showPriceResult(distance, price) {
  const secaoPreco = document.getElementById('secao-preco');
  const precoTotal = document.getElementById('preco-total');
  const distanciaKm = document.getElementById('distancia-km');
  
  if (secaoPreco && precoTotal && distanciaKm) {
    secaoPreco.classList.remove('hidden');
    secaoPreco.classList.add('animate-fadeIn');
    precoTotal.textContent = priceCalc.formatCurrency(price);
    distanciaKm.textContent = distance.toFixed(2);
  }
}

function showPriceError(message) {
  const secaoPreco = document.getElementById('secao-preco');
  const precoTotal = document.getElementById('preco-total');
  const distanciaKm = document.getElementById('distancia-km');
  
  if (secaoPreco && precoTotal && distanciaKm) {
    secaoPreco.classList.remove('hidden');
    precoTotal.textContent = '--';
    distanciaKm.textContent = '--';
    
    showToast(message, 'warning');
    
    setTimeout(hidePrice, 3000);
  }
}

function hidePrice() {
  const secaoPreco = document.getElementById('secao-preco');
  if (secaoPreco) {
    secaoPreco.classList.add('hidden');
  }
}
