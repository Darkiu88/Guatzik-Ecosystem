import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

// 👇 Definimos la estructura de un proceso real
interface ProcessData {
  name: string;
  cpu: number;
}

interface ReactorGaugeProps {
  value: number; // El total de CPU
  label?: string;
  processList?: ProcessData[]; // ✅ ACEPTA LA LISTA REAL DE PROCESOS
}

export function ReactorGauge({ value, label = "CPU UTILIZATION", processList = [] }: ReactorGaugeProps) {
  // 1. BLINDAJE: Aseguramos que el valor sea un número válido
  const safeValue = (typeof value === 'number' && !isNaN(value)) ? value : 0;

  // 2. SIMULACIÓN DE HISTORIAL (Para la gráfica de fondo)
  const [historyData, setHistoryData] = useState<number[]>([]);

  useEffect(() => {
    // Llenamos el array inicial
    const initialData = Array.from({ length: 40 }, () => Math.random() * 40 + 10);
    setHistoryData(initialData);

    const interval = setInterval(() => {
      setHistoryData((prev) => {
        // Agregamos un punto nuevo basado en el valor actual del CPU (con variación)
        const variance = Math.random() * 10 - 5;
        const newPoint = Math.max(5, Math.min(90, safeValue + variance)); 
        return [...prev.slice(1), newPoint];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [safeValue]);

  // 3. GENERADOR DE RUTA SVG (La montaña)
  const generatePath = () => {
    if (historyData.length === 0) return "";
    const width = 100; 
    const height = 100;
    const stepX = width / (historyData.length - 1);

    let pathD = `M 0 ${height} `; // Inicio abajo-izquierda

    historyData.forEach((val, i) => {
      const x = i * stepX;
      const y = height - val; // Invertir Y
      pathD += `L ${x} ${y} `;
    });

    pathD += `L ${width} ${height} Z`; // Cerrar ruta
    return pathD;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center min-h-[350px] overflow-hidden rounded-3xl">
      
      {/* --- FONDO: GRÁFICA DE MONTAÑA --- */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cpuGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00F3FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00F3FF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={generatePath()}
            fill="url(#cpuGradient)"
            stroke="#00F3FF"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* --- CENTRO: EL REACTOR --- */}
      <div className="relative z-10 w-72 h-72 flex items-center justify-center">
        {/* Anillo Exterior Estático */}
        <div className="absolute inset-0 rounded-full border border-[#00F3FF]/10 shadow-[0_0_50px_rgba(0,243,255,0.1)]" />

        {/* Anillo Principal Giratorio */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-t-[#00F3FF] border-r-transparent border-b-[#00F3FF]/20 border-l-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />

        {/* Anillo Secundario (Contra-rotación) */}
        <motion.div
          className="absolute inset-4 rounded-full border border-t-transparent border-r-[#00FF41]/50 border-b-transparent border-l-[#00FF41]/50"
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        {/* Círculo de Cristal Central */}
        <div className="absolute inset-8 rounded-full bg-gradient-to-b from-[#00F3FF]/10 to-transparent backdrop-blur-[2px] border border-[#00F3FF]/20" />

        {/* TEXTO CENTRAL */}
        <div className="relative z-20 text-center flex flex-col items-center">
          <div className="flex items-baseline">
            <span className="text-6xl font-bold font-mono text-white text-glow-white tracking-tighter">
              {safeValue.toFixed(1)}
            </span>
            <span className="text-2xl text-[#00F3FF] font-bold ml-1">%</span>
          </div>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#00F3FF] to-transparent my-2" />
          <span className="text-[10px] text-[#00F3FF] tracking-[0.3em] font-bold uppercase">
            {label}
          </span>
          
          {/* Puntos decorativos bajo el texto */}
          <div className="flex gap-1 mt-2">
            <div className="w-1 h-1 rounded-full bg-[#00F3FF] animate-pulse" />
            <div className="w-1 h-1 rounded-full bg-[#00F3FF] animate-pulse delay-75" />
            <div className="w-1 h-1 rounded-full bg-[#00F3FF] animate-pulse delay-150" />
          </div>
        </div>
      </div>

      {/* --- DERECHA: LISTA DE PROCESOS REALES --- */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden xl:block">
        <h4 className="text-[8px] text-[#00F3FF] font-mono tracking-widest text-right mb-3 border-b border-[#00F3FF]/20 pb-1">
          TOP PROCESSES
        </h4>
        <ul className="space-y-2 text-right">
          {processList && processList.length > 0 ? (
            // 👇 MAPEO DE LA LISTA REAL DE PROCESOS 👇
            processList.map((proc, i) => (
              <li key={i} className="flex justify-end gap-3 text-[9px] font-mono group cursor-default">
                <span className="text-gray-500 group-hover:text-white transition-colors">
                  {proc.name.length > 15 ? proc.name.substring(0, 15) + "..." : proc.name}
                </span>
                <span className="text-[#00FF41]">{proc.cpu.toFixed(1)}%</span>
              </li>
            ))
          ) : (
            // Texto de espera si no hay procesos aún
            <div className="text-[9px] font-mono text-gray-700 text-right mt-4">[SCANNING...]</div>
          )}
        </ul>
      </div>

    </div>
  );
}