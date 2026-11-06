import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Send, Volume2, Bot, BookOpen, Feather, 
  HelpCircle, Trash2, X, RefreshCw, Wand2, MessageCircle
} from 'lucide-react';
import { ChatMessage, ChatRole, GeminiModelOption, Story, StoryPage } from '../types/story';

interface StoryBuddyChatProps {
  currentStory: Story;
  currentPage: StoryPage;
  isOpen: boolean;
  onClose: () => void;
  onPlaySpeech?: (text: string) => void;
}

export const StoryBuddyChat: React.FC<StoryBuddyChatProps> = ({
  currentStory,
  currentPage,
  isOpen,
  onClose,
  onPlaySpeech,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi there, adventurer! 🌟 I'm Barnaby the Story Buddy. We're reading page ${currentPage.pageNumber} of "${currentStory.title}". What would you like to ask me about the story, or do you want to learn a fun word?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<ChatRole>('story_buddy');
  const [selectedModel, setSelectedModel] = useState<GeminiModelOption>('gemini-3.8-flash');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const storyContext = `Current story: "${currentStory.title}". Page ${currentPage.pageNumber}: "${currentPage.text}". Moral: "${currentStory.moral}".`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          modelPreference: selectedModel,
          role: activeRole,
          currentStoryContext: storyContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Chat request failed: ${res.statusText}`);
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || "That's a wondrous thought! What else do you think?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Failed to chat:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Oopsie daisy! My magical ink spilled a tiny bit: ${err?.message || 'Could not connect'}. Let's try again! ✨`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'assistant',
        content: `Fresh page! 📖 What magical mystery shall we explore next in "${currentStory.title}"?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const playMessageTTS = async (msg: ChatMessage) => {
    if (onPlaySpeech) {
      onPlaySpeech(msg.content);
      return;
    }
    // Fallback: direct TTS fetch
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: msg.content,
          voiceName: 'Puck',
          style: 'Cheerful, bubbly cartoon buddy reading aloud to a friend',
        }),
      });
      const data = await res.json();
      if (data.audioDataUrl) {
        const audio = new Audio(data.audioDataUrl);
        audio.play();
      }
    } catch (e) {
      console.error('TTS error on message:', e);
    }
  };

  const QUICK_QUESTIONS = [
    'What do you think happens next?',
    'Explain a big word from this page!',
    'Tell me a silly joke about this page!',
    'What would YOU do if you were here?',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl border-l-4 border-amber-300 animate-slide-left">
      {/* Header */}
      <div className="flex flex-col bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-2xl shadow-inner">
              {activeRole === 'word_wizard' ? '🦉' : activeRole === 'character_roleplay' ? '🎭' : activeRole === 'talespinner' ? '✨' : '🐻'}
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight flex items-center gap-1.5">
                Story Buddy <Sparkles className="w-4 h-4 text-yellow-200 fill-current" />
              </h3>
              <p className="text-xs text-amber-100 font-medium">Your interactive reading companion</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role Selector */}
        <div className="mt-3 flex items-center justify-between gap-1 overflow-x-auto bg-black/10 p-1 rounded-2xl backdrop-blur-sm">
          <button
            onClick={() => setActiveRole('story_buddy')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeRole === 'story_buddy' ? 'bg-white text-amber-800 shadow-sm' : 'text-amber-100 hover:bg-white/10'
            }`}
          >
            🐻 Buddy
          </button>
          <button
            onClick={() => setActiveRole('word_wizard')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeRole === 'word_wizard' ? 'bg-white text-amber-800 shadow-sm' : 'text-amber-100 hover:bg-white/10'
            }`}
          >
            🦉 Word Wizard
          </button>
          <button
            onClick={() => setActiveRole('character_roleplay')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeRole === 'character_roleplay' ? 'bg-white text-amber-800 shadow-sm' : 'text-amber-100 hover:bg-white/10'
            }`}
          >
            🎭 Character
          </button>
          <button
            onClick={() => setActiveRole('talespinner')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeRole === 'talespinner' ? 'bg-white text-amber-800 shadow-sm' : 'text-amber-100 hover:bg-white/10'
            }`}
          >
            ✨ Spinner
          </button>
        </div>

        {/* Model Selector Bar */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-amber-100 font-semibold px-1">
          <span className="flex items-center gap-1">
            <Bot className="w-3.5 h-3.5 text-yellow-200" /> Model:
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedModel('gemini-3.8-flash')}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                selectedModel === 'gemini-3.8-flash' ? 'bg-white text-amber-900 font-bold' : 'hover:bg-white/15'
              }`}
              title="gemini-3.8-flash: Recommended for general tasks"
            >
              3.8 Flash (General)
            </button>
            <button
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                selectedModel === 'gemini-3.1-flash-lite' ? 'bg-white text-amber-900 font-bold' : 'hover:bg-white/15'
              }`}
              title="gemini-3.1-flash-lite: Fast responses and rhymes"
            >
              3.1 Lite (Fast)
            </button>
            <button
              onClick={() => setSelectedModel('gemini-4-argon')}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                selectedModel === 'gemini-4-argon' ? 'bg-white text-amber-900 font-bold' : 'hover:bg-white/15'
              }`}
              title="gemini-4-argon: Complex creative reasoning"
            >
              4 Argon (Complex)
            </button>
          </div>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-amber-50/40">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] rounded-3xl p-3.5 text-sm leading-relaxed shadow-sm transition-all ${
                  isUser
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-tr-sm font-medium'
                    : 'bg-white text-slate-800 border-2 border-amber-200 rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Footer of message */}
                <div
                  className={`mt-1.5 flex items-center justify-between text-[10px] gap-2 ${
                    isUser ? 'text-amber-100' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => playMessageTTS(msg)}
                      className="flex items-center gap-0.5 text-amber-700 hover:text-amber-900 font-bold hover:underline"
                      title="Read aloud with Gemini TTS"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Listen</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold p-3 bg-white border border-amber-200 rounded-2xl w-fit shadow-sm animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
            <span>Story Buddy is thinking of a wonder...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      <div className="p-2 bg-amber-100/60 border-t border-amber-200 overflow-x-auto flex gap-1.5">
        {QUICK_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="text-xs bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shadow-xs transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-amber-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask ${activeRole === 'word_wizard' ? 'about words...' : 'Story Buddy...'}`}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-amber-200 focus:border-amber-400 focus:outline-none text-sm placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-md hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
