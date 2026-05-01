import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';

export type SystemMode = 'dashboard' | 'geosec' | 'mediacore' | 'hardwarelink';

interface ProcessData {
  name: string;
  cpu: number;
}

interface DownloadData {
  name: string;
  progress: number;
  speed: string;
}

// 1. Ampliamos la interfaz para incluir la "Identidad" del nodo
export interface RemoteNodeMetrics {
  ip: string;
  hostname: string;
  customName: string; // Nombre amigable (Ej. "Data Core")
  role: string;       // Rol en la red
  specs: string;      // Hardware
  icon: string;       // Icono a usar en la UI
  online: boolean;
  cpuLoad: number;
  cpuTemp: number;
  ramUsed: number;
  ramTotal: number;
  ramPercent: number;
  topProcesses: ProcessData[];
  lastSeen: number;
}

interface SystemState {
  mode: SystemMode;
  vpnActive: boolean;
  spotifyPlaying: boolean;
  cpuLoad: number;
  cpuTemp: number;
  topProcesses: ProcessData[];
  downloads: DownloadData[];
  ramPercent: number;
  ramUsed: number;
  ramTotal: number;
  diskPercent: number;
  netSpeed: number;
  netUp: number;
  netDown: number;
  printerInkLow: boolean;
  remoteNodes: Record<string, RemoteNodeMetrics>;
}

interface SystemContextType {
  state: SystemState;
  setMode: (mode: SystemMode) => void;
  toggleVPN: () => void;
  toggleSpotify: () => void;
  clearDownloads: () => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

// ─── Identidad de la Red (Basado en tus neofetch) ─────────────────────────────
const NODOS_CONFIG: Record<string, { nombre: string; rol: string; specs: string; icono: string }> = {
  '10.0.0.1': { 
    nombre: 'Data Core', 
    rol: 'NAS / Storage', 
    specs: 'Intel Pentium • 2GB RAM', 
    icono: 'hard-drive' 
  },
  '10.0.0.2': { 
    nombre: 'Terminal All-in-One', 
    rol: 'Monitor Secundario', 
    specs: 'AMD A6 • 4GB RAM', 
    icono: 'monitor' 
  }
};

const REMOTE_NODES_IPS: string[] = ['10.0.0.1', '10.0.0.2'];
const REMOTE_WS_PORT = 8001;
const OFFLINE_TIMEOUT_MS = 6000;

// 2. Inyectamos la identidad al crear el estado inicial (Offline)
function makeOfflineNode(ip: string): RemoteNodeMetrics {
  const config = NODOS_CONFIG[ip] || { 
    nombre: 'Nodo Desconocido', rol: 'Generic', specs: 'Unknown', icono: 'server' 
  };

  return {
    ip,
    hostname: ip,
    customName: config.nombre,
    role: config.rol,
    specs: config.specs,
    icon: config.icono,
    online: false,
    cpuLoad: 0,
    cpuTemp: 0,
    ramUsed: 0,
    ramTotal: 0,
    ramPercent: 0,
    topProcesses: [],
    lastSeen: 0,
  };
}

export function SystemProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SystemState>({
    mode: 'dashboard',
    vpnActive: false,
    spotifyPlaying: true,
    cpuLoad: 0,
    cpuTemp: 0,
    topProcesses: [],
    downloads: [],
    ramPercent: 0,
    ramUsed: 0,
    ramTotal: 0,
    diskPercent: 0,
    netSpeed: 0,
    netUp: 0,
    netDown: 0,
    printerInkLow: false,
    remoteNodes: Object.fromEntries(
      REMOTE_NODES_IPS.map((ip) => [ip, makeOfflineNode(ip)])
    ),
  });

  const remoteWsRefs = useRef<Record<string, WebSocket>>({});

  // ── WebSocket principal (El cerebro en 10.0.0.3) ───────────────────────────
  useEffect(() => {
    // Apunta al backend principal (donde corre Guatzik)
    const ipActual = window.location.hostname;
    const wsUrl = `ws://${ipActual}:8000/ws/system`;
    console.log(`[GUATZIK] Conectando a Cerebro Central: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setState((prev) => ({
          ...prev,
          cpuLoad: data.cpu_load ?? 0,
          cpuTemp: data.cpu_temp ?? 0,
          topProcesses: data.top_processes ?? [],
          downloads: data.downloads ?? [],
          ramPercent: data.ram_percent ?? 0,
          ramUsed: data.ram_used_gb ?? 0,
          ramTotal: data.ram_total_gb ?? 0,
          diskPercent: data.disk_percent ?? 0,
          netUp: data.net_up_mb ?? 0,
          netDown: data.net_down_mb ?? 0,
          netSpeed: (data.net_up_mb ?? 0) + (data.net_down_mb ?? 0),
        }));
      } catch (e) {
        console.error('[GUATZIK] Error al procesar datos del servidor central', e);
      }
    };

    ws.onopen = () => console.log('[GUATZIK] ✅ Cerebro Central Online');
    ws.onerror = (e) => console.error('[GUATZIK] ❌ Error de conexión central:', e);

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  // ── WebSockets remotos (La All-in-One y el NAS) ───────────────────────────
  useEffect(() => {
    function connectNode(ip: string) {
      const existing = remoteWsRefs.current[ip];
      if (existing?.readyState === WebSocket.OPEN) return;

      const url = `ws://${ip}:${REMOTE_WS_PORT}`;
      console.log(`[GUATZIK] Conectando nodo remoto: ${url}`);
      const ws = new WebSocket(url);
      remoteWsRefs.current[ip] = ws;

      const config = NODOS_CONFIG[ip] || { nombre: 'Desconocido', rol: 'Generic', specs: '?', icono: 'server' };

      ws.onopen = () => console.log(`[GUATZIK] ✅ Nodo ${config.nombre} (${ip}) online`);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setState((prev) => ({
            ...prev,
            remoteNodes: {
              ...prev.remoteNodes,
              [ip]: {
                ip,
                hostname: data.hostname ?? ip,
                customName: config.nombre, // Mantenemos la identidad
                role: config.rol,
                specs: config.specs,
                icon: config.icono,
                online: true,
                cpuLoad: data.cpu_load ?? 0,
                cpuTemp: data.cpu_temp ?? 0,
                ramUsed: data.ram_used_gb ?? 0,
                ramTotal: data.ram_total_gb ?? 0,
                ramPercent: data.ram_percent ?? 0,
                topProcesses: data.top_processes ?? [],
                lastSeen: Date.now(),
              },
            },
          }));
        } catch (e) {
          console.error(`[GUATZIK] Error nodo ${ip}:`, e);
        }
      };

      ws.onerror = () => {
        setState((prev) => ({
          ...prev,
          remoteNodes: {
            ...prev.remoteNodes,
            [ip]: { ...prev.remoteNodes[ip], online: false },
          },
        }));
      };

      ws.onclose = () => {
        console.log(`[GUATZIK] Nodo ${config.nombre} (${ip}) cayó. Reintentando en 5s...`);
        setTimeout(() => connectNode(ip), 5000);
      };
    }

    REMOTE_NODES_IPS.forEach((ip) => connectNode(ip));

    const watchdog = setInterval(() => {
      const now = Date.now();
      setState((prev) => {
        let changed = false;
        const updated = { ...prev.remoteNodes };
        for (const ip of REMOTE_NODES_IPS) {
          const node = updated[ip];
          if (node?.online && now - node.lastSeen > OFFLINE_TIMEOUT_MS) {
            updated[ip] = { ...node, online: false };
            changed = true;
          }
        }
        return changed ? { ...prev, remoteNodes: updated } : prev;
      });
    }, 2000);

    return () => {
      clearInterval(watchdog);
      Object.values(remoteWsRefs.current).forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.close();
      });
      remoteWsRefs.current = {};
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ... (Tus acciones setMode, toggleVPN, etc. siguen igual)
  const setMode = (mode: SystemMode) => setState((prev) => ({ ...prev, mode }));
  const toggleVPN = () => setState((prev) => ({ ...prev, vpnActive: !prev.vpnActive }));
  const toggleSpotify = () => setState((prev) => ({ ...prev, spotifyPlaying: !prev.spotifyPlaying }));
  const clearDownloads = () => setState((prev) => ({ ...prev, downloads: [] }));

  return (
    <SystemContext.Provider value={{ state, setMode, toggleVPN, toggleSpotify, clearDownloads }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem must be used within SystemProvider');
  return context;
}