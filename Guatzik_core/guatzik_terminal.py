import httpx
import asyncio
import json
import os

# CONFIGURACIÓN DIRECTA A OLLAMA
OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
MODELO = "gemma3:4b"

# Personalidad de Guatzik (Inyectada directamente)
SISTEMA = {
    "role": "system",
    "content": "Eres Guatzik, asistente del Señor Xandzik. Habla como ingeniero mexicano, sarcástico y breve (máximo 2 frases). No uses JSON, solo texto plano."
}

async def chat_directo():
    print("\n\033[1;35m[GUATZIK OS — ENLACE DIRECTO AL NÚCLEO OLLAMA]\033[0m")
    print("Conexión bypass activa. Escriba 'salir' para terminar.\n")
    
    # Memoria volátil de esta sesión
    historial = [SISTEMA]

    async with httpx.AsyncClient(timeout=None) as client:
        while True:
            user_input = input("\033[1;34mSeñor Xandzik > \033[0m")
            if user_input.lower() in ["salir", "exit", "quit"]: break

            historial.append({"role": "user", "content": user_input})
            
            payload = {
                "model": MODELO,
                "messages": historial,
                "stream": True
            }

            print("\033[1;32mGuatzik > \033[0m", end="", flush=True)
            full_response = ""

            try:
                async with client.stream("POST", OLLAMA_URL, json=payload) as response:
                    async for line in response.aiter_lines():
                        if line:
                            chunk = json.loads(line)
                            content = chunk.get("message", {}).get("content", "")
                            print(content, end="", flush=True)
                            full_response += content
                
                print("\n")
                historial.append({"role": "assistant", "content": full_response})
            except Exception as e:
                print(f"\033[1;31m\n[ERROR]: El Chef Ollama no responde. {e}\033[0m\n")

if __name__ == "__main__":
    asyncio.run(chat_directo())

