import { Firestore, doc, setDoc, getDoc } from 'firebase/firestore';

export interface PagBankCobrancaResult {
  orderId: string;
  referenceId: string;
  qrCodeText: string;
  qrCodeImage?: string;
  valor: number;
  expiracao: string;
  isIntegracaoOficial: boolean;
  mensagem: string;
}

// Chave oficial e QR Code estático do PagBank como fallback seguro garantido
export const PAGBANK_CHAVE_FALLBACK = 'prjtcruzeirinho@gmail.com';
export const PAGBANK_TITULAR_FALLBACK = 'DOUGLAS LEONEL LEITE';
export const PAGBANK_COPIA_E_COLA_FALLBACK = '00020126580014br.gov.bcb.pix0136d99e71bc-7881-4361-9e6d-114c853fab3d27600016BR.COM.PAGSEGURO0136CC97B07E-892A-4A32-8C0B-C415F2479F09520400005303986540525.005802BR5920DOUGLAS LEONEL LEITE6006Ibiuna62290525PAGS00000250026103108072163042765';

export function getPagBankBaseUrl(): string {
  const env = (process.env.PAGBANK_ENV || 'production').toLowerCase();
  return env === 'sandbox' 
    ? 'https://sandbox.api.pagseguro.com' 
    : 'https://api.pagseguro.com';
}

/**
 * Cria cobrança Pix individual oficial na API do PagBank.
 * Se o token não estiver configurado ou ocorrer erro na API, retorna o fallback
 * individual mantendo a experiência do usuário 100% funcional.
 */
export async function criarCobrancaPixPagBank({
  inscricaoId,
  codigoInscricao,
  nomeAtleta,
  responsavel,
  whatsapp,
  categoria,
  appUrl,
}: {
  inscricaoId: string;
  codigoInscricao: string;
  nomeAtleta: string;
  responsavel: string;
  whatsapp: string;
  categoria: string;
  appUrl: string;
}): Promise<PagBankCobrancaResult> {
  const token = process.env.PAGBANK_TOKEN;
  const baseUrl = getPagBankBaseUrl();
  const valorReais = 25.00;
  const valorCentavos = 2500;

  // Limpa telefone para formato aceito pelo PagBank
  const cleanPhone = whatsapp.replace(/\D/g, '');
  const areaCode = cleanPhone.length >= 10 ? cleanPhone.slice(0, 2) : '15';
  const phoneNumber = cleanPhone.length >= 10 ? cleanPhone.slice(2) : cleanPhone;

  // Data de expiração: 24 horas a partir de agora
  const expDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Tenta chamada oficial se houver token válido configurado
  if (token && token.trim().length > 10 && token !== 'SEU_TOKEN_PAGBANK') {
    try {
      const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/pagbank/webhook`;
      const bodyPayload = {
        reference_id: codigoInscricao,
        customer: {
          name: (responsavel || nomeAtleta).substring(0, 60),
          email: 'prjtcruzeirinho@gmail.com',
          phones: [
            {
              country: '55',
              area: areaCode,
              number: phoneNumber.padStart(9, '9').substring(0, 9),
              type: 'MOBILE'
            }
          ]
        },
        items: [
          {
            reference_id: `INSC-${categoria}`,
            name: `Inscrição ${categoria} - Brasileirão Cruzeirinho 2026 (${nomeAtleta.substring(0, 30)})`,
            quantity: 1,
            unit_amount: valorCentavos
          }
        ],
        qr_codes: [
          {
            amount: { value: valorCentavos },
            expiration_date: expDate
          }
        ],
        notification_urls: [webhookUrl]
      };

      console.log(`[PagBank] Criando pedido oficial na API PagBank para ${codigoInscricao}...`);
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(bodyPayload)
      });

      if (response.ok) {
        const data = await response.json();
        const qrCodeObj = data.qr_codes?.[0];
        const qrCodeText = qrCodeObj?.text || '';
        const qrCodeLink = qrCodeObj?.links?.find((l: any) => l.rel === 'QRCODE.PNG')?.href || '';

        console.log(`[PagBank] Pedido oficial criado com sucesso: ${data.id}`);
        return {
          orderId: data.id,
          referenceId: codigoInscricao,
          qrCodeText: qrCodeText || PAGBANK_COPIA_E_COLA_FALLBACK,
          qrCodeImage: qrCodeLink,
          valor: valorReais,
          expiracao: expDate,
          isIntegracaoOficial: true,
          mensagem: 'Cobrança Pix individual oficial gerada pelo PagBank.',
        };
      } else {
        const errorText = await response.text();
        console.warn(`[PagBank] Resposta da API PagBank (${response.status}):`, errorText);
      }
    } catch (err) {
      console.error('[PagBank] Erro na requisição à API PagBank:', err);
    }
  } else {
    console.log('[PagBank] PAGBANK_TOKEN não configurado no servidor. Utilizando chave oficial PagBank do Cruzeirinho.');
  }

  // Fallback seguro garantido utilizando os dados oficiais PagBank de Douglas Leonel Leite
  return {
    orderId: `ORDER-${codigoInscricao}`,
    referenceId: codigoInscricao,
    qrCodeText: PAGBANK_COPIA_E_COLA_FALLBACK,
    valor: valorReais,
    expiracao: expDate,
    isIntegracaoOficial: false,
    mensagem: 'Cobrança Pix individual PagBank (Douglas Leonel Leite).',
  };
}

/**
 * Consulta status de um pedido diretamente na API do PagBank
 */
export async function consultarPedidoPagBank(orderId: string): Promise<{ status: string; isPago: boolean } | null> {
  const token = process.env.PAGBANK_TOKEN;
  if (!token || token === 'SEU_TOKEN_PAGBANK' || orderId.startsWith('ORDER-CRUZ')) {
    return null;
  }

  try {
    const baseUrl = getPagBankBaseUrl();
    const res = await fetch(`${baseUrl}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });

    if (res.ok) {
      const data = await res.json();
      const chargeStatus = data.charges?.[0]?.status || data.qr_codes?.[0]?.status || '';
      const isPago = chargeStatus === 'PAID' || chargeStatus === 'AUTHORIZED';
      return { status: chargeStatus, isPago };
    }
  } catch (err) {
    console.error('[PagBank] Erro ao consultar pedido:', err);
  }

  return null;
}
