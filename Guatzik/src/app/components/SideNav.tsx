import { motion } from 'motion/react';
import { Home, Globe, Music, Settings } from 'lucide-react';
import { useSystem } from '@/app/context/SystemContext';

const NAV_ITEMS = [
  { icon: Home, label: 'Dashboard', mode: 'dashboard' as const },
  { icon: Globe, label: 'GeoSec', mode: 'geosec' as const },
  { icon: Music, label: 'MediaCore', mode: 'mediacore' as const },
  { icon: Settings, label: 'Hardware', mode: 'hardwarelink' as const },
];

export function SideNav() {
  const { state, setMode } = useSystem();

  return (
    <div
      className="fixed left-0 top-0 bottom-0 w-16 backdrop-blur-md bg-white/5 border-r border-[#00F3FF]/20 flex flex-col items-center justify-center space-y-8 z-50"
      style={{
        boxShadow: '4px 0 20px rgba(0, 243, 255, 0.1)',
      }}
    >
      {NAV_ITEMS.map((item, index) => {
        const isActive = state.mode === item.mode;
        const hasStatusIndicator = 
          (item.mode === 'geosec' && state.vpnActive) ||
          (item.mode === 'mediacore' && state.spotifyPlaying) ||
          (item.mode === 'hardwarelink' && state.printerInkLow);

        return (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ scale: 1.2, x: 4 }}
            onClick={() => setMode(item.mode)}
            className="relative group"
          >
            <div
              className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                isActive
                  ? 'border-[#00F3FF] bg-[#00F3FF]/20'
                  : 'border-[#00F3FF]/40 group-hover:border-[#00F3FF] group-hover:bg-[#00F3FF]/10'
              }`}
              style={{
                boxShadow: isActive ? '0 0 20px rgba(0, 243, 255, 0.6)' : '0 0 0 rgba(0, 243, 255, 0)',
                transition: 'box-shadow 0.3s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 243, 255, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.boxShadow = '0 0 0 rgba(0, 243, 255, 0)';
                }
              }}
            >
              <item.icon className="w-5 h-5 text-[#00F3FF]" strokeWidth={1.5} />

              {/* Status Indicators */}
              {hasStatusIndicator && (
                <>
                  {/* VPN Active - Green pulsing dot */}
                  {item.mode === 'geosec' && state.vpnActive && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00FF41]"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [1, 0.6, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                      style={{
                        boxShadow: '0 0 8px #00FF41',
                      }}
                    />
                  )}

                  {/* Spotify Playing - Equalizer animation */}
                  {item.mode === 'mediacore' && state.spotifyPlaying && (
                    <div className="absolute -top-1 -right-1 flex space-x-0.5">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-0.5 bg-[#00FF41] rounded-full"
                          animate={{
                            height: [4, 8, 4],
                          }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }}
                          style={{
                            boxShadow: '0 0 4px #00FF41',
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Printer Ink Low - Red warning */}
                  {item.mode === 'hardwarelink' && state.printerInkLow && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#FF003C]"
                      animate={{
                        opacity: [1, 0.3, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                      style={{
                        boxShadow: '0 0 8px #FF003C',
                      }}
                    />
                  )}
                </>
              )}
            </div>

            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-3 py-1 bg-black/90 border border-[#00F3FF] rounded text-xs text-[#00F3FF] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-mono">
              {item.label}
            </div>
          </motion.button>
        );
      })}

      {/* Vertical line indicator */}
      <motion.div
        className="absolute left-1/2 top-1/4 w-0.5 h-32 bg-gradient-to-b from-transparent via-[#00F3FF] to-transparent"
        animate={{
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}