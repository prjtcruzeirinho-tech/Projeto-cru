import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
// Configuração do Firebase com suporte a Vercel, GitHub e ambiente local
const DEFAULT_FIREBASE_CONFIG = {
  projectId: "smurfy-aggregator-rcxst",
  appId: "1:828121018518:web:6733e39d324475d82f92b7",
  apiKey: "AIzaSyBNfYrFpepROGAUQsY_In3E7RR3BRA5Stc",
  authDomain: "smurfy-aggregator-rcxst.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-storymagickidsin-fe0d158b-087e-4a02-a517-b8cd54d9ab2c",
  storageBucket: "smurfy-aggregator-rcxst.firebasestorage.app",
  messagingSenderId: "828121018518",
};

let activeConfig = DEFAULT_FIREBASE_CONFIG;
try {
  // @ts-ignore
  import('../firebase-applet-config.json').then((mod) => {
    if (mod && mod.default) {
      activeConfig = { ...DEFAULT_FIREBASE_CONFIG, ...mod.default };
    }
  }).catch(() => {});
} catch {
  // fallback to default
}

const app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
export const db = getFirestore(app, activeConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validation test connection to Firestore as required by instructions
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Conexão ao Firestore verificada com sucesso.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Chamar teste de conexão ao iniciar
testConnection();
