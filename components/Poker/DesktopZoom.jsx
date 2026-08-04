// components/Poker/DesktopZoom.jsx - ZOOM AUTOMÁTICO PARA DESKTOP
"use client";

import { useEffect } from "react";

export default function DesktopZoom() {
  useEffect(() => {
    // 🔥 DETECTAR DESKTOP
    const isDesktop = () => {
      if (typeof window === "undefined") return false;

      const ua = navigator.userAgent;
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone|Opera Mini|IEMobile|WPDesktop/i.test(
          ua,
        );
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Desktop = não é mobile, não tem touch, e a tela é grande o suficiente
      const isDesktopDevice =
        !isMobile && !hasTouch && width >= 1024 && height >= 600;

      // 🔥 TAMBÉM DETECTAR SE O DISPOSITIVO TEM MOUSE (pointer: fine)
      const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

      return isDesktopDevice && hasFinePointer;
    };

    const applyZoom = () => {
      if (!isDesktop()) return;

      const html = document.documentElement;

      // 🔥 MÉTODO 1: Zoom (Chrome, Edge, Opera, Safari)
      html.style.zoom = "0.67";

      // 🔥 MÉTODO 2: Transform (Fallback para Firefox)
      if (navigator.userAgent.includes("Firefox")) {
        html.style.transform = "scale(0.67)";
        html.style.transformOrigin = "top left";
        html.style.width = "149.25%";
        html.style.height = "149.25%";
      }

      // Adicionar classe para ajustes CSS
      document.documentElement.classList.add("desktop-zoomed");

      console.log("🔍 Zoom desktop aplicado: 67%");
    };

    const removeZoom = () => {
      const html = document.documentElement;
      html.style.zoom = "";
      html.style.transform = "";
      html.style.transformOrigin = "";
      html.style.width = "";
      html.style.height = "";
      document.documentElement.classList.remove("desktop-zoomed");

      console.log("🔍 Zoom desktop removido");
    };

    // Aplicar ou remover zoom baseado no tamanho
    const handleResize = () => {
      if (isDesktop()) {
        applyZoom();
      } else {
        removeZoom();
      }
    };

    // Aplicar após montagem
    const timer = setTimeout(handleResize, 150);

    // Reaplicar em resize e mudança de orientação
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", () => {
      setTimeout(handleResize, 400);
    });

    // 🔥 TAMBÉM REAPLICAR APÓS CARREGAMENTO COMPLETO
    if (document.readyState === "complete") {
      setTimeout(handleResize, 200);
    } else {
      window.addEventListener("load", () => {
        setTimeout(handleResize, 300);
      });
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.removeEventListener("load", handleResize);
      removeZoom();
    };
  }, []);

  return null;
}
