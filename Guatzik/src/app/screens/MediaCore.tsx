import { motion } from 'motion/react';
import { useSystem } from '@/app/context/SystemContext';
import { Music, Play, Pause, SkipForward, SkipBack, Download, Loader, Video, Headphones, Trash2 } from 'lucide-react';
import { useState } from 'react';

export function MediaCore() {
  const { state, toggleSpotify, clearDownloads } = useSystem();
  const [downloadUrl, setDownloadUrl] = useState('');
  const [format, setFormat] = useState<'audio' | 'video'>('video');
  const [isDownloading, setIsDownloading] = useState(false);

  // 👇 Función que habla con tu backend de Python
  const handleDownload = async () => {
    if (!downloadUrl) return alert("¡Ingresa una URL válida!");
    
    setIsDownloading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/media/download?url=${encodeURIComponent(downloadUrl)}&tipo=${format}`);
      const data = await res.json();
      
      if (res.ok) {
        setDownloadUrl(''); // Limpiar el input
      } else {
        alert("Error al descargar: " + data.detail);
      }
    } catch (error) {
      console.error("Error conectando con el backend:", error);
      alert("No se pudo conectar con el servidor GUATZIK.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="px-8 mt-8 space-y-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-3"
      >
        <Music className="w-8 h-8 text-[#00FF41]" />
        <h2 className="text-2xl font-bold text-white tracking-wider">
          MEDIA-CORE <span className="text-[#00FF41]">//</span> ENTRETENIMIENTO CYBERPUNK
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Spotify DJ */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="backdrop-blur-md bg-gradient-to-br from-white/5 to-transparent border border-[#00FF41]/40 rounded-2xl p-8"
          style={{ boxShadow: '0 8px 32px rgba(0, 255, 65, 0.2)' }}
        >
          <div className="text-sm font-mono text-[#00FF41] mb-6 tracking-wider">DJ GUATZIK // SPOTIFY</div>

          {/* Album Art Circle */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {state.spotifyPlaying && (
                <motion.div
                  className="absolute -inset-4 rounded-full border-2 border-[#00FF41]"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ boxShadow: '0 0 20px #00FF41' }}
                />
              )}
              <div
                className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-4 border-[#00FF41]/60"
                style={{ boxShadow: '0 0 40px rgba(0, 255, 65, 0.3)' }}
              >
                <Music className="w-20 h-20 text-white" />
              </div>
            </div>
          </div>

          {/* Track Info */}
          <div className="text-center mb-6 space-y-2">
            <div className="text-xl font-bold text-white">Midnight Drive</div>
            <div className="text-sm text-gray-400 font-mono">Synthwave Collection Vol. 3</div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-1 bg-black/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#00FF41]"
                initial={{ width: '0%' }}
                animate={{ width: '45%' }}
                style={{ boxShadow: '0 0 10px #00FF41' }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-gray-400 mt-1">
              <span>1:47</span>
              <span>3:52</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full border border-[#00F3FF] flex items-center justify-center"
            >
              <SkipBack className="w-5 h-5 text-[#00F3FF]" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleSpotify}
              className="w-14 h-14 rounded-full bg-[#00FF41] flex items-center justify-center"
              style={{ boxShadow: '0 0 20px #00FF41' }}
            >
              {state.spotifyPlaying ? (
                <Pause className="w-6 h-6 text-black" fill="black" />
              ) : (
                <Play className="w-6 h-6 text-black ml-1" fill="black" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full border border-[#00F3FF] flex items-center justify-center"
            >
              <SkipForward className="w-5 h-5 text-[#00F3FF]" />
            </motion.button>
          </div>
        </motion.div>

        {/* Right: Sound Flex Ingest */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="backdrop-blur-md bg-gradient-to-br from-white/5 to-transparent border border-[#00F3FF]/40 rounded-2xl p-8"
          style={{ boxShadow: '0 8px 32px rgba(0, 243, 255, 0.2)' }}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm font-mono text-[#00F3FF] tracking-wider">
              SOUNDFLEXHUB // EXTRACTOR
            </div>
            
            {/* 👇 BOTÓN DE LIMPIAR AGREGADO AQUÍ ARRIBA 👇 */}
            {state.downloads.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearDownloads}
                className="flex items-center gap-2 text-xs font-mono text-red-400 hover:text-red-300 border border-red-500/30 bg-red-500/10 px-3 py-1 rounded"
              >
                <Trash2 className="w-3 h-3" /> CLEAR_QUEUE
              </motion.button>
            )}
          </div>

          {/* Selector de Formato Cyberpunk */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFormat('video')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded border font-mono text-sm transition-all duration-300 ${
                format === 'video' 
                  ? 'bg-[#00F3FF]/20 border-[#00F3FF] text-[#00F3FF] shadow-[0_0_15px_rgba(0,243,255,0.4)]' 
                  : 'bg-black/40 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              <Video className="w-4 h-4" /> [MP4] VIDEO
            </button>
            <button
              onClick={() => setFormat('audio')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded border font-mono text-sm transition-all duration-300 ${
                format === 'audio' 
                  ? 'bg-[#00FF41]/20 border-[#00FF41] text-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.4)]' 
                  : 'bg-black/40 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              <Headphones className="w-4 h-4" /> [MP3] AUDIO
            </button>
          </div>

          {/* URL Input Terminal Style */}
          <div className="mb-6">
            <div className="text-xs font-mono text-gray-400 mb-2">{'> INJECT_URL:'}</div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 bg-black/60 border border-[#00F3FF]/30 rounded px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#00F3FF]"
                style={{ boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)' }}
                disabled={isDownloading}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                disabled={isDownloading}
                className={`px-6 py-2 rounded font-mono text-sm border flex items-center justify-center min-w-[60px] ${
                  isDownloading 
                  ? 'bg-gray-800 border-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#00F3FF]/20 border-[#00F3FF] text-[#00F3FF]'
                }`}
              >
                {isDownloading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </motion.button>
            </div>
          </div>

          {/* Download Queue REAL */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-gray-400 mb-3">{'> DOWNLOAD_QUEUE:'}</div>

            {state.downloads.length === 0 ? (
              <div className="text-xs font-mono text-gray-600 text-center py-4 border border-dashed border-gray-800 rounded">
                [ SISTEMA EN ESPERA ]
              </div>
            ) : (
              state.downloads.map((download, index) => (
                <div
                  key={index}
                  className="backdrop-blur-sm bg-black/40 border border-[#00FF41]/30 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-mono text-white mb-1 truncate pr-4">
                        <span className="text-[#00FF41]">
                          {download.name.endsWith('.mp3') || download.name.endsWith('.m4a') ? '[AUDIO]' : '[VIDEO]'}
                        </span> {download.name}
                      </div>
                    </div>
                    {download.progress < 100 && (
                      <Loader className="w-4 h-4 text-[#00F3FF] animate-spin flex-shrink-0" />
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="h-2 bg-black/60 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#00FF41] transition-all"
                        initial={{ width: 0 }}
                        animate={{ width: `${download.progress}%` }}
                        style={{ boxShadow: '0 0 10px #00FF41' }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-xs font-mono text-gray-400">
                      [{Array(Math.floor(download.progress / 10)).fill('█').join('')}
                      {Array(10 - Math.floor(download.progress / 10)).fill('░').join('')}] {download.progress}%
                    </div>
                    <div
                      className="text-xs font-mono"
                      style={{ color: download.progress === 100 ? '#00FF41' : '#00F3FF' }}
                    >
                      {download.progress === 100 ? "COMPLETE" : download.speed}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Stats Reales */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xs font-mono text-gray-400">STATUS SESIÓN</div>
              <div className="text-lg font-bold text-[#00F3FF]" style={{ textShadow: '0 0 10px #00F3FF' }}>
                {state.downloads.filter(d => d.progress === 100).length} OK
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-mono text-gray-400">ARCHIVOS TOTALES</div>
              <div className="text-lg font-bold text-[#00FF41]" style={{ textShadow: '0 0 10px #00FF41' }}>
                {state.downloads.length}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}