import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';

function resolveUrl(path: string): string {
  if (typeof window === 'undefined') {
    return `http://localhost:3000${path}`;
  }
  return path;
}

export interface Inscrição {
  id: string;
  codigoInscricao?: string; // Ex: CRUZ-2026-X8K2
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

export interface Atleta {
  id: string;
  nome: string;
  categoria: 'SUB-9' | 'SUB-11' | 'SUB-16';
  responsavel?: string;
  tipo?: string;
  equipeId: string | null;
  gols: number;
  assistencias: number;
  nota: number; // 1 a 5
}

export interface Equipe {
  id: string;
  nome: string;
  categoria: 'SUB-9' | 'SUB-11' | 'SUB-16';
  corPrincipal: string;
}

export interface Partida {
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

export interface CruzeirinhoData {
  inscricoes: Inscrição[];
  atletas: Atleta[];
  equipes: Equipe[];
  partidas: Partida[];
}

// Equipes e dados iniciais oficiais do Projeto Cruzeirinho
export function getDadosIniciais(): CruzeirinhoData {
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
    // SUB-9
    { id: 'atl-1', nome: 'Enzo Gabriel Silva', categoria: 'SUB-9', responsavel: 'Marcos Silva', tipo: 'Normal', equipeId: 'eq-sub9-1', gols: 4, assistencias: 2, nota: 5 },
    { id: 'atl-2', nome: 'Davi Lucca Ribeiro', categoria: 'SUB-9', responsavel: 'Ana Ribeiro', tipo: 'Normal', equipeId: 'eq-sub9-1', gols: 2, assistencias: 3, nota: 4 },
    { id: 'atl-3', nome: 'Miguel Souza Santos', categoria: 'SUB-9', responsavel: 'Carlos Souza', tipo: 'Solidária', equipeId: 'eq-sub9-2', gols: 3, assistencias: 1, nota: 4 },
    { id: 'atl-4', nome: 'Heitor Oliveira', categoria: 'SUB-9', responsavel: 'Juliana Oliveira', tipo: 'Normal', equipeId: 'eq-sub9-3', gols: 1, assistencias: 0, nota: 3 },
    { id: 'atl-5', nome: 'Arthur Lima Dias', categoria: 'SUB-9', responsavel: 'Roberto Lima', tipo: 'Solidária', equipeId: 'eq-sub9-4', gols: 0, assistencias: 1, nota: 3 },

    // SUB-11
    { id: 'atl-6', nome: 'Pedro Henrique Dias', categoria: 'SUB-11', responsavel: 'Paulo Dias', tipo: 'Normal', equipeId: 'eq-sub11-1', gols: 6, assistencias: 4, nota: 5 },
    { id: 'atl-7', nome: 'Gabriel Medina Santos', categoria: 'SUB-11', responsavel: 'Lucia Medina', tipo: 'Normal', equipeId: 'eq-sub11-1', gols: 3, assistencias: 5, nota: 5 },
    { id: 'atl-8', nome: 'Matheus Costa Lima', categoria: 'SUB-11', responsavel: 'Fernanda Costa', tipo: 'Normal', equipeId: 'eq-sub11-2', gols: 5, assistencias: 2, nota: 4 },
    { id: 'atl-9', nome: 'Lucas Vieira Rocha', categoria: 'SUB-11', responsavel: 'Antonio Rocha', tipo: 'Solidária', equipeId: 'eq-sub11-3', gols: 2, assistencias: 1, nota: 3 },
    { id: 'atl-10', nome: 'Bernardo Martins', categoria: 'SUB-11', responsavel: 'Claudio Martins', tipo: 'Normal', equipeId: 'eq-sub11-4', gols: 1, assistencias: 0, nota: 3 },

    // SUB-16
    { id: 'atl-11', nome: 'João Vitor Leite', categoria: 'SUB-16', responsavel: 'Douglas Leite', tipo: 'Normal', equipeId: 'eq-sub16-1', gols: 8, assistencias: 3, nota: 5 },
    { id: 'atl-12', nome: 'Felipe Alcantara', categoria: 'SUB-16', responsavel: 'Silvana Alcantara', tipo: 'Normal', equipeId: 'eq-sub16-1', gols: 4, assistencias: 6, nota: 5 },
    { id: 'atl-13', nome: 'Thiago Barbosa Neves', categoria: 'SUB-16', responsavel: 'Geraldo Neves', tipo: 'Solidária', equipeId: 'eq-sub16-2', gols: 5, assistencias: 1, nota: 4 },
    { id: 'atl-14', nome: 'Rafael Nogueira', categoria: 'SUB-16', responsavel: 'Teresa Nogueira', tipo: 'Normal', equipeId: 'eq-sub16-3', gols: 3, assistencias: 2, nota: 3 },
    { id: 'atl-15', nome: 'Cauã Rodrigues', categoria: 'SUB-16', responsavel: 'Rodrigo Silva', tipo: 'Solidária', equipeId: 'eq-sub16-4', gols: 2, assistencias: 1, nota: 3 },
  ];

  const inscricoes: Inscrição[] = [
    {
      id: 'insc-demo-1',
      nome: 'Enzo Gabriel Silva',
      nascimento: '15/03/2017',
      responsavel: 'Marcos Silva',
      whatsapp: '(15) 99811-2233',
      categoria: 'SUB-9',
      tipo: 'Normal',
      status: 'Aprovada',
      nota: 5,
      pagamentoPixConfirmado: true,
      dataEnvio: '2026-02-10T14:30:00.000Z',
    },
    {
      id: 'insc-demo-2',
      nome: 'Davi Lucca Ribeiro',
      nascimento: '22/07/2016',
      responsavel: 'Ana Ribeiro',
      whatsapp: '(15) 99744-5566',
      categoria: 'SUB-9',
      tipo: 'Normal',
      status: 'Aprovada',
      nota: 4,
      pagamentoPixConfirmado: true,
      dataEnvio: '2026-02-11T09:15:00.000Z',
    },
    {
      id: 'insc-demo-3',
      nome: 'João Vitor Leite',
      nascimento: '10/05/2010',
      responsavel: 'Douglas Leite',
      whatsapp: '(15) 99655-4433',
      categoria: 'SUB-16',
      tipo: 'Normal',
      status: 'Aprovada',
      nota: 5,
      pagamentoPixConfirmado: true,
      dataEnvio: '2026-02-12T16:00:00.000Z',
    },
    {
      id: 'insc-demo-4',
      nome: 'Carlos Eduardo Santos',
      nascimento: '08/09/2011',
      responsavel: 'Maria Santos',
      whatsapp: '(15) 99122-3344',
      categoria: 'SUB-16',
      tipo: 'Solidária',
      status: 'Pendente',
      dataEnvio: '2026-02-13T10:20:00.000Z',
    },
  ];

  const partidas: Partida[] = [
    // SUB-9
    { id: 'part-sub9-1', categoria: 'SUB-9', data: '14/03/2026', horario: '08:30', mandanteId: 'eq-sub9-1', visitanteId: 'eq-sub9-2', placarMandante: 3, placarVisitante: 1, status: 'Finalizado' },
    { id: 'part-sub9-2', categoria: 'SUB-9', data: '14/03/2026', horario: '09:30', mandanteId: 'eq-sub9-3', visitanteId: 'eq-sub9-4', placarMandante: 2, placarVisitante: 2, status: 'Finalizado' },
    { id: 'part-sub9-3', categoria: 'SUB-9', data: '21/03/2026', horario: '08:30', mandanteId: 'eq-sub9-1', visitanteId: 'eq-sub9-3', placarMandante: 0, placarVisitante: 0, status: 'Agendado' },

    // SUB-11
    { id: 'part-sub11-1', categoria: 'SUB-11', data: '14/03/2026', horario: '10:30', mandanteId: 'eq-sub11-1', visitanteId: 'eq-sub11-2', placarMandante: 4, placarVisitante: 2, status: 'Finalizado' },
    { id: 'part-sub11-2', categoria: 'SUB-11', data: '14/03/2026', horario: '11:30', mandanteId: 'eq-sub11-3', visitanteId: 'eq-sub11-4', placarMandante: 1, placarVisitante: 0, status: 'Finalizado' },
    { id: 'part-sub11-3', categoria: 'SUB-11', data: '21/03/2026', horario: '10:30', mandanteId: 'eq-sub11-1', visitanteId: 'eq-sub11-3', placarMandante: 0, placarVisitante: 0, status: 'Agendado' },

    // SUB-16
    { id: 'part-sub16-1', categoria: 'SUB-16', data: '14/03/2026', horario: '13:30', mandanteId: 'eq-sub16-1', visitanteId: 'eq-sub16-2', placarMandante: 3, placarVisitante: 2, status: 'Finalizado' },
    { id: 'part-sub16-2', categoria: 'SUB-16', data: '14/03/2026', horario: '14:45', mandanteId: 'eq-sub16-3', visitanteId: 'eq-sub16-4', placarMandante: 1, placarVisitante: 1, status: 'Finalizado' },
    { id: 'part-sub16-3', categoria: 'SUB-16', data: '21/03/2026', horario: '13:30', mandanteId: 'eq-sub16-1', visitanteId: 'eq-sub16-3', placarMandante: 0, placarVisitante: 0, status: 'Agendado' },
  ];

  return { equipes, atletas, inscricoes, partidas };
}

// Função de sanitização e garantia de integridade de dados
function sanitizarDados(raw: any): CruzeirinhoData {
  const seed = getDadosIniciais();
  const rawAtletas = Array.isArray(raw?.atletas) ? raw.atletas : [];
  const atletas: Atleta[] = rawAtletas.map((a: any, idx: number) => ({
    id: a?.id || `atl-${idx}-${Date.now()}`,
    nome: (typeof a?.nome === 'string' && a.nome.trim()) ? a.nome.trim() : `Atleta ${idx + 1}`,
    categoria: (['SUB-9', 'SUB-11', 'SUB-16'].includes(a?.categoria) ? a.categoria : 'SUB-9') as any,
    responsavel: typeof a?.responsavel === 'string' ? a.responsavel : '',
    tipo: a?.tipo || 'Normal',
    equipeId: a?.equipeId || null,
    gols: typeof a?.gols === 'number' ? a.gols : (Number(a?.gols) || 0),
    assistencias: typeof a?.assistencias === 'number' ? a.assistencias : (Number(a?.assistencias) || 0),
    nota: (typeof a?.nota === 'number' && a.nota >= 1 && a.nota <= 5) ? a.nota : 3,
  }));

  const rawInsc = Array.isArray(raw?.inscricoes) ? raw.inscricoes : [];
  const inscricoes: Inscrição[] = rawInsc.map((i: any, idx: number) => ({
    ...i,
    id: i?.id || `insc-${idx}-${Date.now()}`,
    codigoInscricao: i?.codigoInscricao || `CRUZ-2026-${String(idx + 1).padStart(4, '0')}`,
    nome: (typeof i?.nome === 'string' && i.nome.trim()) ? i.nome.trim() : `Atleta Inscrito ${idx + 1}`,
    nascimento: i?.nascimento || '',
    responsavel: i?.responsavel || '',
    whatsapp: i?.whatsapp || '',
    categoria: (['SUB-9', 'SUB-11', 'SUB-16'].includes(i?.categoria) ? i.categoria : 'SUB-9') as any,
    tipo: i?.tipo || 'Normal',
    status: i?.status || 'Pendente',
    dataEnvio: i?.dataEnvio || new Date().toISOString(),
  }));

  const rawEq = Array.isArray(raw?.equipes) ? raw.equipes : [];
  const equipes: Equipe[] = rawEq.map((e: any, idx: number) => ({
    id: e?.id || `eq-${idx}-${Date.now()}`,
    nome: (typeof e?.nome === 'string' && e.nome.trim()) ? e.nome.trim() : `Equipe ${idx + 1}`,
    categoria: (['SUB-9', 'SUB-11', 'SUB-16'].includes(e?.categoria) ? e.categoria : 'SUB-9') as any,
    corPrincipal: e?.corPrincipal || '#1e40af',
  }));

  const rawPart = Array.isArray(raw?.partidas) ? raw.partidas : [];
  const partidas: Partida[] = rawPart.map((p: any, idx: number) => ({
    id: p?.id || `part-${idx}-${Date.now()}`,
    categoria: (['SUB-9', 'SUB-11', 'SUB-16'].includes(p?.categoria) ? p.categoria : 'SUB-9') as any,
    data: p?.data || '',
    horario: p?.horario || '',
    mandanteId: p?.mandanteId || '',
    visitanteId: p?.visitanteId || '',
    placarMandante: typeof p?.placarMandante === 'number' ? p.placarMandante : (Number(p?.placarMandante) || 0),
    placarVisitante: typeof p?.placarVisitante === 'number' ? p.placarVisitante : (Number(p?.placarVisitante) || 0),
    status: p?.status || 'Agendado',
  }));

  return {
    atletas: Array.isArray(raw?.atletas) ? atletas : seed.atletas,
    inscricoes,
    equipes: equipes.length > 0 ? equipes : seed.equipes,
    partidas: Array.isArray(raw?.partidas) ? partidas : seed.partidas,
  };
}

// 1. CARREGAR DADOS (Híbrido: API Backend se existir -> Fallback direto Firestore)
export async function carregarDadosCompletos(): Promise<CruzeirinhoData> {
  // Tentativa 1: API local/Cloud Run
  try {
    const res = await fetch(resolveUrl('/api/cruzeirinho/data'), { credentials: 'include' });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && (Array.isArray(data.equipes) || Array.isArray(data.atletas))) {
          return sanitizarDados(data);
        }
      }
    }
  } catch {
    // API não disponível (Vercel, GitHub Pages, etc.)
  }

  // Tentativa 2: Consulta Direta ao Cloud Firestore
  try {
    const [snapInsc, snapAtl, snapEq, snapPart] = await Promise.all([
      getDocs(collection(db, 'inscricoes')),
      getDocs(collection(db, 'atletas')),
      getDocs(collection(db, 'equipes')),
      getDocs(collection(db, 'partidas')),
    ]);

    const inscricoes: Inscrição[] = [];
    snapInsc.forEach(d => {
      const data = d.data();
      if (data) inscricoes.push({ ...data, id: data.id || d.id } as Inscrição);
    });

    const atletas: Atleta[] = [];
    snapAtl.forEach(d => {
      const data = d.data();
      if (data) atletas.push({ ...data, id: data.id || d.id } as Atleta);
    });

    const equipes: Equipe[] = [];
    snapEq.forEach(d => {
      const data = d.data();
      if (data) equipes.push({ ...data, id: data.id || d.id } as Equipe);
    });

    const partidas: Partida[] = [];
    snapPart.forEach(d => {
      const data = d.data();
      if (data) partidas.push({ ...data, id: data.id || d.id } as Partida);
    });

    // Se o Firestore tiver equipes mas a coleção partidas estiver vazia, inicializar partidas oficiais
    if (snapPart.empty && equipes.length > 0) {
      console.log('[Cruzeirinho] Coleção partidas vazia no Firestore. Inicializando partidas oficiais...');
      const seed = getDadosIniciais();
      try {
        const batch = writeBatch(db);
        seed.partidas.forEach(pt => batch.set(doc(db, 'partidas', pt.id), pt));
        await batch.commit();
        partidas.push(...seed.partidas);
      } catch (e) {
        console.warn('[Cruzeirinho] Erro ao sincronizar seed de partidas no Firestore:', e);
      }
    }

    // Se o Firestore tiver equipes mas a coleção atletas estiver vazia, inicializar atletas oficiais
    if (snapAtl.empty && equipes.length > 0) {
      console.log('[Cruzeirinho] Coleção atletas vazia no Firestore. Inicializando atletas oficiais...');
      const seed = getDadosIniciais();
      try {
        const batch = writeBatch(db);
        seed.atletas.forEach(at => batch.set(doc(db, 'atletas', at.id), at));
        await batch.commit();
        atletas.push(...seed.atletas);
      } catch (e) {
        console.warn('[Cruzeirinho] Erro ao sincronizar seed de atletas no Firestore:', e);
      }
    }

    // Se o Firestore estiver vazio (ex: novo deploy no Vercel), inicializar com os dados oficiais
    if (equipes.length === 0 && atletas.length === 0) {
      console.log('[Cruzeirinho] Inicializando banco de dados no Firestore...');
      const seed = getDadosIniciais();
      await resetarBancoFirestore(seed);
      return seed;
    }

    return sanitizarDados({ inscricoes, atletas, equipes, partidas });
  } catch (err) {
    console.warn('[Cruzeirinho] Erro ao conectar ao Firestore, usando dados locais:', err);
    return getDadosIniciais();
  }
}

// Inicializa dados no Firestore
export async function resetarBancoFirestore(seedData: CruzeirinhoData) {
  try {
    const batch = writeBatch(db);
    seedData.equipes.forEach(eq => batch.set(doc(db, 'equipes', eq.id), eq));
    seedData.atletas.forEach(at => batch.set(doc(db, 'atletas', at.id), at));
    seedData.inscricoes.forEach(ins => batch.set(doc(db, 'inscricoes', ins.id), ins));
    seedData.partidas.forEach(pt => batch.set(doc(db, 'partidas', pt.id), pt));
    await batch.commit();
    console.log('[Cruzeirinho] Dados salvos no Firestore com sucesso.');
  } catch (err) {
    console.error('[Cruzeirinho] Falha ao resetar no Firestore:', err);
  }
}

// 2. ENVIAR INSCRIÇÃO
export async function enviarInscricao(payload: Partial<Inscrição>): Promise<Inscrição> {
  // Tentativa 1: API oficial do backend
  try {
    const res = await fetch('/api/cruzeirinho/inscricoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && (data.id || data.codigoInscricao)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[Cruzeirinho] API indisponível, usando persistência direta:', err);
  }

  // Tentativa 2: Fallback direto no Cloud Firestore com geração de código individual
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const codigoInscricao = `CRUZ-2026-${randomSuffix}`;
  const id = `insc-${Date.now()}-${randomSuffix}`;
  const isSolidaria = payload.tipo === 'Solidária';
  const status: Inscrição['status'] = isSolidaria 
    ? 'Inscrição Solidária em Análise' 
    : 'Aguardando Pagamento';
  const statusPagamento: Inscrição['statusPagamento'] = isSolidaria 
    ? 'ISENTO_SOLIDARIO' 
    : 'PENDENTE';

  const novaInscricao: Inscrição = {
    id,
    codigoInscricao,
    nome: (payload.nome || '').trim(),
    nascimento: (payload.nascimento || '').trim(),
    responsavel: (payload.responsavel || '').trim(),
    whatsapp: (payload.whatsapp || '').trim(),
    categoria: payload.categoria || 'SUB-9',
    tipo: isSolidaria ? 'Solidária' : 'Normal',
    status,
    statusPagamento,
    valor: isSolidaria ? 0 : 25.00,
    pagbankOrderId: `ORDER-${codigoInscricao}`,
    pagbankQrCodeText: '00020126580014br.gov.bcb.pix0136d99e71bc-7881-4361-9e6d-114c853fab3d27600016BR.COM.PAGSEGURO0136CC97B07E-892A-4A32-8C0B-C415F2479F09520400005303986540525.005802BR5920DOUGLAS LEONEL LEITE6006Ibiuna62290525PAGS00000250026103108072163042765',
    nota: payload.nota || 3,
    pagamentoPixConfirmado: false,
    comprovantePix: payload.comprovantePix || '',
    dataEnvio: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'inscricoes', id), novaInscricao);
  } catch (err) {
    console.warn('[Cruzeirinho] Erro ao salvar diretamente no Firestore:', err);
  }

  return novaInscricao;
}

// 3. APROVAR / RECUSAR INSCRIÇÃO
export async function atualizarStatusInscricao(id: string, status: 'Aprovada' | 'Recusada', inscricoesList: Inscrição[]): Promise<void> {
  try {
    const res = await fetch(`/api/cruzeirinho/inscricoes/${id}`, {
      method: 'PUT',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (res.ok) return;
  } catch {
    // Vercel fallback
  }

  await setDoc(doc(db, 'inscricoes', id), { status }, { merge: true });

  if (status === 'Aprovada') {
    const insc = inscricoesList.find(i => i.id === id);
    if (insc) {
      const novoAtleta: Atleta = {
        id: insc.id,
        nome: insc.nome,
        categoria: insc.categoria,
        responsavel: insc.responsavel,
        tipo: insc.tipo,
        equipeId: null,
        gols: 0,
        assistencias: 0,
        nota: insc.nota || 3,
      };
      await setDoc(doc(db, 'atletas', id), novoAtleta, { merge: true });
    }
  }
}

// 4. EXCLUIR INSCRIÇÃO
export async function excluirInscricao(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/cruzeirinho/inscricoes/${id}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
    });
    if (res.ok) return;
  } catch {
    // Vercel fallback
  }

  await deleteDoc(doc(db, 'inscricoes', id));
}

// 5. ATLETAS: CRIAR / EDITAR / EXCLUIR
export async function salvarAtleta(atleta: Atleta, isNovo = false): Promise<void> {
  // 1. Grava no Cloud Firestore (persistência permanente)
  try {
    await setDoc(doc(db, 'atletas', atleta.id), atleta, { merge: true });
  } catch (e) {
    console.warn('[Cruzeirinho] Erro ao salvar atleta diretamente no Firestore:', e);
  }

  // 2. Sincroniza com a API do servidor
  try {
    const url = isNovo ? resolveUrl('/api/cruzeirinho/atletas/novo') : resolveUrl(`/api/cruzeirinho/atletas/${atleta.id}`);
    const method = isNovo ? 'POST' : 'PUT';
    await fetch(url, {
      method,
      headers: getAdminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(atleta),
    });
  } catch (err) {
    console.warn('[Cruzeirinho] API indisponível para salvar atleta:', err);
  }
}

export async function excluirAtleta(id: string): Promise<void> {
  let firestoreDeleted = false;
  let apiDeleted = false;
  let errorMsg = '';

  // 1. Exclusão direta no Cloud Firestore (garantia de persistência permanente)
  try {
    await deleteDoc(doc(db, 'atletas', id));
    firestoreDeleted = true;
  } catch (err: any) {
    console.warn('[Cruzeirinho] Aviso ao excluir atleta no Firestore:', err?.message || err);
    errorMsg = err?.message || '';
  }

  // 2. Exclusão via API do servidor (sincronização do estado em memória e arquivo local)
  try {
    const res = await fetch(resolveUrl(`/api/cruzeirinho/atletas/${id}`), {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
    });
    if (res.ok) {
      apiDeleted = true;
    } else if (res.status !== 404) {
      const errJson = await res.json().catch(() => ({}));
      errorMsg = errJson.error || `Erro HTTP ${res.status}`;
    } else {
      apiDeleted = true;
    }
  } catch (err: any) {
    console.warn('[Cruzeirinho] API indisponível para exclusão do atleta:', err);
  }

  if (!firestoreDeleted && !apiDeleted) {
    throw new Error(errorMsg || 'Não foi possível excluir o atleta. Verifique a conexão com o banco de dados.');
  }
}

export async function atualizarAtletaParcial(id: string, dados: Partial<Atleta>): Promise<void> {
  let firestoreUpdated = false;
  let apiUpdated = false;
  let errorMsg = '';

  // 1. Grava no Cloud Firestore
  try {
    await setDoc(doc(db, 'atletas', id), dados, { merge: true });
    firestoreUpdated = true;
  } catch (err: any) {
    console.warn('[Cruzeirinho] Aviso ao atualizar atleta no Firestore:', err?.message || err);
    errorMsg = err?.message || '';
  }

  // 2. Sincroniza via API do servidor
  try {
    const res = await fetch(resolveUrl(`/api/cruzeirinho/atletas/${id}`), {
      method: 'PUT',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(dados),
    });
    if (res.ok) {
      apiUpdated = true;
    } else {
      const errJson = await res.json().catch(() => ({}));
      errorMsg = errJson.error || `Erro HTTP ${res.status}`;
    }
  } catch (err: any) {
    console.warn('[Cruzeirinho] API indisponível para atualização do atleta:', err);
  }

  if (!firestoreUpdated && !apiUpdated) {
    throw new Error(errorMsg || 'Não foi possível atualizar o atleta no banco de dados.');
  }
}

// 6. EQUIPES: CRIAR / EDITAR / EXCLUIR
export async function salvarEquipe(equipe: Equipe, isNovo = false): Promise<void> {
  try {
    const url = isNovo ? '/api/cruzeirinho/equipes' : `/api/cruzeirinho/equipes/${equipe.id}`;
    const method = isNovo ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: getAdminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(equipe),
    });
    if (res.ok) return;
  } catch {
    // Vercel fallback
  }

  await setDoc(doc(db, 'equipes', equipe.id), equipe, { merge: true });
}

export async function excluirEquipe(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/cruzeirinho/equipes/${id}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
    });
    if (res.ok) return;
  } catch {
    // Vercel fallback
  }

  await deleteDoc(doc(db, 'equipes', id));
}

// 7. PARTIDAS: SALVAR / EXCLUIR
export async function salvarPartida(partida: Partida, isNovo = false): Promise<void> {
  // 1. Grava no Cloud Firestore (persistência em nuvem imediata)
  try {
    await setDoc(doc(db, 'partidas', partida.id), partida, { merge: true });
  } catch (e) {
    console.warn('[Cruzeirinho] Erro ao salvar diretamente no Firestore:', e);
  }

  // 2. Sincroniza com a API do backend
  try {
    const url = isNovo ? resolveUrl('/api/cruzeirinho/partidas') : resolveUrl(`/api/cruzeirinho/partidas/${partida.id}`);
    const method = isNovo ? 'POST' : 'PUT';
    await fetch(url, {
      method,
      headers: getAdminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(partida),
    });
  } catch (err) {
    console.warn('[Cruzeirinho] API indisponível:', err);
  }
}

export async function excluirPartida(id: string): Promise<void> {
  let firestoreDeleted = false;
  let apiDeleted = false;
  let errorMsg = '';

  // 1. Exclusão direta no Cloud Firestore (garantia de persistência permanente)
  try {
    await deleteDoc(doc(db, 'partidas', id));
    firestoreDeleted = true;
  } catch (err: any) {
    console.warn('[Cruzeirinho] Aviso ao excluir diretamente no Firestore:', err?.message || err);
    errorMsg = err?.message || '';
  }

  // 2. Exclusão via API do servidor (sincronização do estado em memória e arquivo local)
  try {
    const res = await fetch(resolveUrl(`/api/cruzeirinho/partidas/${id}`), {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
    });
    if (res.ok) {
      apiDeleted = true;
    } else if (res.status !== 404) {
      const data = await res.json().catch(() => ({}));
      if (data?.error) errorMsg = data.error;
    }
  } catch (err: any) {
    console.warn('[Cruzeirinho] API de backend indisponível para exclusão de partida:', err?.message || err);
  }

  // Se falhou no Firestore e também falhou na API, lança erro para alertar o usuário
  if (!firestoreDeleted && !apiDeleted) {
    throw new Error(errorMsg || 'Não foi possível excluir o jogo do banco de dados.');
  }
}

// 8. DRAFT / SORTEIO EQUILIBRADO (Snake Draft de Potes 5 a 1)
export async function executarDraftSorteio(
  categoria: 'SUB-9' | 'SUB-11' | 'SUB-16', 
  modo: 'equilibrado' | 'aleatorio',
  todosAtletas: Atleta[],
  todasEquipes: Equipe[]
): Promise<void> {
  try {
    const res = await fetch('/api/cruzeirinho/sorteio', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ categoria, modo }),
    });
    if (res.ok) return;
  } catch {
    // Vercel fallback
  }

  // Execução direta do Snake Draft no cliente com persistência no Firestore
  const equipesCat = todasEquipes.filter(e => e.categoria === categoria);
  const atletasCat = todosAtletas.filter(a => a.categoria === categoria && !a.equipeId);

  if (equipesCat.length === 0 || atletasCat.length === 0) return;

  const batch = writeBatch(db);

  if (modo === 'equilibrado') {
    // Organiza por potes: Pote 5 (craques) até Pote 1 (iniciantes)
    const potes: Record<number, Atleta[]> = { 5: [], 4: [], 3: [], 2: [], 1: [] };
    atletasCat.forEach(a => {
      const n = Math.min(5, Math.max(1, a.nota || 3));
      potes[n].push(a);
    });

    let teamIndex = 0;
    let forward = true;

    // Snake Draft
    for (let nota = 5; nota >= 1; nota--) {
      // Embaralha dentro do mesmo pote
      const pote = [...potes[nota]].sort(() => Math.random() - 0.5);

      for (const atl of pote) {
        const equipeAlvo = equipesCat[teamIndex];
        batch.set(doc(db, 'atletas', atl.id), { equipeId: equipeAlvo.id }, { merge: true });

        if (forward) {
          teamIndex++;
          if (teamIndex >= equipesCat.length) {
            teamIndex = equipesCat.length - 1;
            forward = false;
          }
        } else {
          teamIndex--;
          if (teamIndex < 0) {
            teamIndex = 0;
            forward = true;
          }
        }
      }
    }
  } else {
    // Aleatório puro
    const shuffled = [...atletasCat].sort(() => Math.random() - 0.5);
    shuffled.forEach((atl, idx) => {
      const eq = equipesCat[idx % equipesCat.length];
      batch.set(doc(db, 'atletas', atl.id), { equipeId: eq.id }, { merge: true });
    });
  }

  await batch.commit();
}

// 9. ZERAR ESCALAÇÕES DA CATEGORIA
export async function zerarEscalacoes(categoria: 'SUB-9' | 'SUB-11' | 'SUB-16', todosAtletas: Atleta[]): Promise<void> {
  try {
    const res = await fetch('/api/cruzeirinho/sorteio/zerar', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ categoria }),
    });
    if (res.ok) return;
  } catch {
    // Vercel fallback
  }

  const batch = writeBatch(db);
  todosAtletas
    .filter(a => a.categoria === categoria && a.equipeId)
    .forEach(a => {
      batch.set(doc(db, 'atletas', a.id), { equipeId: null }, { merge: true });
    });
  await batch.commit();
}

// 10. RESETAR PARA SEED OFICIAL
export async function resetarParaSeedOficial(): Promise<void> {
  try {
    const res = await fetch('/api/cruzeirinho/reset-seed', { 
      method: 'POST',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
    });
    if (res.ok) return;
  } catch {
    // Vercel fallback
  }

  await resetarBancoFirestore(getDadosIniciais());
}

// --- ADMIN TOKEN & SESSÃO PERSISTENTE ---
const ADMIN_TOKEN_KEY = 'cruzeirinho_admin_token';

let memoryAdminToken: string | null = null;

export function getStoredToken(): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(ADMIN_TOKEN_KEY) || memoryAdminToken;
    }
    return memoryAdminToken;
  } catch {
    return memoryAdminToken;
  }
}

export function setStoredToken(token: string | null) {
  memoryAdminToken = token;
  try {
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    }
  } catch {
    // ignore storage restrictions
  }
}

export function getAdminAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// 11. AUTENTICAÇÃO ADMINISTRATIVA
export async function loginAdmin(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch(resolveUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (data.token) {
        setStoredToken(data.token);
      }
      return { success: true, token: data.token };
    }
    return { success: false, error: data.error || 'Credenciais inválidas.' };
  } catch (err: any) {
    return { success: false, error: 'Erro de conexão com o servidor: ' + err.message };
  }
}

export async function checkAdminSession(): Promise<{ authenticated: boolean; username?: string; token?: string }> {
  try {
    const res = await fetch(resolveUrl('/api/auth/me'), {
      headers: getAdminAuthHeaders(),
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.token) {
        setStoredToken(data.token);
      }
      return data;
    }
  } catch {
    // offline or static mode
  }
  return { authenticated: false };
}

export async function logoutAdmin(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
    });
  } catch {
    // ignore
  }
  setStoredToken(null);
}

// 12. CONSULTAR E RETOMAR INSCRIÇÃO (PAGAMENTO)
export async function consultarInscricaoPorBusca(busca: string): Promise<Inscrição | null> {
  try {
    const res = await fetch(`/api/cruzeirinho/inscricoes/consultar/${encodeURIComponent(busca)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Erro ao consultar inscrição na API:', err);
  }
  return null;
}

// 13. CONSULTAR STATUS DO PAGAMENTO NO SERVIDOR
export async function consultarStatusPagamento(idOrCode: string): Promise<{ 
  pago: boolean; 
  status: string; 
  statusPagamento: string; 
  codigoInscricao?: string;
  motivoRejeicao?: string;
}> {
  try {
    const res = await fetch(`/api/pagbank/consultar/${encodeURIComponent(idOrCode)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Erro ao consultar status:', err);
  }
  return { pago: false, status: 'Aguardando Pagamento', statusPagamento: 'PENDENTE' };
}

// 14. CONFIRMAR PAGAMENTO MANUAL (ADMIN)
export async function confirmarPagamentoManual(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/cruzeirinho/inscricoes/${id}/confirmar-pagamento-manual`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
    });
    if (res.ok) {
      return { success: true };
    }
    const data = await res.json().catch(() => ({}));
    return { success: false, error: data.error || 'Erro ao confirmar pagamento' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 15. APROVAR INSCRIÇÃO SOLIDÁRIA (ADMIN)
export async function aprovarInscricaoSolidaria(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/cruzeirinho/inscricoes/${id}/aprovar-solidaria`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
    });
    if (res.ok) {
      return { success: true };
    }
    const data = await res.json().catch(() => ({}));
    return { success: false, error: data.error || 'Erro ao aprovar inscrição solidária' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 16. ENVIAR COMPROVANTE DE PAGAMENTO PIX
export async function enviarComprovanteInscricao(
  id: string, 
  payload: { comprovanteArquivo: string; comprovanteNomeArquivo?: string }
): Promise<{ success: boolean; message?: string; error?: string; inscricao?: Inscrição }> {
  // Tentativa 1: API oficial do backend
  try {
    const res = await fetch(`/api/cruzeirinho/inscricoes/${encodeURIComponent(id)}/comprovante`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      return { 
        success: true, 
        message: data.message || 'Comprovante enviado! Seu pagamento está aguardando conferência pela organização.', 
        inscricao: data.inscricao 
      };
    }
  } catch (err) {
    console.warn('[Cruzeirinho] Erro na API ao enviar comprovante, usando Firestore:', err);
  }

  // Tentativa 2: Persistência direta no Cloud Firestore
  try {
    const updateData = {
      status: 'Aguardando Conferência' as const,
      statusPagamento: 'AGUARDANDO_CONFERENCIA' as const,
      comprovanteArquivo: payload.comprovanteArquivo,
      comprovanteNomeArquivo: payload.comprovanteNomeArquivo || 'comprovante-pix',
      comprovanteDataEnvio: new Date().toISOString(),
      comprovantePix: `Comprovante enviado (${payload.comprovanteNomeArquivo || 'arquivo'})`,
      dataAtualizacao: new Date().toISOString(),
    };
    await setDoc(doc(db, 'inscricoes', id), updateData, { merge: true });
    return { 
      success: true, 
      message: 'Comprovante enviado! Seu pagamento está aguardando conferência pela organização.' 
    };
  } catch (err: any) {
    return { success: false, error: 'Erro ao enviar comprovante: ' + (err.message || 'Tente novamente.') };
  }
}

// 17. REJEITAR COMPROVANTE (ADMIN)
export async function rejeitarComprovanteInscricao(id: string, motivo?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/cruzeirinho/inscricoes/${encodeURIComponent(id)}/rejeitar-comprovante`, {
      method: 'POST',
      headers: { ...getAdminAuthHeaders(), 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ motivo }),
    });
    if (res.ok) {
      return { success: true };
    }
  } catch {}

  try {
    await setDoc(doc(db, 'inscricoes', id), {
      status: 'Comprovante Rejeitado',
      statusPagamento: 'PENDENTE',
      pagamentoPixConfirmado: false,
      motivoRejeicao: motivo || 'Comprovante não aprovado pela organização. Por favor, confira o valor e reenvie.',
      dataAtualizacao: new Date().toISOString(),
    }, { merge: true });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
