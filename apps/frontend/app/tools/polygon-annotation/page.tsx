'use client';

import React, { useState } from 'react';
import { usePolygonAnnotation } from '@/hooks/usePolygonAnnotation';

export default function PolygonAnnotationPage() {
  const {
    points,
    polygons,
    setPolygons,
    currentLabel,
    setCurrentLabel,
    classList,
    addClassCategory,
    addPoint,
    undoLastPoint,
    completePolygon,
    clearCurrent,
    resetAll,
    autoSaveLocalJSON,
  } = usePolygonAnnotation();

  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [newClassInput, setNewClassInput] = useState<string>('');

  // Handle folder uploads
  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validImages: { name: string; url: string }[] = [];
    Array.from(files).forEach((file) => {
      if (
        file.type.startsWith('image/') ||
        /\.(jpe?g|png|webp|svg|bmp)$/i.test(file.name)
      ) {
        validImages.push({
          name: file.name,
          url: URL.createObjectURL(file),
        });
      }
    });

    if (validImages.length > 0) {
      setImages(validImages);
      setSelectedImageIndex(0);
      resetAll();
    }
  };

  // Switch images and automatically save existing annotations to JSON
  const handleImageChange = (newIndex: number) => {
    if (
      newIndex === selectedImageIndex ||
      newIndex < 0 ||
      newIndex >= images.length
    )
      return;

    // Save active image polygons before switching
    if (polygons.length > 0 && images[selectedImageIndex]) {
      autoSaveLocalJSON(polygons, images[selectedImageIndex].name);
    }

    setSelectedImageIndex(newIndex);
    resetAll();
  };

  const currentImage = images[selectedImageIndex];

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Left Sidebar Toolbar Controls */}
      <div className="w-64 border-r border-slate-700 p-4 flex flex-col gap-4">
        {/* Folder Upload Button */}
        <div>
          <label className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded text-xs cursor-pointer inline-block w-full text-center font-medium">
            📁 Import Folder
            <input
              type="file"
              accept="image/*"
              multiple
              // @ts-ignore
              webkitdirectory=""
              // @ts-ignore
              directory=""
              onChange={handleFolderUpload}
              className="hidden"
            />
          </label>
        </div>

        <hr className="border-slate-700" />

        <h3 className="font-semibold text-sm text-slate-300">Class Selection</h3>

        {/* Dropdown to pick active class */}
        <select
          value={currentLabel}
          onChange={(e) => setCurrentLabel(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white"
        >
          {classList.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>

        {/* Add new custom class input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New class (e.g. Helmet)"
            value={newClassInput}
            onChange={(e) => setNewClassInput(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white flex-1"
          />
          <button
            onClick={() => {
              addClassCategory(newClassInput);
              setNewClassInput('');
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Add
          </button>
        </div>

        <hr className="border-slate-700" />

        {/* Polygon controls */}
        <div className="flex flex-col gap-2">
          <button
            onClick={completePolygon}
            disabled={points.length < 3}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white py-2 rounded text-sm font-medium"
          >
            Complete Polygon ({points.length} pts)
          </button>
          <button
            onClick={undoLastPoint}
            disabled={points.length === 0}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white py-1 rounded text-xs"
          >
            Undo Point
          </button>
        </div>
      </div>

      {/* Main Canvas & Navigation Controls */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar Image Switcher */}
        <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleImageChange(selectedImageIndex - 1)}
              disabled={selectedImageIndex === 0}
              className="px-3 py-1 bg-slate-700 rounded text-xs disabled:opacity-50"
            >
              ← Previous
            </button>
            <span className="text-sm">
              {images.length > 0
                ? `${currentImage?.name} (${selectedImageIndex + 1}/${images.length})`
                : 'No folder loaded'}
            </span>
            <button
              onClick={() => handleImageChange(selectedImageIndex + 1)}
              disabled={selectedImageIndex >= images.length - 1}
              className="px-3 py-1 bg-slate-700 rounded text-xs disabled:opacity-50"
            >
              Next →
            </button>
          </div>

          {/* Manual Export Button */}
          <button
            onClick={() => autoSaveLocalJSON(polygons, currentImage?.name)}
            disabled={polygons.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-1 rounded text-sm"
          >
            Download JSON ({polygons.length} Objects)
          </button>
        </div>

        {/* Workspace Area */}
        <div className="flex-1 p-4 flex items-center justify-center relative bg-slate-950 overflow-hidden">
          {currentImage ? (
            <div
              className="relative cursor-crosshair border border-slate-700 rounded"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                addPoint({ x, y });
              }}
            >
              <img
                src={currentImage.url}
                alt={currentImage.name}
                className="max-h-[80vh] object-contain pointer-events-none select-none"
              />
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Render active polygon points being placed */}
                {points.length > 0 && (
                  <polyline
                    points={points.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                )}
                {points.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#ef4444"
                  />
                ))}

                {/* Render finished polygons */}
                {polygons.map((poly) => (
                  <polygon
                    key={poly.id}
                    points={poly.points.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="rgba(59, 130, 246, 0.3)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                ))}
              </svg>
            </div>
          ) : (
            <div className="text-slate-500 text-sm">
              Please import a folder containing images to start annotating.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}