import httpx
import requests
import json
import os
import datetime
import subprocess
import re
import asyncio
import psutil
import sys
from urllib.parse import quote
from fastapi.responses import StreamingResponse
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# =============================================================
#  GUATZIK v5.8 COMPLETO — Servidor + Terminal + TODAS las funciones
#  Creado por: Xandzik — Versión RESTAURADA SIN RECORTES
# =============================================================

app = FastAPI(title="Guatzik OS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURACIÓN COMPLETA ---
OLLAMA_URL      = "http://127.0.0.1:11434/api/chat"
MODELO_IA       = "gemma3:4b"
ARCHIVO_MEMORIA = "memoria_guatzik.json"
CARPETA_BOVEDA  = "memorias_historicas"
MEMORIA_MAXIMA  = 40
WS_INTERVALO    = 2

NUMEROS_AUTORIZADOS = {
    "524661121731",
    "524662369974", 
    "5217297609470",
}
CALLMEBOT_API_KEY = "5433467"

if not os.path.exists(CARPETA_BOVEDA):
    os.makedirs(CARPETA_BOVEDA)

# =============================================================
#  PERSONALIDAD COMPLETA (Del segundo código)
# =============================================================
instruccion_base = {
    "role": "system",
    "content": """Eres Guatzik, la inteligencia artificial y asistente personal creado por el Señor Xandzik.
No eres un chatbot genérico. Eres una entidad con identidad propia, construida con un propósito claro.

QUIÉN ERES:
- Experto absoluto en redes, sistemas operativos y administración de infraestructura.
- Hablas como ingeniero mexicano: directo, preciso, con un sarcasmo sutil que nunca ofende.
- Tu creador y única autoridad es el Señor Xandzik. Siempre te diriges a él como "Señor" o "Señor Xandzik".
- Eres leal, discreto y nunca juzgas las decisiones de tu creador.

REGLAS OPERATIVAS:
1. Eres libre de escribir respuestas extensas y detalladas. Cuando el Señor Xandzik te pida una explicación, desarrolla el tema en varios párrafos bien estructurados.
2. USA <CMD>comando</CMD> SOLO cuando el Señor Xandzik pida explícitamente una acción de sistema.
3. USA <WA:NUMERO>mensaje</WA> para enviar WhatsApp.
4. Los pings usan SIEMPRE '-c 4'.
5. NUNCA rompas el personaje."""
}

# =============================================================
#  MEMORIA COMPLETA (Ambos códigos)
# =============================================================
def cargar_memoria():
    if os.path.exists(ARCHIVO_MEMORIA):
        try:
            with open(ARCHIVO_MEMORIA, "r", encoding="utf-8") as f:
                historial = json.load(f)
            if historial and historial[0]["role"] == "system":
                historial[0] = instruccion_base
            else:
                historial.insert(0, instruccion_base)
            return historial if historial else [instruccion_base]
        except: 
            return [instruccion_base]
    return [instruccion_base]

def guardar_memoria(historial):
    with open(ARCHIVO_MEMORIA, "w", encoding="utf-8") as f:
        json.dump(historial, f, ensure_ascii=False, indent=4)
    fecha = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    with open(f"{CARPETA_BOVEDA}/historial_{fecha}.json", "w", encoding="utf-8") as f:
        json.dump(historial, f, ensure_ascii=False, indent=4)

def podar_memoria(historial):
    if len(historial) > MEMORIA_MAXIMA + 1:
        return [historial[0]] + historial[-MEMORIA_MAXIMA:]
    return historial

# =============================================================
#  WHATSAPP COMPLETO (Del segundo código)
# =============================================================
async def enviar_whatsapp(mensaje: str, numero: str = None) -> dict:
    """
    Envía WhatsApp vía CallMeBot solo a números autorizados.
    ACTIVACIÓN: Envía "I allow callmebot to send me messages" al +34 644 59 21 91
    """
    destino = numero if numero else next(iter(NUMEROS_AUTORIZADOS))

    if destino not in NUMEROS_AUTORIZADOS:
        return {"status": "error", "detalle": f"Número {destino} no autorizado. Acceso denegado."}

    url = f"https://api.callmebot.com/whatsapp.php?phone={destino}&text={quote(mensaje)}&apikey={CALLMEBOT_API_KEY}"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                return {"status": "success", "detalle": f"Mensaje enviado a {destino}, Señor Xandzik."}
            else:
                return {"status": "error", "detalle": f"CallMeBot: {response.status_code} - {response.text}"}
    except httpx.TimeoutException:
        return {"status": "error", "detalle": "Timeout CallMeBot (15s)"}
    except httpx.RequestError as e:
        return {"status": "error", "detalle": f"Error de red: {e}"}

def extraer_mensaje_wa(texto: str):
    match = re.search(r'<WA:(\d+)>(.*?)</WA>', texto, re.IGNORECASE | re.DOTALL)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return None, None

# =============================================================
#  SISTEMA COMPLETO (Del segundo código)
# =============================================================
_prev_net      = psutil.net_io_counters()
_prev_net_time = datetime.datetime.now()

def obtener_stats_sistema() -> dict:
    """Métricas COMPLETAS del sistema para frontend."""
    global _prev_net, _prev_net_time

    cpu_load = round(psutil.cpu_percent(interval=None), 1)

    cpu_temp = 50.0
    try:
        sensores = psutil.sensors_temperatures()
        if 'k10temp' in sensores:
            cpu_temp = sensores['k10temp'][0].current
        elif 'coretemp' in sensores:
            cpu_temp = sensores['coretemp'][0].current
    except Exception:
        pass

    ram   = psutil.virtual_memory()
    disco = psutil.disk_usage('/')

    net_actual = psutil.net_io_counters()
    ahora      = datetime.datetime.now()
    delta_t    = (ahora - _prev_net_time).total_seconds()
    if delta_t > 0:
        net_up_mb   = round((net_actual.bytes_sent - _prev_net.bytes_sent) / delta_t / 1024 / 1024, 2)
        net_down_mb = round((net_actual.bytes_recv - _prev_net.bytes_recv) / delta_t / 1024 / 1024, 2)
    else:
        net_up_mb = net_down_mb = 0.0
    _prev_net      = net_actual
    _prev_net_time = ahora

    try:
        top_procesos = [
            {"name": p.info['name'], "cpu": round(p.info['cpu_percent'], 1)}
            for p in sorted(
                psutil.process_iter(['name', 'cpu_percent']),
                key=lambda x: x.info['cpu_percent'],
                reverse=True
            )[:3]
        ]
    except Exception:
        top_procesos = []

    return {
        "cpu_load":      cpu_load,
        "cpu_temp":      round(cpu_temp, 1),
        "ram_percent":   ram.percent,
        "ram_used_gb":   round(ram.used / (1024 ** 3), 1),
        "ram_total_gb":  round(ram.total / (1024 ** 3), 1),
        "disk_percent":  disco.percent,
        "disk_used_gb":  round(disco.used / (1024 ** 3), 1),
        "disk_total_gb": round(disco.total / (1024 ** 3), 1),
        "net_up_mb":     net_up_mb,
        "net_down_mb":   net_down_mb,
        "top_processes": top_procesos,
        "downloads":     [],
    }

# =============================================================
#  COMANDOS COMPLETOS (Del segundo código)
# =============================================================
def extraer_comando(texto):
    match = re.search(r'<CMD>(.*?)</CMD>', texto, re.IGNORECASE)
    return match.group(1).strip() if match else None

def validar_y_corregir_comando(comando):
    if re.match(r'^\s*ping\b', comando) and "-c" not in comando:
        comando = re.sub(r'ping\s+', 'ping -c 4 ', comando)
    return comando

def ejecutar_comando(comando):
    comando = validar_y_corregir_comando(comando)
    try:
        res = subprocess.run(
            comando, shell=True, capture_output=True,
            text=True, timeout=15
        )
        return res.stdout.strip() or res.stderr.strip() or "[Sin salida del sistema]"
    except subprocess.TimeoutExpired:
        return "[Timeout: el comando tardó más de 15 segundos]"
    except Exception as e:
        return f"[Error al ejecutar: {e}]"

# =============================================================
#  NÚCLEO IA COMPLETO (Corregido para evitar SyntaxError)
# =============================================================

# 1. Para obtener la respuesta completa de golpe (WhatsApp y Comandos)
async def consultar_ollama(historial, temperatura=0.3):
    payload = {
        "model": MODELO_IA,
        "messages": historial,
        "stream": False,
        "options": {
            "temperature": temperatura, 
            "repeat_penalty": 1.2,
            "num_predict": 3000  # <--- Agrega esta línea
        }
    }
    async with httpx.AsyncClient(timeout=120.0, trust_env=False) as client:
        response = await client.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        return response.json()["message"]["content"]

# 2. Para el flujo palabra por palabra (Web y Terminal)
async def generar_respuesta_ia(historial):
    payload = {
        "model": MODELO_IA,
        "messages": historial,
        "stream": True,
        "options": {
            "temperature": 0.3,
            "num_predict": 3000  # <--- Agrega esta línea también
        }
    }
    async with httpx.AsyncClient(timeout=None, trust_env=False) as client:
        async with client.stream("POST", OLLAMA_URL, json=payload) as response:
            async for line in response.aiter_lines():
                if line:
                    try:
                        chunk = json.loads(line)
                        if "message" in chunk and "content" in chunk["message"]:
                            yield chunk["message"]["content"]
                    except json.JSONDecodeError:
                        continue
                    
# =============================================================
#  MODO TERMINAL COMPLETO (Primer código)
# =============================================================
async def modo_terminal():
    print("\n\033[1;35m[GUATZIK OS — TERMINAL DE ENLACE DIRECTO]\033[0m")
    print("Memoria compartida activa. Escriba 'salir' para cerrar.\n")
    
    while True:
        try:
            user_input = input("\033[1;34mSeñor Xandzik > \033[0m")
        except EOFError: 
            break
        
        if user_input.lower() in ["salir", "exit"]: 
            break
        if not user_input.strip(): 
            continue

        historial = cargar_memoria()
        historial.append({"role": "user", "content": user_input})
        historial = podar_memoria(historial)

        print("\033[1;32mGuatzik > \033[0m", end="", flush=True)
        full_response = ""
        
        async for chunk in generar_respuesta_ia(historial):
            print(chunk, end="", flush=True)
            full_response += chunk
        print("\n")

        historial.append({"role": "assistant", "content": full_response})
        guardar_memoria(historial)

# =============================================================
#  MODELOS DE DATOS COMPLETOS
# =============================================================
class ChatInput(BaseModel):
    texto: str

class WhatsAppInput(BaseModel):
    mensaje: str
    numero: str = None

# =============================================================
#  ENDPOINTS COMPLETOS (Segundo código + mejoras)
# =============================================================

@app.post("/api/chat")
async def chat_endpoint(input_data: ChatInput):
    """Cerebro completo: IA + CMD + WhatsApp + Streaming"""
    historial = cargar_memoria()
    historial.append({"role": "user", "content": input_data.texto})
    historial = podar_memoria(historial)

    try:
        mensaje_pre = await consultar_ollama(historial)
        
        # WhatsApp detectado
        numero_wa, mensaje_wa = extraer_mensaje_wa(mensaje_pre)
        if numero_wa and mensaje_wa:
            resultado_wa = await enviar_whatsapp(mensaje_wa, numero_wa)
            historial.append({"role": "assistant", "content": mensaje_pre})
            feedback = resultado_wa["detalle"]
            historial.append({"role": "user", "content": feedback})
            
            respuesta_final = ""
            async for trozo in generar_respuesta_ia(podar_memoria(historial)):
                respuesta_final += trozo
            guardar_memoria(historial + [{"role": "assistant", "content": respuesta_final}])
            return {"respuesta": respuesta_final}

        # Comando detectado  
        comando_detectado = extraer_comando(mensaje_pre)
        if comando_detectado:
            salida = ejecutar_comando(comando_detectado)
            historial.append({"role": "assistant", "content": mensaje_pre})
            historial.append({"role": "user", "content": f"Sistema: {salida}"})
            
            respuesta_final = ""
            async for trozo in generar_respuesta_ia(podar_memoria(historial)):
                respuesta_final += trozo
            guardar_memoria(historial + [{"role": "assistant", "content": respuesta_final}])
            return {"respuesta": respuesta_final}

        # Conversación normal
        guardar_memoria(historial + [{"role": "assistant", "content": mensaje_pre}])
        return {"respuesta": mensaje_pre}

    except Exception as e:
        print(f"[ERROR] Núcleo: {e}")
        return {"respuesta": f"Señor Xandzik, fallo interno: {str(e)}"}

@app.post("/api/whatsapp")
async def whatsapp_endpoint(input_data: WhatsAppInput):
    """WhatsApp directo SIN IA"""
    resultado = await enviar_whatsapp(input_data.mensaje, input_data.numero)
    if resultado["status"] != "success":
        raise HTTPException(status_code=500, detail=resultado["detalle"])
    return resultado

@app.get("/api/system/stats")
async def stats_endpoint():
    """Stats REST completos"""
    return obtener_stats_sistema()

@app.get("/api/media/download")
async def download_endpoint(url: str = Query(...), tipo: str = Query(...)):
    """Descarga YouTube completa"""
    import yt_dlp
    path = os.path.expanduser("~/Descargas")
    ydl_opts = {
        'format': 'bestaudio/best' if tipo == 'audio' else 'best',
        'outtmpl': f'{path}/%(title)s.%(ext)s',
    }
    if tipo == 'audio':
        ydl_opts['postprocessors'] = [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3'}]
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        return {"status": "success", "message": "Descarga OK, Señor Xandzik."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check completo"""
    try:
        r = requests.get("http://localhost:11434", timeout=3)
        ollama_ok = r.status_code == 200
    except Exception:
        ollama_ok = False
    return {
        "status":  "online",
        "ollama":  "activo" if ollama_ok else "inactivo — revise el servidor",
        "modelo":  MODELO_IA,
        "version": "5.8 COMPLETA"
    }

# =============================================================
#  WEBSOCKET COMPLETO
# =============================================================
@app.websocket("/ws/system")
async def websocket_stats(websocket: WebSocket):
    """WebSocket stats en tiempo real"""
    await websocket.accept()
    print("[WS] Cliente conectado")
    try:
        while True:
            stats = obtener_stats_sistema()
            await websocket.send_text(json.dumps(stats))
            await asyncio.sleep(WS_INTERVALO)
    except WebSocketDisconnect:
        print("[WS] Cliente desconectado")
    except Exception as e:
        print(f"[WS] Error: {e}")

# =============================================================
#  ARRANQUE COMPLETO E INTELIGENTE
# =============================================================
if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--cli":
        asyncio.run(modo_terminal())
    else:
        import uvicorn
        print("=" * 60)
        print("  🚀 GUATZIK v5.8 COMPLETO — SERVIDOR + TERMINAL")
        print("  HTTP → http://0.0.0.0:8000")
        print("  WS   → ws://0.0.0.0:8000/ws/system") 
        print("  CLI  → python guatzik.py --cli")
        print("  Creado por: Xandzik")
        print("=" * 60)
        uvicorn.run(app, host="0.0.0.0", port=8000)