import { motion } from 'motion/react';
import { useSystem } from '@/app/context/SystemContext';
import { Shield, Wifi, Signal } from 'lucide-react';

export function GeoSec() {
  const { state, toggleVPN } = useSystem();

  return (
    <div className="px-8 mt-8 space-y-8">
      {/* War Room Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-3"
      >
        <Shield className="w-8 h-8 text-[#00F3FF]" />
        <h2 className="text-2xl font-bold text-white tracking-wider">
          GEO-SEC <span className="text-[#00F3FF]">//</span> CENTRO DE COMANDO TÁCTICO
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: World Map Hologram */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative backdrop-blur-md bg-gradient-to-br from-white/5 to-transparent border border-[#00F3FF]/40 rounded-2xl p-8 h-[600px] overflow-hidden"
            style={{
              boxShadow: '0 8px 32px rgba(0, 243, 255, 0.2)',
            }}
          >
            {/* Dotted World Map */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Ccircle cx='100' cy='100' r='1' fill='%2300F3FF'/%3E%3Ccircle cx='120' cy='95' r='1' fill='%2300F3FF'/%3E%3Ccircle cx='140' cy='90' r='1' fill='%2300F3FF'/%3E%3Ccircle cx='160' cy='85' r='1' fill='%2300F3FF'/%3E%3Ccircle cx='180' cy='80' r='1' fill='%2300F3FF'/%3E%3Ccircle cx='200' cy='75' r='1' fill='%2300F3FF'/%3E%3Ccircle cx='220' cy='80' r='1' fill='%2300F3FF'/%3E%3Ccircle cx='240' cy='85' r='1' fill='%2300F3FF'/%3E%3Ccircle cx='260' cy='90' r='1' fill='%2300F3FF'/%3E%3Ccircle cx='280' cy='95' r='1' fill='%2300F3FF'/%3E%3Ccircle cx='300' cy='100' r='1' fill='%2300F3FF'/%3E%3C/svg%3E")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />

            {/* Connection Points */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Your Location (Mexico) */}
              <motion.circle
                cx="25"
                cy="60"
                r="2"
                fill="#00F3FF"
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  filter: 'drop-shadow(0 0 8px #00F3FF)',
                }}
              />

              {/* Server Location (Amsterdam) */}
              <motion.circle
                cx="55"
                cy="30"
                r="2"
                fill="#00FF41"
                initial={{ scale: 0 }}
                animate={{ scale: state.vpnActive ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  filter: 'drop-shadow(0 0 8px #00FF41)',
                }}
              />

              {/* Curved Connection Line */}
              {state.vpnActive && (
                <motion.path
                  d="M 25 60 Q 40 35, 55 30"
                  stroke="#00FF41"
                  strokeWidth="0.3"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5 }}
                  style={{
                    filter: 'drop-shadow(0 0 4px #00FF41)',
                  }}
                />
              )}
            </svg>

            {/* Location Labels */}
            <div className="absolute bottom-8 left-8 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#00F3FF]" style={{ boxShadow: '0 0 10px #00F3FF' }} />
                <span className="text-sm font-mono text-[#00F3FF]">TU UBICACIÓN: México, CDMX</span>
              </div>
              {state.vpnActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2"
                >
                  <div className="w-3 h-3 rounded-full bg-[#00FF41]" style={{ boxShadow: '0 0 10px #00FF41' }} />
                  <span className="text-sm font-mono text-[#00FF41]">SERVIDOR: Amsterdam, NL</span>
                </motion.div>
              )}
            </div>

            {/* Status Info */}
            <div className="absolute top-8 right-8 text-right space-y-1">
              <div className="text-xs font-mono text-gray-400">LATENCIA</div>
              <div className="text-2xl font-bold text-[#00FF41]" style={{ textShadow: '0 0 10px #00FF41' }}>
                {state.vpnActive ? '28ms' : '--'}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Controls */}
        <div className="space-y-6">
          {/* Master VPN Switch */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={toggleVPN}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-8 rounded-lg font-mono tracking-wider transition-all ${
              state.vpnActive
                ? 'bg-[#00FF41]/20 border-2 border-[#00FF41]'
                : 'bg-[#FF003C]/10 border-2 border-[#FF003C]/40'
            }`}
            style={{
              boxShadow: state.vpnActive
                ? '0 0 30px rgba(0, 255, 65, 0.4)'
                : '0 0 20px rgba(255, 0, 60, 0.2)',
            }}
          >
            <div className="text-xs text-gray-400 mb-2">PROTOCOLO VPN</div>
            <div
              className="text-2xl font-bold"
              style={{
                color: state.vpnActive ? '#00FF41' : '#FF003C',
                textShadow: state.vpnActive ? '0 0 10px #00FF41' : '0 0 10px #FF003C',
              }}
            >
              [ {state.vpnActive ? 'ENGAGED' : 'DISENGAGED'} ]
            </div>
          </motion.button>

          {/* Dual SIM Selector */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="text-xs font-mono text-[#00F3FF] tracking-wider">DUAL SIM CONTROL</div>

            {/* SIM 1 - Telcel */}
            <div className="backdrop-blur-md bg-white/5 border border-[#00FF41] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Signal className="w-4 h-4 text-[#00FF41]" />
                  <span className="text-sm font-mono text-white">TELCEL</span>
                </div>
                <span className="text-xs font-mono text-[#00FF41] font-bold">ACTIVE</span>
              </div>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 bg-[#00FF41]"
                    style={{ boxShadow: '0 0 5px #00FF41' }}
                  />
                ))}
              </div>
            </div>

            {/* SIM 2 - AT&T */}
            <div className="backdrop-blur-md bg-white/5 border border-gray-600 rounded-lg p-4 opacity-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-mono text-gray-400">AT&T</span>
                </div>
                <span className="text-xs font-mono text-gray-500">STANDBY</span>
              </div>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-1 flex-1 bg-gray-600" />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Security Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-md bg-white/5 border border-[#00F3FF]/30 rounded-lg p-4 space-y-3"
          >
            <div className="text-xs font-mono text-[#00F3FF] tracking-wider">SECURITY STATUS</div>
            {[
              { label: 'FIREWALL', status: 'ACTIVE', color: '#00FF41' },
              { label: 'DNS LEAK', status: 'PROTECTED', color: '#00FF41' },
              { label: 'KILL SWITCH', status: 'ARMED', color: '#00F3FF' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-xs font-mono text-gray-400">{item.label}</span>
                <span className="text-xs font-mono font-bold" style={{ color: item.color }}>
                  {item.status}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
