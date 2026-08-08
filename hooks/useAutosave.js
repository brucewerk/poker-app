// hooks/useAutosave.js
import { useCallback, useRef, useEffect } from "react";

export function useAutosave(saveFunction, delay = 1000) {
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(null);

  const autosave = useCallback(
    (data) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          await saveFunction(data);
          lastSavedRef.current = Date.now();
        } catch (error) {
          console.error("Autosave failed:", error);
        }
      }, delay);
    },
    [saveFunction, delay],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        saveFunction(lastSavedRef.current);
      }
    };
  }, [saveFunction]);

  return { autosave, lastSaved: lastSavedRef.current };
}
