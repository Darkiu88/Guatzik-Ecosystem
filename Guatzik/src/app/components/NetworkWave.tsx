import { useEffect, useState } from "react";

// Aceptamos dos props: subida y bajada
interface NetworkCardProps {
  upload: number; // Celeste (Up)
  download: number; // Verde (Down)
}

export function NetworkCard({ upload, download }: NetworkCardProps) {
  // Cantidad de barras verticales a mostrar
  const BARS_COUNT = 40;

  const [historyUp, setHistoryUp] = useState<number[]>(
    new Array(BARS_COUNT).fill(0),
  );
  const [historyDown, setHistoryDown] = useState<number[]>(
    new Array(BARS_COUNT).fill(0),
  );

  useEffect(() => {
    // Actualizamos ambas listas al recibir datos nuevos
    setHistoryUp((prev) => [...prev.slice(1), upload]);
    setHistoryDown((prev) => [...prev.slice(1), download]);
  }, [upload, download]);

  // Función para calcular altura (0 a 100%)
  const getHeight = (val: number) => {
    const maxVal = 1000; // Tope visual (1000 Mb/s)
    const safeVal = Math.min(val, maxVal);
    return (safeVal / maxVal) * 1000;
  };

  return (
    <div className="glass-panel w-full h-full relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between group min-h-[220px]">
      {/* --- CABECERA (DATOS NUMÉRICOS) --- */}
      <div className="z-20 flex flex-col justify-between items-start w-full gap-4">
        <div>
          <h3 className="text-[10px] text-gray-400 tracking-widest font-bold uppercase mb-2">
            TRÁFICO DE RED
          </h3>

          <div className="flex flex-col gap-2 font-mono">
            {/* SUBIDA (Celeste) */}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#00F3FF] shadow-[0_0_5px_#00F3FF]"></div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-white text-glow-blue">
                  {upload.toFixed(1)}
                </span>
                <span className="text-[10px] text-[#00F3FF]/70">Mb/s UP</span>
              </div>
            </div>

            {/* BAJADA (Verde) */}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#00FF41] shadow-[0_0_5px_#00FF41]"></div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-white text-glow-green">
                  {download.toFixed(1)}
                </span>
                <span className="text-[10px] text-[#00FF41]/70">Mb/s DOWN</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- GRÁFICA DE BARRAS (SVG) --- */}
      <div className="absolute inset-x-0 bottom-0 h-32 w-full z-10 px-2 pb-2">
        <svg className="w-full h-full" preserveAspectRatio="none">
          {historyDown.map((val, i) => {
            // Calculamos ancho y posición de cada barra
            const barWidthPct = 100 / BARS_COUNT;
            const x = i * barWidthPct;

            // Alturas
            const hDown = getHeight(historyDown[i]);
            const hUp = getHeight(historyUp[i]);

            return (
              <g key={i}>
                {/* BARRA VERDE (BAJADA) */}
                <rect
                  x={`${x}%`}
                  y={`${100 - hDown}%`}
                  width={`${barWidthPct - 0.5}%`} // -0.5 para dejar un hueco negro entre barras
                  height={`${hDown}%`}
                  fill="#00FF41"
                  opacity="0.6" // Opacidad para ver si se cruzan
                />

                {/* BARRA CELESTE (SUBIDA) */}
                <rect
                  x={`${x}%`}
                  y={`${100 - hUp}%`}
                  width={`${barWidthPct - 0.5}%`}
                  height={`${hUp}%`}
                  fill="#00F3FF"
                  opacity="0.6"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Grid Decorativo de fondo (Líneas horizontales finas) */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100%_20%]"></div>

      {/* Línea base inferior */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gray-700"></div>
    </div>
  );
}
