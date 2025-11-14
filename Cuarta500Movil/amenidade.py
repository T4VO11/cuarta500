import flet as ft
from controller import Controlador

uri = "mongodb+srv://gdltech:gdltech12345@cluster0.7lopmuz.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority"
DATABASE_NAME = "condominios"
COLLECTION_NAME = "reservaciones"

class Amenidadevista:
    def __init__(self, page: ft.Page):
        self.page = page
        self.page.title = "Amenidades"
        self.page.vertical_alignment = ft.MainAxisAlignment.CENTER
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.clean()
        self.controlador = Controlador(page)
        self.build()

    def build(self):
        logo = ft.Image(src="condominio.png", width=150)
        titulo = ft.Text("Amenidades", size=22, weight="bold")
        descripcion = ft.Text("Aquí puedes ver y reservar las amenidades disponibles en tu condominio.")

        self.page.add(
            ft.Column([
                logo,
                titulo,
                descripcion,
            ],
            alignment="center",
            horizontal_alignment="center",
            spacing=15
            )
        )
