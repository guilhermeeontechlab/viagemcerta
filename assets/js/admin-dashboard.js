// ========================================
// Viagem Certa - Dashboard Admin
// ========================================

let viagensCache = [];
let clientesCache = [];
let currentModalViagem = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Verificar autenticação admin
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return;
  }
  
  // Inicializar componentes
  initSidebar();
  initNavigation();
  initAdminData();
  initLogout();
  loadAllData();
  
  // Auto-refresh a cada 30 segundos
  setInterval(() => {
    loadAllData();
  }, 30000);
  
  // Atualizar hora
  updateLastUpdateTime();
  setInterval(updateLastUpdateTime, 60000);
});

// ========================================
// Verificar Autenticação de Admin
// ========================================
async function checkAdminAuth() {
  const adminUser = storage.get('admin_user');
  const isAdmin = storage.get('is_admin');
  
  // Se não há dados de admin no storage, redirecionar
  if (!adminUser || !isAdmin) {
    console.warn('⚠️ Acesso negado: Usuário não é administrador');
    alert('Acesso restrito! Esta área é exclusiva para administradores.');
    window.location.href = 'login.html';
    return false;
  }
  
  // Verificar se o Supabase está disponível
  if (typeof supabaseClient === 'undefined') {
    console.warn('⚠️ Supabase não carregado, permitindo acesso temporário');
    return true; // Permitir acesso se Supabase não estiver carregado (desenvolvimento)
  }
  
  // Verificar se o email do admin existe na tabela de admins
  try {
    const { data, error } = await supabaseClient
      .from('admins')
      .select('id_admin, nome, email')
      .eq('email', adminUser.email)
      .single();
    
    if (error) {
      console.error('❌ Erro na query:', error);
      
      // Se a tabela não existir, permitir acesso (sistema em desenvolvimento)
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.warn('⚠️ Tabela admins não existe, permitindo acesso temporário');
        return true;
      }
      
      // Outros erros - redirecionar
      storage.remove('admin_user');
      storage.remove('is_admin');
      alert('Erro ao verificar credenciais. Por favor, faça login novamente.');
      window.location.href = 'admin-login.html';
      return false;
    }
    
    if (!data) {
      console.warn('⚠️ Admin não encontrado na base de dados, mas permitindo acesso');
      // Permitir acesso mesmo se não encontrar (sistema pode estar em desenvolvimento)
      return true;
    }
    
    console.log('✅ Autenticação de admin verificada:', data.nome);
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao verificar autenticação admin:', error);
    console.warn('⚠️ Permitindo acesso apesar do erro (desenvolvimento)');
    return true; // Permitir acesso em caso de erro para não bloquear desenvolvimento
  }
}

// ========================================
// Carregar Todos os Dados
// ========================================
async function loadAllData() {
  await Promise.all([
    loadDashboardStats(),
    loadViagensPendentes(),
    loadTodasViagens(),
    loadClientes()
  ]);
  updateLastUpdateTime();
}

// ========================================
// Atualizar Hora da Última Atualização
// ========================================
function updateLastUpdateTime() {
  const element = document.getElementById('last-update');
  if (element) {
    const now = new Date();
    element.textContent = now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageName = link.dataset.page;
      navigateToPage(pageName);
    });
  });
  
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
}

function navigateToPage(pageName) {
  const navLinks = document.querySelectorAll('.nav-link');
  const pageContents = document.querySelectorAll('.page-content');
  
  // Atualizar links ativos
  navLinks.forEach(l => l.classList.remove('active', 'bg-white/20', 'text-white'));
  const activeLink = document.querySelector(`[data-page="${pageName}"]`);
  if (activeLink) {
    activeLink.classList.add('active', 'bg-white/20', 'text-white');
  }
  
  // Mostrar conteúdo correspondente
  pageContents.forEach(content => content.classList.add('hidden'));
  const activeContent = document.getElementById(`content-${pageName}`);
  if (activeContent) {
    activeContent.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Atualizar título da página
  updatePageTitle(pageName);
  
  // Atualizar URL hash
  window.location.hash = pageName;
  
  // Carregar dados específicos
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
      loadViagensPendentes();
      break;
    case 'viagens-pendentes':
      renderTodasPendentes();
      break;
    case 'todas-viagens':
      renderTodasViagensPage();
      break;
    case 'clientes':
      renderClientes();
      break;
  }
}

function updatePageTitle(pageName) {
  const titles = {
    'dashboard': { title: 'Dashboard Administrativo', subtitle: 'Visão geral do sistema' },
    'viagens-pendentes': { title: 'Viagens Pendentes', subtitle: 'Gerencie as solicitações pendentes' },
    'todas-viagens': { title: 'Todas as Viagens', subtitle: 'Histórico completo de viagens' },
    'clientes': { title: 'Clientes', subtitle: 'Gerencie os clientes cadastrados' }
  };
  
  const pageInfo = titles[pageName] || { title: 'Dashboard', subtitle: '' };
  
  const titleElement = document.getElementById('page-title');
  const subtitleElement = document.getElementById('page-subtitle');
  
  if (titleElement) titleElement.textContent = pageInfo.title;
  if (subtitleElement) subtitleElement.textContent = pageInfo.subtitle;
}

// ========================================
// Carregar Dados do Admin
// ========================================
function initAdminData() {
  const admin = storage.get('admin_user');
  
  if (!admin) return;
  
  const adminNameElement = document.getElementById('admin-name');
  const adminEmailElement = document.getElementById('admin-email');
  const adminAvatarElement = document.getElementById('admin-avatar');
  
  if (adminNameElement) {
    adminNameElement.textContent = admin.nome || 'Administrador';
  }
  
  if (adminEmailElement) {
    adminEmailElement.textContent = admin.email || '';
  }
  
  if (adminAvatarElement) {
    const initials = getUserInitials(admin.nome || admin.email);
    adminAvatarElement.textContent = initials;
  }
}

// ========================================
// Carregar Estatísticas
// ========================================
async function loadDashboardStats() {
  try {
    console.log('📊 Carregando estatísticas admin...');
    
    const { data: viagens, error } = await supabaseClient
      .from('viagens')
      .select('*');
    
    if (error) {
      console.error('❌ Erro ao buscar viagens:', error);
      return;
    }
    
    console.log(`✅ ${viagens?.length || 0} viagens encontradas`);
    
    const stats = {
      total: viagens?.length || 0,
      pendentes: viagens?.filter(v => v.status === 'pendente').length || 0,
      andamento: viagens?.filter(v => v.status === 'ativo' || v.status === 'agendado').length || 0,
      concluidas: viagens?.filter(v => v.status === 'concluido').length || 0
    };
    
    // Atualizar stats cards
    const statTotal = document.getElementById('stat-total');
    const statPendentes = document.getElementById('stat-pendentes');
    const statAndamento = document.getElementById('stat-andamento');
    const statConcluidas = document.getElementById('stat-concluidas');
    
    if (statTotal) animateCounter(statTotal, stats.total);
    if (statPendentes) animateCounter(statPendentes, stats.pendentes);
    if (statAndamento) animateCounter(statAndamento, stats.andamento);
    if (statConcluidas) animateCounter(statConcluidas, stats.concluidas);
    
    // Atualizar badge de pendentes no menu
    const badgePendentes = document.getElementById('badge-pendentes');
    if (badgePendentes) {
      badgePendentes.textContent = stats.pendentes;
      if (stats.pendentes > 0) {
        badgePendentes.classList.add('animate-pulse');
      } else {
        badgePendentes.classList.remove('animate-pulse');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao carregar estatísticas:', error);
  }
}

// ========================================
// Carregar Viagens Pendentes
// ========================================
async function loadViagensPendentes() {
  try {
    console.log('⏳ Carregando viagens pendentes...');
    
    const { data: viagens, error } = await supabaseClient
      .from('viagens')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar viagens pendentes:', error);
      return;
    }
    
    console.log(`✅ ${viagens?.length || 0} viagens pendentes encontradas`);
    
    renderViagensPendentes(viagens || []);
    
  } catch (error) {
    console.error('❌ Erro ao carregar viagens pendentes:', error);
  }
}

function renderViagensPendentes(viagens) {
  const tbody = document.getElementById('viagens-pendentes-tbody');
  const cardsContainer = document.getElementById('viagens-pendentes-cards');
  
  if (!viagens || viagens.length === 0) {
    const emptyMessage = `
      <div class="text-center py-12 text-gray-500">
        <i class="fas fa-check-circle text-4xl mb-3 text-green-500"></i>
        <p class="font-semibold">Nenhuma viagem pendente!</p>
        <p class="text-sm mt-2">Todas as solicitações foram processadas</p>
      </div>
    `;
    
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6">${emptyMessage}</td></tr>`;
    }
    if (cardsContainer) {
      cardsContainer.innerHTML = emptyMessage;
    }
    return;
  }
  
  // Renderizar tabela desktop
  if (tbody) {
    tbody.innerHTML = viagens.map(viagem => `
      <tr class="hover:bg-gray-50 transition">
        <td class="px-4 py-3">
          <div class="font-medium text-gray-900">${viagem.nome_cliente}</div>
          <div class="text-xs text-gray-500">${viagem.email_cliente || 'Sem email'}</div>
        </td>
        <td class="px-4 py-3 text-sm text-gray-900">${viagem.origem}</td>
        <td class="px-4 py-3 text-sm text-gray-900">${viagem.destino}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${viagem.data_viagem ? formatDate(viagem.data_viagem) : 'Não informada'}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${formatDateTime(viagem.created_at)}</td>
        <td class="px-4 py-3">
          <div class="flex items-center justify-center gap-2">
            <button onclick="verDetalhesViagem(${viagem.id_viagem})" class="text-blue-900 hover:text-blue-700" title="Ver detalhes">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="aceitarViagem(${viagem.id_viagem})" class="text-green-600 hover:text-green-700" title="Aceitar">
              <i class="fas fa-check"></i>
            </button>
            <button onclick="recusarViagem(${viagem.id_viagem})" class="text-red-600 hover:text-red-700" title="Recusar">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }
  
  // Renderizar cards mobile
  if (cardsContainer) {
    cardsContainer.innerHTML = viagens.map(viagem => `
      <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div class="flex justify-between items-start mb-3">
          <div>
            <div class="font-semibold text-gray-900">${viagem.nome_cliente}</div>
            <div class="text-xs text-gray-500">${viagem.email_cliente || 'Sem email'}</div>
          </div>
          <span class="badge badge-warning">Pendente</span>
        </div>
        <div class="space-y-2 text-sm mb-3">
          <div class="flex items-center gap-2">
            <i class="fas fa-map-marker-alt text-blue-900"></i>
            <span>${viagem.origem}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="fas fa-map-marker-alt text-green-600"></i>
            <span>${viagem.destino}</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <i class="far fa-calendar"></i>
            <span>${viagem.data_viagem ? formatDate(viagem.data_viagem) : 'Data não informada'}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="verDetalhesViagem(${viagem.id_viagem})" class="btn-outline text-sm px-3 py-1 flex-1">
            Detalhes
          </button>
          <button onclick="aceitarViagem(${viagem.id_viagem})" class="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700">
            <i class="fas fa-check"></i>
          </button>
          <button onclick="recusarViagem(${viagem.id_viagem})" class="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `).join('');
  }
}

// ========================================
// Carregar Todas as Viagens
// ========================================
async function loadTodasViagens() {
  try {
    const { data: viagens, error } = await supabaseClient
      .from('viagens')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    viagensCache = viagens || [];
    
  } catch (error) {
    console.error('❌ Erro ao carregar todas as viagens:', error);
  }
}

function renderTodasViagensPage() {
  const container = document.getElementById('todas-viagens-container');
  if (!container) return;
  
  filterViagens(); // Aplicar filtros
}

window.filterViagens = function() {
  const container = document.getElementById('todas-viagens-container');
  if (!container) return;
  
  const statusFilter = document.getElementById('filter-status')?.value || '';
  const searchTerm = document.getElementById('search-viagens')?.value.toLowerCase() || '';
  
  let filtered = viagensCache;
  
  if (statusFilter) {
    filtered = filtered.filter(v => v.status === statusFilter);
  }
  
  if (searchTerm) {
    filtered = filtered.filter(v => 
      v.nome_cliente?.toLowerCase().includes(searchTerm) ||
      v.origem?.toLowerCase().includes(searchTerm) ||
      v.destino?.toLowerCase().includes(searchTerm)
    );
  }
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-500">
        <i class="fas fa-search text-4xl mb-3"></i>
        <p>Nenhuma viagem encontrada</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="space-y-3">
      ${filtered.map(v => `
        <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="font-semibold text-gray-900">${v.nome_cliente}</span>
                ${getStatusBadge(v.status)}
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <i class="fas fa-route text-blue-900"></i>
                <span>${v.origem} → ${v.destino}</span>
              </div>
              <div class="text-xs text-gray-500">
                <i class="far fa-calendar"></i> ${v.data_viagem ? formatDate(v.data_viagem) : 'Data não informada'}
                | Solicitado: ${formatDateTime(v.created_at)}
              </div>
            </div>
            <button onclick="verDetalhesViagem(${v.id_viagem})" class="btn-primary text-sm px-4 py-2">
              Ver Detalhes
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
};

function renderTodasPendentes() {
  const container = document.getElementById('todas-pendentes-container');
  if (!container) return;
  
  const pendentes = viagensCache.filter(v => v.status === 'pendente');
  
  if (pendentes.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-500">
        <i class="fas fa-check-circle text-4xl mb-3 text-green-500"></i>
        <p>Nenhuma viagem pendente!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = renderViagensList(pendentes);
}

function renderViagensList(viagens) {
  return `
    <div class="space-y-4">
      ${viagens.map(v => `
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div class="flex justify-between items-start mb-3">
            <div>
              <div class="font-semibold text-gray-900 mb-1">${v.nome_cliente}</div>
              <div class="text-xs text-gray-500">${v.email_cliente || 'Sem email'}</div>
            </div>
            ${getStatusBadge(v.status)}
          </div>
          <div class="grid md:grid-cols-2 gap-3 text-sm mb-3">
            <div>
              <div class="text-xs text-gray-500 mb-1">Origem</div>
              <div class="flex items-center gap-2">
                <i class="fas fa-map-marker-alt text-blue-900"></i>
                <span>${v.origem}</span>
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">Destino</div>
              <div class="flex items-center gap-2">
                <i class="fas fa-map-marker-alt text-green-600"></i>
                <span>${v.destino}</span>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="verDetalhesViagem(${v.id_viagem})" class="btn-outline text-sm px-4 py-2 flex-1">
              Ver Detalhes
            </button>
            ${v.status === 'pendente' ? `
              <button onclick="aceitarViagem(${v.id_viagem})" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                Aceitar
              </button>
              <button onclick="recusarViagem(${v.id_viagem})" class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">
                Recusar
              </button>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ========================================
// Carregar Clientes
// ========================================
async function loadClientes() {
  try {
    const { data: clientes, error } = await supabaseClient
      .from('cadastros')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    clientesCache = clientes || [];
    
  } catch (error) {
    console.error('❌ Erro ao carregar clientes:', error);
  }
}

function renderClientes() {
  const container = document.getElementById('clientes-container');
  if (!container) return;
  
  if (clientesCache.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-500">
        <i class="fas fa-users text-4xl mb-3"></i>
        <p>Nenhum cliente cadastrado</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${clientesCache.map(c => `
        <div class="card">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 font-bold">
              ${getUserInitials(c.nome)}
            </div>
            <div class="flex-1">
              <div class="font-semibold text-gray-900">${c.nome}</div>
              <div class="text-xs text-gray-500">${c.email}</div>
            </div>
          </div>
          <div class="text-sm text-gray-600 space-y-1">
            ${c.telefone ? `
              <div class="flex items-center gap-2">
                <i class="fas fa-phone text-gray-400"></i>
                <span>${c.telefone}</span>
              </div>
            ` : ''}
            ${c.cpf ? `
              <div class="flex items-center gap-2">
                <i class="fas fa-id-card text-gray-400"></i>
                <span>${c.cpf}</span>
              </div>
            ` : ''}
            <div class="flex items-center gap-2 text-xs">
              <i class="far fa-calendar text-gray-400"></i>
              <span>Cadastrado em ${formatDate(c.created_at)}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ========================================
// Ações de Viagem
// ========================================
window.verDetalhesViagem = async function(viagemId) {
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
  const contentDiv = document.getElementById('modal-content');
  const actionsDiv = document.getElementById('modal-actions');
  
  // Preencher conteúdo com todos os detalhes
  contentDiv.innerHTML = `
    <!-- Informações Gerais -->
    <div class="grid md:grid-cols-3 gap-4">
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <label class="text-xs font-semibold text-gray-600 uppercase block mb-2">Tipo de Serviço</label>
        <div class="flex items-center gap-2">
          <i class="fas ${viagem.tipo_servico === 'passageiro' ? 'fa-user' : viagem.tipo_servico === 'mercadoria' ? 'fa-boxes' : 'fa-car'} text-blue-900"></i>
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

    <!-- Cliente e Informações da Solicitação -->
    <div class="grid md:grid-cols-3 gap-4">
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <label class="text-xs font-semibold text-gray-600 uppercase block mb-2">
          <i class="fas fa-user mr-1"></i>Cliente
        </label>
        <div class="flex items-center gap-2 text-gray-900">
          <span class="font-semibold">${viagem.nome_cliente}</span>
        </div>
        ${viagem.email_cliente ? `
          <div class="flex items-center gap-2 text-gray-600 text-sm mt-1">
            <i class="fas fa-envelope"></i>
            <span>${viagem.email_cliente}</span>
          </div>
        ` : ''}
        <div class="text-xs text-gray-500 mt-1">Solicitado em: ${formatDateTime(viagem.created_at)}</div>
      </div>
      
      ${(() => {
        // Buscar telefone do cliente no cadastro
        const btnWhatsApp = `
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <label class="text-xs font-semibold text-green-800 uppercase block mb-2">
              <i class="fas fa-phone mr-1"></i>Contato
            </label>
            <button onclick="contatarClienteWhatsApp('${viagem.email_cliente}', '${viagem.nome_cliente.replace(/'/g, "\\'")}', ${viagem.id_viagem})" 
                    class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2">
              <i class="fab fa-whatsapp text-xl"></i>
              Contatar via WhatsApp
            </button>
            <p class="text-xs text-gray-600 mt-2 text-center">
              <i class="fas fa-info-circle"></i>
              Clique para enviar mensagem pelo WhatsApp
            </p>
          </div>
        `;
        return btnWhatsApp;
      })()}

      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <label class="text-xs font-semibold text-gray-600 uppercase block mb-2">
          <i class="fas fa-dollar-sign mr-1"></i>Valores e Distância
        </label>
        <div class="text-sm space-y-1">
          ${(() => {
            const distancia = parseFloat(viagem.distancia_km);
            const precoPorKm = 0.50; // R$ 0,50 por km
            
            // Se tiver distância, calcular o preço baseado em R$3/km
            if (!isNaN(distancia) && distancia > 0) {
              const precoCalculado = distancia * precoPorKm;
              return `
                <div class="flex items-center gap-2">
                  <span class="text-gray-600">Preço Estimado:</span>
                  <span class="font-semibold text-green-600">R$ ${precoCalculado.toFixed(2)}</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  <i class="fas fa-calculator mr-1"></i>
                  ${distancia.toFixed(2)} km × R$ ${precoPorKm.toFixed(2)}/km
                </div>
              `;
            } else {
              return '<div class="text-gray-500 italic">Distância não calculada</div>';
            }
          })()}
          ${(() => {
            const distancia = parseFloat(viagem.distancia_km);
            return !isNaN(distancia) && distancia > 0 ? `
              <div class="flex items-center gap-2">
                <span class="text-gray-600">Distância:</span>
                <span class="font-semibold text-gray-900">${distancia.toFixed(2)} km</span>
              </div>
            ` : '';
          })()}
        </div>
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
        <div class="text-gray-600">${viagem.origem}</div>
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
        <div class="text-gray-600">${viagem.destino}</div>
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
              volumeText = `<span class="text-blue-900 font-semibold ml-2">(${volume.toFixed(4)} m³)</span>`;
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
  
  // Ações baseadas no status
  if (viagem.status === 'pendente') {
    actionsDiv.innerHTML = `
      <button onclick="aceitarViagem(${viagem.id_viagem}); closeModalViagem();" class="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm">
        <i class="fas fa-check"></i>
        Aceitar Viagem
      </button>
      <button onclick="recusarViagem(${viagem.id_viagem}); closeModalViagem();" class="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition text-sm">
        <i class="fas fa-times"></i>
        Recusar Viagem
      </button>
    `;
  } else if (viagem.status === 'agendado') {
    actionsDiv.innerHTML = `
      <button onclick="alterarStatusViagem(${viagem.id_viagem}, 'ativo'); closeModalViagem();" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
        <i class="fas fa-play"></i>
        Iniciar Viagem
      </button>
      <button onclick="alterarStatusViagem(${viagem.id_viagem}, 'cancelado'); closeModalViagem();" class="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition text-sm">
        <i class="fas fa-ban"></i>
        Cancelar
      </button>
    `;
  } else if (viagem.status === 'ativo') {
    actionsDiv.innerHTML = `
      <button onclick="alterarStatusViagem(${viagem.id_viagem}, 'concluido'); closeModalViagem();" class="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm">
        <i class="fas fa-check-circle"></i>
        Concluir Viagem
      </button>
    `;
  } else {
    actionsDiv.innerHTML = '';
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

window.aceitarViagem = async function(viagemId) {
  if (!confirm('Deseja aceitar esta viagem? O status será alterado para "Agendado".')) {
    return;
  }
  
  await alterarStatusViagem(viagemId, 'agendado');
};

window.recusarViagem = async function(viagemId) {
  if (!confirm('Deseja recusar esta viagem? O status será alterado para "Cancelado".')) {
    return;
  }
  
  await alterarStatusViagem(viagemId, 'cancelado');
};

window.alterarStatusViagem = async function(viagemId, novoStatus) {
  try {
    const { error } = await supabaseClient
      .from('viagens')
      .update({ status: novoStatus })
      .eq('id_viagem', viagemId);
    
    if (error) {
      throw new Error(error.message);
    }
    
    const statusMessages = {
      'agendado': 'Viagem aceita e agendada com sucesso!',
      'cancelado': 'Viagem cancelada com sucesso!',
      'ativo': 'Viagem iniciada com sucesso!',
      'concluido': 'Viagem concluída com sucesso!'
    };
    
    showToast(statusMessages[novoStatus] || 'Status atualizado com sucesso!', 'success');
    
    // Recarregar dados
    await loadAllData();
    
  } catch (error) {
    console.error('Erro:', error);
    showToast('Erro ao alterar status da viagem', 'error');
  }
};

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
// Logout
// ========================================
function initLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('Tem certeza que deseja sair do painel administrativo?')) {
        await logoutAdmin();
      }
    });
  }
}

// ========================================
// Contatar Cliente via WhatsApp
// ========================================
window.contatarClienteWhatsApp = async function(emailCliente, nomeCliente, idViagem) {
  try {
    console.log('📞 Buscando telefone do cliente:', emailCliente);
    
    // Buscar telefone do cliente no cadastro
    const { data: cliente, error } = await supabaseClient
      .from('cadastros')
      .select('telefone')
      .eq('email', emailCliente)
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar telefone:', error);
      showToast('Erro ao buscar telefone do cliente', 'error');
      return;
    }
    
    if (!cliente || !cliente.telefone) {
      showToast('Cliente não possui telefone cadastrado', 'warning');
      return;
    }
    
    // Limpar telefone (remover caracteres especiais)
    const telefone = cliente.telefone.replace(/\D/g, '');
    
    if (telefone.length < 10) {
      showToast('Telefone do cliente está inválido', 'error');
      return;
    }
    
    // Formatar mensagem para WhatsApp
    const mensagem = `Olá ${nomeCliente}! 👋\n\nSou da equipe *Viagem Certa* e estou entrando em contato sobre sua solicitação de viagem #${idViagem}.`;
    
    // Codificar mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem);
    
    // Abrir WhatsApp (formato: https://wa.me/5579999999999?text=mensagem)
    const urlWhatsApp = `https://wa.me/55${telefone}?text=${mensagemCodificada}`;
    
    console.log('✅ Abrindo WhatsApp:', urlWhatsApp);
    
    // Abrir em nova aba
    window.open(urlWhatsApp, '_blank');
    
    showToast('Abrindo WhatsApp...', 'success');
    
  } catch (error) {
    console.error('❌ Erro ao contatar cliente:', error);
    showToast('Erro ao abrir WhatsApp', 'error');
  }
};

// Expor função global
window.loadAllData = loadAllData;

