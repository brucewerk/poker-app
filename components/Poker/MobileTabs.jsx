// components/Poker/MobileTabs.jsx - Tabs para mobile acessar painéis laterais
"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function MobileTabs({ children }) {
  const [activeTab, setActiveTab] = useState("status");
  
  const tabs = [
    { id: "status", label: "📊", title: "Status" },
    { id: "stats", label: "📈", title: "Stats" },
    { id: "level", label: "⭐", title: "Nível" },
    { id: "friends", label: "👥", title: "Amigos" },
    { id: "missions", label: "🎯", title: "Missões" },
    { id: "history", label: "📜", title: "Histórico" },
  ];

  return (
    <div className="mobile-tabs-container" style={containerStyle()}>
      <div className="mobile-tabs-header" style={tabsHeaderStyle()}>
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`mobile-tab ${activeTab === tab.id ? "mobile-tab-active" : ""}`}
            style={tabStyle(activeTab === tab.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span style={tabLabelStyle()}>{tab.label}</span>
          </motion.button>
        ))}
      </div>
      
      <div className="mobile-tabs-content" style={contentStyle()}>
        {Array.isArray(children) ? children[activeTab === "status" ? 0 : activeTab === "stats" ? 1 : activeTab === "level" ? 2 : activeTab === "friends" ? 3 : activeTab === "missions" ? 4 : 5] : children}
      </div>
    </div>
  );
}

function containerStyle() {
  return {
    display: "none",
  };
}

// Só mostrar em mobile portrait
@media (max-width: 480px) and (orientation: portrait) {
  containerStyle = function() {
    return {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8,
    };
  };
}

function tabsHeaderStyle() {
  return {
    display: "flex",
    gap: 4,
    justifyContent: "center",
    flexWrap: "wrap",
  };
}

function tabStyle(isActive) {
  return {
    flex: 1,
    minWidth: "45px",
    height: "36px",
    background: isActive ? "var(--gold-dim)" : "var(--bg-button)",
    border: isActive ? "1px solid gold" : "1px solid var(--border-light)",
    borderRadius: 8,
    color: isActive ? "gold" : "var(--text-primary)",
    fontSize: "0.9rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "var(--transition-theme)",
  };
}

function tabLabelStyle() {
  return {
    fontSize: "1rem",
  };
}

function contentStyle() {
  return {
    background: "var(--bg-panel)",
    borderRadius: 12,
    padding: 10,
    border: "1px solid var(--border-light)",
    minHeight: "150px",
  };
}
