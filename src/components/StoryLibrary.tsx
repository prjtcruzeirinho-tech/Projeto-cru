import React, { useState } from 'react';
import { 
  Sparkles, BookOpen, Wand2, Volume2, Search, Filter, 
  Heart, Plus, Compass, Star, ChevronRight, Trash2, Award
} from 'lucide-react';
import { Story } from '../types/story';

interface StoryLibraryProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onOpenCreateModal: () => void;
  onDeleteCustomStory: (id: string) => void;
}

export const StoryLibrary: React.FC<StoryLibraryProps> = ({
  stories,
  onSelectStory,
  onOpenCreateModal,
  onDeleteCustomStory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgeFilter, setSelectedAgeFilter] = useState<string>('all');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAge =
      selectedAgeFilter === 'all' ||
      story.ageGroup.includes(selectedAgeFilter.replace('age-', ''));

    return matchesSearch && matchesAge;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/40 to-amber-100/60 text-slate-800 pb-20">
      {/* Hero Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white shadow-xl">
        {/* Whimsical background clouds and sparkles */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_2px,transparent_2px)] [background-size:24px_24px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl text-center md:text-left space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-black tracking-wide uppercase shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-yellow-200 fill-current animate-spin" style={{ animationDuration: '6s' }} />
                <span>AI-Powered Interactive Kids Storybooks</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Story<span className="text-yellow-200">Magic</span>
              </h1>
              <p className="text-base md:text-lg text-amber-100 font-medium leading-relaxed">
                Step into a world of wonder! Listen to stories read aloud in character voices, generate custom illustrations in 1K, 2K, or 4K for every page, and chat with your AI Story Buddy.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <button
                  onClick={onOpenCreateModal}
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-amber-900 hover:bg-amber-50 font-black text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
                >
                  <Wand2 className="w-5 h-5 text-amber-600" />
                  <span>Create Custom Story</span>
                </button>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-100 bg-black/10 px-4 py-3 rounded-2xl backdrop-blur-xs">
                  <Volume2 className="w-4 h-4 text-yellow-300" />
                  <span>Gemini TTS & 4K Illustrations</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Card */}
            <div className="w-full max-w-sm bg-white/15 backdrop-blur-md rounded-3xl p-5 border border-white/30 shadow-2xl animate-float">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-amber-200 shadow-inner relative group">
                <img
                  src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80"
                  alt="Story Preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                  <span className="text-[11px] font-black uppercase tracking-wider text-yellow-300">Featured Book</span>
                  <h3 className="font-extrabold text-base">The Little Dragon Who Lost His Spark</h3>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-amber-100 font-semibold">
                <span>🔊 Expressive Gemini Voice</span>
                <span>🎨 4K Image Generator</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Library Body */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-3xl shadow-md border-2 border-amber-200">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories, dragons, magic..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-amber-50/70 border border-amber-200 text-sm focus:outline-none focus:border-amber-400 text-slate-800 font-semibold placeholder:font-normal placeholder:text-slate-400"
            />
          </div>

          {/* Age Filters */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            <span className="text-xs font-bold text-amber-900 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Age:
            </span>
            {[
              { id: 'all', label: 'All Ages' },
              { id: 'age-4-7', label: '4 - 7 Yrs' },
              { id: 'age-5-9', label: '5 - 9 Yrs' },
              { id: 'age-6-10', label: '6 - 10 Yrs' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedAgeFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedAgeFilter === f.id
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-slate-700 hover:bg-amber-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* New Story Quick Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Tale</span>
          </button>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => {
            const isFav = favoriteIds.includes(story.id);
            const cover = story.pages[0]?.imageUrl || story.coverImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80';

            return (
              <div
                key={story.id}
                onClick={() => onSelectStory(story)}
                className="group relative flex flex-col bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl border-2 border-amber-200 hover:border-amber-400 transition-all duration-300 cursor-pointer hover:-translate-y-1.5"
              >
                {/* Book Cover Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-amber-100">
                  <img
                    src={cover}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-amber-500 text-white shadow-xs">
                      Ages {story.ageGroup}
                    </span>
                    {story.isCustom && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-600 text-white shadow-xs">
                        Custom AI Tale
                      </span>
                    )}
                  </div>

                  {/* Favorite & Delete Buttons */}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button
                      onClick={(e) => toggleFavorite(story.id, e)}
                      className="p-2 rounded-full bg-white/80 backdrop-blur-xs text-slate-700 hover:text-rose-500 transition-colors shadow-xs"
                      title="Favorite story"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                    {story.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${story.title}"?`)) {
                            onDeleteCustomStory(story.id);
                          }
                        }}
                        className="p-2 rounded-full bg-white/80 backdrop-blur-xs text-rose-600 hover:bg-rose-100 transition-colors shadow-xs"
                        title="Delete custom story"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Theme text overlay on bottom of image */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-bold text-yellow-300 uppercase tracking-wide">
                      {story.theme}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                      {story.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {story.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-700 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {story.pages.length} Pages
                    </span>
                    <span className="flex items-center gap-1 font-extrabold text-amber-600 group-hover:translate-x-1 transition-transform">
                      <span>Read Story</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredStories.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-amber-200 p-8 shadow-sm">
            <BookOpen className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-800 mb-1">No stories found</h3>
            <p className="text-sm text-slate-500 mb-4">Try searching for something else or create a custom story!</p>
            <button
              onClick={onOpenCreateModal}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 text-white font-bold text-sm shadow-md hover:bg-amber-600 transition-all"
            >
              ✨ Create a Story Now
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
