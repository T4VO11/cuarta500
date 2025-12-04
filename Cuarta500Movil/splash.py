import flet as ft
import time
import threading
import os

class Splashvista:
    def __init__(self, page: ft.Page):
        self.page = page
        self.page.title = "Bienvenido"
        self.page.bgcolor = "white"  # Fondo blanco consistente
        self.page.fonts = {
            "Cinzel": "https://raw.githubusercontent.com/google/fonts/main/ofl/cinzel/Cinzel-Regular.ttf"
        }

        self.page.vertical_alignment = ft.MainAxisAlignment.CENTER
        self.page.horizontal_alignment = ft.CrossAxisAlignment.CENTER
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.window.bgcolor = "white"  # Fondo de ventana blanco
        self.page.clean()
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
        
        print(f"Intentando cargar logo desde: {logo_path}")
        
        # Logo con mejor tamaño y presentación
        logo = ft.Image(
            src=logo_path, 
            width=250,
            height=250,
            fit=ft.ImageFit.CONTAIN,
            error_content=ft.Text("Logo no encontrado", color="red")
        )
        
        self.page.add(
            ft.Column([
                logo,
                ft.Container(height=20),  # Espaciado
                ft.Text(
                    "Tu condominio en un clic",
                    size=28,
                    weight="bold",
                    font_family="Cinzel",
                    color="teal600"
                ),
                ft.Container(height=30),  # Espaciado
                ft.ProgressRing(
                    color="teal600",
                    width=50,
                    height=50
                )
            ],
            alignment="center",
            horizontal_alignment="center",
            spacing=10)
        )
        self.page.update()

        threading.Timer(3.0, self.go_to_login).start()

    def go_to_login(self):
        from login import Loginvista
        
        self.page.clean()
        Loginvista(self.page)
        self.page.update()