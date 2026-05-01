from fastapi import APIRouter, HTTPException, BackgroundTasks
import yt_dlp
import os
import re

router = APIRouter()

# Aquí guardaremos en vivo el estado de las descargas
active_downloads = {}

def clean_ansi(text):
    """Limpia los códigos de color de la terminal que manda yt-dlp"""
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    return ansi_escape.sub('', text)

def progress_hook(d):
    """Este gancho se ejecuta cada segundo mientras se descarga"""
    if d['status'] == 'downloading':
        filename = os.path.basename(d.get('filename', 'Descargando...'))
        percent_str = clean_ansi(d.get('_percent_str', '0%')).replace('%', '').strip()
        speed_str = clean_ansi(d.get('_speed_str', '0 B/s')).strip()
        
        try:
            percent = float(percent_str)
        except:
            percent = 0.0

        active_downloads[filename] = {
            "name": filename,
            "progress": round(percent, 1),
            "speed": speed_str
        }
    elif d['status'] == 'finished':
        filename = os.path.basename(d.get('filename', 'Archivo'))
        if filename in active_downloads:
            active_downloads[filename]['progress'] = 100
            active_downloads[filename]['speed'] = "PROCESANDO..."

@router.get("/download")
async def download_media(url: str, tipo: str, background_tasks: BackgroundTasks):
    download_path = os.path.expanduser("~/Descargas/GuatzikMedia")
    os.makedirs(download_path, exist_ok=True)

    def start_download():
        if tipo == "video":
            ydl_opts = {
                'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                'outtmpl': f'{download_path}/%(title)s.%(ext)s',
                'noplaylist': True,
                'progress_hooks': [progress_hook], # Conectamos el chismoso
            }
        else:
            ydl_opts = {
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'outtmpl': f'{download_path}/%(title)s.%(ext)s',
                'noplaylist': True,
                'progress_hooks': [progress_hook],
            }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
        except Exception as e:
            print(f"Error en descarga: {e}")

    # 👇 ESTO PERTENECE A LA DESCARGA, VA DENTRO DE LA FUNCIÓN DE ARRIBA
    # Lo mandamos al fondo para que FastAPI no se bloquee
    background_tasks.add_task(start_download)
    return {"status": "success", "message": "Descarga iniciada en segundo plano"}


# 👇 LA FUNCIÓN CLEAR VA HASTA EL FINAL, COMPLETAMENTE SEPARADA
@router.get("/clear")
async def clear_downloads():
    active_downloads.clear()
    return {"status": "cleared"}