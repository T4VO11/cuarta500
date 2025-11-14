"""
Modelo de Usuario que ahora usa la API del backend en lugar de MongoDB directo
"""
from api_client import ApiClient

class Usuario:
    def __init__(self, nombre, email, telefono, password, username, rol="dueño",
                 condominio_id="C500", apellido_paterno=None, apellido_materno=None, 
                 rfc=None, nss=None, imagen=None, imagen_INE=None, 
                 modelo_de_auto=None, color=None, placas=None, numero_casa=None):
        
        # Asignar los valores recibidos
        self.condominio_id = condominio_id
        self.nombre = nombre
        self.apellido_paterno = apellido_paterno
        self.apellido_materno = apellido_materno
        self.telefono = telefono
        self.rfc = rfc
        self.nss = nss
        self.email = email
        self.imagen = imagen
        self.imagen_INE = imagen_INE
        self.modelo_de_auto = modelo_de_auto
        self.color = color
        self.placas = placas
        self.username = username
        self.password = password
        self.rol = rol
        self.numero_casa = numero_casa

    def registrar_usuario(self, api_client: ApiClient = None):
        """
        Registra un usuario usando la API del backend
        Si no se proporciona api_client, se crea uno nuevo
        """
        if api_client is None:
            api_client = ApiClient()
        
        # Preparar datos según el formato esperado por la API
        usuario_data = {
            "username": self.username,
            "password": self.password,
            "nombre": self.nombre,
            "apellido_paterno": self.apellido_paterno or "",
            "apellido_materno": self.apellido_materno or "",
            "email": self.email,
            "telefono": self.telefono,
            "rol": self.rol,
            "condominio_id": self.condominio_id,
            "numero_casa": self.numero_casa or ""
        }
        
        # Agregar campos opcionales si existen
        if self.rfc:
            usuario_data["perfil_detalle"] = {"rfc": self.rfc}
        if self.nss:
            if "perfil_detalle" not in usuario_data:
                usuario_data["perfil_detalle"] = {}
            usuario_data["perfil_detalle"]["nss"] = self.nss
        
        # Manejar archivos si existen
        files = None
        if self.imagen or self.imagen_INE:
            files = {}
            # Nota: Para archivos necesitarías usar FileStorage o similar
            # Por ahora solo se envía la URL si ya está subida
        
        exito, mensaje, data = api_client.registrar_usuario(usuario_data, files)
        
        if exito:
            return True, mensaje
        else:
            return False, mensaje

    @staticmethod
    def verificar_usuario(email_or_username, password, api_client: ApiClient = None):
        """
        Verifica las credenciales del usuario usando la API del backend
        Retorna True si las credenciales son válidas, False en caso contrario
        """
        if api_client is None:
            api_client = ApiClient()
        
        exito, mensaje, data = api_client.login(email_or_username, password)
        return exito
