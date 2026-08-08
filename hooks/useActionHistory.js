// hooks/useActionHistory.js
import { useState, useCallback } from "react";

export function useActionHistory(initialState = null) {
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const push = useCallback(
    (action) => {
      setHistory((prev) => [...prev.slice(0, currentIndex + 1), action]);
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex],
  );

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return { push, undo, redo, canUndo, canRedo, current: history[currentIndex] };
}
