import flet as ft
from controller import Controlador
from token_storage import TokenStorage
from datetime import datetime

class DetalleReservaVista:
    def __init__(self, page: ft.Page, reservacion, amenidad=None, api_client=None):
        self.page = page
        self.page.title = "Condominio - Detalle de Reserva"
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
        
        def pagar_reserva(e):
            """Procede al pago de la reserva con Stripe"""
            try:
                # Obtener datos necesarios
                reservacion_id = self.reservacion.get('_id') or self.reservacion.get('id')
                
                # Necesitamos obtener la amenidad si no la tenemos
                amenidad_id = None
                if self.amenidad:
                    amenidad_id = self.amenidad.get('amenidad_id')
                else:
                    # Intentar obtener todas las amenidades y buscar la que coincida
                    mostrar_mensaje("Cargando información de la amenidad...", "info")
                    try:
                        exito, amenidades, mensaje = self.controlador.api_client.obtener_amenidades_disponibles()
                        if exito and amenidades:
                            # Buscar amenidad que tenga los mismos extras disponibles
                            nombres_extras_reserva = []
                            if servicios_extra:
                                if isinstance(servicios_extra[0], dict):
                                    nombres_extras_reserva = [e.get('nombre') for e in servicios_extra if e.get('nombre')]
                                else:
                                    nombres_extras_reserva = servicios_extra
                            
                            # Buscar amenidad que tenga estos extras
                            amenidad_encontrada = None
                            for amenidad in amenidades:
                                extras_disponibles = amenidad.get('reglas_apartado', {}).get('extras_disponibles', [])
                                nombres_extras_amenidad = [e.get('nombre') for e in extras_disponibles if e.get('nombre')]
                                
                                # Si todos los extras de la reserva están en esta amenidad
                                if nombres_extras_reserva and all(nombre in nombres_extras_amenidad for nombre in nombres_extras_reserva):
                                    amenidad_encontrada = amenidad
                                    break
                            
                            # Si no encontramos por extras, usar la primera disponible
                            if not amenidad_encontrada and amenidades:
                                amenidad_encontrada = amenidades[0]
                            
                            if amenidad_encontrada:
                                self.amenidad = amenidad_encontrada
                                amenidad_id = self.amenidad.get('amenidad_id')
                                print(f"Amenidad encontrada: {self.amenidad.get('nombre')}")
                    except Exception as ex:
                        print(f"Error al obtener amenidades: {ex}")
                
                if not amenidad_id:
                    mostrar_mensaje("Error: No se pudo obtener la información de la amenidad. Por favor contacta al administrador.", "error")
                    return
                
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
                    btn_pagar.text = "Pagar Reserva"
                    self.page.update()
                else:
                    mostrar_mensaje(f"Error al crear sesión de pago: {mensaje}", "error")
                    btn_pagar.disabled = False
                    btn_pagar.text = "Pagar Reserva"
                    self.page.update()
                    
            except Exception as ex:
                print(f"Error al pagar reserva: {ex}")
                import traceback
                traceback.print_exc()
                mostrar_mensaje(f"Error: {str(ex)}", "error")
                btn_pagar.disabled = False
                btn_pagar.text = "Pagar Reserva"
                self.page.update()
        
        def cancelar_reserva(e):
            """Cancela la reserva"""
            def confirmar_cancelacion(e):
                try:
                    # Obtener ID de la reserva
                    reservacion_id = self.reservacion.get('_id') or self.reservacion.get('id')
                    if not reservacion_id:
                        mostrar_mensaje("Error: No se pudo obtener el ID de la reserva", "error")
                        dialog.open = False
                        self.page.update()
                        return
                    
                    # Deshabilitar botón
                    btn_confirmar_cancelar.disabled = True
                    btn_confirmar_cancelar.text = "Cancelando..."
                    self.page.update()
                    
                    # Cancelar reserva
                    exito, data, mensaje = self.controlador.api_client.cancelar_reservacion(reservacion_id)
                    
                    if exito:
                        mostrar_mensaje("Reserva cancelada exitosamente", "exito")
                        dialog.open = False
                        self.page.update()
                        # Volver a amenidades después de un momento
                        import threading
                        threading.Timer(1.5, lambda: volver_amenidades(None)).start()
                    else:
                        mostrar_mensaje(f"Error al cancelar reserva: {mensaje}", "error")
                        btn_confirmar_cancelar.disabled = False
                        btn_confirmar_cancelar.text = "Confirmar"
                        self.page.update()
                        
                except Exception as ex:
                    print(f"Error al cancelar reserva: {ex}")
                    import traceback
                    traceback.print_exc()
                    mostrar_mensaje(f"Error: {str(ex)}", "error")
                    btn_confirmar_cancelar.disabled = False
                    btn_confirmar_cancelar.text = "Confirmar"
                    self.page.update()
            
            # Crear diálogo de confirmación
            btn_confirmar_cancelar = ft.ElevatedButton(
                "Confirmar",
                icon=ft.Icons.CHECK,
                on_click=confirmar_cancelacion,
                bgcolor="red600",
                color="white"
            )
            
            btn_cancelar_dialog = ft.ElevatedButton(
                "No, mantener reserva",
                on_click=lambda e: setattr(dialog, 'open', False) or self.page.update(),
                bgcolor="grey400",
                color="white"
            )
            
            dialog = ft.AlertDialog(
                modal=True,
                title=ft.Text("¿Cancelar Reserva?"),
                content=ft.Text("¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer."),
                actions=[
                    btn_cancelar_dialog,
                    btn_confirmar_cancelar,
                ],
                actions_alignment=ft.MainAxisAlignment.END,
            )
            
            self.page.dialog = dialog
            dialog.open = True
            self.page.update()
        
        # Obtener datos de la reserva
        nombre_residente = self.reservacion.get('nombre_residente', '')
        fecha_evento = self.reservacion.get('fecha_evento', '')
        total = self.reservacion.get('total', 0)
        estado = self.reservacion.get('estado', 'pendiente')
        estado_pago = self.reservacion.get('estado_pago', 'pendiente')
        servicios_extra = self.reservacion.get('servicios_extra', [])
        
        # Obtener nombre de amenidad
        nombre_amenidad = 'Amenidad'
        if self.amenidad:
            nombre_amenidad = self.amenidad.get('nombre', 'Amenidad')
        else:
            # Intentar obtener amenidad si no está disponible
            try:
                exito, amenidades, mensaje = self.controlador.api_client.obtener_amenidades_disponibles()
                if exito and amenidades and len(amenidades) > 0:
                    self.amenidad = amenidades[0]  # Usar primera amenidad disponible temporalmente
                    nombre_amenidad = self.amenidad.get('nombre', 'Amenidad')
            except:
                pass
        
        # Formatear fecha
        fecha_formateada = fecha_evento
        try:
            formatos = ['%Y-%m-%d', '%Y/%m/%d', '%d-%m-%Y', '%d/%m/%Y']
            fecha_obj = None
            for formato in formatos:
                try:
                    fecha_obj = datetime.strptime(fecha_evento, formato)
                    break
                except:
                    continue
            
            if fecha_obj:
                meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
                fecha_formateada = f"{fecha_obj.day} de {meses[fecha_obj.month-1]} de {fecha_obj.year}"
        except:
            pass
        
        # Calcular precio base
        total_servicios_extra = sum(servicio.get('costo', 0) for servicio in servicios_extra) if servicios_extra else 0
        precio_base = total - total_servicios_extra
        
        # Header
        header = ft.Container(
            content=ft.Row([
                ft.IconButton(
                    icon=ft.Icons.ARROW_BACK,
                    on_click=volver_amenidades,
                    tooltip="Volver"
                ),
                ft.Text(
                    "Detalle de Reserva",
                    size=20,
                    weight="bold",
                    color="grey900"
                ),
                ft.Container(expand=True),
            ]),
            padding=20,
            bgcolor="white",
        )
        
        # Card de información de la reserva
        info_card = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Icon(ft.Icons.INFO_OUTLINE, color="teal600", size=24),
                    ft.Text(
                        "Información de la Reserva",
                        size=18,
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
                    ft.Text("Reservado por:", size=14, color="grey600"),
                    ft.Container(expand=True),
                    ft.Text(nombre_residente, size=14, weight="w500", color="grey900"),
                ]),
                ft.Row([
                    ft.Text("Fecha del evento:", size=14, color="grey600"),
                    ft.Container(expand=True),
                    ft.Text(fecha_formateada, size=14, weight="w500", color="grey900"),
                ]),
                ft.Row([
                    ft.Text("Estado:", size=14, color="grey600"),
                    ft.Container(expand=True),
                    ft.Container(
                        content=ft.Text(
                            estado.upper(),
                            size=12,
                            weight="w500",
                            color="white"
                        ),
                        bgcolor="green600" if estado == "confirmada" else "orange600" if estado == "pendiente" else "red600",
                        padding=ft.padding.symmetric(horizontal=10, vertical=5),
                        border_radius=12,
                    ),
                ]),
                ft.Row([
                    ft.Text("Estado de pago:", size=14, color="grey600"),
                    ft.Container(expand=True),
                    ft.Container(
                        content=ft.Text(
                            estado_pago.upper(),
                            size=12,
                            weight="w500",
                            color="white"
                        ),
                        bgcolor="green600" if estado_pago == "pagado" else "orange600",
                        padding=ft.padding.symmetric(horizontal=10, vertical=5),
                        border_radius=12,
                    ),
                ]),
            ], spacing=12),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="grey50",
            border_radius=12,
        )
        
        # Card de desglose de costos
        costos_items = []
        
        # Costo base
        if precio_base > 0:
            costos_items.append(
                ft.Row([
                    ft.Text("Costo base:", size=14, color="grey600"),
                    ft.Container(expand=True),
                    ft.Text(f"${precio_base:,.2f}", size=14, color="grey900"),
                ])
            )
        
        # Servicios extra
        if servicios_extra and len(servicios_extra) > 0:
            for servicio in servicios_extra:
                nombre_servicio = servicio.get('nombre', 'Servicio') if isinstance(servicio, dict) else servicio
                costo_servicio = servicio.get('costo', 0) if isinstance(servicio, dict) else 0
                costos_items.append(
                    ft.Row([
                        ft.Text(f"• {nombre_servicio}:", size=13, color="grey600"),
                        ft.Container(expand=True),
                        ft.Text(f"${costo_servicio:,.2f}", size=13, color="grey900"),
                    ])
                )
        
        costos_card = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Icon(ft.Icons.RECEIPT, color="teal600", size=24),
                    ft.Text(
                        "Desglose de Costos",
                        size=18,
                        weight="bold",
                        color="grey900"
                    ),
                ], spacing=10),
                ft.Divider(),
                ft.Column(costos_items, spacing=8),
                ft.Divider(),
                ft.Row([
                    ft.Text("Total:", size=18, weight="bold", color="grey900"),
                    ft.Container(expand=True),
                    ft.Text(
                        f"${total:,.2f}",
                        size=20,
                        weight="bold",
                        color="teal600"
                    ),
                ]),
            ], spacing=12),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="white",
            border_radius=12,
            border=ft.border.all(1, "grey300"),
        )
        
        # Botones de acción (solo mostrar si está pendiente)
        botones_container = None
        if estado == "pendiente" and estado_pago == "pendiente":
            btn_pagar = ft.ElevatedButton(
                "Pagar Reserva",
                icon=ft.Icons.PAYMENT,
                on_click=pagar_reserva,
                bgcolor="teal600",
                color="white",
                expand=True,
                height=50,
                style=ft.ButtonStyle(
                    shape=ft.RoundedRectangleBorder(radius=12)
                )
            )
            
            btn_cancelar = ft.ElevatedButton(
                "Cancelar Reserva",
                icon=ft.Icons.CANCEL,
                on_click=cancelar_reserva,
                bgcolor="red600",
                color="white",
                expand=True,
                height=50,
                style=ft.ButtonStyle(
                    shape=ft.RoundedRectangleBorder(radius=12)
                )
            )
            
            botones_container = ft.Container(
                content=ft.Column([
                    btn_pagar,
                    btn_cancelar,
                ], spacing=10),
                padding=ft.padding.symmetric(horizontal=20),
                margin=ft.margin.only(bottom=20),
            )
        elif estado == "pendiente" and estado_pago == "pagado":
            # Si está pagada pero aún pendiente de confirmación
            info_pago_card = ft.Container(
                content=ft.Column([
                    ft.Row([
                        ft.Icon(ft.Icons.CHECK_CIRCLE, color="green600", size=32),
                        ft.Column([
                            ft.Text(
                                "Pago Completado",
                                size=16,
                                weight="bold",
                                color="grey900"
                            ),
                            ft.Text(
                                "Tu reserva está siendo procesada",
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
            botones_container = ft.Container(
                content=info_pago_card,
                padding=ft.padding.symmetric(horizontal=0),
                margin=ft.margin.only(bottom=20),
            )
        elif estado == "cancelada":
            info_cancelada_card = ft.Container(
                content=ft.Column([
                    ft.Row([
                        ft.Icon(ft.Icons.CANCEL, color="red600", size=32),
                        ft.Text(
                            "Reserva Cancelada",
                            size=16,
                            weight="bold",
                            color="grey900"
                        ),
                    ], spacing=15),
                ], spacing=10),
                padding=20,
                margin=ft.margin.symmetric(horizontal=20, vertical=10),
                bgcolor="red50",
                border_radius=12,
                border=ft.border.all(2, "red200"),
            )
            botones_container = ft.Container(
                content=info_cancelada_card,
                padding=ft.padding.symmetric(horizontal=0),
                margin=ft.margin.only(bottom=20),
            )
        
        # Contenido principal
        main_content = ft.Column([
            header,
            info_card,
            costos_card,
            botones_container if botones_container else ft.Container(height=0),
            ft.Container(expand=True),
        ], spacing=0, scroll="auto", expand=True)
        
        self.page.add(main_content)

