import React, { useState } from 'react';
import { Sparkles, Wand2, BookOpen, User, X, Check, ArrowRight } from 'lucide-react';
import { ArtStyle, ImageSize, Story } from '../types/story';

interface StoryCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: (story: Story) => void;
}

export const StoryCreatorModal: React.FC<StoryCreatorModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated,
}) => {
  const [theme, setTheme] = useState('');
  const [childName, setChildName] = useState('');
  const [ageGroup, setAgeGroup] = useState('5-8');
  const [pageCount, setPageCount] = useState(4);
  const [artStyle, setArtStyle] = useState<ArtStyle>('Whimsical Watercolor');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const THEME_IDEAS = [
    'A shy baby dragon who bakes magical cupcakes',
    'An astronaut puppy exploring Saturn’s crystal rings',
    'A brave little tugboat that wanted to rescue a fallen star',
    'A secret door behind the library shelf that leads to cloud kingdom',
    'A mischievous kitten who paints the rainbows before dawn',
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) {
      setError('Please enter or pick an idea for your magical story!');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: theme.trim(),
          childName: childName.trim() || 'Alex',
          ageGroup,
          pageCount,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate story: ${res.statusText}`);
      }

      const data = await res.json();

      const newStory: Story = {
        id: `story-custom-${Date.now()}`,
        title: data.title || 'A Magical Adventure',
        summary: data.summary || 'A wonder-filled tale generated just for you!',
        moral: data.moral || 'With imagination and courage, anything is possible.',
        theme: theme.trim(),
        ageGroup,
        isCustom: true,
        createdAt: new Date().toISOString(),
        pages: (data.pages || []).map((p: any, idx: number) => ({
          pageNumber: p.pageNumber || idx + 1,
          text: p.pageText || '',
          illustrationPrompt: p.illustrationPrompt || `${data.title} scene ${idx + 1}`,
          imageUrl: undefined, // Will be generated using gemini-3-pro-image-preview
          imageSize,
          artStyle,
        })),
      };

      onStoryCreated(newStory);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not generate story. Please try again!');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-amber-50 rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-white/20">
              <Wand2 className="w-6 h-6 animate-spin text-yellow-200" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-wide">Story Crafter Studio</h2>
              <p className="text-xs text-amber-100 font-medium">Create a custom story with AI illustrations & read-aloud</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-100 border-2 border-rose-300 text-rose-800 text-sm font-semibold rounded-2xl">
              {error}
            </div>
          )}

          {/* Child's Name */}
          <div>
            <label className="block text-sm font-bold text-amber-950 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-600" /> Young Reader / Hero's Name
            </label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="e.g. Leo, Mia, Oliver, or your child's name"
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-amber-200 bg-white focus:border-amber-400 focus:outline-none text-sm font-semibold placeholder:font-normal placeholder:text-slate-400"
            />
          </div>

          {/* Story Theme / Prompt */}
          <div>
            <label className="block text-sm font-bold text-amber-950 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" /> What should the story be about?
            </label>
            <textarea
              rows={2}
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. A flying whale that visits school children to teach them how to paint with clouds"
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-amber-200 bg-white focus:border-amber-400 focus:outline-none text-sm font-semibold placeholder:font-normal placeholder:text-slate-400 resize-none"
            />
            
            {/* Quick Inspiration Pills */}
            <div className="mt-2">
              <p className="text-xs font-bold text-amber-800 mb-1">Or pick a fun idea:</p>
              <div className="flex flex-wrap gap-1.5">
                {THEME_IDEAS.map((idea, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setTheme(idea)}
                    className="text-xs bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl px-2.5 py-1 text-left transition-colors"
                  >
                    ✨ {idea}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Age Group and Page Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-amber-950 mb-1">Target Age</label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full p-2.5 rounded-2xl border-2 border-amber-200 bg-white text-sm font-bold text-slate-700 outline-none focus:border-amber-400"
              >
                <option value="3-5">Ages 3 - 5 (Playful & Simple)</option>
                <option value="5-8">Ages 5 - 8 (Bedtime & Adventure)</option>
                <option value="8-12">Ages 8 - 12 (Curious & Imaginative)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-950 mb-1">Story Length</label>
              <select
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="w-full p-2.5 rounded-2xl border-2 border-amber-200 bg-white text-sm font-bold text-slate-700 outline-none focus:border-amber-400"
              >
                <option value={3}>3 Pages (Quick Tale)</option>
                <option value={4}>4 Pages (Standard Book)</option>
                <option value={5}>5 Pages (Grand Adventure)</option>
                <option value={6}>6 Pages (Epic Journey)</option>
              </select>
            </div>
          </div>

          {/* Art Style & Image Size Affordance */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-amber-950 mb-1">Illustration Style</label>
              <select
                value={artStyle}
                onChange={(e) => setArtStyle(e.target.value as ArtStyle)}
                className="w-full p-2.5 rounded-2xl border-2 border-amber-200 bg-white text-sm font-bold text-slate-700 outline-none focus:border-amber-400"
              >
                <option value="Whimsical Watercolor">Whimsical Watercolor</option>
                <option value="3D Animation">3D Pixar-style Animation</option>
                <option value="Classic Storybook Ink & Wash">Classic Ink & Wash</option>
                <option value="Soft Pastel Fairy Tale">Soft Pastel Fairy Tale</option>
                <option value="Vibrant Claymation">Vibrant Claymation</option>
                <option value="Magical Papercraft">Magical Papercraft</option>
              </select>
            </div>

            {/* Image Resolution affordance (1K, 2K, 4K) */}
            <div>
              <label className="block text-xs font-bold text-amber-950 mb-1">
                Image Resolution (gemini-3-pro-image-preview)
              </label>
              <div className="flex gap-1.5 bg-white p-1 rounded-2xl border-2 border-amber-200">
                {(['1K', '2K', '4K'] as ImageSize[]).map((sz) => (
                  <button
                    type="button"
                    key={sz}
                    onClick={() => setImageSize(sz)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      imageSize === sz
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-base shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin text-yellow-200" />
                <span>Weaving Story with Gemini...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 text-yellow-200" />
                <span>Create Magical Storybook!</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
