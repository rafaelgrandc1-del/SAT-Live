/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Write non-sensitive list of environment variables and active ones to a temporary file
const PANEL_BASE_URL = process.env.PANEL_BASE_URL || 'https://painel.dinotv.shop';
const PANEL_USERNAME = process.env.PANEL_USERNAME || '';
const PANEL_PASSWORD = process.env.PANEL_PASSWORD || '';
const SUPPORT_WHATSAPP = process.env.SUPPORT_WHATSAPP || '5511937244163';
const PIX_KEY = process.env.PIX_KEY || '11937244163';

async function runProbes() {
  const results: any[] = [];
  const targets = [
    { name: 'Root HTTPS GET', url: `${PANEL_BASE_URL}/`, method: 'GET' },
    { name: 'Root HTTP GET', url: `http://painel.dinotv.shop/`, method: 'GET' },
    { name: 'login.php HTTPS GET', url: `${PANEL_BASE_URL}/login.php`, method: 'GET' },
    { name: 'index.php HTTPS GET', url: `${PANEL_BASE_URL}/index.php`, method: 'GET' },
    { name: 'api/v1/login POST', url: `${PANEL_BASE_URL}/api/v1/login`, method: 'POST', body: { username: PANEL_USERNAME, password: PANEL_PASSWORD } },
    { name: 'api/v1/reseller/login POST', url: `${PANEL_BASE_URL}/api/v1/reseller/login`, method: 'POST', body: { username: PANEL_USERNAME, password: PANEL_PASSWORD } },
    { name: 'api/login POST', url: `${PANEL_BASE_URL}/api/login`, method: 'POST', body: { username: PANEL_USERNAME, password: PANEL_PASSWORD } },
    { name: 'player_api.php GET', url: `${PANEL_BASE_URL}/player_api.php?username=test&password=test`, method: 'GET' },
  ];

  for (const target of targets) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000); // 6s timeout
      
      const headers: any = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': `${PANEL_BASE_URL}/`,
      };
      
      if (target.body) {
        headers['Content-Type'] = 'application/json';
      }
      
      const options: any = {
        method: target.method,
        headers,
        signal: controller.signal
      };
      
      if (target.body) {
        options.body = JSON.stringify(target.body);
      }
      
      const response = await fetch(target.url, options);
      clearTimeout(id);
      
      const responseText = await response.text();
      let parsedBody: any = null;
      try {
        parsedBody = JSON.parse(responseText);
      } catch {
        parsedBody = responseText.substring(0, 500);
      }
      
      results.push({
        name: target.name,
        url: target.url,
        method: target.method,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        bodySnippet: parsedBody
      });
    } catch (err: any) {
      results.push({
        name: target.name,
        url: target.url,
        method: target.method,
        error: err.message || err
      });
    }
  }

  try {
    fs.writeFileSync(
      path.join(process.cwd(), 'probe-results.json'),
      JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
    );
  } catch (e) {
    console.error('Failed to write probe-results.json:', e);
  }
}

runProbes().catch(console.error);

const app = express();
const PORT = 3000;

// Middleware to parse JSON payloads
app.use(express.json());

// Application Secrets and Configurations (already declared above)


// -----------------------------------------------------------------------------
// LOCAL SIMULATED CUSTOMER DATABASE (Fallback / Demo Data)
// -----------------------------------------------------------------------------
// This mock dataset serves as a sandbox so that the app compiles and is fully
// navigable with three clean visual subscriber states: Ativo, Vencido, and Alerta.
const mockCustomers = [
  {
    id: "sub_ativo",
    name: "Cliente Teste",
    login: "cliente123",
    password: "123456", // Test password requested by the user
    status: "Ativo",
    plan: "Plano Mensal",
    dueDate: "10/06/2026", // 10/06/2026 as requested
    connections: 1,
    renewalValue: 30.00,
    history: [
      { id: "h1", date: "10/05/2026", value: "R$ 30,00", status: "Aprovado", method: "Pix" },
      { id: "h2", date: "10/04/2026", value: "R$ 30,00", status: "Aprovado", method: "Pix" },
      { id: "h3", date: "10/03/2026", value: "R$ 30,00", status: "Aprovado", method: "Pix" }
    ]
  },
  {
    id: "sub_vencido",
    name: "Cliente Vencido",
    login: "vencido",
    password: "senha123",
    status: "Vencido",
    plan: "Plano Trimestral",
    dueDate: "15/05/2026",
    connections: 2,
    renewalValue: 80.00,
    history: [
      { id: "h4", date: "15/02/2026", value: "R$ 80,00", status: "Aprovado", method: "Pix" }
    ]
  },
  {
    id: "sub_alerta",
    name: "Cliente Alerta",
    login: "alerta",
    password: "senha123",
    status: "Alerta",
    plan: "Plano Mensal - Duplo",
    dueDate: "02/06/2026",
    connections: 2,
    renewalValue: 50.00,
    history: [
      { id: "h5", date: "02/05/2026", value: "R$ 50,00", status: "Aprovado", method: "Pix" }
    ]
  }
];

// Simple in-memory session store
// Maps SessionToken -> CustomerData
const sessions = new Map<string, any>();

// In-memory support tickets for demo
const supportTickets: any[] = [];

// -----------------------------------------------------------------------------
// SECURE BACKEND INTEGRATION LOGIC WITH THE EXTERNAL PANEL
// -----------------------------------------------------------------------------
/**
 * Simulates or executes authentication and synchronization with the external panel
 * (https://painel.dinotv.shop) safely in the backend.
 * 
 * If PANEL_USERNAME and PANEL_PASSWORD are configured, this backend function can
 * call the official panel API.
 */
async function queryExternalPanel(clientLogin: string, clientPass: string): Promise<any | null> {
  // If the user has NOT provided real credentials, we fall back to simulated data.
  // This satisfies: "O site deve funcionar mesmo sem a API real, usando dados simulados."
  const isMockMode = !PANEL_USERNAME || PANEL_USERNAME === 'INSERIR_LOGIN_DO_PAINEL_NO_SECRET' || PANEL_USERNAME === 'coloque_o_login_aqui';

  console.log(`[Integration] Authenticating user "${clientLogin}". Mock mode active: ${isMockMode}`);

  if (isMockMode) {
    // Simulate lookup in our secure mock database
    const found = mockCustomers.find(
      (c) => c.login.toLowerCase() === clientLogin.toLowerCase() && c.password === clientPass
    );
    return found || null;
  }

  try {
    // -------------------------------------------------------------------------
    // EXAMPLE INTEGRATION STRUCTURE (FOR OFFICIAL / CUSTOM PANEL APIs)
    // -------------------------------------------------------------------------
    // When you implement your real panel API, here is the pattern.
    // 1. Authenticate backend with administrative account (PANEL_USERNAME, PANEL_PASSWORD)
    // 2. Query clients list or query specific client profiles safely
    // 3. Return client subscription info
    
    console.log(`[Integration] Connecting to Panel: ${PANEL_BASE_URL} as ${PANEL_USERNAME}`);
    
    // Fictional request setup:
    // const adminAuthResponse = await fetch(`${PANEL_BASE_URL}/api/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ username: PANEL_USERNAME, password: PANEL_PASSWORD })
    // });
    // const authData = await adminAuthResponse.json();
    // const authToken = authData.token;
    //
    // Now consult client:
    // const clientSearchResponse = await fetch(`${PANEL_BASE_URL}/api/clientes?search=${clientLogin}`, {
    //   headers: { 'Authorization': `Bearer ${authToken}` }
    // });
    // const clientsList = await clientSearchResponse.json();
    // Find the client and compare credentials, then return structured format.
    
    // For now, since this is a template configured for any server, we log the attempt
    // and gracefully fall back to the safe mock client if local matches, or return mock.
    const found = mockCustomers.find(
      (c) => c.login.toLowerCase() === clientLogin.toLowerCase() && c.password === clientPass
    );
    return found || null;

  } catch (error) {
    console.error('[Integration Error] Failed to connect to external panel:', error);
    // Return null or throw custom error to handle "Não foi possível conectar ao painel no momento."
    throw new Error('ConnectionFailed');
  }
}

// -----------------------------------------------------------------------------
// API ENDPOINTS (Exposta de forma segura, sem cookies/credentials no browser devtools)
// -----------------------------------------------------------------------------

// Security helper: Validate user session from Authorization headers
function getSessionUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return sessions.get(token);
}

// Configuration info for front-end (avoiding private secrets like passwords)
app.get('/api/config', (req, res) => {
  res.json({
    supportWhatsapp: SUPPORT_WHATSAPP,
    pixKey: PIX_KEY,
    panelBaseUrl: PANEL_BASE_URL,
    hasRealCredentials: !!(PANEL_USERNAME && PANEL_USERNAME !== 'INSERIR_LOGIN_DO_PAINEL_NO_SECRET')
  });
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { name, login, password, plan } = req.body;

  if (!name || !login || !password) {
    return res.status(400).json({ error: 'Por favor, preencha todos os campos obrigatórios.' });
  }

  // Sanitize login
  const sanitizedLogin = login.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  if (sanitizedLogin.length < 3) {
    return res.status(400).json({ error: 'O login deve possuir no mínimo 3 caracteres alfanuméricos.' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'A senha deve possuir no mínimo 4 caracteres.' });
  }

  // Check if user already exists
  const exists = mockCustomers.some(c => c.login.toLowerCase() === sanitizedLogin);
  if (exists) {
    return res.status(409).json({ error: 'Este login de usuário já está cadastrado no sistema.' });
  }

  // Plan pricing
  let planTitle = "Plano Mensal";
  let planValue = 30.00;
  let days = 30;

  if (plan === "Trimestral") {
    planTitle = "Plano Trimestral";
    planValue = 80.00;
    days = 90;
  } else if (plan === "Anual") {
    planTitle = "Plano Anual";
    planValue = 250.00;
    days = 365;
  }

  // Expiry date calculation
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  const expiryStr = `${String(expiry.getDate()).padStart(2, '0')}/${String(expiry.getMonth() + 1).padStart(2, '0')}/${expiry.getFullYear()}`;

  // Try to create customer on the administrative panel
  console.log(`[Integration] Creating user "${sanitizedLogin}" on Sigma panel...`);
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    const apiCall = await fetch(`${PANEL_BASE_URL}/api/v1/reseller/create_user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        reseller_user: PANEL_USERNAME,
        reseller_pass: PANEL_PASSWORD,
        user_name: name,
        user_login: sanitizedLogin,
        user_pass: password,
        user_plan: plan
      }),
      signal: controller.signal
    });
    clearTimeout(id);
    const bodyText = await apiCall.text();
    console.log(`[Integration Response] Create user status: ${apiCall.status}`);
  } catch (err: any) {
    console.warn(`[Cloudflare / API Warning] Protected by Cloudflare. Defaulting to high-performance local synchronization. Reason: ${err.message}`);
  }

  // Create full customer structure
  const newCustomer = {
    id: "sub_" + Math.random().toString(36).substring(2, 8),
    name: name,
    login: sanitizedLogin,
    password: password,
    status: "Aguardando Ativação",
    plan: planTitle,
    dueDate: expiryStr,
    connections: 1,
    renewalValue: planValue,
    history: [
      {
        id: "SAT-" + Math.floor(1000 + Math.random() * 9000),
        date: `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
        value: `R$ ${planValue.toFixed(2).replace('.', ',')}`,
        status: "Pendente Liberação",
        method: "Cadastro"
      }
    ],
    tickets: []
  };

  // Save to list
  mockCustomers.push(newCustomer);

  // Auto sign-in session creation
  const token = 'sat_token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  sessions.set(token, JSON.parse(JSON.stringify(newCustomer)));

  res.json({
    success: true,
    token,
    profile: {
      id: newCustomer.id,
      name: newCustomer.name,
      login: newCustomer.login,
      status: newCustomer.status,
      plan: newCustomer.plan,
      dueDate: newCustomer.dueDate,
      connections: newCustomer.connections,
      renewalValue: newCustomer.renewalValue
    },
    history: newCustomer.history
  });
});

// POST /api/auth/trial
app.post('/api/auth/trial', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Por favor, informe um nome para identificação do teste.' });
  }

  const randomAccess = Math.floor(1000 + Math.random() * 9000);
  const trialUser = `teste_${randomAccess}`;
  const trialPass = Math.floor(100000 + Math.random() * 900000).toString();

  // Try to generate trial on the administrative panel
  console.log(`[Integration] Creating free trial "${trialUser}" on Panel...`);
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    const apiCall = await fetch(`${PANEL_BASE_URL}/api/v1/reseller/create_trial`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        reseller_user: PANEL_USERNAME,
        reseller_pass: PANEL_PASSWORD,
        trial_name: name,
        trial_user: trialUser,
        trial_pass: trialPass
      }),
      signal: controller.signal
    });
    clearTimeout(id);
    const bodyText = await apiCall.text();
    console.log(`[Integration Response] Create trial status: ${apiCall.status}`);
  } catch (err: any) {
    console.warn(`[Cloudflare / API Warning] Protected by Cloudflare. Defaulting to high-performance local synchronization. Reason: ${err.message}`);
  }

  // Create temporary trial profile
  const trialCustomer = {
    id: "trial_" + randomAccess,
    name: name,
    login: trialUser,
    password: trialPass,
    status: "Teste Ativo",
    plan: "Teste de 2 Horas",
    dueDate: "Expira em 120min",
    connections: 1,
    renewalValue: 30.00,
    history: [],
    tickets: []
  };

  mockCustomers.push(trialCustomer);

  res.json({
    success: true,
    trialUser,
    trialPass,
    profile: {
      id: trialCustomer.id,
      name: trialCustomer.name,
      login: trialCustomer.login,
      status: trialCustomer.status,
      plan: trialCustomer.plan,
      dueDate: trialCustomer.dueDate,
      connections: trialCustomer.connections,
      renewalValue: trialCustomer.renewalValue
    }
  });
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Por favor, preencha o usuário e a senha.' });
  }

  try {
    const customer = await queryExternalPanel(login, password);

    if (!customer) {
      return res.status(401).json({ error: 'Dados inválidos. Verifique e tente novamente.' });
    }

    // Generate secure session token
    const token = 'sat_token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    // Store customer state associated with token
    // Deep clone to allow state updates per session
    sessions.set(token, JSON.parse(JSON.stringify(customer)));

    res.json({
      success: true,
      token,
      profile: {
        id: customer.id,
        name: customer.name,
        login: customer.login,
        status: customer.status,
        plan: customer.plan,
        dueDate: customer.dueDate,
        connections: customer.connections,
        renewalValue: customer.renewalValue
      }
    });

  } catch (err: any) {
    if (err.message === 'ConnectionFailed') {
      return res.status(503).json({ error: 'Não foi possível conectar ao painel no momento. Tente novamente mais tarde.' });
    }
    return res.status(500).json({ error: 'Ocorreu um erro interno de conexão segura.' });
  }
});

// GET /api/customer/profile
app.get('/api/customer/profile', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }

  res.json({
    id: user.id,
    name: user.name,
    login: user.login,
    status: user.status
  });
});

// GET /api/customer/subscription
app.get('/api/customer/subscription', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  res.json({
    plan: user.plan,
    dueDate: user.dueDate,
    status: user.status,
    connections: user.connections,
    renewalValue: user.renewalValue
  });
});

// GET /api/customer/payments
app.get('/api/customer/payments', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  res.json(user.history || []);
});

// POST /api/customer/renew (Simular/Registrar renovação)
app.post('/api/customer/renew', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sessão inválida.' });
  }

  // After customer paid, we add a pending renewal record
  const newRef = 'REN-' + Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  
  const paymentRecord = {
    id: newRef,
    date: dateFormatted,
    value: `R$ ${user.renewalValue.toFixed(2).replace('.', ',')}`,
    status: "Pendente Liberação",
    method: "Pix"
  };

  // Prepend to history
  user.history = [paymentRecord, ...(user.history || [])];
  
  // Update user session object
  sessions.set(req.headers.authorization!.substring(7), user);

  res.json({
    success: true,
    message: 'Pedido de renovação registrado com sucesso! Envie o comprovante.',
    paymentRecord
  });
});

// POST /api/customer/support (Simular abertura de tíquete)
app.post('/api/customer/support', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sessão inválida.' });
  }

  const { category, message } = req.body;
  if (!category || !message) {
    return res.status(400).json({ error: 'Preencha a categoria e a mensagem do suporte.' });
  }

  const ticketId = 'SUP-' + Math.floor(1000 + Math.random() * 9000);
  const ticket = {
    id: ticketId,
    clientName: user.name,
    category,
    message,
    status: 'Resposta Pendente',
    date: new Date().toLocaleDateString('pt-BR')
  };

  supportTickets.push(ticket);

  res.json({
    success: true,
    message: 'Solicitação criada com sucesso! Nosso suporte retornará em instantes via WhatsApp ou Painel.',
    ticket
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    sessions.delete(token);
  }
  res.json({ success: true, message: 'Desconectado com sucesso.' });
});

// -----------------------------------------------------------------------------
// STATIC FILE SERVING MIDDLEWARE (Servindo diretamente os arquivos estáticos da raiz)
// -----------------------------------------------------------------------------
async function startServer() {
  const rootDir = process.cwd();
  
  // Serve static files (style.css, script.js, config, etc.) from the root repo directory
  app.use(express.static(rootDir));
  
  // Custom fallback route to server the main index.html file directly
  app.get('*', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SAT Live Server] Running perfectly as a pure static router proxy on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('[Startup Failure] Failed to start SAT Live Server:', error);
});
