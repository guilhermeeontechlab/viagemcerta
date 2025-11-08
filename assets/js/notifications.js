// ========================================
// Viagem Certa - Sistema de Notificações
// ========================================

class NotificationManager {
  constructor() {
    this.unreadCount = 0;
    this.notifications = [];
    this.realtimeChannel = null;
    this.badgeElement = null;
    this.listElement = null;
    this.soundEnabled = true;
  }

  // Inicializar sistema de notificações
  async init(userEmail) {
    if (!userEmail) {
      console.error('Email do usuário não fornecido');
      return;
    }

    this.userEmail = userEmail;
    this.setupUI();
    await this.loadNotifications();
    this.setupRealtime();
    this.checkNotificationPermission();
  }

  // Configurar elementos da UI
  setupUI() {
    this.badgeElement = document.getElementById('notification-badge');
    this.bellButton = document.getElementById('notification-bell');
    this.listElement = document.getElementById('notification-list');
    this.dropdown = document.getElementById('notification-dropdown');

    // Toggle dropdown ao clicar no sino
    if (this.bellButton) {
      this.bellButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
    }

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
      if (this.dropdown && !this.dropdown.contains(e.target)) {
        this.closeDropdown();
      }
    });
  }

  // Carregar notificações do banco
  async loadNotifications() {
    try {
      const { data, error } = await supabaseClient
        .from('notificacoes')
        .select('*')
        .eq('user_email', this.userEmail)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // Se tabela não existe (erro 404), não quebrar
        if (error.code === 'PGRST116' || error.message.includes('does not exist') || error.message.includes('404')) {
          console.log('⚠️ Tabela de notificações não existe ainda');
          console.log('💡 Execute supabase-setup.sql para ativar notificações');
          this.notifications = [];
          this.renderNotifications();
          return;
        }
        throw error;
      }

      this.notifications = data || [];
      this.updateUnreadCount();
      this.renderNotifications();
    } catch (error) {
      console.log('⚠️ Erro ao carregar notificações:', error);
      this.notifications = [];
      this.renderNotifications();
    }
  }

  // Configurar Supabase Realtime
  setupRealtime() {
    try {
      // Subscrever mudanças na tabela de notificações
      this.realtimeChannel = supabaseClient
        .channel('notificacoes-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificacoes',
            filter: `user_email=eq.${this.userEmail}`
          },
          (payload) => {
            console.log('Nova notificação recebida:', payload);
            this.handleNewNotification(payload.new);
          }
        )
        .subscribe((status) => {
          console.log('Status Realtime:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Conectado ao Realtime - Aguardando notificações');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('⚠️ Realtime não conectou (tabela pode não existir)');
          }
        });
    } catch (error) {
      console.log('⚠️ Realtime desabilitado:', error);
    }

    // Também monitorar mudanças de status nas viagens diretamente
    supabaseClient
      .channel('viagens-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'viagens'
        },
        (payload) => {
          console.log('Viagem atualizada:', payload);
          // Recarregar viagens se estiver na página do dashboard
          if (typeof loadViagensAtivas === 'function') {
            loadViagensAtivas();
          }
          if (typeof loadDashboardStats === 'function') {
            loadDashboardStats();
          }
        }
      )
      .subscribe();
  }

  // Processar nova notificação
  handleNewNotification(notification) {
    // Adicionar ao array de notificações
    this.notifications.unshift(notification);
    
    // Atualizar contador
    this.updateUnreadCount();
    
    // Renderizar lista
    this.renderNotifications();
    
    // Mostrar toast
    this.showNotificationToast(notification);
    
    // Tocar som (se habilitado)
    if (this.soundEnabled) {
      this.playNotificationSound();
    }
    
    // Notificação do navegador (se permitido)
    this.showBrowserNotification(notification);
    
    // Adicionar animação ao sino
    this.animateBell();
  }

  // Atualizar contador de não lidas
  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.lida).length;
    
    if (this.badgeElement) {
      if (this.unreadCount > 0) {
        this.badgeElement.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
        this.badgeElement.classList.remove('hidden');
      } else {
        this.badgeElement.classList.add('hidden');
      }
    }
  }

  // Renderizar lista de notificações
  renderNotifications() {
    if (!this.listElement) return;

    if (this.notifications.length === 0) {
      this.listElement.innerHTML = `
        <div class="p-8 text-center text-gray-500">
          <i class="fas fa-bell-slash text-4xl mb-3 opacity-50"></i>
          <p>Nenhuma notificação</p>
        </div>
      `;
      return;
    }

    this.listElement.innerHTML = this.notifications
      .slice(0, 10)
      .map(notif => this.renderNotificationItem(notif))
      .join('');

    // Adicionar event listeners para marcar como lida
    this.listElement.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', () => {
        const notifId = parseInt(item.dataset.id);
        this.markAsRead(notifId);
      });
    });
  }

  // Renderizar item individual
  renderNotificationItem(notif) {
    const timeAgo = this.getTimeAgo(notif.created_at);
    const iconClass = this.getNotificationIcon(notif.tipo);
    const bgClass = notif.lida ? 'bg-white' : 'bg-blue-50';

    return `
      <div class="notification-item ${bgClass} p-4 hover:bg-gray-50 cursor-pointer transition border-b border-gray-100" data-id="${notif.id}">
        <div class="flex gap-3">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <i class="${iconClass} text-blue-900"></i>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm ${notif.lida ? 'text-gray-700' : 'text-gray-900 font-semibold'}">
              ${notif.mensagem}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              <i class="far fa-clock"></i> ${timeAgo}
            </p>
          </div>
          ${!notif.lida ? '<div class="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>' : ''}
        </div>
      </div>
    `;
  }

  // Obter ícone baseado no tipo
  getNotificationIcon(tipo) {
    const icons = {
      'aceito': 'fas fa-check-circle',
      'recusado': 'fas fa-times-circle',
      'cancelado': 'fas fa-ban',
      'atualizado': 'fas fa-sync-alt',
      'info': 'fas fa-info-circle'
    };
    return icons[tipo] || 'fas fa-bell';
  }

  // Calcular tempo decorrido
  getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'agora mesmo';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min atrás`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} h atrás`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} dias atrás`;
    
    return formatDate(dateString);
  }

  // Marcar notificação como lida
  async markAsRead(notifId) {
    try {
      const { error } = await supabaseClient
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', notifId);

      if (error) throw error;

      // Atualizar localmente
      const notif = this.notifications.find(n => n.id === notifId);
      if (notif) {
        notif.lida = true;
        this.updateUnreadCount();
        this.renderNotifications();
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }

  // Marcar todas como lidas
  async markAllAsRead() {
    try {
      const { error } = await supabaseClient
        .from('notificacoes')
        .update({ lida: true })
        .eq('user_email', this.userEmail)
        .eq('lida', false);

      if (error) throw error;

      // Atualizar localmente
      this.notifications.forEach(n => n.lida = true);
      this.updateUnreadCount();
      this.renderNotifications();
      
      showToast('Todas as notificações foram marcadas como lidas', 'success');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      showToast('Erro ao marcar notificações', 'error');
    }
  }

  // Toggle dropdown
  toggleDropdown() {
    if (!this.dropdown) return;
    
    if (this.dropdown.classList.contains('hidden')) {
      this.openDropdown();
    } else {
      this.closeDropdown();
    }
  }

  // Abrir dropdown
  openDropdown() {
    if (!this.dropdown) return;
    this.dropdown.classList.remove('hidden');
    this.dropdown.classList.add('animate-fadeIn');
  }

  // Fechar dropdown
  closeDropdown() {
    if (!this.dropdown) return;
    this.dropdown.classList.add('hidden');
    this.dropdown.classList.remove('animate-fadeIn');
  }

  // Mostrar toast de notificação
  showNotificationToast(notification) {
    const toastType = notification.tipo === 'aceito' ? 'success' : 
                     notification.tipo === 'cancelado' ? 'warning' : 'info';
    
    showToast(notification.mensagem, toastType, 5000);
  }

  // Tocar som de notificação
  playNotificationSound() {
    try {
      // Som sutil de notificação (usando Web Audio API)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Som de notificação não pode ser reproduzido:', error);
    }
  }

  // Animar sino
  animateBell() {
    if (!this.bellButton) return;
    
    this.bellButton.classList.add('animate-bounce');
    setTimeout(() => {
      this.bellButton.classList.remove('animate-bounce');
    }, 1000);
  }

  // Verificar permissão de notificações do navegador
  checkNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      // Perguntar permissão após 5 segundos (não intrusivo)
      setTimeout(() => {
        Notification.requestPermission();
      }, 5000);
    }
  }

  // Mostrar notificação do navegador
  showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Viagem Certa', {
          body: notification.mensagem,
          icon: '/assets/images/logo.png',
          badge: '/assets/images/logo.png',
          tag: `notification-${notification.id}`,
          requireInteraction: false
        });
      } catch (error) {
        console.log('Notificação do navegador não pôde ser exibida:', error);
      }
    }
  }

  // Limpar notificações antigas
  async clearOldNotifications() {
    try {
      // Deletar notificações lidas com mais de 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabaseClient
        .from('notificacoes')
        .delete()
        .eq('user_email', this.userEmail)
        .eq('lida', true)
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error);
    }
  }

  // Destruir e limpar recursos
  destroy() {
    if (this.realtimeChannel) {
      supabaseClient.removeChannel(this.realtimeChannel);
    }
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.NotificationManager = NotificationManager;
}

