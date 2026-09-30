'use client';

import React, { useState } from 'react';
import { usePolygonAnnotation } from '../../../hooks/usePolygonAnnotation';
import { PolygonCanvas } from '../../../components/polygon-annotation/PolygonCanvas';

export default function PolygonAnnotationPage() {
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<'polygon' | 'select' | 'move'>('polygon');

  const {
    points,
    polygons,
    currentLabel,
    setCurrentLabel,
    addPoint,
    undoLastPoint,
    completePolygon,
    clearCurrent,
    resetAll,
    autoSaveLocalJSON,
  } = usePolygonAnnotation();

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const loadedImages = Array.from(files)
        .filter((f) => f.type.startsWith('image/'))
        .map((f) => ({
          name: f.name,
          url: URL.createObjectURL(f),
        }));
      setImages(loadedImages);
      if (loadedImages.length > 0) setSelectedImageIndex(0);
    }
  };

  const currentImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-blue-400">Polygon Studio</span>
          <span className="text-slate-400">
            {currentImage ? currentImage.name : 'No image loaded'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => autoSaveLocalJSON(polygons, currentImage?.name)}
            disabled={polygons.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs disabled:opacity-40"
          >
            Download JSON
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <aside className="w-14 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 gap-3">
          <label
            title="Import Folder / Images"
            className="w-10 h-10 flex items-center justify-center rounded cursor-pointer bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            📁
            <input
              type="file"
              accept="image/*"
              multiple
              // @ts-ignore
              webkitdirectory=""
              onChange={handleFolderUpload}
              className="hidden"
            />
          </label>

          <div className="w-8 h-[1px] bg-slate-800 my-1" />

          {/* Polygon Tool */}
          <button
            onClick={() => setActiveTool('polygon')}
            title="Polygon Tool"
            className={`w-10 h-10 rounded flex items-center justify-center font-bold text-sm ${
              activeTool === 'polygon'
                ? 'bg-blue-600/30 border border-blue-500 text-blue-400'
                : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            ⬡
          </button>

          {/* Undo Point Button */}
          <button
            onClick={undoLastPoint}
            disabled={points.length === 0}
            title="Undo Last Point (Ctrl+Z)"
            className="w-10 h-10 rounded flex items-center justify-center hover:bg-slate-800 text-slate-300 disabled:opacity-30"
          >
            ↩
          </button>

          {/* Clear Active Points */}
          <button
            onClick={clearCurrent}
            title="Clear Active Points"
            disabled={points.length === 0}
            className="w-10 h-10 rounded flex items-center justify-center hover:bg-slate-800 text-yellow-500 disabled:opacity-30"
          >
            🧹
          </button>

          {/* Reset All */}
          <button
            onClick={resetAll}
            title="Reset All Annotations"
            className="w-10 h-10 rounded flex items-center justify-center hover:bg-slate-800 text-red-400"
          >
            🗑
          </button>
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 bg-slate-950 flex flex-col items-center justify-center relative p-4 overflow-auto">
          <div className="absolute top-4 left-4 z-20 flex gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 flex items-center">Label:</span>
            <input
              type="text"
              value={currentLabel}
              onChange={(e) => setCurrentLabel(e.target.value)}
              className="bg-slate-800 text-white px-2 py-1 rounded border border-slate-700 outline-none w-28 text-xs"
            />
            <button
              onClick={() => completePolygon(currentImage?.name)}
              disabled={points.length < 3}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-40 transition-colors"
            >
              Complete Polygon ({points.length} pts)
            </button>
            <button
              onClick={undoLastPoint}
              disabled={points.length === 0}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded disabled:opacity-30"
            >
              Undo Point
            </button>
          </div>

          <PolygonCanvas
            imageSrc={currentImage ? currentImage.url : null}
            points={points}
            polygons={polygons}
            onCanvasClick={addPoint}
          />
        </main>

        {/* Right Sidebar */}
        <aside className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="p-3 border-b border-slate-800 flex-1 overflow-y-auto">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Imported Folder ({images.length})
            </h3>
            {images.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No folder loaded. Click 📁 on left.</p>
            ) : (
              <div className="space-y-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded truncate transition-colors ${
                      selectedImageIndex === idx
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    📷 {img.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-800 h-1/2 overflow-y-auto">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Objects ({polygons.length})
            </h3>
            <div className="space-y-1">
              {polygons.map((poly, idx) => (
                <div
                  key={poly.id}
                  className="flex items-center justify-between text-xs bg-slate-800/60 p-2 rounded border border-slate-700/50"
                >
                  <span className="font-medium text-slate-200">
                    {idx + 1}. {poly.label}
                  </span>
                  <span className="text-[10px] text-slate-400">{poly.points.length} pts</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}