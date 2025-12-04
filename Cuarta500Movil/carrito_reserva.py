import flet as ft
from controller import Controlador
from token_storage import TokenStorage
from datetime import datetime

class CarritoReservaVista:
    def __init__(self, page: ft.Page, reservacion, amenidad, api_client=None):
        self.page = page
        self.page.title = "Condominio - Carrito de Reserva"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.scroll = ft.ScrollMode.AUTO
        self.page.clean()
        self.controlador = Controlador(page)
        if api_client:
            self.controlador.api_client = api_client
        self.reservacion = reservacion
        self.amenidad = amenidad
        self.build()
    
    def build(self):
        def volver_amenidades(e):
            from amenidades import AmenidadesVista
            self.page.clean()
            AmenidadesVista(self.page, self.controlador.api_client)
        
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
        
        def proceder_pago(e):
            """Crea la sesión de pago Stripe y redirige"""
            try:
                # Obtener datos necesarios
                reservacion_id = self.reservacion.get('_id') or self.reservacion.get('id')
                amenidad_id = self.amenidad.get('amenidad_id')
                servicios_extra = self.reservacion.get('servicios_extra', [])
                
                # Si es lista de objetos, extraer solo los nombres
                if servicios_extra and isinstance(servicios_extra[0], dict):
                    nombres_extras = [extra.get('nombre') for extra in servicios_extra if extra.get('nombre')]
                else:
                    nombres_extras = servicios_extra if isinstance(servicios_extra, list) else []
                
                if not amenidad_id:
                    mostrar_mensaje("Error: No se pudo obtener el ID de la amenidad", "error")
                    return
                
                # Deshabilitar botón
                btn_pagar.disabled = True
                btn_pagar.text = "Procesando..."
                self.page.update()
                
                # Crear sesión de pago Stripe
                exito, data, mensaje = self.controlador.api_client.crear_sesion_pago_reservacion(
                    amenidad_id=amenidad_id,
                    extras_seleccionados=nombres_extras,
                    reservacion_id=reservacion_id
                )
                
                if exito and data and data.get('url'):
                    # Abrir URL de Stripe en el navegador
                    import webbrowser
                    stripe_url = data.get('url')
                    mostrar_mensaje("Redirigiendo a Stripe para completar el pago...", "info")
                    webbrowser.open(stripe_url)
                    
                    # Mostrar mensaje de que debe volver después del pago
                    mostrar_mensaje("Completa el pago en Stripe y luego regresa a la app", "info")
                    btn_pagar.disabled = False
                    btn_pagar.text = "Proceder al Pago"
                    self.page.update()
                else:
                    mostrar_mensaje(f"Error al crear sesión de pago: {mensaje}", "error")
                    btn_pagar.disabled = False
                    btn_pagar.text = "Proceder al Pago"
                    self.page.update()
                    
            except Exception as ex:
                print(f"Error al proceder al pago: {ex}")
                import traceback
                traceback.print_exc()
                mostrar_mensaje(f"Error: {str(ex)}", "error")
                btn_pagar.disabled = False
                btn_pagar.text = "Proceder al Pago"
                self.page.update()
        
        # Obtener datos de la reserva
        nombre_amenidad = self.amenidad.get('nombre', 'Sin nombre')
        fecha_evento = self.reservacion.get('fecha_evento', '')
        total = self.reservacion.get('total', 0)
        servicios_extra = self.reservacion.get('servicios_extra', [])
        costo_base = self.amenidad.get('reglas_apartado', {}).get('costo_apartado', 0)
        
        # Calcular total de extras
        total_extras = 0
        if servicios_extra:
            if isinstance(servicios_extra[0], dict):
                # Si es lista de objetos con costo
                total_extras = sum(extra.get('costo', 0) for extra in servicios_extra)
            else:
                # Si es lista de nombres, buscar en extras_disponibles
                extras_disponibles = self.amenidad.get('reglas_apartado', {}).get('extras_disponibles', [])
                for extra_nombre in servicios_extra:
                    extra_info = next((e for e in extras_disponibles if e.get('nombre') == extra_nombre), None)
                    if extra_info:
                        total_extras += extra_info.get('costo', 0)
        
        # Header
        header = ft.Container(
            content=ft.Row([
                ft.IconButton(
                    icon=ft.Icons.ARROW_BACK,
                    on_click=volver_amenidades,
                    tooltip="Volver"
                ),
                ft.Text(
                    "Carrito de Reserva",
                    size=20,
                    weight="bold",
                    color="grey900"
                ),
                ft.Container(expand=True),
            ]),
            padding=20,
            bgcolor="white",
        )
        
        # Card de éxito
        exito_card = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Icon(ft.Icons.CHECK_CIRCLE, color="green600", size=32),
                    ft.Column([
                        ft.Text(
                            "¡Reservación Creada Exitosamente!",
                            size=18,
                            weight="bold",
                            color="grey900"
                        ),
                        ft.Text(
                            "Procede con el pago para confirmar",
                            size=14,
                            color="grey600"
                        ),
                    ], spacing=5, expand=True),
                ], spacing=15),
            ], spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="green50",
            border_radius=12,
            border=ft.border.all(2, "green200"),
        )
        
        # Card de detalles de reserva
        detalles_card = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Icon(ft.Icons.INFO_OUTLINE, color="teal600", size=20),
                    ft.Text(
                        "Detalles de la Reserva",
                        size=16,
                        weight="bold",
                        color="grey900"
                    ),
                ], spacing=10),
                ft.Divider(),
                ft.Row([
                    ft.Text("Amenidad:", size=14, color="grey600"),
                    ft.Container(expand=True),
                    ft.Text(nombre_amenidad, size=14, weight="w500", color="grey900"),
                ]),
                ft.Row([
                    ft.Text("Fecha del evento:", size=14, color="grey600"),
                    ft.Container(expand=True),
                    ft.Text(fecha_evento, size=14, weight="w500", color="grey900"),
                ]),
            ], spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="grey50",
            border_radius=12,
        )
        
        # Card del carrito
        carrito_items = []
        
        # Item: Costo base
        if costo_base > 0:
            carrito_items.append(
                ft.Container(
                    content=ft.Row([
                        ft.Icon(ft.Icons.MEETING_ROOM, color="teal600", size=24),
                        ft.Column([
                            ft.Text(
                                f"Reserva: {nombre_amenidad}",
                                size=14,
                                weight="w500",
                                color="grey900"
                            ),
                            ft.Text(
                                "Costo base por uso de amenidad",
                                size=12,
                                color="grey600"
                            ),
                        ], spacing=2, expand=True),
                        ft.Text(
                            f"${costo_base:,.2f}",
                            size=16,
                            weight="bold",
                            color="grey900"
                        ),
                    ], spacing=10),
                    padding=15,
                    margin=ft.margin.only(bottom=10),
                    bgcolor="white",
                    border_radius=8,
                    border=ft.border.all(1, "grey300"),
                )
            )
        
        # Items: Servicios extra
        if servicios_extra:
            extras_disponibles = self.amenidad.get('reglas_apartado', {}).get('extras_disponibles', [])
            for servicio in servicios_extra:
                if isinstance(servicio, dict):
                    nombre_servicio = servicio.get('nombre', 'Servicio extra')
                    costo_servicio = servicio.get('costo', 0)
                else:
                    # Es un nombre, buscar en extras_disponibles
                    nombre_servicio = servicio
                    extra_info = next((e for e in extras_disponibles if e.get('nombre') == servicio), None)
                    costo_servicio = extra_info.get('costo', 0) if extra_info else 0
                
                if costo_servicio > 0:
                    carrito_items.append(
                        ft.Container(
                            content=ft.Row([
                                ft.Icon(ft.Icons.ADD_CIRCLE_OUTLINE, color="teal600", size=24),
                                ft.Column([
                                    ft.Text(
                                        f"Extra: {nombre_servicio}",
                                        size=14,
                                        weight="w500",
                                        color="grey900"
                                    ),
                                    ft.Text(
                                        "Servicio adicional",
                                        size=12,
                                        color="grey600"
                                    ),
                                ], spacing=2, expand=True),
                                ft.Text(
                                    f"${costo_servicio:,.2f}",
                                    size=16,
                                    weight="bold",
                                    color="grey900"
                                ),
                            ], spacing=10),
                            padding=15,
                            margin=ft.margin.only(bottom=10),
                            bgcolor="white",
                            border_radius=8,
                            border=ft.border.all(1, "grey300"),
                        )
                    )
        
        if not carrito_items:
            carrito_items.append(
                ft.Container(
                    content=ft.Text(
                        "No hay items en el carrito",
                        size=14,
                        color="grey500",
                        text_align=ft.TextAlign.CENTER
                    ),
                    padding=20,
                    alignment=ft.alignment.center,
                )
            )
        
        carrito_card = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Icon(ft.Icons.SHOPPING_CART, color="teal600", size=24),
                    ft.Text(
                        "Carrito de Compra",
                        size=18,
                        weight="bold",
                        color="grey900"
                    ),
                ], spacing=10),
                ft.Divider(),
                ft.Column(carrito_items, spacing=0),
            ], spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="grey50",
            border_radius=12,
        )
        
        # Resumen de total
        resumen_card = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Text("Subtotal:", size=14, color="grey600"),
                    ft.Container(expand=True),
                    ft.Text(f"${total:,.2f}", size=14, color="grey900"),
                ]),
                ft.Divider(),
                ft.Row([
                    ft.Text("Total:", size=20, weight="bold", color="grey900"),
                    ft.Container(expand=True),
                    ft.Text(
                        f"${total:,.2f}",
                        size=24,
                        weight="bold",
                        color="teal600"
                    ),
                ]),
            ], spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="teal50",
            border_radius=12,
            border=ft.border.all(2, "teal200"),
        )
        
        # Botón proceder al pago
        btn_pagar = ft.ElevatedButton(
            "Proceder al Pago",
            icon=ft.Icons.PAYMENT,
            on_click=proceder_pago,
            bgcolor="teal600",
            color="white",
            expand=True,
            height=50,
            style=ft.ButtonStyle(
                shape=ft.RoundedRectangleBorder(radius=12)
            )
        )
        
        btn_container = ft.Container(
            content=btn_pagar,
            padding=ft.padding.symmetric(horizontal=20),
            margin=ft.margin.only(bottom=20),
        )
        
        # Contenido principal
        main_content = ft.Column([
            header,
            exito_card,
            detalles_card,
            carrito_card,
            resumen_card,
            btn_container,
            ft.Container(expand=True),
        ], spacing=0, scroll="auto", expand=True)
        
        self.page.add(main_content)

