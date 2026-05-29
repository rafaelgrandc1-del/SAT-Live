// SAT Live Client Application State Controller
document.addEventListener('DOMContentLoaded', () => {
  
  // Custom elegant toast notification system
  window.showNotification = function(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 p-4 rounded-xl shadow-2xl border transition-all duration-300 transform translate-y-2 opacity-0 text-sm ${
      type === 'success' 
        ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' 
        : type === 'error'
        ? 'bg-rose-950/90 border-rose-500/30 text-rose-200'
        : 'bg-indigo-950/90 border-indigo-500/30 text-indigo-200'
    }`;
    
    // Icon based on type
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg class="w-5 h-5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    } else {
      iconSvg = `<svg class="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    }
    
    toast.innerHTML = `
      ${iconSvg}
      <span class="font-medium">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);
    
    // Remove after 4s
    setTimeout(() => {
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  };

  // Initial Mock Database setup
  const DEFAULT_PROFILE = {
    name: "Cliente Teste",
    login: "cliente123",
    status: "Ativo",
    plan: "Plano Mensal",
    dueDate: "10/06/2026",
    connections: 1,
    renewalValue: 30.00
  };

  const DEFAULT_HISTORY = [
    { id: "SAT-7731", date: "10/05/2026", value: "R$ 30,00", status: "Aprovado", method: "Pix" },
    { id: "SAT-6523", date: "10/04/2026", value: "R$ 30,00", status: "Aprovado", method: "Pix" },
    { id: "SAT-5109", date: "10/03/2026", value: "R$ 30,00", status: "Aprovado", method: "Pix" }
  ];

  const DEFAULT_TICKETS = [
    { id: "SUP-1042", category: "Financeiro", message: "Gostaria de confirmar se meu Pix de abril já foi computado automaticamente.", status: "Resolvido", date: "10/04/2026" }
  ];

  // Load datasets dynamically from local storage to endure persistent workflow simulations
  let token = localStorage.getItem('sat_token') || null;
  let userProfile = localStorage.getItem('sat_profile') ? JSON.parse(localStorage.getItem('sat_profile')) : null;
  let paymentHistory = localStorage.getItem('sat_history') ? JSON.parse(localStorage.getItem('sat_history')) : DEFAULT_HISTORY;
  let ticketsList = localStorage.getItem('sat_tickets') ? JSON.parse(localStorage.getItem('sat_tickets')) : DEFAULT_TICKETS;

  // Navigation Logic
  window.navigateToView = function(viewId) {
    const currentActive = document.querySelector('.view-section.active');
    if (currentActive) {
      currentActive.classList.remove('fade-in');
      setTimeout(() => {
        currentActive.classList.remove('active');
        showAndFadeIn(viewId);
      }, 150);
    } else {
      showAndFadeIn(viewId);
    }
  };

  function showAndFadeIn(viewId) {
    const targetView = document.getElementById(viewId);
    if (targetView) {
      targetView.classList.add('active');
      // Force render layout reflow
      void targetView.offsetHeight;
      targetView.classList.add('fade-in');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Update DOM values dynamically depending on Client Session
  function renderDashboard() {
    if (!userProfile) return;

    // Fill Client Info Fields
    document.getElementById('client-name').textContent = userProfile.name;
    document.getElementById('client-login').textContent = `@${userProfile.login}`;
    document.getElementById('profile-status').textContent = userProfile.status;
    document.getElementById('profile-plan').textContent = userProfile.plan;
    document.getElementById('profile-due-date').textContent = userProfile.dueDate;
    document.getElementById('profile-connections').textContent = `${userProfile.connections} tela(s) ativa(s)`;
    document.getElementById('profile-price').textContent = `R$ ${userProfile.renewalValue.toFixed(2).replace('.', ',')}`;
    
    // Status Badge design customization
    const badge = document.getElementById('profile-status-badge');
    badge.className = "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider status-badge-active flex items-center gap-1.5";
    badge.innerHTML = `<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> ${userProfile.status}`;

    // Fill History Table
    const historyContainer = document.getElementById('payment-history-entries');
    historyContainer.innerHTML = '';
    
    paymentHistory.forEach(item => {
      const row = document.createElement('div');
      row.className = 'grid grid-cols-4 gap-2 items-center text-xs py-3 border-b border-white/5 hover:bg-white/[0.01] px-2 rounded-lg transition-colors';
      
      let statusClass = 'text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20';
      if (item.status === 'Aprovado') {
        statusClass = 'text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20';
      } else if (item.status === 'Recusado') {
        statusClass = 'text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20';
      }

      row.innerHTML = `
        <div class="font-mono text-gray-400 font-semibold">${item.id}</div>
        <div class="text-gray-300 font-medium">${item.date}</div>
        <div class="text-indigo-300 font-bold">${item.value}</div>
        <div class="flex justify-start">
          <span class="${statusClass} text-[10px] font-semibold tracking-wide">${item.status}</span>
        </div>
      `;
      historyContainer.appendChild(row);
    });

    // Populate Checkout values too
    const checkoutValText = document.getElementById('checkout-due-value');
    if (checkoutValText) {
      checkoutValText.textContent = `VALOR DE RENOVAÇÃO: R$ ${userProfile.renewalValue.toFixed(2).replace('.', ',')}`;
    }

    // Render support tickets
    renderSupportTickets();
  }

  function renderSupportTickets() {
    const listContainer = document.getElementById('support-tickets-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    
    if (ticketsList.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-8 text-gray-500 text-sm">
          Você não possui nenhum tíquete aberto no momento.
        </div>
      `;
      return;
    }

    ticketsList.forEach(ticket => {
      const card = document.createElement('div');
      card.className = 'p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-2 hover:border-white/10 transition-colors';
      
      let badgeStyle = 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
      if (ticket.status === 'Resolvido') {
        badgeStyle = 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
      }

      card.innerHTML = `
        <div class="flex justify-between items-start gap-2">
          <div>
            <span class="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mr-2">${ticket.category}</span>
            <span class="text-xs font-mono text-gray-500">${ticket.id} (${ticket.date})</span>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeStyle}">${ticket.status}</span>
        </div>
        <p class="text-sm text-gray-300 font-medium leading-relaxed mt-1">${ticket.message}</p>
        ${ticket.status === 'Resposta Pendente' ? `
          <div class="text-[11px] text-gray-400 flex items-center gap-1.5 bg-indigo-5050/10 px-3 py-1.5 rounded-lg border border-indigo-5050/20 mt-1">
            <span class="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            Aguardando atendimento. Nossos técnicos estão analisando seu canal.
          </div>
        ` : ''}
      `;
      listContainer.appendChild(card);
    });
  }

  // Handle Login submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const loginVal = document.getElementById('login-username').value.trim();
      const passVal = document.getElementById('login-password').value;
      const errorDiv = document.getElementById('login-error-message');

      errorDiv.classList.add('hidden');

      // Login check matching requested test credentials
      if (loginVal === 'cliente123' && passVal === '123456') {
        token = 'sat-token-mock-998877';
        userProfile = { ...DEFAULT_PROFILE };
        
        // Save states to persistent storage
        localStorage.setItem('sat_token', token);
        localStorage.setItem('sat_profile', JSON.stringify(userProfile));
        localStorage.setItem('sat_history', JSON.stringify(paymentHistory));
        localStorage.setItem('sat_tickets', JSON.stringify(ticketsList));

        // Clear password form
        document.getElementById('login-password').value = '';

        // Success notification and transition
        showNotification('Autenticado com sucesso! Carregando painel...', 'success');
        renderDashboard();
        
        setTimeout(() => {
          navigateToView('client-dashboard-view');
        }, 500);

      } else {
        // Erro
        errorDiv.textContent = 'Dados inválidos! Para testar, use login "cliente123" e senha "123456".';
        errorDiv.classList.remove('hidden');
        showNotification('Falha no acesso. Verifique as credenciais.', 'error');
      }
    });
  }

  // Logout action
  window.handleLogout = function() {
    token = null;
    userProfile = null;
    localStorage.removeItem('sat_token');
    localStorage.removeItem('sat_profile');
    showNotification('Sessão encerrada com sucesso.', 'info');
    navigateToView('login-view');
  };

  // Pix key copy feedback decoration interaction
  window.copyPixKey = function() {
    const pixKey = "11937244163";
    navigator.clipboard.writeText(pixKey).then(() => {
      showNotification('Chave Pix copiada com sucesso!', 'success');
      
      // Temporary change copy button visual style
      const btn = document.getElementById('copy-pix-btn');
      if (btn) {
        const origHtml = btn.innerHTML;
        btn.innerHTML = `
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          Chave Copiada!
        `;
        btn.classList.replace('bg-indigo-600', 'bg-emerald-600');
        btn.classList.replace('hover:bg-indigo-500', 'hover:bg-emerald-500');
        
        setTimeout(() => {
          btn.innerHTML = origHtml;
          btn.classList.replace('bg-emerald-600', 'bg-indigo-600');
          btn.classList.replace('hover:bg-emerald-500', 'hover:bg-indigo-500');
        }, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      showNotification('Erro ao copiar Pix automaticamente.', 'error');
    });
  };

  // Simulated confirmation of payment
  window.confirmPayment = function() {
    if (!userProfile) return;

    const refId = "SAT-" + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    
    const newPayment = {
      id: refId,
      date: formattedDate,
      value: `R$ ${userProfile.renewalValue.toFixed(2).replace('.', ',')}`,
      status: "Pendente Liberação",
      method: "Pix"
    };

    // Prepend to history array
    paymentHistory = [newPayment, ...paymentHistory];
    localStorage.setItem('sat_history', JSON.stringify(paymentHistory));

    showNotification('Recibo registrado! Envie o comprovante no WhatsApp.', 'success');
    renderDashboard();

    // Redir back to dashboard
    navigateToView('client-dashboard-view');
  };

  // Submit Support Ticket
  const supportForm = document.getElementById('support-ticket-form');
  if (supportForm) {
    supportForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const category = document.getElementById('ticket-category').value;
      const message = document.getElementById('ticket-message').value.trim();

      if (!message) {
        showNotification('Por favor, informe uma mensagem.', 'error');
        return;
      }

      const ticketId = "SUP-" + Math.floor(1000 + Math.random() * 9000);
      const now = new Date();
      const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

      const newTicket = {
        id: ticketId,
        category,
        message,
        status: "Resposta Pendente",
        date: formattedDate
      };

      ticketsList = [newTicket, ...ticketsList];
      localStorage.setItem('sat_tickets', JSON.stringify(ticketsList));

      // Clear input fields
      document.getElementById('ticket-message').value = '';

      showNotification('Tíquete criado com sucesso! Analisaremos seu login.', 'success');
      renderSupportTickets();
      
      setTimeout(() => {
        navigateToView('client-dashboard-view');
      }, 500);
    });
  }

  // Boot Routing Check: Stay signed-in if local token exists, or start at homepage
  if (token && userProfile) {
    renderDashboard();
    navigateToView('client-dashboard-view');
  } else {
    navigateToView('home-view');
  }

});
