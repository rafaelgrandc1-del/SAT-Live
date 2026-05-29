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

  // Initial datasets configurations
  const DEFAULT_HISTORY = [
    { id: "SAT-7731", date: "10/05/2026", value: "R$ 30,00", status: "Aprovado", method: "Pix" },
    { id: "SAT-6523", date: "10/04/2026", value: "R$ 30,00", status: "Aprovado", method: "Pix" },
    { id: "SAT-5109", date: "10/03/2026", value: "R$ 30,00", status: "Aprovado", method: "Pix" }
  ];

  const DEFAULT_TICKETS = [
    { id: "SUP-1042", category: "Financeiro", message: "Gostaria de confirmar se meu Pix de abril já foi computado automaticamente.", status: "Resolvido", date: "10/04/2026" }
  ];

  // Initialize offline Mock Multi-User database inside LocalStorage
  let usersList = [];
  try {
    const storedUsers = localStorage.getItem('sat_users');
    if (storedUsers) {
      usersList = JSON.parse(storedUsers);
    }
  } catch (e) {
    console.error("DB Parse error, resetting to defaults...", e);
  }

  if (!usersList || !Array.isArray(usersList) || usersList.length === 0) {
    usersList = [
      {
        login: "cliente123",
        password: "123456",
        profile: {
          name: "Cliente Teste",
          login: "cliente123",
          status: "Ativo",
          plan: "Plano Mensal",
          dueDate: "10/06/2026",
          connections: 1,
          renewalValue: 30.00
        },
        history: DEFAULT_HISTORY,
        tickets: DEFAULT_TICKETS
      }
    ];
    localStorage.setItem('sat_users', JSON.stringify(usersList));
  }

  // Active session parameters
  let token = localStorage.getItem('sat_token') || null;
  let userProfile = null;
  let paymentHistory = [];
  let ticketsList = [];

  // If there's an active token, parse current user sessions from multi-user index
  if (token) {
    const matchedUser = usersList.find(u => u.login === token);
    if (matchedUser) {
      userProfile = matchedUser.profile;
      paymentHistory = matchedUser.history || [];
      ticketsList = matchedUser.tickets || [];
    } else {
      token = null;
      localStorage.removeItem('sat_token');
    }
  }

  // Save changes securely back into Mock DB
  function saveUserDataSync() {
    if (!token) return;
    const users = JSON.parse(localStorage.getItem('sat_users')) || usersList;
    const idx = users.findIndex(u => u.login === token);
    if (idx !== -1) {
      users[idx].profile = userProfile;
      users[idx].history = paymentHistory;
      users[idx].tickets = ticketsList;
      localStorage.setItem('sat_users', JSON.stringify(users));
    }
    // Also update current active session fast storage
    localStorage.setItem('sat_profile', JSON.stringify(userProfile));
    localStorage.setItem('sat_history', JSON.stringify(paymentHistory));
    localStorage.setItem('sat_tickets', JSON.stringify(ticketsList));
  }

  // Dynamic backend setting configurations
  let SYSTEM_WHATSAPP = "5511937244163";
  let SYSTEM_PIX_KEY = "11937244163";

  // Fetch true server configurations
  fetch('/api/config')
    .then(res => res.json())
    .then(config => {
      if (config.supportWhatsapp) {
        SYSTEM_WHATSAPP = config.supportWhatsapp.replace(/[^0-9]/g, '');
        console.log(`[Config Sync] Support WhatsApp synchronized to ${SYSTEM_WHATSAPP}`);
      }
      if (config.pixKey) {
        SYSTEM_PIX_KEY = config.pixKey;
        console.log(`[Config Sync] PIX Key synchronized to ${SYSTEM_PIX_KEY}`);
        
        // Dynamically insert synchronized Pix key values into label elements if found
        const pixLabelEl = document.getElementById('pix-key-label-value');
        if (pixLabelEl) {
          pixLabelEl.textContent = SYSTEM_PIX_KEY;
        }
      }
      applyDynamicConfigsToDOM();
    })
    .catch(err => console.warn('Using default fallback configs:', err));

  function applyDynamicConfigsToDOM() {
    // Dynamically update support buttons href to SYSTEM_WHATSAPP!
    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
      try {
        const origUrl = new URL(link.href);
        const textParam = origUrl.searchParams.get('text') || '';
        link.href = `https://wa.me/${SYSTEM_WHATSAPP}?text=${encodeURIComponent(textParam)}`;
      } catch (e) {
        if (link.href.includes('wa.me/5511937244163')) {
          link.href = link.href.replace('5511937244163', SYSTEM_WHATSAPP);
        }
      }
    });
  }

  // Navigation controller
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
      void targetView.offsetHeight; // force reflow
      targetView.classList.add('fade-in');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Render Dashboard data
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
    
    if (userProfile.status === "Aguardando Ativação") {
      badge.innerHTML = `<span class="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span> ${userProfile.status}`;
    } else if (userProfile.status.includes("Teste")) {
      badge.className = "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-950 text-purple-200 border border-purple-500/25 flex items-center gap-1.5";
      badge.innerHTML = `<span class="h-2 w-2 rounded-full bg-purple-400 animate-bounce"></span> ${userProfile.status}`;
    } else {
      badge.innerHTML = `<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> ${userProfile.status}`;
    }

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

    // Populate checkout selector with their current preference
    let curPlan = "Mensal";
    if (userProfile.plan.includes("Trimestral")) curPlan = "Trimestral";
    if (userProfile.plan.includes("Anual")) curPlan = "Anual";
    
    selectCheckoutPlan(curPlan);
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
            <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mr-2">${ticket.category}</span>
            <span class="text-[10px] font-mono text-gray-500">${ticket.id} (${ticket.date})</span>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeStyle}">${ticket.status}</span>
        </div>
        <p class="text-xs text-gray-300 font-medium leading-relaxed mt-1">${ticket.message}</p>
        ${ticket.status === 'Resposta Pendente' ? `
          <div class="text-[10px] text-gray-400 flex items-center gap-1.5 bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10 mt-1">
            <span class="h-1 w-1 rounded-full bg-indigo-400 animate-pulse"></span>
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
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const loginVal = document.getElementById('login-username').value.trim().toLowerCase();
      const passVal = document.getElementById('login-password').value;
      const errorDiv = document.getElementById('login-error-message');

      errorDiv.classList.add('hidden');

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: loginVal, password: passVal })
        });
        
        if (response.ok) {
          const resData = await response.json();
          token = resData.token;
          userProfile = resData.profile;
          paymentHistory = resData.history || [];
          ticketsList = [];
          
          localStorage.setItem('sat_token', token);
          localStorage.setItem('sat_profile', JSON.stringify(userProfile));
          localStorage.setItem('sat_history', JSON.stringify(paymentHistory));
          localStorage.setItem('sat_tickets', JSON.stringify(ticketsList));

          document.getElementById('login-password').value = '';
          showNotification('Autenticado com sucesso! Carregando painel...', 'success');
          renderDashboard();
          
          setTimeout(() => {
            navigateToView('client-dashboard-view');
          }, 500);
          return;
        } else {
          const errData = await response.json();
          if (errData && errData.error) {
            // If the user tried real authentication and the backend explicitly details invalid credentials, show that!
            errorDiv.textContent = errData.error;
            errorDiv.classList.remove('hidden');
            showNotification(errData.error, 'error');
            return;
          }
        }
      } catch (err) {
        console.warn('Backend login auth skipped, using dynamic local auth.', err);
      }

      // Check credentials from dynamic Mock multi-user array as fallback
      const dbUsers = JSON.parse(localStorage.getItem('sat_users')) || usersList;
      const matched = dbUsers.find(u => u.login === loginVal && u.password === passVal);

      if (matched) {
        token = matched.login;
        userProfile = matched.profile;
        paymentHistory = matched.history || [];
        ticketsList = matched.tickets || [];
        
        // Save token state
        localStorage.setItem('sat_token', token);
        localStorage.setItem('sat_profile', JSON.stringify(userProfile));
        localStorage.setItem('sat_history', JSON.stringify(paymentHistory));
        localStorage.setItem('sat_tickets', JSON.stringify(ticketsList));

        // Clear password form
        document.getElementById('login-password').value = '';

        showNotification('Autenticado com sucesso! Carregando painel...', 'success');
        renderDashboard();
        
        setTimeout(() => {
          navigateToView('client-dashboard-view');
        }, 500);

      } else {
        errorDiv.textContent = 'Dados inválidos! Registre-se ou utilize credenciais corretas.';
        errorDiv.classList.remove('hidden');
        showNotification('Falha no acesso. Verifique as credenciais.', 'error');
      }
    });
  }

  // Handle Register Form Submission
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameVal = document.getElementById('register-name').value.trim();
      const userVal = document.getElementById('register-username').value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const passVal = document.getElementById('register-password').value;
      const confirmVal = document.getElementById('register-confirm-password').value;
      const errorDiv = document.getElementById('register-error-message');

      errorDiv.classList.add('hidden');

      if (userVal.length < 3) {
        errorDiv.textContent = 'O login desejado deve possuir no mínimo 3 caracteres alfanuméricos.';
        errorDiv.classList.remove('hidden');
        showNotification('Login muito curto.', 'error');
        return;
      }

      if (passVal.length < 4) {
        errorDiv.textContent = 'A senha deve possuir pelo menos 4 caracteres.';
        errorDiv.classList.remove('hidden');
        showNotification('Senha muito fraca.', 'error');
        return;
      }

      if (passVal !== confirmVal) {
        errorDiv.textContent = 'As senhas informadas não coincidem. Repita a digitação.';
        errorDiv.classList.remove('hidden');
        showNotification('Senhas não coincidem.', 'error');
        return;
      }

      // Check which plan was selected
      const radioChecked = document.querySelector('input[name="signup-plan-choice"]:checked');
      const planChoice = radioChecked ? radioChecked.value : "Mensal";

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nameVal, login: userVal, password: passVal, plan: planChoice })
        });

        if (response.ok) {
          const resData = await response.json();
          token = resData.token;
          userProfile = resData.profile;
          paymentHistory = resData.history || [];
          ticketsList = [];

          localStorage.setItem('sat_token', token);
          localStorage.setItem('sat_profile', JSON.stringify(userProfile));
          localStorage.setItem('sat_history', JSON.stringify(paymentHistory));
          localStorage.setItem('sat_tickets', JSON.stringify(ticketsList));

          // Sync localStorage database pool as well
          const dbUsers = JSON.parse(localStorage.getItem('sat_users')) || usersList;
          dbUsers.push({
            login: userVal,
            password: passVal,
            profile: userProfile,
            history: paymentHistory,
            tickets: ticketsList
          });
          localStorage.setItem('sat_users', JSON.stringify(dbUsers));

          showNotification('Conta cadastrada com sucesso! Bem-vindo(a).', 'success');
          renderDashboard();

          // Clear input fields
          document.getElementById('register-name').value = '';
          document.getElementById('register-username').value = '';
          document.getElementById('register-password').value = '';
          document.getElementById('register-confirm-password').value = '';

          setTimeout(() => {
            navigateToView('client-dashboard-view');
          }, 500);
          return;
        } else {
          const errData = await response.json();
          if (errData && errData.error) {
            errorDiv.textContent = errData.error;
            errorDiv.classList.remove('hidden');
            showNotification(errData.error, 'error');
            return;
          }
        }
      } catch (err) {
        console.warn('Backend signup error occurring, falling back to client simulation.', err);
      }

      // FALLBACK COMPATIBLE LOCAL CADASTRO
      const dbUsers = JSON.parse(localStorage.getItem('sat_users')) || usersList;
      if (dbUsers.some(u => u.login === userVal)) {
        errorDiv.textContent = 'Este login de usuário já está cadastrado no sistema.';
        errorDiv.classList.remove('hidden');
        showNotification('Login indisponível.', 'error');
        return;
      }

      let pTitle = "Plano Mensal";
      let pValue = 30.00;
      let days = 30;

      if (planChoice === "Trimestral") {
        pTitle = "Plano Trimestral";
        pValue = 80.00;
        days = 90;
      } else if (planChoice === "Anual") {
        pTitle = "Plano Anual";
        pValue = 250.00;
        days = 365;
      }

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + days);
      const expiryStr = `${String(expiry.getDate()).padStart(2, '0')}/${String(expiry.getMonth() + 1).padStart(2, '0')}/${expiry.getFullYear()}`;

      const newClient = {
        login: userVal,
        password: passVal,
        profile: {
          name: nameVal,
          login: userVal,
          status: "Aguardando Ativação",
          plan: pTitle,
          dueDate: expiryStr,
          connections: 1,
          renewalValue: pValue
        },
        history: [
          { 
            id: "SAT-" + Math.floor(1000 + Math.random() * 9000), 
            date: `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`, 
            value: `R$ ${pValue.toFixed(2).replace('.', ',')}`, 
            status: "Pendente Liberação", 
            method: "Cadastro" 
          }
        ],
        tickets: []
      };

      dbUsers.push(newClient);
      localStorage.setItem('sat_users', JSON.stringify(dbUsers));

      token = userVal;
      userProfile = newClient.profile;
      paymentHistory = newClient.history;
      ticketsList = newClient.tickets;

      localStorage.setItem('sat_token', token);
      localStorage.setItem('sat_profile', JSON.stringify(userProfile));
      localStorage.setItem('sat_history', JSON.stringify(paymentHistory));
      localStorage.setItem('sat_tickets', JSON.stringify(ticketsList));

      showNotification('Conta cadastrada com sucesso! Bem-vindo(a).', 'success');
      renderDashboard();

      document.getElementById('register-name').value = '';
      document.getElementById('register-username').value = '';
      document.getElementById('register-password').value = '';
      document.getElementById('register-confirm-password').value = '';

      setTimeout(() => {
        navigateToView('client-dashboard-view');
      }, 500);
    });
  }

  // Handle Free Trial Activation Form
  const trialForm = document.getElementById('trial-form');
  if (trialForm) {
    trialForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameVal = document.getElementById('trial-fullname').value.trim();
      if (!nameVal) return;

      let trialUser = null;
      let trialPass = null;
      let trialProfile = null;

      try {
        const response = await fetch('/api/auth/trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nameVal })
        });

        if (response.ok) {
          const resData = await response.json();
          trialUser = resData.trialUser;
          trialPass = resData.trialPass;
          
          trialProfile = {
            login: trialUser,
            password: trialPass,
            profile: resData.profile,
            history: [],
            tickets: []
          };
        }
      } catch (err) {
        console.warn('Backend trial generation skipped, using dynamic local generator.', err);
      }

      // Fallback local trial generation
      if (!trialUser) {
        const randomAccess = Math.floor(1000 + Math.random() * 9000);
        trialUser = `teste_${randomAccess}`;
        trialPass = Math.floor(100000 + Math.random() * 900000).toString();

        trialProfile = {
          login: trialUser,
          password: trialPass,
          profile: {
            name: nameVal,
            login: trialUser,
            status: "Teste Ativo",
            plan: "Teste de 2 Horas",
            dueDate: "Expira em 120min",
            connections: 1,
            renewalValue: 30.00
          },
          history: [],
          tickets: []
        };
      }

      // Populate results credentials display info
      document.getElementById('trial-res-username').textContent = trialUser;
      document.getElementById('trial-res-password').textContent = trialPass;

      // Animate card visual toggle
      document.getElementById('trial-generator-form-container').classList.add('hidden');
      document.getElementById('trial-success-display').classList.remove('hidden');

      // Append into dynamic database pool
      const dbUsers = JSON.parse(localStorage.getItem('sat_users')) || usersList;
      dbUsers.push(trialProfile);
      localStorage.setItem('sat_users', JSON.stringify(dbUsers));

      // Set helper action button
      const dashBtn = document.getElementById('trial-dashboard-btn');
      if (dashBtn) {
        dashBtn.onclick = () => {
          token = trialUser;
          userProfile = trialProfile.profile;
          paymentHistory = [];
          ticketsList = [];

          localStorage.setItem('sat_token', token);
          localStorage.setItem('sat_profile', JSON.stringify(userProfile));
          localStorage.setItem('sat_history', JSON.stringify(paymentHistory));
          localStorage.setItem('sat_tickets', JSON.stringify(ticketsList));

          showNotification('Login experimental ativado com sucesso!', 'success');
          renderDashboard();

          // Reset parameters silently
          document.getElementById('trial-fullname').value = '';
          document.getElementById('trial-generator-form-container').classList.remove('hidden');
          document.getElementById('trial-success-display').classList.add('hidden');

          navigateToView('client-dashboard-view');
        };
      }

      showNotification('Sinal de teste gerado instantaneamente!', 'success');
    });
  }

  // Copy trial credentials helper
  window.copyTrialCredentials = function() {
    const user = document.getElementById('trial-res-username').textContent;
    const pass = document.getElementById('trial-res-password').textContent;
    const text = `Acesso SAT Live de 2 Horas:\nUsuário: ${user}\nSenha: ${pass}\nSite do cliente: https://rafaelgrandc1-del.github.io/SAT-Live/`;
    
    navigator.clipboard.writeText(text).then(() => {
      showNotification('Credenciais copiadas via Área de Transferência.', 'success');
    }).catch(err => {
      showNotification('Erro ao copiar dados.', 'error');
    });
  };

  // Interactive checkout features
  let selectedCheckoutPlan = "Mensal";
  let activeCheckoutTab = "pix";

  window.selectCheckoutPlan = function(plan) {
    selectedCheckoutPlan = plan;

    const plans = ["Mensal", "Trimestral", "Anual"];
    plans.forEach(p => {
      const btn = document.getElementById(`checkout-plan-choice-${p}`);
      if (btn) {
        if (p === plan) {
          btn.className = "p-2.5 rounded-xl border border-indigo-500 bg-indigo-500/10 text-center transition-all focus:outline-none select-none";
        } else {
          btn.className = "p-2.5 rounded-xl border border-white/5 bg-[#090c15] text-center hover:bg-white/[0.02] transition-all focus:outline-none select-none";
        }
      }
    });

    // Update pricing text labels
    let labelVal = "R$ 30,00";
    if (plan === "Trimestral") labelVal = "R$ 80,00";
    if (plan === "Anual") labelVal = "R$ 250,00";

    const labelPix = document.getElementById('checkout-due-value');
    if (labelPix) labelPix.textContent = `VALOR DE RENOVAÇÃO: ${labelVal}`;

    const labelCard = document.getElementById('checkout-card-due-value');
    if (labelCard) labelCard.textContent = `VALOR TOTAL: ${labelVal}`;

    const waLink = document.getElementById('wa-pix-link');
    if (waLink) {
      waLink.href = `https://wa.me/${SYSTEM_WHATSAPP}?text=Olá,%20acabei%20de%20realizar%20o%20Pix%20de%20${encodeURIComponent(labelVal)}%20da%20minha%20assinatura%20SAT%20Live%20no%20plano%20${plan}.`;
    }
  };

  window.switchCheckoutTab = function(tab) {
    activeCheckoutTab = tab;

    const divPix = document.getElementById("checkout-tab-pix");
    const divCard = document.getElementById("checkout-tab-card");
    const btnPix = document.getElementById("checkout-tab-btn-pix");
    const btnCard = document.getElementById("checkout-tab-btn-card");

    if (tab === "pix") {
      divPix.classList.remove("hidden");
      divCard.classList.add("hidden");

      btnPix.className = "flex-1 text-center py-2.5 text-xs font-bold rounded-lg text-white bg-white/5 transition-all focus:outline-none";
      btnCard.className = "flex-1 text-gray-400 hover:text-indigo-300 text-center py-2.5 text-xs font-bold rounded-lg transition-all focus:outline-none flex items-center justify-center gap-1";
    } else {
      divPix.classList.add("hidden");
      divCard.classList.remove("hidden");

      btnPix.className = "flex-1 text-gray-400 hover:text-white text-center py-2.5 text-xs font-bold rounded-lg transition-all focus:outline-none";
      btnCard.className = "flex-1 text-white bg-white/5 text-center py-2.5 text-xs font-bold rounded-lg transition-all focus:outline-none flex items-center justify-center gap-1";
    }
  };

  // Mercado Pago simulated credit card transaction flow submit handler
  const cardForm = document.getElementById('card-payment-form');
  if (cardForm) {
    cardForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!userProfile) {
        showNotification('Inicie sessão para poder concluir pagamentos.', 'error');
        return;
      }

      const subBtn = document.getElementById('card-submit-btn');
      const spinner = document.getElementById('card-spinner');
      const textSpan = document.getElementById('card-submit-text');

      // Lock buttons during loading simulation
      subBtn.disabled = true;
      spinner.classList.remove('hidden');
      textSpan.textContent = 'Processando com Mercado Pago...';

      setTimeout(() => {
        // Compute new dueDate based on selectedCheckoutPlan
        let planTitle = "Plano Mensal";
        let cost = 30.00;
        let days = 30;

        if (selectedCheckoutPlan === "Trimestral") {
          planTitle = "Plano Trimestral";
          cost = 80.00;
          days = 90;
        } else if (selectedCheckoutPlan === "Anual") {
          planTitle = "Plano Anual";
          cost = 250.00;
          days = 365;
        }

        // Calculate and extend duedate
        const currentDue = new Date();
        currentDue.setDate(currentDue.getDate() + days);
        const formattedDate = `${String(currentDue.getDate()).padStart(2, '0')}/${String(currentDue.getMonth() + 1).padStart(2, '0')}/${currentDue.getFullYear()}`;

        // Create transaction history row
        const refId = "SAT-" + Math.floor(1000 + Math.random() * 9000);
        const paymentDate = `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
        
        const cardPayment = {
          id: refId,
          date: paymentDate,
          value: `R$ ${cost.toFixed(2).replace('.', ',')}`,
          status: "Aprovado",
          method: "Cartão - MP"
        };

        // Update active profile model fields
        userProfile.status = "Ativo";
        userProfile.plan = planTitle;
        userProfile.dueDate = formattedDate;
        userProfile.renewalValue = cost;

        paymentHistory = [cardPayment, ...paymentHistory];
        
        // Save dynamically across mock dynamic database list
        saveUserDataSync();

        // Notify customer
        showNotification('Aprovado! Plano atualizado via Mercado Pago Sandbox.', 'success');
        renderDashboard();

        // Unlock buttons
        subBtn.disabled = false;
        spinner.classList.add('hidden');
        textSpan.textContent = 'Pagar com Crédito';

        // Clear input credentials values securely
        document.getElementById('card-holder').value = '';
        document.getElementById('card-number').value = '';
        document.getElementById('card-expiry').value = '';
        document.getElementById('card-cvv').value = '';

        // Redirect safely
        navigateToView('client-dashboard-view');
      }, 2000);
    });
  }

  // Logout action
  window.handleLogout = function() {
    token = null;
    userProfile = null;
    paymentHistory = [];
    ticketsList = [];
    
    // Clear dynamic session values
    localStorage.removeItem('sat_token');
    localStorage.removeItem('sat_profile');
    localStorage.removeItem('sat_history');
    localStorage.removeItem('sat_tickets');

    showNotification('Sessão de usuário finalizada.', 'info');
    navigateToView('login-view');
  };

  // Pix key copy feedback decoration interaction
  window.copyPixKey = function() {
    const pixKey = SYSTEM_PIX_KEY;
    navigator.clipboard.writeText(pixKey).then(() => {
      showNotification('Chave Pix transferível copiada!', 'success');
      
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
      showNotification('Erro ao copiar chave automaticamente.', 'error');
    });
  };

  // Simulated Pix receipt registrar
  window.confirmPayment = function() {
    if (!userProfile) return;

    let cost = userProfile.renewalValue;
    let plan = userProfile.plan;

    if (selectedCheckoutPlan === "Trimestral") {
      cost = 80.00;
      plan = "Plano Trimestral";
    } else if (selectedCheckoutPlan === "Anual") {
      cost = 250.00;
      plan = "Plano Anual";
    }

    const refId = "SAT-" + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    
    const newPayment = {
      id: refId,
      date: formattedDate,
      value: `R$ ${cost.toFixed(2).replace('.', ',')}`,
      status: "Pendente Liberação",
      method: "Pix"
    };

    paymentHistory = [newPayment, ...paymentHistory];
    
    // Save in localStorage DB
    saveUserDataSync();

    showNotification('Recibo cadastrado! Envie o comprovante no WhatsApp.', 'success');
    renderDashboard();

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
        showNotification('Informe os detalhes do ocorrido por mensagem.', 'error');
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
      
      // Save changes persistently
      saveUserDataSync();

      // Clear input fields
      document.getElementById('ticket-message').value = '';

      showNotification('Chamado de suporte aberto com sucesso! Nossos técnicos irão verificar.', 'success');
      renderSupportTickets();
      
      setTimeout(() => {
        navigateToView('client-dashboard-view');
      }, 500);
    });
  }

  // Boot Setup & Routing Check
  if (token && userProfile) {
    renderDashboard();
    navigateToView('client-dashboard-view');
  } else {
    navigateToView('home-view');
  }

});
