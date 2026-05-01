# pip install psutil websockets
import asyncio, json, psutil, socket
import websockets

async def handler(websocket):
    print(f"[NODE] Cliente conectado: {websocket.remote_address}")
    try:
        while True:
            ram = psutil.virtual_memory()

            # Temperatura — funciona en Linux con lm-sensors
            temp = 0.0
            try:
                temps = psutil.sensors_temperatures()
                sources = ['coretemp', 'k10temp', 'cpu_thermal']
                for src in sources:
                    entries = temps.get(src, [])
                    if entries:
                        temp = entries[0].current
                        break
            except Exception:
                pass

            # Top 3 procesos por CPU
            procs = []
            for p in psutil.process_iter(['name', 'cpu_percent']):
                try:
                    procs.append({'name': p.info['name'], 'cpu': p.info['cpu_percent']})
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            procs = sorted(procs, key=lambda x: x['cpu'], reverse=True)[:3]

            payload = {
                "hostname": socket.gethostname(),
                "cpu_load": psutil.cpu_percent(interval=0.5),
                "cpu_temp": round(temp, 1),
                "ram_used_gb": round(ram.used / 1e9, 1),
                "ram_total_gb": round(ram.total / 1e9, 1),
                "ram_percent": round(ram.percent, 1),
                "top_processes": procs,
            }

            await websocket.send(json.dumps(payload))
            await asyncio.sleep(2)

    except websockets.exceptions.ConnectionClosed:
        print(f"[NODE] Cliente desconectado")

async def main():
    host = "10.0.0.0"
    port = 8001
    print(f"[NODE] Servidor en ws://{host}:{port}")
    async with websockets.serve(handler, host, port):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())