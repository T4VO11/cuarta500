import flet as ft
from controller import Controlador
from token_storage import TokenStorage

class OpcionesQRVista:
    def __init__(self, page: ft.Page, api_client=None):
        self.page = page
        self.page.title = "Condominio - Generar Acceso QR"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.scroll = ft.ScrollMode.AUTO
        self.page.clean()
        self.controlador = Controlador(page)
        if api_client:
            self.controlador.api_client = api_client
        self.build()

    def build(self):
        def mostrar_mensaje(mensaje, tipo="info"):
            """Muestra un mensaje al usuario"""
            try:
                color = "green" if tipo == "exito" else "red" if tipo == "error" else "blue"
                snackbar = ft.SnackBar(
                    content=ft.Text(mensaje),
                    bgcolor=color,
                    duration=3000
                )
                self.page.snack_bar = snackbar
                snackbar.open = True
                if self.page:
                    self.page.update()
            except Exception as ex:
                print(f"Error al mostrar mensaje: {str(ex)}")

        def volver_home(e):
            from home import Homevista
            self.page.clean()
            Homevista(self.page, self.controlador.api_client)

        def ir_qr_uso_unico(e):
            """Navega a la pantalla de QR de uso único"""
            from qr_uso_unico import QRUsoUnicoVista
            self.page.clean()
            QRUsoUnicoVista(self.page, self.controlador.api_client)

        def ir_qr_usos_multiples(e):
            """Navega a la pantalla de QR de usos múltiples"""
            from qr_usos_multiples import QRUsosMultiplesVista
            self.page.clean()
            QRUsosMultiplesVista(self.page, self.controlador.api_client)

        def ir_gestionar_qrs(e):
            """Navega a la pantalla de gestión de QRs activos"""
            from gestionar_qrs import GestionarQRsVista
            self.page.clean()
            GestionarQRsVista(self.page, self.controlador.api_client)

        def on_navigation_change(e):
            """Maneja el cambio de navegación"""
            selected_index = e.control.selected_index
            if selected_index == 0:
                from home import Homevista
                self.page.clean()
                Homevista(self.page, self.controlador.api_client)
            elif selected_index == 1:
                from amenidades import AmenidadesVista
                self.page.clean()
                AmenidadesVista(self.page, self.controlador.api_client)
            elif selected_index == 2:
                from pagos import PagosVista
                self.page.clean()
                PagosVista(self.page, self.controlador.api_client)
            elif selected_index == 3:
                from perfil import PerfilVista
                self.page.clean()
                PerfilVista(self.page, self.controlador.api_client)

        # Header
        header = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.IconButton(
                        icon=ft.Icons.ARROW_BACK,
                        on_click=volver_home,
                        tooltip="Volver"
                    ),
                    ft.Container(expand=True),
                    ft.IconButton(
                        icon=ft.Icons.NOTIFICATIONS_OUTLINED,
                        icon_size=24,
                        tooltip="Notificaciones",
                        on_click=lambda e: print("Abrir notificaciones")
                    )
                ]),
                ft.Text(
                    "Generar Acceso QR",
                    size=28,
                    weight="bold",
                    color="grey900"
                ),
                ft.Text(
                    "Elige cómo deseas crear un código QR para tus visitantes",
                    size=14,
                    color="grey600"
                ),
            ], spacing=10),
            padding=20,
            bgcolor="white",
        )

        # Card: QR de Uso Único
        card_uso_unico = ft.Container(
            content=ft.Row([
                ft.Container(
                    content=ft.Icon(
                        ft.Icons.QR_CODE,
                        size=32,
                        color="teal600"
                    ),
                    padding=ft.padding.only(right=15),
                ),
                ft.Column([
                    ft.Text(
                        "QR de Uso Único",
                        size=16,
                        weight="bold",
                        color="grey900"
                    ),
                    ft.Text(
                        "Para una visita puntual. El código se invalida después del primer uso.",
                        size=13,
                        color="grey600"
                    ),
                ], spacing=4, expand=True),
                ft.Icon(
                    ft.Icons.CHEVRON_RIGHT,
                    size=24,
                    color="grey400"
                ),
            ], 
            vertical_alignment=ft.CrossAxisAlignment.CENTER,
            spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=8),
            bgcolor="#F5F5DC",  # Beige claro
            border_radius=12,
            border=ft.border.all(1, "grey300"),
            on_click=ir_qr_uso_unico,
        )

        # Card: QR de Usos Múltiples
        card_usos_multiples = ft.Container(
            content=ft.Row([
                ft.Container(
                    content=ft.Icon(
                        ft.Icons.REPEAT,
                        size=32,
                        color="teal600"
                    ),
                    padding=ft.padding.only(right=15),
                ),
                ft.Column([
                    ft.Text(
                        "QR de Usos Múltiples",
                        size=16,
                        weight="bold",
                        color="grey900"
                    ),
                    ft.Text(
                        "Para familiares o personal de servicio. Acceso válido por un rango de fechas.",
                        size=13,
                        color="grey600"
                    ),
                ], spacing=4, expand=True),
                ft.Icon(
                    ft.Icons.CHEVRON_RIGHT,
                    size=24,
                    color="grey400"
                ),
            ], 
            vertical_alignment=ft.CrossAxisAlignment.CENTER,
            spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=8),
            bgcolor="#F5F5DC",  # Beige claro
            border_radius=12,
            border=ft.border.all(1, "grey300"),
            on_click=ir_qr_usos_multiples,
        )

        # Card: Gestionar QRs Activos
        card_gestionar = ft.Container(
            content=ft.Row([
                ft.Container(
                    content=ft.Icon(
                        ft.Icons.LIST_ALT,
                        size=32,
                        color="teal600"
                    ),
                    padding=ft.padding.only(right=15),
                ),
                ft.Column([
                    ft.Text(
                        "Gestionar QRs Activos",
                        size=16,
                        weight="bold",
                        color="grey900"
                    ),
                    ft.Text(
                        "Revise, edite y revoque los códigos QR actualmente válidos que ha generado.",
                        size=13,
                        color="grey600"
                    ),
                ], spacing=4, expand=True),
                ft.Icon(
                    ft.Icons.CHEVRON_RIGHT,
                    size=24,
                    color="grey400"
                ),
            ], 
            vertical_alignment=ft.CrossAxisAlignment.CENTER,
            spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=8),
            bgcolor="#F5F5DC",  # Beige claro
            border_radius=12,
            border=ft.border.all(1, "grey300"),
            on_click=ir_gestionar_qrs,
        )

        # Configurar NavigationBar
        self.page.navigation_bar = ft.NavigationBar(
            destinations=[
                ft.NavigationBarDestination(
                    icon=ft.Icons.HOME_OUTLINED,
                    selected_icon=ft.Icons.HOME,
                    label="Inicio",
                ),
                ft.NavigationBarDestination(
                    icon=ft.Icons.CALENDAR_TODAY_OUTLINED,
                    selected_icon=ft.Icons.CALENDAR_TODAY,
                    label="Amenidades",
                ),
                ft.NavigationBarDestination(
                    icon=ft.Icons.RECEIPT_OUTLINED,
                    selected_icon=ft.Icons.RECEIPT,
                    label="Pagos",
                ),
                ft.NavigationBarDestination(
                    icon=ft.Icons.PERSON_OUTLINE,
                    selected_icon=ft.Icons.PERSON,
                    label="Perfil",
                ),
            ],
            on_change=on_navigation_change,
            bgcolor="grey100",
            selected_index=0,
            indicator_color="teal600",
        )

        # Contenido principal
        main_content = ft.Column([
            header,
            card_uso_unico,
            card_usos_multiples,
            card_gestionar,
            ft.Container(expand=True),  # Spacer
        ], spacing=0, scroll="auto", expand=True)
        
        # Contenedor con gestos de swipe
        swipe_container = ft.GestureDetector(
            content=main_content,
            on_horizontal_drag_end=self.on_swipe,
            drag_interval=50,
        )

        self.page.add(swipe_container)

    def on_swipe(self, e):
        """Maneja el gesto de swipe horizontal"""
        if e.velocity_x > 500:  # Swipe rápido a la derecha
            # Ir a Amenidades
            from amenidades import AmenidadesVista
            self.page.clean()
            AmenidadesVista(self.page, self.controlador.api_client)
            self.page.update()
        elif e.velocity_x < -500:  # Swipe rápido a la izquierda
            # Volver a Home
            from home import Homevista
            self.page.clean()
            Homevista(self.page, self.controlador.api_client)
            self.page.update()

