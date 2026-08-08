// components/Poker/SkeletonLoader.jsx
"use client";

import { motion } from "framer-motion";

export function TableSkeleton() {
  return (
    <div className="game-table-container" style={{ padding: "20px" }}>
      <div
        className="game-table-felt"
        style={{ minHeight: "400px", padding: "20px" }}
      >
        {/* CPU Area Skeleton */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={skeletonPulseStyle()} />
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              marginTop: "10px",
            }}
          >
            <div style={skeletonCardStyle()} />
            <div style={skeletonCardStyle()} />
          </div>
        </div>

        {/* Community Cards Skeleton */}
        <div style={{ textAlign: "center", padding: "20px", margin: "10px 0" }}>
          <div style={skeletonPulseStyle()} />
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              marginTop: "10px",
            }}
          >
            <div style={skeletonCardStyle()} />
            <div style={skeletonCardStyle()} />
            <div style={skeletonCardStyle()} />
            <div style={skeletonCardStyle()} />
            <div style={skeletonCardStyle()} />
          </div>
        </div>

        {/* Player Area Skeleton */}
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <div style={skeletonPulseStyle()} />
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              marginTop: "10px",
            }}
          >
            <div style={skeletonCardStyle()} />
            <div style={skeletonCardStyle()} />
          </div>
        </div>
      </div>
    </div>
  );
}

function skeletonPulseStyle() {
  return {
    width: "120px",
    height: "20px",
    background: "linear-gradient(90deg, #2a2a3a 25%, #3a3a4a 50%, #2a2a3a 75%)",
    backgroundSize: "200% 100%",
    borderRadius: "10px",
    margin: "0 auto",
    animation: "skeleton-pulse 1.5s ease-in-out infinite",
  };
}

function skeletonCardStyle() {
  return {
    width: "60px",
    height: "84px",
    borderRadius: "8px",
    background: "linear-gradient(90deg, #2a2a3a 25%, #3a3a4a 50%, #2a2a3a 75%)",
    backgroundSize: "200% 100%",
    animation: "skeleton-pulse 1.5s ease-in-out infinite",
  };
}
