import socket
import logging
from zeroconf import ServiceBrowser, ServiceListener, Zeroconf

logger = logging.getLogger(__name__)

SERVICE_TYPE = "_linuxdesk._udp.local."


class _LinuxDeskListener(ServiceListener):
    def __init__(self, callback):
        self.callback = callback

    def add_service(self, zc: Zeroconf, type_: str, name: str):
        info = zc.get_service_info(type_, name)
        if not info:
            return
        ip = socket.inet_ntoa(info.addresses[0])
        port = info.port
        props = {k.decode(): v.decode() for k, v in info.properties.items()}
        logger.info(f"Servidor encontrado: {ip}:{port} props={props}")
        self.callback(ip, port, props)

    def remove_service(self, zc: Zeroconf, type_: str, name: str):
        logger.info(f"Servidor desaparecido: {name}")

    def update_service(self, zc: Zeroconf, type_: str, name: str):
        pass


class MDNSScanner:
    def __init__(self, on_found):
        """
        on_found(ip: str, port: int, props: dict) se llama
        cuando se descubre un servidor LinuxDesk en la LAN.
        """
        self.on_found = on_found
        self.zeroconf: Zeroconf | None = None
        self.browser: ServiceBrowser | None = None

    def start(self):
        self.zeroconf = Zeroconf()
        listener = _LinuxDeskListener(self.on_found)
        self.browser = ServiceBrowser(self.zeroconf, SERVICE_TYPE, listener)
        logger.info("Escaneando red local por servidores LinuxDesk...")

    def stop(self):
        if self.zeroconf:
            self.zeroconf.close()
            logger.info("Scanner mDNS detenido.")
