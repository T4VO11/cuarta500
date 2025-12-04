import flet as ft
from controller import Controlador
from token_storage import TokenStorage
from datetime import datetime

class PagosVista:
    def __init__(self, page: ft.Page, api_client=None):
        self.page = page
        self.page.title = "Condominio - Pagos"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.scroll = ft.ScrollMode.AUTO
        self.page.clean()
        self.controlador = Controlador(page)
        if api_client:
            self.controlador.api_client = api_client
        self.adeudos = []
        self.build()

    def build(self):
        def volver_home(e):
            from home import Homevista
            self.page.clean()
            Homevista(self.page, self.controlador.api_client)

        def realizar_pago(e):
            """Inicia el proceso de pago con Stripe"""
            try:
                # Obtener datos del usuario
                token, usuario_data = TokenStorage.get_token()
                if not token:
                    mostrar_mensaje("No estás autenticado. Por favor inicia sesión.", "error")
                    return
                
                # Obtener usuario_id del token
                usuario_id = None
                nombre_usuario = "Usuario"
                numero_casa = ""
                
                try:
                    import base64
                    import json
                    parts = token.split('.')
                    if len(parts) >= 2:
                        payload = parts[1]
                        payload += '=' * (4 - len(payload) % 4)
                        decoded = base64.urlsafe_b64decode(payload)
                        token_data = json.loads(decoded)
                        usuario_info = token_data.get('usuario', {})
                        usuario_id = usuario_info.get('usuario_id')
                except Exception as ex:
                    print(f"Error al decodificar token: {ex}")
                
                # Obtener datos del perfil si es necesario
                if self.controlador.api_client:
                    try:
                        exito, perfil, mensaje = self.controlador.api_client.obtener_mi_perfil()
                        if exito and perfil:
                            nombre = perfil.get('nombre', '')
                            apellido_paterno = perfil.get('apellido_paterno', '')
                            apellido_materno = perfil.get('apellido_materno', '')
                            nombre_usuario = ' '.join([nombre, apellido_paterno, apellido_materno]).strip() or perfil.get('username', 'Usuario')
                            numero_casa = perfil.get('numero_casa', '')
                    except Exception as ex:
                        print(f"Error al obtener perfil: {ex}")
                
                if not usuario_id:
                    mostrar_mensaje("No se pudo obtener el ID del usuario", "error")
                    return
                
                if not nombre_usuario or nombre_usuario == "Usuario":
                    mostrar_mensaje("No se pudo obtener el nombre del usuario", "error")
                    return
                
                if not numero_casa:
                    mostrar_mensaje("No se pudo obtener el número de casa. Por favor completa tu perfil.", "error")
                    return
                
                # Calcular periodo (mes y año actual)
                from datetime import datetime
                now = datetime.now()
                periodo_cubierto = f"{now.year}-{now.month:02d}"
                
                # Deshabilitar botón
                btn_realizar_pago.content.disabled = True
                btn_realizar_pago.content.text = "Procesando..."
                self.page.update()
                
                # Crear sesión de pago Stripe
                exito, data, mensaje = self.controlador.api_client.crear_sesion_pago_mantenimiento(
                    nombre=nombre_usuario,
                    numero_casa=numero_casa,
                    periodo_cubierto=periodo_cubierto,
                    usuario_id=usuario_id
                )
                
                if exito and data and data.get('url'):
                    # Abrir URL de Stripe en el navegador
                    import webbrowser
                    stripe_url = data.get('url')
                    mostrar_mensaje("Redirigiendo a Stripe para completar el pago...", "info")
                    webbrowser.open(stripe_url)
                    
                    # Mostrar mensaje de que debe volver después del pago
                    mostrar_mensaje("Completa el pago en Stripe y luego regresa a la app", "info")
                    btn_realizar_pago.content.disabled = False
                    btn_realizar_pago.content.text = "Realizar Pago"
                    self.page.update()
                else:
                    mostrar_mensaje(f"Error al crear sesión de pago: {mensaje}", "error")
                    btn_realizar_pago.content.disabled = False
                    btn_realizar_pago.content.text = "Realizar Pago"
                    self.page.update()
                    
            except Exception as ex:
                print(f"Error al realizar pago: {ex}")
                import traceback
                traceback.print_exc()
                mostrar_mensaje(f"Error: {str(ex)}", "error")
                btn_realizar_pago.content.disabled = False
                btn_realizar_pago.content.text = "Realizar Pago"
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

        def on_navigation_change(e):
            """Maneja el cambio de navegación"""
            selected_index = e.control.selected_index
            if selected_index == 0:
                from home import Homevista
                self.page.clean()
                Homevista(self.page, self.controlador.api_client)
            elif selected_index == 1:
                # Amenidades
                from amenidades import AmenidadesVista
                self.page.clean()
                AmenidadesVista(self.page, self.controlador.api_client)
            elif selected_index == 2:
                # Ya estamos en pagos
                pass
            elif selected_index == 3:
                # Perfil
                try:
                    from perfil import PerfilVista
                    self.page.clean()
                    PerfilVista(self.page, self.controlador.api_client)
                except Exception as ex:
                    print(f"Error al navegar a perfil: {ex}")
                    import traceback
                    traceback.print_exc()
                    # Reintentar
                    try:
                        PerfilVista(self.page, self.controlador.api_client)
                    except:
                        pass

        # Cargar adeudos
        self.cargar_adeudos()

        # Header
        header = ft.Container(
            content=ft.Row([
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
            padding=20,
            bgcolor="white",
        )

        # Obtener adeudo pendiente más reciente
        adeudo_pendiente = None
        for adeudo in self.adeudos:
            if adeudo.get('estado') == 'pendiente':
                adeudo_pendiente = adeudo
                break

        # Card: Estado de Cuenta
        saldo_pendiente = adeudo_pendiente.get('monto_base', 0) - adeudo_pendiente.get('monto_total_pagado', 0) if adeudo_pendiente else 0
        fecha_vencimiento_raw = adeudo_pendiente.get('fecha_limite_pago', '') if adeudo_pendiente else ''
        fecha_ultimo_pago_raw = ''
        monto_ultimo_pago = 0

        # Buscar último pago completado
        for adeudo in self.adeudos:
            if adeudo.get('estado') in ['pagado', 'confirmado']:
                fecha_ultimo_pago_raw = adeudo.get('fecha_pago', '')
                monto_ultimo_pago = adeudo.get('monto_total_pagado', 0)
                break

        # Formatear fechas
        def formatear_fecha(fecha_str):
            if not fecha_str:
                return "No disponible"
            try:
                # Intentar diferentes formatos
                formatos = ['%Y-%m-%d', '%Y/%m/%d', '%d-%m-%Y', '%d/%m/%Y']
                fecha_obj = None
                for formato in formatos:
                    try:
                        fecha_obj = datetime.strptime(fecha_str, formato)
                        break
                    except:
                        continue
                
                if fecha_obj:
                    meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
                    return f"{fecha_obj.day} de {meses[fecha_obj.month-1]} de {fecha_obj.year}"
                return fecha_str
            except:
                return fecha_str

        fecha_vencimiento = formatear_fecha(fecha_vencimiento_raw)
        fecha_ultimo_pago = formatear_fecha(fecha_ultimo_pago_raw)

        estado_cuenta_card = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Text(
                        "Estado de Cuenta",
                        size=18,
                        weight="bold",
                        color="grey900"
                    ),
                    ft.Container(expand=True),
                    ft.Container(
                        content=ft.Text(
                            "Pendiente",
                            size=12,
                            weight="w500",
                            color="grey700"
                        ),
                        bgcolor="yellow100",
                        padding=ft.padding.symmetric(horizontal=10, vertical=5),
                        border_radius=12,
                    )
                ]),
                ft.Divider(),
                ft.Row([
                    ft.Text(
                        "Saldo Pendiente",
                        size=14,
                        color="grey600"
                    ),
                ]),
                ft.Text(
                    f"$ {saldo_pendiente:,.0f}",
                    size=32,
                    weight="bold",
                    color="teal600"
                ),
                ft.Row([
                    ft.Column([
                        ft.Row([
                            ft.Icon(ft.Icons.CALENDAR_TODAY, size=16, color="grey600"),
                            ft.Text("Vencimiento", size=12, color="grey600"),
                        ], spacing=5),
                        ft.Text(
                            fecha_vencimiento,
                            size=14,
                            weight="w500",
                            color="grey900"
                        ),
                    ], spacing=5, expand=True),
                    ft.Column([
                        ft.Row([
                            ft.Icon(ft.Icons.CHECK_CIRCLE, size=16, color="grey600"),
                            ft.Text("Último Pago", size=12, color="grey600"),
                        ], spacing=5),
                        ft.Text(
                            fecha_ultimo_pago,
                            size=14,
                            weight="w500",
                            color="grey900"
                        ),
                    ], spacing=5, expand=True),
                ], spacing=10),
                ft.Row([
                    ft.Text(
                        "Monto del Último Pago",
                        size=12,
                        color="grey600"
                    ),
                ]),
                ft.Text(
                    f"$ {monto_ultimo_pago:,.0f}" if monto_ultimo_pago > 0 else "No hay pagos",
                    size=16,
                    weight="w500",
                    color="grey900"
                ),
            ], spacing=12),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="grey50",
            border_radius=12,
        )

        # Botón Realizar Pago
        btn_realizar_pago = ft.Container(
            content=ft.ElevatedButton(
                "Realizar Pago",
                icon=ft.Icons.PAYMENT,
                on_click=realizar_pago,
                bgcolor="teal600",
                color="white",
                style=ft.ButtonStyle(
                    shape=ft.RoundedRectangleBorder(radius=12)
                ),
                height=50,
            ),
            padding=ft.padding.symmetric(horizontal=20),
            margin=ft.margin.only(bottom=20),
        )

        # Sección: Historial de Pagos
        historial_title = ft.Container(
            content=ft.Text(
                "Historial de Pagos",
                size=18,
                weight="bold",
                color="grey900"
            ),
            padding=ft.padding.only(left=20, right=20, bottom=10),
        )

        # Lista de pagos
        pagos_completados = [a for a in self.adeudos if a.get('estado') in ['pagado', 'confirmado']]
        
        if not pagos_completados:
            historial_content = ft.Container(
                content=ft.Text(
                    "No hay historial de pagos",
                    size=14,
                    color="grey500",
                    text_align=ft.TextAlign.CENTER
                ),
                padding=20,
                margin=ft.margin.symmetric(horizontal=20),
                bgcolor="white",
                border_radius=12,
                border=ft.border.all(1, "grey300"),
                alignment=ft.alignment.center,
                height=100,
            )
        else:
            historial_items = []
            for pago in pagos_completados[:5]:  # Mostrar últimos 5
                metodo_pago = pago.get('pasarela_pago', {}).get('nombre', 'Transferencia Bancaria')
                if not metodo_pago:
                    metodo_pago = 'Transferencia Bancaria'
                
                fecha_pago = pago.get('fecha_pago', '')
                monto = pago.get('monto_total_pagado', 0)
                estado = pago.get('estado', 'completado')
                
                # Formatear fecha
                fecha_formateada = fecha_pago
                if fecha_pago:
                    try:
                        formatos = ['%Y-%m-%d', '%Y/%m/%d', '%d-%m-%Y', '%d/%m/%Y']
                        fecha_obj = None
                        for formato in formatos:
                            try:
                                fecha_obj = datetime.strptime(fecha_pago, formato)
                                break
                            except:
                                continue
                        
                        if fecha_obj:
                            meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                                    'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
                            fecha_formateada = f"{fecha_obj.day} de {meses[fecha_obj.month-1]} de {fecha_obj.year}"
                    except:
                        pass

                historial_items.append(
                    ft.Container(
                        content=ft.Row([
                            ft.Icon(
                                ft.Icons.CHECK_CIRCLE,
                                color="green600",
                                size=24
                            ),
                            ft.Column([
                                ft.Text(
                                    metodo_pago,
                                    size=14,
                                    weight="w500",
                                    color="grey900"
                                ),
                                ft.Text(
                                    f"{fecha_formateada} • Completado",
                                    size=12,
                                    color="grey600"
                                ),
                            ], spacing=2, expand=True),
                            ft.Text(
                                f"$ {monto:,.0f}",
                                size=14,
                                weight="w500",
                                color="grey900"
                            ),
                        ], spacing=10),
                        padding=15,
                        margin=ft.margin.only(bottom=10),
                        bgcolor="white",
                        border_radius=12,
                        border=ft.border.all(1, "grey300"),
                    )
                )

            historial_content = ft.Container(
                content=ft.Column(historial_items),
                padding=20,
                margin=ft.margin.symmetric(horizontal=20),
                bgcolor="grey50",
                border_radius=12,
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
            selected_index=2,
            indicator_color="teal600",
        )

        # Contenido principal
        main_content = ft.Column([
            header,
            estado_cuenta_card,
            btn_realizar_pago,
            historial_title,
            historial_content,
        ], spacing=0, scroll="auto", expand=True)
        
        # Contenedor con gestos de swipe (solo detecta gestos horizontales, permite scroll vertical)
        swipe_container = ft.GestureDetector(
            content=main_content,
            on_horizontal_drag_end=self.on_swipe,
            drag_interval=50,
        )

        self.page.add(swipe_container)

    def cargar_adeudos(self):
        """Carga los adeudos del usuario desde el backend"""
        try:
            exito, adeudos, mensaje = self.controlador.api_client.obtener_mis_adeudos()
            if exito:
                self.adeudos = adeudos
            else:
                print(f"Error al cargar adeudos: {mensaje}")
                self.adeudos = []
        except Exception as e:
            print(f"Error al cargar adeudos: {e}")
            self.adeudos = []
    
    def on_swipe(self, e):
        """Maneja el gesto de swipe horizontal"""
        if e.velocity_x > 500:  # Swipe rápido a la derecha
            # Ir a Perfil
            from perfil import PerfilVista
            self.page.clean()
            PerfilVista(self.page, self.controlador.api_client)
        elif e.velocity_x < -500:  # Swipe rápido a la izquierda
            # Ir a Amenidades
            from amenidades import AmenidadesVista
            self.page.clean()
            AmenidadesVista(self.page, self.controlador.api_client)
            self.page.update()

