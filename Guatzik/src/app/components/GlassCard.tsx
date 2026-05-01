import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface GlassCardProps {
  title: string;
  value: string;
  subtitle?: string;
  progress?: number;
  children?: ReactNode;
  delay?: number;
}

export function GlassCard({ title, value, subtitle, progress, children, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay }}
      className="relative backdrop-blur-md bg-white/5 border border-[#00F3FF]/40 rounded-lg p-6 overflow-hidden"
      style={{
        clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)',
        boxShadow: '0 8px 32px rgba(0, 243, 255, 0.15), inset 0 0 40px rgba(0, 243, 255, 0.05)',
      }}
    >
      {/* Tactical corner cut indicator */}
      <div
        className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00F3FF]"
        style={{
          clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
          boxShadow: '0 0 10px #00F3FF',
        }}
      />

      {/* Inner glow edge */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10">
        <div className="text-xs font-mono text-[#00F3FF] tracking-widest mb-2">{title}</div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        {subtitle && <div className="text-xs text-gray-400 font-mono">{subtitle}</div>}

        {progress !== undefined && (
          <div className="mt-4">
            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-[#00FF41]/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, delay: delay + 0.3 }}
                className="h-full bg-gradient-to-r from-[#00FF41] to-[#00FF41]/70 relative"
                style={{
                  boxShadow: '0 0 10px #00FF41, 0 0 20px #00FF41',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </motion.div>
            </div>
            <div className="text-right text-xs text-[#00FF41] mt-1 font-mono">{progress}%</div>
          </div>
        )}

        {children}
      </div>

      {/* Hexagonal background pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0L15 5L15 15L10 20L5 15L5 5Z' stroke='%2300F3FF' fill='none' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px',
        }}
      />
    </motion.div>
  );
}
