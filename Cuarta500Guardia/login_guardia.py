import flet as ft
import os
from api_client import ApiClient
from token_storage import TokenStorage

class LoginGuardiaVista:
    def __init__(self, page: ft.Page):
        self.page = page
        self.page.title = "Login"
        self.page.bgcolor = "white"
        self.page.vertical_alignment = ft.MainAxisAlignment.CENTER
        self.page.horizontal_alignment = ft.CrossAxisAlignment.CENTER
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.window.bgcolor = "white"
        self.page.clean()
        self.api_client = ApiClient()
        self.build()
    
    def build(self):
        # Obtener la ruta absoluta del logo
        script_dir = os.path.dirname(os.path.abspath(__file__))
        logo_path = os.path.join(script_dir, "logo.png")
        
        # Verificar que el archivo existe
        if not os.path.exists(logo_path):
            print(f"ADVERTENCIA: No se encontró el logo en {logo_path}")
            # Intentar con ruta relativa
            logo_path = "logo.png"
        
        # Convertir a formato de archivo para Windows si es necesario
        if os.name == 'nt':  # Windows
            logo_path = logo_path.replace('\\', '/')
        
        # Logo con mejor tamaño y centrado
        logo = ft.Image(
            src=logo_path, 
            width=200,
            height=200,
            fit=ft.ImageFit.CONTAIN,
            error_content=ft.Text("Logo no encontrado", color="red")
        )
        
        # Campo de usuario con mejor feedback visual
        usuario = ft.TextField(
            label="Usuario", 
            autofocus=True,
            border_color="teal400",
            focused_border_color="teal600",
            border_width=2,
            focused_border_width=3,
            text_size=14,
            bgcolor="#FFFFFF",
            color="#000000",
            cursor_color="teal600",
            selection_color="teal100",
            hint_text="Ingresa tu usuario",
        )
        
        # Campo de contraseña con mejor feedback visual
        password = ft.TextField(
            label="Contraseña", 
            password=True, 
            can_reveal_password=True,
            border_color="teal400",
            focused_border_color="teal600",
            border_width=2,
            focused_border_width=3,
            text_size=14,
            bgcolor="#FFFFFF",
            color="#000000",
            cursor_color="teal600",
            selection_color="teal100",
            hint_text="Ingresa tu contraseña",
        )
        
        # Mensaje de error (inicialmente oculto)
        mensaje_error = ft.Text("", color="red", size=12, visible=False)
        
        # Indicador de carga
        indicador_carga = ft.ProgressRing(visible=False)
        
        def entrar(e):
            # Validar campos
            if not usuario.value or not password.value:
                mensaje_error.value = "Por favor completa todos los campos"
                mensaje_error.visible = True
                indicador_carga.visible = False
                self.page.update()
                return
            
            # Mostrar indicador de carga
            mensaje_error.visible = False
            indicador_carga.visible = True
            boton_entrar.disabled = True
            self.page.update()
            
            # Intentar login
            exito, mensaje, data = self.api_client.login(usuario.value, password.value)
            
            if exito:
                # Guardar token
                usuario_data = None
                if data and isinstance(data, dict):
                    usuario_data = data.get('usuario')
                TokenStorage.save_token(self.api_client.token, usuario_data)
                
                # Navegar a la vista principal del guardia
                from scanner_qr import ScannerQRVista
                self.page.clean()
                ScannerQRVista(self.page, self.api_client)
            else:
                # Mostrar error
                mensaje_error.value = mensaje
                mensaje_error.visible = True
                indicador_carga.visible = False
                boton_entrar.disabled = False
                self.page.update()
        
        # Botón de entrar con mejor estilo
        boton_entrar = ft.ElevatedButton(
            "Entrar", 
            on_click=entrar,
            bgcolor="teal600",
            color="white",
            width=200,
            height=45,
            style=ft.ButtonStyle(
                shape=ft.RoundedRectangleBorder(radius=8),
            )
        )
        
        # Título con mejor estilo
        titulo = ft.Text(
            "Iniciar Sesión", 
            size=28, 
            weight=ft.FontWeight.BOLD,
            color="teal600"
        )
        
        self.page.add(
            ft.Container(
                content=ft.Column([
                    logo,
                    ft.Container(height=10),  # Espaciado
                    titulo,
                    ft.Container(height=20),  # Espaciado
                    ft.Container(
                        usuario,
                        width=300,
                        padding=20
                    ),
                    ft.Container(
                        password,
                        width=300,
                        padding=20
                    ),
                    mensaje_error,
                    ft.Container(height=10),  # Espaciado
                    ft.Row([
                        indicador_carga,
                        boton_entrar,
                    ], alignment=ft.MainAxisAlignment.CENTER),
                ],
                alignment="center",
                horizontal_alignment="center",
                spacing=10
                ),
                padding=20,
                alignment=ft.alignment.center
            )
        )
        self.page.update()

