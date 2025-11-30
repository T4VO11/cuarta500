import flet as ft
from controller import Controlador
from token_storage import TokenStorage

class Homevista:
    def __init__(self, page: ft.Page, api_client=None):
        self.page = page
        self.page.title = "Condominio - Inicio"
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
        # Obtener datos del usuario del token
        token, usuario_data = TokenStorage.get_token()
        nombre_usuario = "Usuario"
        ubicacion = "Torre B, Apto 402"
        
        # Intentar obtener nombre del usuario desde el token o datos guardados
        if usuario_data:
            if isinstance(usuario_data, dict):
                nombre_usuario = usuario_data.get('nombre', nombre_usuario)
                numero_casa = usuario_data.get('numero_casa', '')
                if numero_casa:
                    ubicacion = f"Torre B, Apto {numero_casa}"
        
        # Si no hay datos del usuario, intentar decodificar el token JWT
        if not usuario_data and token:
            try:
                import base64
                import json
                # Los tokens JWT tienen formato: header.payload.signature
                parts = token.split('.')
                if len(parts) >= 2:
                    # Decodificar el payload (sin verificar firma, solo para obtener datos)
                    payload = parts[1]
                    # Agregar padding si es necesario
                    payload += '=' * (4 - len(payload) % 4)
                    decoded = base64.urlsafe_b64decode(payload)
                    token_data = json.loads(decoded)
                    usuario_info = token_data.get('usuario', {})
                    if usuario_info:
                        # Usar username como nombre si no hay nombre
                        nombre_usuario = usuario_info.get('username', nombre_usuario)
            except Exception as e:
                print(f"Error al decodificar token: {e}")

        # Verificar si hay saldo pendiente
        tiene_saldo_pendiente = False
        saldo_pendiente = 0
        try:
            exito, adeudos, mensaje = self.controlador.api_client.obtener_mis_adeudos()
            if exito:
                for adeudo in adeudos:
                    if adeudo.get('estado') == 'pendiente':
                        tiene_saldo_pendiente = True
                        saldo_pendiente = adeudo.get('monto_base', 0) - adeudo.get('monto_total_pagado', 0)
                        break
        except Exception as e:
            print(f"Error al verificar saldo pendiente: {e}")

        def generar_acceso_qr(e):
            """Navega a la pantalla de opciones de generación de QR"""
            from opciones_qr import OpcionesQRVista
            self.page.clean()
            OpcionesQRVista(self.page, self.controlador.api_client)

        def pagar_administracion(e):
            """Navega a la pantalla de pagos"""
            from pagos import PagosVista
            self.page.clean()
            PagosVista(self.page, self.controlador.api_client)

        def reservar_area(e):
            """Navega a la pantalla de reservar amenidades"""
            from amenidades import AmenidadesVista
            self.page.clean()
            AmenidadesVista(self.page, self.controlador.api_client)

        def on_navigation_change(e):
            """Maneja el cambio de navegación"""
            selected_index = e.control.selected_index
            if selected_index == 0:
                # Ya estamos en inicio
                pass
            elif selected_index == 1:
                # Amenidades
                from amenidades import AmenidadesVista
                self.page.clean()
                AmenidadesVista(self.page, self.controlador.api_client)
            elif selected_index == 2:
                # Pagos
                from pagos import PagosVista
                self.page.clean()
                PagosVista(self.page, self.controlador.api_client)
            elif selected_index == 3:
                # Perfil
                from perfil import PerfilVista
                self.page.clean()
                PerfilVista(self.page, self.controlador.api_client)

        # Header con saludo y notificaciones
        header = ft.Container(
            content=ft.Row([
                ft.Column([
                    ft.Text(
                        f"Hola, {nombre_usuario}",
                        size=24,
                        weight="bold",
                        color="grey900"
                    ),
                    ft.Text(
                        ubicacion,
                        size=14,
                        color="grey600"
                    ),
                ], spacing=2),
                ft.Container(expand=True),  # Spacer
                ft.IconButton(
                    icon=ft.Icons.NOTIFICATIONS_OUTLINED,
                    icon_size=24,
                    tooltip="Notificaciones",
                    on_click=lambda e: print("Abrir notificaciones")
                )
            ]),
            padding=20,
            bgcolor="white",
        )

        # Card de Estado de Seguridad (cambia según saldo pendiente)
        if tiene_saldo_pendiente:
            security_bg = "orange50"
            security_border = "orange200"
            security_icon_bg = "orange700"
            security_icon = ft.Icons.WARNING
            security_text = f"Tienes un saldo pendiente de $ {saldo_pendiente:,.0f}"
            security_subtitle = "Pago pendiente"
        else:
            security_bg = "green50"
            security_border = "green200"
            security_icon_bg = "green700"
            security_icon = ft.Icons.SHIELD
            security_text = "Todo en orden en tu hogar"
            security_subtitle = "Estado de Seguridad"

        security_card = ft.Container(
            content=ft.Row([
                ft.Container(
                    content=ft.Stack([
                        ft.Container(
                            width=50,
                            height=50,
                            bgcolor=security_icon_bg,
                            border_radius=25,
                        ),
                        ft.Container(
                            content=ft.Icon(
                                security_icon,
                                color="white",
                                size=30
                            ),
                            width=50,
                            height=50,
                            alignment=ft.alignment.center,
                        ),
                        ft.Container(
                            content=ft.Icon(
                                ft.Icons.CHECK if not tiene_saldo_pendiente else ft.Icons.ERROR,
                                color="white",
                                size=16
                            ),
                            width=50,
                            height=50,
                            alignment=ft.alignment.bottom_right,
                            padding=ft.padding.only(bottom=2, right=2),
                        ),
                    ],
                    width=50,
                    height=50),
                    margin=ft.margin.only(right=15),
                ),
                ft.Column([
                    ft.Text(
                        security_subtitle,
                        size=14,
                        color="grey600"
                    ),
                    ft.Text(
                        security_text,
                        size=18,
                        weight="bold",
                        color="grey900"
                    ),
                ], spacing=2, expand=True, alignment=ft.MainAxisAlignment.CENTER)
            ],
            vertical_alignment=ft.CrossAxisAlignment.CENTER),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor=security_bg,
            border_radius=12,
            border=ft.border.all(1, security_border),
            on_click=pagar_administracion if tiene_saldo_pendiente else None,
        )

        # Banner de alerta si hay saldo pendiente
        alerta_banner = None
        if tiene_saldo_pendiente:
            alerta_banner = ft.Container(
                content=ft.Row([
                    ft.Icon(ft.Icons.WARNING, color="orange700", size=24),
                    ft.Column([
                        ft.Text(
                            "Tienes un pago pendiente",
                            size=14,
                            weight="bold",
                            color="orange900"
                        ),
                        ft.Text(
                            f"Saldo: $ {saldo_pendiente:,.0f}",
                            size=12,
                            color="orange700"
                        ),
                    ], spacing=2, expand=True),
                    ft.ElevatedButton(
                        "Pagar",
                        on_click=pagar_administracion,
                        bgcolor="orange600",
                        color="white",
                        height=35,
                    ),
                ], spacing=10),
                padding=15,
                margin=ft.margin.symmetric(horizontal=20, vertical=5),
                bgcolor="orange100",
                border_radius=12,
                border=ft.border.all(1, "orange300"),
            )

        # Título de Accesos Rápidos
        quick_access_title = ft.Container(
            content=ft.Text(
                "Accesos Rápidos",
                size=18,
                weight="bold",
                color="grey900"
            ),
            padding=ft.padding.only(left=20, right=20, bottom=10),
        )

        # Card: Generar Acceso QR (bloqueado si hay saldo pendiente)
        qr_card = ft.Container(
            content=ft.Column([
                ft.Icon(
                    ft.Icons.VIEW_QUILT,
                    size=32,
                    color="teal600" if not tiene_saldo_pendiente else "grey400"
                ),
                ft.Text(
                    "Generar Acceso QR",
                    size=16,
                    weight="w500",
                    color="teal600" if not tiene_saldo_pendiente else "grey400",
                    text_align=ft.TextAlign.CENTER
                ),
                ft.Text(
                    "Pago pendiente requerido" if tiene_saldo_pendiente else "",
                    size=12,
                    color="red600",
                    visible=tiene_saldo_pendiente,
                    text_align=ft.TextAlign.CENTER
                ),
            ], 
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            alignment=ft.MainAxisAlignment.CENTER,
            spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=5),
            bgcolor="white",
            border_radius=12,
            border=ft.border.all(1, "grey300" if not tiene_saldo_pendiente else "red300"),
            on_click=generar_acceso_qr if not tiene_saldo_pendiente else lambda e: self.mostrar_mensaje_pago_pendiente(),
            alignment=ft.alignment.center,
            opacity=0.6 if tiene_saldo_pendiente else 1.0,
        )

        # Card: Pagar Administración
        payment_card = ft.Container(
            content=ft.Column([
                ft.Icon(
                    ft.Icons.ACCOUNT_BALANCE,
                    size=32,
                    color="teal600"
                ),
                ft.Text(
                    "Pagar Administración",
                    size=16,
                    weight="w500",
                    color="teal600",
                    text_align=ft.TextAlign.CENTER
                ),
            ],
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            alignment=ft.MainAxisAlignment.CENTER,
            spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=5),
            bgcolor="white",
            border_radius=12,
            border=ft.border.all(1, "grey300"),
            on_click=pagar_administracion,
            alignment=ft.alignment.center,
        )

        # Card: Reservar Área (bloqueado si hay saldo pendiente)
        reserve_card = ft.Container(
            content=ft.Column([
                ft.Icon(
                    ft.Icons.CALENDAR_TODAY,
                    size=32,
                    color="teal600" if not tiene_saldo_pendiente else "grey400"
                ),
                ft.Text(
                    "Reservar Área",
                    size=16,
                    weight="w500",
                    color="teal600" if not tiene_saldo_pendiente else "grey400",
                    text_align=ft.TextAlign.CENTER
                ),
                ft.Text(
                    "Pago pendiente requerido" if tiene_saldo_pendiente else "",
                    size=12,
                    color="red600",
                    visible=tiene_saldo_pendiente,
                    text_align=ft.TextAlign.CENTER
                ),
            ],
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            alignment=ft.MainAxisAlignment.CENTER,
            spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=5),
            bgcolor="white",
            border_radius=12,
            border=ft.border.all(1, "grey300" if not tiene_saldo_pendiente else "red300"),
            on_click=reservar_area if not tiene_saldo_pendiente else lambda e: self.mostrar_mensaje_pago_pendiente(),
            alignment=ft.alignment.center,
            opacity=0.6 if tiene_saldo_pendiente else 1.0,
        )

        # Título de Avisos Recientes
        notices_title = ft.Container(
            content=ft.Text(
                "Avisos Recientes",
                size=18,
                weight="bold",
                color="grey900"
            ),
            padding=ft.padding.only(left=20, right=20, bottom=10),
        )

        # Sección de Avisos (vacía por ahora)
        notices_section = ft.Container(
            content=ft.Column([
                ft.Text(
                    "No hay avisos recientes",
                    size=14,
                    color="grey500",
                    text_align=ft.TextAlign.CENTER
                ),
            ]),
            padding=20,
            margin=ft.margin.only(left=20, right=20, bottom=20),
            bgcolor="white",
            border_radius=12,
            border=ft.border.all(1, "grey300"),
            alignment=ft.alignment.center,
            height=100,
        )

        # Configurar NavigationBar con 4 opciones
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
        contenido_lista = [header]
        
        # Agregar banner de alerta si hay saldo pendiente
        if alerta_banner:
            contenido_lista.append(alerta_banner)
        
        contenido_lista.extend([
            security_card,
            quick_access_title,
            qr_card,
            payment_card,
            reserve_card,
            notices_title,
            notices_section,
            ft.Container(expand=True),  # Spacer
        ])
        
        main_content = ft.Column(contenido_lista, spacing=0, scroll="auto", expand=True)
        
        # Contenedor con gestos de swipe (solo detecta gestos horizontales, permite scroll vertical)
        swipe_container = ft.GestureDetector(
            content=main_content,
            on_horizontal_drag_end=self.on_swipe,
            drag_interval=50,
        )

        # Estructura completa de la página
        self.page.add(swipe_container)

    def mostrar_mensaje_pago_pendiente(self):
        """Muestra un mensaje cuando se intenta usar una función bloqueada"""
        snackbar = ft.SnackBar(
            content=ft.Text("Debes liquidar tu saldo pendiente para usar esta función"),
            bgcolor="orange600",
            action="Ir a Pagos",
            action_color="white",
            on_action=lambda e: self.ir_a_pagos(),
        )
        self.page.snack_bar = snackbar
        snackbar.open = True
        self.page.update()

    def ir_a_pagos(self):
        """Navega a la pantalla de pagos"""
        from pagos import PagosVista
        self.page.clean()
        PagosVista(self.page, self.controlador.api_client)
        self.page.update()
    
    def on_swipe(self, e):
        """Maneja el gesto de swipe horizontal"""
        if e.velocity_x > 500:  # Swipe rápido a la derecha
            # Ir a Amenidades
            from amenidades import AmenidadesVista
            self.page.clean()
            AmenidadesVista(self.page, self.controlador.api_client)
            self.page.update()
        elif e.velocity_x < -500:  # Swipe rápido a la izquierda
            # Ya estamos en Home, no hay vista anterior
            pass