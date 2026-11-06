import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Menu, X, Home, CalendarDays, ClipboardEdit, LogIn, Users, 
  Shield, CheckCircle, XCircle, Settings, Trash2, Edit, Save, Plus,
  Trophy, Goal, UsersRound, Shuffle, Activity, UserPlus, Search,
  Award, Sparkles, RefreshCw, AlertCircle, Phone, Calendar, ArrowRight,
  ChevronRight, Check, Star, Download, Share2, Copy, Smartphone,
  Flame, BarChart3, ChevronDown, ChevronUp, AlertTriangle, QrCode, CreditCard, Lock,
  Bell, BellRing, Send, Volume2, VolumeX, Fingerprint, Key, LogOut,
  UploadCloud, FileText, Eye, CheckCircle2, FileCheck, Image as ImageIcon, ExternalLink, Clock
} from 'lucide-react';

import { QRCodeSVG } from 'qrcode.react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  carregarDadosCompletos,
  enviarInscricao,
  atualizarStatusInscricao,
  excluirInscricao,
  salvarAtleta,
  excluirAtleta,
  atualizarAtletaParcial,
  salvarEquipe,
  excluirEquipe,
  salvarPartida,
  excluirPartida,
  executarDraftSorteio,
  zerarEscalacoes,
  resetarParaSeedOficial,
  loginAdmin,
  checkAdminSession,
  logoutAdmin,
  consultarInscricaoPorBusca,
  consultarStatusPagamento,
  confirmarPagamentoManual,
  aprovarInscricaoSolidaria,
  enviarComprovanteInscricao,
  rejeitarComprovanteInscricao,
  getAdminAuthHeaders,
} from './services/cruzeirinhoService';

import { ErrorBoundary } from './components/ErrorBoundary';

// Brasão Oficial do Projeto Cruzeirinho com suporte a fallback
export const CRUZEIRINHO_LOGO = '/assets/aistudio/1779882264991_35858112.png';
export const CRUZEIRINHO_LOGO_FALLBACK = '/logo.png';

// Tipos de dados
interface Inscrição {
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

interface Atleta {
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

// Componente Interativo de Avaliação / Nota de 1 a 5 Estrelas
interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  size?: number;
  readOnly?: boolean;
  showBadge?: boolean;
}

const StarRating = ({ value = 3, onChange, size = 16, readOnly = false, showBadge = false }: StarRatingProps) => {
  const [hoverVal, setHoverVal] = useState<number | null>(null);
  const activeVal = hoverVal !== null ? hoverVal : (value || 3);

  const getLabel = (v: number) => {
    switch (v) {
      case 5: return { text: 'Nota 5 • Craque / Destaque', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 4: return { text: 'Nota 4 • Avançado', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 3: return { text: 'Nota 3 • Regular / Bom', color: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 2: return { text: 'Nota 2 • Em Desenv.', color: 'bg-orange-100 text-orange-900 border-orange-300' };
      default: return { text: 'Nota 1 • Iniciante', color: 'bg-gray-100 text-gray-700 border-gray-300' };
    }
  };

  const badgeInfo = getLabel(value || 3);

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeVal;
          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={(e) => {
                e.stopPropagation();
                if (onChange) onChange(star);
              }}
              onMouseEnter={() => !readOnly && setHoverVal(star)}
              onMouseLeave={() => !readOnly && setHoverVal(null)}
              className={`p-0.5 transition-transform ${
                readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-125 focus:outline-none'
              }`}
              title={readOnly ? `Nota ${value}` : `Atribuir Nota ${star}`}
            >
              <Star
                size={size}
                className={`${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                    : 'fill-gray-200 text-gray-300'
                } transition-colors`}
              />
            </button>
          );
        })}
      </div>
      {showBadge && (
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${badgeInfo.color}`}>
          {badgeInfo.text}
        </span>
      )}
    </div>
  );
};

// Modal de Confirmação In-App (Substitui window.confirm que falha em iframes)
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({ isOpen, title, message, confirmLabel = 'Sim, Excluir', onConfirm, onCancel }: ConfirmModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 text-center">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
        <p className="text-xs font-semibold text-gray-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// Conversão e otimização de imagem/PDF para Base64 leve e compatível com Cloud Run / Firestore
async function processFileToBase64(file: File): Promise<{ base64: string; name: string }> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    if (file.size > 4 * 1024 * 1024) {
      throw new Error('O arquivo PDF não deve ultrapassar 4MB.');
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ base64: reader.result as string, name: file.name });
      reader.onerror = () => reject(new Error('Falha ao processar o arquivo PDF.'));
      reader.readAsDataURL(file);
    });
  }

  // Redimensionamento de fotos pesadas para máx 1280px em JPEG (mantém < 400KB e alta legibilidade)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX_DIM = 1280;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          }
        } else {
          if (h > MAX_DIM) {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({ base64: e.target?.result as string, name: file.name });
        }
        ctx.drawImage(img, 0, 0, w, h);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ base64: compressedDataUrl, name: file.name });
      };
      img.onerror = () => resolve({ base64: e.target?.result as string, name: file.name });
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}

// Modal de Visualização e Download do Comprovante Pix
interface ModalVisualizarComprovanteProps {
  isOpen: boolean;
  inscricao: Inscrição | null;
  onClose: () => void;
  onConfirmar?: (id: string, nome: string) => void;
  onRejeitar?: (id: string, nome: string) => void;
  readOnly?: boolean;
}

const ModalVisualizarComprovante = ({
  isOpen,
  inscricao,
  onClose,
  onConfirmar,
  onRejeitar,
  readOnly = false,
}: ModalVisualizarComprovanteProps) => {
  if (!isOpen || !inscricao) return null;

  const isPdf = inscricao.comprovanteArquivo?.startsWith('data:application/pdf') ||
    inscricao.comprovanteNomeArquivo?.toLowerCase().endsWith('.pdf');

  const downloadComprovante = () => {
    if (!inscricao.comprovanteArquivo) return;
    const link = document.createElement('a');
    link.href = inscricao.comprovanteArquivo;
    link.download = inscricao.comprovanteNomeArquivo || `comprovante_${inscricao.codigoInscricao || inscricao.id}.${isPdf ? 'pdf' : 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Topo do Modal */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black uppercase">
                {inscricao.categoria}
              </span>
              <span className="font-mono text-xs font-bold bg-gray-200 text-gray-800 px-2 py-0.5 rounded-md">
                {inscricao.codigoInscricao || inscricao.id}
              </span>
              <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Taxa R$ 25,00
              </span>
            </div>
            <h3 className="text-lg font-black text-gray-900 mt-1">
              Comprovante Pix • {inscricao.nome}
            </h3>
            <p className="text-xs text-gray-500 font-semibold">
              Resp: {inscricao.responsavel || 'Não informado'} • WhatsApp: {inscricao.whatsapp || 'Não informado'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Visualizador de Conteúdo (Imagem ou PDF) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/5 flex items-center justify-center min-h-[320px]">
          {inscricao.comprovanteArquivo ? (
            isPdf ? (
              <div className="w-full text-center space-y-4 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-md mx-auto">
                <FileText size={64} className="text-rose-500 mx-auto" />
                <div>
                  <h4 className="font-black text-gray-900 text-base break-all">
                    {inscricao.comprovanteNomeArquivo || 'comprovante.pdf'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Documento de comprovante anexado em formato PDF.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <a
                    href={inscricao.comprovanteArquivo}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink size={15} />
                    <span>Visualizar PDF</span>
                  </a>
                  <button
                    type="button"
                    onClick={downloadComprovante}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-gray-300 cursor-pointer"
                  >
                    <Download size={15} />
                    <span>Baixar PDF</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-h-[62vh] overflow-hidden rounded-2xl border border-gray-200 shadow-md bg-black/5 flex items-center justify-center p-2">
                <img
                  src={inscricao.comprovanteArquivo}
                  alt={`Comprovante Pix de ${inscricao.nome}`}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl"
                />
              </div>
            )
          ) : (
            <div className="text-center p-8 text-gray-400">
              <FileText size={48} className="mx-auto mb-2 opacity-30" />
              <p className="font-bold text-sm">Nenhum arquivo de comprovante anexado a esta inscrição.</p>
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {inscricao.comprovanteArquivo && (
              <button
                type="button"
                onClick={downloadComprovante}
                className="px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download size={15} />
                <span>Baixar Comprovante</span>
              </button>
            )}
          </div>

          {!readOnly && onConfirmar && onRejeitar && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRejeitar(inscricao.id, inscricao.nome);
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <XCircle size={15} />
                <span>Rejeitar Comprovante</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onConfirmar(inscricao.id, inscricao.nome);
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <CheckCircle size={15} />
                <span>Confirmar Pagamento</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal de Rejeição de Comprovante com Motivo
interface ModalRejeitarComprovanteProps {
  isOpen: boolean;
  atletaNome: string;
  onClose: () => void;
  onConfirmRejeicao: (motivo: string) => void;
}

const ModalRejeitarComprovante = ({
  isOpen,
  atletaNome,
  onClose,
  onConfirmRejeicao,
}: ModalRejeitarComprovanteProps) => {
  const [motivo, setMotivo] = useState('Comprovante ilegível ou incompleto');

  if (!isOpen) return null;

  const MOTIVOS_SUGERIDOS = [
    'Comprovante ilegível ou incompleto',
    'Valor diferente de R$ 25,00',
    'Destinatário não confere (deve ser Douglas Leonel Leite)',
    'Data anterior ou comprovante duplicado',
    'Comprovante de agendamento (não concluído)',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <XCircle size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">Rejeitar Comprovante</h3>
            <p className="text-xs text-gray-500 font-semibold">{atletaNome}</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 mb-3">
          Informe o motivo da recusa. O participante poderá consultar pelo código de protocolo e reenviar o comprovante correto.
        </p>

        <div className="space-y-1.5 mb-3">
          {MOTIVOS_SUGERIDOS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMotivo(m)}
              className={`w-full text-left p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                motivo === m
                  ? 'bg-rose-50 border-rose-300 text-rose-900 font-black'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              • {m}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
            Ou digite outro motivo:
          </label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirmRejeicao(motivo)}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md cursor-pointer"
          >
            Confirmar Rejeição
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook e utilitários para PWA / Instalar App
function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return { deferredPrompt, isInstalled, isIOS, install };
}

// Componente Toast de Notificações
const Toast = ({ msg, type, onClose }: { msg: string; type?: string; onClose: () => void }) => {
  if (!msg) return null;
  const isError = type === 'error';
  return (
    <div className={`fixed bottom-5 right-5 ${isError ? 'bg-red-600' : 'bg-emerald-600'} text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 z-50 animate-bounce`}>
      {isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
      <span className="font-semibold text-sm">{msg}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><X size={16} /></button>
    </div>
  );
};

// Modal Guia de Instalação no iOS
const IOSInstallModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center">
        <div className="relative mx-auto mb-3 w-20 h-20">
          <img 
            src={CRUZEIRINHO_LOGO} 
            alt="Brasão Projeto Cruzeirinho" 
            className="w-20 h-20 rounded-full object-contain p-1 bg-white shadow-md border-2 border-blue-400" 
          />
          <div className="absolute -bottom-1 -right-1 bg-blue-700 text-white p-1 rounded-full shadow-xs">
            <Smartphone size={14} />
          </div>
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Instalar no iPhone / iPad</h3>
        <div className="text-xs text-gray-600 space-y-3 text-left bg-gray-50 p-4 rounded-2xl mb-5">
          <p className="flex items-start gap-2">
            <span className="font-black text-blue-600">1.</span>
            <span>No navegador Safari, toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima).</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-black text-blue-600">2.</span>
            <span>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-black text-blue-600">3.</span>
            <span>Toque em <strong>Adicionar</strong> no canto superior direito para ter o app direto no seu celular!</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
        >
          Entendido!
        </button>
      </div>
    </div>
  );
};

// --- SITE PÚBLICO: COMPONENTES E PÁGINAS ---

const HomePublic = ({ 
  setRoute, 
  showToast,
  onOpenInstallModal,
  isAdmin = false,
}: { 
  setRoute: (r: string) => void;
  showToast: (m: string, t?: string) => void;
  onOpenInstallModal: () => void;
  isAdmin?: boolean;
}) => {
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    "⚽ *Brasileirão do Projeto Cruzeirinho 2026 - Bom de Bola, Bom na Escola* 🏆\n\nEstão abertas as inscrições gratuitas e solidárias para atletas SUB-9, SUB-11 e SUB-16!\n\n👉 Inscreva o atleta agora pelo site oficial:\n" + window.location.href
  )}`;

  const copiarLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link do site copiado para a área de transferência!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 space-y-12 animate-fade-in pb-20 max-w-6xl mx-auto">
      {/* CAPA OFICIAL DO APP - PROJETO CRUZEIRINHO */}
      <div className="w-full text-center space-y-6 pt-2">
        <div className="relative inline-block mx-auto">
          {/* Halo decorativo de brilho */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/30 to-sky-400/30 rounded-full blur-xl animate-pulse"></div>
          
          {/* Brasão Oficial do Projeto Cruzeirinho */}
          <div className="relative p-2 rounded-full bg-gradient-to-b from-blue-100 via-white to-blue-50 ring-4 ring-blue-600/30 shadow-2xl hover:scale-105 transition-transform duration-300">
            <img 
              src={CRUZEIRINHO_LOGO} 
              alt="Brasão Oficial do Projeto Cruzeirinho - Bom de Bola, Bom na Escola" 
              className="w-44 h-44 md:w-56 md:h-56 object-contain rounded-full shadow-inner bg-white" 
            />
          </div>

          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-700 text-white text-[11px] font-black uppercase tracking-wider shadow-md whitespace-nowrap border-2 border-white">
            ⚽ Edição Oficial 2026
          </span>
        </div>

        <div className="space-y-3 max-w-3xl mx-auto pt-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-black uppercase tracking-wider">
              Projeto Social Cruzeiro Piaí • Desde 2018
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
              Ibiúna - SP
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-blue-950 tracking-tight leading-tight">
            Brasileirão do Projeto Cruzeirinho
          </h1>
          
          <p className="text-lg md:text-2xl text-blue-700 font-extrabold">
            "Bom de Bola, Bom na Escola"
          </p>
          
          <p className="text-sm md:text-base text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
            O maior campeonato de futebol de base da região, promovendo formação esportiva, disciplina escolar e inclusão social para atletas das categorias SUB-9, SUB-11 e SUB-16.
          </p>
        </div>

        {/* Botões de Ação Rápida no Banner: WhatsApp & Baixar App */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Share2 size={18} />
            <span>Compartilhar Inscrições no WhatsApp</span>
          </a>

          <button
            onClick={copiarLink}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-gray-100 text-gray-800 font-bold text-sm border border-gray-200 shadow-sm transition-all cursor-pointer"
            title="Copiar Link"
          >
            <Copy size={16} />
            <span>Copiar Link</span>
          </button>

          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-800 hover:bg-blue-900 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Download size={18} />
            <span>Baixar App no Celular</span>
          </button>
        </div>
      </div>

      {/* Cards de Inscrição por Categoria */}
      <div className="w-full">
        <h2 className="text-2xl font-black text-gray-800 text-center mb-6">Escolha a Categoria e Inscreva-se</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => setRoute('inscricao_sub9')} 
            className="bg-white rounded-2xl shadow-md hover:shadow-2xl p-6 border-t-8 border-blue-400 cursor-pointer hover:-translate-y-1.5 transition-all text-center flex flex-col justify-between"
          >
            <div>
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                <UserPlus size={36} />
              </div>
              <h3 className="text-2xl font-black text-gray-900">SUB-9</h3>
              <p className="text-sm font-semibold text-blue-700 mt-1">Atletas de 6 a 9 anos</p>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                Iniciação esportiva divertida, desenvolvimento motor e trabalho em equipe.
              </p>
            </div>
            <button className="mt-6 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-extrabold rounded-xl shadow-sm text-sm flex items-center justify-center gap-2 cursor-pointer">
              <span>Inscrever no SUB-9</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div 
            onClick={() => setRoute('inscricao_sub11')} 
            className="bg-white rounded-2xl shadow-md hover:shadow-2xl p-6 border-t-8 border-blue-600 cursor-pointer hover:-translate-y-1.5 transition-all text-center flex flex-col justify-between"
          >
            <div>
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-700">
                <UserPlus size={36} />
              </div>
              <h3 className="text-2xl font-black text-gray-900">SUB-11</h3>
              <p className="text-sm font-semibold text-blue-700 mt-1">Atletas de 10 a 11 anos</p>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                Fundamentos táticos, espírito esportivo e partidas eletrizantes.
              </p>
            </div>
            <button className="mt-6 w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-sm text-sm flex items-center justify-center gap-2 cursor-pointer">
              <span>Inscrever no SUB-11</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div 
            onClick={() => setRoute('inscricao_sub16')} 
            className="bg-white rounded-2xl shadow-md hover:shadow-2xl p-6 border-t-8 border-blue-900 cursor-pointer hover:-translate-y-1.5 transition-all text-center flex flex-col justify-between"
          >
            <div>
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-900">
                <UserPlus size={36} />
              </div>
              <h3 className="text-2xl font-black text-gray-900">SUB-16</h3>
              <p className="text-sm font-semibold text-blue-700 mt-1">Atletas de 13 a 16 anos</p>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                Alto rendimento amador, preparação para peneiras e muita competitividade sadia.
              </p>
            </div>
            <button className="mt-6 w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-extrabold rounded-xl shadow-sm text-sm flex items-center justify-center gap-2 cursor-pointer">
              <span>Inscrever no SUB-16</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Informações Úteis do Torneio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h4 className="font-black text-gray-800 text-base mb-2 flex items-center gap-2">
            <Award className="text-blue-600" size={20} /> Inscrição Solidária
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Nenhuma criança fica de fora por questões financeiras. A Inscrição Solidária é 100% isenta mediante simples análise comunitária.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h4 className="font-black text-gray-800 text-base mb-2 flex items-center gap-2">
            <Shuffle className="text-blue-600" size={20} /> Sorteio Equilibrado
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Os atletas inscritos passam por um sorteio transparente para formar equipes balanceadas, garantindo jogos justos e emocionantes.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h4 className="font-black text-gray-800 text-base mb-2 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={20} /> Visão Geral das Equipes
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Acompanhe o total de gols, assistências e estatísticas agregadas de cada equipe no nosso novo dashboard.
          </p>
        </div>
      </div>

      {/* Botão Discreto de Administração */}
      <div className="w-full text-center pt-8 border-t border-gray-200/60">
        <button
          onClick={() => setRoute(isAdmin ? 'admin_dashboard' : 'admin_login')}
          className="text-xs font-bold text-gray-400 hover:text-blue-900 transition-colors inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-gray-200 cursor-pointer"
          title="Área restrita de gestão do coordenador"
        >
          <Lock size={13} className="text-gray-400" />
          <span>ADMINISTRAÇÃO</span>
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// PÁGINA PÚBLICA: SELEÇÃO DE CATEGORIAS DE INSCRIÇÃO
// Permite que qualquer visitante selecione a categoria ou consulte inscrição
// -------------------------------------------------------------
const CategoriasPublic = ({ 
  setRoute, 
  showToast 
}: { 
  setRoute: (r: string) => void; 
  showToast: (m: string, t?: string) => void; 
}) => {
  const [buscaRetomada, setBuscaRetomada] = useState('');
  const [buscando, setBuscando] = useState(false);

  const handleConsultar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buscaRetomada.trim()) {
      showToast('Digite o código ou telefone do atleta.', 'info');
      return;
    }
    setBuscando(true);
    const insc = await consultarInscricaoPorBusca(buscaRetomada.trim());
    setBuscando(false);
    if (!insc) {
      showToast('Nenhuma inscrição encontrada com este código ou WhatsApp.', 'error');
      return;
    }
    const cat = (insc?.categoria || 'sub9').toLowerCase().replace('-', '');
    setRoute(`inscricao_${cat}`);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-20">
      <div className="text-center space-y-2">
        <span className="px-3.5 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-black uppercase tracking-wider">
          Temporada 2026 • Inscrições Abertas
        </span>
        <h2 className="text-3xl md:text-4xl font-black text-blue-950">
          Inscrições por Categoria
        </h2>
        <p className="text-sm text-gray-600 max-w-xl mx-auto font-medium">
          Escolha a categoria correspondente à idade do atleta para abrir a ficha oficial de inscrição.
        </p>
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SUB-9 */}
        <div 
          onClick={() => setRoute('inscricao_sub9')}
          className="bg-white rounded-3xl p-6 shadow-md hover:shadow-2xl border-t-8 border-blue-400 cursor-pointer hover:-translate-y-1.5 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <UserPlus size={30} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
              6 a 9 Anos
            </span>
            <h3 className="text-2xl font-black text-gray-900 mt-2">SUB-9</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Iniciação esportiva divertida, desenvolvimento motor, fundamentos do futebol e integração social.
            </p>
          </div>
          <button 
            type="button"
            className="mt-6 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Inscrever no SUB-9</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* SUB-11 */}
        <div 
          onClick={() => setRoute('inscricao_sub11')}
          className="bg-white rounded-3xl p-6 shadow-md hover:shadow-2xl border-t-8 border-blue-600 cursor-pointer hover:-translate-y-1.5 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-14 h-14 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mb-4">
              <UserPlus size={30} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
              10 a 11 Anos
            </span>
            <h3 className="text-2xl font-black text-gray-900 mt-2">SUB-11</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Desenvolvimento de fundamentos táticos, espírito de equipe, disciplina e jogos competitivos.
            </p>
          </div>
          <button 
            type="button"
            className="mt-6 w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Inscrever no SUB-11</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* SUB-16 */}
        <div 
          onClick={() => setRoute('inscricao_sub16')}
          className="bg-white rounded-3xl p-6 shadow-md hover:shadow-2xl border-t-8 border-blue-900 cursor-pointer hover:-translate-y-1.5 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-14 h-14 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mb-4">
              <UserPlus size={30} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full">
              13 a 16 Anos
            </span>
            <h3 className="text-2xl font-black text-gray-900 mt-2">SUB-16</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Alto nível competitivo, transição para o futebol de campo, preparação física e liderança.
            </p>
          </div>
          <button 
            type="button"
            className="mt-6 w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Inscrever no SUB-16</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Área de Retomada e Consulta */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h4 className="text-sm font-black text-blue-950 mb-1 flex items-center gap-2">
          <Search size={16} className="text-blue-600" />
          Já iniciou uma inscrição? Consulte o protocolo ou retome o pagamento
        </h4>
        <p className="text-xs text-gray-500 mb-3 font-semibold">
          Digite o código gerado (ex: CRUZ-2026-X8K2) ou o telefone do responsável:
        </p>
        <form onSubmit={handleConsultar} className="flex gap-2 max-w-md">
          <input
            type="text"
            value={buscaRetomada}
            onChange={e => setBuscaRetomada(e.target.value)}
            placeholder="Ex: CRUZ-2026-ABCD ou (15) 99999-9999"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={buscando}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {buscando ? 'Buscando...' : 'Consultar'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Formulário de Inscrição com botão de WhatsApp integrado
const FormularioInscricao = ({ 
  showToast, 
  categoriaPreSelecionada,
  onInscricaoSucesso
}: { 
  showToast: (m: string, t?: string) => void; 
  categoriaPreSelecionada: 'SUB-9' | 'SUB-11' | 'SUB-16';
  onInscricaoSucesso: () => void;
}) => {
  const PIX_INFO = {
    chave: 'prjtcruzeirinho@gmail.com',
    copiaECola: '00020126580014br.gov.bcb.pix0136d99e71bc-7881-4361-9e6d-114c853fab3d27600016BR.COM.PAGSEGURO0136CC97B07E-892A-4A32-8C0B-C415F2479F09520400005303986540525.005802BR5920DOUGLAS LEONEL LEITE6006Ibiuna62290525PAGS00000250026103108072163042765',
    titular: 'DOUGLAS LEONEL LEITE',
    instituicao: 'PagSeguro / PagBank',
    cidade: 'Ibiúna - SP',
    valor: 'R$ 25,00',
  };

  const [formData, setFormData] = useState({
    nome: '', 
    nascimento: '', 
    responsavel: '', 
    whatsapp: '', 
    categoria: categoriaPreSelecionada, 
    tipo: 'Normal' as 'Normal' | 'Solidária'
  });
  
  const [loading, setLoading] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [copiaEColaCopiado, setCopiaEColaCopiado] = useState(false);
  const [activeInscricao, setActiveInscricao] = useState<Inscrição | null>(() => {
    try {
      const saved = localStorage.getItem('cruzeirinho_active_inscricao');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [buscaRetomada, setBuscaRetomada] = useState('');
  const [buscandoRetomada, setBuscandoRetomada] = useState(false);
  const [verificandoPagamento, setVerificandoPagamento] = useState(false);

  // Estados para envio de comprovante (Imagem ou PDF)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<{ file: File; name: string; size: number } | null>(null);
  const [enviandoComprovante, setEnviandoComprovante] = useState(false);

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    nome: string;
    categoria: string;
    tipo: 'Normal' | 'Solidária';
    id: string;
    status: 'Aprovada' | 'Pendente';
    responsavel?: string;
    whatsapp?: string;
    comprovante?: string;
  } | null>(null);

  useEffect(() => { 
    setFormData(prev => ({ ...prev, categoria: categoriaPreSelecionada })); 
  }, [categoriaPreSelecionada]);

  // Atualização em segundo plano caso a coordenação confirme ou altere o status da inscrição aberta
  useEffect(() => {
    if (!isPixModalOpen || !activeInscricao?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await consultarStatusPagamento(activeInscricao.id);
        if (res.pago || res.statusPagamento === 'PAGO' || res.status === 'Pagamento Aprovado' || res.status === 'Inscrição Confirmada' || res.status === 'Aprovada') {
          clearInterval(interval);
          try { localStorage.removeItem('cruzeirinho_active_inscricao'); } catch {}
          setIsPixModalOpen(false);
          setSuccessModal({
            isOpen: true,
            nome: activeInscricao.nome,
            categoria: activeInscricao.categoria,
            tipo: 'Normal',
            id: activeInscricao.codigoInscricao || activeInscricao.id,
            status: 'Aprovada',
            responsavel: activeInscricao.responsavel,
            whatsapp: activeInscricao.whatsapp,
            comprovante: 'Pagamento Pix R$ 25,00 confirmado pela coordenação',
          });
          onInscricaoSucesso();
        } else if (res.status === 'Comprovante Rejeitado' && activeInscricao.status !== 'Comprovante Rejeitado') {
          setActiveInscricao(prev => prev ? { ...prev, status: 'Comprovante Rejeitado', motivoRejeicao: res.motivoRejeicao } : null);
        } else if (res.status === 'Aguardando Conferência' && activeInscricao.status !== 'Aguardando Conferência') {
          setActiveInscricao(prev => prev ? { ...prev, status: 'Aguardando Conferência' } : null);
        }
      } catch (err) {
        console.warn('Erro ao checar status:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPixModalOpen, activeInscricao?.id, activeInscricao?.status]);

  const handleDateMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5);
    setFormData({ ...formData, nascimento: v.slice(0, 10) });
  };

  const handlePhoneMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 2) v = '(' + v.slice(0, 2) + ') ' + v.slice(2);
    if (v.length > 9) v = v.slice(0, 10) + '-' + v.slice(10);
    setFormData({ ...formData, whatsapp: v.slice(0, 15) });
  };

  const currentPixCode = (activeInscricao?.pagbankQrCodeText && activeInscricao.pagbankQrCodeText.length > 10)
    ? activeInscricao.pagbankQrCodeText
    : PIX_INFO.copiaECola;

  const safeOpenUrl = (url: string) => {
    try {
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      if (!w) {
        window.location.href = url;
      }
    } catch {
      window.location.href = url;
    }
  };

  const copiarPixCopiaECola = () => {
    const code = currentPixCode || PIX_INFO.copiaECola;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiaEColaCopiado(true);
        showToast('Código Pix Copia e Cola (R$ 25,00) copiado com sucesso!');
        setTimeout(() => setCopiaEColaCopiado(false), 3500);
      }).catch(() => {
        showToast('Código Pix: ' + code);
      });
    } else {
      showToast('Código Pix: ' + code);
    }
  };

  const copiarChavePix = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(PIX_INFO.chave).then(() => {
        setPixCopiado(true);
        showToast('Chave Pix e-mail copiada com sucesso!');
        setTimeout(() => setPixCopiado(false), 3000);
      }).catch(() => {
        showToast('Chave Pix: ' + PIX_INFO.chave);
      });
    } else {
      showToast('Chave Pix: ' + PIX_INFO.chave);
    }
  };

  const handleIniciarInscricao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      return showToast('Preencha o nome completo do atleta', 'error');
    }
    if (formData.nascimento.length !== 10) {
      return showToast('Preencha a data de nascimento no formato DD/MM/AAAA', 'error');
    }
    if (!formData.responsavel.trim()) {
      return showToast('Preencha o nome do responsável legal', 'error');
    }
    if (formData.whatsapp.length < 14) {
      return showToast('Preencha o número do WhatsApp completo com DDD', 'error');
    }

    if (formData.tipo === 'Normal') {
      setLoading(true);
      try {
        // Salva a inscrição imediatamente gerando código único e cobrança Pix oficial PagBank
        const salva = await enviarInscricao({
          ...formData,
          pagamentoPixConfirmado: false,
        });

        setActiveInscricao(salva);
        try {
          localStorage.setItem('cruzeirinho_active_inscricao', JSON.stringify(salva));
        } catch {}

        setIsPixModalOpen(true);
        showToast(`Inscrição salva! Protocolo: ${salva.codigoInscricao || salva.id}`);
        onInscricaoSucesso();
      } catch (err: any) {
        showToast('Erro ao iniciar inscrição: ' + (err.message || 'Tente novamente.'), 'error');
      } finally {
        setLoading(false);
      }
    } else {
      // Inscrição Solidária: envia para análise com status Pendente
      enviarInscricaoSolidaria();
    }
  };

  const enviarInscricaoSolidaria = async () => {
    setLoading(true);
    try {
      const data = await enviarInscricao({
        ...formData,
        pagamentoPixConfirmado: false,
      });

      setSuccessModal({
        isOpen: true,
        nome: data.nome,
        categoria: data.categoria,
        tipo: 'Solidária',
        id: data.codigoInscricao || data.id,
        status: 'Pendente',
        responsavel: data.responsavel,
        whatsapp: data.whatsapp,
      });

      setFormData({ 
        nome: '', 
        nascimento: '', 
        responsavel: '', 
        whatsapp: '', 
        categoria: categoriaPreSelecionada, 
        tipo: 'Normal' 
      });
      onInscricaoSucesso();
    } catch {
      showToast('Erro ao enviar inscrição. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('O arquivo selecionado é muito grande. Escolha um arquivo de até 10MB.', 'error');
      return;
    }
    setSelectedFile({ file, name: file.name, size: file.size });
  };

  const handleEnviarComprovante = async () => {
    if (!activeInscricao?.id) {
      showToast('Inscrição não encontrada. Por favor, inicie a inscrição novamente.', 'error');
      return;
    }
    if (!selectedFile) {
      showToast('Selecione uma imagem ou PDF do comprovante primeiro.', 'error');
      return;
    }

    setEnviandoComprovante(true);
    try {
      const { base64, name } = await processFileToBase64(selectedFile.file);
      const res = await enviarComprovanteInscricao(activeInscricao.id, {
        comprovanteArquivo: base64,
        comprovanteNomeArquivo: name,
      });

      if (res.success) {
        const atualizada: Inscrição = {
          ...activeInscricao,
          status: 'Aguardando Conferência',
          statusPagamento: 'AGUARDANDO_CONFERENCIA',
          comprovanteArquivo: base64,
          comprovanteNomeArquivo: name,
          comprovanteDataEnvio: new Date().toISOString(),
          motivoRejeicao: undefined,
        };
        setActiveInscricao(atualizada);
        try {
          localStorage.setItem('cruzeirinho_active_inscricao', JSON.stringify(atualizada));
        } catch {}
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        showToast('Comprovante enviado! Seu pagamento está aguardando conferência pela organização.');
        onInscricaoSucesso();
      } else {
        showToast(res.error || 'Erro ao enviar comprovante. Tente novamente.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao processar arquivo do comprovante.', 'error');
    } finally {
      setEnviandoComprovante(false);
    }
  };

  // Consulta e retoma inscrição existente para quem saiu para pagar ou fechou o app
  const handleConsultarRetomada = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!buscaRetomada.trim()) {
      showToast('Digite seu código de inscrição ou WhatsApp para consultar.', 'info');
      return;
    }

    setBuscandoRetomada(true);
    const insc = await consultarInscricaoPorBusca(buscaRetomada.trim());
    setBuscandoRetomada(false);

    if (!insc) {
      showToast('Nenhuma inscrição encontrada com este código ou WhatsApp.', 'error');
      return;
    }

    if (insc.status === 'Aprovada' || insc.status === 'Pagamento Aprovado' || insc.status === 'Inscrição Confirmada' || insc.statusPagamento === 'PAGO') {
      showToast(`Inscrição de ${insc.nome} já está PAGA e CONFIRMADA! 🎉`);
      setSuccessModal({
        isOpen: true,
        nome: insc.nome,
        categoria: insc.categoria,
        tipo: insc.tipo,
        id: insc.codigoInscricao || insc.id,
        status: 'Aprovada',
        responsavel: insc.responsavel,
        whatsapp: insc.whatsapp,
        comprovante: insc.comprovantePix || 'Pagamento Aprovado pela Coordenação',
      });
      return;
    }

    if (insc.tipo === 'Solidária') {
      showToast(`Inscrição Solidária de ${insc.nome} está em análise social.`);
      setSuccessModal({
        isOpen: true,
        nome: insc.nome,
        categoria: insc.categoria,
        tipo: 'Solidária',
        id: insc.codigoInscricao || insc.id,
        status: 'Pendente',
        responsavel: insc.responsavel,
        whatsapp: insc.whatsapp,
      });
      return;
    }

    if (insc.status === 'Aguardando Conferência') {
      setActiveInscricao(insc);
      try { localStorage.setItem('cruzeirinho_active_inscricao', JSON.stringify(insc)); } catch {}
      setIsPixModalOpen(true);
      showToast('Comprovante enviado! Seu pagamento está aguardando conferência pela organização.');
      return;
    }

    if (insc.status === 'Comprovante Rejeitado') {
      setActiveInscricao(insc);
      try { localStorage.setItem('cruzeirinho_active_inscricao', JSON.stringify(insc)); } catch {}
      setIsPixModalOpen(true);
      showToast(`Atenção: O comprovante de ${insc.nome} precisa ser reenviado: ${insc.motivoRejeicao || 'Arquivo ilegível'}.`, 'error');
      return;
    }

    // Normal pendente (Aguardando Pagamento): retoma o modal de pagamento com todos os dados
    setActiveInscricao(insc);
    try { localStorage.setItem('cruzeirinho_active_inscricao', JSON.stringify(insc)); } catch {}
    setIsPixModalOpen(true);
    showToast(`Inscrição de ${insc.nome} recuperada! Faça o Pix de R$ 25,00 e envie seu comprovante.`);
  };

  // Verificação manual pelo botão dentro do modal
  const handleVerificarPagamentoManual = async () => {
    if (!activeInscricao?.id) return;
    setVerificandoPagamento(true);
    const res = await consultarStatusPagamento(activeInscricao.id);
    setVerificandoPagamento(false);

    if (res.pago || res.statusPagamento === 'PAGO' || res.status === 'Pagamento Aprovado' || res.status === 'Inscrição Confirmada' || res.status === 'Aprovada') {
      try { localStorage.removeItem('cruzeirinho_active_inscricao'); } catch {}
      setIsPixModalOpen(false);
      setSuccessModal({
        isOpen: true,
        nome: activeInscricao.nome,
        categoria: activeInscricao.categoria,
        tipo: 'Normal',
        id: activeInscricao.codigoInscricao || activeInscricao.id,
        status: 'Aprovada',
        responsavel: activeInscricao.responsavel,
        whatsapp: activeInscricao.whatsapp,
        comprovante: 'Confirmado pela organização',
      });
      showToast('Pagamento confirmado com sucesso! 🎉');
      onInscricaoSucesso();
    } else if (res.status === 'Aguardando Conferência') {
      setActiveInscricao(prev => prev ? { ...prev, status: 'Aguardando Conferência' } : null);
      showToast('Comprovante enviado! Seu pagamento está aguardando conferência pela organização.', 'info');
    } else if (res.status === 'Comprovante Rejeitado') {
      setActiveInscricao(prev => prev ? { ...prev, status: 'Comprovante Rejeitado', motivoRejeicao: res.motivoRejeicao } : null);
      showToast(`Comprovante rejeitado: ${res.motivoRejeicao || 'Por favor, reenvie o comprovante.'}`, 'error');
    } else {
      showToast('Pagamento ainda não confirmado. Realize o Pix de R$ 25,00 e anexe seu comprovante abaixo.', 'info');
    }
  };

  const shareCategoryWhatsapp = () => {
    const text = `⚽ *Inscrição para o Brasileirão do Projeto Cruzeirinho 2026 - ${formData.categoria}*\n\nGaranta a vaga do atleta acessando a ficha oficial de inscrição:\n${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 my-8">
      {/* BANNER DE INSCRIÇÃO SALVA EM ANDAMENTO (RECUPERAÇÃO AUTOMÁTICA) */}
      {activeInscricao && activeInscricao.statusPagamento !== 'PAGO' && activeInscricao.status !== 'Aprovada' && !isPixModalOpen && (
        <div className={`border-2 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in ${
          activeInscricao.status === 'Aguardando Conferência'
            ? 'bg-amber-50/90 border-amber-300'
            : activeInscricao.status === 'Comprovante Rejeitado'
            ? 'bg-rose-50 border-rose-300'
            : 'bg-blue-50 border-blue-300'
        }`}>
          <div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
              activeInscricao.status === 'Aguardando Conferência'
                ? 'bg-amber-200 text-amber-900'
                : activeInscricao.status === 'Comprovante Rejeitado'
                ? 'bg-rose-200 text-rose-900'
                : 'bg-blue-200 text-blue-900'
            }`}>
              {activeInscricao.status === 'Aguardando Conferência' 
                ? 'Comprovante em Conferência' 
                : activeInscricao.status === 'Comprovante Rejeitado'
                ? 'Comprovante com Pendência'
                : 'Inscrição Aguardando Pix'}
            </span>
            <h4 className="font-black text-gray-900 text-sm mt-1">
              {activeInscricao.nome} ({activeInscricao.categoria})
            </h4>
            <p className="text-xs text-gray-700 font-semibold">
              Protocolo: <span className="font-mono font-bold text-blue-900">{activeInscricao.codigoInscricao || activeInscricao.id}</span>
              {activeInscricao.status === 'Aguardando Conferência' 
                ? ' • Comprovante em análise pela organização' 
                : activeInscricao.status === 'Comprovante Rejeitado'
                ? ` • Motivo: ${activeInscricao.motivoRejeicao || 'Reenviar arquivo'}`
                : ' • Taxa R$ 25,00'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPixModalOpen(true)}
            className={`px-4 py-2.5 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeInscricao.status === 'Aguardando Conferência'
                ? 'bg-amber-600 hover:bg-amber-700'
                : activeInscricao.status === 'Comprovante Rejeitado'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {activeInscricao.status === 'Aguardando Conferência' ? (
              <>
                <FileCheck size={16} />
                <span>Ver Status do Comprovante</span>
              </>
            ) : activeInscricao.status === 'Comprovante Rejeitado' ? (
              <>
                <UploadCloud size={16} />
                <span>Reenviar Comprovante</span>
              </>
            ) : (
              <>
                <QrCode size={16} />
                <span>Pagar & Enviar Comprovante</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ÁREA DE BUSCA / RECUPERAÇÃO DE INSCRIÇÃO */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-3xl p-4 shadow-xs">
        <p className="text-xs font-black text-blue-950 mb-2 flex items-center gap-1.5">
          <Search size={15} className="text-blue-600" /> Já iniciou uma inscrição? Consulte ou retome o pagamento:
        </p>
        <form onSubmit={handleConsultarRetomada} className="flex gap-2">
          <input
            type="text"
            value={buscaRetomada}
            onChange={e => setBuscaRetomada(e.target.value)}
            placeholder="Digite o código (ex: CRUZ-2026-X8K2) ou WhatsApp..."
            className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={buscandoRetomada}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {buscandoRetomada ? 'Buscando...' : 'Consultar'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center mb-6">
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black uppercase tracking-wider">
            Ficha Oficial de Inscrição
          </span>
          <h2 className="text-3xl font-black text-blue-950 mt-2">Inscrição {categoriaPreSelecionada}</h2>
          <p className="text-sm text-gray-500 mt-1">Preencha os dados do atleta abaixo para garantir a vaga no torneio.</p>
          
          <button
            type="button"
            onClick={shareCategoryWhatsapp}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
          >
            <Share2 size={13} /> Compartilhar Inscrição {categoriaPreSelecionada} no WhatsApp
          </button>
        </div>

        <form onSubmit={handleIniciarInscricao} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo do Atleta</label>
            <input 
              required 
              type="text" 
              value={formData.nome} 
              onChange={e => setFormData({ ...formData, nome: e.target.value })} 
              className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" 
              placeholder="Ex: Enzo Gabriel da Silva" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data de Nascimento</label>
              <input 
                required 
                type="text" 
                value={formData.nascimento} 
                onChange={handleDateMask} 
                placeholder="DD/MM/AAAA" 
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Categoria</label>
              <select 
                value={formData.categoria} 
                onChange={e => setFormData({ ...formData, categoria: e.target.value as any })} 
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
              >
                <option value="SUB-9">SUB-9 (6 a 9 anos)</option>
                <option value="SUB-11">SUB-11 (10 a 11 anos)</option>
                <option value="SUB-16">SUB-16 (13 a 16 anos)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome do Responsável Legal</label>
            <input 
              required 
              type="text" 
              value={formData.responsavel} 
              onChange={e => setFormData({ ...formData, responsavel: e.target.value })} 
              className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" 
              placeholder="Ex: Maria dos Santos" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp para Contato</label>
            <input 
              required 
              type="text" 
              value={formData.whatsapp} 
              onChange={handlePhoneMask} 
              placeholder="(15) 99999-9999" 
              className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo de Inscrição</label>
            <select 
              value={formData.tipo} 
              onChange={e => setFormData({ ...formData, tipo: e.target.value as any })} 
              className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
            >
              <option value="Normal">Normal — Taxa de Inscrição: R$ 25,00 (PagBank Pix Oficial)</option>
              <option value="Solidária">Solidária — Isenção Total (Requer Validação do Admin)</option>
            </select>
          </div>

          {formData.tipo === 'Normal' ? (
            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-emerald-900 text-sm">
                <span className="p-1 bg-emerald-600 text-white rounded-lg">Pix</span>
                <span>Taxa Oficial: R$ 25,00 (PagBank)</span>
              </div>
              <p className="font-semibold text-emerald-800">
                Sua inscrição é salva imediatamente com um <strong>código único</strong> e cobrança individual. 
                Você pode sair do aplicativo para pagar no seu banco e retornar a qualquer momento de onde parou!
              </p>
            </div>
          ) : (
            <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-200 text-xs text-purple-950 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-purple-900 text-sm">
                <span>💙 Vaga Solidária (Projeto Social)</span>
              </div>
              <p className="font-semibold text-purple-800">
                Isenção total da taxa para famílias de baixa renda. 
                <strong> A solicitação fica em análise e só é confirmada após aprovação do Administrador.</strong>
              </p>
            </div>
          )}

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 text-base mt-2 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              'Salvando inscrição...'
            ) : formData.tipo === 'Normal' ? (
              <>
                <QrCode size={18} />
                <span>Salvar & Gerar Pagamento Pix PagBank (R$ 25,00)</span>
              </>
            ) : (
              <>
                <Shield size={18} />
                <span>Enviar Inscrição Solidária para Análise</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* MODAL OFICIAL DE PAGAMENTO PIX (R$ 25,00) COM ENVIO DE COMPROVANTE */}
      {isPixModalOpen && activeInscricao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-lg w-full border border-gray-100 text-left max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <img 
                  src={CRUZEIRINHO_LOGO} 
                  alt="Logo" 
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                  className="w-10 h-10 rounded-full object-contain p-0.5 bg-white border border-blue-300 shadow-xs" 
                />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    Pix Oficial • Projeto Cruzeirinho
                  </span>
                  <h3 className="text-xl font-black text-gray-900 mt-0.5">Pagamento da Inscrição</h3>
                </div>
              </div>
              <button 
                onClick={() => setIsPixModalOpen(false)} 
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                title="Fechar (Sua inscrição continuará salva)"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Código Único da Inscrição & Status em Tempo Real */}
              <div className="bg-blue-50/80 p-3 rounded-2xl border border-blue-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                <div>
                  <span className="text-gray-500 font-bold block text-[10px] uppercase">Protocolo da Inscrição:</span>
                  <span className="font-mono text-sm font-black text-blue-900">
                    {activeInscricao.codigoInscricao || activeInscricao.id || 'CRUZ-2026-NOVO'}
                  </span>
                </div>
                {activeInscricao.status === 'Aguardando Conferência' ? (
                  <div className="flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-black text-[11px]">
                    <Clock size={13} className="text-amber-700 animate-pulse" />
                    <span>Aguardando Conferência</span>
                  </div>
                ) : activeInscricao.status === 'Comprovante Rejeitado' ? (
                  <div className="flex items-center gap-1.5 bg-rose-100 text-rose-900 px-3 py-1 rounded-full font-black text-[11px]">
                    <XCircle size={13} className="text-rose-700" />
                    <span>Comprovante Rejeitado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-blue-100 text-blue-900 px-3 py-1 rounded-full font-black text-[11px]">
                    <Clock size={13} className="text-blue-700" />
                    <span>Aguardando Pagamento</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-600 font-medium">
                Atleta: <strong>{activeInscricao.nome || 'Atleta'}</strong> • Categoria: <strong>{activeInscricao.categoria || 'SUB-9'}</strong> • Taxa: <strong className="text-emerald-700">R$ 25,00</strong>
              </div>

              {/* Mensagem caso comprovante já tenha sido enviado */}
              {activeInscricao.status === 'Aguardando Conferência' && (
                <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={18} className="text-amber-800" />
                    </div>
                    <div>
                      <h4 className="font-black text-amber-950 text-sm">
                        Comprovante enviado! Seu pagamento está aguardando conferência pela organização.
                      </h4>
                      <p className="text-xs text-amber-900 mt-1 font-medium leading-relaxed">
                        A coordenação do torneio está conferindo o comprovante anexado. Assim que verificado pelo administrador, seu atleta será confirmado oficialmente para o Draft!
                      </p>
                    </div>
                  </div>

                  {activeInscricao.comprovanteNomeArquivo && (
                    <div className="flex items-center justify-between bg-white/90 p-2.5 rounded-xl border border-amber-200 text-xs">
                      <span className="font-semibold text-gray-700 flex items-center gap-1.5 truncate">
                        <FileCheck size={14} className="text-emerald-600 shrink-0" />
                        <span className="truncate">{activeInscricao.comprovanteNomeArquivo}</span>
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                        Enviado
                      </span>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-gray-500 font-semibold">Precisa reenviar ou corrigir o arquivo?</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                    >
                      Substituir comprovante
                    </button>
                  </div>
                </div>
              )}

              {/* Mensagem caso o comprovante tenha sido recusado */}
              {activeInscricao.status === 'Comprovante Rejeitado' && (
                <div className="p-4 bg-rose-50 rounded-2xl border-2 border-rose-300 space-y-2">
                  <div className="flex items-center gap-2 text-rose-950 font-black text-sm">
                    <XCircle size={18} className="text-rose-600 shrink-0" />
                    <span>Comprovante não aprovado pela organização</span>
                  </div>
                  <p className="text-xs text-rose-900 font-semibold">
                    Motivo informado: <strong>{activeInscricao.motivoRejeicao || 'Comprovante ilegível ou divergente.'}</strong>
                  </p>
                  <p className="text-xs text-rose-800">
                    Por favor, faça um novo envio anexando um comprovante legível abaixo:
                  </p>
                </div>
              )}

              {/* QR Code Real Pix do Sistema */}
              <div className="p-4 bg-gradient-to-b from-gray-50 to-emerald-50/40 rounded-2xl border-2 border-emerald-200 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-black uppercase text-emerald-900 mb-2 flex items-center gap-1.5">
                  <QrCode size={16} /> Escaneie o QR Code no App do seu Banco
                </span>

                <div className="bg-white p-3.5 rounded-2xl shadow-md border-2 border-emerald-300 mb-3">
                  <QRCodeSVG 
                    value={PIX_INFO.copiaECola}
                    size={210}
                    level="M"
                    includeMargin={true}
                    className="mx-auto"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs font-black text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs mb-3">
                  <span>Valor da Taxa:</span>
                  <span className="text-emerald-700 text-sm font-black">R$ 25,00</span>
                </div>

                {/* BOTÃO PRINCIPAL: COPIAR PIX COPIA E COLA */}
                <button
                  type="button"
                  onClick={copiarPixCopiaECola}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                    copiaEColaCopiado 
                      ? 'bg-emerald-700 text-white ring-2 ring-emerald-400' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.01]'
                  }`}
                >
                  {copiaEColaCopiado ? <Check size={18} /> : <Copy size={18} />}
                  <span>{copiaEColaCopiado ? 'Código Pix Copiado com Sucesso!' : 'Copiar Código Pix Copia e Cola (R$ 25,00)'}</span>
                </button>
                <span className="text-[10px] text-gray-500 font-semibold mt-1.5">
                  No app do seu banco, escolha <strong>Pix Copia e Cola</strong> e cole o código.
                </span>
              </div>

              {/* Dados do Titular / Beneficiário do Pix */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2 text-xs shadow-xs">
                <div className="grid grid-cols-2 gap-2 pb-2 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Beneficiário / Titular:</span>
                    <span className="font-black text-gray-900 text-xs">{PIX_INFO.titular}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Instituição:</span>
                    <span className="font-black text-emerald-700 text-xs">{PIX_INFO.instituicao}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Cidade / UF:</span>
                    <span className="font-bold text-gray-700 text-xs">{PIX_INFO.cidade}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Chave Alternativa:</span>
                    <span className="font-mono text-gray-700 text-[11px]">{PIX_INFO.chave}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-gray-500 font-semibold">Chave Pix (E-mail):</span>
                  <button
                    type="button"
                    onClick={copiarChavePix}
                    className="text-blue-700 hover:text-blue-900 text-xs font-black underline cursor-pointer"
                  >
                    {pixCopiado ? 'Copiada!' : 'Copiar Chave'}
                  </button>
                </div>
              </div>

              {/* SEÇÃO PRINCIPAL: ENVIAR COMPROVANTE (IMAGEM OU PDF) */}
              <div className="bg-slate-50 border-2 border-dashed border-blue-300 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5">
                    <UploadCloud size={16} className="text-blue-600" />
                    <span>Enviar Comprovante de Pagamento</span>
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-black px-2 py-0.5 rounded-full">
                    Foto / Print / PDF
                  </span>
                </div>

                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  Após realizar o pagamento de R$ 25,00 no seu banco, anexe a foto ou PDF do comprovante aqui para conferência da organização:
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  className="hidden"
                />

                {!selectedFile ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3.5 px-4 rounded-xl border-2 border-blue-400 bg-white hover:bg-blue-50/70 text-blue-700 font-black text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <UploadCloud size={18} />
                    <span>ENVIAR COMPROVANTE (FOTO OU PDF)</span>
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    <div className="bg-white p-3 rounded-xl border border-blue-200 flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {selectedFile.name.toLowerCase().endsWith('.pdf') ? (
                          <FileText size={22} className="text-rose-500 shrink-0" />
                        ) : (
                          <ImageIcon size={22} className="text-blue-500 shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="text-xs font-black text-gray-900 truncate">{selectedFile.name}</p>
                          <p className="text-[10px] text-gray-500 font-semibold">{(selectedFile.size / 1024).toFixed(1)} KB selecionado</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Trocar arquivo"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleEnviarComprovante}
                      disabled={enviandoComprovante}
                      className="w-full py-3.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      {enviandoComprovante ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Enviando comprovante...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>CONFIRMAR ENVIO DO COMPROVANTE</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* AVISO IMPORTANTE: PODE SAIR E RETORNAR */}
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-[11px] text-blue-950 space-y-1">
                <p className="font-bold">
                  💡 Pode sair e retornar a qualquer momento:
                </p>
                <p>
                  Sua inscrição está salva com o protocolo <strong>{activeInscricao.codigoInscricao || activeInscricao.id}</strong>. Basta consultar este código na página inicial para verificar a conferência do pagamento ou enviar o comprovante.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleVerificarPagamentoManual}
                  disabled={verificandoPagamento}
                  className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={14} className={verificandoPagamento ? 'animate-spin' : ''} />
                  <span>{verificandoPagamento ? 'Consultando...' : 'Checar Status Agora'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPixModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Fechar janela
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUCESSO DA INSCRIÇÃO */}
      {successModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full border border-gray-100 text-center">
            {/* Brasão Oficial no Topo do Comprovante */}
            <div className="mb-4">
              <img 
                src={CRUZEIRINHO_LOGO} 
                alt="Brasão Projeto Cruzeirinho" 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                className="w-20 h-20 rounded-full mx-auto object-contain p-1 bg-white shadow-md border-2 border-blue-400" 
              />
            </div>

            {successModal.status === 'Aprovada' ? (
              <>
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <CheckCircle size={28} />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  Pix Confirmado • R$ 25,00 • PagSeguro
                </span>
                <h3 className="text-2xl font-black text-gray-900 mt-2">Inscrição Confirmada!</h3>
                <p className="text-xs font-semibold text-gray-600 mt-2 leading-relaxed">
                  O Pix de <strong>R$ 25,00</strong> para Douglas Leonel Leite foi registrado. O atleta <strong>{successModal.nome || 'Atleta'}</strong> está oficialmente inscrito no <strong>{successModal.categoria || 'SUB-9'}</strong> e pronto para a montagem dos times e draft!
                </p>

                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 my-4 text-left text-xs space-y-1">
                  <p><span className="text-gray-400 font-bold">Atleta:</span> <strong>{successModal.nome || 'Atleta'}</strong></p>
                  <p><span className="text-gray-400 font-bold">Categoria:</span> <strong>{successModal.categoria || 'SUB-9'}</strong></p>
                  <p><span className="text-gray-400 font-bold">Status:</span> <span className="font-black text-emerald-700">Aprovada no Campeonato</span></p>
                  <p><span className="text-gray-400 font-bold">Protocolo:</span> <span className="font-mono text-gray-600">{successModal.id || 'CRUZ-2026'}</span></p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const msgNotif = `⚽ *NOTIFICAÇÃO DE PAGAMENTO PIX — PROJETO CRUZEIRINHO 2026*\n\n✅ *Atleta:* ${successModal.nome || 'Atleta'}\n🏆 *Categoria:* ${successModal.categoria || 'SUB-9'}\n👤 *Responsável:* ${successModal.responsavel || '-'}\n📱 *WhatsApp:* ${successModal.whatsapp || '-'}\n💰 *Valor:* R$ 25,00 (Confirmado)\n🏦 *Titular:* Douglas Leonel Leite (PagSeguro)\n🧾 *Ref:* ${successModal.comprovante || 'Pix PagSeguro'}\n📋 *Protocolo:* ${successModal.id || 'CRUZ-2026'}\n\nOlá Douglas, acabo de realizar o Pix da taxa de inscrição! Segue o comprovante para registro no sistema.`;
                      safeOpenUrl(`https://api.whatsapp.com/send?text=${encodeURIComponent(msgNotif)}`);
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Send size={16} />
                    <span>Notificar Douglas no WhatsApp (Pix R$ 25)</span>
                  </button>

                  <button
                    onClick={() => {
                      const msg = `⚽ *Comprovante de Inscrição - Brasileirão do Projeto Cruzeirinho 2026*\n\n✅ Atleta: ${successModal.nome || 'Atleta'}\n🏆 Categoria: ${successModal.categoria || 'SUB-9'}\n💰 Pagamento Pix: R$ 25,00 confirmado para Douglas Leonel Leite (PagSeguro)\n📋 Protocolo: ${successModal.id || 'CRUZ-2026'}`;
                      safeOpenUrl(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`);
                    }}
                    className="w-full py-2.5 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Share2 size={15} />
                    <span>Compartilhar Comprovante</span>
                  </button>

                  <button
                    onClick={() => setSuccessModal(null)}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    Fechar e Fazer Outra Inscrição
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Shield size={38} />
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                  Vaga Solidária • Análise Social
                </span>
                <h3 className="text-2xl font-black text-gray-900 mt-2">Inscrição Enviada para Análise</h3>
                <p className="text-xs font-semibold text-gray-600 mt-2 leading-relaxed">
                  A solicitação de isenção de <strong>{successModal.nome || 'Atleta'}</strong> no <strong>{successModal.categoria || 'SUB-9'}</strong> foi recebida com sucesso.
                </p>

                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 my-4 text-left text-xs space-y-1">
                  <p><span className="text-gray-400 font-bold">Atleta:</span> <strong>{successModal.nome || 'Atleta'}</strong></p>
                  <p><span className="text-gray-400 font-bold">Categoria:</span> <strong>{successModal.categoria || 'SUB-9'}</strong></p>
                  <p><span className="text-gray-400 font-bold">Responsável:</span> <strong>{successModal.responsavel || '-'}</strong></p>
                  <p><span className="text-gray-400 font-bold">Status:</span> <span className="font-black text-amber-600">Pendente de Avaliação</span></p>
                  <p><span className="text-gray-400 font-bold">Protocolo:</span> <span className="font-mono text-gray-600">{successModal.id || 'CRUZ-2026'}</span></p>
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-bold mb-4">
                  ⏳ A inscrição solidária fica pendente e só será confirmada após aprovação pelo coordenador no painel administrativo.
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const msgSolidaria = `⚽ *SOLICITAÇÃO DE INSCRIÇÃO SOLIDÁRIA — PROJETO CRUZEIRINHO 2026*\n\n🤝 *Novo pedido de vaga solidária para análise social:*\n👦 *Atleta:* ${successModal.nome || 'Atleta'}\n🏆 *Categoria:* ${successModal.categoria || 'SUB-9'}\n👤 *Responsável:* ${successModal.responsavel || '-'}\n📱 *WhatsApp do Responsável:* ${successModal.whatsapp || '-'}\n📋 *Protocolo:* ${successModal.id || 'CRUZ-2026'}\n\nOlá Douglas, acabei de realizar o pedido de inscrição solidária pelo site oficial do Cruzeirinho e solicito a avaliação para a vaga. Aguardo a confirmação no painel de administração!`;
                      safeOpenUrl(`https://api.whatsapp.com/send?text=${encodeURIComponent(msgSolidaria)}`);
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Send size={16} />
                    <span>Notificar Douglas no WhatsApp (Vaga Solidária)</span>
                  </button>

                  <button
                    onClick={() => setSuccessModal(null)}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors"
                  >
                    Entendido! Voltar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// NOVO: DASHBOARD 'TEAM OVERVIEW' (VISÃO GERAL DAS EQUIPES)
// Agrega e exibe o total de gols e assistências para cada time
// calculado a partir das estatísticas individuais dos atletas
// -------------------------------------------------------------
const TeamOverviewDashboard = ({ 
  equipes, 
  atletas 
}: { 
  equipes: Equipe[]; 
  atletas: Atleta[]; 
}) => {
  const [categoria, setCategoria] = useState<'TODAS' | 'SUB-9' | 'SUB-11' | 'SUB-16'>('TODAS');
  const [busca, setBusca] = useState('');
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // Agregação dos dados por equipe
  const aggregatedTeams = useMemo(() => {
    return equipes.map(eq => {
      const membros = atletas.filter(a => a.equipeId === eq.id);
      const totalGols = membros.reduce((acc, curr) => acc + (curr.gols || 0), 0);
      const totalAssists = membros.reduce((acc, curr) => acc + (curr.assistencias || 0), 0);
      const totalParticipacoes = totalGols + totalAssists;

      // Artilheiro do time
      const artilheiro = [...membros].sort((a, b) => (b.gols || 0) - (a.gols || 0))[0] || null;
      // Garçom do time (assistências)
      const garcom = [...membros].sort((a, b) => (b.assistencias || 0) - (a.assistencias || 0))[0] || null;

      // Força técnica média (Draft)
      const mediaNota = membros.length > 0
        ? (membros.reduce((acc, curr) => acc + (curr.nota || 3), 0) / membros.length).toFixed(1)
        : '0.0';

      return {
        ...eq,
        membros,
        totalGols,
        totalAssists,
        totalParticipacoes,
        mediaNota,
        artilheiro,
        garcom,
      };
    });
  }, [equipes, atletas]);

  // Totais gerais para os cards de topo
  const totaisGerais = useMemo(() => {
    const totalGolsTorneio = atletas.reduce((acc, a) => acc + (a.gols || 0), 0);
    const totalAssistsTorneio = atletas.reduce((acc, a) => acc + (a.assistencias || 0), 0);
    const timeMelhorAtaque = [...aggregatedTeams].sort((a, b) => b.totalGols - a.totalGols)[0] || null;

    return {
      totalGolsTorneio,
      totalAssistsTorneio,
      timeMelhorAtaque,
    };
  }, [atletas, aggregatedTeams]);

  // Filtros de busca e categoria
  const filtradas = (aggregatedTeams || [])
    .filter(t => categoria === 'TODAS' || t.categoria === categoria)
    .filter(t => (t?.nome || '').toLowerCase().includes((busca || '').toLowerCase()))
    .sort((a, b) => b.totalGols - a.totalGols || b.totalAssists - a.totalAssists);

  return (
    <div className="max-w-6xl mx-auto mt-6 p-4 pb-20 animate-fade-in space-y-8">
      {/* Cabeçalho do Dashboard */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-black uppercase tracking-wider">
              Dashboard de Rendimento
            </span>
          </div>
          <h2 className="text-3xl font-black text-blue-950 mt-1 flex items-center gap-2">
            <BarChart3 className="text-blue-600" /> Visão Geral das Equipes (Team Overview)
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">
            Total de gols e assistências agregados a partir dos dados individuais de cada jogador
          </p>
        </div>

        {/* Seletor de Categoria */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-200">
          {(['TODAS', 'SUB-9', 'SUB-11', 'SUB-16'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                categoria === cat ? 'bg-blue-700 text-white shadow-sm' : 'text-gray-600 hover:text-blue-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de Métricas Agregadas do Torneio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <Goal size={28} />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-black uppercase">Gols Marcados (Torneio)</p>
            <p className="text-3xl font-black text-gray-900">{totaisGerais.totalGolsTorneio}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <UsersRound size={28} />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-black uppercase">Assistências Concluídas</p>
            <p className="text-3xl font-black text-gray-900">{totaisGerais.totalAssistsTorneio}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
            <Flame size={28} />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-black uppercase">Melhor Ataque Coletivo</p>
            <p className="text-lg font-black text-gray-900 truncate max-w-[180px]">
              {totaisGerais.timeMelhorAtaque?.nome || 'N/A'}
            </p>
            <span className="text-[11px] font-bold text-amber-700">
              {totaisGerais.timeMelhorAtaque?.totalGols || 0} gols marcados
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Busca de Equipe */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Buscar equipe pelo nome..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {/* Grid de Cards de Cada Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtradas.map(t => {
          const isExpanded = expandedTeamId === t.id;
          return (
            <div 
              key={t.id}
              className="bg-white rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 overflow-hidden flex flex-col transition-all"
            >
              {/* Header do Card com Cor do Time */}
              <div 
                className="p-5 text-white flex justify-between items-center shadow-xs" 
                style={{ backgroundColor: t.corPrincipal }}
              >
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider bg-black/25 px-2.5 py-0.5 rounded-full">
                    {t.categoria}
                  </span>
                  <h3 className="font-black text-xl text-white mt-1 drop-shadow-xs truncate">{t.nome}</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black">{t.membros.length}</span>
                  <p className="text-[10px] font-bold opacity-80 uppercase">Atletas</p>
                </div>
              </div>

              {/* Estatísticas Agregadas */}
              <div className="p-5 flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-gray-500 uppercase flex items-center justify-center gap-1">
                      <Goal size={13} className="text-emerald-600" /> Total Gols
                    </p>
                    <p className="text-3xl font-black text-emerald-600 mt-0.5">{t.totalGols}</p>
                  </div>
                  <div className="text-center border-l border-gray-200">
                    <p className="text-[11px] font-bold text-gray-500 uppercase flex items-center justify-center gap-1">
                      <UsersRound size={13} className="text-blue-600" /> Assistências
                    </p>
                    <p className="text-3xl font-black text-blue-700 mt-0.5">{t.totalAssists}</p>
                  </div>
                </div>

                {/* Destaques Individuais do Time */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                    <span className="font-bold text-gray-600">Artilheiro do Time:</span>
                    <span className="font-extrabold text-emerald-800">
                      {t.artilheiro && (t.artilheiro.gols || 0) > 0 ? (
                        `${t.artilheiro.nome} (${t.artilheiro.gols}G)`
                      ) : (
                        'Nenhum gol'
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                    <span className="font-bold text-gray-600">Líder em Passes:</span>
                    <span className="font-extrabold text-blue-800">
                      {t.garcom && (t.garcom.assistencias || 0) > 0 ? (
                        `${t.garcom.nome} (${t.garcom.assistencias}A)`
                      ) : (
                        'Nenhuma assistência'
                      )}
                    </span>
                  </div>

                  {/* Força Média (Draft) */}
                  <div className="flex justify-between items-center bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                    <span className="font-bold text-gray-700 flex items-center gap-1">
                      <Star size={13} className="text-amber-500 fill-amber-500" /> Força Média (Draft):
                    </span>
                    <span className="font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md text-xs">
                      ⭐ {t.mediaNota} / 5.0
                    </span>
                  </div>
                </div>

                {/* Botão Ver Elenco e Detalhes */}
                <button
                  onClick={() => setExpandedTeamId(isExpanded ? null : t.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>{isExpanded ? 'Ocultar Elenco' : 'Ver Todos os Jogadores do Time'}</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Lista Expandida de Membros com Gols e Assistências de cada um */}
                {isExpanded && (
                  <div className="pt-2 border-t border-gray-100 animate-fade-in">
                    <p className="text-[11px] font-black uppercase text-gray-400 mb-2">Desempenho Individual & Notas:</p>
                    <ul className="space-y-2 max-h-48 overflow-y-auto divide-y divide-gray-50 text-xs pr-1">
                      {t.membros.map(m => (
                        <li key={m.id} className="flex justify-between items-center pt-2 first:pt-0">
                          <div className="truncate mr-2">
                            <span className="font-bold text-gray-800 block truncate">{m.nome}</span>
                            <div className="mt-0.5">
                              <StarRating value={m.nota || 3} readOnly size={10} />
                            </div>
                          </div>
                          <span className="font-black text-gray-600 shrink-0">
                            <span className="text-emerald-600">{m.gols || 0}G</span> • <span className="text-blue-600">{m.assistencias || 0}A</span>
                          </span>
                        </li>
                      ))}
                      {t.membros.length === 0 && (
                        <li className="text-gray-400 italic text-center py-4">Nenhum jogador escalado nesta equipe ainda.</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtradas.length === 0 && (
        <div className="text-center text-gray-500 py-16 bg-white rounded-3xl border border-gray-200">
          Nenhuma equipe encontrada para os filtros selecionados.
        </div>
      )}
    </div>
  );
};

const ClassificacaoPublic = ({ partidas, equipes }: { partidas: Partida[]; equipes: Equipe[] }) => {
  const [categoria, setCategoria] = useState<'SUB-9' | 'SUB-11' | 'SUB-16'>('SUB-9');

  const tabela = useMemo(() => {
    let tab: Record<string, { id: string; nome: string; cor: string; pts: number; j: number; v: number; e: number; d: number; gp: number; gc: number; sg: number }> = {};

    equipes.filter(e => e.categoria === categoria).forEach(eq => {
      tab[eq.id] = { id: eq.id, nome: eq.nome, cor: eq.corPrincipal, pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0 };
    });

    partidas.filter(p => p.categoria === categoria && p.status === 'Finalizado').forEach(p => {
      const pm = Number(p.placarMandante) || 0;
      const pv = Number(p.placarVisitante) || 0;
      
      if (tab[p.mandanteId]) {
        tab[p.mandanteId].j += 1;
        tab[p.mandanteId].gp += pm;
        tab[p.mandanteId].gc += pv;
        tab[p.mandanteId].sg += (pm - pv);
        if (pm > pv) { 
          tab[p.mandanteId].v += 1; 
          tab[p.mandanteId].pts += 3; 
        } else if (pm === pv) { 
          tab[p.mandanteId].e += 1; 
          tab[p.mandanteId].pts += 1; 
        } else { 
          tab[p.mandanteId].d += 1; 
        }
      }

      if (tab[p.visitanteId]) {
        tab[p.visitanteId].j += 1;
        tab[p.visitanteId].gp += pv;
        tab[p.visitanteId].gc += pm;
        tab[p.visitanteId].sg += (pv - pm);
        if (pv > pm) { 
          tab[p.visitanteId].v += 1; 
          tab[p.visitanteId].pts += 3; 
        } else if (pv === pm) { 
          tab[p.visitanteId].e += 1; 
          tab[p.visitanteId].pts += 1; 
        } else { 
          tab[p.visitanteId].d += 1; 
        }
      }
    });

    return Object.values(tab).sort((a, b) => b.pts - a.pts || b.v - a.v || b.sg - a.sg || b.gp - a.gp);
  }, [partidas, equipes, categoria]);

  return (
    <div className="max-w-5xl mx-auto mt-6 p-4 pb-20 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-black text-blue-950 flex items-center gap-2">
            <Trophy className="text-amber-500" /> Tabela de Classificação
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">Pontuação atualizada automaticamente com os resultados dos jogos</p>
        </div>
        
        {/* Seletor de Categoria */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-200">
          {(['SUB-9', 'SUB-11', 'SUB-16'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                categoria === cat ? 'bg-blue-700 text-white shadow-sm' : 'text-gray-600 hover:text-blue-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-blue-900 text-white text-xs uppercase font-black">
              <tr>
                <th className="p-4 text-center w-14">#</th>
                <th className="p-4">Equipe</th>
                <th className="p-4 text-center bg-blue-950 font-black">PTS</th>
                <th className="p-4 text-center">J</th>
                <th className="p-4 text-center">V</th>
                <th className="p-4 text-center">E</th>
                <th className="p-4 text-center">D</th>
                <th className="p-4 text-center">GP</th>
                <th className="p-4 text-center">GC</th>
                <th className="p-4 text-center">SG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {tabela.map((t, idx) => (
                <tr key={t.id} className="hover:bg-blue-50/60 transition-colors">
                  <td className="p-4 text-center font-black text-gray-700">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                      idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      idx === 1 ? 'bg-gray-100 text-gray-800' :
                      idx === 2 ? 'bg-orange-100 text-orange-800' : 'text-gray-500'
                    }`}>
                      {idx + 1}º
                    </span>
                  </td>
                  <td className="p-4 font-extrabold text-gray-900 flex items-center">
                    <div className="w-3.5 h-3.5 rounded-full mr-2.5 shadow-xs" style={{ backgroundColor: t.cor }}></div>
                    {t.nome}
                  </td>
                  <td className="p-4 text-center font-black text-blue-700 text-base bg-blue-50/50">{t.pts}</td>
                  <td className="p-4 text-center font-semibold text-gray-700">{t.j}</td>
                  <td className="p-4 text-center font-semibold text-emerald-600">{t.v}</td>
                  <td className="p-4 text-center font-semibold text-gray-500">{t.e}</td>
                  <td className="p-4 text-center font-semibold text-rose-500">{t.d}</td>
                  <td className="p-4 text-center font-semibold text-gray-600">{t.gp}</td>
                  <td className="p-4 text-center font-semibold text-gray-600">{t.gc}</td>
                  <td className={`p-4 text-center font-black ${t.sg > 0 ? 'text-emerald-600' : t.sg < 0 ? 'text-rose-600' : 'text-gray-600'}`}>
                    {t.sg > 0 ? `+${t.sg}` : t.sg}
                  </td>
                </tr>
              ))}
              {tabela.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500 font-semibold">
                    Nenhuma equipe cadastrada para o {categoria}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TabelaPublic = ({ partidas, equipes }: { partidas: Partida[]; equipes: Equipe[] }) => {
  const [categoria, setCategoria] = useState<'TODOS' | 'SUB-9' | 'SUB-11' | 'SUB-16'>('TODOS');
  const getEquipe = (id: string) => equipes.find(e => e.id === id) || { nome: 'A Definir', corPrincipal: '#94a3b8' };
  
  const filtradas = partidas.filter(p => categoria === 'TODOS' || p.categoria === categoria);

  return (
    <div className="max-w-4xl mx-auto mt-6 p-4 pb-20 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-black text-blue-950 flex items-center gap-2">
            <CalendarDays className="text-blue-600" /> Tabela de Jogos
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">Calendário oficial de rodadas e confrontos</p>
        </div>

        {/* Filtro por categoria */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-200">
          {(['TODOS', 'SUB-9', 'SUB-11', 'SUB-16'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                categoria === cat ? 'bg-blue-700 text-white shadow-sm' : 'text-gray-600 hover:text-blue-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtradas.length === 0 && (
          <div className="text-center text-gray-500 p-12 bg-white rounded-2xl shadow-sm border border-gray-200">
            Nenhum jogo agendado nesta categoria.
          </div>
        )}

        {filtradas.map(p => {
          const mandante = getEquipe(p.mandanteId);
          const visitante = getEquipe(p.visitanteId);
          const isFinalizado = p.status === 'Finalizado';

          return (
            <div 
              key={p.id} 
              className="bg-white rounded-2xl shadow-md p-5 flex flex-col md:flex-row justify-between items-center border border-gray-100 hover:shadow-lg transition-shadow"
            >
              {/* Informações da data e categoria */}
              <div className="text-xs font-bold text-gray-500 mb-3 md:mb-0 w-full md:w-36 text-center md:text-left flex md:flex-col justify-between items-center md:items-start">
                <span className="flex items-center gap-1 text-gray-700">
                  <Calendar size={14} className="text-blue-600" /> {p.data} • {p.horario}
                </span>
                <span className="mt-1 px-2.5 py-0.5 bg-blue-100 text-blue-900 font-black rounded-full text-[10px]">
                  {p.categoria}
                </span>
              </div>

              {/* Placar / Confronto */}
              <div className="flex-1 flex items-center justify-center space-x-4 w-full my-2 md:my-0">
                <div className="w-5/12 text-right">
                  <span className="font-extrabold text-base md:text-lg block text-gray-900 truncate" style={{ color: mandante.corPrincipal }}>
                    {mandante.nome}
                  </span>
                </div>

                <div className="bg-gray-100 px-4 py-2 rounded-xl font-black text-xl md:text-2xl tracking-widest text-gray-800 min-w-[90px] text-center shadow-inner">
                  {isFinalizado ? `${p.placarMandante} - ${p.placarVisitante}` : 'VS'}
                </div>

                <div className="w-5/12 text-left">
                  <span className="font-extrabold text-base md:text-lg block text-gray-900 truncate" style={{ color: visitante.corPrincipal }}>
                    {visitante.nome}
                  </span>
                </div>
              </div>

              {/* Status do Jogo */}
              <div className="w-full md:w-28 text-center mt-2 md:mt-0 flex justify-center">
                <span className={`text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                  isFinalizado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {p.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EstatisticasPublic = ({ atletas, equipes }: { atletas: Atleta[]; equipes: Equipe[] }) => {
  const [categoria, setCategoria] = useState<'SUB-9' | 'SUB-11' | 'SUB-16'>('SUB-9');
  
  const getEquipe = (id: string | null) => {
    if (!id) return { nome: 'Sem Equipe', corPrincipal: '#94a3b8' };
    return equipes.find(e => e.id === id) || { nome: 'Sem Equipe', corPrincipal: '#94a3b8' };
  };
  
  const artilharia = [...atletas]
    .filter(a => a.categoria === categoria && (a.gols || 0) > 0)
    .sort((a, b) => (b.gols || 0) - (a.gols || 0));

  const assistencias = [...atletas]
    .filter(a => a.categoria === categoria && (a.assistencias || 0) > 0)
    .sort((a, b) => (b.assistencias || 0) - (a.assistencias || 0));

  return (
    <div className="max-w-5xl mx-auto mt-6 p-4 pb-20 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-black text-blue-950 flex items-center gap-2">
            <Activity className="text-blue-600" /> Rankings Individuais
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">Artilharia e líderes de assistências da competição</p>
        </div>

        {/* Seletor de Categoria */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-200">
          {(['SUB-9', 'SUB-11', 'SUB-16'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                categoria === cat ? 'bg-blue-700 text-white shadow-sm' : 'text-gray-600 hover:text-blue-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Artilharia */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Goal className="text-emerald-600" /> Artilharia
            </h3>
            <span className="text-xs font-bold text-gray-400 uppercase">Gols Marcados</span>
          </div>

          <ul className="space-y-3">
            {artilharia.map((a, i) => (
              <li key={a.id} className="flex justify-between items-center p-3.5 bg-gray-50 hover:bg-emerald-50/50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                    i === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' :
                    i === 1 ? 'bg-gray-300 text-gray-800' :
                    i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {i + 1}º
                  </span>
                  <div>
                    <span className="font-extrabold text-sm text-gray-900 block">{a.nome}</span>
                    <span className="text-xs font-bold" style={{ color: getEquipe(a.equipeId).corPrincipal }}>
                      {getEquipe(a.equipeId).nome}
                    </span>
                  </div>
                </div>
                <span className="font-black text-2xl text-emerald-600">{a.gols}</span>
              </li>
            ))}
            {artilharia.length === 0 && (
              <li className="text-gray-400 text-center py-8 text-sm font-semibold">
                Nenhum gol registrado nesta categoria até o momento.
              </li>
            )}
          </ul>
        </div>

        {/* Assistências */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <UsersRound className="text-blue-600" /> Passes para Gol
            </h3>
            <span className="text-xs font-bold text-gray-400 uppercase">Assistências</span>
          </div>

          <ul className="space-y-3">
            {assistencias.map((a, i) => (
              <li key={a.id} className="flex justify-between items-center p-3.5 bg-gray-50 hover:bg-blue-50/50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                    i === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' :
                    i === 1 ? 'bg-gray-300 text-gray-800' :
                    i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {i + 1}º
                  </span>
                  <div>
                    <span className="font-extrabold text-sm text-gray-900 block">{a.nome}</span>
                    <span className="text-xs font-bold" style={{ color: getEquipe(a.equipeId).corPrincipal }}>
                      {getEquipe(a.equipeId).nome}
                    </span>
                  </div>
                </div>
                <span className="font-black text-2xl text-blue-700">{a.assistencias}</span>
              </li>
            ))}
            {assistencias.length === 0 && (
              <li className="text-gray-400 text-center py-8 text-sm font-semibold">
                Nenhuma assistência registrada nesta categoria até o momento.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};


// --- PAINEL ADMINISTRATIVO: MÓDULOS ---

// 1. GERENCIAR JOGADORES / ATLETAS (EXCLUSÃO E EDIÇÃO IN-APP SEM WINDOW.CONFIRM)
const AdminAtletas = ({ 
  atletas, 
  equipes, 
  showToast, 
  onRefresh,
  requestConfirm,
}: { 
  atletas: Atleta[]; 
  equipes: Equipe[]; 
  showToast: (m: string, t?: string) => void; 
  onRefresh: () => void;
  requestConfirm: (title: string, message: string, action: () => void) => void;
}) => {
  const [busca, setBusca] = useState('');
  const [filtroCat, setFiltroCat] = useState<'TODAS' | 'SUB-9' | 'SUB-11' | 'SUB-16'>('TODAS');
  const [filtroNota, setFiltroNota] = useState<string>('TODAS');
  const [editingAtleta, setEditingAtleta] = useState<Atleta | null>(null);
  const [isNovoAtletaOpen, setIsNovoAtletaOpen] = useState(false);
  const [novoAtleta, setNovoAtleta] = useState({
    nome: '',
    categoria: 'SUB-9' as 'SUB-9' | 'SUB-11' | 'SUB-16',
    responsavel: '',
    equipeId: '' as string,
    nota: 3,
  });

  const handleExcluirAtleta = (id: string, nome: string) => {
    requestConfirm(
      'Excluir Jogador',
      `Deseja realmente excluir o jogador "${nome}" permanentemente do campeonato?`,
      async () => {
        try {
          await excluirAtleta(id);
          showToast(`Jogador "${nome}" excluído com sucesso!`);
          onRefresh();
        } catch {
          showToast('Erro ao excluir jogador', 'error');
        }
      }
    );
  };

  const handleQuickUpdateNota = async (id: string, novaNota: number, nome: string) => {
    try {
      await atualizarAtletaParcial(id, { nota: novaNota });
      showToast(`Nota ${novaNota} atribuída para ${nome}!`);
      onRefresh();
    } catch {
      showToast('Erro ao atualizar nota do jogador', 'error');
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAtleta) return;
    try {
      await salvarAtleta({
        ...editingAtleta,
        equipeId: editingAtleta.equipeId || null,
        nota: editingAtleta.nota || 3,
      });
      showToast('Jogador atualizado com sucesso!');
      setEditingAtleta(null);
      onRefresh();
    } catch {
      showToast('Erro ao atualizar jogador', 'error');
    }
  };

  const handleCriarAtleta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAtleta.nome.trim()) return showToast('Nome é obrigatório', 'error');
    try {
      await salvarAtleta({
        id: `atl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        nome: novoAtleta.nome,
        categoria: novoAtleta.categoria,
        responsavel: novoAtleta.responsavel,
        tipo: 'Normal',
        equipeId: novoAtleta.equipeId || null,
        gols: 0,
        assistencias: 0,
        nota: novoAtleta.nota || 3,
      }, true);
      showToast('Jogador cadastrado com sucesso!');
      setNovoAtleta({ nome: '', categoria: 'SUB-9', responsavel: '', equipeId: '', nota: 3 });
      setIsNovoAtletaOpen(false);
      onRefresh();
    } catch {
      showToast('Erro ao cadastrar jogador', 'error');
    }
  };

  const filtrados = (atletas || []).filter(a => {
    if (!a) return false;
    const nome = (a.nome || '').toLowerCase();
    const resp = (a.responsavel || '').toLowerCase();
    const buscaLower = (busca || '').toLowerCase().trim();
    const matchBusca = !buscaLower || nome.includes(buscaLower) || resp.includes(buscaLower);
    const matchCat = filtroCat === 'TODAS' || a.categoria === filtroCat;
    const matchNota = filtroNota === 'TODAS' || (a.nota || 3) === Number(filtroNota);
    return matchBusca && matchCat && matchNota;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Users className="text-blue-600" /> Gerenciar Jogadores / Atletas
            </h2>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Defina a nota de 1 a 5 de cada atleta, transfira de equipe ou exclua do campeonato
            </p>
          </div>

          <button
            onClick={() => setIsNovoAtletaOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs shadow-sm transition-colors cursor-pointer"
          >
            <UserPlus size={16} /> Cadastrar Jogador Manualmente
          </button>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nome do jogador ou responsável..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['TODAS', 'SUB-9', 'SUB-11', 'SUB-16'] as const).map(c => (
              <button
                key={c}
                onClick={() => setFiltroCat(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filtroCat === c ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
            <span className="text-[11px] font-black text-gray-500 px-2">Nota:</span>
            {['TODAS', '5', '4', '3', '2', '1'].map(n => (
              <button
                key={n}
                onClick={() => setFiltroNota(n)}
                className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filtroNota === n ? 'bg-white text-amber-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {n === 'TODAS' ? 'Todas' : `⭐ ${n}`}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela de Jogadores com Botões de Editar e Excluir */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-xs font-black border-b border-gray-100">
                <th className="p-3.5">Nome do Jogador</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5 text-center">Nível Técnico (1 a 5)</th>
                <th className="p-3.5">Equipe Atual</th>
                <th className="p-3.5">Responsável</th>
                <th className="p-3.5 text-center">Gols / Assists</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtrados.map(a => {
                const equipe = equipes.find(e => e.id === a.equipeId);
                return (
                  <tr key={a.id || a.nome || Math.random()} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-gray-900">
                      {a.nome || 'Jogador Sem Nome'}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-blue-50 text-blue-700">
                        {a.categoria || 'SUB-9'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <StarRating
                          value={a.nota || 3}
                          onChange={(n) => handleQuickUpdateNota(a.id, n, a.nome || 'Jogador')}
                          size={16}
                          showBadge={true}
                        />
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-xs" style={{ color: equipe?.corPrincipal || '#94a3b8' }}>
                      {equipe ? (
                        <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200" style={{ color: equipe.corPrincipal }}>
                          ● {equipe.nome}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-black">
                          Livre (Draft)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-xs text-gray-500">
                      {a.responsavel || 'Não informado'}
                    </td>
                    <td className="p-3.5 text-center text-xs font-bold text-gray-700">
                      <span className="text-emerald-600">{a.gols ?? 0}G</span> • <span className="text-blue-600">{a.assistencias ?? 0}A</span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setEditingAtleta(a)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer"
                          title="Editar dados do jogador"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleExcluirAtleta(a.id, a.nome || 'Jogador')}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Excluir jogador permanentemente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 font-semibold">
                    Nenhum jogador encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Editar Atleta */}
      {editingAtleta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full border border-gray-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900">Editar Dados do Jogador</h3>
              <button onClick={() => setEditingAtleta(null)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={editingAtleta.nome || ''}
                  onChange={e => setEditingAtleta({ ...editingAtleta, nome: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Seletor de Nota Técnica */}
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200">
                <label className="block text-xs font-bold text-amber-900 uppercase mb-1.5">
                  Nota Técnica / Nível de Draft (1 a 5)
                </label>
                <StarRating
                  value={editingAtleta.nota || 3}
                  onChange={n => setEditingAtleta({ ...editingAtleta, nota: n })}
                  size={24}
                  showBadge={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Categoria</label>
                  <select
                    value={editingAtleta.categoria}
                    onChange={e => setEditingAtleta({ ...editingAtleta, categoria: e.target.value as any })}
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="SUB-9">SUB-9</option>
                    <option value="SUB-11">SUB-11</option>
                    <option value="SUB-16">SUB-16</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Equipe</label>
                  <select
                    value={editingAtleta.equipeId || ''}
                    onChange={e => setEditingAtleta({ ...editingAtleta, equipeId: e.target.value || null })}
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="">Sem Equipe (Livre no Draft)</option>
                    {equipes.filter(e => e.categoria === editingAtleta.categoria).map(e => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome do Responsável</label>
                <input
                  type="text"
                  value={editingAtleta.responsavel || ''}
                  onChange={e => setEditingAtleta({ ...editingAtleta, responsavel: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAtleta(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs shadow-sm cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cadastrar Atleta Manualmente */}
      {isNovoAtletaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full border border-gray-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900">Novo Jogador</h3>
              <button onClick={() => setIsNovoAtletaOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCriarAtleta} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Thales Roberto Lima"
                  value={novoAtleta.nome}
                  onChange={e => setNovoAtleta({ ...novoAtleta, nome: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Seletor de Nota Técnica */}
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200">
                <label className="block text-xs font-bold text-amber-900 uppercase mb-1.5">
                  Nota Técnica / Nível de Draft (1 a 5)
                </label>
                <StarRating
                  value={novoAtleta.nota}
                  onChange={n => setNovoAtleta({ ...novoAtleta, nota: n })}
                  size={24}
                  showBadge={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Categoria</label>
                  <select
                    value={novoAtleta.categoria}
                    onChange={e => setNovoAtleta({ ...novoAtleta, categoria: e.target.value as any, equipeId: '' })}
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="SUB-9">SUB-9</option>
                    <option value="SUB-11">SUB-11</option>
                    <option value="SUB-16">SUB-16</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Equipe</label>
                  <select
                    value={novoAtleta.equipeId}
                    onChange={e => setNovoAtleta({ ...novoAtleta, equipeId: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="">Sem Equipe (Livre no Draft)</option>
                    {equipes.filter(e => e.categoria === novoAtleta.categoria).map(e => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome do Responsável</label>
                <input
                  type="text"
                  placeholder="Ex: Maria Barbosa"
                  value={novoAtleta.responsavel}
                  onChange={e => setNovoAtleta({ ...novoAtleta, responsavel: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNovoAtletaOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs shadow-sm cursor-pointer"
                >
                  Cadastrar Jogador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminInscricoes = ({ 
  inscricoes, 
  showToast, 
  onRefresh,
  requestConfirm,
}: { 
  inscricoes: Inscrição[]; 
  showToast: (m: string, t?: string) => void; 
  onRefresh: () => void;
  requestConfirm: (title: string, message: string, action: () => void) => void;
}) => {
  const [filtroStatus, setFiltroStatus] = useState<string>('TODAS');
  const [comprovanteModal, setComprovanteModal] = useState<Inscrição | null>(null);
  const [rejeitarModal, setRejeitarModal] = useState<{ isOpen: boolean; id: string; nome: string }>({
    isOpen: false,
    id: '',
    nome: '',
  });

  const handleStatus = async (id: string, status: 'Aprovada' | 'Recusada') => {
    try {
      await atualizarStatusInscricao(id, status, inscricoes);
      showToast(`Inscrição ${status.toLowerCase()} com sucesso!`);
      onRefresh();
    } catch {
      showToast('Erro ao atualizar status', 'error');
    }
  };

  const handleConfirmarPagamento = async (id: string, nome: string) => {
    requestConfirm('Confirmar Pagamento', `Confirmar manualmente o pagamento de R$ 25,00 da taxa de "${nome}" e liberar atleta para o torneio?`, async () => {
      try {
        const res = await confirmarPagamentoManual(id);
        if (res.success) {
          showToast(`Pagamento de ${nome} confirmado e atleta liberado para o draft! ✅`);
          onRefresh();
        } else {
          showToast(res.error || 'Erro ao confirmar pagamento', 'error');
        }
      } catch {
        showToast('Erro ao confirmar pagamento', 'error');
      }
    });
  };

  const handleAbrirRejeitarComprovante = (id: string, nome: string) => {
    setRejeitarModal({ isOpen: true, id, nome });
  };

  const handleConfirmarRejeicaoComprovante = async (motivo: string) => {
    if (!rejeitarModal.id) return;
    try {
      const res = await rejeitarComprovanteInscricao(rejeitarModal.id, motivo);
      if (res.success) {
        showToast(`Comprovante de ${rejeitarModal.nome} rejeitado. O participante poderá reenviar.`);
        onRefresh();
      } else {
        showToast(res.error || 'Erro ao rejeitar comprovante', 'error');
      }
    } catch {
      showToast('Erro ao rejeitar comprovante', 'error');
    } finally {
      setRejeitarModal({ isOpen: false, id: '', nome: '' });
    }
  };

  const handleAprovarSolidariaManual = async (id: string, nome: string) => {
    requestConfirm('Aprovar Solidária', `Aprovar isenção solidária e incluir "${nome}" no campeonato e Draft?`, async () => {
      try {
        const res = await aprovarInscricaoSolidaria(id);
        if (res.success) {
          showToast(`Inscrição solidária de ${nome} aprovada com sucesso! ✅`);
          onRefresh();
        } else {
          showToast(res.error || 'Erro ao aprovar solidária', 'error');
        }
      } catch {
        showToast('Erro ao aprovar solidária', 'error');
      }
    });
  };

  const handleUpdateNota = async (id: string, novaNota: number, nomeAtleta: string) => {
    try {
      await atualizarAtletaParcial(id, { nota: novaNota });
      showToast(`Nota ${novaNota} atribuída para ${nomeAtleta}!`);
      onRefresh();
    } catch {
      showToast('Erro ao atualizar nota da inscrição', 'error');
    }
  };

  const handleExcluir = (id: string, nome: string) => {
    requestConfirm('Excluir Inscrição', `Excluir o registro de inscrição de "${nome}" permanentemente?`, async () => {
      try {
        await excluirInscricao(id);
        showToast('Inscrição excluída!');
        onRefresh();
      } catch {
        showToast('Erro ao excluir', 'error');
      }
    });
  };

  const renderStatusBadge = (i: Inscrição) => {
    if (i.tipo === 'Solidária') {
      if (i.status === 'Aprovada' || i.status === 'Inscrição Solidária Aprovada') {
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-300 inline-flex items-center gap-1">
            <CheckCircle size={12} className="text-teal-700" /> Solidária Aprovada
          </span>
        );
      }
      if (i.status === 'Recusada') {
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300">
            Recusada
          </span>
        );
      }
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300 inline-flex items-center gap-1">
          <Shield size={12} className="text-purple-700" /> Solidária em Análise
        </span>
      );
    }

    // Normal (Pix R$ 25)
    if (i.status === 'Inscrição Confirmada' || (i.pagamentoPixConfirmado && (i.status === 'Aprovada' || i.status === 'Pagamento Aprovado'))) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
          <CheckCircle size={12} className="text-emerald-700" /> Pagamento Confirmado
        </span>
      );
    }
    if (i.status === 'Aguardando Conferência' || (i.comprovanteArquivo && !i.pagamentoPixConfirmado && i.status !== 'Comprovante Rejeitado')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300 inline-flex items-center gap-1">
          <Clock size={12} className="text-amber-700 animate-pulse" /> Aguardando Conferência
        </span>
      );
    }
    if (i.status === 'Comprovante Rejeitado') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300 inline-flex items-center gap-1">
          <XCircle size={12} className="text-rose-700" /> Comprovante Rejeitado
        </span>
      );
    }
    if (i.status === 'Pagamento Recusado ou Cancelado' || i.status === 'Recusada' || i.statusPagamento === 'RECUSADO') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300">
          Pagamento Recusado
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300 inline-flex items-center gap-1">
        <AlertCircle size={12} className="text-blue-700" /> Aguardando Pix
      </span>
    );
  };

  const qtdAguardandoConferencia = inscricoes.filter(i => 
    i.tipo === 'Normal' && (i.status === 'Aguardando Conferência' || (i.comprovanteArquivo && !i.pagamentoPixConfirmado && i.status !== 'Comprovante Rejeitado'))
  ).length;

  const filtradas = inscricoes.filter(i => {
    if (filtroStatus === 'TODAS') return true;
    if (filtroStatus === 'Aguardando Conferência') {
      return i.tipo === 'Normal' && (i.status === 'Aguardando Conferência' || (i.comprovanteArquivo && !i.pagamentoPixConfirmado && i.status !== 'Comprovante Rejeitado'));
    }
    if (filtroStatus === 'Aguardando Pagamento') {
      return i.tipo === 'Normal' && !i.pagamentoPixConfirmado && i.status !== 'Recusada' && i.status !== 'Aguardando Conferência';
    }
    if (filtroStatus === 'Pagamento Aprovado') {
      return i.tipo === 'Normal' && (i.pagamentoPixConfirmado || i.status === 'Inscrição Confirmada' || i.status === 'Pagamento Aprovado');
    }
    if (filtroStatus === 'Solidárias') {
      return i.tipo === 'Solidária';
    }
    if (filtroStatus === 'Recusadas') {
      return i.status === 'Recusada' || i.status === 'Pagamento Recusado ou Cancelado' || i.status === 'Comprovante Rejeitado';
    }
    return i.status === filtroStatus;
  });

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-gray-900">Gerenciador de Inscrições</h2>
            {qtdAguardandoConferencia > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-black animate-pulse">
                {qtdAguardandoConferencia} {qtdAguardandoConferencia === 1 ? 'comprovante pendente' : 'comprovantes pendentes'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">
            Confira comprovantes de pagamento Pix (R$ 25,00), aprove inscrições e gerencie notas para o draft
          </p>
        </div>

        {/* Filtros com contador de conferência */}
        <div className="flex bg-gray-100 p-1 rounded-xl flex-wrap gap-1">
          {[
            { id: 'TODAS', label: 'Todas' },
            { id: 'Aguardando Conferência', label: `Conferência (${qtdAguardandoConferencia})`, highlight: qtdAguardandoConferencia > 0 },
            { id: 'Aguardando Pagamento', label: 'Aguardando Pix' },
            { id: 'Pagamento Aprovado', label: 'Confirmadas' },
            { id: 'Solidárias', label: 'Solidárias' },
            { id: 'Recusadas', label: 'Recusadas / Rejeitadas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFiltroStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filtroStatus === tab.id 
                  ? 'bg-white text-blue-900 shadow-sm' 
                  : tab.highlight
                  ? 'text-amber-800 font-black hover:text-amber-950'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[960px]">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase text-xs font-black border-b border-gray-100">
              <th className="p-3.5">Atleta & Protocolo</th>
              <th className="p-3.5">Categoria</th>
              <th className="p-3.5 text-center">Nota / Nível (1 a 5)</th>
              <th className="p-3.5">Contato / WhatsApp</th>
              <th className="p-3.5">Tipo & Comprovante</th>
              <th className="p-3.5">Status Oficial</th>
              <th className="p-3.5 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtradas.map(i => {
              const isPendenteSolidaria = i.tipo === 'Solidária' && (i.status === 'Pendente' || i.status === 'Inscrição Solidária em Análise');
              const temComprovante = !!i.comprovanteArquivo;
              const aguardaConferencia = i.tipo === 'Normal' && !i.pagamentoPixConfirmado && (i.status === 'Aguardando Conferência' || temComprovante);
              const isPendenteNormal = i.tipo === 'Normal' && !i.pagamentoPixConfirmado && i.status !== 'Aguardando Conferência';

              return (
                <tr key={i.id} className={`transition-colors ${aguardaConferencia ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-gray-50/80'}`}>
                  <td className="p-3.5 font-bold text-gray-900">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{i.nome}</span>
                      {i.codigoInscricao && (
                        <span className="font-mono text-[10px] bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded-md font-semibold">
                          {i.codigoInscricao}
                        </span>
                      )}
                    </div>
                    <span className="block text-xs font-normal text-gray-400 mt-0.5">
                      Nasc: {i.nascimento} • Resp: {i.responsavel}
                    </span>
                    {i.motivoRejeicao && i.status === 'Comprovante Rejeitado' && (
                      <span className="block text-[10px] text-rose-600 font-semibold mt-0.5">
                        Motivo recusa: {i.motivoRejeicao}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-black">
                      {i.categoria}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <StarRating
                        value={i.nota || 3}
                        onChange={(n) => handleUpdateNota(i.id, n, i.nome)}
                        size={17}
                        showBadge={true}
                      />
                      <span className="text-[10px] text-gray-400 font-semibold">Alterar nota</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-semibold text-gray-700 text-xs">
                    {i.whatsapp}
                  </td>
                  <td className="p-3.5">
                    {i.tipo === 'Solidária' ? (
                      <div>
                        <span className="text-xs px-2.5 py-1 rounded-md font-black bg-purple-100 text-purple-800 inline-block">
                          Solidária (Social)
                        </span>
                        <span className="block text-[10px] text-purple-600 font-semibold mt-1">
                          Sem taxa (Isenção)
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className={`text-xs px-2.5 py-1 rounded-md font-black inline-flex items-center gap-1 ${
                          i.pagamentoPixConfirmado 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : aguardaConferencia
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          <CreditCard size={12} /> Taxa R$ 25,00
                        </span>

                        {temComprovante ? (
                          <div>
                            <button
                              type="button"
                              onClick={() => setComprovanteModal(i)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-black border border-blue-200 transition-colors cursor-pointer shadow-xs"
                              title="Visualizar ou baixar comprovante"
                            >
                              <Eye size={13} />
                              <span>Ver Comprovante</span>
                            </button>
                            {i.comprovanteNomeArquivo && (
                              <span className="block text-[9px] text-gray-400 font-mono truncate max-w-[150px] mt-0.5" title={i.comprovanteNomeArquivo}>
                                {i.comprovanteNomeArquivo}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="block text-[10px] text-gray-400 font-semibold">
                            Sem comprovante anexado
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3.5">
                    {renderStatusBadge(i)}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {/* Botão de conferência direta do comprovante */}
                      {temComprovante && (
                        <button
                          type="button"
                          onClick={() => setComprovanteModal(i)}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer flex items-center gap-1"
                          title="Visualizar o comprovante enviado pelo participante"
                        >
                          <Eye size={13} />
                          <span>Ver</span>
                        </button>
                      )}

                      {/* Botão CONFIRMAR PAGAMENTO (manual pelo admin) */}
                      {(aguardaConferencia || isPendenteNormal) && (
                        <button 
                          onClick={() => handleConfirmarPagamento(i.id, i.nome)} 
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-sm cursor-pointer flex items-center gap-1"
                          title="Confirmar pagamento e aprovar atleta para o draft"
                        >
                          <CheckCircle2 size={13} />
                          <span>Confirmar Pagamento</span>
                        </button>
                      )}

                      {/* Botão REJEITAR COMPROVANTE */}
                      {aguardaConferencia && (
                        <button 
                          onClick={() => handleAbrirRejeitarComprovante(i.id, i.nome)} 
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-black cursor-pointer flex items-center gap-1"
                          title="Rejeitar comprovante e solicitar reenvio"
                        >
                          <XCircle size={13} />
                          <span>Rejeitar</span>
                        </button>
                      )}

                      {/* Botão de aprovação solidária */}
                      {isPendenteSolidaria && (
                        <button 
                          onClick={() => handleAprovarSolidariaManual(i.id, i.nome)} 
                          className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-black shadow-sm cursor-pointer flex items-center gap-1"
                          title="Aprovar Inscrição Solidária e Cadastrar Atleta no Draft"
                        >
                          <CheckCircle size={14} />
                          <span>Aprovar Solidária</span>
                        </button>
                      )}

                      {/* Botão recusar inscrição solidária */}
                      {isPendenteSolidaria && (
                        <button 
                          onClick={() => handleStatus(i.id, 'Recusada')} 
                          className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-sm cursor-pointer"
                          title="Recusar Inscrição Solidária"
                        >
                          <XCircle size={16} />
                        </button>
                      )}

                      {/* Botão excluir registro */}
                      <button 
                        onClick={() => handleExcluir(i.id, i.nome)} 
                        className="p-1.5 bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Registro"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400 font-semibold">
                  Nenhuma inscrição encontrada neste filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Visualizar e Baixar Comprovante */}
      <ModalVisualizarComprovante
        isOpen={!!comprovanteModal}
        inscricao={comprovanteModal}
        onClose={() => setComprovanteModal(null)}
        onConfirmar={(id, nome) => handleConfirmarPagamento(id, nome)}
        onRejeitar={(id, nome) => handleAbrirRejeitarComprovante(id, nome)}
      />

      {/* Modal Rejeitar Comprovante */}
      <ModalRejeitarComprovante
        isOpen={rejeitarModal.isOpen}
        atletaNome={rejeitarModal.nome}
        onClose={() => setRejeitarModal({ isOpen: false, id: '', nome: '' })}
        onConfirmRejeicao={handleConfirmarRejeicaoComprovante}
      />
    </div>
  );
};

// 3. SORTEIO / DRAFT ORGANIZADO POR POTES DE NÍVEL (1 A 5 ESTRELAS)
const AdminSorteio = ({ 
  atletas, 
  equipes, 
  showToast, 
  onRefresh,
  requestConfirm,
}: { 
  atletas: Atleta[]; 
  equipes: Equipe[]; 
  showToast: (m: string, t?: string) => void; 
  onRefresh: () => void;
  requestConfirm: (title: string, message: string, action: () => void) => void;
}) => {
  const [categoria, setCategoria] = useState<'SUB-9' | 'SUB-11' | 'SUB-16'>('SUB-9');
  const [modoDraft, setModoDraft] = useState<'equilibrado' | 'aleatorio'>('equilibrado');
  const [poteAtivo, setPoteAtivo] = useState<'TODOS' | '5' | '4' | '3' | '2' | '1'>('TODOS');
  const [buscaDraft, setBuscaDraft] = useState('');
  const [sorteando, setSorteando] = useState(false);

  const atletasLivres = atletas.filter(a => a.categoria === categoria && !a.equipeId);
  const equipesCat = equipes.filter(e => e.categoria === categoria);

  // Atletas livres agrupados por potes de notas 1 a 5
  const potes = useMemo(() => {
    return {
      5: atletasLivres.filter(a => (a.nota || 3) === 5),
      4: atletasLivres.filter(a => (a.nota || 3) === 4),
      3: atletasLivres.filter(a => (a.nota || 3) === 3),
      2: atletasLivres.filter(a => (a.nota || 3) === 2),
      1: atletasLivres.filter(a => (a.nota || 3) === 1),
    };
  }, [atletasLivres]);

  const atletasLivresFiltrados = (atletasLivres || [])
    .filter(a => {
      if (!a) return false;
      const matchPote = poteAtivo === 'TODOS' || (a.nota || 3) === Number(poteAtivo);
      const nome = (a.nome || '').toLowerCase();
      const resp = (a.responsavel || '').toLowerCase();
      const buscaLower = (buscaDraft || '').toLowerCase().trim();
      const matchBusca = !buscaLower || nome.includes(buscaLower) || resp.includes(buscaLower);
      return matchPote && matchBusca;
    })
    .sort((a, b) => (b.nota || 3) - (a.nota || 3) || (a.nome || '').localeCompare(b.nome || ''));

  const handleUpdateNotaAtleta = async (atletaId: string, novaNota: number, nome: string) => {
    try {
      await atualizarAtletaParcial(atletaId, { nota: novaNota });
      showToast(`Nota ${novaNota} atribuída para ${nome}! Atleta remanejado no Draft.`);
      onRefresh();
    } catch {
      showToast('Erro ao atualizar nota do atleta', 'error');
    }
  };

  const handleEscalarManual = async (atletaId: string, equipeId: string, nomeAtleta: string) => {
    if (!equipeId) return;
    try {
      await atualizarAtletaParcial(atletaId, { equipeId });
      const equipe = equipes.find(e => e.id === equipeId);
      showToast(`${nomeAtleta} escalado no ${equipe?.nome || 'time'}!`);
      onRefresh();
    } catch {
      showToast('Erro ao escalar atleta', 'error');
    }
  };

  const handleRemoverDaEquipe = async (atletaId: string, nomeAtleta: string) => {
    try {
      await atualizarAtletaParcial(atletaId, { equipeId: null });
      showToast(`${nomeAtleta} retornou para a lista do Draft.`);
      onRefresh();
    } catch {
      showToast('Erro ao liberar atleta.', 'error');
    }
  };

  const handleExcluirAtleta = (atletaId: string, nome: string) => {
    requestConfirm('Excluir Atleta', `Excluir permanentemente o atleta "${nome}" do campeonato?`, async () => {
      try {
        await excluirAtleta(atletaId);
        showToast(`Atleta "${nome}" excluído com sucesso!`);
        onRefresh();
      } catch {
        showToast('Erro ao excluir atleta.', 'error');
      }
    });
  };

  const handleZerarEscalacoes = () => {
    requestConfirm(
      'Zerar Escalações da Categoria',
      `Deseja desescalar todos os jogadores da categoria ${categoria}? Todos voltarão para os potes do Draft para um novo sorteio.`,
      async () => {
        try {
          await zerarEscalacoes(categoria, atletas);
          showToast(`Escalações de ${categoria} resetadas com sucesso!`);
          onRefresh();
        } catch {
          showToast('Erro ao zerar escalações.', 'error');
        }
      }
    );
  };

  const realizarSorteio = () => {
    if (equipesCat.length === 0) return showToast('Cadastre equipes nesta categoria primeiro!', 'error');
    if (atletasLivres.length === 0) return showToast('Nenhum atleta aprovado sem equipe nesta categoria.', 'error');

    const descModo = modoDraft === 'equilibrado' 
      ? 'Equilibrado por Nível (Snake Draft - Potes 5 a 1 distribuídos igualmente)'
      : 'Totalmente Aleatório';

    requestConfirm(
      'Realizar Sorteio do Draft',
      `Deseja sortear ${atletasLivres.length} atletas para ${equipesCat.length} equipes da categoria ${categoria} no modo ${descModo}?`,
      async () => {
        setSorteando(true);
        try {
          await executarDraftSorteio(categoria, modoDraft, atletas, equipes);
          showToast('Draft e sorteio concluídos com equipes perfeitamente balanceadas!');
          onRefresh();
        } catch {
          showToast('Erro ao realizar sorteio.', 'error');
        } finally {
          setSorteando(false);
        }
      }
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Cabeçalho do Draft */}
      <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-[11px] font-black uppercase tracking-wider">
                Draft Cruzeirinho 2026
              </span>
            </div>
            <h2 className="text-3xl font-black text-blue-950 mt-1 flex items-center gap-2">
              <Shuffle className="text-blue-600" /> Sorteio & Draft Organizado por Nível
            </h2>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Defina as notas de 1 a 5 dos garotos, separe por potes e realize um sorteio equilibrado
            </p>
          </div>

          {/* Categoria */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-black text-gray-700 uppercase">Categoria:</label>
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              {(['SUB-9', 'SUB-11', 'SUB-16'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    categoria === c ? 'bg-blue-700 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Barra de Configuração do Modo de Draft e Ações */}
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-5 rounded-2xl border border-blue-100 flex flex-col lg:flex-row justify-between items-center gap-5">
          <div className="space-y-1 w-full lg:w-auto">
            <span className="text-xs font-black text-blue-950 uppercase tracking-wider">Modo de Sorteio do Draft:</span>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => setModoDraft('equilibrado')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  modoDraft === 'equilibrado'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Sparkles size={15} className={modoDraft === 'equilibrado' ? 'text-amber-300' : 'text-gray-400'} />
                <span>Draft Equilibrado por Nível (Snake Draft)</span>
              </button>

              <button
                onClick={() => setModoDraft('aleatorio')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  modoDraft === 'aleatorio'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Shuffle size={15} />
                <span>Totalmente Aleatório</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 font-semibold pt-1">
              {modoDraft === 'equilibrado'
                ? '⭐ Recomendado: distribui os atletas nota 5, 4, 3, 2 e 1 alternadamente entre as equipes para gerar médias idênticas de força!'
                : 'Sorteio tradicional simples sem levar em conta o nível técnico.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            <button
              onClick={handleZerarEscalacoes}
              className="px-4 py-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 font-black text-xs border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Voltar todos os jogadores desta categoria para o Draft"
            >
              <RefreshCw size={15} />
              <span>Zerar Escalações</span>
            </button>

            <button
              disabled={sorteando || atletasLivres.length === 0 || equipesCat.length === 0}
              onClick={realizarSorteio}
              className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Shuffle size={16} />
              <span>{sorteando ? 'Sorteando...' : `Realizar Sorteio (${atletasLivres.length} atletas)`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: POTES DO DRAFT (ATLETAS DISPONÍVEIS) */}
      <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <UsersRound className="text-blue-600" /> Potes do Draft — Atletas Disponíveis
              </h3>
              <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-black">
                {atletasLivres.length} sem time
              </span>
            </div>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Atribua a nota (1 a 5 estrelas) com 1 clique para organizar os garotos em potes de habilidades
            </p>
          </div>

          {/* Busca rápida no Draft */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Buscar atleta no draft..."
              value={buscaDraft}
              onChange={e => setBuscaDraft(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Abas dos Potes (Filtro por Nota) */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
          <button
            onClick={() => setPoteAtivo('TODOS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              poteAtivo === 'TODOS' ? 'bg-blue-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos os Potes ({atletasLivres.length})
          </button>

          <button
            onClick={() => setPoteAtivo('5')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              poteAtivo === '5' ? 'bg-amber-500 text-white shadow-sm' : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>Pote 1 (Nota 5 • Craques)</span>
            <span className="bg-black/20 text-white px-2 py-0.5 rounded-md text-[10px] font-black">{potes[5].length}</span>
          </button>

          <button
            onClick={() => setPoteAtivo('4')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              poteAtivo === '4' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span>Pote 2 (Nota 4 • Avançados)</span>
            <span className="bg-black/20 text-white px-2 py-0.5 rounded-md text-[10px] font-black">{potes[4].length}</span>
          </button>

          <button
            onClick={() => setPoteAtivo('3')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              poteAtivo === '3' ? 'bg-blue-700 text-white shadow-sm' : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            <span>Pote 3 (Nota 3 • Regulares/Bons)</span>
            <span className="bg-black/20 text-white px-2 py-0.5 rounded-md text-[10px] font-black">{potes[3].length}</span>
          </button>

          <button
            onClick={() => setPoteAtivo('2')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              poteAtivo === '2' ? 'bg-orange-500 text-white shadow-sm' : 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
            }`}
          >
            <span>Pote 4 (Nota 2 • Em Desenv.)</span>
            <span className="bg-black/20 text-white px-2 py-0.5 rounded-md text-[10px] font-black">{potes[2].length}</span>
          </button>

          <button
            onClick={() => setPoteAtivo('1')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              poteAtivo === '1' ? 'bg-gray-700 text-white shadow-sm' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            <span>Pote 5 (Nota 1 • Iniciantes)</span>
            <span className="bg-black/20 text-white px-2 py-0.5 rounded-md text-[10px] font-black">{potes[1].length}</span>
          </button>
        </div>

        {/* Grid de Cards dos Atletas no Draft */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {atletasLivresFiltrados.map(a => {
            const notaAtual = a.nota || 3;
            return (
              <div
                key={a.id}
                className="bg-gray-50/90 hover:bg-white rounded-2xl p-4 border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-black text-sm text-gray-900 leading-snug">{a.nome}</span>
                    <button
                      onClick={() => handleExcluirAtleta(a.id, a.nome)}
                      className="text-gray-300 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Excluir atleta do campeonato"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                    Resp: {a.responsavel || 'Não informado'}
                  </p>
                </div>

                {/* Seletor de Nota Interativo com 1 clique */}
                <div className="bg-white p-2 rounded-xl border border-gray-200/80 shadow-2xs">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Nota Técnica (1 a 5):</p>
                  <StarRating
                    value={notaAtual}
                    onChange={(n) => handleUpdateNotaAtleta(a.id, n, a.nome)}
                    size={16}
                    showBadge={true}
                  />
                </div>

                {/* Ação: Escalar manualmente em uma equipe */}
                <div className="pt-1">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleEscalarManual(a.id, e.target.value, a.nome);
                        e.target.value = "";
                      }
                    }}
                    className="w-full text-xs font-bold p-2 rounded-xl bg-white border border-gray-200 text-gray-700 outline-none hover:border-blue-400 cursor-pointer"
                  >
                    <option value="" disabled>⚡ Escalar no time...</option>
                    {equipesCat.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {atletasLivresFiltrados.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 font-semibold text-xs">
            {atletasLivres.length === 0
              ? 'Todos os atletas desta categoria já foram escalados nas equipes!'
              : 'Nenhum atleta encontrado neste filtro de pote ou busca.'}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: COMPOSIÇÃO DAS EQUIPES & FORÇA DOS ELENCOS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Trophy className="text-amber-500" /> Elencos das Equipes ({equipesCat.length})
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Acompanhe a força técnica média calculada para cada equipe e seus jogadores escalados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipesCat.map(eq => {
            const elenco = atletas.filter(a => a.equipeId === eq.id);
            const mediaNota = elenco.length > 0 
              ? (elenco.reduce((acc, curr) => acc + (curr.nota || 3), 0) / elenco.length).toFixed(1)
              : '0.0';

            // Contagem por notas
            const qtdNota5 = elenco.filter(a => (a.nota || 3) === 5).length;
            const qtdNota4 = elenco.filter(a => (a.nota || 3) === 4).length;
            const qtdNota3 = elenco.filter(a => (a.nota || 3) === 3).length;
            const qtdNota2 = elenco.filter(a => (a.nota || 3) === 2).length;
            const qtdNota1 = elenco.filter(a => (a.nota || 3) === 1).length;

            return (
              <div key={eq.id} className="border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col bg-white">
                {/* Header com Cor da Equipe */}
                <div 
                  className="p-4 text-white flex justify-between items-center shadow-xs" 
                  style={{ backgroundColor: eq.corPrincipal }}
                >
                  <div>
                    <span className="text-[10px] uppercase font-black bg-black/25 px-2 py-0.5 rounded-full">
                      {eq.categoria}
                    </span>
                    <h4 className="font-black text-base text-white mt-1 drop-shadow-xs">{eq.nome}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black">{elenco.length}</span>
                    <p className="text-[10px] font-bold opacity-80 uppercase">Atletas</p>
                  </div>
                </div>

                {/* Badge de Força Média do Time */}
                <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-600 flex items-center gap-1">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span>Força Média:</span>
                  </span>
                  <span className="font-black text-blue-950 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
                    ⭐ {mediaNota} / 5.0
                  </span>
                </div>

                {/* Resumo dos Potes no Time */}
                <div className="px-3 py-2 bg-white border-b border-gray-100 flex flex-wrap gap-1.5 text-[10px] font-black">
                  {qtdNota5 > 0 && <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">{qtdNota5}x ⭐5</span>}
                  {qtdNota4 > 0 && <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">{qtdNota4}x ⭐4</span>}
                  {qtdNota3 > 0 && <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md">{qtdNota3}x ⭐3</span>}
                  {qtdNota2 > 0 && <span className="bg-orange-100 text-orange-900 px-2 py-0.5 rounded-md">{qtdNota2}x ⭐2</span>}
                  {qtdNota1 > 0 && <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">{qtdNota1}x ⭐1</span>}
                </div>

                {/* Lista de Atletas do Time */}
                <ul className="p-3 text-xs space-y-2 bg-white flex-1 min-h-[160px] max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {elenco.map(a => (
                    <li key={a.id} className="flex justify-between items-center pt-2 first:pt-0">
                      <div className="truncate mr-2">
                        <span className="font-bold text-gray-800 block truncate">{a.nome}</span>
                        <div className="mt-0.5">
                          <StarRating value={a.nota || 3} readOnly size={11} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => handleRemoverDaEquipe(a.id, a.nome)} 
                          className="text-amber-600 hover:bg-amber-50 p-1.5 rounded-lg cursor-pointer" 
                          title="Liberar da equipe (voltar para o Draft)"
                        >
                          <X size={15} />
                        </button>
                        <button 
                          onClick={() => handleExcluirAtleta(a.id, a.nome)} 
                          className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg cursor-pointer" 
                          title="Excluir atleta permanentemente"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                  {elenco.length === 0 && (
                    <li className="text-gray-400 italic text-center py-8">Nenhum atleta vinculado ainda.</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 4. GERENCIAR EQUIPES (EDIÇÃO DE NOME, COR E CATEGORIA, E EXCLUSÃO IN-APP)
const AdminEquipes = ({ 
  equipes, 
  showToast, 
  onRefresh,
  requestConfirm,
}: { 
  equipes: Equipe[]; 
  showToast: (m: string, t?: string) => void;
  onRefresh: () => void;
  requestConfirm: (title: string, message: string, action: () => void) => void;
}) => {
  const [novaEquipe, setNovaEquipe] = useState({ 
    nome: '', 
    categoria: 'SUB-9' as 'SUB-9' | 'SUB-11' | 'SUB-16', 
    corPrincipal: '#1E3A8A' 
  });
  const [editingEquipe, setEditingEquipe] = useState<Equipe | null>(null);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await salvarEquipe({
        id: `eq-${novaEquipe.categoria.toLowerCase()}-${Date.now()}`,
        nome: novaEquipe.nome,
        categoria: novaEquipe.categoria,
        corPrincipal: novaEquipe.corPrincipal,
      }, true);
      showToast('Equipe criada com sucesso!');
      setNovaEquipe({ nome: '', categoria: 'SUB-9', corPrincipal: '#1E3A8A' });
      onRefresh();
    } catch {
      showToast('Erro ao criar equipe', 'error');
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipe) return;
    try {
      await salvarEquipe({
        ...editingEquipe,
        nome: editingEquipe.nome,
        categoria: editingEquipe.categoria,
        corPrincipal: editingEquipe.corPrincipal,
      });
      showToast('Equipe atualizada com sucesso!');
      setEditingEquipe(null);
      onRefresh();
    } catch {
      showToast('Erro ao atualizar equipe', 'error');
    }
  };

  const handleExcluir = (id: string, nome: string) => {
    requestConfirm(
      'Excluir Equipe',
      `Tem certeza que deseja excluir a equipe "${nome}"? Os atletas vinculados voltarão para a lista de sem time e jogos agendados serão desmarcados.`,
      async () => {
        try {
          await excluirEquipe(id);
          showToast(`Equipe "${nome}" removida com sucesso!`);
          onRefresh();
        } catch {
          showToast('Erro ao remover equipe', 'error');
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Formulário para cadastrar nova equipe */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="text-blue-600" /> Cadastrar Nova Equipe
        </h2>
        <form onSubmit={handleSalvar} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome do Time</label>
            <input 
              required 
              type="text" 
              value={novaEquipe.nome} 
              onChange={e => setNovaEquipe({ ...novaEquipe, nome: e.target.value })} 
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-bold outline-none" 
              placeholder="Ex: Cruzeirinho Estrela D'Alva" 
            />
          </div>

          <div className="w-full md:w-44">
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Categoria</label>
            <select 
              value={novaEquipe.categoria} 
              onChange={e => setNovaEquipe({ ...novaEquipe, categoria: e.target.value as any })} 
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-bold outline-none"
            >
              <option value="SUB-9">SUB-9</option>
              <option value="SUB-11">SUB-11</option>
              <option value="SUB-16">SUB-16</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cor</label>
            <input 
              type="color" 
              value={novaEquipe.corPrincipal} 
              onChange={e => setNovaEquipe({ ...novaEquipe, corPrincipal: e.target.value })} 
              className="w-14 h-9 p-1 border border-gray-300 rounded-xl cursor-pointer" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full md:w-auto bg-blue-700 hover:bg-blue-800 text-white font-black py-2.5 px-6 rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
          >
            Cadastrar Time
          </button>
        </form>
      </div>

      {/* Lista de Equipes com Opção de Editar e Excluir */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipes.map(eq => (
          <div 
            key={eq.id} 
            className="bg-white rounded-2xl shadow-sm hover:shadow-md p-4 flex justify-between items-center border-l-8 transition-shadow" 
            style={{ borderColor: eq.corPrincipal }}
          >
            <div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: eq.corPrincipal }} />
                <h3 className="font-extrabold text-base text-gray-900">{eq.nome}</h3>
              </div>
              <p className="text-xs font-bold text-blue-700 mt-1">{eq.categoria}</p>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setEditingEquipe(eq)} 
                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors cursor-pointer"
                title="Editar equipe"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => handleExcluir(eq.id, eq.nome)} 
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                title="Excluir equipe"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Edição de Equipe (Nome, Cor e Categoria) */}
      {editingEquipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full border border-gray-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900">Editar Equipe</h3>
              <button onClick={() => setEditingEquipe(null)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome da Equipe</label>
                <input
                  type="text"
                  required
                  value={editingEquipe.nome}
                  onChange={e => setEditingEquipe({ ...editingEquipe, nome: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Categoria</label>
                <select
                  value={editingEquipe.categoria}
                  onChange={e => setEditingEquipe({ ...editingEquipe, categoria: e.target.value as any })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="SUB-9">SUB-9</option>
                  <option value="SUB-11">SUB-11</option>
                  <option value="SUB-16">SUB-16</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cor Principal do Uniforme</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editingEquipe.corPrincipal}
                    onChange={e => setEditingEquipe({ ...editingEquipe, corPrincipal: e.target.value })}
                    className="w-14 h-11 p-1 border border-gray-300 rounded-xl cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingEquipe.corPrincipal}
                    onChange={e => setEditingEquipe({ ...editingEquipe, corPrincipal: e.target.value })}
                    className="flex-1 p-2.5 border border-gray-200 rounded-xl text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEquipe(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs shadow-sm cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 5. GERENCIAR PARTIDAS E RESULTADOS
const AdminPartidas = ({ 
  partidas, 
  equipes, 
  showToast, 
  onRefresh,
  requestConfirm,
}: { 
  partidas: Partida[]; 
  equipes: Equipe[]; 
  showToast: (m: string, t?: string) => void;
  onRefresh: () => void;
  requestConfirm: (title: string, message: string, action: () => void) => void;
}) => {
  const [novoJogo, setNovoJogo] = useState({ 
    categoria: 'SUB-9' as 'SUB-9' | 'SUB-11' | 'SUB-16', 
    data: '', 
    horario: '', 
    mandanteId: '', 
    visitanteId: '' 
  });

  const equipesCat = equipes.filter(e => e.categoria === novoJogo.categoria);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novoJogo.mandanteId === novoJogo.visitanteId) {
      return showToast('Escolha equipes diferentes para o jogo', 'error');
    }
    if (!novoJogo.mandanteId || !novoJogo.visitanteId) {
      return showToast('Selecione ambos os times', 'error');
    }
    
    try {
      await salvarPartida({
        id: `part-${novoJogo.categoria.toLowerCase()}-${Date.now()}`,
        categoria: novoJogo.categoria,
        data: novoJogo.data,
        horario: novoJogo.horario,
        mandanteId: novoJogo.mandanteId,
        visitanteId: novoJogo.visitanteId,
        placarMandante: 0,
        placarVisitante: 0,
        status: 'Agendado',
      }, true);
      showToast('Partida agendada com sucesso!');
      setNovoJogo({ ...novoJogo, data: '', horario: '', mandanteId: '', visitanteId: '' });
      onRefresh();
    } catch {
      showToast('Erro ao agendar partida', 'error');
    }
  };

  const handleFinalizar = async (id: string, pm: number, pv: number) => {
    try {
      const existing = partidas.find(p => p.id === id);
      if (existing) {
        await salvarPartida({
          ...existing,
          status: 'Finalizado',
          placarMandante: pm,
          placarVisitante: pv,
        });
      }
      showToast('Placar salvo e classificação atualizada!');
      onRefresh();
    } catch {
      showToast('Erro ao salvar placar', 'error');
    }
  };

  const handleExcluir = (id: string) => {
    requestConfirm('Excluir Partida', 'Excluir esta partida do calendário oficial?', async () => {
      try {
        await excluirPartida(id);
        showToast('Partida excluída!');
        onRefresh();
      } catch {
        showToast('Erro ao excluir', 'error');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="text-blue-600" /> Agendar Nova Partida
        </h2>
        <form onSubmit={handleCriar} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Categoria</label>
            <select 
              value={novoJogo.categoria} 
              onChange={e => setNovoJogo({ ...novoJogo, categoria: e.target.value as any, mandanteId: '', visitanteId: '' })} 
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-bold outline-none"
            >
              <option value="SUB-9">SUB-9</option>
              <option value="SUB-11">SUB-11</option>
              <option value="SUB-16">SUB-16</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data</label>
            <input 
              required 
              type="date" 
              value={novoJogo.data} 
              onChange={e => setNovoJogo({ ...novoJogo, data: e.target.value })} 
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-semibold outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Horário</label>
            <input 
              required 
              type="time" 
              value={novoJogo.horario} 
              onChange={e => setNovoJogo({ ...novoJogo, horario: e.target.value })} 
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-semibold outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mandante</label>
            <select 
              required 
              value={novoJogo.mandanteId} 
              onChange={e => setNovoJogo({ ...novoJogo, mandanteId: e.target.value })} 
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-semibold outline-none"
            >
              <option value="">Selecione Time</option>
              {equipesCat.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Visitante</label>
            <select 
              required 
              value={novoJogo.visitanteId} 
              onChange={e => setNovoJogo({ ...novoJogo, visitanteId: e.target.value })} 
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-semibold outline-none"
            >
              <option value="">Selecione Time</option>
              {equipesCat.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-2.5 rounded-xl shadow-sm text-xs cursor-pointer transition-colors"
          >
            Agendar Jogo
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-black text-gray-900 mb-4">Lançar Resultados e Placares</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px] border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-xs font-black border-b border-gray-100">
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Cat</th>
                <th className="p-3 text-right">Mandante</th>
                <th className="p-3 text-center">Placar</th>
                <th className="p-3 text-left">Visitante</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {partidas.map(p => {
                const m = equipes.find(e => e.id === p.mandanteId);
                const v = equipes.find(e => e.id === p.visitanteId);
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-xs font-semibold text-gray-600">
                      {p.data} <br/> {p.horario}
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {p.categoria}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black" style={{ color: m?.corPrincipal || '#1e3a8a' }}>
                      {m?.nome || 'A definir'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <input 
                          id={`pm_${p.id}`} 
                          type="number" 
                          defaultValue={p.placarMandante} 
                          className="w-12 text-center border border-gray-300 rounded-lg p-1 text-sm font-black outline-none focus:border-blue-500" 
                          min="0"
                        />
                        <span className="font-bold text-gray-400">x</span>
                        <input 
                          id={`pv_${p.id}`} 
                          type="number" 
                          defaultValue={p.placarVisitante} 
                          className="w-12 text-center border border-gray-300 rounded-lg p-1 text-sm font-black outline-none focus:border-blue-500" 
                          min="0"
                        />
                      </div>
                    </td>
                    <td className="p-3 text-left font-black" style={{ color: v?.corPrincipal || '#1e3a8a' }}>
                      {v?.nome || 'A definir'}
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                        p.status === 'Finalizado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => {
                            const pmInput = document.getElementById(`pm_${p.id}`) as HTMLInputElement;
                            const pvInput = document.getElementById(`pv_${p.id}`) as HTMLInputElement;
                            const pm = parseInt(pmInput?.value || '0');
                            const pv = parseInt(pvInput?.value || '0');
                            handleFinalizar(p.id, pm, pv);
                          }} 
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer"
                          title="Salvar resultado e recalcular tabela"
                        >
                          Salvar
                        </button>
                        <button 
                          onClick={() => handleExcluir(p.id)} 
                          className="p-1 bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 6. LANÇAR ARTILHARIA E ASSISTÊNCIAS
const AdminEstatisticas = ({ 
  atletas, 
  equipes, 
  showToast, 
  onRefresh 
}: { 
  atletas: Atleta[]; 
  equipes: Equipe[]; 
  showToast: (m: string, t?: string) => void;
  onRefresh: () => void;
}) => {
  const [busca, setBusca] = useState('');

  const updateStats = async (id: string, campo: 'gols' | 'assistencias', delta: number) => {
    const atleta = atletas.find(a => a.id === id);
    if (!atleta) return;
    const newVal = Math.max(0, (atleta[campo] || 0) + delta);

    try {
      await atualizarAtletaParcial(id, { [campo]: newVal });
      showToast('Estatística atualizada!');
      onRefresh();
    } catch {
      showToast('Erro ao atualizar estatística', 'error');
    }
  };

  const filtrados = (atletas || []).filter(a => a && (a.nome || '').toLowerCase().includes((busca || '').toLowerCase().trim()));

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Lançar Gols e Assistências</h2>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">Adicione ou reduza os gols e assistências dos atletas</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input 
          type="text" 
          placeholder="Buscar atleta por nome..." 
          value={busca} 
          onChange={e => setBusca(e.target.value)} 
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase text-xs font-black border-b border-gray-100">
              <th className="p-3">Atleta</th>
              <th className="p-3">Equipe</th>
              <th className="p-3 text-center">Gols Marcados</th>
              <th className="p-3 text-center">Assistências</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtrados.slice(0, 15).map(a => {
              const eq = equipes.find(e => e.id === a.equipeId);
              return (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-bold text-gray-900">
                    {a.nome} 
                    <span className="text-xs font-semibold text-gray-400 ml-1.5">({a.categoria})</span>
                  </td>
                  <td className="p-3 font-semibold" style={{ color: eq?.corPrincipal || '#94a3b8' }}>
                    {eq?.nome || 'Sem Equipe'}
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-xl border border-gray-200">
                      <button 
                        onClick={() => updateStats(a.id, 'gols', -1)} 
                        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-lg font-black hover:bg-gray-100 text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 font-black text-base text-emerald-600">{a.gols || 0}</span>
                      <button 
                        onClick={() => updateStats(a.id, 'gols', 1)} 
                        className="w-7 h-7 flex items-center justify-center bg-emerald-500 text-white rounded-lg font-black hover:bg-emerald-600 text-xs shadow-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-xl border border-gray-200">
                      <button 
                        onClick={() => updateStats(a.id, 'assistencias', -1)} 
                        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-lg font-black hover:bg-gray-100 text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 font-black text-base text-blue-600">{a.assistencias || 0}</span>
                      <button 
                        onClick={() => updateStats(a.id, 'assistencias', 1)} 
                        className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded-lg font-black hover:bg-blue-700 text-xs shadow-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// CENTRAL DE NOTIFICAÇÕES & ALERTAS DO COORDENADOR (DOUGLAS)
// -------------------------------------------------------------
interface AdminNotificacoesProps {
  inscricoes: Inscrição[];
  showToast: (m: string, t?: string) => void;
  onRefresh: () => void;
  somAtivo: boolean;
  onToggleSom: () => void;
  onTestarSom: () => void;
  notificacoesPermitidas: boolean;
  onRequestPermissaoNotificacao: () => void;
  historico: Array<{
    id: string;
    tipo: 'pix' | 'solidario' | 'conferencia';
    titulo: string;
    mensagem: string;
    atletaNome: string;
    categoria: string;
    responsavel?: string;
    whatsapp?: string;
    data: string;
  }>;
  onLimparHistorico: () => void;
}

const AdminNotificacoes = ({
  inscricoes,
  showToast,
  onRefresh,
  somAtivo,
  onToggleSom,
  onTestarSom,
  notificacoesPermitidas,
  onRequestPermissaoNotificacao,
  historico,
  onLimparHistorico,
}: AdminNotificacoesProps) => {
  const [abaAtiva, setAbaAtiva] = useState<'conferencia' | 'pix' | 'solidarias' | 'historico'>('conferencia');
  const [comprovanteModal, setComprovanteModal] = useState<Inscrição | null>(null);
  const [rejeitarModal, setRejeitarModal] = useState<{ isOpen: boolean; id: string; nome: string }>({
    isOpen: false,
    id: '',
    nome: '',
  });

  const inscricoesConferencia = inscricoes.filter(i => 
    i.tipo === 'Normal' && (i.status === 'Aguardando Conferência' || (i.comprovanteArquivo && !i.pagamentoPixConfirmado && i.status !== 'Comprovante Rejeitado'))
  );
  const inscricoesPix = inscricoes.filter(i => i.tipo === 'Normal' && (i.pagamentoPixConfirmado || i.status === 'Inscrição Confirmada' || i.status === 'Pagamento Aprovado'));
  const inscricoesSolidariasPendentes = inscricoes.filter(i => i.tipo === 'Solidária' && (i.status === 'Pendente' || i.status === 'Inscrição Solidária em Análise'));

  const handleConfirmarPagamento = async (id: string, nome: string) => {
    try {
      const res = await confirmarPagamentoManual(id);
      if (res.success) {
        showToast(`Pagamento de ${nome} confirmado e atleta liberado para o torneio! ✅`);
        onRefresh();
      } else {
        showToast(res.error || 'Erro ao confirmar pagamento.', 'error');
      }
    } catch {
      showToast('Erro ao confirmar pagamento.', 'error');
    }
  };

  const handleAbrirRejeitarComprovante = (id: string, nome: string) => {
    setRejeitarModal({ isOpen: true, id, nome });
  };

  const handleConfirmarRejeicaoComprovante = async (motivo: string) => {
    if (!rejeitarModal.id) return;
    try {
      const res = await rejeitarComprovanteInscricao(rejeitarModal.id, motivo);
      if (res.success) {
        showToast(`Comprovante de ${rejeitarModal.nome} rejeitado. O participante poderá reenviar.`);
        onRefresh();
      } else {
        showToast(res.error || 'Erro ao rejeitar comprovante', 'error');
      }
    } catch {
      showToast('Erro ao rejeitar comprovante', 'error');
    } finally {
      setRejeitarModal({ isOpen: false, id: '', nome: '' });
    }
  };

  const handleAprovarSolidaria = async (id: string, nome: string) => {
    try {
      const res = await aprovarInscricaoSolidaria(id);
      if (res.success) {
        showToast(`Inscrição solidária de ${nome} aprovada com sucesso! ✅`);
        onRefresh();
      } else {
        showToast(res.error || 'Erro ao aprovar inscrição.', 'error');
      }
    } catch {
      showToast('Erro ao aprovar inscrição.', 'error');
    }
  };

  const abrirWhatsappResponsavel = (whatsapp: string, nomeAtleta: string, tipo: string) => {
    const limpo = whatsapp.replace(/\D/g, '');
    const num = limpo.startsWith('55') ? limpo : `55${limpo}`;
    const msg = `Olá! Sou Douglas Leonel Leite, coordenador do Projeto Cruzeirinho. Entro em contato referente à inscrição (${tipo}) do atleta ${nomeAtleta} no Brasileirão 2026.`;
    window.open(`https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Cabeçalho */}
      <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-[11px] font-black uppercase tracking-wider">
                Alertas em Tempo Real
              </span>
              {inscricoesConferencia.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[11px] font-black animate-pulse">
                  {inscricoesConferencia.length} {inscricoesConferencia.length === 1 ? 'comprovante para conferir' : 'comprovantes para conferir'}
                </span>
              )}
              {inscricoesSolidariasPendentes.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-purple-600 text-white text-[11px] font-black">
                  {inscricoesSolidariasPendentes.length} solidárias pendentes
                </span>
              )}
            </div>
            <h2 className="text-3xl font-black text-blue-950 mt-1 flex items-center gap-2">
              <Bell className="text-blue-600" /> Central de Notificações & Pix
            </h2>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Conferência de comprovantes anexados, aprovação manual de pagamentos Pix (R$ 25,00) e vagas solidárias
            </p>
          </div>

          {/* Controles de Som e Notificação Push */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onToggleSom}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer border ${
                somAtivo 
                  ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' 
                  : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
              }`}
              title={somAtivo ? 'Som de alerta ativado' : 'Som de alerta desativado'}
            >
              {somAtivo ? <Volume2 size={16} className="text-blue-600" /> : <VolumeX size={16} />}
              <span>{somAtivo ? 'Som Ativado' : 'Som Mudo'}</span>
            </button>

            <button
              onClick={onTestarSom}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs border border-gray-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <BellRing size={15} className="text-amber-500" />
              <span>Testar Som</span>
            </button>

            <button
              onClick={onRequestPermissaoNotificacao}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                notificacoesPermitidas
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
            >
              <Bell size={15} />
              <span>{notificacoesPermitidas ? 'Alertas no Celular: Ativo ✅' : 'Ativar Alertas no Celular'}</span>
            </button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div 
            onClick={() => setAbaAtiva('conferencia')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              abaAtiva === 'conferencia' ? 'bg-amber-50 border-amber-400 shadow-sm ring-2 ring-amber-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-900 uppercase">Aguardando Conferência</span>
              <Clock className="text-amber-600" size={18} />
            </div>
            <p className="text-3xl font-black text-amber-700 mt-2">{inscricoesConferencia.length}</p>
            <p className="text-[11px] text-amber-800 font-semibold mt-1">
              R$ {(inscricoesConferencia.length * 25).toFixed(2).replace('.', ',')} a conferir
            </p>
          </div>

          <div 
            onClick={() => setAbaAtiva('pix')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              abaAtiva === 'pix' ? 'bg-emerald-50 border-emerald-300 shadow-sm ring-2 ring-emerald-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-500 uppercase">Pix Confirmados</span>
              <CreditCard className="text-emerald-600" size={18} />
            </div>
            <p className="text-3xl font-black text-emerald-700 mt-2">{inscricoesPix.length}</p>
            <p className="text-[11px] text-emerald-800 font-semibold mt-1">
              R$ {(inscricoesPix.length * 25).toFixed(2).replace('.', ',')} recebidos (Douglas Leonel Leite)
            </p>
          </div>

          <div 
            onClick={() => setAbaAtiva('solidarias')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              abaAtiva === 'solidarias' ? 'bg-purple-50 border-purple-300 shadow-sm ring-2 ring-purple-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-500 uppercase">Solidárias Pendentes</span>
              <Shield className="text-purple-600" size={18} />
            </div>
            <p className="text-3xl font-black text-purple-700 mt-2">{inscricoesSolidariasPendentes.length}</p>
            <p className="text-[11px] text-purple-800 font-semibold mt-1">
              Aguardando avaliação social
            </p>
          </div>

          <div 
            onClick={() => setAbaAtiva('historico')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              abaAtiva === 'historico' ? 'bg-blue-50 border-blue-300 shadow-sm ring-2 ring-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-500 uppercase">Alertas da Sessão</span>
              <Bell className="text-blue-600" size={18} />
            </div>
            <p className="text-3xl font-black text-blue-950 mt-2">{historico.length}</p>
            <p className="text-[11px] text-blue-700 font-semibold mt-1">
              Eventos em tempo real
            </p>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex gap-2 border-b border-gray-100 pt-6 overflow-x-auto">
          <button
            onClick={() => setAbaAtiva('conferencia')}
            className={`pb-3 px-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              abaAtiva === 'conferencia' ? 'border-amber-500 text-amber-800' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Clock size={15} />
            <span>Comprovantes para Conferência ({inscricoesConferencia.length})</span>
          </button>

          <button
            onClick={() => setAbaAtiva('pix')}
            className={`pb-3 px-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              abaAtiva === 'pix' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <CreditCard size={15} />
            <span>Pagamentos Pix Confirmados ({inscricoesPix.length})</span>
          </button>

          <button
            onClick={() => setAbaAtiva('solidarias')}
            className={`pb-3 px-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              abaAtiva === 'solidarias' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Shield size={15} />
            <span>Inscrições Solidárias ({inscricoesSolidariasPendentes.length})</span>
          </button>

          <button
            onClick={() => setAbaAtiva('historico')}
            className={`pb-3 px-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              abaAtiva === 'historico' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Bell size={15} />
            <span>Feed ao Vivo ({historico.length})</span>
          </button>
        </div>
      </div>

      {/* ABA NOVIDADE: COMPROVANTES AGUARDANDO CONFERÊNCIA */}
      {abaAtiva === 'conferencia' && (
        <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Clock className="text-amber-500" /> Inscrições Aguardando Conferência de Comprovante
              </h3>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">
                Veja o comprovante enviado pelo participante, confirme o pagamento ou solicite reenvio
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-amber-100 text-amber-900 rounded-full">
              {inscricoesConferencia.length} pendentes
            </span>
          </div>

          {inscricoesConferencia.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle2 size={44} className="mx-auto mb-2 text-emerald-400 opacity-60" />
              <p className="font-bold text-sm text-gray-700">Tudo em dia! Nenhum comprovante pendente de conferência.</p>
              <p className="text-xs text-gray-400 mt-1">Quando um participante enviar uma foto ou PDF do Pix, o alerta soará e ele aparecerá aqui.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {inscricoesConferencia.map((ins) => (
                <div key={ins.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-amber-50/40 p-4 rounded-2xl border border-amber-200/70 my-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-gray-900">{ins.nome}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-md">
                        {ins.categoria}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-md flex items-center gap-1">
                        <Clock size={11} /> Comprovante Anexado
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md font-mono">
                        Taxa: R$ 25,00
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 font-medium">
                      <strong>Responsável:</strong> {ins.responsavel} • <strong>WhatsApp:</strong> {ins.whatsapp}
                    </p>

                    <p className="text-[11px] text-gray-500 font-mono flex items-center gap-2">
                      <span>Protocolo: <strong>{ins.codigoInscricao || ins.id}</strong></span>
                      {ins.comprovanteNomeArquivo && (
                        <span>• Arquivo: <strong className="text-blue-800">{ins.comprovanteNomeArquivo}</strong></span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => setComprovanteModal(ins)}
                      className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                      title="Visualizar ou baixar o comprovante Pix"
                    >
                      <Eye size={14} />
                      <span>Ver Comprovante</span>
                    </button>

                    <button
                      onClick={() => handleConfirmarPagamento(ins.id, ins.nome)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                      title="Confirmar pagamento Pix R$ 25,00 e aprovar para o Draft"
                    >
                      <CheckCircle2 size={14} />
                      <span>Confirmar Pagamento</span>
                    </button>

                    <button
                      onClick={() => handleAbrirRejeitarComprovante(ins.id, ins.nome)}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs border border-rose-200 flex items-center gap-1 cursor-pointer"
                      title="Rejeitar comprovante e pedir reenvio"
                    >
                      <XCircle size={14} />
                      <span>Rejeitar</span>
                    </button>

                    <button
                      onClick={() => abrirWhatsappResponsavel(ins.whatsapp, ins.nome, 'Conferência de Pix')}
                      className="p-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 cursor-pointer"
                      title="Conversar no WhatsApp"
                    >
                      <Phone size={14} className="text-emerald-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 1: PAGAMENTOS PIX CONFIRMADOS */}
      {abaAtiva === 'pix' && (
        <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <CreditCard className="text-emerald-600" /> Atletas com Pagamento Pix Confirmado
              </h3>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">
                Taxa de R$ 25,00 confirmada na chave prjtcruzeirinho@gmail.com (Douglas Leonel Leite)
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              {inscricoesPix.length} confirmados
            </span>
          </div>

          {inscricoesPix.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CreditCard size={42} className="mx-auto mb-2 opacity-30" />
              <p className="font-bold text-sm">Nenhum pagamento Pix registrado ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {inscricoesPix.map((ins) => (
                <div key={ins.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:bg-gray-50 px-3 rounded-2xl transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-gray-900">{ins.nome}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-md">
                        {ins.categoria}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md flex items-center gap-1">
                        <Check size={10} /> R$ 25,00 Pago
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      <strong>Responsável:</strong> {ins.responsavel} • <strong>WhatsApp:</strong> {ins.whatsapp}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono">
                      Ref/Comprovante: {ins.comprovanteNomeArquivo || ins.comprovantePix || 'Pix Confirmado'} • Protocolo: {ins.codigoInscricao || ins.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ins.comprovanteArquivo && (
                      <button
                        onClick={() => setComprovanteModal(ins)}
                        className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 border border-blue-200 cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>Ver Comprovante</span>
                      </button>
                    )}
                    <button
                      onClick={() => abrirWhatsappResponsavel(ins.whatsapp, ins.nome, 'Pix Confirmado R$ 25')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Phone size={14} />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: INSCRIÇÕES SOLIDÁRIAS PENDENTES */}
      {abaAtiva === 'solidarias' && (
        <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Shield className="text-purple-600" /> Inscrições Solidárias para Avaliação Social
              </h3>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">
                Atletas que solicitaram isenção. Aprove para incluí-los oficialmente no campeonato e no Draft!
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
              {inscricoesSolidariasPendentes.length} aguardando
            </span>
          </div>

          {inscricoesSolidariasPendentes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle size={42} className="mx-auto mb-2 text-emerald-400 opacity-60" />
              <p className="font-bold text-sm text-gray-600">Nenhuma inscrição solidária pendente no momento!</p>
              <p className="text-xs text-gray-400 mt-1">Todas as solicitações enviadas já foram analisadas.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {inscricoesSolidariasPendentes.map((ins) => (
                <div key={ins.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-purple-50/40 p-4 rounded-2xl border border-purple-200/60 my-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-gray-900">{ins.nome}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-md">
                        {ins.categoria}
                      </span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black rounded-md">
                        Isenção Solidária
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      <strong>Responsável:</strong> {ins.responsavel} • <strong>WhatsApp:</strong> {ins.whatsapp}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono">
                      Nascimento: {ins.nascimento} • Protocolo: {ins.codigoInscricao || ins.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => abrirWhatsappResponsavel(ins.whatsapp, ins.nome, 'Inscrição Solidária')}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Phone size={14} className="text-emerald-600" />
                      <span>Falar no WhatsApp</span>
                    </button>

                    <button
                      onClick={() => handleAprovarSolidaria(ins.id, ins.nome)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Aprovar Inscrição</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: FEED AO VIVO DE NOTIFICAÇÕES */}
      {abaAtiva === 'historico' && (
        <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Bell className="text-blue-600" /> Feed de Eventos da Sessão
              </h3>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">
                Alertas detectados ao vivo nesta janela do navegador
              </p>
            </div>
            {historico.length > 0 && (
              <button
                onClick={onLimparHistorico}
                className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
              >
                Limpar Feed
              </button>
            )}
          </div>

          {historico.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bell size={42} className="mx-auto mb-2 opacity-30" />
              <p className="font-bold text-sm">Nenhum evento registrado nesta sessão.</p>
              <p className="text-xs text-gray-400 mt-1">Quando alguém enviar comprovante, fizer o Pix ou se inscrever como solidário, o alerta aparecerá aqui instantaneamente!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historico.map((h) => (
                <div key={h.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      h.tipo === 'conferencia' 
                        ? 'bg-amber-100 text-amber-800' 
                        : h.tipo === 'pix' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {h.tipo === 'conferencia' ? <Clock size={18} /> : h.tipo === 'pix' ? <CreditCard size={18} /> : <Shield size={18} />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900">{h.titulo}</p>
                      <p className="text-xs text-gray-600">{h.mensagem}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono shrink-0">{h.data}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Visualizar Comprovante direto da Central de Notificações */}
      <ModalVisualizarComprovante
        isOpen={!!comprovanteModal}
        inscricao={comprovanteModal}
        onClose={() => setComprovanteModal(null)}
        onConfirmar={(id, nome) => handleConfirmarPagamento(id, nome)}
        onRejeitar={(id, nome) => handleAbrirRejeitarComprovante(id, nome)}
      />

      {/* Modal Rejeitar Comprovante direto da Central de Notificações */}
      <ModalRejeitarComprovante
        isOpen={rejeitarModal.isOpen}
        atletaNome={rejeitarModal.nome}
        onClose={() => setRejeitarModal({ isOpen: false, id: '', nome: '' })}
        onConfirmRejeicao={handleConfirmarRejeicaoComprovante}
      />
    </div>
  );
};


// --- APP PRINCIPAL ---
export default function App() {
  const [route, setRoute] = useState('home');
  const [menuInscricoesOpen, setMenuInscricoesOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const isAdminRoute = route.startsWith('admin_') && route !== 'admin_login';
  
  // Login & Autenticação Segura (PBKDF2 + WebAuthn/Passkey + Sessão Persistente 30 dias)
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [webauthnSupported, setWebauthnSupported] = useState(false);
  
  // Dados do Sistema
  const [inscricoes, setInscricoes] = useState<Inscrição[]>([]);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type?: string }>({ show: false, msg: '' });

  // In-app Modal de Confirmação
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const requestConfirm = (title: string, message: string, action: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        action();
      },
    });
  };

  // Notificações e Sons do Coordenador Douglas
  const [somNotificacao, setSomNotificacao] = useState(() => {
    return localStorage.getItem('cruzeirinho_som_notif') !== 'false';
  });
  const [notificacoesPermitidas, setNotificacoesPermitidas] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });
  const [historicoNotificacoes, setHistoricoNotificacoes] = useState<Array<{
    id: string;
    tipo: 'pix' | 'solidario' | 'conferencia';
    titulo: string;
    mensagem: string;
    atletaNome: string;
    categoria: string;
    responsavel?: string;
    whatsapp?: string;
    data: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('cruzeirinho_notif_hist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isInitialInsc = React.useRef(true);

  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  };

  const triggerBrowserNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
        });
      } catch {}
    }
  };

  const handleRequestPermissaoNotificacao = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Seu navegador não suporta notificações do sistema.', 'error');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setNotificacoesPermitidas(true);
        showToast('Notificações no celular/navegador ativadas com sucesso! ✅');
        triggerBrowserNotification('Notificações Ativadas! ⚽', 'Você receberá alertas de inscrições e pagamentos Pix.');
      } else {
        setNotificacoesPermitidas(false);
        showToast('Permissão de notificação negada no navegador.', 'error');
      }
    } catch {
      showToast('Erro ao solicitar permissão de notificação.', 'error');
    }
  };

  const handleToggleSom = () => {
    setSomNotificacao(prev => {
      const novo = !prev;
      localStorage.setItem('cruzeirinho_som_notif', String(novo));
      if (novo) playNotificationSound();
      showToast(novo ? 'Sons de alerta ativados 🔊' : 'Sons de alerta silenciados 🔇');
      return novo;
    });
  };

  const handleTestarSom = () => {
    playNotificationSound();
    showToast('🔔 Som de alerta tocado!');
  };

  // PWA Install Hook
  const { isInstalled, isIOS, install, deferredPrompt } = usePWAInstall();
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);

  const handleInstallClick = async () => {
    if (isInstalled) {
      showToast('O aplicativo já está instalado no seu dispositivo! ✅');
      return;
    }
    if (deferredPrompt) {
      await install();
    } else if (isIOS) {
      setIsIOSModalOpen(true);
    } else {
      showToast('Para instalar: clique no menu do navegador e escolha "Instalar aplicativo" ou "Adicionar à tela inicial" 📱');
    }
  };

  const showToast = (msg: string, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '' }), 4000);
  };

  // Carregar dados da API do Cruzeirinho
  const carregarDados = async () => {
    try {
      const data = await carregarDadosCompletos();
      if (data) {
        setInscricoes(data.inscricoes || []);
        setAtletas(data.atletas || []);
        setEquipes(data.equipes || []);
        setPartidas(data.partidas || []);
      }
    } catch (e) {
      console.error('Erro ao buscar dados:', e);
    }
  };

  useEffect(() => {
    carregarDados();

    // Verificação de suporte a WebAuthn / Passkey biométrica
    if (typeof window !== 'undefined' && !!window.PublicKeyCredential) {
      setWebauthnSupported(true);
    }

    // Auto-login persistente por 30 dias no celular / navegador
    checkAdminSession().then(res => {
      if (res && res.authenticated) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }).catch(() => {
      setIsAdmin(false);
    });

    // Sincronização em tempo real permanente com o Cloud Firestore
    const unsubInsc = onSnapshot(collection(db, 'inscricoes'), (snap) => {
      if (!snap.empty) {
        const list: Inscrição[] = [];
        snap.forEach((d) => list.push(d.data() as Inscrição));
        list.sort((a, b) => new Date(b.dataEnvio || 0).getTime() - new Date(a.dataEnvio || 0).getTime());
        setInscricoes(list);
      }

      if (isInitialInsc.current) {
        isInitialInsc.current = false;
      } else {
        // Dispara notificações instantâneas em tempo real de novos comprovantes, pagamentos e inscrições solidárias
        snap.docChanges().forEach((change) => {
          const nova = change.doc.data() as Inscrição;
          const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

          // NOVO COMPROVANTE ENVIADO (AGUARDANDO CONFERÊNCIA)
          if (
            (change.type === 'added' || change.type === 'modified') &&
            (nova.status === 'Aguardando Conferência' || nova.statusPagamento === 'AGUARDANDO_CONFERENCIA')
          ) {
            if (somNotificacao) playNotificationSound();
            triggerBrowserNotification(
              '📄 Novo Comprovante Pix Recebido — Cruzeirinho',
              `${nova.nome} enviou comprovante no ${nova.categoria} (R$ 25,00) para conferência!`
            );
            showToast(`📄 NOVO COMPROVANTE PIX: ${nova.nome} (${nova.categoria}) aguarda sua conferência!`);
            setHistoricoNotificacoes(prev => {
              if (prev.some(p => p.id === `notif-conf-${nova.id}`)) return prev;
              const updated = [{
                id: `notif-conf-${nova.id}`,
                tipo: 'conferencia' as const,
                titulo: `📄 Comprovante Enviado • ${nova.nome}`,
                mensagem: `Taxa R$ 25,00 no ${nova.categoria}. Arquivo: ${nova.comprovanteNomeArquivo || 'anexado'}. Resp: ${nova.responsavel || '-'} (${nova.whatsapp || '-'})`,
                atletaNome: nova.nome,
                categoria: nova.categoria,
                responsavel: nova.responsavel,
                whatsapp: nova.whatsapp,
                data: hora,
              }, ...prev].slice(0, 50);
              try { localStorage.setItem('cruzeirinho_notif_hist', JSON.stringify(updated)); } catch {}
              return updated;
            });
          } else if (change.type === 'added' && nova.tipo === 'Normal' && nova.pagamentoPixConfirmado) {
            if (somNotificacao) playNotificationSound();
            triggerBrowserNotification(
              '💰 Novo Pix Recebido (R$ 25,00) — Cruzeirinho',
              `${nova.nome} confirmou o pagamento no ${nova.categoria}!`
            );
            showToast(`💰 NOVO PIX RECEBIDO (R$ 25,00): ${nova.nome} (${nova.categoria})!`);
            setHistoricoNotificacoes(prev => {
              const updated = [{
                id: `notif-${Date.now()}-${Math.random()}`,
                tipo: 'pix' as const,
                titulo: `💰 Pix Recebido (R$ 25,00) • ${nova.nome}`,
                mensagem: `Taxa confirmada no ${nova.categoria}. Responsável: ${nova.responsavel || '-'} (${nova.whatsapp || '-'})`,
                atletaNome: nova.nome,
                categoria: nova.categoria,
                responsavel: nova.responsavel,
                whatsapp: nova.whatsapp,
                data: hora,
              }, ...prev].slice(0, 50);
              try { localStorage.setItem('cruzeirinho_notif_hist', JSON.stringify(updated)); } catch {}
              return updated;
            });
          } else if (change.type === 'added' && nova.tipo === 'Solidária') {
            if (somNotificacao) playNotificationSound();
            triggerBrowserNotification(
              '🤝 Nova Inscrição Solidária — Cruzeirinho',
              `${nova.nome} enviou pedido de isenção no ${nova.categoria} para avaliação social.`
            );
            showToast(`🤝 NOVA INSCRIÇÃO SOLIDÁRIA: ${nova.nome} (${nova.categoria}) aguarda aprovação!`, 'info');
            setHistoricoNotificacoes(prev => {
              const updated = [{
                id: `notif-${Date.now()}-${Math.random()}`,
                tipo: 'solidario' as const,
                titulo: `🤝 Inscrição Solidária • ${nova.nome}`,
                mensagem: `Solicitação no ${nova.categoria} aguardando aprovação. Responsável: ${nova.responsavel || '-'} (${nova.whatsapp || '-'})`,
                atletaNome: nova.nome,
                categoria: nova.categoria,
                responsavel: nova.responsavel,
                whatsapp: nova.whatsapp,
                data: hora,
              }, ...prev].slice(0, 50);
              try { localStorage.setItem('cruzeirinho_notif_hist', JSON.stringify(updated)); } catch {}
              return updated;
            });
          }
        });
      }
    }, (err) => console.log('Firestore inscricoes listener:', err.message));

    const unsubAtl = onSnapshot(collection(db, 'atletas'), (snap) => {
      if (!snap.empty) {
        const list: Atleta[] = [];
        snap.forEach((d) => list.push(d.data() as Atleta));
        setAtletas(list);
      }
    }, (err) => console.log('Firestore atletas listener:', err.message));

    const unsubEq = onSnapshot(collection(db, 'equipes'), (snap) => {
      if (!snap.empty) {
        const list: Equipe[] = [];
        snap.forEach((d) => list.push(d.data() as Equipe));
        setEquipes(list);
      }
    }, (err) => console.log('Firestore equipes listener:', err.message));

    const unsubPart = onSnapshot(collection(db, 'partidas'), (snap) => {
      if (!snap.empty) {
        const list: Partida[] = [];
        snap.forEach((d) => list.push(d.data() as Partida));
        setPartidas(list);
      }
    }, (err) => console.log('Firestore partidas listener:', err.message));

    return () => {
      unsubInsc();
      unsubAtl();
      unsubEq();
      unsubPart();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser.trim() || !adminPass.trim()) {
      showToast('Preencha o usuário e a senha.', 'error');
      return;
    }
    setAdminLoading(true);
    try {
      const res = await loginAdmin(adminUser.trim(), adminPass.trim());
      if (res.success) {
        setIsAdmin(true);
        setRoute('admin_dashboard');
        showToast('Acesso de Administrador Autorizado!');
        setAdminPass('');
      } else {
        showToast(res.error || 'Credenciais de administrador inválidas.', 'error');
      }
    } catch {
      showToast('Erro ao validar credenciais.', 'error');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      const optRes = await fetch('/api/auth/webauthn/login-options');
      const optData = await optRes.json();
      if (optData.error || optData.success === false) {
        showToast(optData.error || 'Nenhuma biometria cadastrada neste aparelho ainda. Acesse com usuário e senha para cadastrar.', 'error');
        return;
      }
      const authResp = await startAuthentication({ optionsJSON: optData });
      const verifyRes = await fetch('/api/auth/webauthn/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authResp),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.success || verifyData.verified) {
        if (verifyData.token) {
          localStorage.setItem('cruzeirinho_admin_token', verifyData.token);
        }
        setIsAdmin(true);
        setRoute('admin_dashboard');
        showToast('Autenticação Biométrica Autorizada! 🔐');
      } else {
        showToast(verifyData.error || 'Falha na validação biométrica.', 'error');
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        showToast('Autenticação biométrica cancelada pelo usuário.', 'info');
      } else {
        showToast('Erro na leitura biométrica: ' + (err.message || 'Verifique o dispositivo'), 'error');
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleCadastrarBiometria = async () => {
    try {
      const optRes = await fetch('/api/auth/webauthn/register-options', {
        headers: getAdminAuthHeaders(),
      });
      const optData = await optRes.json();
      if (optData.error || optData.success === false) {
        showToast(optData.error || 'Erro ao gerar opções biométricas.', 'error');
        return;
      }
      const regResp = await startRegistration({ optionsJSON: optData });
      const verifyRes = await fetch('/api/auth/webauthn/register-verify', {
        method: 'POST',
        headers: { ...getAdminAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: regResp,
          deviceName: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Celular Administrador' : 'Computador Administrador',
        }),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.success || verifyData.verified) {
        showToast('Biometria / Passkey deste aparelho registrada com sucesso! 🔐✅');
      } else {
        showToast(verifyData.error || 'Falha ao registrar biometria.', 'error');
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        showToast('Cadastro biométrico cancelado.', 'info');
      } else {
        showToast('Erro no cadastro biométrico: ' + (err.message || 'Verifique o dispositivo'), 'error');
      }
    }
  };

  const handleRevogarSessoes = async () => {
    requestConfirm(
      'Revogar Sessões',
      'Deseja desconectar todos os outros celulares e computadores conectados?',
      async () => {
        try {
          const res = await fetch('/api/auth/revoke-sessions', {
            method: 'POST',
            headers: getAdminAuthHeaders(),
          });
          const data = await res.json();
          if (data.success) {
            showToast('Todas as outras sessões foram revogadas com sucesso! 🔒');
          } else {
            showToast(data.error || 'Erro ao revogar sessões.', 'error');
          }
        } catch {
          showToast('Erro ao revogar sessões.', 'error');
        }
      }
    );
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch {}
    setIsAdmin(false);
    setRoute('home');
    showToast('Sessão administrativa encerrada.');
  };

  const handleResetSeed = () => {
    requestConfirm('Restaurar Dados', 'Deseja restaurar todos os dados oficiais de demonstração?', async () => {
      try {
        await resetarParaSeedOficial();
        showToast('Dados restaurados com sucesso!');
        carregarDados();
      } catch {
        showToast('Erro ao restaurar dados', 'error');
      }
    });
  };

  // --- NAVEGAÇÃO PÚBLICA ---
  const renderPublicNav = () => (
    <nav className="bg-blue-900 text-white shadow-xl sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center flex-wrap gap-2">
        <div 
          className="flex items-center space-x-2.5 font-black text-xl cursor-pointer hover:opacity-90 transition-opacity" 
          onClick={() => setRoute('home')}
        >
          <img 
            src={CRUZEIRINHO_LOGO} 
            alt="Brasão Projeto Cruzeirinho" 
            className="w-9 h-9 rounded-full object-contain p-0.5 bg-white shadow-xs border border-blue-400" 
          />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-black tracking-tight text-white">Projeto Cruzeirinho</span>
            <span className="text-[9px] font-bold text-blue-300 uppercase tracking-wider">Bom de Bola, Bom na Escola</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button 
            onClick={() => setRoute('home')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              route === 'home' ? 'bg-blue-700 text-white' : 'hover:bg-blue-800/80 text-blue-100'
            }`}
          >
            Início
          </button>
          
          <div className="relative">
            <button 
              type="button"
              onClick={() => setMenuInscricoesOpen(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                route.startsWith('inscricao') ? 'bg-blue-700 text-white' : 'hover:bg-blue-800/80 text-blue-100'
              }`}
              title="Acessar Inscrições por Categoria"
            >
              <span>Inscrições</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${menuInscricoesOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuInscricoesOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setMenuInscricoesOpen(false)} 
                />
                <div className="absolute left-0 mt-1.5 bg-white text-blue-950 shadow-2xl rounded-2xl overflow-hidden z-50 border border-gray-100 min-w-[170px] animate-fade-in py-1">
                  <div className="px-3.5 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Selecione a Categoria:
                  </div>
                  <button 
                    type="button"
                    onClick={() => { setRoute('inscricao_sub9'); setMenuInscricoesOpen(false); }} 
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-xs font-extrabold flex items-center justify-between text-blue-900 border-b border-gray-50"
                  >
                    <span>SUB-9</span>
                    <span className="text-[10px] font-semibold text-gray-400">6 a 9 anos</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setRoute('inscricao_sub11'); setMenuInscricoesOpen(false); }} 
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-xs font-extrabold flex items-center justify-between text-blue-900 border-b border-gray-50"
                  >
                    <span>SUB-11</span>
                    <span className="text-[10px] font-semibold text-gray-400">10 a 11 anos</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setRoute('inscricao_sub16'); setMenuInscricoesOpen(false); }} 
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-xs font-extrabold flex items-center justify-between text-blue-900"
                  >
                    <span>SUB-16</span>
                    <span className="text-[10px] font-semibold text-gray-400">13 a 16 anos</span>
                  </button>
                  <div className="p-2 border-t border-gray-100 bg-gray-50">
                    <button
                      type="button"
                      onClick={() => { setRoute('inscricoes'); setMenuInscricoesOpen(false); }}
                      className="w-full py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 text-[11px] font-black text-center cursor-pointer transition-colors"
                    >
                      Ver Todas as Categorias
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Nova Aba: Visão Geral das Equipes */}
          <button 
            onClick={() => setRoute('team_overview')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              route === 'team_overview' ? 'bg-blue-700 text-white' : 'hover:bg-blue-800/80 text-blue-100'
            }`}
          >
            <BarChart3 size={14} />
            <span>Equipes (Overview)</span>
          </button>

          <button 
            onClick={() => setRoute('tabela')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              route === 'tabela' ? 'bg-blue-700 text-white' : 'hover:bg-blue-800/80 text-blue-100'
            }`}
          >
            Tabela
          </button>

          <button 
            onClick={() => setRoute('classificacao')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              route === 'classificacao' ? 'bg-blue-700 text-white' : 'hover:bg-blue-800/80 text-blue-100'
            }`}
          >
            Classificação
          </button>

          <button 
            onClick={() => setRoute('estatisticas')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              route === 'estatisticas' ? 'bg-blue-700 text-white' : 'hover:bg-blue-800/80 text-blue-100'
            }`}
          >
            Estatísticas
          </button>

          {/* Botão Baixar App */}
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-blue-800 hover:bg-blue-700 text-white flex items-center gap-1 cursor-pointer transition-colors"
            title="Instalar aplicativo"
          >
            <Download size={14} />
            <span>Baixar App</span>
          </button>

          {/* Botão WhatsApp */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              "⚽ *Brasileirão do Projeto Cruzeirinho 2026* 🏆\n\nConfira tabela, classificação e inscrições:\n" + window.location.href
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer transition-colors"
            title="Compartilhar no WhatsApp"
          >
            <Share2 size={13} />
          </a>

          <button 
            onClick={() => setRoute(isAdmin ? 'admin_dashboard' : 'admin_login')} 
            className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center bg-blue-800 hover:bg-blue-700 text-amber-300 ml-1 transition-colors cursor-pointer border border-blue-700/60 shadow-xs"
            title="Acesso exclusivo do Administrador"
          >
            <Lock size={13} className="mr-1.5 text-amber-400" />
            <span>ADMINISTRAÇÃO</span>
          </button>
        </div>
      </div>
    </nav>
  );

  // --- LAYOUT ADMINISTRATIVO ---
  const renderAdminLayout = () => {
    const inscricoesConferencia = inscricoes.filter(i => 
      i.tipo === 'Normal' && (i.status === 'Aguardando Conferência' || (i.comprovanteArquivo && !i.pagamentoPixConfirmado && i.status !== 'Comprovante Rejeitado'))
    );
    const inscricoesSolidariasPendentes = inscricoes.filter(i => i.tipo === 'Solidária' && (i.status === 'Pendente' || i.status === 'Inscrição Solidária em Análise'));
    const totalNovas = inscricoesConferencia.length + inscricoesSolidariasPendentes.length;

    const menus = [
      { id: 'admin_dashboard', label: 'Visão Geral', icon: <Home size={18} /> },
      { 
        id: 'admin_notificacoes', 
        label: 'Notificações & Pix', 
        icon: <Bell size={18} />,
        badge: totalNovas > 0 ? (
          inscricoesConferencia.length > 0 && inscricoesSolidariasPendentes.length > 0
            ? `${inscricoesConferencia.length} comp. • ${inscricoesSolidariasPendentes.length} sol.`
            : inscricoesConferencia.length > 0
            ? `${inscricoesConferencia.length} a conferir`
            : `${inscricoesSolidariasPendentes.length} solidárias`
        ) : undefined
      },
      { id: 'admin_team_overview', label: 'Overview das Equipes', icon: <BarChart3 size={18} /> },
      { 
        id: 'admin_inscricoes', 
        label: 'Inscrições', 
        icon: <ClipboardEdit size={18} />,
        badge: inscricoesConferencia.length > 0 ? `${inscricoesConferencia.length} a conferir` : undefined
      },
      { id: 'admin_atletas', label: 'Jogadores / Atletas', icon: <Users size={18} /> },
      { id: 'admin_sorteio', label: 'Sorteio / Draft', icon: <Shuffle size={18} /> },
      { id: 'admin_equipes', label: 'Equipes', icon: <Shield size={18} /> },
      { id: 'admin_partidas', label: 'Jogos e Placar', icon: <CalendarDays size={18} /> },
      { id: 'admin_stats', label: 'Artilharia / Passes', icon: <Goal size={18} /> },
      { id: 'home', label: 'Ver Site Público', icon: <Home size={18} /> },
      { id: 'logout', label: 'Encerrar Sessão', icon: <LogOut size={18} /> },
    ];

    return (
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* Sidebar Desktop */}
        <div className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl hidden md:flex">
          <div className="p-4 font-black text-sm border-b border-slate-800 flex items-center gap-2.5 text-blue-400">
            <img 
              src={CRUZEIRINHO_LOGO} 
              alt="Logo" 
              className="w-9 h-9 rounded-full object-contain p-0.5 bg-white shadow-xs border border-blue-400" 
            />
            <div>
              <span className="block text-white font-black text-xs leading-none">Painel Cruzeirinho</span>
              <span className="text-[10px] text-blue-400 font-semibold">Administração 2026</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-3 space-y-1">
            {menus.map(m => (
              <button 
                key={m.id} 
                onClick={() => { 
                  if (m.id === 'logout') {
                    handleLogout();
                  } else {
                    setRoute(m.id); 
                  }
                }}
                className={`w-full flex items-center justify-between px-6 py-3.5 text-left transition-colors text-xs font-bold cursor-pointer ${
                  route === m.id ? 'bg-slate-800 border-l-4 border-blue-500 text-white' : 'hover:bg-slate-800/60 text-gray-400'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-3">{m.icon}</span> {m.label}
                </div>
                {m.badge && (
                  <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    {m.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Restaurar dados */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <div className="px-2 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-[10px] text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Nuvem Firestore
              </span>
              <span className="text-emerald-400/80 font-mono text-[9px] uppercase tracking-wider">Persistente</span>
            </div>
            <button
              onClick={handleResetSeed}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Resetar Dados Padrão
            </button>
          </div>
        </div>
        
        {/* Conteúdo Principal Admin */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto">
          {/* Header Mobile */}
          <div className="md:hidden bg-slate-900 text-white p-3 flex justify-between items-center shadow-md">
            <span className="font-black text-sm text-blue-400">Painel Admin</span>
            <select 
              onChange={(e) => { 
                if (e.target.value === 'logout') {
                  handleLogout();
                } else {
                  setRoute(e.target.value); 
                }
              }} 
              value={route} 
              className="bg-slate-800 border-none rounded-lg p-1.5 text-xs outline-none text-white font-bold"
            >
              {menus.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          
          <div className="p-4 md:p-8 w-full max-w-7xl mx-auto pb-20">
            {route === 'admin_dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-900">Visão Geral do Campeonato</h2>
                  <p className="text-xs text-gray-500 font-semibold mt-1">Métricas atualizadas do Brasileirão Projeto Cruzeirinho 2026</p>
                </div>

                {/* Métricas Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div 
                    onClick={() => setRoute('admin_atletas')}
                    className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-600 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <p className="text-gray-400 text-xs font-black uppercase">Atletas Cadastrados</p>
                    <p className="text-4xl font-black text-blue-950 mt-1">{atletas.length}</p>
                    <p className="text-[11px] text-gray-500 mt-2 font-semibold">
                      {atletas.filter(a => a.equipeId).length} escalados em times
                    </p>
                  </div>

                  <div 
                    onClick={() => setRoute('admin_notificacoes')}
                    className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-amber-500 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <p className="text-gray-400 text-xs font-black uppercase">Comprovantes a Conferir</p>
                    <p className="text-4xl font-black text-amber-600 mt-1">
                      {inscricoesConferencia.length}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-2 font-semibold">
                      {inscricoesSolidariasPendentes.length > 0 ? `+ ${inscricoesSolidariasPendentes.length} solidárias pendentes` : 'Aguardando validação manual'}
                    </p>
                  </div>

                  <div 
                    onClick={() => setRoute('admin_equipes')}
                    className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-500 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <p className="text-gray-400 text-xs font-black uppercase">Equipes no Torneio</p>
                    <p className="text-4xl font-black text-emerald-700 mt-1">{equipes.length}</p>
                    <p className="text-[11px] text-gray-500 mt-2 font-semibold">Nas categorias SUB-9, 11 e 16</p>
                  </div>

                  <div 
                    onClick={() => setRoute('admin_partidas')}
                    className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-purple-500 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <p className="text-gray-400 text-xs font-black uppercase">Jogos Finalizados</p>
                    <p className="text-4xl font-black text-purple-700 mt-1">
                      {partidas.filter(p => p.status === 'Finalizado').length}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-2 font-semibold">De {partidas.length} partidas no total</p>
                  </div>
                </div>

                {/* Atalhos Rápidos */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="font-black text-base text-gray-900 mb-4">Ações Rápidas do Administrador</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <button 
                      onClick={() => setRoute('admin_notificacoes')}
                      className="p-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-extrabold text-xs text-left transition-colors flex items-center justify-between cursor-pointer border border-amber-200"
                    >
                      <div>
                        <span className="block font-black text-amber-950">Notificações & Pix</span>
                        <span className="text-[10px] text-amber-700 font-semibold">
                          {inscricoesConferencia.length} a conferir • {inscricoesSolidariasPendentes.length} solidárias
                        </span>
                      </div>
                      <Bell size={18} className="text-amber-600" />
                    </button>
                    <button 
                      onClick={() => setRoute('admin_team_overview')}
                      className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-extrabold text-xs text-left transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>Dashboard Team Overview</span>
                      <ChevronRight size={16} />
                    </button>
                    <button 
                      onClick={() => setRoute('admin_atletas')}
                      className="p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-extrabold text-xs text-left transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>Gerenciar & Excluir Atletas</span>
                      <ChevronRight size={16} />
                    </button>
                    <button 
                      onClick={() => setRoute('admin_equipes')}
                      className="p-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-extrabold text-xs text-left transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>Editar & Excluir Equipes</span>
                      <ChevronRight size={16} />
                    </button>
                    <button 
                      onClick={() => setRoute('admin_partidas')}
                      className="p-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs text-left transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>Lançar Resultados</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Gestão de Acesso Biométrico e Segurança */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                    <div>
                      <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
                        <Fingerprint className="text-blue-600" size={20} />
                        Segurança & Acesso Biométrico (Passkey / WebAuthn)
                      </h3>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">
                        Acesse o painel com impressão digital ou reconhecimento facial sem precisar digitar senha
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-black inline-flex items-center gap-1">
                      <Shield size={12} /> Sessão Ativa por 30 dias
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={handleCadastrarBiometria}
                      className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 font-black text-xs text-left transition-colors flex items-center justify-between border border-blue-200 cursor-pointer"
                    >
                      <div>
                        <span className="block font-black text-blue-950">Cadastrar Biometria</span>
                        <span className="text-[10px] text-blue-700 font-semibold">Ativar Face ID / Digital deste aparelho</span>
                      </div>
                      <Key size={18} className="text-blue-600 shrink-0" />
                    </button>

                    <button
                      onClick={handleRevogarSessoes}
                      className="p-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-black text-xs text-left transition-colors flex items-center justify-between border border-amber-200 cursor-pointer"
                    >
                      <div>
                        <span className="block font-black text-amber-950">Desconectar Outros Aparelhos</span>
                        <span className="text-[10px] text-amber-700 font-semibold">Revogar sessões em outros navegadores</span>
                      </div>
                      <Shield size={18} className="text-amber-600 shrink-0" />
                    </button>

                    <button
                      onClick={handleLogout}
                      className="p-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs text-left transition-colors flex items-center justify-between border border-slate-300 cursor-pointer"
                    >
                      <div>
                        <span className="block font-black text-slate-900">Encerrar Sessão</span>
                        <span className="text-[10px] text-slate-600 font-semibold">Sair do painel administrativo com segurança</span>
                      </div>
                      <LogOut size={18} className="text-slate-700 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {route === 'admin_notificacoes' && (
              <AdminNotificacoes
                inscricoes={inscricoes}
                showToast={showToast}
                onRefresh={carregarDados}
                somAtivo={somNotificacao}
                onToggleSom={handleToggleSom}
                onTestarSom={handleTestarSom}
                notificacoesPermitidas={notificacoesPermitidas}
                onRequestPermissaoNotificacao={handleRequestPermissaoNotificacao}
                historico={historicoNotificacoes}
                onLimparHistorico={() => {
                  setHistoricoNotificacoes([]);
                  try { localStorage.removeItem('cruzeirinho_notif_hist'); } catch {}
                  showToast('Feed de notificações limpo!');
                }}
              />
            )}

            {route === 'admin_team_overview' && (
              <TeamOverviewDashboard equipes={equipes} atletas={atletas} />
            )}
            {route === 'admin_inscricoes' && (
              <AdminInscricoes 
                inscricoes={inscricoes} 
                showToast={showToast} 
                onRefresh={carregarDados} 
                requestConfirm={requestConfirm}
              />
            )}
            {route === 'admin_atletas' && (
              <AdminAtletas 
                atletas={atletas} 
                equipes={equipes} 
                showToast={showToast} 
                onRefresh={carregarDados} 
                requestConfirm={requestConfirm}
              />
            )}
            {route === 'admin_sorteio' && (
              <AdminSorteio 
                atletas={atletas} 
                equipes={equipes} 
                showToast={showToast} 
                onRefresh={carregarDados} 
                requestConfirm={requestConfirm}
              />
            )}
            {route === 'admin_equipes' && (
              <AdminEquipes 
                equipes={equipes} 
                showToast={showToast} 
                onRefresh={carregarDados} 
                requestConfirm={requestConfirm}
              />
            )}
            {route === 'admin_partidas' && (
              <AdminPartidas 
                partidas={partidas} 
                equipes={equipes} 
                showToast={showToast} 
                onRefresh={carregarDados} 
                requestConfirm={requestConfirm}
              />
            )}
            {route === 'admin_stats' && (
              <AdminEstatisticas 
                atletas={atletas} 
                equipes={equipes} 
                showToast={showToast} 
                onRefresh={carregarDados} 
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER PRINCIPAL ---
  return (
    <ErrorBoundary fallbackTitle="Brasileirão Projeto Cruzeirinho" fallbackMessage="Ocorreu uma instabilidade temporária na conexão. Clique abaixo para recarregar com segurança.">
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
        {/* Toast Alert */}
      {toast.show && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ show: false, msg: '' })} />}

      {/* In-app Modal de Confirmação para Exclusão (100% à prova de falhas em iframe) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Modal Guia para iOS */}
      <IOSInstallModal
        isOpen={isIOSModalOpen}
        onClose={() => setIsIOSModalOpen(false)}
      />

      {/* Navegação Pública - visível em todas as páginas públicas */}
      {!isAdminRoute && renderPublicNav()}

      <main className={`flex-1 ${!isAdminRoute ? 'bg-gradient-to-b from-gray-50 to-blue-50/50' : ''}`}>
        
        {/* Rotas Públicas */}
        {route === 'home' && (
          <HomePublic 
            setRoute={setRoute} 
            showToast={showToast} 
            onOpenInstallModal={handleInstallClick}
            isAdmin={isAdmin}
          />
        )}
        {(route === 'inscricoes' || route === 'inscricao') && (
          <CategoriasPublic setRoute={setRoute} showToast={showToast} />
        )}
        {route === 'team_overview' && (
          <TeamOverviewDashboard equipes={equipes} atletas={atletas} />
        )}
        {route.startsWith('inscricao_') && (
          <div className="p-4 mb-10 animate-fade-in">
            <ErrorBoundary fallbackTitle="Erro ao carregar confirmação da inscrição" fallbackMessage="Sua inscrição está gravada no banco de dados. Atualize a tela para prosseguir.">
              <FormularioInscricao 
                showToast={showToast} 
                categoriaPreSelecionada={route.replace('inscricao_', '').toUpperCase().replace('SUB', 'SUB-') as any} 
                onInscricaoSucesso={carregarDados}
              />
            </ErrorBoundary>
          </div>
        )}
        {route === 'classificacao' && <ClassificacaoPublic partidas={partidas} equipes={equipes} />}
        {route === 'tabela' && <TabelaPublic partidas={partidas} equipes={equipes} />}
        {route === 'estatisticas' && <EstatisticasPublic atletas={atletas} equipes={equipes} />}
        
        {/* Login Restrito Admin */}
        {(route === 'admin_login' || (isAdminRoute && !isAdmin)) && (
          <div className="flex items-center justify-center min-h-[85vh] p-4 animate-fade-in">
            <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100">
              <div className="flex justify-center mb-5">
                <div className="p-4 bg-slate-900 rounded-2xl text-blue-400 shadow-md">
                  <Shield size={44} />
                </div>
              </div>
              <h2 className="text-2xl font-black text-center text-gray-900 mb-1">Acesso Restrito</h2>
              <p className="text-xs text-gray-400 font-semibold text-center mb-6">Painel Administrativo do Cruzeirinho</p>
              
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-600 mb-1">Usuário</label>
                  <input 
                    type="text" 
                    value={adminUser} 
                    onChange={e => setAdminUser(e.target.value)} 
                    placeholder="Identificador do administrador" 
                    required
                    className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-600 mb-1">Senha</label>
                  <input 
                    type="password" 
                    value={adminPass} 
                    onChange={e => setAdminPass(e.target.value)} 
                    placeholder="Senha de acesso" 
                    required
                    className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={adminLoading}
                className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black py-4 rounded-xl transition-all shadow-lg text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {adminLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-blue-400" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <span>Entrar no Sistema</span>
                )}
              </button>

              {webauthnSupported && (
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={biometricLoading}
                  className="w-full mt-3 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-black py-3.5 rounded-xl transition-all shadow-md text-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {biometricLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin text-blue-200" />
                      <span>Aguardando Leitor Biométrico...</span>
                    </>
                  ) : (
                    <>
                      <Fingerprint size={18} className="text-blue-300" />
                      <span>Entrar com Biometria (Digital / Face ID)</span>
                    </>
                  )}
                </button>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <button 
                  type="button" 
                  onClick={() => setRoute('home')} 
                  className="text-gray-500 hover:text-blue-900 text-xs font-bold cursor-pointer"
                >
                  ← Voltar ao site público
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Layout do Painel Administrativo Protegido */}
        {isAdminRoute && isAdmin && renderAdminLayout()}
      </main>
      
      {!isAdminRoute && (
        <footer className="bg-blue-950 text-blue-200 py-8 px-4 text-center text-xs border-t border-blue-900">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button 
                onClick={handleInstallClick} 
                className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Download size={14} /> Baixar App no Celular
              </button>
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent("⚽ Acesse o Brasileirão Projeto Cruzeirinho: " + window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Share2 size={14} /> WhatsApp
              </a>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <img 
                src={CRUZEIRINHO_LOGO} 
                alt="Brasão Projeto Cruzeirinho" 
                className="w-7 h-7 rounded-full object-contain p-0.5 bg-white shadow-xs border border-blue-400" 
              />
              <p className="font-black text-sm text-white">Projeto Cruzeirinho — Bom de Bola, Bom na Escola</p>
            </div>
            <p className="opacity-75">Campeonato de Futebol Amador de Base • Inclusão, Cidadania e Esporte</p>
            <p className="text-[11px] text-blue-400 font-semibold pt-1">© 2026 Projeto Cruzeirinho • Piaí / Ibiúna - SP. Todos os direitos reservados.</p>
            
            {/* Acesso Administrativo Discreto no Rodapé */}
            <div className="pt-2">
              <button 
                onClick={() => setRoute(isAdmin ? 'admin_dashboard' : 'admin_login')} 
                className="text-[11px] font-bold text-blue-400/80 hover:text-blue-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                title="Acesso exclusivo do Administrador"
              >
                <Lock size={11} />
                <span>ADMINISTRAÇÃO</span>
              </button>
            </div>
          </div>
        </footer>
      )}
      </div>
    </ErrorBoundary>
  );
}
