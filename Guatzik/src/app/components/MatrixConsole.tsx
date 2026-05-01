import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useRef } from 'react';
import { Mic, Send, ChevronUp, ChevronDown, MicOff } from 'lucide-react';
import { useSystem } from '@/app/context/SystemContext';

// (Mantenemos sus interfaces y LOG_BOOT igual)
interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS' | 'GUATZIK' | 'USER';
  message: string;
}

const LOG_BOOT: LogEntry[] = [
  { timestamp: '', level: 'SUCCESS', message: 'SYSTEM_CHECK: OK' },
  { timestamp: '', level: 'INFO',    message: 'DAEMON: Conectado' },
  { timestamp: '', level: 'INFO',    message: 'KERNEL: Módulos cargados' },
  { timestamp: '', level: 'SUCCESS', message: 'NETWORK: Interface eth0 UP' },
  { timestamp: '', level: 'SUCCESS', message: 'GUATZIK: En línea, Señor Xandzik.' },
];

export function MatrixConsole() {
  const { state } = useSystem();
  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [input, setInput]         = useState('');
  const [expanded, setExpanded]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [isListening, setIsListening] = useState(false); // Estado para el Micrófono
  const logsEndRef                = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  const ts = () => new Date().toLocaleTimeString('es-MX', { hour12: false });

  // --- Secuencia de inicio ---
  useEffect(() => {
    LOG_BOOT.forEach((entry, i) => {
      setTimeout(() => {
        setLogs(prev => [...prev, { ...entry, timestamp: ts() }]);
      }, i * 600);
    });
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ============================================================
  //  NUEVO: MOTOR DE VOZ (SÍNTESIS)
  // ============================================================
  const hablar = (texto: string) => {
    // Evitamos leer los comandos técnicos en voz alta
    if (texto.includes('CMD: ') || texto.includes('OUT: ')) return;
    
    // Limpiamos un poco el texto de caracteres raros antes de leerlo
    const textoLimpio = texto.replace(/[^\w\s,.!?¿¡áéíóúÁÉÍÓÚñÑ]/g, '');
    
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(textoLimpio);
    utterance.lang = 'es-MX'; // Acento mexicano
    utterance.rate = 1.0; // Velocidad normal
    utterance.pitch = 0.9; // Tono ligeramente más grave
    
    synth.speak(utterance);
  };

  // ============================================================
  //  NUEVO: MOTOR DE ESCUCHA (RECONOCIMIENTO)
  // ============================================================
  const iniciarEscucha = () => {
    // Verificamos si el navegador soporta reconocimiento de voz
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Su navegador no soporta reconocimiento de voz nativo, Señor.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-MX';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      // Detenemos cualquier audio que Guatzik esté hablando para que nos escuche bien
      window.speechSynthesis.cancel(); 
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript); // Ponemos lo escuchado en el input
      enviarMensaje(transcript); // Lo enviamos automáticamente
    };

    recognition.onerror = (event: any) => {
      console.error("Error de micrófono:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // --- Enviar mensaje a Guatzik ---
  const enviarMensaje = async (texto: string) => {
    if (!texto.trim() || loading) return;

    const ipActual = window.location.hostname;

    setLogs(prev => [...prev, { timestamp: ts(), level: 'USER', message: texto.trim() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`http://${ipActual}:8000/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: texto.trim() }),
      });

      if (!res.ok) throw new Error('Error del servidor');

      const data = await res.json();

      setLogs(prev => [...prev, { timestamp: ts(), level: 'GUATZIK', message: data.respuesta }]);
      
      // ¡Hacemos que Guatzik hable la respuesta!
      hablar(data.respuesta);

      if (data.ejecucion) {
        setLogs(prev => [...prev, 
          { timestamp: ts(), level: 'INFO', message: `CMD: ${data.ejecucion.comando}` }, 
          { timestamp: ts(), level: 'SUCCESS', message: `OUT: ${data.ejecucion.resultado.substring(0, 120)}${data.ejecucion.resultado.length > 120 ? '...' : ''}` }
        ]);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, { timestamp: ts(), level: 'ERROR', message: `Falla de núcleo: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') enviarMensaje(input);
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'ERROR':   return '#FF003C';
      case 'WARN':    return '#FFA500';
      case 'SUCCESS': return '#00FF41';
      case 'GUATZIK': return '#00F3FF';
      case 'USER':    return '#FF9F1C';
      case 'INFO':
      default:        return '#7A9AAA';
    }
  };

  const getConsoleColor = () => {
    if (state.mode === 'hardwarelink' && state.printerInkLow) return '#FFA500';
    return '#00FF41';
  };

  const getContextualMessage = () => {
    if (loading) return 'Procesando... un momento, Señor Xandzik.';
    if (isListening) return 'Escuchando...';
    return 'En espera de órdenes, Señor.';
  };

  return (
    <div className="relative">
      {/* (El código del panel expandido y la barra inferior sigue igual al suyo) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="chat-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 260, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="h-[260px] bg-black/92 border-t border-[#00F3FF]/20 flex flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-thin">
                {logs.map((log, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2 text-xs font-mono">
                    <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                    <span className="font-bold shrink-0" style={{ color: getLevelColor(log.level) }}>
                      {log.level === 'GUATZIK' ? '[GUATZIK]' : log.level === 'USER' ? '[XNZ]' : `[${log.level}]`}
                    </span>
                    <span style={{ color: log.level === 'USER' ? '#FFD580' : '#D0D0D0' }}>{log.message}</span>
                  </motion.div>
                ))}
                <div ref={logsEndRef} />
              </div>

              <div className="px-4 py-2 border-t border-[#00F3FF]/10 flex items-center gap-2">
                <span className="text-[#00FF41] font-mono text-sm shrink-0">[XNZ]{'>'}</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading || isListening}
                  placeholder={isListening ? "Hablando..." : "Escribe una orden..."}
                  className="flex-1 bg-transparent text-sm font-mono text-white focus:outline-none disabled:opacity-40"
                  autoFocus={expanded}
                />
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => enviarMensaje(input)} disabled={loading || !input.trim()} className="text-[#00F3FF]">
                  <Send size={14} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative backdrop-blur-md bg-black/90 px-6 py-3 transition-all" style={{ borderTopWidth: '2px', borderTopStyle: 'solid', borderTopColor: getConsoleColor() }}>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm shrink-0" style={{ color: getConsoleColor() }}>{'>'}_</span>
          <div className="flex-1 text-sm font-mono text-gray-300">
            <span className="text-[#00F3FF]">[GUATZIK]</span> <span className={loading || isListening ? 'animate-pulse' : ''}>{getContextualMessage()}</span>
          </div>
          <motion.button onClick={() => setExpanded(v => !v)} className="text-[#00F3FF]/60">
            {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </motion.button>
        </div>
      </div>

      {/* ============================================================
          FAB MICRÓFONO (AHORA FUNCIONAL)
      ============================================================ */}
      <motion.button
        onClick={iniciarEscucha}
        disabled={isListening || loading}
        className="absolute -top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: isListening ? '#FF003C' : `linear-gradient(to bottom right, ${getConsoleColor()}, ${getConsoleColor()}B0)`,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isListening ? <MicOff className="w-5 h-5 text-white animate-pulse" /> : <Mic className="w-5 h-5 text-black" />}
        
        {/* Anillos de animación cuando está escuchando */}
        {isListening && [...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-[#FF003C]"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </motion.button>
    </div>
  );
}