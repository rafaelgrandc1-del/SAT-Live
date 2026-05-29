import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, 
  Phone, 
  User, 
  Calendar, 
  LogOut, 
  ArrowLeft, 
  Shield, 
  AlertCircle, 
  Check, 
  Copy, 
  ExternalLink, 
  MessageSquare, 
  Menu, 
  X, 
  Lock, 
  Clock, 
  Activity, 
  DollarSign, 
  History,
  FileText,
  HelpCircle
} from 'lucide-react';

// Define Interface types directly in-app or based on /src/types.ts
interface CustomerProfile {
  id: string;
  name: string;
  login: string;
  status: 'Ativo' | 'Vencido' | 'Alerta' | string;
  plan: string;
  dueDate: string;
  connections: number;
  renewalValue: number;
}

interface PaymentHistoryItem {
  id: string;
  date: string;
  value: string;
  status: string;
  method: string;
}

interface SupportTicket {
  id: string;
  category: string;
  message: string;
  status: string;
  date: string;
}

interface ServerConfig {
  supportWhatsapp: string;
  pixKey: string;
  panelBaseUrl: string;
  hasRealCredentials: boolean;
}

export default function App() {
  // Navigation & User session states
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'dashboard' | 'checkout' | 'support'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  
  // App Config fetched from Backend
  const [config, setConfig] = useState<ServerConfig>({
    supportWhatsapp: '5511937244163',
    pixKey: '11937244163',
    panelBaseUrl: 'https://painel.dinotv.shop',
    hasRealCredentials: false
  });

  // Page interaction states
  const [loginUser, setLoginUser] = useState<string>('');
  const [loginPass, setLoginPass] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  
  // Checkout & pix payment states
  const [copiedPix, setCopiedPix] = useState<boolean>(false);
  const [paymentSent, setPaymentSent] = useState<boolean>(false);
  const [isRenewing, setIsRenewing] = useState<boolean>(false);

  // Support states
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [ticketCategory, setTicketCategory] = useState<string>('Dúvida Geral');
  const [ticketMessage, setTicketMessage] = useState<string>('');
  const [ticketSuccess, setTicketSuccess] = useState<boolean>(false);
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>([]);

  // On page load, retrieve session and configurations from backend
  useEffect(() => {
    // 1. Fetch Backend configurations (safe from exposing private secrets)
    fetch('/api/config')
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao obter configs');
        return res.json();
      })
      .then((data) => {
        if (data) {
          setConfig({
            supportWhatsapp: data.supportWhatsapp || '5511937244163',
            pixKey: data.pixKey || '11937244163',
            panelBaseUrl: data.panelBaseUrl || 'https://painel.dinotv.shop',
            hasRealCredentials: !!data.hasRealCredentials
          });
        }
      })
      .catch((err) => {
        console.warn('[Backend Notice] Usando configurações padrão localizadas.', err);
      });

    // 2. Check localstorage for active session
    const savedToken = localStorage.getItem('sat_live_token');
    const savedProfile = localStorage.getItem('sat_live_profile');
    if (savedToken && savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        setToken(savedToken);
        setProfile(parsedProfile);
        // Set view to dashboard directly
        setCurrentView('dashboard');
        // Fetch current subscription and payment history from server to keep database current
        fetchHistory(savedToken);
      } catch (e) {
        console.error('Error restoring session from localStorage:', e);
        localStorage.removeItem('sat_live_token');
        localStorage.removeItem('sat_live_profile');
      }
    }
  }, []);

  const fetchHistory = (sessionToken: string) => {
    fetch('/api/customer/payments', {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data);
        }
      })
      .catch((err) => {
        console.error('Error fetching payments history:', err);
      });
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    if (!loginUser.trim() || !loginPass.trim()) {
      setLoginError('Por favor, digite seu usuário e senha.');
      setLoginLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginUser.trim(), password: loginPass })
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || 'Erro inesperado.');
      }

      if (body.success && body.token && body.profile) {
        // Save to state and storage
        setToken(body.token);
        setProfile(body.profile);
        localStorage.setItem('sat_live_token', body.token);
        localStorage.setItem('sat_live_profile', JSON.stringify(body.profile));
        
        setCurrentView('dashboard');
        fetchHistory(body.token);
        // Clear login form
        setLoginUser('');
        setLoginPass('');
      }
    } catch (err: any) {
      console.error('[Login Error]', err);
      setLoginError(err.message || 'Não foi possível conectar ao painel no momento.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.warn('Silent session cleanup completed.', e);
      }
    }
    setToken(null);
    setProfile(null);
    setHistory([]);
    localStorage.removeItem('sat_live_token');
    localStorage.removeItem('sat_live_profile');
    setCurrentView('home');
    setMobileMenuOpen(false);
  };

  // Request Renewal logic
  const handleRenewRequest = async () => {
    if (!token || !profile) return;
    setIsRenewing(true);
    setPaymentSent(false);
    
    try {
      const response = await fetch('/api/customer/renew', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Refresh history to include pending transaction
        fetchHistory(token);
        setCurrentView('checkout');
      } else {
        alert(data.error || 'Erro ao registrar solicitação de renovação.');
      }
    } catch (e) {
      console.error(e);
      // Fallback checkout view if offline
      setCurrentView('checkout');
    } finally {
      setIsRenewing(false);
    }
  };

  // Handle Support Ticket submission
  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('Faça login para abrir um chamado de suporte técnico.');
      setCurrentView('login');
      return;
    }

    if (!ticketMessage.trim()) {
      alert('Por favor, escreva o motivo ou mensagem do suporte.');
      return;
    }

    try {
      const response = await fetch('/api/customer/support', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category: ticketCategory, message: ticketMessage })
      });

      const body = await response.json();
      if (response.ok && body.success) {
        setTicketSuccess(true);
        if (body.ticket) {
          setTicketsList([body.ticket, ...ticketsList]);
        }
        setTicketMessage('');
        setTimeout(() => setTicketSuccess(false), 6000);
      }
    } catch (e) {
      console.error(e);
      // Simulated local ticket add
      const simulatedTicket: SupportTicket = {
        id: 'SUP-' + Math.floor(1000 + Math.random() * 9000),
        category: ticketCategory,
        message: ticketMessage,
        status: 'Resposta Pendente',
        date: new Date().toLocaleDateString('pt-BR')
      };
      setTicketsList([simulatedTicket, ...ticketsList]);
      setTicketSuccess(true);
      setTicketMessage('');
      setTimeout(() => setTicketSuccess(false), 6000);
    }
  };

  // Copy Pix key utility
  const copyToClipboard = () => {
    navigator.clipboard.writeText(config.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  // Whatsapp links helpers
  const getSupportWhatsappLink = () => {
    const textMsg = encodeURIComponent('Olá, preciso de ajuda com suporte técnico da SAT Live.');
    return `https://wa.me/${config.supportWhatsapp}?text=${textMsg}`;
  };

  const getComprovanteWhatsappLink = () => {
    const textMsg = encodeURIComponent(`Olá, fiz o pagamento da renovação SAT Live de R$ ${profile?.renewalValue ? profile.renewalValue.toFixed(2).replace('.', ',') : '30,00'} e gostaria de enviar o comprovante.`);
    return `https://wa.me/${config.supportWhatsapp}?text=${textMsg}`;
  };

  // Status Badge visual configurations
  const getStatusConfig = (statusString: string | undefined) => {
    const status = statusString || 'Desconhecido';
    if (status.toLowerCase() === 'ativo') {
      return {
        bg: 'bg-emerald-500/10 hover:bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-400',
        bannerMsg: 'Seu acesso está ativo. Para evitar bloqueios, renove antes do vencimento.'
      };
    } else if (status.toLowerCase() === 'vencido') {
      return {
        bg: 'bg-rose-500/10 hover:bg-rose-500/15',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        dot: 'bg-rose-400',
        bannerMsg: 'Seu acesso está vencido. Clique em renovar para regularizar imediatamente e restabelecer o sinal.'
      };
    } else { // Alerta or ending soon
      return {
        bg: 'bg-amber-500/10 hover:bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400',
        bannerMsg: 'Seu acesso vence em breve. Recomendamos renovar antecipadamente para evitar pausas.'
      };
    }
  };

  const statusStyle = getStatusConfig(profile?.status);

  // FAQ List
  const faqs = [
    {
      q: 'Como acesso minha área do cliente?',
      a: 'Clique em "Área do Cliente" no menu superior, informe seu usuário ou e-mail cadastrado e sua senha. Se for o seu primeiro acesso, use as credenciais de teste informadas na tela de login ou fale com o suporte.'
    },
    {
      q: 'O que fazer se esqueci minha senha?',
      a: 'Você pode redefinir ou recuperar sua senha diretamente através do nosso atendimento exclusivo no WhatsApp clicando no botão "Preciso de ajuda" ou "Falar no WhatsApp". Nosso sistema enviará suas credenciais administrativas de forma segura.'
    },
    {
      q: 'Como renovar meu acesso?',
      a: 'Acesse o "Painel do Cliente" com seu login e senha, clique em "Renovar agora" na área de status. Copie a chave Pix gerada, realize o pagamento no aplicativo do seu banco e clique em "Enviar comprovante no WhatsApp".'
    },
    {
      q: 'Como envio o comprovante?',
      a: 'Após efetuar o PIX com nossa chave Pix configurada, clique no botão "Enviar comprovante" no dashboard de pagamentos. Você será direcionado para o nosso WhatsApp de suporte com uma mensagem automática configurada.'
    },
    {
      q: 'Meu acesso venceu, o que fazer?',
      a: 'Não se preocupe! Ao realizar o login, nosso painel identificará o status "Vencido". Clique em "Renovar agora" para efetuar o Pix de renovação instantânea. Envie o comprovante no suporte e sua assinatura será liberada em minutos!'
    },
    {
      q: 'Quanto tempo demora para liberar após o pagamento?',
      a: 'Geralmente a liberação ocorre em menos de 10 minutos após o envio do comprovante pelo WhatsApp. Nosso suporte valida seu comprovante e envia o sinal de ativação direto para os seus dispositivos de forma imediata.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between scroll-smooth text-gray-100 bg-[#020617] selection:bg-emerald-500 selection:text-black">
      
      {/* ----------------- TOP BANNER NOTICE CONSOLE ----------------- */}
      <div className="bg-[#0b132b]/80 border-b border-sky-950/40 text-[11px] font-mono py-1 px-4 text-center text-slate-400/90 tracking-wide flex items-center justify-center gap-2">
        <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>Servidor SAT Live Integrado • Modo Híbrido Ativo</span>
        {!config.hasRealCredentials && (
          <span className="text-amber-500/95 font-semibold">• Usando Base de Dados de Testes Integrada</span>
        )}
      </div>

      {/* ----------------- HEADER NAV SEGMENT ----------------- */}
      <header className="sticky top-0 z-50 bg-[#020617]/95 backdrop-blur border-b border-slate-900/80">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => setCurrentView('home')} 
            className="flex items-center gap-3 cursor-pointer group"
            id="brand-logo"
          >
            <div className="bg-gradient-to-tr from-emerald-500 to-sky-500 p-2 rounded-xl text-black shadow-[0_0_15px_rgba(16,185,129,0.25)] group-hover:scale-105 transition-transform">
              <Tv className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SAT <span className="text-emerald-400">Live</span>
              </span>
              <p className="text-[10px] font-mono text-slate-500 tracking-wider">PREMIUM PLATFORM</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }} 
              className={`text-sm font-medium transition-colors hover:text-emerald-400 ${currentView === 'home' ? 'text-emerald-400' : 'text-slate-300'}`}
              id="nav-home"
            >
              Início
            </button>
            <button 
              onClick={() => {
                setCurrentView('home');
                setMobileMenuOpen(false);
                setTimeout(() => {
                  document.getElementById('beneficios-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="text-sm font-medium transition-colors text-slate-300 hover:text-emerald-400"
              id="nav-benefits"
            >
              Benefícios
            </button>
            <button 
              onClick={() => { setCurrentView('support'); setMobileMenuOpen(false); }} 
              className={`text-sm font-medium transition-colors hover:text-emerald-400 ${currentView === 'support' ? 'text-emerald-400' : 'text-slate-300'}`}
              id="nav-support"
            >
              Suporte
            </button>
            
            {token ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }} 
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                  id="nav-user-panel"
                >
                  Olá, {profile?.name.split(' ')[0]}
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Sair da Conta"
                  id="nav-logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setCurrentView('login'); setMobileMenuOpen(false); }} 
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-slate-950 text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] active:scale-95"
                id="btn-nav-client-area"
              >
                Área do Cliente
              </button>
            )}
          </nav>

          {/* Mobile Menu Toggle Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-900/50 rounded-lg"
            aria-label="Abrir menu"
            id="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-[#020617] border-b border-slate-900 overflow-hidden"
            >
              <div className="px-4 py-6 flex flex-col gap-4">
                <button 
                  onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }} 
                  className="text-left py-2 text-base font-semibold text-slate-200 hover:text-emerald-400"
                >
                  Início
                </button>
                <button 
                  onClick={() => {
                    setCurrentView('home');
                    setMobileMenuOpen(false);
                    setTimeout(() => {
                      document.getElementById('beneficios-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 150);
                  }}
                  className="text-left py-2 text-base font-semibold text-slate-200 hover:text-emerald-400"
                >
                  Benefícios
                </button>
                <button 
                  onClick={() => { setCurrentView('support'); setMobileMenuOpen(false); }} 
                  className="text-left py-2 text-base font-semibold text-slate-200 hover:text-emerald-400"
                >
                  Suporte
                </button>

                {token ? (
                  <div className="border-t border-slate-900 pt-4 flex flex-col gap-3">
                    <button 
                      onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }} 
                      className="w-full text-center py-2.5 px-4 rounded-xl bg-slate-900 text-slate-200 text-sm font-bold block"
                    >
                      Olá, {profile?.name} • Painel
                    </button>
                    <button 
                      onClick={handleLogout} 
                      className="w-full text-center py-2.5 px-4 rounded-xl bg-rose-500/10 text-rose-400 text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sair da Área do Cliente
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { setCurrentView('login'); setMobileMenuOpen(false); }} 
                    className="w-full text-center py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-600 font-extrabold text-sm text-slate-950"
                  >
                    Entrar na Área do Cliente
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>


      {/* ----------------- CORE VIEWS INTEGRATOR ----------------- */}
      <main className="flex-grow">
        
        {/* 1. VIEW HOME (PÁGINA INICIAL) */}
        {currentView === 'home' && (
          <div className="flex flex-col">
            
            {/* HERO SECTION */}
            <section className="relative py-20 px-4 overflow-hidden border-b border-slate-900/60">
              
              {/* Absolutes for neon decoration */}
              <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
              <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />

              <div className="max-w-4xl mx-auto text-center relative z-10">
                
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6 tracking-wide"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Área do Cliente SAT Live Oficial</span>
                </motion.div>

                <motion.h1 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="font-extrabold text-3.5xl md:text-5.5xl leading-tight tracking-tight text-white mb-6"
                >
                  Acesse sua área do cliente de forma <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">simples, rápida e segura</span>
                </motion.h1>

                <motion.p 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                  Consulte seu plano, vencimento, pagamentos e suporte em poucos cliques. Tudo estruturado para facilitar sua experiência diária.
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto"
                >
                  <button 
                    onClick={() => token ? setCurrentView('dashboard') : setCurrentView('login')}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-slate-900 font-extrabold text-md rounded-xl transition-all shadow-[0_4px_25px_rgba(16,185,129,0.3)] shadow-emerald-500/20 hover:scale-102 flex items-center justify-center gap-2"
                    id="btn-hero-client-area"
                  >
                    Entrar na Área do Cliente
                    <User className="w-5 h-5 text-slate-950" />
                  </button>
                  <a 
                    href={getSupportWhatsappLink()} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full sm:w-auto px-8 py-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-md rounded-xl transition-all flex items-center justify-center gap-2"
                    id="btn-hero-whatsapp"
                  >
                    <Phone className="w-5 h-5 text-emerald-400" />
                    Falar no WhatsApp
                  </a>
                </motion.div>

                {/* Sub-note */}
                <p className="mt-6 text-xs text-slate-500 font-mono">
                  Suporte dedicado das 08:00 às 23:00 todos os dias.
                </p>

              </div>
            </section>

            {/* BENEFÍCIOS SECTION */}
            <section id="beneficios-section" className="py-20 px-4 bg-[#01030e]/40 border-b border-slate-900/60 scrolling-mt-12">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <span className="text-xs font-extrabold tracking-widest text-emerald-400 uppercase">PRATICIDADE</span>
                  <h2 className="text-2xl md:text-4xl font-extrabold text-white mt-1.5">Tudo o que você precisa em segundos</h2>
                  <p className="text-slate-400 text-sm md:text-base mt-2 max-w-md mx-auto">Visualize, gerencie e resolva sem precisar falar com ninguém.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Card 1 */}
                  <div className="p-6 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 hover:scale-[1.02] hover:bg-slate-900/60 transition-all group">
                    <div>
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors">
                        <Tv className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-lg text-white mb-2">Acompanhe seu plano</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">Consulte o plano contratado, quantidade de telas e conexões liberadas instantaneamente.</p>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="p-6 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 hover:scale-[1.02] hover:bg-slate-900/60 transition-all group">
                    <div>
                      <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-5 group-hover:bg-orange-500/20 group-hover:text-orange-300 transition-colors">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-lg text-white mb-2">Veja seus vencimentos</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">Tenha controle total das suas datas e evite o bloqueio indesejado do sinal de TV e IPTV de forma simples.</p>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="p-6 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 hover:scale-[1.02] hover:bg-slate-900/60 transition-all group">
                    <div>
                      <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5 group-hover:bg-sky-500/20 group-hover:text-sky-300 transition-colors">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-lg text-white mb-2">Solicite suporte</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">Abra chamados na hora ou chame nosso suporte premium no WhatsApp para receber ajuda rápida.</p>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="p-6 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 hover:scale-[1.02] hover:bg-slate-900/60 transition-all group">
                    <div>
                      <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors">
                        <Clock className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-lg text-white mb-2">Renove seu acesso</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">Pague de forma veloz com Pix de um clique, sem estresse, recebendo o código copia e cola.</p>
                    </div>
                  </div>

                  {/* Card 5 */}
                  <div className="p-6 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 hover:scale-[1.02] hover:bg-slate-900/60 transition-all group">
                    <div>
                      <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                        <Shield className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-lg text-white mb-2">Receba avisos importantes</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">Evite desligamentos. Nós mostramos alertas inteligentes com o status atual da sua conexão.</p>
                    </div>
                  </div>

                  {/* Card 6 */}
                  <div className="p-6 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 hover:scale-[1.02] hover:bg-slate-900/60 transition-all group">
                    <div>
                      <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-lg text-white mb-2">Consulte seus pagamentos</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">Histórico completo de faturas recolhidas e liberações financeiras vinculadas à sua conta.</p>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* PASSO A PASSO (COMO FUNCIONA) */}
            <section className="py-20 px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-2xl md:text-3.5xl font-extrabold text-white">Como obter acesso rápido e renovar</h2>
                  <p className="text-slate-400 text-sm mt-2">Veja como é fácil regularizar ou consultar suas credenciais na SAT Live</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                  
                  {/* Step Item 1 */}
                  <div className="relative text-center px-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-sky-600 rounded-2xl mx-auto flex items-center justify-center text-slate-950 text-xl font-black mb-6 shadow-lg shadow-emerald-500/15">
                      1
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2">Faça Login</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Insira seus dados normais de acesso informando usuário e senha para entrar na Área do Cliente.
                    </p>
                  </div>

                  {/* Step Item 2 */}
                  <div className="relative text-center px-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-sky-600 rounded-2xl mx-auto flex items-center justify-center text-slate-950 text-xl font-black mb-6 shadow-lg shadow-emerald-500/15">
                      2
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2">Consulte sua assinatura</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Confira instantaneamente o status do sinal de transmissão, data de vencimento e conexões atuais.
                    </p>
                  </div>

                  {/* Step Item 3 */}
                  <div className="relative text-center px-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-sky-600 rounded-2xl mx-auto flex items-center justify-center text-slate-950 text-xl font-black mb-6 shadow-lg shadow-emerald-500/15">
                      3
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2">Renove ou chame o suporte</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Emita Pix Copia e Cola para pagamento na hora e envie o comprovante para liberação em poucos minutos.
                    </p>
                  </div>

                </div>
              </div>
            </section>

          </div>
        )}


        {/* 2. VIEW LOGIN (TELA DE LOGIN) */}
        {currentView === 'login' && (
          <div className="py-12 px-4 flex items-center justify-center relative min-h-[70vh]">
            
            {/* Absolutes for neon decoration */}
            <div className="absolute top-[20%] left-[30%] w-[250px] h-[250px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

            <div className="max-w-md w-full bg-slate-900/60 border border-slate-850 rounded-3xl p-8 py-10 relative z-10 shadow-2xl backdrop-blur-md">
              
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-extrabold text-white">Área do Cliente SAT Live</h2>
                <p className="text-slate-400 text-xs mt-2 font-medium">Entre com seus dados para acessar sua assinatura</p>
              </div>

              {loginError && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Erro de autenticação</p>
                    <p className="text-slate-300 mt-1">{loginError}</p>
                  </div>
                </div>
              )}

              {/* DEMO / TEST CREDENTIALS BOX */}
              <div className="mb-6 p-4 rounded-xl bg-[#0b1b19] border border-emerald-950 text-emerald-400 text-xs" id="demo-credentials bg">
                <p className="font-bold flex items-center gap-1.5 uppercase tracking-wide">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Acesso de Teste Cadastrado!
                </p>
                <div className="text-slate-300 mt-2 font-mono flex flex-col gap-1">
                  <span>• Usuário: <b className="text-white bg-emerald-500/10 px-1 py-0.5 rounded">cliente123</b></span>
                  <span>• Senha: <b className="text-white bg-emerald-500/10 px-1 py-0.5 rounded">123456</b></span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-sans italic">Use esses dados para avaliar o dashboard administrativo em tempo real.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Usuário, Telefone ou E-mail</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-500">
                      <User className="w-4.5 h-4.5" />
                    </span>
                    <input 
                      type="text" 
                      required
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      placeholder="Ex: cliente123"
                      className="w-full bg-[#050b1d] border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all"
                      id="input-login"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Senha</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-500">
                      <Lock className="w-4.5 h-4.5" />
                    </span>
                    <input 
                      type="password" 
                      required
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="Sua senha cadastrada"
                      className="w-full bg-[#050b1d] border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all"
                      id="input-password"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <a 
                    href={getSupportWhatsappLink()} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    Esqueci minha senha
                  </a>
                </div>

                <button 
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3.5 font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-slate-950 transition-all flex items-center justify-center gap-2 active:scale-98 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-55"
                  id="btn-submit-login"
                >
                  {loginLoading ? 'Acessando dados...' : 'Entrar na Assinatura'}
                </button>
              </form>

              {/* Botão de redirecionamento ou ajuda externa */}
              <div className="mt-8 border-t border-slate-850 pt-6 flex flex-col gap-3">
                <a 
                  href={config.panelBaseUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full text-center py-3 rounded-xl bg-[#1e2330]/40 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  id="btn-redirect-painel"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Acessar painel externo oficial
                </a>
                <a 
                  href={getSupportWhatsappLink()} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full text-center py-2.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-all flex items-center justify-center gap-1.5"
                  id="btn-help-whatsapp"
                >
                  <Phone className="w-3.5 h-3.5" /> Preciso de ajuda no WhatsApp
                </a>
              </div>

            </div>
          </div>
        )}


        {/* 3. VIEW DASHBOARD (PAINEL DO CLIENTE) */}
        {currentView === 'dashboard' && profile && (
          <div className="py-10 px-4 max-w-5xl mx-auto">
            
            {/* Welcoming Top Row Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-slate-900/50 border border-slate-850 p-6 rounded-3xl">
              <div>
                <span className="text-xs font-extrabold text-emerald-400 tracking-wider font-mono">CLIENTE REGISTRADO</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">Olá, {profile.name}!</h2>
                <p className="text-slate-400 text-xs mt-1 font-mono">ID de Assinante: {profile.id}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentView('support')}
                  className="px-4 py-2 border border-slate-800 bg-[#080d1e] text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Suporte Técnico
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-3.5 py-2 hover:bg-rose-500/10 text-rose-400 rounded-xl text-xs font-bold transition-all border border-rose-500/10 flex items-center gap-1.5"
                  id="btn-logout-dashboard"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sair
                </button>
              </div>
            </div>

            {/* Smart Banner Alarm Alert depending on subscriber status */}
            <div className={`mb-8 p-4.5 border rounded-2xl ${statusStyle.bg} ${statusStyle.border} flex items-start gap-3`}>
              <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${statusStyle.text}`} />
              <div>
                <p className={`font-bold text-sm ${statusStyle.text}`}>Aviso Importante do Sistema</p>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">{statusStyle.bannerMsg}</p>
              </div>
            </div>


            {/* KPI BENTO GRID CARDS */}
            <h3 className="text-xs font-extrabold tracking-widest text-slate-400 uppercase mb-4">Informações do meu Serviço</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              
              {/* Status card */}
              <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400">Status do Sinal</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${statusStyle.dot} animate-pulse`} />
                    <span className={`text-xl font-black ${statusStyle.text}`}>{profile.status}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-4 leading-normal">Transmissões normais e sem perdas.</p>
              </div>

              {/* Due Date Card */}
              <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400">Data de Vencimento</span>
                  <div className="flex items-center gap-2.5 mt-2 text-white">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                    <span className="text-xl font-black">{profile.dueDate}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-4 leading-normal">Seu período acaba exatamente nesta data.</p>
              </div>

              {/* Plan Card */}
              <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400">Plano Contratado</span>
                  <div className="flex items-center gap-2 mt-2 text-white">
                    <Tv className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-[15px] font-black tracking-tight truncate">{profile.plan}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-4 leading-normal">{profile.connections} {profile.connections === 1 ? 'Dispositivo Liberado' : 'Dispositivos Simultâneos'}.</p>
              </div>

              {/* Renewal value Card */}
              <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400">Valor de Renovação</span>
                  <div className="flex items-center gap-1.5 mt-2 text-white">
                    <DollarSign className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <span className="text-2xl font-black">R$ {profile.renewalValue.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-4 leading-normal font-mono">Sem tarifas de reajuste do plano.</p>
              </div>

            </div>


            {/* QUICK ACTIONS BUTTON BAR */}
            <div className="bg-slate-900/40 border border-slate-850 rounded-2.5xl p-6 mb-8">
              <h4 className="text-xs font-extrabold tracking-wider text-slate-400 uppercase mb-4">Ações Disponíveis</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <button 
                  onClick={handleRenewRequest}
                  disabled={isRenewing}
                  className="py-4.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-slate-950 font-extrabold text-sm transition-all focus:ring-2 focus:ring-emerald-500 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                  id="btn-renew-dashboard"
                >
                  {isRenewing ? 'Preparando Pix...' : 'Renovação Imediata (PIX)'}
                </button>

                <a 
                  href={getSupportWhatsappLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="py-4.5 px-4 rounded-xl bg-[#091515] border border-emerald-900/90 text-emerald-400 hover:text-emerald-300 hover:bg-[#0d1f1f] text-center font-bold text-sm transition-all flex items-center justify-center gap-2"
                  id="btn-whatsapp-dashboard"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp Suporte
                </a>

                <a 
                  href={config.panelBaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="py-4.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 text-center font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  id="btn-panel-dashboard"
                >
                  <ExternalLink className="w-4 h-4" /> Acessar Painel Oficial
                </a>

              </div>
            </div>


            {/* TRANSACTION HISTORY BLOCK */}
            <div className="bg-[#010411] border border-slate-900 rounded-2.5xl p-6">
              <div className="flex items-center gap-2.5 mb-6 text-white">
                <History className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-md md:text-lg">Faturamento e Renovação Histórica</h3>
              </div>

              {history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-400 text-xs font-bold">
                        <th className="py-3 px-4">Ref / ID</th>
                        <th className="py-3 px-4">Data do Pedido</th>
                        <th className="py-3 px-4">Valor</th>
                        <th className="py-3 px-4">Forma</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {history.map((item) => (
                        <tr key={item.id} className="text-xs text-slate-200">
                          <td className="py-4 px-4 font-mono font-semibold text-slate-400">{item.id}</td>
                          <td className="py-4 px-4 text-slate-300">{item.date}</td>
                          <td className="py-4 px-4 font-bold text-white">{item.value}</td>
                          <td className="py-4 px-4 text-slate-400">{item.method}</td>
                          <td className="py-4 px-4 text-right">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold ${
                              item.status === 'Aprovado' || item.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                item.status === 'Aprovado' || item.status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400'
                              }`} />
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-950 rounded-xl border border-slate-900/60 text-slate-500">
                  <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs">Nenhum registro de faturamento neste dispositivo.</p>
                </div>
              )}
            </div>

          </div>
        )}


        {/* 4. VIEW CHECKOUT (PÁGINA DE RENOVAÇÃO / PAGAMENTO PIX) */}
        {currentView === 'checkout' && profile && (
          <div className="py-12 px-4 max-w-xl mx-auto">
            
            <button 
              onClick={() => { setCurrentView('dashboard'); setPaymentSent(false); }} 
              className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors bg-none border-none cursor-pointer"
              id="btn-back-checkout"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para o painel
            </button>

            <div className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
              
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-sky-600" />

              <div className="text-center mb-8">
                <span className="text-xs font-bold text-emerald-400 uppercase font-mono tracking-wider">PIX INTEGRADO</span>
                <h2 className="text-2xl font-extrabold text-white mt-1">Efetue sua Renovação</h2>
                <p className="text-slate-400 text-xs mt-1.5">Faça o pagamento via Pix para renovar o acesso</p>
              </div>

              {/* Informações da Assinatura do cliente */}
              <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-900 space-y-3 mb-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Assinante:</span>
                  <span className="font-bold text-white">{profile.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Plano Atual:</span>
                  <span className="font-bold text-sky-400">{profile.plan}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Vencimento Original:</span>
                  <span className="font-bold text-slate-300">{profile.dueDate}</span>
                </div>
                <div className="border-t border-slate-900/80 pt-3 flex justify-between items-center text-sm font-semibold text-white">
                  <span>Valor de Renovação:</span>
                  <span className="text-xl font-black text-emerald-400">R$ {profile.renewalValue.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* FAKE VISUAL GENERATED QR CODE */}
              <div className="bg-white p-4.5 max-w-[200px] mx-auto rounded-2xl shadow-lg border-2 border-slate-800/20 mb-6 relative group">
                <div className="w-full aspect-square bg-[#0b0c10] rounded flex flex-col items-center justify-center p-2 relative">
                  
                  {/* Neon frame lines */}
                  <div className="absolute inset-x-2 top-2 border-t-2 border-l-2 border-emerald-500 w-6 h-6 rounded-tl-[4px]" />
                  <div className="absolute inset-x-2 top-2 border-t-2 border-r-2 border-emerald-500 w-6 h-6 rounded-tr-[4px] justify-self-end right-2 left-auto" />
                  <div className="absolute bottom-2 left-2 border-b-2 border-l-2 border-emerald-500 w-6 h-6 rounded-bl-[4px]" />
                  <div className="absolute bottom-2 right-2 border-b-2 border-r-2 border-emerald-500 w-6 h-6 rounded-br-[4px]" />

                  {/* QR code simulated code lines */}
                  <div className="w-4/5 h-4/5 grid grid-cols-5 grid-rows-5 gap-1.5 opacity-80">
                    <div className="bg-emerald-400 rounded-sm" />
                    <div className="bg-emerald-600 rounded-sm" />
                    <div className="bg-slate-850 rounded-sm" />
                    <div className="bg-emerald-400 rounded-sm col-span-2" />
                    
                    <div className="bg-slate-850 rounded-sm" />
                    <div className="bg-emerald-400 rounded-sm" />
                    <div className="bg-emerald-600 rounded-sm" />
                    <div className="bg-slate-850 rounded-sm" />
                    <div className="bg-slate-850 rounded-sm" />
                    
                    <div className="bg-emerald-400 rounded-sm col-span-2" />
                    <div className="bg-slate-850 rounded-sm" />
                    <div className="bg-emerald-600 rounded-sm" />
                    <div className="bg-emerald-400 rounded-sm" />
                    
                    <div className="bg-slate-850 rounded-sm" />
                    <div className="bg-emerald-600 rounded-sm" />
                    <div className="bg-slate-850 rounded-sm" />
                    <div className="bg-emerald-400 rounded-sm" />
                    <div className="bg-slate-850 rounded-sm" />
                    
                    <div className="bg-emerald-400 rounded-sm col-span-3" />
                    <div className="bg-emerald-600 rounded-sm col-span-2" />
                  </div>
                </div>

                <div className="text-center mt-3 text-slate-800 text-[10px] font-bold uppercase tracking-wider">Pix QR Code de Teste</div>
              </div>


              {/* COPY PIX KEY FORM SEGMENT */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Chave Pix Copia e Cola / Celular</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={config.pixKey}
                      className="flex-grow bg-[#050b1d] border border-slate-800 rounded-xl px-4 py-3 text-xs md:text-sm font-mono text-emerald-400 select-all outline-none"
                    />
                    <button 
                      onClick={copyToClipboard}
                      className="px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:scale-103 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedPix ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Whatsapp proof instructions */}
              <div className="p-4 bg-blue-950/20 rounded-2xl border border-sky-950 text-slate-350 text-xs mb-6 space-y-2">
                <p className="font-bold text-slate-200">ℹ️ Orientação Importante:</p>
                <p className="leading-relaxed">
                  Após realizar o pagamento, envie o comprovante pelo WhatsApp para agilizar a liberação ou renovação do seu acesso.
                </p>
              </div>

              {/* Checkout CTA Buttons */}
              <div className="flex flex-col gap-3">
                <a 
                  href={getComprovanteWhatsappLink()} 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={() => setPaymentSent(true)}
                  className="w-full text-center py-4 bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-slate-950 text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
                  id="btn-send-receipt"
                >
                  <Phone className="w-5 h-5 text-slate-950" />
                  Enviar Comprovante no WhatsApp
                </a>
                
                {paymentSent && (
                  <div className="p-3 bg-emerald-950/30 text-emerald-400 text-xs text-center border border-emerald-900 rounded-xl animate-pulse">
                    Solicitação enviada! Aguardamos seu comprovante no nosso canal oficial.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}


        {/* 5. VIEW SUPPORT (PÁGINA DE SUPORTE) */}
        {currentView === 'support' && (
          <div className="py-12 px-4 max-w-4xl mx-auto">
            
            {/* Title support summary */}
            <div className="text-center mb-12">
              <span className="text-xs font-extrabold tracking-widest text-emerald-400 uppercase">CANAL OFICIAL</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">Suporte SAT Live</h2>
              <p className="text-slate-400 text-sm md:text-base mt-2">Precisa de ajuda? Fale com nosso atendimento.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form and CTA segment */}
              <div className="lg:col-span-7 bg-slate-900/60 border border-slate-850 p-6 rounded-3xl backdrop-blur">
                
                <h3 className="font-extrabold text-lg text-white mb-4">Abrir Nova Solicitação</h3>
                
                {ticketSuccess && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs leading-normal">
                    <p className="font-bold flex items-center gap-1.5"><Check className="w-4 h-4" /> Solicitação criada com sucesso!</p>
                    <p className="text-slate-350 mt-1.5">Nosso suporte retornará em instantes via WhatsApp ou e-mail cadastrado de forma garantida.</p>
                  </div>
                )}

                <form onSubmit={handleSendTicket} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">Categoria</label>
                    <select 
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full bg-[#050b1d] border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-xs md:text-sm text-white outline-none"
                    >
                      <option value="Dúvida Geral">Dúvida Geral sobre IPTV / Aplicativo</option>
                      <option value="Problemas com Sinal">Problemas com Sinal de Canais</option>
                      <option value="Pagamento e Cobrança">Pagamentos / Confirmação de PIX</option>
                      <option value="Atualizar Cadastro">Atualização Cadastral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-2">Mensagem</label>
                    <textarea 
                      required
                      rows={5}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Descreva seu problema ou solicitação de forma simples para auxiliar nossa equipe..."
                      className="w-full bg-[#050b1d] border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-xs md:text-sm text-white placeholder-slate-500 outline-none resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
                    id="btn-submit-support"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-950" /> Enviar Chamado Interno
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-850 flex flex-col gap-3">
                  <p className="text-[11px] text-slate-500 text-center font-mono">Deseja resposta e liberação muito mais rápida?</p>
                  <a 
                    href={getSupportWhatsappLink()} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full py-4 text-center bg-[#091515] border border-emerald-900 text-emerald-400 hover:bg-[#0d2121] rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                    id="btn-whatsapp-direct"
                  >
                    <Phone className="w-5 h-5 text-emerald-400" /> Chamar no WhatsApp Oficial
                  </a>
                </div>

              </div>


              {/* FAQ Accordion Side Segment */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-3xl">
                  <h3 className="font-extrabold text-md text-white mb-4 flex items-center gap-2.5">
                    <HelpCircle className="w-4.5 h-4.5 text-emerald-400" />
                    Perguntas Frequentes FAQ
                  </h3>
                  
                  <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                      <div 
                        key={idx} 
                        className="border-b border-slate-850/60 last:border-b-0 pb-3 last:pb-0"
                      >
                        <button 
                          onClick={() => setFaqOpenIndex(faqOpenIndex === idx ? null : idx)}
                          className="w-full text-left font-bold text-xs md:text-sm text-slate-200 hover:text-white flex justify-between items-center py-2"
                        >
                          <span>{faq.q}</span>
                          <span className="text-emerald-400 ml-2 font-mono text-xs">{faqOpenIndex === idx ? '−' : '+'}</span>
                        </button>
                        
                        <AnimatePresence>
                          {faqOpenIndex === idx && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden mt-2"
                            >
                              <p className="text-xs text-slate-400 leading-relaxed bg-[#050b1d]/40 p-3 rounded-xl border border-slate-850/40">
                                {faq.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Sub-Support local list */}
                {ticketsList.length > 0 && (
                  <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-3xl">
                    <h3 className="font-extrabold text-xs tracking-wider text-slate-400 uppercase mb-3">Chamados Criados</h3>
                    <div className="space-y-3 max-h-[160px] overflow-y-auto">
                      {ticketsList.map((ticket) => (
                        <div key={ticket.id} className="p-3 bg-[#050b1d] rounded-xl border border-slate-850 text-left">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-mono text-slate-400 font-bold">{ticket.id}</span>
                            <span className="text-slate-400">{ticket.date}</span>
                          </div>
                          <p className="font-semibold text-xs text-white mt-1.5">{ticket.category}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-1">{ticket.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

      </main>


      {/* ----------------- CORE FOOTER SEGMENT ----------------- */}
      <footer className="bg-[#01030e] border-t border-slate-900/80 pt-16 pb-8 px-4 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          
          {/* Main profile brand */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-tr from-emerald-500 to-sky-500 p-2 rounded-xl text-black">
                <Tv className="w-5 h-5 text-slate-950" />
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SAT <span className="text-emerald-400">Live</span>
              </span>
            </div>
            <p className="leading-relaxed text-slate-400 text-sm max-w-sm">
              Plataforma premium para controle de acesso do cliente. Visualize seu plano, realize renovações de forma segura e imediata e conte com nosso suporte dedicado.
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              © {new Date().getFullYear()} SAT Live Corporation. Todos os direitos reservados.
            </p>
          </div>

          {/* Quick links header */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Acesso Rápido</h4>
            <div className="flex flex-col gap-2 font-medium">
              <button onClick={() => setCurrentView('home')} className="text-left hover:text-emerald-400 transition-colors">Início</button>
              <button 
                onClick={() => {
                  setCurrentView('home');
                  setTimeout(() => {
                    document.getElementById('beneficios-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }} 
                className="text-left hover:text-emerald-400 transition-colors"
              >
                Benefícios
              </button>
              <button 
                onClick={() => token ? setCurrentView('dashboard') : setCurrentView('login')} 
                className="text-left hover:text-emerald-400 transition-colors"
              >
                Área do Cliente
              </button>
              <button onClick={() => setCurrentView('support')} className="text-left hover:text-emerald-400 transition-colors">Suporte e FAQ</button>
            </div>
          </div>

          {/* Business Operation notices */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Aviso de Atendimento</h4>
            <p className="leading-relaxed text-slate-400">
              Nosso atendimento oficial é via WhatsApp no número <span className="text-white hover:underline">{config.supportWhatsapp}</span>.
            </p>
            <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850/60">
              <p className="font-semibold text-white mb-1 tracking-wide">Relatórios Fiscais e Pix:</p>
              <p className="text-slate-400 text-[11px]">Gerados com base na chave PIX cadastrada em conformidade institucional.</p>
            </div>
          </div>

        </div>

        {/* Legal notice foot */}
        <div className="max-w-6xl mx-auto border-t border-slate-900/40 pt-6 text-center text-slate-500 text-[10px] space-y-2">
          <p>
            AVISO DE SEGURANÇA: Todas as consultas de sessões e logins via API ocorrem na camada administrativa de back-end. Não expomos dados sensíveis no front-end.
          </p>
          <p className="text-slate-600">
            SAT Live — O melhor sinal de streaming e entretenimento para sua casa.
          </p>
        </div>
      </footer>

    </div>
  );
}
