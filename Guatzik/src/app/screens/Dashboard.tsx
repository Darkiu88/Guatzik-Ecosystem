import { ReactorGauge } from "@/app/components/ReactorGauge";
import { NetworkCard } from "@/app/components/NetworkWave";
import { RemoteNodeCard } from "@/app/components/RemoteNodeCard"; // ✅ Importación agregada
import { Activity, HardDrive, Thermometer, Wind } from "lucide-react";
import { motion } from "motion/react";
import { useSystem } from "@/app/context/SystemContext";

export function Dashboard() {
  const { state } = useSystem();

  // --- LÓGICA DE COLOR TÉRMICO ---
  // Calcula si el color debe ser azul, naranja o rojo según el calor
  const getTempColor = (temp: number) => {
    if (temp < 50) return '#00F3FF'; // Azul (Frío)
    if (temp < 75) return '#FF9F1C'; // Naranja (Tibio)
    return '#FF003C';                // Rojo (Caliente)
  };

  const tempColor = getTempColor(state.cpuTemp);

  return (
    <div className="h-full w-full p-8 grid grid-cols-12 gap-8 font-mono overflow-y-auto pb-24">
      
      {/* --- COLUMNA IZQUIERDA: TARJETA GIGANTE DEL CPU --- */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="col-span-12 lg:col-span-5 glass-panel rounded-3xl relative overflow-hidden flex flex-col justify-center min-h-[500px]"
        style={{
            // Si la temperatura es crítica (>80), el borde parpadea en rojo
            borderColor: state.cpuTemp > 80 ? '#FF003C' : 'rgba(255,255,255,0.1)',
            boxShadow: state.cpuTemp > 80 ? '0 0 30px rgba(255, 0, 60, 0.2)' : 'none'
        }}
      >
        {/* Medidor Circular Central - ¡AHORA CON LA LISTA DE PROCESOS! */}
        <ReactorGauge 
          value={state.cpuLoad} 
          label="CPU UTILIZATION" 
          processList={state.topProcesses} // ✅ Conexión de los datos reales
        />

        {/* --- SECCIÓN: BARRA DE TEMPERATURA --- */}
        <div className="absolute bottom-20 w-full px-8">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Thermometer size={16} color={tempColor} />
                    <span className="text-xs font-bold text-gray-400">CORE TEMP</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Ventilador que gira si hace calor */}
                    <Wind 
                        size={16} 
                        className={state.cpuTemp > 60 ? "animate-spin text-[#00F3FF]" : "text-gray-600"} 
                    />
                    <span className="text-xl font-bold" style={{ color: tempColor, textShadow: `0 0 10px ${tempColor}` }}>
                        {state.cpuTemp}°C
                    </span>
                </div>
            </div>

            {/* Barra visual con gradiente */}
            <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-white/10 relative">
                <motion.div 
                    className="h-full absolute left-0 top-0"
                    animate={{ width: `${Math.min(state.cpuTemp, 100)}%` }}
                    style={{ 
                        background: `linear-gradient(90deg, #00F3FF 0%, ${tempColor} 100%)`,
                        boxShadow: `0 0 10px ${tempColor}`
                    }}
                    transition={{ type: "spring", stiffness: 20 }}
                />
            </div>
        </div>

        {/* Footer Técnico (Voltaje y Gobernador) */}
        <div className="absolute bottom-6 w-full px-8 flex justify-between text-[9px] text-gray-500 uppercase tracking-wider border-t border-white/5 pt-4">
          <div>
            VOLTAJE: <span className="text-[#00F3FF]">1.41 V</span>
          </div>
          <div>
            GOBERNADOR: <span className="text-white">PERFORMANCE</span>
          </div>
        </div>

        {/* Alerta de Sobrecalentamiento */}
        {state.cpuTemp > 85 && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="absolute top-4 right-4 bg-red-500 text-black font-bold text-[10px] px-2 py-1 rounded animate-pulse"
            >
                ⚠️ OVERHEAT
            </motion.div>
        )}
      </motion.div>

      {/* --- COLUMNA DERECHA: PILA DE TARJETAS (RAM, DISCO, RED) --- */}
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
        
        {/* TARJETA 1: RAM */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-[#00FF41]/50 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-[10px] text-[#00FF41] tracking-widest font-bold uppercase">
                MEMORIA RAM
              </h3>
              <div className="text-[10px] text-gray-500">
                TOTAL: {state.ramTotal || 0} GB
              </div>
            </div>
            <Activity size={18} className="text-[#00FF41]" />
          </div>

          <div className="text-3xl font-bold text-white mb-4">
            {state.ramUsed} <span className="text-sm text-gray-400">GB EN USO</span>
          </div>

          <div className="h-2 bg-gray-800 rounded-full overflow-hidden w-full">
            <motion.div
              className="h-full bg-[#00FF41] shadow-[0_0_10px_#00FF41]"
              animate={{ width: `${state.ramPercent}%` }}
              transition={{ type: "spring", stiffness: 50 }}
            />
          </div>
          <div className="text-right text-[10px] text-[#00FF41] mt-1">
            {state.ramPercent}%
          </div>
        </div>

        {/* TARJETA 2: DISCO */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-[#00F3FF]/50 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-[10px] text-[#00F3FF] tracking-widest font-bold uppercase">
                DISCO PRINCIPAL
              </h3>
              <div className="text-[10px] text-gray-500">SISTEMA (/)</div>
            </div>
            <HardDrive size={18} className="text-[#00F3FF]" />
          </div>

          <div className="text-3xl font-bold text-white mb-4">
            {state.diskPercent}% <span className="text-sm text-gray-400">OCUPADO</span>
          </div>

          <div className="h-2 bg-gray-800 rounded-full overflow-hidden w-full">
            <motion.div
              className="h-full bg-[#00F3FF] shadow-[0_0_10px_#00F3FF]"
              animate={{ width: `${state.diskPercent}%` }}
            />
          </div>
        </div>

        {/* TARJETA 3: RED */}
        <div className="flex-1 min-h-[220px]">
          <NetworkCard upload={state.netUp} download={state.netDown} />
        </div>
      </div>

      {/* --- SECCIÓN INFERIOR: NODOS REMOTOS --- */}
      {/* Se asegura de renderizar el contenedor solo si hay nodos en el estado */}
      {state.remoteNodes && Object.keys(state.remoteNodes).length > 0 && (
        <div className="col-span-12 mt-4 flex flex-col gap-6">
          <h3 className="text-sm text-gray-400 tracking-widest font-bold uppercase border-b border-white/10 pb-2">
            Nodos Conectados
          </h3>
          {/* Sub-grid para colocar los nodos de lado a lado en pantallas grandes */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.values(state.remoteNodes).map((node) => (
              <RemoteNodeCard key={node.ip} node={node} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}