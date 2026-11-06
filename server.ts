import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  Firestore 
} from 'firebase/firestore';
import {
  COOKIE_NAME,
  verifyAdminPassword,
  createAdminSession,
  validateSessionToken,
  deleteSessionFromFirestore,
  createRequireAdminMiddleware,
  getWebAuthnCredentials,
  saveWebAuthnCredential,
  deleteWebAuthnCredential,
  saveChallenge,
  getChallenge,
  getRpId,
  getExpectedOrigin,
} from './src/server/auth.js';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import {
  criarCobrancaPixPagBank,
  consultarPedidoPagBank,
  PAGBANK_CHAVE_FALLBACK,
  PAGBANK_TITULAR_FALLBACK,
  PAGBANK_COPIA_E_COLA_FALLBACK,
} from './src/server/pagbank.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());

// Backup local file persistence
const DATA_FILE = path.resolve(__dirname, 'cruzeirinho_db.json');

// Inicialização do Firebase Firestore no servidor para persistência permanente no Cloud Run
let firestoreDb: Firestore | null = null;
try {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const fbApp = getApps().length > 0 ? getApp() : initializeApp(rawConfig);
    firestoreDb = getFirestore(fbApp, rawConfig.firestoreDatabaseId);
    console.log('[Cruzeirinho Server] Conectado ao Firebase Firestore persistente:', rawConfig.firestoreDatabaseId);
  } else {
    console.warn('[Cruzeirinho Server] firebase-applet-config.json não encontrado. Usando arquivo local.');
  }
} catch (err) {
  console.error('[Cruzeirinho Server] Erro ao conectar ao Firestore:', err);
}

// Middleware de proteção administrativa
const requireAdmin = createRequireAdminMiddleware(() => firestoreDb);

interface Inscrição {
  id: string;
  codigoInscricao: string; // Ex: CRUZ-2026-X7K9
  nome: string;
  nascimento: string;
  responsavel: string;
  whatsapp: string;
  categoria: 'SUB-9' | 'SUB-11' | 'SUB-16';
  tipo: 'Normal' | 'Solidária';
  status: 'Pendente' | 'Aprovada' | 'Recusada' | 'Aguardando Pagamento' | 'Aguardando Conferência' | 'Comprovante Rejeitado' | 'Pagamento Aprovado' | 'Inscrição Confirmada' | 'Inscrição Solidária em Análise' | 'Inscrição Solidária Aprovada' | 'Pagamento Recusado ou Cancelado';
  statusPagamento?: 'PENDENTE' | 'AGUARDANDO_CONFERENCIA' | 'PAGO' | 'RECUSADO' | 'ISENTO_SOLIDARIO';
  nota?: number; // 1 a 5
  pagamentoPixConfirmado?: boolean;
  comprovantePix?: string;
  comprovanteArquivo?: string;
  comprovanteNomeArquivo?: string;
  comprovanteDataEnvio?: string;
  motivoRejeicao?: string;
  valor?: number;
  pagbankOrderId?: string;
  pagbankQrCodeText?: string;
  pagbankQrCodeImage?: string;
  pagbankExpiracao?: string;
  dataEnvio: string;
  dataAtualizacao?: string;
}

interface Atleta {
  id: string;
  nome: string;
  categoria: 'SUB-9' | 'SUB-11' | 'SUB-16';
  responsavel?: string;
  tipo?: string;
  equipeId: string | null;
  gols: number;
  assistencias: number;
  nota: number; // 1 a 5 (default 3)
}

interface Equipe {
  id: string;
  nome: string;
  categoria: 'SUB-9' | 'SUB-11' | 'SUB-16';
  corPrincipal: string;
}

interface Partida {
  id: string;
  categoria: 'SUB-9' | 'SUB-11' | 'SUB-16';
  data: string;
  horario: string;
  mandanteId: string;
  visitanteId: string;
  placarMandante: number;
  placarVisitante: number;
  status: 'Agendado' | 'Finalizado';
}

interface CruzeirinhoDB {
  inscricoes: Inscrição[];
  atletas: Atleta[];
  equipes: Equipe[];
  partidas: Partida[];
}

function getInitialDatabase(): CruzeirinhoDB {
  const equipes: Equipe[] = [
    // SUB-9
    { id: 'eq-sub9-1', nome: 'Cruzeirinho FC', categoria: 'SUB-9', corPrincipal: '#1e40af' },
    { id: 'eq-sub9-2', nome: 'Estrela da Vila', categoria: 'SUB-9', corPrincipal: '#dc2626' },
    { id: 'eq-sub9-3', nome: 'Tigres da Colina', categoria: 'SUB-9', corPrincipal: '#059669' },
    { id: 'eq-sub9-4', nome: 'Falcões Dourados', categoria: 'SUB-9', corPrincipal: '#d97706' },

    // SUB-11
    { id: 'eq-sub11-1', nome: 'Cruzeirinho Master', categoria: 'SUB-11', corPrincipal: '#1d4ed8' },
    { id: 'eq-sub11-2', nome: 'União da Quebrada', categoria: 'SUB-11', corPrincipal: '#7c3aed' },
    { id: 'eq-sub11-3', nome: 'Juventude FC', categoria: 'SUB-11', corPrincipal: '#16a34a' },
    { id: 'eq-sub11-4', nome: 'Alvinegro da Colina', categoria: 'SUB-11', corPrincipal: '#334155' },

    // SUB-16
    { id: 'eq-sub16-1', nome: 'Cruzeirinho Elite', categoria: 'SUB-16', corPrincipal: '#1e3a8a' },
    { id: 'eq-sub16-2', nome: 'Atlético Esperança', categoria: 'SUB-16', corPrincipal: '#b91c1c' },
    { id: 'eq-sub16-3', nome: 'Nova Geração', categoria: 'SUB-16', corPrincipal: '#ea580c' },
    { id: 'eq-sub16-4', nome: 'Real da Serra', categoria: 'SUB-16', corPrincipal: '#0d9488' },
  ];

  const atletas: Atleta[] = [
    // SUB-9 Atletas
    { id: 'atl-1', nome: 'Enzo Gabriel Santos', categoria: 'SUB-9', responsavel: 'Maria Santos', tipo: 'Normal', equipeId: 'eq-sub9-1', gols: 5, assistencias: 3, nota: 5 },
    { id: 'atl-2', nome: 'Arthur Miguel Pereira', categoria: 'SUB-9', responsavel: 'Carlos Pereira', tipo: 'Solidária', equipeId: 'eq-sub9-1', gols: 3, assistencias: 2, nota: 4 },
    { id: 'atl-3', nome: 'Davi Lucca Ribeiro', categoria: 'SUB-9', responsavel: 'Renata Ribeiro', tipo: 'Normal', equipeId: 'eq-sub9-2', gols: 4, assistencias: 1, nota: 4 },
    { id: 'atl-4', nome: 'Bernardo Silva Ramos', categoria: 'SUB-9', responsavel: 'Fábio Ramos', tipo: 'Normal', equipeId: 'eq-sub9-2', gols: 2, assistencias: 4, nota: 3 },
    { id: 'atl-5', nome: 'Theo Henrique Lima', categoria: 'SUB-9', responsavel: 'Ana Lima', tipo: 'Solidária', equipeId: 'eq-sub9-3', gols: 3, assistencias: 2, nota: 4 },
    { id: 'atl-6', nome: 'Gael Silveira Rocha', categoria: 'SUB-9', responsavel: 'Juliana Rocha', tipo: 'Normal', equipeId: 'eq-sub9-4', gols: 1, assistencias: 2, nota: 2 },
    { id: 'atl-7', nome: 'Lucas Gabriel Moreira', categoria: 'SUB-9', responsavel: 'Patrícia Moreira', tipo: 'Solidária', equipeId: null, gols: 0, assistencias: 0, nota: 3 },
    { id: 'atl-8', nome: 'Noah Ferreira Alves', categoria: 'SUB-9', responsavel: 'Marcos Alves', tipo: 'Normal', equipeId: null, gols: 0, assistencias: 0, nota: 4 },
    { id: 'atl-19', nome: 'Thales Roberto Lima', categoria: 'SUB-9', responsavel: 'Fernanda Lima', tipo: 'Normal', equipeId: null, gols: 0, assistencias: 0, nota: 3 },

    // SUB-11 Atletas
    { id: 'atl-9', nome: 'Cauã Rodrigues Costa', categoria: 'SUB-11', responsavel: 'Fernanda Costa', tipo: 'Normal', equipeId: 'eq-sub11-1', gols: 6, assistencias: 4, nota: 5 },
    { id: 'atl-10', nome: 'Matheus Felipe Barbosa', categoria: 'SUB-11', responsavel: 'José Barbosa', tipo: 'Solidária', equipeId: 'eq-sub11-1', gols: 4, assistencias: 3, nota: 4 },
    { id: 'atl-11', nome: 'Samuel de Oliveira', categoria: 'SUB-11', responsavel: 'Cláudia Oliveira', tipo: 'Normal', equipeId: 'eq-sub11-2', gols: 5, assistencias: 2, nota: 3 },
    { id: 'atl-12', nome: 'Heitor Vasconcelos', categoria: 'SUB-11', responsavel: 'Daniel Vasconcelos', tipo: 'Solidária', equipeId: 'eq-sub11-3', gols: 2, assistencias: 5, nota: 4 },
    { id: 'atl-13', nome: 'Pedro Henrique Dias', categoria: 'SUB-11', responsavel: 'Luciana Dias', tipo: 'Normal', equipeId: null, gols: 0, assistencias: 0, nota: 2 },

    // SUB-16 Atletas
    { id: 'atl-14', nome: 'Gabriel Felipe Souza', categoria: 'SUB-16', responsavel: 'Valéria Souza', tipo: 'Normal', equipeId: 'eq-sub16-1', gols: 7, assistencias: 5, nota: 5 },
    { id: 'atl-15', nome: 'Leonardo Guimarães', categoria: 'SUB-16', responsavel: 'Roberto Guimarães', tipo: 'Normal', equipeId: 'eq-sub16-1', gols: 4, assistencias: 2, nota: 4 },
    { id: 'atl-16', nome: 'Gustavo Henrique Borges', categoria: 'SUB-16', responsavel: 'Sônia Borges', tipo: 'Solidária', equipeId: 'eq-sub16-2', gols: 5, assistencias: 3, nota: 4 },
    { id: 'atl-17', nome: 'Rafael Nogueira Prado', categoria: 'SUB-16', responsavel: 'Paulo Prado', tipo: 'Normal', equipeId: 'eq-sub16-3', gols: 3, assistencias: 4, nota: 3 },
    { id: 'atl-18', nome: 'Felipe Martins Pires', categoria: 'SUB-16', responsavel: 'Sandra Pires', tipo: 'Solidária', equipeId: null, gols: 0, assistencias: 0, nota: 3 },
  ];

  const inscricoes: Inscrição[] = [
    {
      id: 'insc-1',
      codigoInscricao: 'CRUZ-2026-ENZ9',
      nome: 'Enzo Gabriel Santos',
      nascimento: '12/04/2016',
      responsavel: 'Maria Santos',
      whatsapp: '(15) 99876-5432',
      categoria: 'SUB-9',
      tipo: 'Normal',
      status: 'Inscrição Confirmada',
      statusPagamento: 'PAGO',
      valor: 25.00,
      pagamentoPixConfirmado: true,
      comprovantePix: 'Pix R$ 25 - PagBank (Douglas Leonel Leite)',
      nota: 5,
      dataEnvio: '2026-03-01T10:30:00Z',
    },
    {
      id: 'insc-2',
      codigoInscricao: 'CRUZ-2026-LUC9',
      nome: 'Lucas Gabriel Moreira',
      nascimento: '05/08/2017',
      responsavel: 'Patrícia Moreira',
      whatsapp: '(15) 99765-4321',
      categoria: 'SUB-9',
      tipo: 'Solidária',
      status: 'Inscrição Solidária Aprovada',
      statusPagamento: 'ISENTO_SOLIDARIO',
      valor: 0.00,
      nota: 3,
      dataEnvio: '2026-03-02T14:15:00Z',
    },
    {
      id: 'insc-6',
      codigoInscricao: 'CRUZ-2026-THA9',
      nome: 'Thales Roberto Lima',
      nascimento: '14/06/2016',
      responsavel: 'Fernanda Lima',
      whatsapp: '(15) 99811-2233',
      categoria: 'SUB-9',
      tipo: 'Normal',
      status: 'Inscrição Confirmada',
      statusPagamento: 'PAGO',
      valor: 25.00,
      pagamentoPixConfirmado: true,
      comprovantePix: 'Pix R$ 25 - PagBank (Douglas Leonel Leite)',
      nota: 3,
      dataEnvio: '2026-03-03T10:00:00Z',
    },
    {
      id: 'insc-3',
      codigoInscricao: 'CRUZ-2026-VIT9',
      nome: 'Vitor Hugo Campos',
      nascimento: '20/11/2016',
      responsavel: 'Eduardo Campos',
      whatsapp: '(15) 99654-3210',
      categoria: 'SUB-9',
      tipo: 'Normal',
      status: 'Aguardando Pagamento',
      statusPagamento: 'PENDENTE',
      valor: 25.00,
      pagbankQrCodeText: PAGBANK_COPIA_E_COLA_FALLBACK,
      nota: 4,
      dataEnvio: '2026-03-10T09:20:00Z',
    },
    {
      id: 'insc-4',
      codigoInscricao: 'CRUZ-2026-NIC1',
      nome: 'Nicolas Ryan Azevedo',
      nascimento: '15/02/2014',
      responsavel: 'Camila Azevedo',
      whatsapp: '(15) 99123-4567',
      categoria: 'SUB-11',
      tipo: 'Solidária',
      status: 'Inscrição Solidária em Análise',
      statusPagamento: 'ISENTO_SOLIDARIO',
      valor: 0.00,
      nota: 3,
      dataEnvio: '2026-03-11T16:40:00Z',
    },
    {
      id: 'insc-5',
      codigoInscricao: 'CRUZ-2026-MAT6',
      nome: 'Matheus Castro Neves',
      nascimento: '08/09/2009',
      responsavel: 'Rodrigo Neves',
      whatsapp: '(15) 99345-6789',
      categoria: 'SUB-16',
      tipo: 'Normal',
      status: 'Aguardando Pagamento',
      statusPagamento: 'PENDENTE',
      valor: 25.00,
      pagbankQrCodeText: PAGBANK_COPIA_E_COLA_FALLBACK,
      nota: 4,
      dataEnvio: '2026-03-12T11:05:00Z',
    },
  ];

  const partidas: Partida[] = [
    // SUB-9 Jogos
    {
      id: 'part-sub9-1',
      categoria: 'SUB-9',
      data: '2026-03-15',
      horario: '08:30',
      mandanteId: 'eq-sub9-1',
      visitanteId: 'eq-sub9-2',
      placarMandante: 4,
      placarVisitante: 2,
      status: 'Finalizado',
    },
    {
      id: 'part-sub9-2',
      categoria: 'SUB-9',
      data: '2026-03-15',
      horario: '09:30',
      mandanteId: 'eq-sub9-3',
      visitanteId: 'eq-sub9-4',
      placarMandante: 3,
      placarVisitante: 1,
      status: 'Finalizado',
    },
    {
      id: 'part-sub9-3',
      categoria: 'SUB-9',
      data: '2026-03-22',
      horario: '08:30',
      mandanteId: 'eq-sub9-1',
      visitanteId: 'eq-sub9-3',
      placarMandante: 0,
      placarVisitante: 0,
      status: 'Agendado',
    },
    {
      id: 'part-sub9-4',
      categoria: 'SUB-9',
      data: '2026-03-22',
      horario: '09:30',
      mandanteId: 'eq-sub9-2',
      visitanteId: 'eq-sub9-4',
      placarMandante: 0,
      placarVisitante: 0,
      status: 'Agendado',
    },

    // SUB-11 Jogos
    {
      id: 'part-sub11-1',
      categoria: 'SUB-11',
      data: '2026-03-15',
      horario: '10:30',
      mandanteId: 'eq-sub11-1',
      visitanteId: 'eq-sub11-2',
      placarMandante: 5,
      placarVisitante: 3,
      status: 'Finalizado',
    },
    {
      id: 'part-sub11-2',
      categoria: 'SUB-11',
      data: '2026-03-15',
      horario: '11:30',
      mandanteId: 'eq-sub11-3',
      visitanteId: 'eq-sub11-4',
      placarMandante: 2,
      placarVisitante: 2,
      status: 'Finalizado',
    },
    {
      id: 'part-sub11-3',
      categoria: 'SUB-11',
      data: '2026-03-22',
      horario: '10:30',
      mandanteId: 'eq-sub11-1',
      visitanteId: 'eq-sub11-3',
      placarMandante: 0,
      placarVisitante: 0,
      status: 'Agendado',
    },

    // SUB-16 Jogos
    {
      id: 'part-sub16-1',
      categoria: 'SUB-16',
      data: '2026-03-14',
      horario: '14:00',
      mandanteId: 'eq-sub16-1',
      visitanteId: 'eq-sub16-2',
      placarMandante: 3,
      placarVisitante: 1,
      status: 'Finalizado',
    },
    {
      id: 'part-sub16-2',
      categoria: 'SUB-16',
      data: '2026-03-14',
      horario: '15:30',
      mandanteId: 'eq-sub16-3',
      visitanteId: 'eq-sub16-4',
      placarMandante: 2,
      placarVisitante: 0,
      status: 'Finalizado',
    },
    {
      id: 'part-sub16-3',
      categoria: 'SUB-16',
      data: '2026-03-21',
      horario: '14:00',
      mandanteId: 'eq-sub16-1',
      visitanteId: 'eq-sub16-3',
      placarMandante: 0,
      placarVisitante: 0,
      status: 'Agendado',
    },
  ];

  return { inscricoes, atletas, equipes, partidas };
}

function loadDatabase(): CruzeirinhoDB {
  let database: CruzeirinhoDB;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      database = JSON.parse(raw);
    } else {
      database = getInitialDatabase();
    }
  } catch (e) {
    console.error('Error reading database file, using fallback initial data:', e);
    database = getInitialDatabase();
  }

  // Garantir integridade dos atletas, filtrar registros vazios e validar notas de 1 a 5
  if (database.atletas) {
    database.atletas = database.atletas
      .filter((a) => a && (a.nome || a.id))
      .map((a, idx) => ({
        id: a.id || `atl-${idx}-${Date.now()}`,
        nome: (typeof a.nome === 'string' && a.nome.trim()) ? a.nome.trim() : `Atleta ${idx + 1}`,
        categoria: (['SUB-9', 'SUB-11', 'SUB-16'].includes(a.categoria) ? a.categoria : 'SUB-9') as any,
        responsavel: typeof a.responsavel === 'string' ? a.responsavel : '',
        tipo: a.tipo || 'Normal',
        equipeId: a.equipeId || null,
        gols: typeof a.gols === 'number' ? a.gols : 0,
        assistencias: typeof a.assistencias === 'number' ? a.assistencias : 0,
        nota: (typeof a.nota === 'number' && a.nota >= 1 && a.nota <= 5) ? a.nota : 3,
      }));
  }
  if (database.inscricoes) {
    database.inscricoes.forEach((i) => {
      if (typeof i.nota !== 'number' || i.nota < 1 || i.nota > 5) {
        i.nota = 3;
      }
    });
  }

  saveDatabase(database);
  return database;
}

function saveDatabase(data: CruzeirinhoDB) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving local database file:', e);
  }
}

// In-memory working copy
let db: CruzeirinhoDB = loadDatabase();

// --- FIRESTORE SYNCHRONIZATION AND SEEDING ---
async function seedFirestore(data: CruzeirinhoDB) {
  if (!firestoreDb) return;
  try {
    const batch = writeBatch(firestoreDb);

    data.equipes.forEach((e) => {
      batch.set(doc(firestoreDb!, 'equipes', e.id), e);
    });

    data.atletas.forEach((a) => {
      batch.set(doc(firestoreDb!, 'atletas', a.id), a);
    });

    data.inscricoes.forEach((i) => {
      batch.set(doc(firestoreDb!, 'inscricoes', i.id), i);
    });

    data.partidas.forEach((p) => {
      batch.set(doc(firestoreDb!, 'partidas', p.id), p);
    });

    await batch.commit();
    console.log('[Cruzeirinho Server] Seed inicial gravado no Firestore com sucesso.');
  } catch (err) {
    console.error('[Cruzeirinho Server] Erro ao gravar seed no Firestore:', err);
  }
}

async function syncWithFirestore() {
  if (!firestoreDb) return;
  try {
    const [inscSnap, atlSnap, eqSnap, partSnap] = await Promise.all([
      getDocs(collection(firestoreDb, 'inscricoes')),
      getDocs(collection(firestoreDb, 'atletas')),
      getDocs(collection(firestoreDb, 'equipes')),
      getDocs(collection(firestoreDb, 'partidas')),
    ]);

    const isFirestoreEmpty = inscSnap.empty && atlSnap.empty && eqSnap.empty && partSnap.empty;

    if (isFirestoreEmpty) {
      console.log('[Cruzeirinho Server] Firestore vazio. Migrando dados iniciais para a nuvem persistente...');
      await seedFirestore(db);
    } else {
      const inscricoes: Inscrição[] = [];
      inscSnap.forEach((d) => inscricoes.push(d.data() as Inscrição));

      const atletas: Atleta[] = [];
      atlSnap.forEach((d) => atletas.push(d.data() as Atleta));

      const equipes: Equipe[] = [];
      eqSnap.forEach((d) => equipes.push(d.data() as Equipe));

      const partidas: Partida[] = [];
      partSnap.forEach((d) => partidas.push(d.data() as Partida));

      // Ordenar inscrições por data mais recente
      inscricoes.sort((a, b) => new Date(b.dataEnvio || 0).getTime() - new Date(a.dataEnvio || 0).getTime());

      // Garantir integridade de atletas, notas, códigos únicos e status de pagamento
      atletas.forEach((a, idx) => {
        if (!a.nome || typeof a.nome !== 'string' || !a.nome.trim()) {
          a.nome = `Atleta ${idx + 1}`;
        }
        if (!a.categoria || !['SUB-9', 'SUB-11', 'SUB-16'].includes(a.categoria)) {
          a.categoria = 'SUB-9';
        }
        if (typeof a.nota !== 'number' || a.nota < 1 || a.nota > 5) a.nota = 3;
        if (typeof a.gols !== 'number') a.gols = 0;
        if (typeof a.assistencias !== 'number') a.assistencias = 0;
        if (a.equipeId === undefined) a.equipeId = null;
        if (!a.id) a.id = `atl-${idx}-${Date.now()}`;
      });
      inscricoes.forEach((i, idx) => {
        if (!i.nome || typeof i.nome !== 'string' || !i.nome.trim()) {
          i.nome = `Atleta Inscrito ${idx + 1}`;
        }
        if (typeof i.nota !== 'number' || i.nota < 1 || i.nota > 5) i.nota = 3;
        if (!i.codigoInscricao) {
          const rawSuffix = (i.id || `REG${idx}`).replace(/\D/g, '').slice(-4).padStart(4, '0');
          i.codigoInscricao = `CRUZ-2026-${rawSuffix.toUpperCase()}`;
        }
        if (!i.statusPagamento) {
          if (i.tipo === 'Solidária') {
            i.statusPagamento = 'ISENTO_SOLIDARIO';
          } else if (i.status === 'Aprovada' || i.status === 'Inscrição Confirmada' || i.status === 'Pagamento Aprovado' || i.pagamentoPixConfirmado) {
            i.statusPagamento = 'PAGO';
          } else {
            i.statusPagamento = 'PENDENTE';
          }
        }
        if (!i.valor) {
          i.valor = i.tipo === 'Solidária' ? 0 : 25.00;
        }
      });

      db = { inscricoes, atletas, equipes, partidas };
      saveDatabase(db);
      console.log(`[Cruzeirinho Server] Dados restaurados do Firestore: ${inscricoes.length} inscrições, ${atletas.length} atletas, ${equipes.length} equipes, ${partidas.length} partidas.`);
    }
  } catch (err) {
    console.error('[Cruzeirinho Server] Erro ao sincronizar com Firestore:', err);
  }
}

// Helpers seguros para escrita no Firestore em background (remove campos undefined)
function saveFirestoreDoc(coll: string, id: string, data: any) {
  if (firestoreDb) {
    try {
      const cleanData = JSON.parse(JSON.stringify(data));
      setDoc(doc(firestoreDb, coll, id), cleanData).catch((err) => {
        console.error(`[Cruzeirinho Server] Erro ao salvar em ${coll}/${id}:`, err);
      });
    } catch (e) {
      console.error(`[Cruzeirinho Server] Erro ao sanitizar dados para ${coll}/${id}:`, e);
    }
  }
}

function deleteFirestoreDoc(coll: string, id: string) {
  if (firestoreDb) {
    deleteDoc(doc(firestoreDb, coll, id)).catch((err) => {
      console.error(`[Cruzeirinho Server] Erro ao excluir de ${coll}/${id}:`, err);
    });
  }
}

// --- API ROUTES ---

// GET /api/cruzeirinho/data - Fetch all collections (Public)
app.get('/api/cruzeirinho/data', (_req, res) => {
  res.json(db);
});

// --- AUTHENTICATION & SESSIONS ---

// POST /api/auth/login - Admin login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const expectedUser = process.env.ADMIN_USERNAME || 'admin';

    if (!username || !password) {
      return res.status(400).json({ error: 'Informe usuário e senha.' });
    }

    if (username.trim() !== expectedUser || !verifyAdminPassword(password.trim())) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    const session = await createAdminSession(req, res, firestoreDb);
    console.log(`[Auth] Administrador autenticado: ${session.username} - Sessão criada com sucesso.`);
    res.json({
      success: true,
      token: session.token,
      username: session.username,
      expiresAt: session.expiresAt,
    });
  } catch (err: any) {
    console.error('[Auth] Erro no login:', err);
    res.status(500).json({ error: 'Erro interno ao autenticar.' });
  }
});

// GET /api/auth/me - Check current admin session on device
app.get('/api/auth/me', async (req, res) => {
  try {
    const tokenFromCookie = req.cookies?.[COOKIE_NAME];
    const authHeader = req.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      return res.json({ authenticated: false });
    }

    const session = await validateSessionToken(firestoreDb, token);
    if (!session) {
      res.clearCookie(COOKIE_NAME, { path: '/' });
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      username: session.username,
      token: session.token,
      expiresAt: session.expiresAt,
    });
  } catch (err: any) {
    console.error('[Auth] Erro ao validar sessão:', err);
    res.json({ authenticated: false });
  }
});

// POST /api/auth/logout - Terminate session
app.post('/api/auth/logout', async (req, res) => {
  try {
    const tokenFromCookie = req.cookies?.[COOKIE_NAME];
    const authHeader = req.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const token = tokenFromCookie || tokenFromHeader;

    if (token) {
      await deleteSessionFromFirestore(firestoreDb, token);
    }
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
  } catch (err: any) {
    console.error('[Auth] Erro no logout:', err);
    res.json({ success: true });
  }
});

// POST /api/auth/revoke-sessions - Revoke all stored sessions (Protected)
app.post('/api/auth/revoke-sessions', requireAdmin, async (_req, res) => {
  try {
    if (firestoreDb) {
      const snap = await getDocs(collection(firestoreDb, 'admin_sessions'));
      const batch = writeBatch(firestoreDb);
      snap.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ success: true, message: 'Todas as sessões foram revogadas com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao revogar sessões: ' + err.message });
  }
});

// --- WEBAUTHN / BIOMETRIA PASSKEY ---

// ALL /api/auth/webauthn/register-options - Start passkey registration (Protected)
app.all('/api/auth/webauthn/register-options', requireAdmin, async (req, res) => {
  try {
    const rpID = getRpId(req);
    const creds = await getWebAuthnCredentials(firestoreDb);
    const options = await generateRegistrationOptions({
      rpName: 'Brasileirão Cruzeirinho 2026',
      rpID,
      userID: new TextEncoder().encode('admin-cruzeirinho-master'),
      userName: 'admin',
      userDisplayName: 'Administrador Cruzeirinho',
      attestationType: 'none',
      excludeCredentials: creds.map(c => ({
        id: c.id,
        transports: c.transports as any,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    saveChallenge('reg_admin', options.challenge);
    res.json(options);
  } catch (err: any) {
    console.error('[WebAuthn] Erro ao gerar opções de registro:', err);
    res.status(500).json({ error: 'Erro ao iniciar registro biométrico: ' + err.message });
  }
});

// POST /api/auth/webauthn/register-verify - Complete passkey registration (Protected)
// POST /api/auth/webauthn/register-verify - Complete passkey registration (Protected)
app.post('/api/auth/webauthn/register-verify', requireAdmin, async (req, res) => {
  try {
    const expectedChallenge = getChallenge('reg_admin');
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Desafio WebAuthn expirado ou inválido. Tente novamente.' });
    }

    const expectedOrigin = getExpectedOrigin(req);
    const expectedRPID = getRpId(req);
    const regResponse = req.body.response || req.body;

    const verification = await verifyRegistrationResponse({
      response: regResponse,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      const deviceName = req.body.deviceName || 'Meu Dispositivo Móvel';

      await saveWebAuthnCredential(firestoreDb, {
        id: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64url'),
        counter: credential.counter,
        transports: regResponse?.response?.transports || [],
        deviceName,
        createdAt: new Date().toISOString(),
      });

      console.log(`[WebAuthn] Nova credencial biométrica registrada com sucesso: ${deviceName}`);
      return res.json({ success: true, verified: true, deviceName });
    }

    res.status(400).json({ success: false, verified: false, error: 'Falha na verificação da biometria.' });
  } catch (err: any) {
    console.error('[WebAuthn] Erro na verificação de registro:', err);
    res.status(500).json({ success: false, error: 'Erro ao validar biometria: ' + err.message });
  }
});

// ALL /api/auth/webauthn/login-options - Start biometric login
app.all('/api/auth/webauthn/login-options', async (req, res) => {
  try {
    const rpID = getRpId(req);
    const creds = await getWebAuthnCredentials(firestoreDb);

    if (creds.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Nenhuma biometria cadastrada neste servidor ainda. Entre com seu usuário e senha primeiro para cadastrar seu celular.' 
      });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: creds.map(c => ({
        id: c.id,
        transports: c.transports as any,
      })),
      userVerification: 'preferred',
    });

    saveChallenge('auth_admin', options.challenge);
    res.json(options);
  } catch (err: any) {
    console.error('[WebAuthn] Erro ao gerar opções de login:', err);
    res.status(500).json({ success: false, error: 'Erro ao iniciar login biométrico: ' + err.message });
  }
});

// POST /api/auth/webauthn/login-verify - Complete biometric login
app.post('/api/auth/webauthn/login-verify', async (req, res) => {
  try {
    const expectedChallenge = getChallenge('auth_admin');
    if (!expectedChallenge) {
      return res.status(400).json({ success: false, error: 'Desafio biométrico expirado. Tente novamente.' });
    }

    const expectedOrigin = getExpectedOrigin(req);
    const expectedRPID = getRpId(req);
    const creds = await getWebAuthnCredentials(firestoreDb);
    const authResponse = req.body.response || req.body;
    const cred = creds.find(c => c.id === authResponse.id);

    if (!cred) {
      return res.status(400).json({ success: false, error: 'Dispositivo biométrico não reconhecido.' });
    }

    const verification = await verifyAuthenticationResponse({
      response: authResponse,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      credential: {
        id: cred.id,
        publicKey: Buffer.from(cred.publicKey, 'base64url'),
        counter: cred.counter,
      },
    });

    if (verification.verified) {
      cred.counter = verification.authenticationInfo.newCounter;
      await saveWebAuthnCredential(firestoreDb, cred);
      const session = await createAdminSession(req, res, firestoreDb);
      console.log(`[WebAuthn] Login biométrico bem-sucedido via ${cred.deviceName || 'Passkey'}`);
      return res.json({
        success: true,
        verified: true,
        token: session.token,
        username: session.username,
        expiresAt: session.expiresAt,
      });
    }

    res.status(400).json({ success: false, verified: false, error: 'Falha na verificação biométrica.' });
  } catch (err: any) {
    console.error('[WebAuthn] Erro no login biométrico:', err);
    res.status(500).json({ success: false, error: 'Erro ao verificar biometria: ' + err.message });
  }
});

// GET /api/auth/webauthn/credentials - List registered passkeys (Protected)
app.get('/api/auth/webauthn/credentials', requireAdmin, async (_req, res) => {
  const creds = await getWebAuthnCredentials(firestoreDb);
  res.json(creds.map(c => ({ id: c.id, deviceName: c.deviceName, createdAt: c.createdAt })));
});

// DELETE /api/auth/webauthn/credentials/:id - Remove passkey (Protected)
app.delete('/api/auth/webauthn/credentials/:id', requireAdmin, async (req, res) => {
  await deleteWebAuthnCredential(firestoreDb, req.params.id);
  res.json({ success: true });
});

// --- INSCRIÇÕES & PAGBANK ---

// POST /api/cruzeirinho/inscricoes - Submit new registration & generate PagBank Pix (Public)
app.post('/api/cruzeirinho/inscricoes', async (req, res) => {
  try {
    const { nome, nascimento, responsavel, whatsapp, categoria, tipo, nota } = req.body;
    if (!nome || !nascimento || !responsavel || !whatsapp || !categoria) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const isSolidaria = tipo === 'Solidária';
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const codigoInscricao = `CRUZ-2026-${randomSuffix}`;
    const inscricaoId = `insc-${Date.now()}`;
    const appUrl = getExpectedOrigin(req);

    let status: Inscrição['status'] = isSolidaria ? 'Inscrição Solidária em Análise' : 'Aguardando Pagamento';
    let statusPagamento: Inscrição['statusPagamento'] = isSolidaria ? 'ISENTO_SOLIDARIO' : 'PENDENTE';
    let pagbankOrderId: string | undefined = undefined;
    let pagbankQrCodeText: string | undefined = undefined;
    let pagbankQrCodeImage: string | undefined = undefined;
    let pagbankExpiracao: string | undefined = undefined;

    if (!isSolidaria) {
      pagbankOrderId = `PIX-${codigoInscricao}`;
      pagbankQrCodeText = PAGBANK_COPIA_E_COLA_FALLBACK;
    }

    const novaInscricao: Inscrição = {
      id: inscricaoId,
      codigoInscricao,
      nome: nome.trim(),
      nascimento: nascimento.trim(),
      responsavel: responsavel.trim(),
      whatsapp: whatsapp.trim(),
      categoria,
      tipo: isSolidaria ? 'Solidária' : 'Normal',
      status,
      statusPagamento,
      valor: isSolidaria ? 0 : 25.00,
      pagbankOrderId,
      pagbankQrCodeText,
      nota: nota ? Math.min(5, Math.max(1, Number(nota))) : 3,
      dataEnvio: new Date().toISOString(),
    };

    db.inscricoes.unshift(novaInscricao);
    saveFirestoreDoc('inscricoes', novaInscricao.id, novaInscricao);
    saveDatabase(db);

    console.log(`[Cruzeirinho] Inscrição salva com sucesso: ${codigoInscricao} - ${nome} (${categoria}) - Status: ${status}`);
    res.status(201).json(novaInscricao);
  } catch (err: any) {
    console.error('[Cruzeirinho] Erro ao cadastrar inscrição:', err);
    res.status(500).json({ error: 'Erro ao registrar inscrição: ' + err.message });
  }
});

// POST /api/cruzeirinho/inscricoes/:id/comprovante - Submit receipt for verification (Public)
app.post('/api/cruzeirinho/inscricoes/:id/comprovante', async (req, res) => {
  try {
    const { id } = req.params;
    const { comprovanteArquivo, comprovanteNomeArquivo } = req.body;

    if (!comprovanteArquivo) {
      return res.status(400).json({ error: 'Arquivo do comprovante é obrigatório' });
    }

    const insc = db.inscricoes.find(i => i.id === id || i.codigoInscricao === id);
    if (!insc) {
      return res.status(404).json({ error: 'Inscrição não encontrada' });
    }

    insc.status = 'Aguardando Conferência';
    insc.statusPagamento = 'AGUARDANDO_CONFERENCIA';
    insc.comprovanteArquivo = comprovanteArquivo;
    insc.comprovanteNomeArquivo = comprovanteNomeArquivo || 'comprovante-pix';
    insc.comprovanteDataEnvio = new Date().toISOString();
    insc.comprovantePix = `Comprovante enviado (${comprovanteNomeArquivo || 'arquivo'})`;
    delete (insc as any).motivoRejeicao;
    insc.dataAtualizacao = new Date().toISOString();

    saveFirestoreDoc('inscricoes', insc.id, insc);
    saveDatabase(db);

    console.log(`[Cruzeirinho] Comprovante enviado para ${insc.codigoInscricao} (${insc.nome}). Aguardando conferência.`);
    res.json({
      success: true,
      message: 'Comprovante enviado! Seu pagamento está aguardando conferência pela organização.',
      inscricao: insc,
    });
  } catch (err: any) {
    console.error('[Cruzeirinho] Erro ao salvar comprovante:', err);
    res.status(500).json({ error: 'Erro ao salvar comprovante: ' + err.message });
  }
});

// POST /api/cruzeirinho/inscricoes/:id/rejeitar-comprovante - Reject receipt (Admin only)
app.post('/api/cruzeirinho/inscricoes/:id/rejeitar-comprovante', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;
  const insc = db.inscricoes.find(i => i.id === id);
  if (!insc) return res.status(404).json({ error: 'Inscrição não encontrada' });

  insc.status = 'Comprovante Rejeitado';
  insc.statusPagamento = 'PENDENTE';
  insc.pagamentoPixConfirmado = false;
  insc.motivoRejeicao = motivo || 'Comprovante não aprovado pela organização. Por favor, confira o valor e reenvie.';
  insc.dataAtualizacao = new Date().toISOString();

  saveFirestoreDoc('inscricoes', insc.id, insc);
  saveDatabase(db);

  console.log(`[Cruzeirinho] Comprovante de ${insc.codigoInscricao} (${insc.nome}) foi rejeitado pelo administrador.`);
  res.json({ success: true, message: 'Comprovante rejeitado com sucesso.' });
});

// GET /api/cruzeirinho/inscricoes/consultar/:busca - Retrieve/resume registration (Public)
app.get('/api/cruzeirinho/inscricoes/consultar/:busca', (req, res) => {
  const rawBusca = (req.params.busca || '').trim().toLowerCase();
  const cleanDigits = rawBusca.replace(/\D/g, '');

  const inscricao = db.inscricoes.find(i => {
    if (i.codigoInscricao && i.codigoInscricao.toLowerCase() === rawBusca) return true;
    if (i.id && i.id.toLowerCase() === rawBusca) return true;
    if (cleanDigits.length >= 8) {
      const cleanPhone = (i.whatsapp || '').replace(/\D/g, '');
      if (cleanPhone.includes(cleanDigits) || cleanDigits.includes(cleanPhone)) return true;
    }
    return false;
  });

  if (!inscricao) {
    return res.status(404).json({ error: 'Inscrição não encontrada para esta busca.' });
  }

  res.json(inscricao);
});

// GET /api/pagbank/consultar/:id - Poll payment status for registration (Public)
app.get('/api/pagbank/consultar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const insc = db.inscricoes.find(i => i.id === id || i.codigoInscricao === id || i.pagbankOrderId === id);
    if (!insc) {
      return res.status(404).json({ error: 'Inscrição não encontrada' });
    }

    if (insc.statusPagamento === 'PAGO' || insc.status === 'Pagamento Aprovado' || insc.status === 'Inscrição Confirmada') {
      return res.json({
        pago: true,
        status: insc.status,
        statusPagamento: 'PAGO',
        codigoInscricao: insc.codigoInscricao,
      });
    }

    if (insc.pagbankOrderId) {
      const consulta = await consultarPedidoPagBank(insc.pagbankOrderId);
      if (consulta && consulta.isPago) {
        insc.statusPagamento = 'PAGO';
        insc.status = 'Pagamento Aprovado';
        insc.pagamentoPixConfirmado = true;
        insc.dataAtualizacao = new Date().toISOString();

        const existingAtleta = db.atletas.find(a => a.nome.toLowerCase() === insc.nome.toLowerCase() && a.categoria === insc.categoria);
        if (!existingAtleta) {
          const novoAtleta: Atleta = {
            id: `atl-${Date.now()}`,
            nome: insc.nome,
            categoria: insc.categoria,
            responsavel: insc.responsavel,
            tipo: insc.tipo,
            equipeId: null,
            gols: 0,
            assistencias: 0,
            nota: insc.nota || 3,
          };
          db.atletas.push(novoAtleta);
          saveFirestoreDoc('atletas', novoAtleta.id, novoAtleta);
        }

        saveFirestoreDoc('inscricoes', insc.id, insc);
        saveDatabase(db);

        console.log(`[PagBank] Pagamento aprovado na API PagBank para ${insc.codigoInscricao}`);
        return res.json({
          pago: true,
          status: insc.status,
          statusPagamento: 'PAGO',
          codigoInscricao: insc.codigoInscricao,
        });
      }
    }

    res.json({
      pago: false,
      status: insc.status,
      statusPagamento: insc.statusPagamento || 'PENDENTE',
      codigoInscricao: insc.codigoInscricao,
      motivoRejeicao: insc.motivoRejeicao,
    });
  } catch (err: any) {
    console.error('[PagBank] Erro ao consultar status:', err);
    res.status(500).json({ error: 'Erro ao consultar status.' });
  }
});

// POST /api/pagbank/webhook - PagBank official webhook notification (Public)
app.post('/api/pagbank/webhook', (req, res) => {
  try {
    const payload = req.body;
    console.log('[PagBank Webhook] Notificação recebida:', JSON.stringify(payload).substring(0, 300));

    const referenceId = payload?.reference_id || payload?.order?.reference_id;
    const orderId = payload?.id || payload?.order?.id;
    const charge = payload?.charges?.[0] || payload?.charge;
    const chargeStatus = charge?.status || payload?.status;
    const isPaid = chargeStatus === 'PAID' || chargeStatus === 'AUTHORIZED';

    if (referenceId || orderId) {
      const insc = db.inscricoes.find(i =>
        (referenceId && i.codigoInscricao === referenceId) ||
        (orderId && i.pagbankOrderId === orderId)
      );

      if (insc) {
        if (isPaid) {
          insc.statusPagamento = 'PAGO';
          insc.status = 'Pagamento Aprovado';
          insc.pagamentoPixConfirmado = true;
          insc.dataAtualizacao = new Date().toISOString();

          const existingAtleta = db.atletas.find(a => a.nome.toLowerCase() === insc.nome.toLowerCase() && a.categoria === insc.categoria);
          if (!existingAtleta) {
            const novoAtleta: Atleta = {
              id: `atl-${Date.now()}`,
              nome: insc.nome,
              categoria: insc.categoria,
              responsavel: insc.responsavel,
              tipo: insc.tipo,
              equipeId: null,
              gols: 0,
              assistencias: 0,
              nota: insc.nota || 3,
            };
            db.atletas.push(novoAtleta);
            saveFirestoreDoc('atletas', novoAtleta.id, novoAtleta);
          }

          saveFirestoreDoc('inscricoes', insc.id, insc);
          saveDatabase(db);
          console.log(`[PagBank Webhook] Inscrição confirmada por pagamento: ${insc.codigoInscricao} (${insc.nome})`);
        } else if (chargeStatus === 'DECLINED' || chargeStatus === 'CANCELED') {
          insc.statusPagamento = 'RECUSADO';
          insc.status = 'Pagamento Recusado ou Cancelado';
          saveFirestoreDoc('inscricoes', insc.id, insc);
          saveDatabase(db);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('[PagBank Webhook] Erro ao processar:', err);
    res.status(200).json({ received: false, error: err.message });
  }
});

// POST /api/cruzeirinho/inscricoes/:id/confirmar-pagamento-manual (Admin only)
app.post('/api/cruzeirinho/inscricoes/:id/confirmar-pagamento-manual', requireAdmin, (req, res) => {
  const { id } = req.params;
  const insc = db.inscricoes.find(i => i.id === id);
  if (!insc) return res.status(404).json({ error: 'Inscrição não encontrada' });

  insc.status = 'Pagamento Aprovado';
  insc.statusPagamento = 'PAGO';
  insc.pagamentoPixConfirmado = true;
  insc.comprovantePix = 'Confirmado manualmente pelo Administrador';
  insc.dataAtualizacao = new Date().toISOString();

  const existingAtleta = db.atletas.find(a => a.nome.toLowerCase() === insc.nome.toLowerCase() && a.categoria === insc.categoria);
  if (!existingAtleta) {
    const novoAtleta: Atleta = {
      id: `atl-${Date.now()}`,
      nome: insc.nome,
      categoria: insc.categoria,
      responsavel: insc.responsavel,
      tipo: insc.tipo,
      equipeId: null,
      gols: 0,
      assistencias: 0,
      nota: insc.nota || 3,
    };
    db.atletas.push(novoAtleta);
    saveFirestoreDoc('atletas', novoAtleta.id, novoAtleta);
  }

  saveFirestoreDoc('inscricoes', insc.id, insc);
  saveDatabase(db);
  res.json({ success: true, inscricao: insc, atletas: db.atletas });
});

// POST /api/cruzeirinho/inscricoes/:id/aprovar-solidaria (Admin only)
app.post('/api/cruzeirinho/inscricoes/:id/aprovar-solidaria', requireAdmin, (req, res) => {
  const { id } = req.params;
  const insc = db.inscricoes.find(i => i.id === id);
  if (!insc) return res.status(404).json({ error: 'Inscrição não encontrada' });

  insc.status = 'Inscrição Solidária Aprovada';
  insc.statusPagamento = 'ISENTO_SOLIDARIO';
  insc.dataAtualizacao = new Date().toISOString();

  const existingAtleta = db.atletas.find(a => a.nome.toLowerCase() === insc.nome.toLowerCase() && a.categoria === insc.categoria);
  if (!existingAtleta) {
    const novoAtleta: Atleta = {
      id: `atl-${Date.now()}`,
      nome: insc.nome,
      categoria: insc.categoria,
      responsavel: insc.responsavel,
      tipo: 'Solidária',
      equipeId: null,
      gols: 0,
      assistencias: 0,
      nota: insc.nota || 3,
    };
    db.atletas.push(novoAtleta);
    saveFirestoreDoc('atletas', novoAtleta.id, novoAtleta);
  }

  saveFirestoreDoc('inscricoes', insc.id, insc);
  saveDatabase(db);
  res.json({ success: true, inscricao: insc, atletas: db.atletas });
});

// PUT /api/cruzeirinho/inscricoes/:id - Update registration status or grade (Admin only)
app.put('/api/cruzeirinho/inscricoes/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status, nota } = req.body;

  const insc = db.inscricoes.find((i) => i.id === id);
  if (!insc) {
    return res.status(404).json({ error: 'Inscrição não encontrada' });
  }

  if (status !== undefined) {
    insc.status = status;
    if (status === 'Pagamento Aprovado' || status === 'Inscrição Confirmada' || status === 'Aprovada') {
      insc.statusPagamento = 'PAGO';
      insc.pagamentoPixConfirmado = true;
    } else if (status === 'Inscrição Solidária Aprovada') {
      insc.statusPagamento = 'ISENTO_SOLIDARIO';
    } else if (status === 'Pagamento Recusado ou Cancelado' || status === 'Recusada') {
      insc.statusPagamento = 'RECUSADO';
    }
  }

  let atletaAlterado: Atleta | null = null;

  if (nota !== undefined) {
    insc.nota = Math.min(5, Math.max(1, Number(nota)));
    const atleta = db.atletas.find((a) => a.nome.toLowerCase() === insc.nome.toLowerCase() && a.categoria === insc.categoria);
    if (atleta) {
      atleta.nota = insc.nota;
      atletaAlterado = atleta;
    }
  }

  const isAprovadoStatus = status === 'Aprovada' || status === 'Pagamento Aprovado' || status === 'Inscrição Confirmada' || status === 'Inscrição Solidária Aprovada';
  if (isAprovadoStatus) {
    const existing = db.atletas.find((a) => a.nome.toLowerCase() === insc.nome.toLowerCase() && a.categoria === insc.categoria);
    if (!existing) {
      const novoAtleta: Atleta = {
        id: `atl-${Date.now()}`,
        nome: insc.nome,
        categoria: insc.categoria,
        responsavel: insc.responsavel,
        tipo: insc.tipo,
        equipeId: null,
        gols: 0,
        assistencias: 0,
        nota: insc.nota || 3,
      };
      db.atletas.push(novoAtleta);
      atletaAlterado = novoAtleta;
    } else if (insc.nota) {
      existing.nota = insc.nota;
      atletaAlterado = existing;
    }
  }

  saveFirestoreDoc('inscricoes', insc.id, insc);
  if (atletaAlterado) {
    saveFirestoreDoc('atletas', atletaAlterado.id, atletaAlterado);
  }

  saveDatabase(db);
  res.json({ inscricao: insc, atletas: db.atletas });
});

// DELETE /api/cruzeirinho/inscricoes/:id - Delete registration (Admin only)
app.delete('/api/cruzeirinho/inscricoes/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.inscricoes = db.inscricoes.filter((i) => i.id !== id);
  deleteFirestoreDoc('inscricoes', id);
  saveDatabase(db);
  res.json({ success: true });
});

// POST /api/cruzeirinho/equipes - Create team (Admin only)
app.post('/api/cruzeirinho/equipes', requireAdmin, (req, res) => {
  const { nome, categoria, corPrincipal } = req.body;
  if (!nome || !categoria) {
    return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
  }

  const novaEquipe: Equipe = {
    id: `eq-${Date.now()}`,
    nome: nome.trim(),
    categoria,
    corPrincipal: corPrincipal || '#1e3a8a',
  };

  db.equipes.push(novaEquipe);
  saveFirestoreDoc('equipes', novaEquipe.id, novaEquipe);
  saveDatabase(db);
  res.status(201).json(novaEquipe);
});

// PUT /api/cruzeirinho/equipes/:id - Edit team (Admin only)
app.put('/api/cruzeirinho/equipes/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const equipe = db.equipes.find((e) => e.id === id);
  if (!equipe) {
    return res.status(404).json({ error: 'Equipe não encontrada' });
  }

  const { nome, categoria, corPrincipal } = req.body;
  if (nome) equipe.nome = nome.trim();
  if (categoria) equipe.categoria = categoria;
  if (corPrincipal) equipe.corPrincipal = corPrincipal;

  saveFirestoreDoc('equipes', equipe.id, equipe);
  saveDatabase(db);
  res.json({ success: true, equipe });
});

// DELETE /api/cruzeirinho/equipes/:id - Delete team and unassign athletes (Admin only)
app.delete('/api/cruzeirinho/equipes/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.equipes = db.equipes.filter((e) => e.id !== id);
  deleteFirestoreDoc('equipes', id);

  db.atletas.forEach((a) => {
    if (a.equipeId === id) {
      a.equipeId = null;
      saveFirestoreDoc('atletas', a.id, a);
    }
  });

  const removidas = db.partidas.filter((p) => p.mandanteId === id || p.visitanteId === id);
  removidas.forEach((p) => deleteFirestoreDoc('partidas', p.id));
  db.partidas = db.partidas.filter((p) => p.mandanteId !== id && p.visitanteId !== id);

  saveDatabase(db);
  res.json({ success: true });
});

// DELETE /api/cruzeirinho/atletas/:id - Delete athlete permanently (Admin only)
app.delete('/api/cruzeirinho/atletas/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.atletas = db.atletas.filter((a) => a.id !== id);
  deleteFirestoreDoc('atletas', id);
  saveDatabase(db);
  res.json({ success: true });
});

// POST /api/cruzeirinho/atletas/novo - Create athlete manually (Admin only)
app.post('/api/cruzeirinho/atletas/novo', requireAdmin, (req, res) => {
  const { nome, categoria, responsavel, equipeId, nota } = req.body;
  if (!nome || !categoria) {
    return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
  }

  const novoAtleta: Atleta = {
    id: `atl-${Date.now()}`,
    nome: nome.trim(),
    categoria,
    responsavel: responsavel ? responsavel.trim() : '',
    tipo: 'Normal',
    equipeId: equipeId || null,
    gols: 0,
    assistencias: 0,
    nota: nota ? Math.min(5, Math.max(1, Number(nota))) : 3,
  };

  db.atletas.push(novoAtleta);
  saveFirestoreDoc('atletas', novoAtleta.id, novoAtleta);
  saveDatabase(db);
  res.status(201).json(novoAtleta);
});

// PUT /api/cruzeirinho/atletas/:id - Update athlete info (Admin only)
app.put('/api/cruzeirinho/atletas/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const atleta = db.atletas.find((a) => a.id === id);
  if (!atleta) {
    return res.status(404).json({ error: 'Atleta não encontrado' });
  }

  if (req.body.nome !== undefined) atleta.nome = req.body.nome.trim();
  if (req.body.categoria !== undefined) atleta.categoria = req.body.categoria;
  if (req.body.responsavel !== undefined) atleta.responsavel = req.body.responsavel.trim();
  if (req.body.gols !== undefined) atleta.gols = Math.max(0, req.body.gols);
  if (req.body.assistencias !== undefined) atleta.assistencias = Math.max(0, req.body.assistencias);
  if (req.body.equipeId !== undefined) atleta.equipeId = req.body.equipeId;
  if (req.body.nota !== undefined) {
    atleta.nota = Math.min(5, Math.max(1, Number(req.body.nota)));
    const insc = db.inscricoes.find((i) => (i.nome || '').toLowerCase() === (atleta.nome || '').toLowerCase() && i.categoria === atleta.categoria);
    if (insc) {
      insc.nota = atleta.nota;
      saveFirestoreDoc('inscricoes', insc.id, insc);
    }
  }

  saveFirestoreDoc('atletas', atleta.id, atleta);
  saveDatabase(db);
  res.json(atleta);
});

// POST /api/cruzeirinho/sorteio/zerar - Reset draft for category (Admin only)
app.post('/api/cruzeirinho/sorteio/zerar', requireAdmin, (req, res) => {
  const { categoria } = req.body;
  if (!categoria) return res.status(400).json({ error: 'Categoria obrigatória' });

  if (firestoreDb) {
    const batch = writeBatch(firestoreDb);
    db.atletas.forEach((a) => {
      if (a.categoria === categoria) {
        a.equipeId = null;
        batch.set(doc(firestoreDb!, 'atletas', a.id), a);
      }
    });
    batch.commit().catch(console.error);
  } else {
    db.atletas.forEach((a) => {
      if (a.categoria === categoria) {
        a.equipeId = null;
      }
    });
  }

  saveDatabase(db);
  res.json({ success: true, atletas: db.atletas });
});

// POST /api/cruzeirinho/sorteio - Execute balanced draft (Admin only)
app.post('/api/cruzeirinho/sorteio', requireAdmin, (req, res) => {
  const { categoria, modo = 'equilibrado' } = req.body;
  if (!categoria) return res.status(400).json({ error: 'Categoria obrigatória' });

  const equipesCat = db.equipes.filter((e) => e.categoria === categoria);
  const atletasLivres = db.atletas.filter((a) => a.categoria === categoria && !a.equipeId);

  if (equipesCat.length === 0) {
    return res.status(400).json({ error: 'Cadastre equipes nesta categoria primeiro!' });
  }
  if (atletasLivres.length === 0) {
    return res.status(400).json({ error: 'Nenhum atleta aprovado sem equipe nesta categoria.' });
  }

  if (modo === 'equilibrado') {
    const potes: { [nota: number]: Atleta[] } = { 5: [], 4: [], 3: [], 2: [], 1: [] };
    atletasLivres.forEach((a) => {
      const n = Math.min(5, Math.max(1, a.nota || 3));
      potes[n].push(a);
    });

    [5, 4, 3, 2, 1].forEach((nota) => {
      const arr = potes[nota];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    });

    const filaDraft = [
      ...potes[5],
      ...potes[4],
      ...potes[3],
      ...potes[2],
      ...potes[1],
    ];

    let teamIdx = 0;
    let direcao = 1;

    filaDraft.forEach((atleta) => {
      atleta.equipeId = equipesCat[teamIdx].id;
      teamIdx += direcao;
      if (teamIdx >= equipesCat.length) {
        teamIdx = equipesCat.length - 1;
        direcao = -1;
      } else if (teamIdx < 0) {
        teamIdx = 0;
        direcao = 1;
      }
    });
  } else {
    const embaralhados = [...atletasLivres];
    for (let i = embaralhados.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [embaralhados[i], embaralhados[j]] = [embaralhados[j], embaralhados[i]];
    }

    let equipeIdx = 0;
    embaralhados.forEach((atleta) => {
      atleta.equipeId = equipesCat[equipeIdx].id;
      equipeIdx = (equipeIdx + 1) % equipesCat.length;
    });
  }

  if (firestoreDb) {
    const batch = writeBatch(firestoreDb);
    db.atletas.forEach((a) => {
      batch.set(doc(firestoreDb!, 'atletas', a.id), a);
    });
    batch.commit().catch(console.error);
  }

  saveDatabase(db);
  res.json({ success: true, atletas: db.atletas });
});

// POST /api/cruzeirinho/partidas - Schedule match (Admin only)
app.post('/api/cruzeirinho/partidas', requireAdmin, (req, res) => {
  const { categoria, data, horario, mandanteId, visitanteId } = req.body;
  if (!categoria || !data || !horario || !mandanteId || !visitanteId) {
    return res.status(400).json({ error: 'Preencha todos os campos da partida' });
  }
  if (mandanteId === visitanteId) {
    return res.status(400).json({ error: 'Escolha duas equipes diferentes' });
  }

  const novaPartida: Partida = {
    id: `part-${Date.now()}`,
    categoria,
    data,
    horario,
    mandanteId,
    visitanteId,
    placarMandante: 0,
    placarVisitante: 0,
    status: 'Agendado',
  };

  db.partidas.push(novaPartida);
  saveFirestoreDoc('partidas', novaPartida.id, novaPartida);
  saveDatabase(db);
  res.status(201).json(novaPartida);
});

// PUT /api/cruzeirinho/partidas/:id - Update match score (Admin only)
app.put('/api/cruzeirinho/partidas/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const partida = db.partidas.find((p) => p.id === id);
  if (!partida) return res.status(404).json({ error: 'Partida não encontrada' });

  if (req.body.placarMandante !== undefined) partida.placarMandante = Number(req.body.placarMandante);
  if (req.body.placarVisitante !== undefined) partida.placarVisitante = Number(req.body.placarVisitante);
  if (req.body.status !== undefined) partida.status = req.body.status;

  saveFirestoreDoc('partidas', partida.id, partida);
  saveDatabase(db);
  res.json(partida);
});

// DELETE /api/cruzeirinho/partidas/:id - Delete match (Admin only)
app.delete('/api/cruzeirinho/partidas/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.partidas = db.partidas.filter((p) => p.id !== id);
  deleteFirestoreDoc('partidas', id);
  saveDatabase(db);
  res.json({ success: true });
});

// POST /api/cruzeirinho/reset-seed - Reset to factory seed data (Admin only)
app.post('/api/cruzeirinho/reset-seed', requireAdmin, async (_req, res) => {
  db = getInitialDatabase();
  saveDatabase(db);
  if (firestoreDb) {
    await seedFirestore(db);
  }
  res.json({ success: true, message: 'Dados restaurados com sucesso!' });
});

// Setup Vite dev server or static files in production
async function startServer() {
  // Sincroniza dados persistentes do Cloud Firestore antes de abrir as portas
  await syncWithFirestore();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Brasileirão Cruzeirinho server rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
