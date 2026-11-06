import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { 
  generateRegistrationOptions, 
  verifyRegistrationResponse, 
  generateAuthenticationOptions, 
  verifyAuthenticationResponse 
} from '@simplewebauthn/server';
import { Firestore, doc, getDoc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

export interface AdminSession {
  token: string;
  username: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string;
  ip?: string;
}

export interface WebAuthnCredential {
  id: string; // base64url id
  publicKey: string; // base64url public key
  counter: number;
  transports?: string[];
  deviceName?: string;
  createdAt: string;
}

// In-memory cache de sessões e desafios WebAuthn
const sessionCache = new Map<string, AdminSession>();
const challengeCache = new Map<string, { challenge: string; expires: number }>();

// Configurações de autenticação
const DEFAULT_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || 'Cruzeiro@2026';
const SESSION_MAX_AGE_DAYS = 30;
export const COOKIE_NAME = 'cruzeirinho_admin_session';

// Hashing seguro com PBKDF2 e Salt
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

// Salt fixo determinístico para a senha mestre configurada
const MASTER_SALT = 'cruzeirinho_piai_2026_salt_master';
const MASTER_HASH = hashPassword(DEFAULT_PASSWORD, MASTER_SALT);

export function verifyAdminPassword(passwordAttempt: string): boolean {
  if (!passwordAttempt) return false;
  const hashAttempt = hashPassword(passwordAttempt, MASTER_SALT);
  return crypto.timingSafeEqual(Buffer.from(hashAttempt, 'hex'), Buffer.from(MASTER_HASH, 'hex'));
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Helpers para Firestore
export async function saveSessionToFirestore(db: Firestore | null, session: AdminSession) {
  sessionCache.set(session.token, session);
  if (db) {
    try {
      await setDoc(doc(db, 'admin_sessions', session.token), session);
    } catch (e) {
      console.error('[Auth] Erro ao salvar sessão no Firestore:', e);
    }
  }
}

export async function deleteSessionFromFirestore(db: Firestore | null, token: string) {
  sessionCache.delete(token);
  if (db) {
    try {
      await deleteDoc(doc(db, 'admin_sessions', token));
    } catch (e) {
      console.error('[Auth] Erro ao excluir sessão no Firestore:', e);
    }
  }
}

export async function validateSessionToken(db: Firestore | null, token: string): Promise<AdminSession | null> {
  if (!token) return null;

  // Checa cache primeiro
  const cached = sessionCache.get(token);
  if (cached) {
    if (new Date(cached.expiresAt) > new Date()) {
      return cached;
    } else {
      sessionCache.delete(token);
    }
  }

  // Checa Firestore
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'admin_sessions', token));
      if (snap.exists()) {
        const session = snap.data() as AdminSession;
        if (new Date(session.expiresAt) > new Date()) {
          sessionCache.set(token, session);
          return session;
        } else {
          await deleteDoc(doc(db, 'admin_sessions', token));
        }
      }
    } catch (e) {
      console.error('[Auth] Erro ao validar sessão no Firestore:', e);
    }
  }

  return null;
}

// Obter RP ID para WebAuthn com base na requisição
export function getRpId(req: Request): string {
  const host = req.get('host') || 'localhost';
  // Remove port if present
  return host.split(':')[0];
}

export function getExpectedOrigin(req: Request): string {
  const host = req.get('host') || 'localhost';
  const proto = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return `${proto}://${host}`;
}

// Cria sessão e configura cookie
export async function createAdminSession(req: Request, res: Response, db: Firestore | null): Promise<AdminSession> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const session: AdminSession = {
    token,
    username: DEFAULT_USERNAME,
    createdAt: new Date().toISOString(),
    expiresAt,
    userAgent: req.get('user-agent'),
    ip: req.ip || req.socket.remoteAddress,
  };

  await saveSessionToFirestore(db, session);

  // Define cookie seguro
  const isHttps = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return session;
}

// Middleware de proteção de rotas administrativas
export function createRequireAdminMiddleware(getFirestoreDb: () => Firestore | null) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tokenFromCookie = req.cookies?.[COOKIE_NAME];
    const authHeader = req.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      return res.status(401).json({ 
        error: 'Acesso não autorizado. Faça login administrativo.',
        code: 'UNAUTHORIZED' 
      });
    }

    const session = await validateSessionToken(getFirestoreDb(), token);
    if (!session) {
      res.clearCookie(COOKIE_NAME, { path: '/' });
      return res.status(401).json({ 
        error: 'Sessão expirada ou inválida. Faça login novamente.',
        code: 'SESSION_EXPIRED' 
      });
    }

    // Injeta na requisição para uso posterior
    (req as any).adminSession = session;
    next();
  };
}

// WebAuthn Credential Store
export async function getWebAuthnCredentials(db: Firestore | null): Promise<WebAuthnCredential[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, 'admin_webauthn_credentials'));
    const list: WebAuthnCredential[] = [];
    snap.forEach(d => list.push(d.data() as WebAuthnCredential));
    return list;
  } catch (e) {
    console.error('[WebAuthn] Erro ao carregar credenciais:', e);
    return [];
  }
}

export async function saveWebAuthnCredential(db: Firestore | null, cred: WebAuthnCredential) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'admin_webauthn_credentials', cred.id), cred);
  } catch (e) {
    console.error('[WebAuthn] Erro ao salvar credencial:', e);
  }
}

export async function deleteWebAuthnCredential(db: Firestore | null, id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'admin_webauthn_credentials', id));
  } catch (e) {
    console.error('[WebAuthn] Erro ao excluir credencial:', e);
  }
}

// Armazenamento temporário de challenge
export function saveChallenge(key: string, challenge: string) {
  challengeCache.set(key, { challenge, expires: Date.now() + 5 * 60 * 1000 });
}

export function getChallenge(key: string): string | null {
  const item = challengeCache.get(key);
  if (!item) return null;
  if (item.expires < Date.now()) {
    challengeCache.delete(key);
    return null;
  }
  challengeCache.delete(key);
  return item.challenge;
}
