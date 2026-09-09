import React from 'react';

export const BackgroundGradients: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      {/* Dynamic Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fbf8f7] via-[#f7f9fb] to-[#f4f8f6]" />

      {/* Fluid Floating Pastel Blobs */}
      {/* Soft Rose / Pink Orb */}
      <div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-rose-200/50 via-pink-200/40 to-transparent blur-[120px] animate-blob-slow"
      />

      {/* Mint / Seafoam Orb */}
      <div
        className="absolute top-[20%] -right-40 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-teal-100/60 via-emerald-100/50 to-transparent blur-[130px] animate-blob-delayed"
      />

      {/* Sky Blue Orb */}
      <div
        className="absolute -bottom-40 left-[15%] w-[700px] h-[700px] rounded-full bg-gradient-to-t from-sky-200/50 via-blue-100/45 to-transparent blur-[140px] animate-blob-float"
      />

      {/* Soft Lavender / Purple Orb */}
      <div
        className="absolute top-[50%] right-[25%] w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-purple-200/40 via-indigo-100/35 to-transparent blur-[110px] animate-blob-slow"
      />

      {/* Warm Peach Accent */}
      <div
        className="absolute top-[10%] left-[45%] w-[450px] h-[450px] rounded-full bg-gradient-to-r from-orange-100/35 via-amber-100/25 to-transparent blur-[100px] animate-blob-delayed"
      />

      {/* Subtle Noise Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
