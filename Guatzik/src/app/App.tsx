import { motion } from 'motion/react';
import { SystemProvider, useSystem } from '@/app/context/SystemContext';
import { MatrixConsole } from '@/app/components/MatrixConsole';
import { SideNav } from '@/app/components/SideNav';
import { Dashboard } from '@/app/screens/Dashboard';
import { GeoSec } from '@/app/screens/GeoSec';
import { MediaCore } from '@/app/screens/MediaCore';
import { HardwareLink } from '@/app/screens/HardwareLink';

function AppContent() {
  const { state } = useSystem();

  const renderScreen = () => {
    switch (state.mode) {
      case 'dashboard':
        return <Dashboard />;
      case 'geosec':
        return <GeoSec />;
      case 'mediacore':
        return <MediaCore />;
      case 'hardwarelink':
        return <HardwareLink />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] overflow-hidden">
      {/* Hexagonal grid background */}
      <div
        className="fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23808080' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Scanlines overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #808080 2px, #808080 4px)',
        }}
      />

      {/* Film grain */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Side Navigation */}
      <SideNav />

      {/* Main Content */}
      <div className="pl-16 pb-24">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-8 py-6 flex items-center space-x-4"
        >
          {/* Logo with rotating ring */}
          <div className="relative w-12 h-12">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[#00F3FF]"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              style={{
                boxShadow: '0 0 15px #00F3FF',
              }}
            />
            <div
              className="absolute inset-2 flex items-center justify-center text-2xl font-bold text-[#00F3FF]"
              style={{
                textShadow: '0 0 10px #00F3FF',
              }}
            >
              G
            </div>
          </div>

          {/* Title */}
          <div>
            <h1
              className="text-xl font-bold tracking-wider text-white"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.1em',
                textShadow: '0 0 10px rgba(0, 243, 255, 0.5)',
              }}
            >
              GUATZIK <span className="text-[#00F3FF]">//</span> OS v3.0
            </h1>
            <div className="text-xs text-[#00FF41] font-mono tracking-widest">OPERATIONAL</div>
          </div>

          {/* Timestamp */}
          <div className="ml-auto text-xs font-mono text-gray-400">
            <div>TIMESTAMP: {new Date().toLocaleTimeString('es-ES')}</div>
            <div className="text-[#00F3FF]">STATUS: ONLINE</div>
          </div>
        </motion.header>

        {/* Dynamic Screen Content */}
        <motion.div
          key={state.mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          {renderScreen()}
        </motion.div>
      </div>

      {/* Console Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <MatrixConsole />
      </div>

      {/* Vignette Effect (darkens corners) */}
      <div
        className="fixed inset-0 pointer-events-none z-50"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.4) 100%)',
        }}
      />

      {/* Chromatic aberration effect on edges */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 100px rgba(255, 0, 60, 0.08), inset 0 0 100px rgba(0, 243, 255, 0.08)',
        }}
      />

      {/* Enhanced scanlines (stronger) */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.06] z-40"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #808080 2px, #808080 4px)',
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <SystemProvider>
      <AppContent />
    </SystemProvider>
  );
}