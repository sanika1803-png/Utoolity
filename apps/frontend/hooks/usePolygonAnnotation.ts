import { useState } from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface PolygonAnnotation {
  id: string;
  label: string;
  points: Point[];
}

export function usePolygonAnnotation() {
  const [points, setPoints] = useState<Point[]>([]);
  const [polygons, setPolygons] = useState<PolygonAnnotation[]>([]);
  const [currentLabel, setCurrentLabel] = useState<string>('Object 1');

  // Remove the previous active vertex point
  const undoLastPoint = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  const addPoint = (point: Point) => {
    setPoints((prev) => [...prev, point]);
  };

  // Attempt File System Access API save, fallback to browser download trigger
  const autoSaveLocalJSON = async (
    updatedPolygons: PolygonAnnotation[],
    imageName?: string
  ) => {
    if (typeof window === 'undefined') return;

    const baseName = imageName
      ? imageName.substring(0, imageName.lastIndexOf('.')) || imageName
      : `annotations_${Date.now()}`;
    const fileName = `${baseName}.json`;
    const jsonString = JSON.stringify(updatedPolygons, null, 2);

    // Modern Chrome/Edge File System Access API
    if ('showSaveFilePicker' in window) {
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
        if (err.name === 'AbortError') return; // User cancelled prompt
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

  const completePolygon = (imageName?: string) => {
    if (points.length < 3) return;
    const newPolygon: PolygonAnnotation = {
      id: Date.now().toString(),
      label: currentLabel,
      points,
    };
    const updatedPolygons = [...polygons, newPolygon];
    setPolygons(updatedPolygons);
    setPoints([]);

    autoSaveLocalJSON(updatedPolygons, imageName);
  };

  const clearCurrent = () => setPoints([]);
  const resetAll = () => {
    setPoints([]);
    setPolygons([]);
  };

  return {
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
  };
}