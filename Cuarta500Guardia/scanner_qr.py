import flet as ft
from api_client import ApiClient
from token_storage import TokenStorage

class ScannerQRVista:
    def __init__(self, page: ft.Page, api_client: ApiClient):
        self.page = page
        self.page.title = "Guardia - Escanear QR"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.clean()
        self.api_client = api_client
        self.build()
    
    def build(self):
        def ir_a_escanear(e):
            # Importar aquí para evitar importación circular
            from validar_qr import ValidarQRVista
            self.page.clean()
            ValidarQRVista(self.page, self.api_client)
        
        def ir_a_historial(e):
            # Importar aquí para evitar importación circular
            from historial_guardia import HistorialGuardiaVista
            self.page.clean()
            HistorialGuardiaVista(self.page, self.api_client)
        
        def cerrar_sesion(e):
            self.api_client.logout()
            TokenStorage.clear_token()
            from login_guardia import LoginGuardiaVista
            self.page.clean()
            LoginGuardiaVista(self.page)
        
        # Obtener nombre del guardia
        token, usuario_data = TokenStorage.get_token()
        nombre_guardia = "Guardia"
        if usuario_data:
            nombre_guardia = usuario_data.get('nombre', usuario_data.get('username', 'Guardia'))
        
        # Botón de cerrar sesión
        if hasattr(ft, 'icons') and hasattr(ft.icons, 'EXIT_TO_APP'):
            btn_cerrar = ft.IconButton(
                icon=ft.icons.EXIT_TO_APP,
                icon_size=24,
                tooltip="Cerrar Sesión",
                on_click=cerrar_sesion
            )
        else:
            btn_cerrar = ft.ElevatedButton(
                content=ft.Text("🚪", size=20),
                tooltip="Cerrar Sesión",
                on_click=cerrar_sesion,
                bgcolor="transparent",
                width=40,
                height=40,
                style=ft.ButtonStyle(
                    shape=ft.RoundedRectangleBorder(radius=20),
                )
            )
        
        # Header
        header = ft.Container(
            content=ft.Row([
                ft.Column([
                    ft.Text(
                        f"Hola, {nombre_guardia}",
                        size=24,
                        weight="bold",
                        color="grey900"
                    ),
                    ft.Text(
                        "Sistema de Acceso",
                        size=14,
                        color="grey600"
                    ),
                ], spacing=4),
                ft.Container(expand=True),
                btn_cerrar
            ]),
            padding=20,
            bgcolor="white",
        )
        
        # Botón principal: Escanear QR
        btn_escanear = ft.Container(
            content=ft.ElevatedButton(
                content=ft.Column([
                    ft.Text("📷", size=60),
                    ft.Text("Escanear QR", size=20, weight="bold", color="white"),
                    ft.Text("Validar acceso de visitantes", size=14, color="white")
                ], 
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                spacing=10),
                on_click=ir_a_escanear,
                bgcolor="teal600",
                color="white",
                width=350,
                height=200,
                style=ft.ButtonStyle(
                    shape=ft.RoundedRectangleBorder(radius=20),
                )
            ),
            padding=20,
            margin=ft.margin.only(bottom=20),
        )
        
        # Botón: Historial
        btn_historial = ft.Container(
            content=ft.ElevatedButton(
                content=ft.Row([
                    ft.Text("📋", size=30),
                    ft.Text("Historial de Accesos", size=18, weight="w500", color="teal600"),
                ], spacing=15),
                on_click=ir_a_historial,
                bgcolor="teal50",
                color="teal600",
                width=350,
                height=60,
                style=ft.ButtonStyle(
                    shape=ft.RoundedRectangleBorder(radius=12),
                )
            ),
            padding=20,
        )
        
        # Información
        info_card = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Text("ℹ️", size=20),
                    ft.Text("Información", size=16, weight="bold", color="grey900"),
                ], spacing=8),
                ft.Text(
                    "• Escanea el QR del visitante para validar su acceso\n"
                    "• El sistema verificará automáticamente la validez del QR\n"
                    "• Se registrará la entrada/salida en el historial",
                    size=14,
                    color="grey700"
                ),
            ], spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="grey50",
            border_radius=12,
        )
        
        # Contenido principal
        contenido = ft.Column([
            header,
            ft.Container(height=40),
            btn_escanear,
            btn_historial,
            info_card,
        ],
        spacing=0,
        scroll=ft.ScrollMode.AUTO,
        expand=True)
        
        self.page.add(contenido)
        self.page.update()

