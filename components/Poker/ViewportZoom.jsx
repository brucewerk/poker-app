// components/Poker/ViewportZoom.jsx - Sistema de Compactação Visual Automática
"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const ViewportZoom = ({ children }) => {
  const [scale, setScale] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [manualScale, setManualScale] = useState(null);
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  const calculateScale = useCallback(() => {
    if (typeof window === "undefined") return 1;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Tamanho de design base (1920x1080)
    const baseWidth = 1920;
    const baseHeight = 1080;

    // Calcular escala baseada na menor dimensão
    const scaleX = viewportWidth / baseWidth;
    const scaleY = viewportHeight / baseHeight;
    
    // Usar a menor escala para garantir que tudo caiba
    let newScale = Math.min(scaleX, scaleY);

    // Limitar escala mínima e máxima
    newScale = Math.max(0.6, Math.min(newScale, 1.15));

    // Ajustes específicos por tamanho de tela
    if (viewportWidth < 480) {
      newScale = Math.min(newScale, 0.85);
    } else if (viewportWidth < 768) {
      newScale = Math.min(newScale, 0.9);
    } else if (viewportWidth < 1024) {
      newScale = Math.min(newScale, 0.95);
    }

    // Ajuste para landscape (horizontal)
    if (viewportWidth > viewportHeight && viewportHeight < 600) {
      newScale = Math.min(newScale, 0.8);
    }

    // Arredondar para 2 casas decimais para evitar flicker
    return Math.round(newScale * 100) / 100;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      if (manualScale === null) {
        const newScale = calculateScale();
        setScale(newScale);
      }
    };

    // Calcular escala inicial
    const initialScale = calculateScale();
    setScale(initialScale);
    setIsLoaded(true);

    // Adicionar listener de resize
    window.addEventListener("resize", handleResize);

    // Calcular novamente após carregamento completo
    const timeoutId = setTimeout(() => {
      handleResize();
    }, 100);

    // Atalhos de teclado para zoom
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          setManualScale((prev) => Math.min((prev || scale) + 0.05, 1.5));
        } else if (e.key === "-") {
          e.preventDefault();
          setManualScale((prev) => Math.max((prev || scale) - 0.05, 0.5));
        } else if (e.key === "0") {
          e.preventDefault();
          setManualScale(null);
          setScale(calculateScale());
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [calculateScale, scale, manualScale]);

  const containerStyle = {
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "fixed",
    top: 0,
    left: 0,
    backgroundColor: "var(--bg-primary)",
  };

  const contentStyle = {
    transform: `scale(${manualScale !== null ? manualScale : scale})`,
    transformOrigin: "top center",
    width: "100%",
    height: "100%",
    transition: "transform 0.15s ease-out",
    opacity: isLoaded ? 1 : 0,
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      <div ref={contentRef} style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

export default ViewportZoom;