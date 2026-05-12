import logging
import gi

gi.require_version("Gst", "1.0")
from gi.repository import Gst, GLib

logger = logging.getLogger(__name__)

Gst.init(None)


# ─── Pipeline strings ────────────────────────────────────────────────────────

def _build_pipeline_vaapi(target_ip: str, port: int, fps: int, bitrate_kbps: int) -> str:
    """
    Pipeline principal con VIDEOTESTSRC para prueba de red.
    """
    return (
        f"videotestsrc is-live=true pattern=ball ! "  # <--- CAMBIO AQUÍ
        f"videoconvert ! "
        f"video/x-raw,framerate={fps}/1 ! "
        f"vaapih264enc bitrate={bitrate_kbps} keyframe-period=30 ! "
        f"h264parse ! "
        f"rtph264pay config-interval=1 pt=96 ! "
        f"udpsink host={target_ip} port={port} sync=false"
    )

def _build_pipeline_x264(target_ip: str, port: int, fps: int, bitrate_kbps: int) -> str:
    """
    Fallback pipeline con VIDEOTESTSRC para prueba de red.
    """
    return (
        f"videotestsrc is-live=true pattern=ball ! "  # <--- CAMBIO AQUÍ
        f"videoconvert ! "
        f"video/x-raw,framerate={fps}/1 ! "
        f"x264enc tune=zerolatency bitrate={bitrate_kbps} speed-preset=ultrafast key-int-max=30 ! "
        f"h264parse ! "
        f"rtph264pay config-interval=1 pt=96 ! "
        f"udpsink host={target_ip} port={port} sync=false"
    )

# ─── Engine ──────────────────────────────────────────────────────────────────

class StreamEngine:
    def __init__(
        self,
        target_ip: str,
        port: int = 5004,
        fps: int = 30,
        bitrate_kbps: int = 4000,
        use_vaapi: bool = True,
    ):
        self.target_ip = target_ip
        self.port = port
        self.fps = fps
        self.bitrate_kbps = bitrate_kbps
        self.use_vaapi = use_vaapi

        self.pipeline: Gst.Pipeline | None = None
        self._mainloop: GLib.MainLoop | None = None

    def _on_bus_message(self, bus: Gst.Bus, message: Gst.Message):
        t = message.type
        if t == Gst.MessageType.ERROR:
            err, debug = message.parse_error()
            logger.error(f"GStreamer error: {err.message} | debug: {debug}")
            self.stop()
        elif t == Gst.MessageType.EOS:
            logger.warning("GStreamer: End of stream.")
            self.stop()
        elif t == Gst.MessageType.WARNING:
            warn, debug = message.parse_warning()
            logger.warning(f"GStreamer warning: {warn.message}")

    def start(self) -> bool:
        """
        Construye y arranca el pipeline. Intenta VAAPI primero,
        cae a x264 si falla.
        """
        pipeline_str = (
            _build_pipeline_vaapi(self.target_ip, self.port, self.fps, self.bitrate_kbps)
            if self.use_vaapi
            else _build_pipeline_x264(self.target_ip, self.port, self.fps, self.bitrate_kbps)
        )

        logger.info(f"Iniciando pipeline: {pipeline_str}")

        try:
            self.pipeline = Gst.parse_launch(pipeline_str)
        except GLib.Error as e:
            logger.error(f"Error parseando pipeline: {e}")
            if self.use_vaapi:
                logger.warning("VAAPI falló, intentando fallback x264...")
                return self._start_fallback()
            return False

        bus = self.pipeline.get_bus()
        bus.add_signal_watch()
        bus.connect("message", self._on_bus_message)

        ret = self.pipeline.set_state(Gst.State.PLAYING)
        if ret == Gst.StateChangeReturn.FAILURE:
            logger.error("No se pudo iniciar el pipeline.")
            if self.use_vaapi:
                logger.warning("VAAPI falló en PLAYING, intentando fallback x264...")
                self.pipeline.set_state(Gst.State.NULL)
                return self._start_fallback()
            return False

        logger.info(f"Stream activo → {self.target_ip}:{self.port} @ {self.fps}fps")
        return True

    def _start_fallback(self) -> bool:
        self.use_vaapi = False
        return self.start()

    def stop(self):
        if self.pipeline:
            self.pipeline.set_state(Gst.State.NULL)
            self.pipeline = None
            logger.info("Pipeline detenido.")

    def is_running(self) -> bool:
        if not self.pipeline:
            return False
        _, state, _ = self.pipeline.get_state(timeout=Gst.CLOCK_TIME_NONE)
        return state == Gst.State.PLAYING

    def set_bitrate(self, bitrate_kbps: int):
        """Ajuste dinámico de bitrate (solo funciona si el encoder lo soporta en runtime)."""
        self.bitrate_kbps = bitrate_kbps
        if self.pipeline:
            encoder = self.pipeline.get_by_name("enc")
            if encoder:
                encoder.set_property("bitrate", bitrate_kbps)
