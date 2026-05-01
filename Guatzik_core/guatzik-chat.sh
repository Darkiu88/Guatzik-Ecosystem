#!/bin/bash
# Lanza la terminal usando el archivo principal con la bandera --cli
gnome-terminal --title="GUATZIK OS - TERMINAL" -- bash -c "source /home/darkiu88/proyect/Guatzik_core/venv/bin/activate && python3 /home/darkiu88/proyect/Guatzik_core/guatzik_lite.py --cli; exec bash"
