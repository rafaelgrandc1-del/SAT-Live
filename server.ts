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

const app = express();
const PORT = 3000;

// Middleware to parse JSON payloads
app.use(express.json());

// Application Secrets and Configurations
const PANEL_BASE_URL = process.env.PANEL_BASE_URL || 'https://painel.dinotv.shop';
const PANEL_USERNAME = process.env.PANEL_USERNAME || '';
const PANEL_PASSWORD = process.env.PANEL_PASSWORD || '';
const SUPPORT_WHATSAPP = process.env.SUPPORT_WHATSAPP || '5511937244163';
const PIX_KEY = process.env.PIX_KEY || '11937244163';

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
// VITE OR STATIC FILE SERVING MIDDLEWARE
// -----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Dynamic import for Vite inside dev development
    const { createServer: createViteServer } = await import('vite');
    const viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    // Serve Vite standard frontend pages
    app.use(viteInstance.middlewares);
    console.log('[Dev Server] Vite middleware integrated successfully.');
  } else {
    // Serve optimized production static built pages
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Catch-all route to serve index.html for React SPA Router compatibility
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Production Server] Serving compiled assets from:', distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SAT Live Server] Server successfully running at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('[Startup Failure] Failed to start SAT Live Server:', error);
});
