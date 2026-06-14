import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface Background3DProps {
  mode: 'earth' | 'pyramids';
  themeColor?: string;
}

export const Background3D: React.FC<Background3DProps> = React.memo(({ mode, themeColor = '#00f2ff' }) => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#000205] pointer-events-none transform-gpu">
      {/* Deep Space Gradient - Static */}
      <div
        style={{
          background: `radial-gradient(circle at 50% 50%, ${themeColor}15 0%, transparent 75%)`
        }}
        className="absolute inset-0"
      />

      {/* Static Stars */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            style={{
              left: (i * 17) % 100 + "%",
              top: (i * 23) % 100 + "%",
            }}
            className="absolute w-[1px] h-[1px] bg-white rounded-full"
          />
        ))}
      </div>

      {mode === 'earth' ? (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] rounded-full opacity-20"
            style={{
              background: `radial-gradient(circle, ${themeColor} 0%, transparent 60%)`,
            }}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 w-[140vw] h-[60vh] opacity-20">
            <svg viewBox="0 0 1000 500" className="w-full h-full text-white/5">
              <defs>
                <linearGradient id="pyramidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: themeColor, stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: '#000205', stopOpacity: 0.9 }} />
                </linearGradient>
              </defs>
              <path d="M500 50 L950 450 L50 450 Z" fill="url(#pyramidGrad)" stroke={themeColor} strokeWidth="0.5" />
              <path d="M500 50 L500 450" stroke={themeColor} strokeWidth="0.2" opacity="0.4" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
});
