import flet as ft
from controller import Controlador

class Homevista:
    def __init__(self, page: ft.Page, api_client=None):
        self.page = page
        self.page.title = "Condominio - Inicio"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.clean()
        self.controlador = Controlador(page)
        if api_client:
            self.controlador.api_client = api_client
        self.build()

    def build(self):
        def volver(e):
            self.controlador.logout()

        def ir_a_propiedad(e):
            # Aquí puedes implementar la navegación a la sección de propiedad
            print("Navegando a Propiedad")

        def ir_a_comunidad(e):
            # Aquí puedes implementar la navegación a la sección de comunidad
            print("Navegando a Comunidad")

        def pagar_en_linea(e):
            # Aquí puedes implementar la funcionalidad de pago en línea
            print("Iniciando pago en línea")

        def ver_pagos(e):
            # Aquí puedes implementar la vista de pagos del usuario
            print("Viendo historial de pagos")

        def on_navigation_change(e):
            """Maneja el cambio de navegación"""
            selected_index = e.control.selected_index
            if selected_index == 0:
                # Ya estamos en inicio
                pass
            elif selected_index == 1:
                from propiedad import PropiedadVista
                self.page.clean()
                PropiedadVista(self.page)
            elif selected_index == 2:
                print("Navegando a Comunidad")
                # Aquí puedes implementar la navegación a comunidad

        # Header con información del usuario
        header = ft.Container(
            content=ft.Row([
                # Botón de número de departamento
                ft.Container(
                    content=ft.Text("NUM DEPA", size=12, weight="bold", color="black"),
                    bgcolor="grey300",
                    padding=20,
                    border_radius=8,
                ),
                ft.Container(expand=True),  # Spacer
                # Información del usuario
                ft.Row([
                    ft.Container(
                        content=ft.Text("👤", size=40, color="black"),
                        bgcolor="grey300",
                        width=50,
                        height=50,
                        border_radius=25,
                    ),
                    ft.Column([
                        ft.Text("Hola! Usuario", size=16, weight="bold", color="black"),
                        ft.Text("Bienvenido", size=12, color="grey600"),
                    ], spacing=0)
                ], spacing=8)
            ]),
            padding=20,
            bgcolor="white",
        )

        # Sección de información de pagos
        payment_section = ft.Container(
            content=ft.Row([
                ft.Column([
                    ft.Text("Total a pagar es de:", size=16, weight="bold", color="black"),
                    ft.Text("$1,500.00", size=32, weight="bold", color="black"),
                ], spacing=4),
                ft.Container(expand=True),  # Spacer
                ft.Container(
                    content=ft.Text("📄", size=60, color="black"),
                    bgcolor="grey400",
                    width=80,
                    height=80,
                    border_radius=12,
                )
            ]),
            padding=20,
            bgcolor="white",
        )

        # Botón de pago en línea
        pay_online_btn = ft.Container(
            content=ft.Text("¿Quieres pagar en línea?", size=16, color="black"),
            bgcolor="grey300",
            padding=20,
            border_radius=8,
            on_click=pagar_en_linea,
        )

        # Sección de otros medios de pago
        other_payments = ft.Container(
            content=ft.Column([
                ft.Text("Otros medios de pago", size=16, weight="bold", color="black"),
                ft.Container(
                    content=ft.Text("Tus pagos", size=16, color="black"),
                    bgcolor="white",
                    padding=20,
                    border_radius=8,
                    on_click=ver_pagos,
                )
            ], spacing=12),
            padding=20,
            bgcolor="white",
        )

        # Sección de publicaciones
        publications_section = ft.Container(
            content=ft.Column([
                ft.Text("Publicaciones", size=18, weight="bold", color="black"),
                ft.Container(
                    content=ft.Row([
                        ft.Text("💬", size=24, color="black"),
                        ft.Column([
                            ft.Text("Informe mensual", size=16, color="black"),
                            ft.Text("20 de octubre del 2025", size=12, color="grey600"),
                        ], spacing=2)
                    ], spacing=12),
                    bgcolor="white",
                    padding=16,
                    border_radius=8,
                )
            ], spacing=12),
            padding=20,
            bgcolor="grey200",
        )

        # Configurar NavigationBar usando el patrón de la carpeta flet-python
        self.page.navigation_bar = ft.NavigationBar(
            destinations=[
                ft.NavigationBarDestination(
                    icon=ft.Icons.PERSON,
                    selected_icon=ft.Icons.PERSON,
                    label="Inicio",
                ),
                ft.NavigationBarDestination(
                    icon=ft.Icons.HOME,
                    selected_icon=ft.Icons.HOME,
                    label="Propiedad",
                ),
                ft.NavigationBarDestination(
                    icon=ft.Icons.PUBLIC,
                    selected_icon=ft.Icons.PUBLIC,
                    label="Comunidad",
                ),
            ],
            on_change=on_navigation_change,
            bgcolor="purple400",
            selected_index=0,
        )

        # Contenido principal
        main_content = ft.Column([
            header,
            payment_section,
            pay_online_btn,
            other_payments,
            publications_section,
            ft.Container(expand=True),  # Spacer
        ], spacing=0, scroll="auto")

        # Estructura completa de la página
        self.page.add(main_content)