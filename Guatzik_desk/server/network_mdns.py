import socket
import logging
from zeroconf import ServiceInfo, Zeroconf

logger = logging.getLogger(__name__)

SERVICE_TYPE = "_linuxdesk._udp.local."
SERVICE_NAME = "LinuxDesk-Server._linuxdesk._udp.local."
STREAM_PORT = 5004
API_PORT = 8765


def _get_local_ip() -> str:
    """Obtiene la IP local priorizando interfaces Ethernet."""
    try:
        # Fuerza resolución hacia la red local, no loopback
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


class MDNSServer:
    def __init__(self, stream_port: int = STREAM_PORT, api_port: int = API_PORT):
        self.stream_port = stream_port
        self.api_port = api_port
        self.zeroconf: Zeroconf | None = None
        self.info: ServiceInfo | None = None

    def start(self) -> str:
        """Anuncia el servicio en la red local. Retorna la IP usada."""
        local_ip = _get_local_ip()
        logger.info(f"Anunciando servicio en {local_ip}:{self.stream_port}")

        self.info = ServiceInfo(
            type_=SERVICE_TYPE,
            name=SERVICE_NAME,
            addresses=[socket.inet_aton(local_ip)],
            port=self.stream_port,
            properties={
                "version": "0.1.0",
                "api_port": str(self.api_port),
                "codec": "h264",
            },
            server=f"{socket.gethostname()}.local.",
        )

        self.zeroconf = Zeroconf()
        self.zeroconf.register_service(self.info)
        logger.info("Servicio mDNS registrado.")
        return local_ip

    def stop(self):
        if self.zeroconf and self.info:
            self.zeroconf.unregister_service(self.info)
            self.zeroconf.close()
            logger.info("Servicio mDNS detenido.")
