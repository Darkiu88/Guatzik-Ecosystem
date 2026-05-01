import logging
import gi

gi.require_version("Gst", "1.0")
gi.require_version("GstVideo", "1.0")
from gi.repository import Gst, GLib

logger = logging.getLogger(__name__)

Gst.init(None)


# ─── Pipeline strings ────────────────────────────────────────────────────────

def _build_pipeline_vaapi(port: int, win_id: int) -> str:
    """
    RX con decodificación VAAPI (hardware). Ideal para AMD A6 con soporte VAAPI.
    """
    return (
        f"udpsrc port={port} caps=\"application/x-rtp,media=video,"
        f"clock-rate=90000,encoding-name=H264,payload=96\" ! "
        f"rtph264depay ! "
        f"h264parse ! "
        f"vaapih264dec ! "
        f"vaapisink display-id={win_id} sync=false"
    )


def _build_pipeline_sw(port: int, win_id: int) -> str:
    """
    RX con decodificación software (avdec_h264). Fallback para hardware sin VAAPI.
    """
    return (
        f"udpsrc port={port} caps=\"application/x-rtp,media=video,"
        f"clock-rate=90000,encoding-name=H264,payload=96\" ! "
        f"rtph264depay ! "
        f"h264parse ! "
        f"avdec_h264 ! "
        f"videoconvert ! "
        f"videoscale ! "
        f"ximagesink window-width=1920 window-height=1080 "
        f"force-aspect-ratio=false sync=false"
    )


def _build_pipeline_overlay(port: int) -> str:
    """
    Pipeline sin win_id (ventana nativa de GStreamer). Útil como último fallback.
    """
    return (
        f"udpsrc port={port} caps=\"application/x-rtp,media=video,"
        f"clock-rate=90000,encoding-name=H264,payload=96\" ! "
        f"rtph264depay ! "
        f"h264parse ! "
        f"avdec_h264 ! "
        f"videoconvert ! "
        f"autovideosink sync=false"
    )


# ─── Engine ──────────────────────────────────────────────────────────────────

class ReceiverEngine:
    def __init__(
        self,
        port: int = 5004,
        win_id: int | None = None,
        use_vaapi: bool = True,
    ):
        self.port = port
        self.win_id = win_id
        self.use_vaapi = use_vaapi

        self.pipeline: Gst.Pipeline | None = None
        self._error_cb = None
        self._eos_cb = None

    def set_callbacks(self, on_error=None, on_eos=None):
        """Registra callbacks para errores y fin de stream."""
        self._error_cb = on_error
        self._eos_cb = on_eos

    def _on_bus_message(self, bus: Gst.Bus, message: Gst.Message):
        t = message.type
        if t == Gst.MessageType.ERROR:
            err, debug = message.parse_error()
            logger.error(f"GStreamer RX error: {err.message} | {debug}")
            if self._error_cb:
                self._error_cb(err.message)
            self.stop()
        elif t == Gst.MessageType.EOS:
            logger.warning("GStreamer RX: EOS recibido.")
            if self._eos_cb:
                self._eos_cb()
        elif t == Gst.MessageType.WARNING:
            warn, _ = message.parse_warning()
            logger.warning(f"GStreamer RX warning: {warn.message}")

    def _try_pipeline(self, pipeline_str: str) -> bool:
        try:
            self.pipeline = Gst.parse_launch(pipeline_str)
        except GLib.Error as e:
            logger.error(f"Error parseando pipeline RX: {e}")
            return False

        bus = self.pipeline.get_bus()
        bus.add_signal_watch()
        bus.connect("message", self._on_bus_message)

        ret = self.pipeline.set_state(Gst.State.PLAYING)
        if ret == Gst.StateChangeReturn.FAILURE:
            logger.error("Pipeline RX no pudo iniciar.")
            self.pipeline.set_state(Gst.State.NULL)
            self.pipeline = None
            return False

        return True

    def start(self) -> bool:
        """
        Intenta iniciar el pipeline en orden de preferencia:
        1. VAAPI (si use_vaapi=True y win_id disponible)
        2. Software con ximagesink (si win_id disponible)
        3. autovideosink (fallback total)
        """
        if self.use_vaapi and self.win_id:
            logger.info("Intentando pipeline VAAPI...")
            pipe = _build_pipeline_vaapi(self.port, self.win_id)
            if self._try_pipeline(pipe):
                logger.info("Pipeline VAAPI RX activo.")
                return True
            logger.warning("VAAPI RX falló, intentando SW...")

        if self.win_id:
            logger.info("Intentando pipeline SW con ximagesink...")
            pipe = _build_pipeline_sw(self.port, self.win_id)
            if self._try_pipeline(pipe):
                logger.info("Pipeline SW RX activo.")
                return True
            logger.warning("ximagesink falló, usando autovideosink...")

        logger.info("Usando pipeline autovideosink (fallback total)...")
        pipe = _build_pipeline_overlay(self.port)
        if self._try_pipeline(pipe):
            logger.info("Pipeline autovideosink RX activo.")
            return True

        logger.error("Todos los pipelines RX fallaron.")
        return False

    def stop(self):
        if self.pipeline:
            self.pipeline.set_state(Gst.State.NULL)
            self.pipeline = None
            logger.info("Pipeline RX detenido.")

    def is_running(self) -> bool:
        if not self.pipeline:
            return False
        _, state, _ = self.pipeline.get_state(timeout=Gst.CLOCK_TIME_NONE)
        return state == Gst.State.PLAYING
