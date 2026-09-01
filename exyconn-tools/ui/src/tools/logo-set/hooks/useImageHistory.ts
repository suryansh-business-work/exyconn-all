import { useState, useCallback, useRef, useEffect } from 'react';
import { ImageHistoryState, MAX_HISTORY_STEPS } from '../types';

const HISTORY_STORAGE_KEY = 'logoset-image-history';

export const useImageHistory = () => {
  const [imageHistory, setImageHistory] = useState<ImageHistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory) as ImageHistoryState[];
        setImageHistory(parsed);
        if (parsed.length > 0) {
          setHistoryIndex(parsed.length - 1);
        }
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (imageHistory.length > 0) {
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(imageHistory));
      } catch (error) {
        console.error('Failed to save history:', error);
      }
    }
  }, [imageHistory]);

  const addToHistory = useCallback(
    (newImage: string) => {
      if (isUndoRedoAction.current) {
        isUndoRedoAction.current = false;
        return;
      }

      setImageHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        const newState: ImageHistoryState = { image: newImage, timestamp: Date.now() };
        newHistory.push(newState);

        if (newHistory.length > MAX_HISTORY_STEPS) {
          newHistory.shift();
        }

        return newHistory;
      });

      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY_STEPS - 1));
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      return imageHistory[newIndex].image;
    }
    return null;
  }, [historyIndex, imageHistory]);

  const redo = useCallback(() => {
    if (historyIndex < imageHistory.length - 1) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      return imageHistory[newIndex].image;
    }
    return null;
  }, [historyIndex, imageHistory]);

  const clearHistory = useCallback(() => {
    setImageHistory([]);
    setHistoryIndex(-1);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }, []);

  return {
    imageHistory,
    historyIndex,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < imageHistory.length - 1,
    addToHistory,
    undo,
    redo,
    clearHistory,
  };
};

export default useImageHistory;
