import { useState } from "react";
import {
  Cpu,
  Home,
  MapPin,
  Navigation,
  Settings,
  Power,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Wifi,
  ArrowLeft,
  Zap,
} from "lucide-react";

/* ─── tiny battery SVG ─── */
function BatteryGlyph({ pct }: { pct: number }) {
  const fill = Math.round((pct / 100) * 17);
  return (
    <svg width="24" height="12" viewBox="0 0 24 12" className="shrink-0">
      <rect x=".75" y=".75" width="20.5" height="10.5" rx="2.5"
        stroke="rgba(255,255,255,.55)" strokeWidth="1.5" fill="none" />
      <rect x="21.75" y="3.75" width="2.5" height="4.5" rx="1"
        fill="rgba(255,255,255,.35)" />
      {fill > 0 && (
        <rect x="2.25" y="2.25" width={fill} height="7.5" rx="1.5"
          fill={pct > 20 ? "#4ade80" : "#f87171"} />
      )}
    </svg>
  );
}

/* ─── dark-mode SVG map ─── */
function DarkMap() {
  return (
    <svg viewBox="0 0 360 290" className="w-full h-full"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      {/* canvas */}
      <rect width="360" height="290" fill="#0E1117" />

      {/* block fills */}
      {[
        [0,0,64,50],[82,0,56,50],[156,0,56,50],[230,0,56,50],[304,0,56,50],
        [0,68,64,62],[82,68,56,62],[156,68,56,62],[230,68,56,62],[304,68,56,62],
        [0,148,64,58],[82,148,56,58],[156,148,56,58],[230,148,56,58],[304,148,56,58],
        [0,224,360,66],
      ].map(([x,y,w,h],i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill="#151B26" />
      ))}

      {/* horizontal roads */}
      {[50,130,206].map(y => (
        <rect key={y} x="0" y={y} width="360" height="18" fill="#1C2333" />
      ))}
      {/* vertical roads */}
      {[64,138,212,286].map(x => (
        <rect key={x} x={x} y="0" width="18" height="290" fill="#1C2333" />
      ))}

      {/* road edge lines */}
      {[50,68,130,148,206,224].map(y => (
        <line key={y} x1="0" y1={y} x2="360" y2={y}
          stroke="#252D3E" strokeWidth="0.8" />
      ))}
      {[64,82,138,156,212,230,286,304].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="290"
          stroke="#252D3E" strokeWidth="0.8" />
      ))}

      {/* center dashes */}
      {[59,139,215].map(y => (
        <line key={y} x1="0" y1={y} x2="360" y2={y}
          stroke="#2E3A52" strokeWidth="0.7" strokeDasharray="10,7" />
      ))}
      {[73,147,221,295].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="290"
          stroke="#2E3A52" strokeWidth="0.7" strokeDasharray="10,7" />
      ))}

      {/* street labels */}
      {[
        { text: "Av. Río Grande", x: 170, y: 127, rot: 0, anchor: "middle" },
        { text: "C/Los Fresnos", x: 100, y: 203, rot: 0, anchor: "middle" },
        { text: "C/Felipe G.", x: 73, y: 40, rot: -90, anchor: "middle" },
        { text: "Blvd. Central", x: 280, y: 127, rot: 0, anchor: "middle" },
      ].map(({ text, x, y, rot, anchor }) => (
        <text key={text}
          x={x} y={y} textAnchor={anchor as "middle"}
          fontSize="7" fill="#4A5568" fontFamily="Inter, sans-serif"
          fontWeight="500" letterSpacing="0.2"
          transform={rot ? `rotate(${rot},${x},${y})` : undefined}
        >{text}</text>
      ))}

      {/* neon green route line */}
      <polyline
        points="73,290 73,215 147,215 147,139 221,139 221,59 295,59 295,0"
        fill="none"
        stroke="#39FF14"
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.92"
      />
      {/* route glow */}
      <polyline
        points="73,290 73,215 147,215 147,139 221,139 221,59 295,59 295,0"
        fill="none"
        stroke="#39FF14"
        strokeWidth="9"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.14"
      />

      {/* direction arrows on route */}
      {[
        { x: 73, y: 250, rot: 90 },
        { x: 110, y: 215, rot: 0 },
        { x: 147, y: 177, rot: 90 },
        { x: 184, y: 139, rot: 0 },
        { x: 221, y: 99, rot: 90 },
        { x: 258, y: 59, rot: 0 },
      ].map(({ x, y, rot }, i) => (
        <polygon key={i}
          points="0,-5 4,3 0,1 -4,3"
          fill="#39FF14"
          opacity="0.75"
          transform={`translate(${x},${y}) rotate(${rot})`}
        />
      ))}

      {/* location dot */}
      <circle cx="221" cy="139" r="22" fill="#3B82F6" opacity="0.12" />
      <circle cx="221" cy="139" r="14" fill="#3B82F6" opacity="0.22" />
      <circle cx="221" cy="139" r="9" fill="#60A5FA" />
      <circle cx="221" cy="139" r="4" fill="white" />
      {/* heading arrow */}
      <polygon points="221,127 224,135 221,132 218,135"
        fill="white" opacity="0.9" />

      {/* compass */}
      <g transform="translate(336,22)">
        <circle cx="0" cy="0" r="13" fill="#1C2333" stroke="#2E3A52" strokeWidth="1" />
        <polygon points="0,-8 2.5,0 0,-2 -2.5,0" fill="#EF4444" />
        <polygon points="0,8 2.5,0 0,2 -2.5,0" fill="#4A5568" />
        <text x="0" y="-14" textAnchor="middle" fontSize="6" fill="#6B7280"
          fontFamily="Inter, sans-serif" fontWeight="700">N</text>
      </g>
    </svg>
  );
}

const BC = "'Barlow Condensed', sans-serif";
const INT = "'Inter', sans-serif";

export default function App() {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      className="w-screen h-screen bg-[#090B0F] flex flex-col overflow-hidden select-none"
      style={{ fontFamily: INT }}
    >
      {/* ══════════════════════════════════
          STATUS BAR
      ══════════════════════════════════ */}
      <div
        className="shrink-0 flex items-center justify-between px-4 bg-black"
        style={{ height: "30px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Battery */}
        <div className="flex items-center gap-1.5">
          <BatteryGlyph pct={52} />
          <span className="text-white font-semibold" style={{ fontSize: "11px" }}>52%</span>
        </div>

        {/* GPS */}
        <div className="flex items-center gap-1.5">
          <Navigation className="w-3 h-3 text-amber-400" strokeWidth={2.5} />
          <span className="text-amber-400 font-bold" style={{ fontSize: "11px" }}>6.6m 1s</span>
        </div>

        {/* CPU */}
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3 h-3 text-slate-400" strokeWidth={1.8} />
          <span className="text-slate-400 font-medium" style={{ fontSize: "11px" }}>91% Free</span>
        </div>

        {/* Network */}
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-green-400" strokeWidth={2} />
          <span className="text-green-400 font-bold" style={{ fontSize: "11px" }}>
            {"((•))"} En línea
          </span>
        </div>

        {/* Clock */}
        <span className="text-white font-semibold tracking-wide" style={{ fontSize: "11px" }}>
          6 mayo&nbsp;&nbsp;08:03 AM
        </span>
      </div>

      {/* ══════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════ */}
      <div
        className="flex-1 min-h-0 grid"
        style={{
          gridTemplateColumns: "2.1fr 1.6fr 1.9fr",
          gap: "1px",
          background: "rgba(255,255,255,0.045)",
        }}
      >
        {/* ──────────── LEFT: NAV ──────────── */}
        <div className="bg-[#0C0F16] flex flex-col overflow-hidden">
          {/* panel header */}
          <div
            className="shrink-0 flex items-center justify-between px-3"
            style={{ height: "32px", borderBottom: "1px solid rgba(255,255,255,0.055)" }}
          >
            <span
              className="text-[#4A5568] font-semibold uppercase tracking-[0.22em]"
              style={{ fontSize: "10px" }}
            >
              NAVEGACIÓN
            </span>
            <span
              className="text-white font-black uppercase tracking-[0.32em]"
              style={{ fontFamily: BC, fontSize: "14px" }}
            >
              NAV
            </span>
            <span
              className="text-green-500 font-semibold"
              style={{ fontSize: "10px" }}
            >
              ● GPS
            </span>
          </div>

          {/* map */}
          <div className="flex-1 overflow-hidden min-h-0">
            <DarkMap />
          </div>

          {/* bottom label strip */}
          <div
            className="shrink-0 flex items-center justify-center gap-6 px-4"
            style={{ height: "28px", borderTop: "1px solid rgba(255,255,255,0.045)" }}
          >
            <span className="text-[#374151] font-medium" style={{ fontSize: "10px" }}>
              ← Av. Río Grande 0.3 km
            </span>
            <span className="text-green-400 font-semibold" style={{ fontSize: "10px" }}>
              ↑ Ruta activa
            </span>
          </div>
        </div>

        {/* ──────────── CENTER: SPEED ──────────── */}
        <div
          className="bg-[#0A0C11] flex flex-col items-center justify-between overflow-hidden"
          style={{ paddingTop: "10px", paddingBottom: "12px" }}
        >
          {/* top label */}
          <div
            className="shrink-0 flex items-center gap-2 px-3 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span
              className="text-[#4B5563] font-semibold uppercase tracking-widest"
              style={{ fontSize: "9px" }}
            >
              VELOCIDAD
            </span>
          </div>

          {/* big speed */}
          <div className="flex-1 flex flex-col items-center justify-center gap-0 min-h-0">
            <span
              className="text-white font-black leading-none tabular-nums"
              style={{
                fontFamily: BC,
                fontSize: "clamp(96px, 15vw, 210px)",
                letterSpacing: "-0.02em",
                textShadow: "0 0 60px rgba(255,255,255,0.1)",
              }}
            >
              50
            </span>
            <span
              className="text-white font-black uppercase tracking-widest"
              style={{
                fontFamily: BC,
                fontSize: "clamp(18px, 2.2vw, 30px)",
                letterSpacing: "0.35em",
                opacity: 0.9,
                marginTop: "-4px",
              }}
            >
              km/h
            </span>
          </div>

          {/* Spotify controls */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[#1DB954] font-bold tracking-wider"
                style={{ fontSize: "9px" }}
              >
                ● SPOTIFY
              </span>
            </div>
            <div className="flex items-center gap-3.5">
              {[
                {
                  icon: <SkipBack className="w-4 h-4" strokeWidth={2} />,
                  action: undefined,
                },
                {
                  icon: playing
                    ? <Pause className="w-5 h-5" strokeWidth={2.5} />
                    : <Play className="w-5 h-5" style={{ marginLeft: "2px" }} strokeWidth={2.5} />,
                  action: () => setPlaying(p => !p),
                  large: true,
                },
                {
                  icon: <SkipForward className="w-4 h-4" strokeWidth={2} />,
                  action: undefined,
                },
              ].map(({ icon, action, large }, i) => (
                <button
                  key={i}
                  onClick={action}
                  className="rounded-full flex items-center justify-center text-white
                    hover:text-white transition-all active:scale-95"
                  style={{
                    width: large ? "52px" : "40px",
                    height: large ? "52px" : "40px",
                    background: "#333333",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: large ? "0 0 0 1px rgba(255,255,255,0.06)" : "none",
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
{/* ──────────── RIGHT: INFORMACIÓN ──────────── */}
        <div className="bg-[#0C0F16] flex flex-col overflow-hidden">
          {/* panel header */}
          <div
            className="shrink-0 flex items-center justify-between px-4"
            style={{ height: "32px", borderBottom: "1px solid rgba(255,255,255,0.055)" }}
          >
            <span
              className="text-white font-black uppercase tracking-[0.32em]"
              style={{ fontFamily: BC, fontSize: "14px" }}
            >
              INFORMACIÓN
            </span>
            {/* Guatzik indicator */}
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span
                className="text-green-400 font-semibold tracking-wider"
                style={{ fontSize: "9px" }}
              >
                GUATZIK: LEYENDO
              </span>
            </div>
          </div>

          {/* trip data — 2x3 Grid */}
          <div className="flex-1 flex flex-col justify-center px-5 gap-y-4 py-4 overflow-hidden min-h-0">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              
              {/* Vel Max */}
              <div className="flex flex-col gap-0.5">
                <span className="text-cyan-400 font-semibold uppercase tracking-widest" style={{ fontSize: "10px" }}>VELOCIDAD MÁXIMA</span>
                <span className="text-white font-black leading-none tabular-nums" style={{ fontFamily: BC, fontSize: "32px" }}>75</span>
              </div>
              
              {/* Altitud */}
              <div className="flex flex-col gap-0.5">
                <span className="text-cyan-400 font-semibold uppercase tracking-widest" style={{ fontSize: "10px" }}>ALTITUD</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-white font-black leading-none tabular-nums" style={{ fontFamily: BC, fontSize: "32px" }}>1913</span>
                  <span className="text-[#4B5563] font-semibold text-xs">m</span>
                </div>
              </div>

              {/* Encabezado */}
              <div className="flex flex-col gap-0.5">
                <span className="text-cyan-400 font-semibold uppercase tracking-widest" style={{ fontSize: "10px" }}>ENCABEZADO</span>
                <span className="text-white font-black leading-none tabular-nums" style={{ fontFamily: BC, fontSize: "32px" }}>45º</span>
              </div>

              {/* ODO (Con indicador de grabación) */}
              <div className="flex flex-col gap-0.5">
                <span className="text-cyan-400 font-semibold uppercase tracking-widest flex items-center gap-1.5" style={{ fontSize: "10px" }}>
                  ODO 
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
                </span>
                <span className="text-white font-black leading-none tabular-nums" style={{ fontFamily: BC, fontSize: "32px" }}>12.4</span>
              </div>

              {/* Velocidad */}
              <div className="flex flex-col gap-0.5">
                <span className="text-cyan-400 font-semibold uppercase tracking-widest" style={{ fontSize: "10px" }}>VELOCIDAD</span>
                <span className="text-white font-black leading-none tabular-nums" style={{ fontFamily: BC, fontSize: "32px" }}>50</span>
              </div>
            </div>
          </div>

          {/* GUARDAR TRAYECTO BUTTON */}
          <div className="shrink-0 px-4 pb-4">
            <button
              className="w-full py-3 rounded text-white font-bold uppercase tracking-wider
                hover:bg-[#3C3C3C] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                fontFamily: BC,
                fontSize: "13px",
                letterSpacing: "0.15em",
                background: "#333333",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              GUARDAR TRAYECTO
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          BOTTOM DOCK
      ══════════════════════════════════ */}
      <div
        className="shrink-0 flex items-center justify-center gap-8"
        style={{
          height: "52px",
          background: "#0D0F14",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {[
          { icon: <ArrowLeft className="w-5 h-5" strokeWidth={2} /> },
          { icon: <Home className="w-5 h-5" strokeWidth={2} /> },
          { icon: <MapPin className="w-5 h-5" strokeWidth={2} /> },
          { icon: <Settings className="w-5 h-5" strokeWidth={2} /> },
          { icon: <Power className="w-5 h-5" strokeWidth={2} /> },
        ].map(({ icon }, i) => (
          <button
            key={i}
            className="flex items-center justify-center text-white opacity-60
              hover:opacity-100 transition-opacity cursor-pointer"
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}