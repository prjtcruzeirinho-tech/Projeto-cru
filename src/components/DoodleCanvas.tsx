import React, { useRef, useState, useEffect } from 'react';
import { Palette, Eraser, Trash2, Download, Sparkles, Heart, Star, Smile, X } from 'lucide-react';

interface DoodleCanvasProps {
  backgroundImageUrl?: string;
  onClose: () => void;
  pageTitle: string;
}

export const DoodleCanvas: React.FC<DoodleCanvasProps> = ({
  backgroundImageUrl,
  onClose,
  pageTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState('#ef4444');
  const [lineWidth, setLineWidth] = useState(6);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'stamp'>('brush');
  const [selectedStamp, setSelectedStamp] = useState<'star' | 'heart' | 'sparkle' | 'smile'>('star');
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background image if available
    if (backgroundImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = backgroundImageUrl;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.onerror = () => {
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      };
    } else {
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [backgroundImageUrl]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    if (tool === 'stamp') {
      ctx.fillStyle = color;
      ctx.font = '36px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const stampChar = selectedStamp === 'star' ? '⭐' : selectedStamp === 'heart' ? '💖' : selectedStamp === 'sparkle' ? '✨' : '😊';
      ctx.fillText(stampChar, x, y);
      return;
    }

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'stamp') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = lineWidth * 2.5;
    } else {
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (backgroundImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = backgroundImageUrl;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    } else {
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const downloadArtwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `StoryMagic-Artwork-${pageTitle.replace(/\s+/g, '-')}.png`;
    a.click();
  };

  const COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#1e293b'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col h-full max-h-[92vh] w-full max-w-4xl bg-amber-50 rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white shadow-md">
          <div className="flex items-center gap-2">
            <Palette className="w-6 h-6 animate-bounce" />
            <h3 className="text-xl font-bold tracking-wide">Magic Art Studio: Doodle & Color</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
            title="Close Canvas"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tools bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-white border-b border-amber-200">
          {/* Tool selector */}
          <div className="flex items-center gap-1.5 bg-amber-100 p-1 rounded-2xl">
            <button
              onClick={() => setTool('brush')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-sm transition-all ${
                tool === 'brush' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-900 hover:bg-amber-200/60'
              }`}
            >
              <Palette className="w-4 h-4" /> Brush
            </button>
            <button
              onClick={() => setTool('stamp')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-sm transition-all ${
                tool === 'stamp' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-900 hover:bg-amber-200/60'
              }`}
            >
              <Star className="w-4 h-4" /> Stamps
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-sm transition-all ${
                tool === 'eraser' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-900 hover:bg-amber-200/60'
              }`}
            >
              <Eraser className="w-4 h-4" /> Eraser
            </button>
          </div>

          {/* Color palette */}
          {tool !== 'eraser' && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full border-2 transition-transform shadow-sm ${
                    color === c ? 'scale-125 border-amber-600 ring-2 ring-amber-400' : 'border-gray-200 hover:scale-110'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Stamps options */}
          {tool === 'stamp' && (
            <div className="flex items-center gap-2 bg-amber-100/70 p-1 rounded-2xl">
              <button
                onClick={() => setSelectedStamp('star')}
                className={`p-1.5 rounded-xl ${selectedStamp === 'star' ? 'bg-amber-400 text-white shadow-sm' : 'text-amber-800'}`}
                title="Star Stamp"
              >
                <Star className="w-5 h-5 fill-current" />
              </button>
              <button
                onClick={() => setSelectedStamp('heart')}
                className={`p-1.5 rounded-xl ${selectedStamp === 'heart' ? 'bg-pink-400 text-white shadow-sm' : 'text-pink-600'}`}
                title="Heart Stamp"
              >
                <Heart className="w-5 h-5 fill-current" />
              </button>
              <button
                onClick={() => setSelectedStamp('sparkle')}
                className={`p-1.5 rounded-xl ${selectedStamp === 'sparkle' ? 'bg-purple-400 text-white shadow-sm' : 'text-purple-600'}`}
                title="Sparkle Stamp"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectedStamp('smile')}
                className={`p-1.5 rounded-xl ${selectedStamp === 'smile' ? 'bg-yellow-400 text-white shadow-sm' : 'text-yellow-700'}`}
                title="Smile Stamp"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={clearCanvas}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs transition-colors"
              title="Reset Drawing"
            >
              <Trash2 className="w-4 h-4" /> Reset
            </button>
            <button
              onClick={downloadArtwork}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" /> Save
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative flex-1 bg-amber-100/50 flex items-center justify-center p-3 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full max-h-full aspect-[4/3] object-contain rounded-2xl shadow-xl bg-white border-2 border-amber-300 cursor-crosshair touch-none"
          />
        </div>
      </div>
    </div>
  );
};
