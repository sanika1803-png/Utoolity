import { useState } from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface PolygonAnnotation {
  id: string;
  label: string; // Object class name (e.g., 'Helmet', 'Person')
  points: Point[];
}

export function usePolygonAnnotation() {
  const [points, setPoints] = useState<Point[]>([]);
  const [polygons, setPolygons] = useState<PolygonAnnotation[]>([]);
  const [currentLabel, setCurrentLabel] = useState<string>('Person');
  const [classList, setClassList] = useState<string[]>([
    'Person',
    'Helmet',
    'Vehicle',
    'Background',
  ]);

  // Remove the last placed vertex point
  const undoLastPoint = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  const addPoint = (point: Point) => {
    setPoints((prev) => [...prev, point]);
  };

  // Function to add new custom class labels to the toolkit dropdown
  const addClassCategory = (newClass: string) => {
    const trimmed = newClass.trim();
    if (trimmed && !classList.includes(trimmed)) {
      setClassList((prev) => [...prev, trimmed]);
      setCurrentLabel(trimmed);
    }
  };

  // JSON export function triggered explicitly when changing images or downloading manually
  const autoSaveLocalJSON = async (
    polygonsToSave: PolygonAnnotation[],
    imageName?: string
  ) => {
    if (!polygonsToSave || polygonsToSave.length === 0) return;

    const baseName = imageName
      ? imageName.substring(0, imageName.lastIndexOf('.')) || imageName
      : `annotations_${Date.now()}`;
    const fileName = `${baseName}.json`;
    
    // Structure JSON payload to include all annotated objects for the image
    const exportData = {
      imageName: imageName || 'unknown',
      totalObjects: polygonsToSave.length,
      annotations: polygonsToSave.map((p) => ({
        id: p.id,
        classLabel: p.label,
        points: p.points,
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    // Browser File System Access API with fallback download
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'JSON Annotation File',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Standard Download Fallback
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Completes polygon for current object (no auto-download here)
  const completePolygon = () => {
    if (points.length < 3) return;
    const newPolygon: PolygonAnnotation = {
      id: Date.now().toString(),
      label: currentLabel,
      points,
    };
    setPolygons((prev) => [...prev, newPolygon]);
    setPoints([]);
  };

  const clearCurrent = () => setPoints([]);
  const resetAll = () => {
    setPoints([]);
    setPolygons([]);
  };

  return {
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
  };
}