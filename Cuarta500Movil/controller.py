import flet as ft
from api_client import ApiClient
from token_storage import TokenStorage
from model import Usuario

class Controlador:
    def __init__(self, page: ft.Page):
        self.page = page
        self.api_client = ApiClient()
        # Intentar cargar token guardado
        token, usuario_data = TokenStorage.get_token()
        if token:
            self.api_client.set_token(token)
    
    def handle_login(self, username_input, password_input):
        """Maneja el login usando la API del backend"""
        if not username_input or not password_input:
            return False, "Usuario y contraseña no pueden estar vacíos"
        
        exito, mensaje, data = self.api_client.login(username_input, password_input)
        
        if exito:
            # Guardar token para próximas sesiones
            usuario_data = data.get('usuario') if data else None
            TokenStorage.save_token(self.api_client.token, usuario_data)
            print(f"Inicio de sesión exitoso: {mensaje}")
            from home import Homevista
            self.page.clean()
            Homevista(self.page, self.api_client)
            return True, mensaje
        else:
            print(f"Error en login: {mensaje}")
            return False, mensaje

    def handle_registro(self, nombre_input, correo_input, telefono_input, password_input, 
                       apellido_paterno=None, apellido_materno=None, numero_casa=None):
        """Maneja el registro usando la API del backend"""
        if not all([nombre_input, correo_input, telefono_input, password_input]):
            return False, "Todos los campos son obligatorios"
        
        # Preparar datos según el formato esperado por la API
        usuario_data = {
            "username": correo_input,
            "password": password_input,
            "nombre": nombre_input,
            "apellido_paterno": apellido_paterno or "",
            "apellido_materno": apellido_materno or "",
            "email": correo_input,
            "telefono": telefono_input,
            "rol": "dueño",  # Rol por defecto
            "condominio_id": "C500",
            "numero_casa": numero_casa or ""
        }
        
        exito, mensaje, data = self.api_client.registrar_usuario(usuario_data)
        
        if exito:
            print(f"Registro exitoso: {mensaje}")
            from login import Loginvista
            self.page.clean()
            Loginvista(self.page)
            return True, mensaje
        else:
            print(f"Error en el registro: {mensaje}")
            return False, mensaje
    
    def logout(self):
        """Cierra sesión y elimina el token"""
        self.api_client.logout()
        TokenStorage.clear_token()
        from login import Loginvista
        self.page.clean()
        Loginvista(self.page)
    
    def obtener_usuario_actual(self):
        """Obtiene los datos del usuario actual usando el token"""
        if not self.api_client.token:
            return None
        
        # El token contiene información del usuario, pero podemos obtener datos completos
        # Necesitarías implementar un endpoint en el backend para obtener usuario actual
        # Por ahora retornamos None
        return None
