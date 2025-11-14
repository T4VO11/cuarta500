import flet as ft
import time
import threading

class Splashvista:
    def __init__(self, page: ft.Page):
        self.page = page
        self.page.title = "Bienvenido"
        self.page.fonts = {
            "Cinzel": "https://raw.githubusercontent.com/google/fonts/main/ofl/cinzel/Cinzel-Regular.ttf"
        }

        self.page.vertical_alignment = ft.MainAxisAlignment.CENTER
        self.page.horizontal_alignment = ft.CrossAxisAlignment.CENTER
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.clean()
        self.build()

    def build(self):
        logo = ft.Image(src="condominio.png", width=150)
        
        self.page.add(
            ft.Column([
                logo,
                ft.Text(
                    "Tu condominio en un clic",
                    size=28,
                    weight="bold",
                    font_family="Cinzel" 
                ),
                ft.ProgressRing()
            ],
            alignment="center",
            horizontal_alignment="center",
            spacing=20)
        )
        self.page.update()

        threading.Timer(3.0, self.go_to_login).start()

    def go_to_login(self):
        from login import Loginvista
        
        self.page.clean()
        Loginvista(self.page)
        self.page.update()