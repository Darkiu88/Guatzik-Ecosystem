import { motion } from 'motion/react';
import { useSystem } from '@/app/context/SystemContext';
import { Printer, Projector, Lightbulb, AlertTriangle, Power } from 'lucide-react';
import { useState } from 'react';

export function HardwareLink() {
  const { state } = useSystem();

  // --- ESTADOS LOCALES (Para que los botones funcionen) ---
  const [projectorOn, setProjectorOn] = useState(true);
  
  // Estado de las luces individuales
  const [lights, setLights] = useState([
    { name: 'Escritorio', on: true, color: '#00F3FF', brightness: 80 },
    { name: 'Ambiente', on: true, color: '#FF00FF', brightness: 45 },
    { name: 'Techo', on: false, color: '#FFFFFF', brightness: 0 },
  ]);

  // Función para alternar una luz específica
  const toggleLight = (index: number) => {
    const newLights = [...lights];
    newLights[index].on = !newLights[index].on;
    setLights(newLights);
  };

  // Función para escenas
  const setScene = (mode: string) => {
    if (mode === 'Focus') setLights([
        { name: 'Escritorio', on: true, color: '#FFFFFF', brightness: 100 },
        { name: 'Ambiente', on: false, color: '#FF00FF', brightness: 0 },
        { name: 'Techo', on: true, color: '#FFFFFF', brightness: 80 },
    ]);
    if (mode === 'Relax') setLights([
        { name: 'Escritorio', on: false, color: '#00F3FF', brightness: 0 },
        { name: 'Ambiente', on: true, color: '#FF9F1C', brightness: 30 },
        { name: 'Techo', on: false, color: '#FFFFFF', brightness: 0 },
    ]);
    if (mode === 'Party') setLights([
        { name: 'Escritorio', on: true, color: '#00F3FF', brightness: 100 },
        { name: 'Ambiente', on: true, color: '#FF00FF', brightness: 100 },
        { name: 'Techo', on: true, color: '#00FF41', brightness: 100 },
    ]);
  };

  const inkLevels = [
    { color: 'Cyan', level: 67, hex: '#00F3FF' },
    { color: 'Magenta', level: 5, hex: '#FF00FF' },
    { color: 'Yellow', level: 89, hex: '#FFFF00' },
    { color: 'Black', level: 34, hex: '#000000' },
  ];

  return (
    <div className="h-full w-full p-8 overflow-y-auto pb-24 font-mono">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-3 mb-8"
      >
        <Printer className="w-8 h-8 text-[#00F3FF]" />
        <h2 className="text-2xl font-bold text-white tracking-wider">
          HARDWARE-LINK <span className="text-[#00F3FF]">//</span> INGENIERÍA FÍSICA
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- 1. IMPRESORA HP (X-RAY) --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md bg-gradient-to-br from-white/5 to-transparent border border-[#00F3FF]/40 rounded-2xl p-6 relative overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(0, 243, 255, 0.1)' }}
        >
          <div className="text-sm font-mono text-[#00F3FF] mb-6 tracking-wider flex items-center justify-between">
            <span>IMPRESORA HP P1102</span>
            {state.printerInkLow && (
              <motion.div 
                animate={{ opacity: [1, 0.5, 1] }} 
                transition={{ duration: 1, repeat: Infinity }}
                className="flex items-center gap-2 text-[#FF003C]"
              >
                <span className="text-[10px]">LOW INK</span>
                <AlertTriangle className="w-4 h-4" />
              </motion.div>
            )}
          </div>

          {/* Printer Outline Schematic */}
          <div className="relative h-48 mb-6 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-40">
              <defs>
                <pattern id="blueprint" width="10" height="10" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="#00F3FF" strokeWidth="0.2" opacity="0.3" />
                  <line x1="0" y1="0" x2="10" y2="0" stroke="#00F3FF" strokeWidth="0.2" opacity="0.3" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#blueprint)" />
              {/* Printer outline */}
              <path d="M20,40 h60 v40 h-60 z M25,30 h50 v10 h-50 z" fill="none" stroke="#00F3FF" strokeWidth="0.5" />
              <line x1="30" y1="40" x2="30" y2="30" stroke="#00F3FF" strokeWidth="0.3" />
              <line x1="70" y1="40" x2="70" y2="30" stroke="#00F3FF" strokeWidth="0.3" />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <Printer className={`w-16 h-16 transition-colors duration-500 ${state.printerInkLow ? 'text-[#FF003C]' : 'text-[#00F3FF]'}`} strokeWidth={1} />
            </div>
          </div>

          {/* Ink Tanks */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-gray-400 mb-2">NIVELES DE TINTA</div>
            {inkLevels.map((ink, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-mono text-gray-400">{ink.color}</span>
                  <span
                    className="text-xs font-mono font-bold"
                    style={{ color: ink.level < 20 ? '#FF003C' : '#00FF41' }}
                  >
                    {ink.level}%
                  </span>
                </div>
                <div className="h-2 bg-black/60 rounded border border-gray-700 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${ink.level}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className="h-full absolute left-0"
                    style={{
                      background: ink.hex,
                      boxShadow: `0 0 10px ${ink.hex}`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-6 py-3 bg-[#00F3FF]/10 border border-[#00F3FF]/50 rounded hover:bg-[#00F3FF]/20 font-mono text-[#00F3FF] text-sm transition-colors"
          >
            [ IMPRIMIR PRUEBA ]
          </motion.button>
        </motion.div>

        {/* --- 2. PROYECTOR 4K --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-md bg-gradient-to-br from-white/5 to-transparent border border-[#00FF41]/40 rounded-2xl p-6 relative"
          style={{ boxShadow: '0 8px 32px rgba(0, 255, 65, 0.1)' }}
        >
          <div className="flex justify-between items-start mb-6">
             <div className="text-sm font-mono text-[#00FF41] tracking-wider">PROYECTOR 4K</div>
             <div className={`text-xs font-bold px-2 py-1 rounded ${projectorOn ? 'bg-[#00FF41]/20 text-[#00FF41]' : 'bg-red-500/20 text-red-500'}`}>
                {projectorOn ? 'SIGNAL: HDMI 1' : 'STANDBY'}
             </div>
          </div>

          {/* Keystone Grid (Se apaga si el proyector está off) */}
          <div className={`relative h-64 mb-6 bg-black/60 rounded border border-[#00FF41]/30 overflow-hidden transition-opacity duration-500 ${projectorOn ? 'opacity-100' : 'opacity-20'}`}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {/* Grid lines */}
              {[20, 40, 60, 80].map((y) => (
                <line key={`h-${y}`} x1="10" y1={y} x2="90" y2={y} stroke="#00FF41" strokeWidth="0.3" opacity="0.5" />
              ))}
              {[25, 50, 75].map((x) => (
                <line key={`v-${x}`} x1={x} y1="10" x2={x} y2="90" stroke="#00FF41" strokeWidth="0.3" opacity="0.5" />
              ))}
              {/* Corners */}
              {[{x:10,y:10}, {x:90,y:10}, {x:90,y:90}, {x:10,y:90}].map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="2" fill="#00FF41" />
              ))}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
               {projectorOn ? (
                  <Projector className="w-12 h-12 text-[#00FF41] opacity-50 animate-pulse" />
               ) : (
                  <Power className="w-12 h-12 text-gray-600" />
               )}
            </div>
          </div>

          {/* Controls */}
          <div className={`space-y-3 transition-opacity duration-300 ${projectorOn ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-gray-400">BRILLO</span>
              <div className="w-24 h-1 bg-gray-700 rounded-full overflow-hidden">
                 <div className="h-full bg-[#00FF41] w-[87%]"></div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-gray-400">CONTRASTE</span>
              <div className="w-24 h-1 bg-gray-700 rounded-full overflow-hidden">
                 <div className="h-full bg-[#00FF41] w-[65%]"></div>
              </div>
            </div>
          </div>

          <motion.button
            onClick={() => setProjectorOn(!projectorOn)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full mt-6 py-3 border rounded font-mono text-sm transition-all ${
                projectorOn 
                ? 'bg-[#FF003C]/20 border-[#FF003C] text-[#FF003C] hover:bg-[#FF003C]/30' 
                : 'bg-[#00FF41]/20 border-[#00FF41] text-[#00FF41] hover:bg-[#00FF41]/30'
            }`}
          >
            [ {projectorOn ? 'APAGAR / BLACKOUT' : 'ENCENDER SISTEMA'} ]
          </motion.button>
        </motion.div>

        {/* --- 3. LUCES INTELIGENTES --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-md bg-gradient-to-br from-white/5 to-transparent border border-[#00F3FF]/40 rounded-2xl p-6"
          style={{ boxShadow: '0 8px 32px rgba(0, 243, 255, 0.1)' }}
        >
          <div className="text-sm font-mono text-[#00F3FF] mb-6 tracking-wider">LUCES INTELIGENTES</div>

          {/* Light Bulbs List */}
          <div className="space-y-4 mb-6">
            {lights.map((light, index) => (
              <motion.div
                key={index}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleLight(index)}
                className={`cursor-pointer backdrop-blur-sm border rounded-lg p-4 flex items-center justify-between transition-all ${
                    light.on ? 'bg-black/40 border-gray-600' : 'bg-black/20 border-gray-800 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Lightbulb
                    className="w-6 h-6 transition-all duration-300"
                    style={{
                      color: light.on ? light.color : '#666666',
                      filter: light.on ? `drop-shadow(0 0 8px ${light.color})` : 'none',
                    }}
                  />
                  <div>
                    <div className="text-sm font-mono text-white">{light.name}</div>
                    <div className="text-xs font-mono text-gray-400">
                      {light.on ? `${light.brightness}%` : 'OFF'}
                    </div>
                  </div>
                </div>
                {/* Indicador de color circular */}
                <div
                  className="w-8 h-8 rounded-full border-2 transition-all duration-300"
                  style={{
                    borderColor: light.on ? light.color : '#666666',
                    backgroundColor: light.on ? `${light.color}` : 'transparent',
                    boxShadow: light.on ? `0 0 10px ${light.color}` : 'none'
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Preset Scenes Buttons */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-gray-400 mb-2">ESCENAS PREDEFINIDAS</div>
            <div className="grid grid-cols-3 gap-2">
                {['Focus', 'Relax', 'Party'].map((scene) => (
                <motion.button
                    key={scene}
                    onClick={() => setScene(scene)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="py-2 bg-black/60 border border-[#00F3FF]/30 rounded font-mono text-[#00F3FF] text-xs hover:bg-[#00F3FF] hover:text-black transition-colors"
                >
                    {scene}
                </motion.button>
                ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}