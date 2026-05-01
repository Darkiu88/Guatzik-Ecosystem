import psutil
import time
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import os

# Intentar importar módulos adicionales si existen
try:
    from routers import media, hardware
except ImportError:
    media, hardware = None, None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if media: app.include_router(media.router, prefix="/api/media", tags=["Media"])
if hardware: app.include_router(hardware.router, prefix="/api/hardware", tags=["Hardware"])

# --- CÁLCULO DE RED ---
last_net_io = psutil.net_io_counters()
last_time = time.time()

def get_network_speed():
    global last_net_io, last_time
    current_net_io = psutil.net_io_counters()
    current_time = time.time()
    time_delta = current_time - last_time
    if time_delta <= 0: return 0, 0
    
    up = ((current_net_io.bytes_sent - last_net_io.bytes_sent) / time_delta / (1024 * 1024)) * 8
    down = ((current_net_io.bytes_recv - last_net_io.bytes_recv) / time_delta / (1024 * 1024)) * 8  
    
    last_net_io = current_net_io
    last_time = current_time
    return up, down

@app.websocket("/ws/system")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[GUATZIK] Cliente conectado. Detectando Hardware...")
    
    # 👇 ESTO FALTABA: Contar los núcleos de tu procesador
    cpu_count = psutil.cpu_count() or 1
    
    try:
        while True:
            cpu_percent = psutil.cpu_percent(interval=None)
            ram = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # 🔥 LÓGICA UNIVERSAL DE TEMPERATURA (INTEL / AMD / GENÉRICO)
            cpu_temp = 0
            try:
                temps = psutil.sensors_temperatures()
                if 'coretemp' in temps:
                    cpu_temp = temps['coretemp'][0].current
                elif 'k10temp' in temps:
                    cpu_temp = temps['k10temp'][0].current
                elif 'acpitz' in temps:
                    cpu_temp = temps['acpitz'][0].current
                elif temps:
                    first_key = list(temps.keys())[0]
                    cpu_temp = temps[first_key][0].current
                
                cpu_temp = round(cpu_temp)
            except:
                cpu_temp = 0

            # 👇 DETECTAR LOS 4 PROCESOS MÁS ALTOS
            top_procs = []
            try:
                processes = psutil.process_iter(['name', 'cpu_percent'])
                top_4 = sorted(processes, key=lambda p: p.info['cpu_percent'], reverse=True)[:4]
                
                for p in top_4:
                    proc_cpu_scaled = round(p.info['cpu_percent'] / cpu_count, 1)
                    if proc_cpu_scaled > 0.1:
                        top_procs.append({
                            "name": p.info['name'].upper(),
                            "cpu": proc_cpu_scaled
                        })
            except:
                pass 

            up_speed, down_speed = get_network_speed()
            
            # 👇 AHORA SÍ, LO AGREGAMOS AL PAYLOAD PARA REACT
            payload = {
                "cpu_load": cpu_percent,
                "cpu_temp": cpu_temp,
                "top_processes": top_procs,  # <--- ¡AQUÍ ESTÁ!
                "downloads": list(media.active_downloads.values()) if media else [], # ✅ NUEVA LÍNEA PARA DESCARGAS
                "ram_percent": ram.percent,
                "ram_used_gb": round(ram.used / (1024**3), 2),
                "ram_total_gb": round(ram.total / (1024**3), 1),
                "disk_percent": disk.percent,
                "net_up_mb": round(up_speed, 2),
                "net_down_mb": round(down_speed, 2),
                "timestamp": time.strftime("%H:%M:%S")
            }
            
            # Log para tu terminal
            # print(f"📡 [{payload['timestamp']}] CPU: {cpu_percent}% | Temp: {cpu_temp}°C | RAM: {ram.percent}%")
            
            await websocket.send_json(payload)
            await asyncio.sleep(0.5)
            
    except WebSocketDisconnect:
        print("[GUATZIK] Cliente desconectado.")