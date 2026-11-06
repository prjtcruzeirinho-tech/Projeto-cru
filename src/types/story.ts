export type ImageSize = '1K' | '2K' | '4K';

export type ArtStyle = 
  | 'Whimsical Watercolor'
  | '3D Animation'
  | 'Classic Storybook Ink & Wash'
  | 'Soft Pastel Fairy Tale'
  | 'Vibrant Claymation'
  | 'Magical Papercraft';

export type VoiceName = 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon';

export interface StoryPage {
  pageNumber: number;
  text: string;
  illustrationPrompt: string;
  imageUrl?: string;
  imageSize?: ImageSize;
  artStyle?: string;
  isGeneratingImage?: boolean;
  audioDataUrl?: string;
  isGeneratingAudio?: boolean;
}

export interface Story {
  id: string;
  title: string;
  summary: string;
  moral: string;
  theme: string;
  ageGroup: string;
  coverImage?: string;
  pages: StoryPage[];
  isCustom?: boolean;
  createdAt?: string;
}

export type ChatRole = 'story_buddy' | 'word_wizard' | 'character_roleplay' | 'talespinner';

export type GeminiModelOption = 'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  audioDataUrl?: string;
  isAudioLoading?: boolean;
}
