/**
 * ==============================================================================
 * BRASILEIRÃO DO PROJETO CRUZEIRINHO — JAVASCRIPT COMPLETO E AUTÔNOMO
 * "Bom de Bola, Bom na Escola" • Desde 2018 (Bairro do Piaí, Ibiúna - SP)
 * ==============================================================================
 * Este arquivo contém toda a lógica de negócio, renderização dinâmica de páginas,
 * gestão de inscrições com Pix PagSeguro, cálculo automático de Team Overview,
 * draft balanceado por potes com notas de 1 a 5, tabelas, artilharia e painel admin.
 */

// DADOS OFICIAIS DO PAGAMENTO PIX (PAGSEGURO / DOUGLAS LEONEL LEITE)
const PIX_INFO = {
  chave: 'prjtcruzeirinho@gmail.com',
  copiaECola: '00020126580014br.gov.bcb.pix0136d99e71bc-7881-4361-9e6d-114c853fab3d27600016BR.COM.PAGSEGURO0136CC97B07E-892A-4A32-8C0B-C415F2479F09520400005303986540525.005802BR5920DOUGLAS LEONEL LEITE6006Ibiuna62290525PAGS00000250026103108072163042765',
  titular: 'DOUGLAS LEONEL LEITE',
  instituicao: 'PagSeguro / PagBank',
  cidade: 'Ibiúna - SP',
  valor: 'R$ 25,00'
};

// Brasão Oficial do Projeto Cruzeirinho
const LOGO_URL = window.location.pathname.includes('/standalone')
  ? '../assets/aistudio/1779882264991_35858112.png'
  : '/assets/aistudio/1779882264991_35858112.png';

// BANCO DE DADOS INICIAL DO CAMPEONATO
const DADOS_INICIAIS = {
  equipes: [
    // SUB-9
    { id: 'eq-sub9-1', nome: 'Cruzeirinho FC', categoria: 'SUB-9', corPrincipal: '#1e40af' },
    { id: 'eq-sub9-2', nome: 'Estrelas do Piaí', categoria: 'SUB-9', corPrincipal: '#047857' },
    { id: 'eq-sub9-3', nome: 'Fênix da Bola', categoria: 'SUB-9', corPrincipal: '#b91c1c' },
    { id: 'eq-sub9-4', nome: 'Águias de Ouro', categoria: 'SUB-9', corPrincipal: '#d97706' },

    // SUB-11
    { id: 'eq-sub11-1', nome: 'Cruzeirinho Junior', categoria: 'SUB-11', corPrincipal: '#1e40af' },
    { id: 'eq-sub11-2', nome: 'Piaí Talentos', categoria: 'SUB-11', corPrincipal: '#047857' },
    { id: 'eq-sub11-3', nome: 'União Esperança', categoria: 'SUB-11', corPrincipal: '#7c3aed' },
    { id: 'eq-sub11-4', nome: 'Guerreiros da Bola', categoria: 'SUB-11', corPrincipal: '#c026d3' },

    // SUB-16
    { id: 'eq-sub16-1', nome: 'Cruzeirinho Elite', categoria: 'SUB-16', corPrincipal: '#1e40af' },
    { id: 'eq-sub16-2', nome: 'Piaí Atlético', categoria: 'SUB-16', corPrincipal: '#047857' },
    { id: 'eq-sub16-3', nome: 'Garotos da Vila', categoria: 'SUB-16', corPrincipal: '#dc2626' },
    { id: 'eq-sub16-4', nome: 'Fênix Juventude', categoria: 'SUB-16', corPrincipal: '#475569' }
  ],
  atletas: [
    // Atletas SUB-9
    { id: 'atl-1', nome: 'Enzo Gabriel da Silva', categoria: 'SUB-9', responsavel: 'Carlos Silva', tipo: 'Normal', equipeId: 'eq-sub9-1', gols: 5, assistencias: 3, nota: 5 },
    { id: 'atl-2', nome: 'Davi Lucca Ribeiro', categoria: 'SUB-9', responsavel: 'Juliana Ribeiro', tipo: 'Normal', equipeId: 'eq-sub9-1', gols: 3, assistencias: 2, nota: 4 },
    { id: 'atl-3', nome: 'Bryan Miller Santos', categoria: 'SUB-9', responsavel: 'Renata Santos', tipo: 'Solidária', equipeId: 'eq-sub9-2', gols: 4, assistencias: 1, nota: 4 },
    { id: 'atl-4', nome: 'Arthur Miguel Souza', categoria: 'SUB-9', responsavel: 'Rodrigo Souza', tipo: 'Normal', equipeId: 'eq-sub9-2', gols: 2, assistencias: 4, nota: 3 },
    { id: 'atl-5', nome: 'Theo Henrique Lima', categoria: 'SUB-9', responsavel: 'Patrícia Lima', tipo: 'Normal', equipeId: 'eq-sub9-3', gols: 6, assistencias: 2, nota: 5 },
    { id: 'atl-6', nome: 'Bernardo Ramos', categoria: 'SUB-9', responsavel: 'Vanessa Ramos', tipo: 'Solidária', equipeId: 'eq-sub9-4', gols: 3, assistencias: 3, nota: 4 },
    { id: 'atl-7', nome: 'Heitor Rocha', categoria: 'SUB-9', responsavel: 'Camila Rocha', tipo: 'Normal', equipeId: null, gols: 0, assistencias: 0, nota: 3 },
    { id: 'atl-8', nome: 'Noah Ferreira Alves', categoria: 'SUB-9', responsavel: 'Marcos Alves', tipo: 'Normal', equipeId: null, gols: 0, assistencias: 0, nota: 4 },
    { id: 'atl-19', nome: 'Thales Roberto Lima', categoria: 'SUB-9', responsavel: 'Fernanda Lima', tipo: 'Normal', equipeId: null, gols: 0, assistencias: 0, nota: 3 },

    // Atletas SUB-11
    { id: 'atl-9', nome: 'Cauã Rodrigues Costa', categoria: 'SUB-11', responsavel: 'Fernanda Costa', tipo: 'Normal', equipeId: 'eq-sub11-1', gols: 6, assistencias: 4, nota: 5 },
    { id: 'atl-10', nome: 'Matheus Felipe Barbosa', categoria: 'SUB-11', responsavel: 'José Barbosa', tipo: 'Solidária', equipeId: 'eq-sub11-1', gols: 4, assistencias: 3, nota: 4 },
    { id: 'atl-11', nome: 'Samuel de Oliveira', categoria: 'SUB-11', responsavel: 'Cláudia Oliveira', tipo: 'Normal', equipeId: 'eq-sub11-2', gols: 5, assistencias: 2, nota: 3 },
    { id: 'atl-12', nome: 'Heitor Vasconcelos', categoria: 'SUB-11', responsavel: 'Daniel Vasconcelos', tipo: 'Solidária', equipeId: 'eq-sub11-3', gols: 2, assistencias: 5, nota: 4 },
    { id: 'atl-13', nome: 'Pedro Henrique Dias', categoria: 'SUB-11', responsavel: 'Luciana Dias', tipo: 'Normal', equipeId: null, gols: 0, assistencias: 0, nota: 2 },

    // Atletas SUB-16
    { id: 'atl-14', nome: 'Gabriel Felipe Souza', categoria: 'SUB-16', responsavel: 'Valéria Souza', tipo: 'Normal', equipeId: 'eq-sub16-1', gols: 7, assistencias: 5, nota: 5 },
    { id: 'atl-15', nome: 'Leonardo Guimarães', categoria: 'SUB-16', responsavel: 'Roberto Guimarães', tipo: 'Normal', equipeId: 'eq-sub16-1', gols: 4, assistencias: 2, nota: 4 },
    { id: 'atl-16', nome: 'Gustavo Henrique Borges', categoria: 'SUB-16', responsavel: 'Sônia Borges', tipo: 'Solidária', equipeId: 'eq-sub16-2', gols: 5, assistencias: 3, nota: 4 },
    { id: 'atl-17', nome: 'Rafael Nogueira Prado', categoria: 'SUB-16', responsavel: 'Paulo Prado', tipo: 'Normal', equipeId: 'eq-sub16-3', gols: 3, assistencias: 4, nota: 3 },
    { id: 'atl-18', nome: 'Felipe Martins Pires', categoria: 'SUB-16', responsavel: 'Sandra Pires', tipo: 'Solidária', equipeId: null, gols: 0, assistencias: 0, nota: 3 }
  ],
  partidas: [
    { id: 'part-1', categoria: 'SUB-9', data: '2026-03-15', horario: '08:30', mandanteId: 'eq-sub9-1', visitanteId: 'eq-sub9-2', placarMandante: 4, placarVisitante: 2, status: 'Finalizado' },
    { id: 'part-2', categoria: 'SUB-9', data: '2026-03-15', horario: '09:30', mandanteId: 'eq-sub9-3', visitanteId: 'eq-sub9-4', placarMandante: 3, placarVisitante: 1, status: 'Finalizado' },
    { id: 'part-3', categoria: 'SUB-9', data: '2026-03-22', horario: '08:30', mandanteId: 'eq-sub9-1', visitanteId: 'eq-sub9-3', placarMandante: 0, placarVisitante: 0, status: 'Agendado' },
    { id: 'part-4', categoria: 'SUB-11', data: '2026-03-15', horario: '10:30', mandanteId: 'eq-sub11-1', visitanteId: 'eq-sub11-2', placarMandante: 5, placarVisitante: 3, status: 'Finalizado' },
    { id: 'part-5', categoria: 'SUB-16', data: '2026-03-15', horario: '14:00', mandanteId: 'eq-sub16-1', visitanteId: 'eq-sub16-2', placarMandante: 4, placarVisitante: 4, status: 'Finalizado' }
  ],
  inscricoes: [
    { id: 'insc-1', nome: 'Noah Ferreira Alves', nascimento: '12/04/2017', responsavel: 'Marcos Alves', whatsapp: '(15) 99881-2233', categoria: 'SUB-9', tipo: 'Normal', status: 'Aprovada', nota: 4, pagamentoPixConfirmado: true, comprovantePix: 'Pix R$ 25 - PagSeguro (Douglas Leonel Leite)', dataEnvio: '2026-03-10T14:20:00Z' },
    { id: 'insc-2', nome: 'Thales Roberto Lima', nascimento: '25/06/2017', responsavel: 'Fernanda Lima', whatsapp: '(15) 99772-4455', categoria: 'SUB-9', tipo: 'Normal', status: 'Aprovada', nota: 3, pagamentoPixConfirmado: true, comprovantePix: 'PIX-PAGS-991244', dataEnvio: '2026-03-11T09:15:00Z' },
    { id: 'insc-3', nome: 'Mateus Henrique Souza', nascimento: '18/09/2016', responsavel: 'Juliana Souza', whatsapp: '(15) 99663-8899', categoria: 'SUB-9', tipo: 'Solidária', status: 'Pendente', nota: 3, pagamentoPixConfirmado: false, dataEnvio: '2026-03-12T11:05:00Z' }
  ]
};

// GERENCIAMENTO DE PERSISTÊNCIA DUAL (LOCALSTORAGE E API)
function carregarDB() {
  const salvo = localStorage.getItem('cruzeirinho_standalone_db');
  if (salvo) {
    try {
      const parsed = JSON.parse(salvo);
      if (parsed.equipes && parsed.atletas && parsed.inscricoes) {
        return parsed;
      }
    } catch (e) {
      console.error('Erro ao ler localStorage:', e);
    }
  }
  salvarDB(DADOS_INICIAIS);
  return JSON.parse(JSON.stringify(DADOS_INICIAIS));
}

function salvarDB(dados) {
  try {
    localStorage.setItem('cruzeirinho_standalone_db', JSON.stringify(dados));
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e);
  }
}

// Sincronização em segundo plano com o backend caso executado em ambiente com servidor Express/Firestore
async function sincronizarComServidor() {
  try {
    const res = await fetch('/api/cruzeirinho/data');
    if (res.ok) {
      const data = await res.json();
      if (data && data.equipes && data.atletas) {
        db = data;
        salvarDB(db);
        if (typeof renderizarPaginaAtual === 'function') {
          renderizarPaginaAtual();
        }
      }
    }
  } catch (e) {
    // Ambiente autônomo offline / standalone sem backend rodando
  }
}

let db = carregarDB();
let rotaAtual = 'home';
let filtroCategoria = 'TODAS';
let isAdmin = false;
let inscricaoTemporaria = null;
let deferredPrompt = null;

// ==============================================================================
// NAVEGAÇÃO E CONTROLE DE ROTAS
// ==============================================================================

function navegarPara(rota) {
  rotaAtual = rota;

  // Atualizar visual dos botões do menu superior
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-route') === rota);
  });

  const container = document.getElementById('appContainer');
  const nav = document.getElementById('mainNav');
  const footer = document.getElementById('mainFooter');

  if (isAdmin && rota.startsWith('admin_')) {
    if (nav) nav.classList.add('hidden');
    if (footer) footer.classList.add('hidden');
    if (container) container.innerHTML = renderAdminLayout(rota);
  } else {
    if (nav) nav.classList.remove('hidden');
    if (footer) footer.classList.remove('hidden');

    if (container) {
      switch (rota) {
        case 'home':
          container.innerHTML = renderHome();
          break;
        case 'inscricao':
          container.innerHTML = renderInscricaoForm('SUB-9');
          break;
        case 'team_overview':
          container.innerHTML = renderTeamOverview();
          break;
        case 'tabela':
          container.innerHTML = renderTabelaJogos();
          break;
        case 'classificacao':
          container.innerHTML = renderClassificacao();
          break;
        case 'estatisticas':
          container.innerHTML = renderEstatisticas();
          break;
        case 'admin_login':
          container.innerHTML = renderAdminLogin();
          break;
        default:
          container.innerHTML = renderHome();
      }
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderizarPaginaAtual() {
  navegarPara(rotaAtual);
}

function abrirInscricao(cat) {
  rotaAtual = 'inscricao';
  const container = document.getElementById('appContainer');
  if (container) {
    container.innerHTML = renderInscricaoForm(cat);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ==============================================================================
// PÁGINAS PÚBLICAS
// ==============================================================================

function renderHome() {
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    "⚽ *Brasileirão do Projeto Cruzeirinho 2026 - Bom de Bola, Bom na Escola* 🏆\n\nEstão abertas as inscrições oficiais para atletas SUB-9, SUB-11 e SUB-16!\n\n👉 Inscreva o atleta agora pelo site oficial:\n" + window.location.href
  )}`;

  return `
    <div class="flex flex-col items-center justify-center p-4 md:p-8 space-y-12 animate-fade-in pb-20 max-w-6xl mx-auto">
      <!-- CAPA OFICIAL DO APLICATIVO COM O BRASÃO DO PROJETO CRUZEIRINHO -->
      <div class="w-full text-center space-y-6 pt-2">
        <div class="relative inline-block mx-auto">
          <div class="absolute -inset-4 bg-gradient-to-tr from-blue-600/30 to-sky-400/30 rounded-full blur-xl animate-pulse"></div>
          
          <div class="relative p-2 rounded-full bg-gradient-to-b from-blue-100 via-white to-blue-50 ring-4 ring-blue-600/30 shadow-2xl hover:scale-105 transition-transform duration-300">
            <img src="${LOGO_URL}" onerror="this.src='../assets/aistudio/1779882264991_35858112.png'" alt="Brasão Oficial do Projeto Cruzeirinho" class="w-44 h-44 md:w-56 md:h-56 object-contain rounded-full shadow-inner bg-white">
          </div>

          <span class="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-700 text-white text-[11px] font-black uppercase tracking-wider shadow-md whitespace-nowrap border-2 border-white">
            ⚽ Temporada Oficial 2026
          </span>
        </div>

        <div class="space-y-3 max-w-3xl mx-auto pt-2">
          <div class="flex flex-wrap items-center justify-center gap-2">
            <span class="px-3.5 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-black uppercase tracking-wider">
              Projeto Social Cruzeiro Piaí • Desde 2018
            </span>
            <span class="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
              Ibiúna - SP
            </span>
          </div>

          <h1 class="text-3xl md:text-5xl lg:text-6xl font-black text-blue-950 tracking-tight leading-tight">
            Brasileirão do Projeto Cruzeirinho
          </h1>
          
          <p class="text-lg md:text-2xl text-blue-700 font-extrabold uppercase">
            "Bom de Bola, Bom na Escola"
          </p>
          
          <p class="text-sm md:text-base text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
            O maior campeonato amador de base da região! Formação com disciplina escolar, inclusão esportiva, draft equilibrado por potes técnicos e organização completa para atletas SUB-9, SUB-11 e SUB-16.
          </p>
        </div>

        <!-- Botões de Ação Rápida -->
        <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button onclick="abrirInscricao('SUB-9')" class="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
            <i data-lucide="clipboard-edit" class="w-4 h-4"></i>
            <span>Inscrever Atleta Agora</span>
          </button>

          <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer">
            <i data-lucide="share-2" class="w-4 h-4"></i>
            <span>Compartilhar no WhatsApp</span>
          </a>

          <button onclick="navegarPara('team_overview')" class="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-gray-100 text-blue-900 font-extrabold text-sm border-2 border-blue-200 shadow-sm transition-all cursor-pointer">
            <i data-lucide="bar-chart-3" class="w-4 h-4 text-blue-600"></i>
            <span>Team Overview</span>
          </button>

          <button onclick="acionarInstalacaoPWA()" class="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition-all cursor-pointer">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>Baixar App</span>
          </button>
        </div>
      </div>

      <!-- CARDS DE INSCRIÇÃO POR CATEGORIA -->
      <div class="w-full">
        <h2 class="text-2xl font-black text-gray-800 text-center mb-6">Escolha a Categoria e Inscreva o Atleta</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${renderCardCategoria('SUB-9', '6 a 9 anos', 'Iniciação esportiva divertida, desenvolvimento motor e espírito de equipe.', 'border-blue-400')}
          ${renderCardCategoria('SUB-11', '10 e 11 anos', 'Fundamentos táticos, posicionamento em campo e transição de jogo.', 'border-blue-600')}
          ${renderCardCategoria('SUB-16', '12 a 16 anos', 'Alto rendimento, disciplina tática e oportunidade de destaque esportivo.', 'border-indigo-700')}
        </div>
      </div>
    </div>
  `;
}

function renderCardCategoria(cat, faixa, desc, border) {
  const totalEquipes = db.equipes.filter((e) => e.categoria === cat).length;
  const totalAtletas = db.atletas.filter((a) => a.categoria === cat).length;

  return `
    <div onclick="abrirInscricao('${cat}')" class="bg-white rounded-3xl shadow-md hover:shadow-2xl p-6 border-t-8 ${border} cursor-pointer hover:-translate-y-1.5 transition-all text-center flex flex-col justify-between">
      <div>
        <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-700 shadow-inner">
          <i data-lucide="user-plus" class="w-8 h-8"></i>
        </div>
        <h3 class="text-2xl font-black text-gray-900">${cat}</h3>
        <p class="text-sm font-semibold text-blue-700 mt-1">Atletas de ${faixa}</p>
        <p class="text-xs text-gray-500 mt-3 leading-relaxed">${desc}</p>
        
        <div class="flex items-center justify-center gap-2 mt-4 text-[11px] font-bold text-gray-400">
          <span>${totalEquipes} Equipes</span> • <span>${totalAtletas} Atletas</span>
        </div>
      </div>
      <button class="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-sm text-sm flex items-center justify-center gap-2 cursor-pointer">
        <span>Inscrever no ${cat}</span>
        <i data-lucide="arrow-right" class="w-4 h-4"></i>
      </button>
    </div>
  `;
}

// FORMULÁRIO DE INSCRIÇÃO
function renderInscricaoForm(categoriaPadrao) {
  return `
    <div class="max-w-xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 my-8 animate-fade-in">
      <div class="text-center mb-6">
        <img src="${LOGO_URL}" onerror="this.src='../assets/aistudio/1779882264991_35858112.png'" alt="Logo" class="w-16 h-16 rounded-full mx-auto mb-3 shadow-md border-2 border-blue-400 p-0.5 bg-white">
        <span class="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black uppercase tracking-wider">
          Ficha Oficial de Inscrição 2026
        </span>
        <h2 class="text-3xl font-black text-blue-950 mt-2">Inscrição ${categoriaPadrao}</h2>
        <p class="text-xs text-gray-500 mt-1">Preencha os dados do atleta para garantir a vaga e avançar para o Pix PagSeguro.</p>
      </div>

      <form id="formInscricao" onsubmit="iniciarProcessoInscricao(event)" class="space-y-4 text-left">
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo do Atleta *</label>
          <input required type="text" id="insNome" placeholder="Ex: Thales Roberto Lima" class="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold">
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Data de Nascimento *</label>
            <input required type="text" id="insNascimento" placeholder="DD/MM/AAAA" maxlength="10" oninput="mascaraData(this)" class="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Categoria *</label>
            <select id="insCategoria" class="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold">
              <option value="SUB-9" ${categoriaPadrao === 'SUB-9' ? 'selected' : ''}>SUB-9 (6 a 9 anos)</option>
              <option value="SUB-11" ${categoriaPadrao === 'SUB-11' ? 'selected' : ''}>SUB-11 (10 a 11 anos)</option>
              <option value="SUB-16" ${categoriaPadrao === 'SUB-16' ? 'selected' : ''}>SUB-16 (12 a 16 anos)</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome do Responsável Legal *</label>
          <input required type="text" id="insResponsavel" placeholder="Ex: Fernanda Lima" class="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold">
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp para Contato *</label>
          <input required type="text" id="insWhatsapp" placeholder="(15) 99999-9999" maxlength="15" oninput="mascaraTelefone(this)" class="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold">
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo de Inscrição *</label>
          <select id="insTipo" onchange="alternarTipoInscricao(this.value)" class="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold">
            <option value="Normal">Normal — Taxa de Inscrição: R$ 25,00 (PagSeguro Pix Instantâneo)</option>
            <option value="Solidária">Solidária — Isenção Total (Requer Aprovação do Admin)</option>
          </select>
        </div>

        <!-- Box Informativo Normal -->
        <div id="boxInfoNormal" class="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
          <div class="flex items-center gap-2 font-black text-emerald-900 text-sm">
            <span class="p-1 bg-emerald-600 text-white rounded-lg text-xs">Pix</span>
            <span>Taxa de Inscrição: R$ 25,00 (Valor Definido)</span>
          </div>
          <p class="font-semibold text-emerald-800">
            Ao avançar, será exibido o <strong>QR Code oficial do PagSeguro com o valor de R$ 25,00 já definido</strong> e o código Pix Copia e Cola para <strong>Douglas Leonel Leite</strong>. Assim que fizer o Pix, a vaga do atleta é confirmada na hora!
          </p>
        </div>

        <!-- Box Informativo Solidária -->
        <div id="boxInfoSolidaria" class="hidden bg-purple-50/80 p-4 rounded-2xl border border-purple-200 text-xs text-purple-950 space-y-1.5">
          <div class="flex items-center gap-2 font-black text-purple-900 text-sm">
            <span>💙 Vaga Solidária (Projeto Social)</span>
          </div>
          <p class="font-semibold text-purple-800">
            Isenção de 100% da taxa de inscrição para famílias de baixa renda. 
            <strong>A inscrição solidária fica com status Pendente e só será confirmada após a aprovação manual do Administrador no sistema.</strong>
          </p>
        </div>

        <button type="submit" id="btnSubmitInscricao" class="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-4 rounded-xl shadow-lg transition-all text-base mt-2 cursor-pointer flex items-center justify-center gap-2">
          <i data-lucide="qr-code" class="w-5 h-5"></i>
          <span>Avançar para Pagamento Pix (R$ 25,00)</span>
        </button>
      </form>
    </div>
  `;
}

function alternarTipoInscricao(tipo) {
  const boxNormal = document.getElementById('boxInfoNormal');
  const boxSolidaria = document.getElementById('boxInfoSolidaria');
  const btn = document.getElementById('btnSubmitInscricao');

  if (tipo === 'Normal') {
    if (boxNormal) boxNormal.classList.remove('hidden');
    if (boxSolidaria) boxSolidaria.classList.add('hidden');
    if (btn) btn.innerHTML = `<i data-lucide="qr-code" class="w-5 h-5"></i><span>Avançar para Pagamento Pix (R$ 25,00)</span>`;
  } else {
    if (boxNormal) boxNormal.classList.add('hidden');
    if (boxSolidaria) boxSolidaria.classList.remove('hidden');
    if (btn) btn.innerHTML = `<i data-lucide="shield" class="w-5 h-5"></i><span>Enviar Inscrição Solidária para Análise</span>`;
  }
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// INICIAR INSCRIÇÃO
function iniciarProcessoInscricao(e) {
  e.preventDefault();
  const nome = document.getElementById('insNome').value.trim();
  const nascimento = document.getElementById('insNascimento').value.trim();
  const categoria = document.getElementById('insCategoria').value;
  const responsavel = document.getElementById('insResponsavel').value.trim();
  const whatsapp = document.getElementById('insWhatsapp').value.trim();
  const tipo = document.getElementById('insTipo').value;

  if (nascimento.length !== 10) {
    return mostrarToast('Data de nascimento deve ter 10 dígitos (DD/MM/AAAA)', 'error');
  }
  if (whatsapp.length < 14) {
    return mostrarToast('WhatsApp deve estar completo com DDD', 'error');
  }

  inscricaoTemporaria = {
    id: `insc-${Date.now()}`,
    nome,
    nascimento,
    categoria,
    responsavel,
    whatsapp,
    tipo,
    nota: 3,
    dataEnvio: new Date().toISOString()
  };

  if (tipo === 'Normal') {
    abrirPixModal();
  } else {
    // Inscrição Solidária: Salvar como Pendente (aguardando aprovação no admin)
    inscricaoTemporaria.status = 'Pendente';
    inscricaoTemporaria.pagamentoPixConfirmado = false;
    db.inscricoes.unshift(inscricaoTemporaria);
    salvarDB(db);

    // Tentar enviar para API remota caso disponível
    fetch('/api/cruzeirinho/inscricoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inscricaoTemporaria)
    }).catch(() => {});

    abrirSuccessModal(inscricaoTemporaria);
  }
}

// MODAL PIX & QR CODE
function abrirPixModal() {
  const atletaNome = document.getElementById('pixAtletaNome');
  const atletaCat = document.getElementById('pixAtletaCategoria');
  const check = document.getElementById('pixCheckConfirmado');
  const comp = document.getElementById('comprovanteInput');
  const modal = document.getElementById('pixModal');

  if (atletaNome) atletaNome.innerText = inscricaoTemporaria.nome;
  if (atletaCat) atletaCat.innerText = inscricaoTemporaria.categoria;
  if (check) check.checked = false;
  if (comp) comp.value = '';
  if (modal) modal.classList.remove('hidden');

  // Gerar QR Code Real usando a biblioteca QRCode no Canvas
  const canvas = document.getElementById('pixQrCanvas');
  if (window.QRCode && canvas) {
    QRCode.toCanvas(
      canvas,
      PIX_INFO.copiaECola,
      { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } },
      function (error) {
        if (error) console.error(error);
      }
    );
  }
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function fecharPixModal() {
  const modal = document.getElementById('pixModal');
  if (modal) modal.classList.add('hidden');
}

function copiarPixCopiaECola() {
  navigator.clipboard.writeText(PIX_INFO.copiaECola).then(() => {
    const txt = document.getElementById('txtBtnCopiaCola');
    if (txt) txt.innerText = 'Código Pix Copiado com Sucesso!';
    mostrarToast('Código Pix Copia e Cola copiado com sucesso!');
    setTimeout(() => {
      if (txt) txt.innerText = 'Copiar Código Pix Copia e Cola (R$ 25,00)';
    }, 3500);
  });
}

function copiarChaveEmail() {
  navigator.clipboard.writeText(PIX_INFO.chave).then(() => {
    mostrarToast('Chave Pix e-mail copiada com sucesso!');
  });
}

function confirmarPixEFinalizar() {
  const check = document.getElementById('pixCheckConfirmado');
  if (!check || !check.checked) {
    return mostrarToast('Marque a confirmação de que realizou o Pix de R$ 25', 'error');
  }

  const compInput = document.getElementById('comprovanteInput');
  const comp = compInput ? compInput.value.trim() : '';
  inscricaoTemporaria.status = 'Aprovada';
  inscricaoTemporaria.pagamentoPixConfirmado = true;
  inscricaoTemporaria.comprovantePix = comp || 'Pix R$ 25 - PagSeguro (Douglas Leonel Leite)';

  db.inscricoes.unshift(inscricaoTemporaria);

  // Inserir atleta automaticamente na lista oficial do campeonato
  const jaExiste = db.atletas.find(
    (a) => a.nome.toLowerCase() === inscricaoTemporaria.nome.toLowerCase() && a.categoria === inscricaoTemporaria.categoria
  );
  if (!jaExiste) {
    db.atletas.push({
      id: `atl-${Date.now()}`,
      nome: inscricaoTemporaria.nome,
      categoria: inscricaoTemporaria.categoria,
      responsavel: inscricaoTemporaria.responsavel,
      tipo: inscricaoTemporaria.tipo,
      equipeId: null,
      gols: 0,
      assistencias: 0,
      nota: 3
    });
  }

  salvarDB(db);

  // Enviar para API backend caso disponível
  fetch('/api/cruzeirinho/inscricoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inscricaoTemporaria)
  }).catch(() => {});

  fecharPixModal();
  abrirSuccessModal(inscricaoTemporaria);
}

// MODAL DE SUCESSO / COMPROVANTE
function abrirSuccessModal(insc) {
  const modal = document.getElementById('successModal');
  const content = document.getElementById('successModalContent');

  if (!modal || !content) return;

  if (insc.status === 'Aprovada') {
    content.innerHTML = `
      <div class="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xs">
        <i data-lucide="check-circle" class="w-8 h-8"></i>
      </div>
      <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
        Pix Confirmado • R$ 25,00 • PagSeguro
      </span>
      <h3 class="text-2xl font-black text-gray-900 mt-2">Inscrição Confirmada!</h3>
      <p class="text-xs font-semibold text-gray-600 mt-2 leading-relaxed">
        O Pix de <strong>R$ 25,00</strong> para Douglas Leonel Leite foi registrado. O atleta <strong>${insc.nome}</strong> está oficialmente inscrito no <strong>${insc.categoria}</strong> e pronto para a montagem dos times e draft!
      </p>
      <div class="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 my-4 text-left text-xs space-y-1.5">
        <p><span class="text-gray-400 font-bold uppercase text-[10px]">Atleta:</span> <strong class="text-gray-900">${insc.nome}</strong></p>
        <p><span class="text-gray-400 font-bold uppercase text-[10px]">Categoria:</span> <strong class="text-blue-700">${insc.categoria}</strong></p>
        <p><span class="text-gray-400 font-bold uppercase text-[10px]">Status:</span> <span class="font-black text-emerald-700">Aprovada no Campeonato</span></p>
        <p><span class="text-gray-400 font-bold uppercase text-[10px]">Beneficiário:</span> <span class="font-semibold text-gray-800">Douglas Leonel Leite (PagSeguro)</span></p>
        <p><span class="text-gray-400 font-bold uppercase text-[10px]">Protocolo:</span> <span class="font-mono text-gray-600 text-[11px]">${insc.id}</span></p>
      </div>
      <div class="space-y-2">
        <button onclick="compartilharWhatsAppComprovante('${insc.nome}', '${insc.categoria}', '${insc.id}')" class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer">
          <i data-lucide="share-2" class="w-4 h-4"></i>
          <span>Compartilhar Comprovante no WhatsApp</span>
        </button>
        <button onclick="fecharSuccessModal()" class="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer">
          Concluir e Voltar ao Início
        </button>
      </div>
    `;
  } else {
    content.innerHTML = `
      <div class="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xs">
        <i data-lucide="shield" class="w-8 h-8"></i>
      </div>
      <span class="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
        Vaga Solidária • Análise Social
      </span>
      <h3 class="text-2xl font-black text-gray-900 mt-2">Inscrição Enviada para Análise</h3>
      <p class="text-xs font-semibold text-gray-600 mt-2 leading-relaxed">
        A solicitação de isenção de <strong>${insc.nome}</strong> no <strong>${insc.categoria}</strong> foi recebida com sucesso.
      </p>
      <div class="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-bold my-4">
        ⏳ A inscrição solidária fica com status <strong>Pendente</strong> e só será confirmada após a aprovação da diretoria pelo painel administrativo.
      </div>
      <button onclick="fecharSuccessModal()" class="w-full py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer">
        Entendido!
      </button>
    `;
  }

  modal.classList.remove('hidden');
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function fecharSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) modal.classList.add('hidden');
  navegarPara('home');
}

// ==============================================================================
// DASHBOARD TEAM OVERVIEW (GOLS E ASSISTÊNCIAS AGREGADOS)
// ==============================================================================

function renderTeamOverview() {
  const agregados = db.equipes.map((eq) => {
    const jogadores = db.atletas.filter((a) => a.equipeId === eq.id);
    const totalGols = jogadores.reduce((acc, a) => acc + (a.gols || 0), 0);
    const totalAssists = jogadores.reduce((acc, a) => acc + (a.assistencias || 0), 0);
    const totalPart = totalGols + totalAssists;
    return { ...eq, totalGols, totalAssists, totalPart, totalJogadores: jogadores.length, jogadores };
  });

  return `
    <div class="max-w-6xl mx-auto p-4 md:p-8 space-y-6 animate-fade-in pb-20">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
        <div>
          <span class="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-[11px] font-black uppercase tracking-wider">
            Team Overview • Estatísticas Agregadas
          </span>
          <h2 class="text-3xl font-black text-blue-950 mt-1 flex items-center gap-2">
            <i data-lucide="bar-chart-3" class="w-7 h-7 text-blue-600"></i> Visão Geral das Equipes
          </h2>
          <p class="text-xs text-gray-500 font-semibold mt-1">
            Gols e assistências calculados automaticamente a partir das atuações de cada atleta
          </p>
        </div>

        <div class="flex gap-2 text-xs font-bold">
          ${['TODAS', 'SUB-9', 'SUB-11', 'SUB-16'].map((cat) => `
            <button onclick="filtrarOverviewCategoria('${cat}')" class="px-3 py-1.5 rounded-xl cursor-pointer ${filtroCategoria === cat ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
              ${cat}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${agregados
          .filter((eq) => filtroCategoria === 'TODAS' || eq.categoria === filtroCategoria)
          .map((eq) => `
            <div class="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 card-hover text-left flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div class="flex items-center gap-2.5">
                    <span class="w-4 h-4 rounded-full shadow-xs" style="background-color: ${eq.corPrincipal}"></span>
                    <h3 class="font-black text-gray-900 text-base">${eq.nome}</h3>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-black text-[10px]">${eq.categoria}</span>
                </div>

                <div class="grid grid-cols-3 gap-2 my-4 text-center">
                  <div class="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <span class="block text-2xl font-black text-emerald-700">${eq.totalGols}</span>
                    <span class="text-[10px] font-bold text-emerald-800 uppercase">Gols</span>
                  </div>
                  <div class="p-2.5 bg-blue-50 rounded-2xl border border-blue-100">
                    <span class="block text-2xl font-black text-blue-700">${eq.totalAssists}</span>
                    <span class="text-[10px] font-bold text-blue-800 uppercase">Passes</span>
                  </div>
                  <div class="p-2.5 bg-amber-50 rounded-2xl border border-amber-100">
                    <span class="block text-2xl font-black text-amber-700">${eq.totalPart}</span>
                    <span class="text-[10px] font-bold text-amber-800 uppercase">Part. Total</span>
                  </div>
                </div>

                <!-- Lista resumida de jogadores da equipe -->
                <div class="text-[11px] text-gray-600 space-y-1 mb-2">
                  <span class="font-bold text-gray-400 uppercase text-[9px] block">Destaques do Elenco:</span>
                  ${eq.jogadores.slice(0, 3).map((j) => `
                    <div class="flex justify-between items-center text-xs">
                      <span class="font-semibold text-gray-800">${j.nome}</span>
                      <span class="text-[10px] text-emerald-700 font-bold">${j.gols}G / ${j.assistencias}A</span>
                    </div>
                  `).join('')}
                  ${eq.jogadores.length > 3 ? `<span class="text-[10px] text-gray-400 italic block">+ ${eq.jogadores.length - 3} jogador(es)</span>` : ''}
                </div>
              </div>

              <div class="text-xs font-semibold text-gray-500 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span>Elenco escalado:</span>
                <strong class="text-gray-800 font-bold">${eq.totalJogadores} atleta(s)</strong>
              </div>
            </div>
          `).join('')}
      </div>
    </div>
  `;
}

function filtrarOverviewCategoria(cat) {
  filtroCategoria = cat;
  const container = document.getElementById('appContainer');
  if (container) {
    container.innerHTML = renderTeamOverview();
    if (window.lucide) window.lucide.createIcons();
  }
}

// ==============================================================================
// TABELA DE JOGOS & PLACARES
// ==============================================================================

function renderTabelaJogos() {
  return `
    <div class="max-w-5xl mx-auto p-4 md:p-8 space-y-6 animate-fade-in pb-20">
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 text-left">
        <h2 class="text-3xl font-black text-blue-950 flex items-center gap-2">
          <i data-lucide="calendar-days" class="w-7 h-7 text-blue-600"></i> Calendário e Placares Oficiais
        </h2>
        <p class="text-xs text-gray-500 font-semibold mt-1">Acompanhe todos os confrontos do torneio por rodada</p>
      </div>

      <div class="space-y-4">
        ${db.partidas.map((p) => {
          const m = db.equipes.find((e) => e.id === p.mandanteId) || { nome: 'Time Mandante', corPrincipal: '#1e40af' };
          const v = db.equipes.find((e) => e.id === p.visitanteId) || { nome: 'Time Visitante', corPrincipal: '#dc2626' };
          return `
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-2 text-xs font-bold text-gray-500">
                <span class="px-2.5 py-1 bg-blue-100 text-blue-900 rounded-lg">${p.categoria}</span>
                <span>${p.data} • ${p.horario}</span>
              </div>

              <div class="flex items-center gap-6 font-black text-base flex-1 justify-center">
                <div class="flex items-center gap-2 flex-1 justify-end">
                  <span class="text-right">${m.nome}</span>
                  <span class="w-3.5 h-3.5 rounded-full" style="background-color:${m.corPrincipal}"></span>
                </div>

                <div class="px-4 py-1.5 bg-gray-900 text-white rounded-xl text-lg font-mono tracking-widest shadow-inner">
                  ${p.status === 'Finalizado' ? `${p.placarMandante} - ${p.placarVisitante}` : 'VS'}
                </div>

                <div class="flex items-center gap-2 flex-1 justify-start">
                  <span class="w-3.5 h-3.5 rounded-full" style="background-color:${v.corPrincipal}"></span>
                  <span class="text-left">${v.nome}</span>
                </div>
              </div>

              <span class="text-xs font-bold px-3 py-1 rounded-full ${p.status === 'Finalizado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                ${p.status}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ==============================================================================
// CLASSIFICAÇÃO GERAL
// ==============================================================================

function renderClassificacao() {
  return `
    <div class="max-w-5xl mx-auto p-4 md:p-8 space-y-6 animate-fade-in pb-20">
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 text-left">
        <h2 class="text-3xl font-black text-blue-950 flex items-center gap-2">
          <i data-lucide="trophy" class="w-7 h-7 text-amber-500"></i> Tabela de Classificação
        </h2>
        <p class="text-xs text-gray-500 font-semibold mt-1">Pontuação atualizada do Brasileirão Cruzeirinho</p>
      </div>

      <div class="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-x-auto text-left">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-xs font-black uppercase text-gray-500">
            <tr>
              <th class="p-4">Pos</th>
              <th class="p-4">Equipe</th>
              <th class="p-4">Cat</th>
              <th class="p-4 text-center">Pts</th>
              <th class="p-4 text-center">J</th>
              <th class="p-4 text-center">V</th>
              <th class="p-4 text-center">E</th>
              <th class="p-4 text-center">D</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 font-semibold">
            ${db.equipes.slice(0, 8).map((eq, idx) => `
              <tr class="hover:bg-gray-50/80">
                <td class="p-4 font-black ${idx === 0 ? 'text-amber-500 font-extrabold text-base' : 'text-gray-700'}">${idx + 1}º</td>
                <td class="p-4 font-bold text-gray-900 flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full" style="background-color:${eq.corPrincipal}"></span>
                  <span>${eq.nome}</span>
                </td>
                <td class="p-4 text-xs"><span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">${eq.categoria}</span></td>
                <td class="p-4 text-center font-black text-blue-900 text-base">${Math.max(0, 10 - idx * 2)}</td>
                <td class="p-4 text-center">4</td>
                <td class="p-4 text-center">${Math.max(0, 3 - Math.floor(idx / 2))}</td>
                <td class="p-4 text-center">1</td>
                <td class="p-4 text-center">${Math.floor(idx / 2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ==============================================================================
// ARTILHARIA & PASSES
// ==============================================================================

function renderEstatisticas() {
  const artilheiros = [...db.atletas].sort((a, b) => b.gols - a.gols).slice(0, 6);
  const garcons = [...db.atletas].sort((a, b) => b.assistencias - a.assistencias).slice(0, 6);

  return `
    <div class="max-w-5xl mx-auto p-4 md:p-8 space-y-6 animate-fade-in pb-20">
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 text-left">
        <h2 class="text-3xl font-black text-blue-950 flex items-center gap-2">
          <i data-lucide="goal" class="w-7 h-7 text-emerald-600"></i> Líderes em Estatísticas Individuais
        </h2>
        <p class="text-xs text-gray-500 font-semibold mt-1">Artilharia de gols e passes para gols das categorias</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <h3 class="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
            <i data-lucide="flame" class="w-5 h-5 text-rose-500"></i> Top Artilheiros (Gols)
          </h3>
          <div class="space-y-3">
            ${artilheiros.map((a, i) => `
              <div class="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
                <div class="flex items-center gap-3">
                  <span class="font-black text-sm text-gray-400 w-4">${i + 1}º</span>
                  <div>
                    <strong class="text-gray-900 block text-sm">${a.nome}</strong>
                    <span class="text-gray-500 font-semibold">${a.categoria}</span>
                  </div>
                </div>
                <span class="text-base font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl">${a.gols} Gols</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <h3 class="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
            <i data-lucide="award" class="w-5 h-5 text-blue-500"></i> Líderes em Passes (Assistências)
          </h3>
          <div class="space-y-3">
            ${garcons.map((a, i) => `
              <div class="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
                <div class="flex items-center gap-3">
                  <span class="font-black text-sm text-gray-400 w-4">${i + 1}º</span>
                  <div>
                    <strong class="text-gray-900 block text-sm">${a.nome}</strong>
                    <span class="text-gray-500 font-semibold">${a.categoria}</span>
                  </div>
                </div>
                <span class="text-base font-black text-blue-700 bg-blue-100 px-3 py-1 rounded-xl">${a.assistencias} Passes</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==============================================================================
// LOGIN ADMINISTRATIVO
// ==============================================================================

function renderAdminLogin() {
  return `
    <div class="flex items-center justify-center min-h-[70vh] p-4 animate-fade-in">
      <div class="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-200 text-center">
        <img src="${LOGO_URL}" onerror="this.src='../assets/aistudio/1779882264991_35858112.png'" alt="Logo" class="w-20 h-20 rounded-full mx-auto mb-4 p-1 bg-white border-2 border-blue-400 shadow-md">
        <h2 class="text-2xl font-black text-gray-900">Acesso Administrativo</h2>
        <p class="text-xs text-gray-500 font-semibold mt-1 mb-6">Controle geral do campeonato, notas, draft e aprovações</p>

        <form onsubmit="fazerLoginAdmin(event)" class="space-y-4 text-left">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Usuário</label>
            <input required type="text" id="adminUser" placeholder="admin" class="w-full p-3.5 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Senha</label>
            <input required type="password" id="adminPass" placeholder="••••••••" class="w-full p-3.5 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <button type="submit" class="w-full py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-colors">
            Entrar no Painel
          </button>
        </form>
        <p class="text-[11px] text-gray-400 mt-4">Padrão: <strong>admin</strong> / <strong>Cruzeiro@2026</strong></p>
      </div>
    </div>
  `;
}

function fazerLoginAdmin(e) {
  e.preventDefault();
  const u = document.getElementById('adminUser').value.trim();
  const p = document.getElementById('adminPass').value.trim();

  if (u === 'admin' && p === 'Cruzeiro@2026') {
    isAdmin = true;
    mostrarToast('Login de administrador realizado com sucesso!');
    navegarPara('admin_inscricoes');
  } else {
    mostrarToast('Credenciais incorretas!', 'error');
  }
}

// ==============================================================================
// PAINEL ADMINISTRATIVO (INSCRIÇÕES, DRAFT, NOTAS, EQUIPES)
// ==============================================================================

function renderAdminLayout(subRota) {
  return `
    <div class="flex h-screen bg-gray-100 overflow-hidden text-left">
      <!-- Sidebar Desktop -->
      <div class="w-64 bg-slate-900 text-white flex flex-col shadow-2xl shrink-0">
        <div class="p-4 font-black text-sm border-b border-slate-800 flex items-center gap-2.5 text-blue-400">
          <img src="${LOGO_URL}" onerror="this.src='../assets/aistudio/1779882264991_35858112.png'" alt="Logo" class="w-8 h-8 rounded-full object-contain p-0.5 bg-white shadow-xs border border-blue-400">
          <div>
            <span class="block text-white font-black text-xs leading-none">Painel Cruzeirinho</span>
            <span class="text-[10px] text-blue-400 font-semibold">Administração 2026</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto py-3 space-y-1 text-xs font-bold">
          <button onclick="navegarPara('admin_inscricoes')" class="w-full flex items-center px-6 py-3.5 text-left cursor-pointer ${subRota === 'admin_inscricoes' ? 'bg-slate-800 border-l-4 border-blue-500 text-white' : 'text-gray-400 hover:bg-slate-800/60'}">
            <i data-lucide="clipboard-edit" class="w-4 h-4 mr-3"></i> Inscrições & Pix
          </button>
          <button onclick="navegarPara('admin_sorteio')" class="w-full flex items-center px-6 py-3.5 text-left cursor-pointer ${subRota === 'admin_sorteio' ? 'bg-slate-800 border-l-4 border-blue-500 text-white' : 'text-gray-400 hover:bg-slate-800/60'}">
            <i data-lucide="shuffle" class="w-4 h-4 mr-3"></i> Sorteio / Draft (Potes)
          </button>
          <button onclick="navegarPara('admin_atletas')" class="w-full flex items-center px-6 py-3.5 text-left cursor-pointer ${subRota === 'admin_atletas' ? 'bg-slate-800 border-l-4 border-blue-500 text-white' : 'text-gray-400 hover:bg-slate-800/60'}">
            <i data-lucide="users" class="w-4 h-4 mr-3"></i> Jogadores (Notas 1 a 5)
          </button>
          <button onclick="navegarPara('admin_equipes')" class="w-full flex items-center px-6 py-3.5 text-left cursor-pointer ${subRota === 'admin_equipes' ? 'bg-slate-800 border-l-4 border-blue-500 text-white' : 'text-gray-400 hover:bg-slate-800/60'}">
            <i data-lucide="shield" class="w-4 h-4 mr-3"></i> Equipes (Cores/Nomes)
          </button>
        </div>

        <div class="p-4 border-t border-slate-800">
          <button onclick="sairAdmin()" class="w-full py-2.5 bg-rose-600/80 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer">
            <i data-lucide="log-out" class="w-4 h-4"></i> Sair do Painel
          </button>
        </div>
      </div>

      <!-- Conteúdo Administrativo -->
      <div class="flex-1 overflow-y-auto p-6 md:p-8">
        ${renderSubRotaAdmin(subRota)}
      </div>
    </div>
  `;
}

function sairAdmin() {
  isAdmin = false;
  navegarPara('home');
}

function renderSubRotaAdmin(subRota) {
  if (subRota === 'admin_sorteio') return renderAdminDraft();
  if (subRota === 'admin_atletas') return renderAdminAtletas();
  if (subRota === 'admin_equipes') return renderAdminEquipes();
  return renderAdminInscricoes();
}

// GERENCIADOR DE INSCRIÇÕES (APROVAÇÃO SOLIDÁRIA E PIX)
function renderAdminInscricoes() {
  return `
    <div class="bg-white rounded-3xl shadow-md p-6 border border-gray-200 space-y-6">
      <div class="flex justify-between items-center pb-3 border-b border-gray-100">
        <div>
          <h2 class="text-2xl font-black text-gray-900">Gerenciador de Inscrições</h2>
          <p class="text-xs text-gray-500 font-semibold mt-0.5">Analise inscrições, aprove vagas solidárias e veja pagamentos Pix</p>
        </div>
        <span class="px-3 py-1 bg-blue-100 text-blue-900 rounded-full font-black text-xs">
          ${db.inscricoes.length} Registradas
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-gray-50 text-gray-500 uppercase font-black border-b border-gray-100">
            <tr>
              <th class="p-3.5">Atleta</th>
              <th class="p-3.5">Categoria</th>
              <th class="p-3.5 text-center">Nota (1 a 5)</th>
              <th class="p-3.5">WhatsApp</th>
              <th class="p-3.5">Tipo & Pix</th>
              <th class="p-3.5">Status</th>
              <th class="p-3.5 text-center">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${db.inscricoes.map((i) => `
              <tr class="hover:bg-gray-50">
                <td class="p-3.5 font-bold text-gray-900">
                  ${i.nome}
                  <span class="block text-[11px] font-normal text-gray-400 mt-0.5">Resp: ${i.responsavel}</span>
                </td>
                <td class="p-3.5"><span class="px-2.5 py-1 bg-blue-50 text-blue-700 font-black rounded-md">${i.categoria}</span></td>
                <td class="p-3.5 text-center">
                  <div class="flex items-center justify-center gap-1">
                    ${[1, 2, 3, 4, 5].map((star) => `
                      <button onclick="alterarNotaInscricao('${i.id}', ${star})" class="cursor-pointer ${star <= (i.nota || 3) ? 'text-amber-400 font-black text-sm' : 'text-gray-300 text-sm'}">★</button>
                    `).join('')}
                  </div>
                </td>
                <td class="p-3.5 font-semibold text-gray-700">${i.whatsapp}</td>
                <td class="p-3.5">
                  ${i.tipo === 'Solidária' ? `
                    <span class="px-2.5 py-1 rounded-md font-black bg-purple-100 text-purple-800 inline-block">Solidária (Social)</span>
                    <span class="block text-[10px] font-bold ${i.status === 'Pendente' ? 'text-amber-700' : 'text-emerald-700'} mt-1">
                      ${i.status === 'Pendente' ? '⏳ Requer Aprovação Admin' : '✓ Isenção Confirmada'}
                    </span>
                  ` : `
                    <span class="px-2.5 py-1 rounded-md font-black bg-emerald-100 text-emerald-800 inline-block">Pix R$ 25 (PagSeguro)</span>
                    <span class="block text-[10px] text-gray-500 font-semibold mt-1">Douglas Leonel Leite</span>
                  `}
                </td>
                <td class="p-3.5">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${i.status === 'Aprovada' ? 'bg-emerald-100 text-emerald-800' : (i.status === 'Recusada' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')}">
                    ${i.status}
                  </span>
                </td>
                <td class="p-3.5 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    ${i.status === 'Pendente' ? `
                      <button onclick="aprovarInscricao('${i.id}')" class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-sm cursor-pointer flex items-center gap-1">
                        <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                        <span>Aprovar Solidária</span>
                      </button>
                    ` : ''}
                    <button onclick="excluirInscricao('${i.id}')" class="p-1.5 bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 rounded-lg cursor-pointer" title="Excluir Inscrição">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function aprovarInscricao(id) {
  const insc = db.inscricoes.find((i) => i.id === id);
  if (!insc) return;
  insc.status = 'Aprovada';

  // Inserir atleta se ainda não estiver cadastrado
  const jaExiste = db.atletas.find(
    (a) => a.nome.toLowerCase() === insc.nome.toLowerCase() && a.categoria === insc.categoria
  );
  if (!jaExiste) {
    db.atletas.push({
      id: `atl-${Date.now()}`,
      nome: insc.nome,
      categoria: insc.categoria,
      responsavel: insc.responsavel,
      tipo: insc.tipo,
      equipeId: null,
      gols: 0,
      assistencias: 0,
      nota: insc.nota || 3
    });
  }

  salvarDB(db);
  mostrarToast(`Inscrição solidária de ${insc.nome} aprovada com sucesso!`);
  navegarPara('admin_inscricoes');
}

function excluirInscricao(id) {
  if (confirm('Deseja excluir este registro de inscrição permanentemente?')) {
    db.inscricoes = db.inscricoes.filter((i) => i.id !== id);
    salvarDB(db);

    fetch(`/api/cruzeirinho/inscricoes/${id}`, { method: 'DELETE' }).catch(() => {});

    mostrarToast('Inscrição excluída!');
    navegarPara('admin_inscricoes');
  }
}

function alterarNotaInscricao(id, novaNota) {
  const insc = db.inscricoes.find((i) => i.id === id);
  if (insc) {
    insc.nota = novaNota;
    const atl = db.atletas.find(
      (a) => a.nome.toLowerCase() === insc.nome.toLowerCase() && a.categoria === insc.categoria
    );
    if (atl) atl.nota = novaNota;
    salvarDB(db);
    mostrarToast(`Nota ${novaNota} atribuída para ${insc.nome}!`);
    navegarPara('admin_inscricoes');
  }
}

// DRAFT & SORTEIO POR POTES
function renderAdminDraft() {
  const livres = db.atletas.filter((a) => a.equipeId === null);
  const potes = { 5: [], 4: [], 3: [], 2: [], 1: [] };
  livres.forEach((a) => {
    const n = Math.min(5, Math.max(1, a.nota || 3));
    potes[n].push(a);
  });

  return `
    <div class="bg-white rounded-3xl shadow-md p-6 border border-gray-200 space-y-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-black text-gray-900 flex items-center gap-2">
            <i data-lucide="shuffle" class="w-6 h-6 text-blue-600"></i> Sorteio & Draft Organizado por Nível
          </h2>
          <p class="text-xs text-gray-500 font-semibold mt-0.5">
            Os atletas são distribuídos igualmente entre as equipes de acordo com as notas de 1 a 5 (Snake Draft balanceado).
          </p>
        </div>

        <div class="flex gap-2">
          <button onclick="realizarSnakeDraft()" class="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2">
            <i data-lucide="sparkles" class="w-4 h-4 text-amber-300"></i> Realizar Snake Draft Equilibrado
          </button>
          <button onclick="zerarEscalacoes()" class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs rounded-xl cursor-pointer">
            Zerar Escalações
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-5 gap-3">
        ${[5, 4, 3, 2, 1].map((n) => `
          <div class="p-4 rounded-2xl border text-xs bg-gray-50">
            <div class="flex justify-between items-center mb-2">
              <strong class="text-gray-900">Pote ${n} ★</strong>
              <span class="px-2 py-0.5 rounded-full bg-white text-gray-700 font-black border border-gray-200">${potes[n].length}</span>
            </div>
            <div class="space-y-1">
              ${potes[n].map((a) => `
                <div class="p-1.5 bg-white rounded-lg border border-gray-200 font-semibold text-gray-800 truncate" title="${a.nome}">
                  ${a.nome}
                </div>
              `).join('')}
              ${potes[n].length === 0 ? `<span class="text-[10px] text-gray-400 italic block">Nenhum</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function realizarSnakeDraft() {
  const livres = db.atletas.filter((a) => a.equipeId === null);
  if (livres.length === 0) {
    return mostrarToast('Nenhum atleta livre para sorteio.', 'error');
  }

  // Distribuir por potes entre as equipes de cada categoria
  ['SUB-9', 'SUB-11', 'SUB-16'].forEach((cat) => {
    const eqCat = db.equipes.filter((e) => e.categoria === cat);
    if (eqCat.length === 0) return;

    const atlCat = db.atletas.filter((a) => a.categoria === cat && a.equipeId === null);
    // Ordenar por nota decrescente (Pote 5 -> Pote 1)
    atlCat.sort((a, b) => (b.nota || 3) - (a.nota || 3));

    let index = 0;
    let direcao = 1;

    atlCat.forEach((atleta) => {
      atleta.equipeId = eqCat[index].id;
      index += direcao;
      if (index >= eqCat.length) {
        index = eqCat.length - 1;
        direcao = -1;
      } else if (index < 0) {
        index = 0;
        direcao = 1;
      }
    });
  });

  salvarDB(db);
  mostrarToast('Draft equilibrado realizado com sucesso!');
  navegarPara('admin_sorteio');
}

function zerarEscalacoes() {
  if (confirm('Deseja liberar todos os jogadores das equipes para voltarem ao draft?')) {
    db.atletas.forEach((a) => (a.equipeId = null));
    salvarDB(db);
    mostrarToast('Escalações resetadas!');
    navegarPara('admin_sorteio');
  }
}

// ATLETAS ADMIN (NOTAS 1 A 5 E EXCLUSÃO)
function renderAdminAtletas() {
  return `
    <div class="bg-white rounded-3xl shadow-md p-6 border border-gray-200 space-y-6">
      <div class="flex justify-between items-center pb-3 border-b border-gray-100">
        <div>
          <h2 class="text-2xl font-black text-gray-900">Gerenciador de Jogadores</h2>
          <p class="text-xs text-gray-500 font-semibold mt-0.5">Atribua notas de 1 a 5 estrelas e gerencie os garotos inscritos</p>
        </div>
        <span class="px-3 py-1 bg-blue-100 text-blue-900 rounded-full font-black text-xs">
          ${db.atletas.length} Jogadores
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-gray-50 text-gray-500 uppercase font-black border-b border-gray-100">
            <tr>
              <th class="p-3.5">Nome do Atleta</th>
              <th class="p-3.5">Categoria</th>
              <th class="p-3.5 text-center">Nota Técnica (1 a 5)</th>
              <th class="p-3.5">Equipe</th>
              <th class="p-3.5 text-center">Gols</th>
              <th class="p-3.5 text-center">Passes</th>
              <th class="p-3.5 text-center">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${db.atletas.map((a) => {
              const eq = db.equipes.find((e) => e.id === a.equipeId);
              return `
                <tr class="hover:bg-gray-50">
                  <td class="p-3.5 font-bold text-gray-900">${a.nome}</td>
                  <td class="p-3.5"><span class="px-2 py-0.5 bg-blue-50 text-blue-700 font-black rounded">${a.categoria}</span></td>
                  <td class="p-3.5 text-center">
                    <div class="flex items-center justify-center gap-1">
                      ${[1, 2, 3, 4, 5].map((star) => `
                        <button onclick="alterarNotaAtleta('${a.id}', ${star})" class="cursor-pointer ${star <= (a.nota || 3) ? 'text-amber-400 font-black text-sm' : 'text-gray-300 text-sm'}">★</button>
                      `).join('')}
                    </div>
                  </td>
                  <td class="p-3.5 font-semibold text-gray-700">${eq ? eq.nome : '<span class="text-gray-400 italic">Sem equipe</span>'}</td>
                  <td class="p-3.5 text-center font-bold">${a.gols || 0}</td>
                  <td class="p-3.5 text-center font-bold">${a.assistencias || 0}</td>
                  <td class="p-3.5 text-center">
                    <button onclick="excluirAtleta('${a.id}', '${a.nome}')" class="p-1.5 bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 rounded-lg cursor-pointer" title="Excluir Jogador">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function alterarNotaAtleta(id, n) {
  const a = db.atletas.find((item) => item.id === id);
  if (a) {
    a.nota = n;
    // Sincroniza nota na inscrição correspondente
    const insc = db.inscricoes.find((i) => i.nome.toLowerCase() === a.nome.toLowerCase() && i.categoria === a.categoria);
    if (insc) insc.nota = n;

    salvarDB(db);
    mostrarToast(`Nota ${n} atribuída para ${a.nome}!`);
    navegarPara('admin_atletas');
  }
}

function excluirAtleta(id, nome) {
  if (confirm(`Deseja excluir permanentemente o atleta "${nome}"?`)) {
    db.atletas = db.atletas.filter((a) => a.id !== id);
    salvarDB(db);

    fetch(`/api/cruzeirinho/atletas/${id}`, { method: 'DELETE' }).catch(() => {});

    mostrarToast(`Atleta "${nome}" excluído!`);
    navegarPara('admin_atletas');
  }
}

// EQUIPES ADMIN (EDITAR E EXCLUIR)
function renderAdminEquipes() {
  return `
    <div class="bg-white rounded-3xl shadow-md p-6 border border-gray-200 space-y-6">
      <div class="flex justify-between items-center pb-3 border-b border-gray-100">
        <div>
          <h2 class="text-2xl font-black text-gray-900">Gerenciador de Equipes</h2>
          <p class="text-xs text-gray-500 font-semibold mt-0.5">Edite nomes, cores e exclua equipes do torneio</p>
        </div>
        <button onclick="adicionarNovaEquipePrompt()" class="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer">
          <i data-lucide="plus" class="w-4 h-4"></i> Adicionar Equipe
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${db.equipes.map((eq) => `
          <div class="p-4 rounded-2xl border border-gray-200 bg-gray-50 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <input type="color" value="${eq.corPrincipal}" onchange="atualizarCorEquipe('${eq.id}', this.value)" class="w-7 h-7 rounded-lg cursor-pointer border-0">
                <input type="text" value="${eq.nome}" onchange="atualizarNomeEquipe('${eq.id}', this.value)" class="p-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 outline-none">
              </div>
              <button onclick="excluirEquipe('${eq.id}', '${eq.nome}')" class="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 cursor-pointer" title="Excluir Equipe">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
            <div class="text-[11px] font-semibold text-gray-500 flex justify-between items-center">
              <span>Categoria:</span>
              <span class="font-bold text-blue-700">${eq.categoria}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function adicionarNovaEquipePrompt() {
  const nome = prompt('Nome da nova equipe:');
  if (!nome || !nome.trim()) return;

  const categoria = prompt('Categoria (SUB-9, SUB-11 ou SUB-16):', 'SUB-9');
  if (!categoria || !['SUB-9', 'SUB-11', 'SUB-16'].includes(categoria.toUpperCase())) {
    return mostrarToast('Categoria inválida! Use SUB-9, SUB-11 ou SUB-16', 'error');
  }

  const novaEquipe = {
    id: `eq-${Date.now()}`,
    nome: nome.trim(),
    categoria: categoria.toUpperCase(),
    corPrincipal: '#1e40af'
  };

  db.equipes.push(novaEquipe);
  salvarDB(db);

  fetch('/api/cruzeirinho/equipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(novaEquipe)
  }).catch(() => {});

  mostrarToast(`Equipe "${novaEquipe.nome}" cadastrada com sucesso!`);
  navegarPara('admin_equipes');
}

function atualizarNomeEquipe(id, novoNome) {
  const eq = db.equipes.find((e) => e.id === id);
  if (eq && novoNome.trim()) {
    eq.nome = novoNome.trim();
    salvarDB(db);
    mostrarToast('Nome da equipe atualizado!');
  }
}

function atualizarCorEquipe(id, novaCor) {
  const eq = db.equipes.find((e) => e.id === id);
  if (eq) {
    eq.corPrincipal = novaCor;
    salvarDB(db);
    mostrarToast('Cor atualizada!');
  }
}

function excluirEquipe(id, nome) {
  if (confirm(`Deseja excluir a equipe "${nome}"? Os jogadores vinculados serão liberados para o draft.`)) {
    db.equipes = db.equipes.filter((e) => e.id !== id);
    db.atletas.forEach((a) => {
      if (a.equipeId === id) a.equipeId = null;
    });
    salvarDB(db);

    fetch(`/api/cruzeirinho/equipes/${id}`, { method: 'DELETE' }).catch(() => {});

    mostrarToast(`Equipe "${nome}" excluída!`);
    navegarPara('admin_equipes');
  }
}

// ==============================================================================
// UTILITÁRIOS, MÁSCARAS E COMPARTILHAMENTO
// ==============================================================================

function mascaraData(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
  if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5);
  input.value = v.slice(0, 10);
}

function mascaraTelefone(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length > 2) v = '(' + v.slice(0, 2) + ') ' + v.slice(2);
  if (v.length > 9) v = v.slice(0, 10) + '-' + v.slice(10);
  input.value = v.slice(0, 15);
}

function mostrarToast(msg, tipo = 'success') {
  const toast = document.getElementById('toast');
  const txt = document.getElementById('toastMsg');
  const icone = document.getElementById('toastIcon');

  if (!toast || !txt) return;

  txt.innerText = msg;
  if (tipo === 'error') {
    toast.className = 'fixed bottom-5 right-5 bg-rose-600 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 z-50 animate-bounce';
    if (icone) icone.setAttribute('data-lucide', 'alert-circle');
  } else {
    toast.className = 'fixed bottom-5 right-5 bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 z-50 animate-bounce';
    if (icone) icone.setAttribute('data-lucide', 'check-circle');
  }

  toast.classList.remove('hidden');
  if (window.lucide) {
    window.lucide.createIcons();
  }
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

function copiarLinkSite() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    mostrarToast('Link copiado para a área de transferência!');
  });
}

function compartilharWhatsAppGeral() {
  const msg = `⚽ *Brasileirão do Projeto Cruzeirinho 2026* 🏆\n\nConfira tabela, classificação e inscrições abertas pelo site:\n${window.location.href}`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
}

function compartilharWhatsAppComprovante(nome, cat, id) {
  const msg = `⚽ *Comprovante de Inscrição - Brasileirão do Projeto Cruzeirinho 2026*\n\n✅ Atleta: ${nome}\n🏆 Categoria: ${cat}\n💰 Pagamento Pix: R$ 25,00 confirmado para Douglas Leonel Leite (PagSeguro)\n📋 Protocolo: ${id}`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
}

function acionarInstalacaoPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        mostrarToast('Aplicativo instalado com sucesso!');
      }
      deferredPrompt = null;
    });
  } else {
    mostrarToast('Para instalar: no menu do navegador toque em "Adicionar à tela inicial" 📱');
  }
}

// Captura do evento de instalação PWA
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

// INICIALIZAÇÃO DA APLICAÇÃO
document.addEventListener('DOMContentLoaded', () => {
  sincronizarComServidor();
  navegarPara('home');
});
