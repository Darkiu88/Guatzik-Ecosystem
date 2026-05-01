import sys
import logging

from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout,
    QHBoxLayout, QLabel, QPushButton, QLineEdit,
    QStackedWidget, QFrame, QSpinBox, QCheckBox
)
from PySide6.QtCore import Qt, QThread, Signal, Slot, QTimer
from PySide6.QtGui import QColor, QPalette, QFont

from receiver_engine import ReceiverEngine
from network_scanner import MDNSScanner

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


# ─── Hilo de recepción ───────────────────────────────────────────────────────
class ReceiverThread(QThread):
    started_ok = Signal(bool)
    stream_error = Signal(str)
    stream_eos = Signal()

    def __init__(self, engine: ReceiverEngine):
        super().__init__()
        self.engine = engine

    def run(self):
        self.engine.set_callbacks(
            on_error=lambda msg: self.stream_error.emit(msg),
            on_eos=lambda: self.stream_eos.emit(),
        )
        ok = self.engine.start()
        self.started_ok.emit(ok)


# ─── Pantalla: Buscando servidor ─────────────────────────────────────────────
class SearchScreen(QWidget):
    connect_requested = Signal(str, int)

    def __init__(self):
        super().__init__()
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignCenter)
        layout.setSpacing(20)

        title = QLabel("LinuxDesk")
        title.setAlignment(Qt.AlignCenter)
        title.setFont(QFont("monospace", 28, QFont.Bold))
        layout.addWidget(title)

        self.status_label = QLabel("🔍 Buscando servidor en la red local...")
        self.status_label.setAlignment(Qt.AlignCenter)
        self.status_label.setFont(QFont("monospace", 12))
        layout.addWidget(self.status_label)

        # ── Separador ──
        sep = QFrame()
        sep.setFrameShape(QFrame.HLine)
        layout.addWidget(sep)

        manual_label = QLabel("Conexión manual:")
        manual_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(manual_label)

        row = QHBoxLayout()
        row.setAlignment(Qt.AlignCenter)

        self.ip_input = QLineEdit("192.168.1.100")
        self.ip_input.setFixedWidth(180)
        self.ip_input.setPlaceholderText("IP del servidor")
        row.addWidget(self.ip_input)

        self.port_spin = QSpinBox()
        self.port_spin.setRange(1024, 65535)
        self.port_spin.setValue(5004)
        self.port_spin.setFixedWidth(80)
        row.addWidget(self.port_spin)

        connect_btn = QPushButton("Conectar")
        connect_btn.clicked.connect(self._manual_connect)
        row.addWidget(connect_btn)

        layout.addLayout(row)

        self.vaapi_check = QCheckBox("Usar VAAPI (decodificación HW)")
        self.vaapi_check.setChecked(True)
        self.vaapi_check.setToolTip(
            "Actívalo si el cliente tiene soporte VAAPI (AMD/Intel). "
            "Desactívalo si el video no aparece."
        )
        layout.addWidget(self.vaapi_check, alignment=Qt.AlignCenter)

    def set_status(self, text: str):
        self.status_label.setText(text)

    def get_vaapi(self) -> bool:
        return self.vaapi_check.isChecked()

    @Slot()
    def _manual_connect(self):
        ip = self.ip_input.text().strip()
        port = self.port_spin.value()
        if ip:
            self.connect_requested.emit(ip, port)


# ─── Pantalla: Video fullscreen ───────────────────────────────────────────────
class VideoScreen(QWidget):
    disconnect_requested = Signal()

    def __init__(self):
        super().__init__()
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        # Contenedor donde GStreamer dibujará el video
        self.video_widget = QWidget()
        self.video_widget.setStyleSheet("background-color: black;")
        self.video_widget.setSizePolicy(
            self.video_widget.sizePolicy().horizontalPolicy(),
            self.video_widget.sizePolicy().verticalPolicy(),
        )
        layout.addWidget(self.video_widget, stretch=1)

        # Barra de control flotante (se oculta con doble click)
        self.control_bar = QWidget()
        self.control_bar.setMaximumHeight(48)
        self.control_bar.setStyleSheet("background-color: rgba(0,0,0,180);")
        bar_layout = QHBoxLayout(self.control_bar)

        self.info_label = QLabel("● En vivo")
        self.info_label.setStyleSheet("color: #00ff88; font-family: monospace;")
        bar_layout.addWidget(self.info_label)

        bar_layout.addStretch()

        disconnect_btn = QPushButton("Desconectar")
        disconnect_btn.setStyleSheet(
            "background: #cc2200; color: white; border: none; padding: 4px 12px;"
        )
        disconnect_btn.clicked.connect(self.disconnect_requested.emit)
        bar_layout.addWidget(disconnect_btn)

        layout.addWidget(self.control_bar)

    def get_win_id(self) -> int:
        return int(self.video_widget.winId())

    def set_server_info(self, ip: str, port: int):
        self.info_label.setText(f"● En vivo  ←  {ip}:{port}")

    def mouseDoubleClickEvent(self, event):
        """Doble click: toggle barra de control."""
        self.control_bar.setVisible(not self.control_bar.isVisible())


# ─── Ventana principal ───────────────────────────────────────────────────────
class LinuxDeskClient(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("LinuxDesk Client")
        self.setMinimumSize(800, 600)

        self.engine: ReceiverEngine | None = None
        self.recv_thread: ReceiverThread | None = None
        self.scanner: MDNSScanner | None = None

        self._build_ui()
        self._start_scanner()

        # Timer para animar el texto de búsqueda
        self._dot_count = 0
        self._search_timer = QTimer(self)
        self._search_timer.timeout.connect(self._animate_search)
        self._search_timer.start(600)

    def _build_ui(self):
        self.stack = QStackedWidget()
        self.setCentralWidget(self.stack)

        self.search_screen = SearchScreen()
        self.search_screen.connect_requested.connect(self.connect_to_server)
        self.stack.addWidget(self.search_screen)  # index 0

        self.video_screen = VideoScreen()
        self.video_screen.disconnect_requested.connect(self.disconnect)
        self.stack.addWidget(self.video_screen)  # index 1

        self.stack.setCurrentIndex(0)

        # Estilo oscuro global
        self.setStyleSheet("""
            QMainWindow, QWidget { background-color: #0d0d0d; color: #e0e0e0; }
            QLineEdit, QSpinBox {
                background: #1a1a1a; border: 1px solid #333;
                color: #e0e0e0; padding: 4px; border-radius: 3px;
            }
            QPushButton {
                background: #1e3a5f; color: white; border: none;
                padding: 6px 16px; border-radius: 3px;
            }
            QPushButton:hover { background: #2a5080; }
            QPushButton:pressed { background: #0d2a45; }
            QCheckBox { color: #aaaaaa; }
            QFrame[frameShape="4"] { color: #333; }
        """)

    # ── Scanner ───────────────────────────────────────────────────────────────
    def _start_scanner(self):
        self.scanner = MDNSScanner(on_found=self._on_server_found)
        self.scanner.start()

    @Slot(str, int, dict)
    def _on_server_found(self, ip: str, port: int, props: dict):
        logger.info(f"Auto-descubierto: {ip}:{port}")
        self.search_screen.set_status(f"✅ Servidor encontrado: {ip}:{port}\nConectando...")
        self._search_timer.stop()
        # Pequeño delay para que el usuario vea el mensaje
        QTimer.singleShot(800, lambda: self.connect_to_server(ip, port))

    # ── Animación búsqueda ────────────────────────────────────────────────────
    @Slot()
    def _animate_search(self):
        self._dot_count = (self._dot_count + 1) % 4
        dots = "." * self._dot_count
        self.search_screen.set_status(f"🔍 Buscando servidor en la red local{dots}")

    # ── Conexión ──────────────────────────────────────────────────────────────
    @Slot(str, int)
    def connect_to_server(self, ip: str, port: int):
        if self.scanner:
            self.scanner.stop()
        self._search_timer.stop()

        self.video_screen.set_server_info(ip, port)
        self.stack.setCurrentIndex(1)

        # Necesitamos que el widget esté visible antes de pedir winId
        QTimer.singleShot(100, lambda: self._launch_engine(ip, port))

    def _launch_engine(self, ip: str, port: int):
        win_id = self.video_screen.get_win_id()
        use_vaapi = self.search_screen.get_vaapi()

        self.engine = ReceiverEngine(port=port, win_id=win_id, use_vaapi=use_vaapi)
        self.recv_thread = ReceiverThread(self.engine)
        self.recv_thread.started_ok.connect(self._on_recv_started)
        self.recv_thread.stream_error.connect(self._on_stream_error)
        self.recv_thread.stream_eos.connect(self.disconnect)
        self.recv_thread.start()

    @Slot(bool)
    def _on_recv_started(self, ok: bool):
        if not ok:
            self._on_stream_error("No se pudo iniciar ningún pipeline de recepción.")

    @Slot(str)
    def _on_stream_error(self, msg: str):
        logger.error(f"Error en stream: {msg}")
        self.video_screen.info_label.setText(f"❌ Error: {msg}")
        self.video_screen.info_label.setStyleSheet(
            "color: #ff4444; font-family: monospace;"
        )

    # ── Desconexión ───────────────────────────────────────────────────────────
    @Slot()
    def disconnect(self):
        if self.engine:
            self.engine.stop()
            self.engine = None

        self.stack.setCurrentIndex(0)
        self.search_screen.set_status("🔍 Buscando servidor en la red local...")
        self._dot_count = 0
        self._search_timer.start(600)
        self._start_scanner()

    def closeEvent(self, event):
        if self.engine:
            self.engine.stop()
        if self.scanner:
            self.scanner.stop()
        event.accept()


# ─── Entry point ─────────────────────────────────────────────────────────────
def main():
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(True)
    window = LinuxDeskClient()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
