#!/bin/bash

echo "================================================"
echo " 🚀 INICIANDO PROTOCOLO GUATZIK OS..."
echo "================================================"

# --- PROTOCOLO DE APAGADO SEGURO ---
cleanup() {
    echo ""
    echo "🛑 Señal de apagado recibida. Desconectando núcleos..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    fuser -k 8000/tcp 2>/dev/null # Liberar el puerto 8000 de Python
    fuser -k 5173/tcp 2>/dev/null # Liberar el puerto de Vite/React
    echo "✅ Guatzik apagado correctamente. Hasta pronto, Señor Xandzik."
    exit
}

# Atrapa el comando Ctrl+C para apagar todo limpio
trap cleanup SIGINT SIGTERM

# --- PASO 1: ENCENDER EL CEREBRO (BACKEND) ---
echo "🧠 [1/2] Energizando núcleo lógico en Guatzik_core..."

# Subimos un nivel y entramos a Guatzik_core
cd ../Guatzik_core

# Activamos su entorno virtual y ejecutamos el cerebro
source venv/bin/activate
python3 guatzik_lite.py &
BACKEND_PID=$!

# Volvemos a la carpeta original (Guatzik) y esperamos a que respire
cd ../Guatzik
sleep 3 

# --- PASO 2: ENCENDER EL ROSTRO (FRONTEND) ---
echo "💻 [2/2] Desplegando interfaz visual en Guatzik..."

# Como ya estamos en la carpeta Guatzik, solo lanzamos Vite
npm run dev -- --host &
FRONTEND_PID=$!

echo " "
echo "================================================"
echo " ✅ SISTEMA 100% EN LÍNEA Y OPERATIVO"
echo "================================================"
echo " 📱 Busque la IP 'Network' abajo para entrar desde su celular."
echo " 🔴 Presione [Ctrl + C] en esta terminal para apagar todo."
echo "================================================"

# Mantenemos el script vivo observando ambos procesos
wait $BACKEND_PID $FRONTEND_PID