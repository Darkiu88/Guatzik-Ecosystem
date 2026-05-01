import asyncio
import websockets
import json
import sys

async def conectar_al_sistema_nervioso(uri):
    print(f"🧠 Guatzik intentando conectar a los sensores en: {uri}...")
    
    try:
        # Guatzik se conecta a tu FastAPI como si fuera la interfaz web
        async with websockets.connect(uri) as websocket:
            print("[✅ EN LÍNEA] Guatzik ha establecido conexión con el Hardware.\n")
            
            while True:
                # 1. Escuchar el paquete de datos que manda main.py
                mensaje = await websocket.recv()
                
                # 2. Desempaquetar el JSON
                datos = json.loads(mensaje)
                
                # 3. Extraer lo que a Guatzik le importa
                cpu_temp = datos.get("cpu_temp", 0)
                cpu_load = datos.get("cpu_load", 0)
                ram_percent = datos.get("ram_percent", 0)
                
                # 👇 AQUÍ EMPIEZA LA "INTELIGENCIA" DE GUATZIK 👇
                # En lugar de solo imprimir, Guatzik evalúa los datos
                
                estado = f"📡 Temp: {cpu_temp}°C | CPU: {cpu_load}% | RAM: {ram_percent}%"
                
                if cpu_temp > 85:
                    print(f"🔥 [ALERTA CRÍTICA] Guatzik: ¡El servidor se está quemando! {cpu_temp}°C")
                    # Futuro: Aquí Guatzik podría ejecutar un comando para matar procesos pesados
                elif ram_percent > 95:
                    print(f"⚠️ [ADVERTENCIA] Guatzik: Memoria RAM casi al límite ({ram_percent}%).")
                else:
                    # Imprime el estado en la misma línea para no llenar la consola de spam
                    sys.stdout.write(f"\r{estado}")
                    sys.stdout.flush()
                    
    except ConnectionRefusedError:
        print("\n[❌ ERROR] Guatzik no pudo conectar. ¿Tu servidor FastAPI (main.py) está encendido?")
    except websockets.exceptions.ConnectionClosed:
        print("\n[⚠️ DESCONEXIÓN] Se perdió la señal del servidor principal.")
if __name__ == "__main__":
    # Apuntamos a la IP del Celeron a través de la red privada Ethernet
    DIRECCION_WS = "ws://10.0.0.1:8000/ws/system"
    
    # Ejecutar el bucle asíncrono
    asyncio.run(conectar_al_sistema_nervioso(DIRECCION_WS))