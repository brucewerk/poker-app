// components/Poker/MobileMenu.jsx - Menu Mobile Hamburger
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileMenu({ onOpenAchievements, onOpenFindings, onOpenFriends, onOpenMissions, onOpenHistory }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: "🏆", label: "Conquistas", action: onOpenAchievements },
    { icon: "🔍", label: "Achados", action: onOpenFindings },
    { icon: "👥", label: "Amigos", action: onOpenFriends },
    { icon: "🎯", label: "Missões", action: onOpenMissions },
    { icon: "📜", label: "Histórico", action: onOpenHistory },
  ];

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="mobile-menu-trigger"
        style={hamburgerButtonStyle()}
        whileTap={{ scale: 0.95 }}
      >
        <span style={hamburgerLineStyle()}></span>
        <span style={hamburgerLineStyle()}></span>
        <span style={hamburgerLineStyle()}></span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              style={overlayStyle()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              style={menuStyle()}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div style={menuHeaderStyle()}>
                <h2 style={menuTitleStyle()}>Menu</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  style={closeButtonStyle()}
                >
                  ✕
                </button>
              </div>

              <div style={menuItemsStyle()}>
                {menuItems.map((item, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      setIsOpen(false);
                      item.action?.();
                    }}
                    style={menuItemStyle()}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span style={menuIconStyle()}>{item.icon}</span>
                    <span style={menuLabelStyle()}>{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ====================== ESTILOS ======================

function hamburgerButtonStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    width: "32px",
    height: "28px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    zIndex: 1000,
  };
}

function hamburgerLineStyle() {
  return {
    width: "100%",
    height: "3px",
    background: "var(--text-primary)",
    borderRadius: "2px",
    transition: "var(--transition-theme)",
  };
}

function overlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  };
}

function menuStyle() {
  return {
    position: "fixed",
    top: 0,
    left: 0,
    width: "280px",
    height: "100vh",
    background: "var(--bg-modal)",
    borderRight: "2px solid var(--border-gold)",
    zIndex: 1001,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "var(--modal-shadow)",
  };
}

function menuHeaderStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    paddingBottom: "15px",
    borderBottom: "1px solid var(--border-light)",
  };
}

function menuTitleStyle() {
  return {
    color: "var(--text-primary)",
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "bold",
  };
}

function closeButtonStyle() {
  return {
    background: "transparent",
    border: "none",
    color: "var(--text-primary)",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "8px",
  };
}

function menuItemsStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  };
}

function menuItemStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px 20px",
    background: "var(--bg-button)",
    border: "1px solid var(--border-light)",
    borderRadius: "12px",
    color: "var(--text-primary)",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    transition: "var(--transition-theme)",
  };
}

function menuIconStyle() {
  return {
    fontSize: "1.5rem",
  };
}

function menuLabelStyle() {
  return {
    color: "var(--text-primary)",
  };
}
