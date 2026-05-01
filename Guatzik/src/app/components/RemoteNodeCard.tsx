import { useEffect, useState } from 'react';
import { Server, Cpu, Monitor, HardDrive } from 'lucide-react'; // <-- Asegúrate de tener lucide-react instalado
import type { RemoteNodeMetrics } from '../context/SystemContext';

interface Props {
  node: RemoteNodeMetrics;
}

const HISTORY_LEN = 30;

// Pequeño componente para renderizar el ícono correcto según el Contexto
function NodeIcon({ iconName }: { iconName: string }) {
  const props = { className: "w-3 h-3 text-gray-500" };
  switch (iconName) {
    case 'cpu': return <Cpu {...props} />;
    case 'monitor': return <Monitor {...props} />;
    case 'hard-drive': return <HardDrive {...props} />;
    default: return <Server {...props} />;
  }
}

export function RemoteNodeCard({ node }: Props) {
  const [cpuHistory, setCpuHistory] = useState<number[]>(
    new Array(HISTORY_LEN).fill(0)
  );

  useEffect(() => {
    if (node.online) {
      setCpuHistory((prev) => [...prev.slice(1), node.cpuLoad]);
    }
  }, [node.cpuLoad, node.online]);

  const cpuColor =
    node.cpuLoad > 85 ? '#ff4444' : node.cpuLoad > 65 ? '#ffaa00' : '#00F3FF';

  const ramColor =
    node.ramPercent > 85
      ? '#ff4444'
      : node.ramPercent > 65
      ? '#ffaa00'
      : '#00FF41';

  return (
    <div className="glass-panel w-full h-full relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between min-h-[220px]">

      {/* ── Header ── */}
      <div className="flex items-start justify-between z-10">
        <div>
          {/* Aquí inyectamos el ROL y el ÍCONO */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <NodeIcon iconName={node.icon} />
            <p className="text-[9px] text-gray-500 tracking-[3px] uppercase">
              {node.role || 'Nodo Remoto'}
            </p>
          </div>
          
          {/* Aquí inyectamos el NOMBRE REAL (Ej: "Terminal All-in-One") */}
          <h3 className="text-[11px] text-[#00FF41] tracking-widest font-bold uppercase truncate max-w-[150px]">
            {node.customName || node.hostname}
          </h3>
          
          {/* Aquí inyectamos el HARDWARE + IP */}
          <p className="text-[9px] text-gray-600 font-mono mt-0.5">
            {node.specs} <span className="text-gray-800">|</span> {node.ip}
          </p>
        </div>
        
        {/* Estado Online/Offline (Se mantiene igual) */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: node.online ? '#00FF41' : '#ff3333',
              boxShadow: node.online
                ? '0 0 6px #00FF41'
                : '0 0 4px #ff3333',
            }}
          />
          <span
            className="text-[9px] font-mono tracking-widest"
            style={{ color: node.online ? '#00FF41' : '#ff4444' }}
          >
            {node.online ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {node.online ? (
        <>
          {/* ── CPU + Sparkline ── */}
          <div className="z-10 mt-2">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[9px] text-gray-500 tracking-widest">
                CPU UTILIZATION
              </span>
              <span className="text-xl font-bold font-mono" style={{ color: cpuColor }}>
                {node.cpuLoad.toFixed(1)}
                <span className="text-[10px] text-gray-500 ml-0.5">%</span>
              </span>
            </div>
            {/* Barra */}
            <div className="w-full h-[3px] bg-gray-800 rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${node.cpuLoad}%`, background: cpuColor }}
              />
            </div>
            {/* Sparkline SVG */}
            <svg className="w-full h-8" preserveAspectRatio="none">
              {cpuHistory.map((val, i) => {
                const bw = 100 / HISTORY_LEN;
                const h = (val / 100) * 100;
                return (
                  <rect
                    key={i}
                    x={`${i * bw}%`}
                    y={`${100 - h}%`}
                    width={`${bw - 0.5}%`}
                    height={`${h}%`}
                    fill={cpuColor}
                    opacity="0.5"
                  />
                );
              })}
            </svg>
          </div>

          {/* ── RAM ── */}
          <div className="z-10 mt-1">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[9px] text-gray-500 tracking-widest">
                MEMORIA RAM
              </span>
              <span className="text-xl font-bold font-mono" style={{ color: ramColor }}>
                {node.ramUsed.toFixed(1)}
                <span className="text-[10px] text-gray-500 ml-0.5">
                  / {node.ramTotal.toFixed(0)} GB
                </span>
              </span>
            </div>
            <div className="w-full h-[3px] bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${node.ramPercent}%`, background: ramColor }}
              />
            </div>
          </div>

          {/* ── Top procesos y Temperatura ── */}
          <div className="flex justify-between items-end mt-2 z-10">
            {node.topProcesses.length > 0 ? (
              <div className="flex flex-col gap-1 w-[60%]">
                <p className="text-[8px] text-gray-600 tracking-widest mb-0.5 border-b border-gray-800/60 pb-0.5">
                  TOP PROCESSES
                </p>
                {node.topProcesses.slice(0, 2).map((p, i) => (
                  <div key={i} className="flex justify-between font-mono">
                    <span className="text-[9px] text-gray-500 truncate max-w-[70%]">
                      {p.name}
                    </span>
                    <span className="text-[9px] text-[#00F3FF]">
                      {p.cpu.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : <div />}

            {/* Temp si viene del servidor */}
            {node.cpuTemp > 0 && (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[8px] text-gray-600 tracking-widest">TEMP</span>
                <span
                  className="text-[12px] font-mono font-bold"
                  style={{ color: node.cpuTemp > 80 ? '#ff4444' : '#ffaa00' }}
                >
                  {node.cpuTemp.toFixed(1)}°C
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 z-10">
          <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-red-900/30 animate-pulse" />
          </div>
          <span className="text-[9px] text-gray-700 tracking-[3px]">
            LINK SEVERED
          </span>
          <span className="text-[8px] text-gray-800 font-mono">
            Esperando telemetría de {node.ip}...
          </span>
        </div>
      )}

      {/* Grid decorativo */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:100%_25%] pointer-events-none" />
    </div>
  );
}