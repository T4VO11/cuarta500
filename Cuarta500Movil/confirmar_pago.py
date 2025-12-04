import flet as ft
from controller import Controlador
from token_storage import TokenStorage

class ConfirmarPagoVista:
    def __init__(self, page: ft.Page, tipo_pago="reservacion", api_client=None):
        self.page = page
        self.page.title = "Condominio - Confirmar Pago"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.scroll = ft.ScrollMode.AUTO
        self.page.clean()
        self.controlador = Controlador(page)
        if api_client:
            self.controlador.api_client = api_client
        self.tipo_pago = tipo_pago  # "reservacion" o "mantenimiento"
        self.build()
    
    def build(self):
        def volver_home(e):
            from home import Homevista
            self.page.clean()
            Homevista(self.page, self.controlador.api_client)
        
        def volver_amenidades(e):
            from amenidades import AmenidadesVista
            self.page.clean()
            AmenidadesVista(self.page, self.controlador.api_client)
        
        def volver_pagos(e):
            from pagos import PagosVista
            self.page.clean()
            PagosVista(self.page, self.controlador.api_client)
        
        def confirmar_pago(e):
            """Confirma el pago con Stripe usando el session_id"""
            session_id = session_id_input.value.strip() if session_id_input.value else ""
            
            if not session_id:
                mostrar_mensaje("Por favor ingresa el Session ID de Stripe", "error")
                return
            
            # Deshabilitar botón
            btn_confirmar.disabled = True
            btn_confirmar.text = "Confirmando pago..."
            self.page.update()
            
            try:
                if self.tipo_pago == "reservacion":
                    exito, data, mensaje = self.controlador.api_client.confirmar_pago_reservacion(session_id)
                else:  # mantenimiento
                    exito, data, mensaje = self.controlador.api_client.confirmar_pago_mantenimiento(session_id)
                
                if exito:
                    mostrar_mensaje("¡Pago confirmado exitosamente!", "exito")
                    # Volver después de un momento
                    import threading
                    if self.tipo_pago == "reservacion":
                        threading.Timer(2.0, lambda: volver_amenidades(None)).start()
                    else:
                        threading.Timer(2.0, lambda: volver_pagos(None)).start()
                else:
                    mostrar_mensaje(f"Error al confirmar pago: {mensaje}", "error")
                    btn_confirmar.disabled = False
                    btn_confirmar.text = "Confirmar Pago"
                    self.page.update()
            except Exception as ex:
                print(f"Error al confirmar pago: {ex}")
                import traceback
                traceback.print_exc()
                mostrar_mensaje(f"Error: {str(ex)}", "error")
                btn_confirmar.disabled = False
                btn_confirmar.text = "Confirmar Pago"
                self.page.update()
        
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
                self.page.update()
            except Exception as ex:
                print(f"Error al mostrar mensaje: {str(ex)}")
        
        # Header
        header = ft.Container(
            content=ft.Row([
                ft.IconButton(
                    icon=ft.Icons.ARROW_BACK,
                    on_click=volver_home,
                    tooltip="Volver"
                ),
                ft.Text(
                    "Confirmar Pago",
                    size=20,
                    weight="bold",
                    color="grey900"
                ),
                ft.Container(expand=True),
            ]),
            padding=20,
            bgcolor="white",
        )
        
        # Card de instrucciones
        instrucciones_card = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Icon(ft.Icons.INFO_OUTLINE, color="teal600", size=24),
                    ft.Text(
                        "Instrucciones",
                        size=18,
                        weight="bold",
                        color="grey900"
                    ),
                ], spacing=10),
                ft.Divider(),
                ft.Text(
                    "1. Completa el pago en Stripe",
                    size=14,
                    color="grey700"
                ),
                ft.Text(
                    "2. Copia el Session ID de la URL de Stripe",
                    size=14,
                    color="grey700"
                ),
                ft.Text(
                    "3. Pega el Session ID aquí y confirma",
                    size=14,
                    color="grey700"
                ),
                ft.Divider(),
                ft.Text(
                    "El Session ID se encuentra en la URL después de 'session_id='",
                    size=12,
                    color="grey600",
                    italic=True
                ),
            ], spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="teal50",
            border_radius=12,
            border=ft.border.all(1, "teal200"),
        )
        
        # Campo de Session ID
        session_id_input = ft.TextField(
            label="Session ID de Stripe",
            hint_text="cs_test_...",
            prefix_icon=ft.Icons.PAYMENT,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True,
        )
        
        session_id_container = ft.Container(
            content=session_id_input,
            padding=ft.padding.symmetric(horizontal=20),
            margin=ft.margin.only(bottom=20),
        )
        
        # Botón confirmar
        btn_confirmar = ft.ElevatedButton(
            "Confirmar Pago",
            icon=ft.Icons.CHECK_CIRCLE,
            on_click=confirmar_pago,
            bgcolor="teal600",
            color="white",
            expand=True,
            height=50,
            style=ft.ButtonStyle(
                shape=ft.RoundedRectangleBorder(radius=12)
            )
        )
        
        btn_container = ft.Container(
            content=btn_confirmar,
            padding=ft.padding.symmetric(horizontal=20),
            margin=ft.margin.only(bottom=20),
        )
        
        # Contenido principal
        main_content = ft.Column([
            header,
            instrucciones_card,
            session_id_container,
            btn_container,
            ft.Container(expand=True),
        ], spacing=0, scroll="auto", expand=True)
        
        self.page.add(main_content)

