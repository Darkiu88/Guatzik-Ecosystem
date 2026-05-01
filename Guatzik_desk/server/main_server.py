import sys
import logging
import threading
from pathlib import Path

from PySide6.QtWidgets import (
    QApplication, QSystemTrayIcon, QMenu, QDialog,
    QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QPushButton, QSpinBox, QCheckBox, QGroupBox,
    QComboBox, QWidget
)
from PySide6.QtGui import QIcon, QPixmap, QColor
from PySide6.QtCore import Qt, QThread, Signal, Slot

import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from stream_engine import StreamEngine
from network_mdns import MDNSServer

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ─── FastAPI (API local para Guatzik / automatización) ───────────────────────
api_app = FastAPI(title="LinuxDesk API", version="0.1.0")
_engine_ref: StreamEngine | None = None


@api_app.get("/status")
def api_status():
    return JSONResponse({
        "running": _engine_ref.is_running() if _engine_ref else False,
        "service": "linuxdesk"
    })


@api_app.post("/stream/start")
def api_stream_start():
    if _engine_ref:
        ok = _engine_ref.start()
        return JSONResponse({"started": ok})
    return JSONResponse({"error": "engine not initialized"}, status_code=503)


@api_app.post("/stream/stop")
def api_stream_stop():
    if _engine_ref:
        _engine_ref.stop()
        return JSONResponse({"stopped": True})
    return JSONResponse({"error": "engine not initialized"}, status_code=503)


# ─── Hilo para el servidor API ────────────────────────────────────────────────
class APIServerThread(QThread):
    def __init__(self, port: int = 8765):
        super().__init__()
        self.port = port

    def run(self):
        uvicorn.run(api_app, host="0.0.0.0", port=self.port, log_level="warning")


# ─── Hilo para el stream engine ──────────────────────────────────────────────
class StreamThread(QThread):
    stream_started = Signal(bool)
    stream_stopped = Signal()

    def __init__(self, engine: StreamEngine):
        super().__init__()
        self.engine = engine

    def run(self):
        ok = self.engine.start()
        self.stream_started.emit(ok)

    def stop_stream(self):
        self.engine.stop()
        self.stream_stopped.emit()


# ─── Utilidad: ícono generado en memoria ─────────────────────────────────────
def _make_tray_icon(color: str = "#00aaff") -> QIcon:
    px = QPixmap(32, 32)
    px.fill(QColor(color))
    return QIcon(px)


# ─── Diálogo de configuración ────────────────────────────────────────────────
class ConfigDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("LinuxDesk — Configuración")
        self.setMinimumWidth(400)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)

        # ── Destino ──
        dest_group = QGroupBox("Destino (Cliente)")
        dest_layout = QVBoxLayout(dest_group)

        row_ip = QHBoxLayout()
        row_ip.addWidget(QLabel("IP del cliente:"))
        self.ip_input = QLineEdit("192.168.1.100")
        row_ip.addWidget(self.ip_input)
        dest_layout.addLayout(row_ip)

        row_port = QHBoxLayout()
        row_port.addWidget(QLabel("Puerto UDP:"))
        self.port_spin = QSpinBox()
        self.port_spin.setRange(1024, 65535)
        self.port_spin.setValue(5004)
        row_port.addWidget(self.port_spin)
        dest_layout.addLayout(row_port)

        layout.addWidget(dest_group)

        # ── Codificación ──
        enc_group = QGroupBox("Codificación")
        enc_layout = QVBoxLayout(enc_group)

        row_fps = QHBoxLayout()
        row_fps.addWidget(QLabel("FPS:"))
        self.fps_spin = QSpinBox()
        self.fps_spin.setRange(10, 60)
        self.fps_spin.setValue(30)
        row_fps.addWidget(self.fps_spin)
        enc_layout.addLayout(row_fps)

        row_bitrate = QHBoxLayout()
        row_bitrate.addWidget(QLabel("Bitrate (kbps):"))
        self.bitrate_spin = QSpinBox()
        self.bitrate_spin.setRange(500, 20000)
        self.bitrate_spin.setValue(4000)
        self.bitrate_spin.setSingleStep(500)
        row_bitrate.addWidget(self.bitrate_spin)
        enc_layout.addLayout(row_bitrate)

        self.vaapi_check = QCheckBox("Usar aceleración VAAPI (recomendado)")
        self.vaapi_check.setChecked(True)
        enc_layout.addWidget(self.vaapi_check)

        layout.addWidget(enc_group)

        # ── API ──
        api_group = QGroupBox("API Local (Automatización)")
        api_layout = QHBoxLayout(api_group)
        api_layout.addWidget(QLabel("Puerto API:"))
        self.api_port_spin = QSpinBox()
        self.api_port_spin.setRange(1024, 65535)
        self.api_port_spin.setValue(8765)
        api_layout.addWidget(self.api_port_spin)
        layout.addWidget(api_group)

        # ── Botones ──
        btn_row = QHBoxLayout()
        self.ok_btn = QPushButton("Guardar y Cerrar")
        self.ok_btn.clicked.connect(self.accept)
        cancel_btn = QPushButton("Cancelar")
        cancel_btn.clicked.connect(self.reject)
        btn_row.addWidget(self.ok_btn)
        btn_row.addWidget(cancel_btn)
        layout.addLayout(btn_row)

    def get_config(self) -> dict:
        return {
            "target_ip": self.ip_input.text().strip(),
            "port": self.port_spin.value(),
            "fps": self.fps_spin.value(),
            "bitrate_kbps": self.bitrate_spin.value(),
            "use_vaapi": self.vaapi_check.isChecked(),
            "api_port": self.api_port_spin.value(),
        }


# ─── Controlador principal (System Tray) ─────────────────────────────────────
class LinuxDeskServer(QSystemTrayIcon):
    def __init__(self, app: QApplication):
        super().__init__()
        self.app = app
        self.config: dict = {
            "target_ip": "192.168.1.100",
            "port": 5004,
            "fps": 30,
            "bitrate_kbps": 4000,
            "use_vaapi": True,
            "api_port": 8765,
        }
        self.engine: StreamEngine | None = None
        self.stream_thread: StreamThread | None = None
        self.api_thread: APIServerThread | None = None
        self.mdns: MDNSServer | None = None

        self._setup_tray()
        self._start_api()
        self._start_mdns()

    # ── Tray ──────────────────────────────────────────────────────────────────
    def _setup_tray(self):
        self.setIcon(_make_tray_icon("#555555"))
        self.setToolTip("LinuxDesk — Inactivo")

        menu = QMenu()

        self.status_action = menu.addAction("● Estado: Inactivo")
        self.status_action.setEnabled(False)
        menu.addSeparator()

        self.start_action = menu.addAction("▶  Iniciar Stream")
        self.start_action.triggered.connect(self.start_stream)

        self.stop_action = menu.addAction("■  Detener Stream")
        self.stop_action.triggered.connect(self.stop_stream)
        self.stop_action.setEnabled(False)

        menu.addSeparator()

        config_action = menu.addAction("⚙  Configuración")
        config_action.triggered.connect(self.open_config)

        menu.addSeparator()

        quit_action = menu.addAction("✕  Salir")
        quit_action.triggered.connect(self._quit)

        self.setContextMenu(menu)
        self.show()

    # ── API ───────────────────────────────────────────────────────────────────
    def _start_api(self):
        self.api_thread = APIServerThread(port=self.config["api_port"])
        self.api_thread.start()
        logger.info(f"API local en http://127.0.0.1:{self.config['api_port']}")

    # ── mDNS ──────────────────────────────────────────────────────────────────
    def _start_mdns(self):
        self.mdns = MDNSServer(
            stream_port=self.config["port"],
            api_port=self.config["api_port"]
        )
        local_ip = self.mdns.start()
        logger.info(f"mDNS activo en {local_ip}")

    # ── Stream ────────────────────────────────────────────────────────────────
    @Slot()
    def start_stream(self):
        global _engine_ref
        self.engine = StreamEngine(
            target_ip=self.config["target_ip"],
            port=self.config["port"],
            fps=self.config["fps"],
            bitrate_kbps=self.config["bitrate_kbps"],
            use_vaapi=self.config["use_vaapi"],
        )
        _engine_ref = self.engine

        self.stream_thread = StreamThread(self.engine)
        self.stream_thread.stream_started.connect(self._on_stream_started)
        self.stream_thread.start()

    @Slot(bool)
    def _on_stream_started(self, ok: bool):
        if ok:
            self.setIcon(_make_tray_icon("#00cc44"))
            self.setToolTip(f"LinuxDesk → {self.config['target_ip']}:{self.config['port']}")
            self.status_action.setText(f"● Streaming → {self.config['target_ip']}")
            self.start_action.setEnabled(False)
            self.stop_action.setEnabled(True)
            self.showMessage("LinuxDesk", "Stream iniciado.", QSystemTrayIcon.Information, 2000)
        else:
            self.setIcon(_make_tray_icon("#cc2200"))
            self.status_action.setText("● Error al iniciar stream")
            self.showMessage("LinuxDesk", "Error al iniciar el stream.", QSystemTrayIcon.Critical, 3000)

    @Slot()
    def stop_stream(self):
        if self.stream_thread:
            self.stream_thread.stop_stream()
        self.setIcon(_make_tray_icon("#555555"))
        self.setToolTip("LinuxDesk — Inactivo")
        self.status_action.setText("● Estado: Inactivo")
        self.start_action.setEnabled(True)
        self.stop_action.setEnabled(False)

    # ── Config ────────────────────────────────────────────────────────────────
    @Slot()
    def open_config(self):
        dlg = ConfigDialog()
        dlg.ip_input.setText(self.config["target_ip"])
        dlg.port_spin.setValue(self.config["port"])
        dlg.fps_spin.setValue(self.config["fps"])
        dlg.bitrate_spin.setValue(self.config["bitrate_kbps"])
        dlg.vaapi_check.setChecked(self.config["use_vaapi"])
        dlg.api_port_spin.setValue(self.config["api_port"])

        if dlg.exec():
            self.config.update(dlg.get_config())
            logger.info(f"Configuración actualizada: {self.config}")

    # ── Quit ──────────────────────────────────────────────────────────────────
    def _quit(self):
        self.stop_stream()
        if self.mdns:
            self.mdns.stop()
        self.hide()
        self.app.quit()


# ─── Entry point ─────────────────────────────────────────────────────────────
def main():
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)

    if not QSystemTrayIcon.isSystemTrayAvailable():
        logger.error("No hay system tray disponible.")
        sys.exit(1)

    server = LinuxDeskServer(app)
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
