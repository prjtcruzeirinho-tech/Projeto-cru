import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Volume2, VolumeX, Sparkles, ChevronLeft, ChevronRight, 
  RotateCcw, Image as ImageIcon, Sliders, Palette, Maximize2, 
  Minimize2, Moon, Sun, Wand2, Loader2, Play, Pause, Bookmark,
  Layers, MessageCircle, Heart, Share2, Check, Download
} from 'lucide-react';
import { ArtStyle, ImageSize, Story, StoryPage, VoiceName } from '../types/story';
import { DoodleCanvas } from './DoodleCanvas';
import { StoryBuddyChat } from './StoryBuddyChat';

interface StoryReaderProps {
  story: Story;
  onUpdateStory: (updated: Story) => void;
  onBackToLibrary: () => void;
}

export const StoryReader: React.FC<StoryReaderProps> = ({
  story,
  onUpdateStory,
  onBackToLibrary,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [selectedNarrationStyle, setSelectedNarrationStyle] = useState('Warm, expressive children storybook narrator');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [autoAdvance, setAutoAdvance] = useState(true);

  // Illustration controls
  const [selectedImageSize, setSelectedImageSize] = useState<ImageSize>('1K');
  const [selectedArtStyle, setSelectedArtStyle] = useState<ArtStyle>('Whimsical Watercolor');
  const [customPromptTweak, setCustomPromptTweak] = useState('');
  const [isReillustrating, setIsReillustrating] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

  // Reader customization
  const [fontFamily, setFontFamily] = useState<'kids' | 'hand' | 'sans' | 'serif'>('kids');
  const [fontSizeClass, setFontSizeClass] = useState<'text-lg' | 'text-xl' | 'text-2xl' | 'text-3xl'>('text-2xl');
  const [isNightMode, setIsNightMode] = useState(false);
  const [showDoodle, setShowDoodle] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [favoritePages, setFavoritePages] = useState<number[]>([]);

  // Audio reference
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentPage = story.pages[currentPageIndex] || story.pages[0];

  // Stop audio when changing page
  useEffect(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsPlayingAudio(false);
  }, [currentPageIndex]);

  // Handle TTS narration using gemini-3.8-flash-tts
  const handleToggleAudio = async () => {
    if (isPlayingAudio && currentAudioRef.current) {
      currentAudioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    // If audio is already generated and cached on page
    if (currentPage.audioDataUrl && currentAudioRef.current?.src === currentPage.audioDataUrl) {
      currentAudioRef.current.playbackRate = playbackSpeed;
      currentAudioRef.current.play();
      setIsPlayingAudio(true);
      return;
    }

    setIsAudioLoading(true);

    try {
      let audioUrl = currentPage.audioDataUrl;

      // If not yet generated, call backend /api/tts with gemini-3.8-flash-tts
      if (!audioUrl) {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: currentPage.text,
            voiceName: selectedVoice,
            style: selectedNarrationStyle,
          }),
        });

        if (!res.ok) {
          throw new Error('TTS generation failed');
        }

        const data = await res.json();
        audioUrl = data.audioDataUrl;

        // Save generated audio into story state
        const updatedPages = [...story.pages];
        updatedPages[currentPageIndex] = {
          ...currentPage,
          audioDataUrl: audioUrl,
        };
        onUpdateStory({ ...story, pages: updatedPages });
      }

      if (audioUrl) {
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        }
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        audio.playbackRate = playbackSpeed;

        audio.onended = () => {
          setIsPlayingAudio(false);
          // Auto advance if enabled and not on last page
          if (autoAdvance && currentPageIndex < story.pages.length - 1) {
            setCurrentPageIndex((prev) => prev + 1);
          } else if (currentPageIndex === story.pages.length - 1) {
            triggerConfetti();
          }
        };

        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsPlayingAudio(false);
        };

        await audio.play();
        setIsPlayingAudio(true);
      }
    } catch (err) {
      console.error('TTS error:', err);
      // Friendly fallback using Web Speech API if server TTS has an issue
      fallbackSpeech(currentPage.text);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const fallbackSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = playbackSpeed * 0.9;
      utterance.pitch = 1.1; // kid friendly pitch
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => {
        setIsPlayingAudio(false);
        if (autoAdvance && currentPageIndex < story.pages.length - 1) {
          setCurrentPageIndex((prev) => prev + 1);
        }
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  // Generate or re-generate illustration using gemini-3-pro-image-preview
  const handleGenerateIllustration = async (sizeToUse: ImageSize = selectedImageSize) => {
    setIsReillustrating(true);
    setShowImageOptions(false);

    try {
      const basePrompt = currentPage.illustrationPrompt || `${story.title} illustration`;
      const combinedPrompt = customPromptTweak.trim()
        ? `${basePrompt}. Additional details: ${customPromptTweak.trim()}`
        : basePrompt;

      const res = await fetch('/api/generate-illustration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: combinedPrompt,
          imageSize: sizeToUse, // Affordance for 1K, 2K, 4K
          aspectRatio: '4:3',
          artStyle: selectedArtStyle,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await res.json();

      const updatedPages = [...story.pages];
      updatedPages[currentPageIndex] = {
        ...currentPage,
        imageUrl: data.imageUrl,
        imageSize: sizeToUse,
        artStyle: selectedArtStyle,
      };

      onUpdateStory({ ...story, pages: updatedPages });
      setCustomPromptTweak('');
    } catch (err: any) {
      console.error('Illustration generation failed:', err);
      alert('Could not generate illustration with gemini-3-pro-image-preview. Please check API key status.');
    } finally {
      setIsReillustrating(false);
    }
  };

  // Batch generate all missing illustrations in the book
  const handleGenerateAllIllustrations = async () => {
    setIsBatchGenerating(true);
    try {
      const updatedPages = [...story.pages];

      for (let i = 0; i < updatedPages.length; i++) {
        if (!updatedPages[i].imageUrl) {
          const res = await fetch('/api/generate-illustration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: updatedPages[i].illustrationPrompt,
              imageSize: selectedImageSize,
              aspectRatio: '4:3',
              artStyle: selectedArtStyle,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            updatedPages[i] = {
              ...updatedPages[i],
              imageUrl: data.imageUrl,
              imageSize: selectedImageSize,
              artStyle: selectedArtStyle,
            };
            onUpdateStory({ ...story, pages: [...updatedPages] });
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6'],
    });
  };

  const toggleFavorite = (pageIndex: number) => {
    setFavoritePages((prev) =>
      prev.includes(pageIndex) ? prev.filter((p) => p !== pageIndex) : [...prev, pageIndex]
    );
  };

  const getFontFamilyStyle = () => {
    switch (fontFamily) {
      case 'hand':
        return 'font-story-hand';
      case 'serif':
        return 'font-story-serif';
      case 'sans':
        return 'font-story-sans';
      case 'kids':
      default:
        return 'font-story-kids';
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isNightMode ? 'bg-slate-950 text-slate-100' : 'bg-amber-50/70 text-slate-800'
      }`}
    >
      {/* Top Navbar */}
      <header
        className={`sticky top-0 z-30 px-4 py-3 flex items-center justify-between border-b backdrop-blur-md transition-colors ${
          isNightMode
            ? 'bg-slate-900/90 border-slate-800 text-slate-100'
            : 'bg-white/90 border-amber-200 text-slate-800'
        } shadow-xs`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLibrary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Library
          </button>
          <div>
            <h1 className="font-extrabold text-base md:text-lg tracking-tight leading-none flex items-center gap-2">
              {story.title}
            </h1>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              Page {currentPage.pageNumber} of {story.pages.length} • {story.theme}
            </p>
          </div>
        </div>

        {/* Reader Customization Actions */}
        <div className="flex items-center gap-2">
          {/* Night Mode toggle */}
          <button
            onClick={() => setIsNightMode(!isNightMode)}
            className={`p-2 rounded-2xl transition-colors ${
              isNightMode ? 'bg-slate-800 text-yellow-300' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
            title={isNightMode ? 'Daylight Mode' : 'Cozy Bedtime Mode'}
          >
            {isNightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Doodle & Color Button */}
          <button
            onClick={() => setShowDoodle(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs shadow-xs transition-all"
            title="Doodle or stamp on the illustration!"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Color & Stamp</span>
          </button>

          {/* Story Buddy Chat Floating Trigger */}
          <button
            onClick={() => setShowChat(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-sm transition-all"
            title="Open Gemini Story Buddy"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Story Buddy</span>
          </button>
        </div>
      </header>

      {/* Main Storybook Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center">
        {/* Two-Pane Book View */}
        <div
          className={`relative rounded-3xl shadow-2xl border-4 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[540px] transition-all ${
            isNightMode
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-amber-300'
          }`}
        >
          {/* Left Column: AI Illustration with 1K, 2K, 4K controls */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center p-4 bg-amber-100/40 dark:bg-slate-950/60 border-b lg:border-b-0 lg:border-r border-amber-200 dark:border-slate-800">
            {/* Resolution & Style Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-amber-500 text-white shadow-xs">
                {currentPage.imageSize || '1K'} Pro Quality
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs">
                {currentPage.artStyle || selectedArtStyle}
              </span>
            </div>

            {/* Favorite Star */}
            <button
              onClick={() => toggleFavorite(currentPageIndex)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-md hover:scale-110 transition-transform"
              title="Bookmark favorite page"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  favoritePages.includes(currentPageIndex)
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              />
            </button>

            {/* Illustration Display or Placeholder */}
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border-2 border-amber-200 dark:border-slate-700 bg-amber-50 dark:bg-slate-900 group">
              {currentPage.imageUrl ? (
                <img
                  src={currentPage.imageUrl}
                  alt={`Illustration for page ${currentPage.pageNumber}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-amber-800 dark:text-amber-200">
                  <Sparkles className="w-12 h-12 text-amber-500 animate-spin mb-3" style={{ animationDuration: '8s' }} />
                  <p className="font-bold text-base mb-1">Ready for New Illustration!</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-4">
                    Click below to paint this page with gemini-3-pro-image-preview.
                  </p>
                  <button
                    onClick={() => handleGenerateIllustration()}
                    disabled={isReillustrating}
                    className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>Generate Page Illustration</span>
                  </button>
                </div>
              )}

              {/* Generating overlay spinner */}
              {isReillustrating && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                  <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-2" />
                  <p className="font-extrabold text-sm tracking-wide">Painting Illustration ({selectedImageSize})...</p>
                  <p className="text-xs text-amber-200 mt-1">Calling gemini-3-pro-image-preview</p>
                </div>
              )}
            </div>

            {/* Image Action Bar with Size Affordance (1K, 2K, 4K) */}
            <div className="w-full mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300">Resolution:</span>
                <div className="flex bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-amber-200 dark:border-slate-700 shadow-xs">
                  {(['1K', '2K', '4K'] as ImageSize[]).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => {
                        setSelectedImageSize(sz);
                        handleGenerateIllustration(sz);
                      }}
                      disabled={isReillustrating}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        (currentPage.imageSize || selectedImageSize) === sz
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-slate-700'
                      }`}
                      title={`Generate in high-definition ${sz}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Re-illustrate Options Popover Toggle */}
              <button
                onClick={() => setShowImageOptions(!showImageOptions)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-amber-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>Change Style / Prompt</span>
              </button>
            </div>

            {/* Re-illustrate Options Drawer */}
            {showImageOptions && (
              <div className="w-full mt-3 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-200 dark:border-slate-700 shadow-md space-y-3 animate-fade-in text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-amber-950 dark:text-amber-200">Re-Illustrate Options</span>
                  <button onClick={() => setShowImageOptions(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Art Style</label>
                  <select
                    value={selectedArtStyle}
                    onChange={(e) => setSelectedArtStyle(e.target.value as ArtStyle)}
                    className="w-full p-2 rounded-xl border border-amber-200 dark:border-slate-700 bg-amber-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold outline-none"
                  >
                    <option value="Whimsical Watercolor">Whimsical Watercolor</option>
                    <option value="3D Animation">3D Pixar-style Animation</option>
                    <option value="Classic Storybook Ink & Wash">Classic Storybook Ink & Wash</option>
                    <option value="Soft Pastel Fairy Tale">Soft Pastel Fairy Tale</option>
                    <option value="Vibrant Claymation">Vibrant Claymation</option>
                    <option value="Magical Papercraft">Magical Papercraft</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Tweak (Optional)
                  </label>
                  <input
                    type="text"
                    value={customPromptTweak}
                    onChange={(e) => setCustomPromptTweak(e.target.value)}
                    placeholder="e.g. Add rainbow balloons, nighttime sky, purple boots"
                    className="w-full p-2 rounded-xl border border-amber-200 dark:border-slate-700 bg-amber-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleGenerateIllustration()}
                    disabled={isReillustrating}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Generate New Illustration</span>
                  </button>
                  <button
                    onClick={handleGenerateAllIllustrations}
                    disabled={isBatchGenerating}
                    className="px-3 py-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-900 font-bold flex items-center gap-1 transition-colors"
                    title="Generate illustrations for all pages in this story"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>All Pages</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Story Text & Narration Controls */}
          <div className="lg:col-span-6 flex flex-col justify-between p-6 md:p-8">
            {/* Top Toolbar: Font & Size Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-amber-100 dark:border-slate-800">
              <div className="flex items-center gap-1 bg-amber-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  onClick={() => setFontFamily('kids')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    fontFamily === 'kids' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                  }`}
                  title="Kids Rounded Font"
                >
                  Friendly
                </button>
                <button
                  onClick={() => setFontFamily('hand')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    fontFamily === 'hand' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                  }`}
                  title="Handwritten Story Font"
                >
                  Handwriting
                </button>
                <button
                  onClick={() => setFontFamily('serif')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    fontFamily === 'serif' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                  }`}
                  title="Classic Fairy Tale Serif"
                >
                  Storybook
                </button>
              </div>

              {/* Text Size Controls */}
              <div className="flex items-center gap-1 bg-amber-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  onClick={() => setFontSizeClass('text-lg')}
                  className={`px-2 py-1 rounded-xl text-xs font-bold ${fontSizeClass === 'text-lg' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSizeClass('text-2xl')}
                  className={`px-2 py-1 rounded-xl text-xs font-bold ${fontSizeClass === 'text-2xl' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSizeClass('text-3xl')}
                  className={`px-2 py-1 rounded-xl text-xs font-bold ${fontSizeClass === 'text-3xl' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  A+
                </button>
              </div>
            </div>

            {/* Main Story Page Text with Karaoke Audio Highlight */}
            <div className="flex-1 my-6 flex flex-col justify-center">
              <div
                className={`${getFontFamilyStyle()} ${fontSizeClass} leading-relaxed tracking-wide select-none transition-all ${
                  isPlayingAudio
                    ? 'text-amber-900 dark:text-amber-100 scale-[1.01]'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {currentPage.text}
              </div>

              {/* Sparkle soundwave visualizer when reading aloud */}
              {isPlayingAudio && (
                <div className="mt-4 flex items-center gap-2 p-2.5 rounded-2xl bg-amber-100/70 dark:bg-slate-800/70 w-fit text-amber-800 dark:text-amber-300 text-xs font-bold animate-pulse">
                  <Volume2 className="w-4 h-4 text-amber-600 animate-bounce" />
                  <span>Reading aloud with Gemini Voice ({selectedVoice})...</span>
                  <div className="flex items-center gap-0.5 ml-2">
                    <span className="w-1.5 h-4 bg-amber-500 rounded-full animate-pulse" />
                    <span className="w-1.5 h-6 bg-orange-500 rounded-full animate-pulse delay-75" />
                    <span className="w-1.5 h-3 bg-amber-400 rounded-full animate-pulse delay-150" />
                    <span className="w-1.5 h-5 bg-amber-600 rounded-full animate-pulse delay-100" />
                  </div>
                </div>
              )}
            </div>

            {/* Read Aloud & Narration Controls (gemini-3.8-flash-tts) */}
            <div className="pt-4 border-t border-amber-100 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Big Read Aloud Button */}
                <button
                  onClick={handleToggleAudio}
                  disabled={isAudioLoading}
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-base shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isAudioLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Preparing Voice...</span>
                    </>
                  ) : isPlayingAudio ? (
                    <>
                      <Pause className="w-5 h-5 fill-current" />
                      <span>Pause Story</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>Read Page Aloud</span>
                    </>
                  )}
                </button>

                {/* Voice Selector: Kore, Puck, Fenrir, Zephyr, Charon */}
                <div className="flex items-center gap-1.5 bg-amber-100/70 dark:bg-slate-800 p-1.5 rounded-2xl">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 ml-1">Voice:</span>
                  <select
                    value={selectedVoice}
                    onChange={(e) => {
                      setSelectedVoice(e.target.value as VoiceName);
                      // Invalidate cached audio so it generates with the new voice
                      const updatedPages = [...story.pages];
                      updatedPages[currentPageIndex].audioDataUrl = undefined;
                      onUpdateStory({ ...story, pages: updatedPages });
                    }}
                    className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold px-2.5 py-1 rounded-xl border border-amber-200 dark:border-slate-600 outline-none"
                  >
                    <option value="Kore">Kore (Warm & Loving)</option>
                    <option value="Puck">Puck (Playful & Bouncy)</option>
                    <option value="Fenrir">Fenrir (Friendly Giant Bear)</option>
                    <option value="Zephyr">Zephyr (Soft Gentle Breeze)</option>
                    <option value="Charon">Charon (Wise Storyteller)</option>
                  </select>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-1 bg-amber-100/70 dark:bg-slate-800 p-1 rounded-2xl">
                  {[0.8, 1, 1.2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-1 rounded-xl text-xs font-bold transition-all ${
                        playbackSpeed === spd
                          ? 'bg-amber-500 text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-amber-200/50'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Advance Toggle */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={(e) => setAutoAdvance(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Automatically turn page when read-aloud finishes</span>
                </label>
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  Model: gemini-3.8-flash-tts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Page Navigation Carousel */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <button
            onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentPageIndex === 0}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-amber-950 dark:text-slate-100 font-extrabold text-sm border-2 border-amber-200 dark:border-slate-700 shadow-md transition-all disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Previous Page</span>
          </button>

          {/* Page Indicators Pills */}
          <div className="flex items-center gap-2">
            {story.pages.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPageIndex(idx)}
                className={`flex items-center justify-center transition-all ${
                  currentPageIndex === idx
                    ? 'w-10 h-10 rounded-2xl bg-amber-500 text-white font-black shadow-md scale-110'
                    : 'w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 font-bold border border-amber-200 dark:border-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (currentPageIndex < story.pages.length - 1) {
                setCurrentPageIndex((prev) => prev + 1);
              } else {
                triggerConfetti();
              }
            }}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
          >
            <span>{currentPageIndex < story.pages.length - 1 ? 'Next Page' : 'Finish Story! 🎉'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* Doodle Canvas Modal */}
      {showDoodle && (
        <DoodleCanvas
          backgroundImageUrl={currentPage.imageUrl}
          pageTitle={`${story.title} - Page ${currentPage.pageNumber}`}
          onClose={() => setShowDoodle(false)}
        />
      )}

      {/* Multi-turn Gemini Story Buddy Chatbot Drawer */}
      <StoryBuddyChat
        currentStory={story}
        currentPage={currentPage}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        onPlaySpeech={(text) => {
          fallbackSpeech(text);
        }}
      />
    </div>
  );
};
