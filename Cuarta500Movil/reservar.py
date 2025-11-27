import flet as ft
from controller import Controlador
from token_storage import TokenStorage
from datetime import datetime, date
import json

class ReservarVista:
    def __init__(self, page: ft.Page, amenidad, api_client=None):
        self.page = page
        self.page.title = "Condominio - Reservar"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.scroll = ft.ScrollMode.AUTO
        self.page.clean()
        self.controlador = Controlador(page)
        if api_client:
            self.controlador.api_client = api_client
        self.amenidad = amenidad
        self.servicios_extra = []  # Lista de servicios extra
        
        # Obtener datos del usuario
        self.obtener_datos_usuario()
        
        self.build()
    
    def obtener_datos_usuario(self):
        """Obtiene los datos del usuario desde el token o el backend"""
        self.nombre_usuario = "Usuario"
        self.telefono_usuario = ""
        
        # Obtener usuario_id del token
        token, usuario_data = TokenStorage.get_token()
        usuario_id = None
        
        if token:
            try:
                import base64
                parts = token.split('.')
                if len(parts) >= 2:
                    payload = parts[1]
                    payload += '=' * (4 - len(payload) % 4)
                    decoded = base64.urlsafe_b64decode(payload)
                    token_data = json.loads(decoded)
                    usuario_info = token_data.get('usuario', {})
                    usuario_id = usuario_info.get('usuario_id')
            except Exception as e:
                print(f"Error al decodificar token: {e}")
        
        # Intentar obtener desde token guardado primero
        if usuario_data and isinstance(usuario_data, dict):
            nombre = usuario_data.get('nombre', '')
            apellido_paterno = usuario_data.get('apellido_paterno', '')
            apellido_materno = usuario_data.get('apellido_materno', '')
            self.nombre_usuario = ' '.join([nombre, apellido_paterno, apellido_materno]).strip() or usuario_data.get('username', 'Usuario')
            self.telefono_usuario = usuario_data.get('telefono', '')
        
        # Si no tenemos teléfono o nombre completo, obtener del backend usando mi-perfil
        if (not self.telefono_usuario or not self.nombre_usuario or self.nombre_usuario == "Usuario") and self.controlador.api_client:
            try:
                print("Obteniendo datos completos del usuario desde el backend (mi-perfil)...")
                exito, usuario_completo, mensaje = self.controlador.api_client.obtener_mi_perfil()
                
                if exito and usuario_completo:
                    # Actualizar nombre
                    nombre = usuario_completo.get('nombre', '')
                    apellido_paterno = usuario_completo.get('apellido_paterno', '')
                    apellido_materno = usuario_completo.get('apellido_materno', '')
                    nombre_completo = ' '.join([nombre, apellido_paterno, apellido_materno]).strip()
                    
                    if nombre_completo:
                        self.nombre_usuario = nombre_completo
                    elif usuario_completo.get('username'):
                        self.nombre_usuario = usuario_completo.get('username')
                    
                    # Actualizar teléfono
                    telefono = usuario_completo.get('telefono', '')
                    if telefono:
                        self.telefono_usuario = telefono
                    
                    print(f"Datos del usuario obtenidos del backend: nombre={self.nombre_usuario}, telefono={self.telefono_usuario}")
                else:
                    print(f"No se pudieron obtener datos del backend: {mensaje}")
            except Exception as e:
                print(f"Error al obtener datos del usuario desde el backend: {e}")
        
        # Si aún no tenemos nombre, usar username del token
        if (not self.nombre_usuario or self.nombre_usuario == "Usuario") and token:
            try:
                import base64
                parts = token.split('.')
                if len(parts) >= 2:
                    payload = parts[1]
                    payload += '=' * (4 - len(payload) % 4)
                    decoded = base64.urlsafe_b64decode(payload)
                    token_data = json.loads(decoded)
                    usuario_info = token_data.get('usuario', {})
                    if usuario_info:
                        self.nombre_usuario = usuario_info.get('username', 'Usuario')
            except Exception as e:
                print(f"Error al decodificar token: {e}")
        
        print(f"Datos finales del usuario: nombre={self.nombre_usuario}, telefono={self.telefono_usuario}")

    def build(self):
        def volver_amenidades(e):
            from amenidades import AmenidadesVista
            self.page.clean()
            AmenidadesVista(self.page, self.controlador.api_client)

        def formatear_fecha(e):
            """Formatea automáticamente la fecha agregando guiones"""
            try:
                valor = fecha_input.value or ""
                # Remover todos los guiones existentes
                valor_limpio = valor.replace("-", "")
                
                # Solo permitir números
                valor_limpio = ''.join(c for c in valor_limpio if c.isdigit())
                
                # Limitar a 8 dígitos (YYYYMMDD)
                if len(valor_limpio) > 8:
                    valor_limpio = valor_limpio[:8]
                
                # Agregar guiones automáticamente
                if len(valor_limpio) >= 4:
                    # Año (4 dígitos)
                    fecha_formateada = valor_limpio[:4]
                    if len(valor_limpio) > 4:
                        fecha_formateada += "-" + valor_limpio[4:6]  # Mes (2 dígitos)
                    if len(valor_limpio) > 6:
                        fecha_formateada += "-" + valor_limpio[6:8]  # Día (2 dígitos)
                else:
                    fecha_formateada = valor_limpio
                
                # Actualizar el campo solo si cambió
                if fecha_input.value != fecha_formateada:
                    fecha_input.value = fecha_formateada
                    self.page.update()
            except Exception as ex:
                print(f"Error al formatear fecha: {str(ex)}")

        def agregar_servicio(e):
            """Agrega un servicio extra a la lista"""
            nombre_servicio = servicio_nombre_input.value.strip() if servicio_nombre_input.value else ""
            costo_servicio = servicio_costo_input.value.strip() if servicio_costo_input.value else ""
            
            if not nombre_servicio or not costo_servicio:
                mostrar_mensaje("Por favor completa el nombre y costo del servicio", "error")
                return
            
            try:
                costo = float(costo_servicio)
                if costo < 0:
                    mostrar_mensaje("El costo debe ser un número positivo", "error")
                    return
                
                # Agregar servicio a la lista
                nuevo_servicio = {
                    "nombre": nombre_servicio,
                    "costo": costo
                }
                self.servicios_extra.append(nuevo_servicio)
                
                # Limpiar campos
                servicio_nombre_input.value = ""
                servicio_costo_input.value = ""
                
                # Actualizar lista de servicios y total
                actualizar_lista_servicios()
                calcular_total()
                self.page.update()
            except ValueError:
                mostrar_mensaje("El costo debe ser un número válido", "error")

        def eliminar_servicio(servicio_index):
            """Elimina un servicio de la lista"""
            def eliminar(e):
                if 0 <= servicio_index < len(self.servicios_extra):
                    self.servicios_extra.pop(servicio_index)
                    actualizar_lista_servicios()
                    calcular_total()
                    self.page.update()
            return eliminar

        def actualizar_lista_servicios():
            """Actualiza la lista visual de servicios extra"""
            servicios_lista.controls.clear()
            
            if not self.servicios_extra:
                servicios_lista.controls.append(
                    ft.Text(
                        "No hay servicios extra agregados",
                        size=12,
                        color="grey500",
                        italic=True
                    )
                )
            else:
                for idx, servicio in enumerate(self.servicios_extra):
                    servicios_lista.controls.append(
                        ft.Container(
                            content=ft.Row([
                                ft.Column([
                                    ft.Text(
                                        servicio["nombre"],
                                        size=14,
                                        weight="w500",
                                        color="grey900"
                                    ),
                                    ft.Text(
                                        f"${servicio['costo']:,.2f}",
                                        size=12,
                                        color="grey600"
                                    ),
                                ], spacing=2, expand=True),
                                ft.IconButton(
                                    icon=ft.Icons.DELETE,
                                    icon_color="red600",
                                    icon_size=20,
                                    on_click=eliminar_servicio(idx),
                                    tooltip="Eliminar servicio"
                                ),
                            ], spacing=10),
                            padding=10,
                            margin=ft.margin.only(bottom=5),
                            bgcolor="grey50",
                            border_radius=8,
                        )
                    )

        def calcular_total():
            """Calcula el total de la reserva y actualiza el resumen"""
            precio_base = self.amenidad.get('catalogo_detalle', {}).get('precio', 0)
            total_servicios = sum(servicio['costo'] for servicio in self.servicios_extra)
            total = precio_base + total_servicios
            
            total_text.value = f"${total:,.2f}"
            servicios_extra_text.value = f"${total_servicios:,.2f}"
            servicios_extra_row.visible = len(self.servicios_extra) > 0
            self.total_calculado = total
            self.page.update()

        def crear_reserva(e):
            """Crea la reserva en el backend"""
            print("Botón crear reserva presionado")
            try:
                # Validar campos
                if not fecha_input.value or not fecha_input.value.strip():
                    mostrar_mensaje("Por favor selecciona la fecha del evento", "error")
                    return
                
                # Validar formato de fecha
                fecha_str = fecha_input.value.strip()
                try:
                    # Intentar parsear la fecha
                    formatos = ['%Y-%m-%d', '%Y/%m/%d', '%d-%m-%Y', '%d/%m/%Y']
                    fecha_obj = None
                    for formato in formatos:
                        try:
                            fecha_obj = datetime.strptime(fecha_str, formato)
                            break
                        except:
                            continue
                    
                    if not fecha_obj:
                        mostrar_mensaje("Formato de fecha inválido. Usa YYYY-MM-DD", "error")
                        return
                    
                    # Formatear fecha para el backend (ISO string)
                    fecha_iso = fecha_obj.strftime('%Y-%m-%d')
                except Exception as ex:
                    mostrar_mensaje(f"Error al procesar la fecha: {str(ex)}", "error")
                    return

                # Obtener datos del usuario
                token, usuario_data = TokenStorage.get_token()
                if not token:
                    mostrar_mensaje("No estás autenticado. Por favor inicia sesión.", "error")
                    return

                # Asegurar que tenemos los datos del usuario actualizados
                # Si no tenemos nombre o teléfono, intentar obtenerlos del backend
                if (not self.nombre_usuario or self.nombre_usuario == "Usuario" or not self.telefono_usuario) and self.controlador.api_client:
                    print("Obteniendo datos del usuario desde el backend...")
                    try:
                        exito, usuario_completo, mensaje = self.controlador.api_client.obtener_mi_perfil()
                        if exito and usuario_completo:
                            # Actualizar nombre
                            nombre = usuario_completo.get('nombre', '')
                            apellido_paterno = usuario_completo.get('apellido_paterno', '')
                            apellido_materno = usuario_completo.get('apellido_materno', '')
                            nombre_completo = ' '.join([nombre, apellido_paterno, apellido_materno]).strip()
                            
                            if nombre_completo:
                                self.nombre_usuario = nombre_completo
                            elif usuario_completo.get('username'):
                                self.nombre_usuario = usuario_completo.get('username')
                            
                            # Actualizar teléfono
                            telefono = usuario_completo.get('telefono', '')
                            if telefono:
                                self.telefono_usuario = telefono
                    except Exception as ex:
                        print(f"Error al obtener datos del usuario: {ex}")

                # Validar que tenemos nombre y teléfono (requeridos por el backend)
                if not self.nombre_usuario or self.nombre_usuario == "Usuario":
                    mostrar_mensaje("No se pudo obtener el nombre del usuario. Por favor inicia sesión nuevamente.", "error")
                    return
                
                if not self.telefono_usuario or not self.telefono_usuario.strip():
                    mostrar_mensaje("No se pudo obtener el teléfono del usuario. Por favor completa tu perfil.", "error")
                    return

                # Calcular total
                precio_base = self.amenidad.get('catalogo_detalle', {}).get('precio', 0)
                total_servicios = sum(servicio['costo'] for servicio in self.servicios_extra)
                total = precio_base + total_servicios

                # Preparar datos de la reserva (el backend genera reservacion_id automáticamente)
                reservacion_data = {
                    "nombre_residente": self.nombre_usuario,
                    "telefono": self.telefono_usuario,
                    "fecha_evento": fecha_iso,
                    "servicios_extra": self.servicios_extra,
                    "total": total,
                    "estado": "pendiente",
                    "estado_pago": "pendiente"
                }

                print(f"Datos de reserva a enviar: {reservacion_data}")

                # Deshabilitar botón mientras se procesa
                btn_crear.disabled = True
                btn_crear.text = "Creando reserva..."
                self.page.update()

                # Crear reserva usando el endpoint /reservaciones/crear (para usuarios normales)
                exito, data, mensaje = self.controlador.api_client.crear_reservacion(reservacion_data)
                
                print(f"Respuesta del servidor: exito={exito}, mensaje={mensaje}")
                
                if exito:
                    mostrar_mensaje("Reserva creada exitosamente", "exito")
                    print(f"Reserva creada exitosamente. Datos: {data}")
                    # Volver a amenidades después de un momento
                    # La vista de amenidades se recargará automáticamente y cargará las reservas
                    import threading
                    threading.Timer(1.5, lambda: volver_amenidades(None)).start()
                else:
                    mostrar_mensaje(f"Error al crear reserva: {mensaje}", "error")
                    btn_crear.disabled = False
                    btn_crear.text = "Crear Reserva"
                    self.page.update()
            except Exception as ex:
                print(f"Error al crear reserva: {str(ex)}")
                import traceback
                traceback.print_exc()
                mostrar_mensaje(f"Error: {str(ex)}", "error")
                btn_crear.disabled = False
                btn_crear.text = "Crear Reserva"
                self.page.update()
                btn_crear.disabled = False
                btn_crear.text = "Crear Reserva"
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

        # Obtener datos de la amenidad
        nombre_amenidad = self.amenidad.get('nombre', 'Sin nombre')
        descripcion_amenidad = self.amenidad.get('descripcion', 'Sin descripción')
        precio_base = self.amenidad.get('catalogo_detalle', {}).get('precio', 0)
        self.total_calculado = precio_base

        # Header
        header = ft.Container(
            content=ft.Row([
                ft.IconButton(
                    icon=ft.Icons.ARROW_BACK,
                    on_click=volver_amenidades,
                    tooltip="Volver"
                ),
                ft.Text(
                    "Nueva Reserva",
                    size=20,
                    weight="bold",
                    color="grey900"
                ),
                ft.Container(expand=True),
            ]),
            padding=20,
            bgcolor="white",
        )

        # Card de información de la amenidad
        amenidad_card = ft.Container(
            content=ft.Column([
                ft.Text(
                    nombre_amenidad,
                    size=18,
                    weight="bold",
                    color="grey900"
                ),
                ft.Text(
                    descripcion_amenidad,
                    size=14,
                    color="grey600"
                ),
                ft.Divider(),
                ft.Row([
                    ft.Text("Precio base:", size=14, color="grey600"),
                    ft.Container(expand=True),
                    ft.Text(
                        f"${precio_base:,.2f}/hora",
                        size=16,
                        weight="w500",
                        color="grey900"
                    ),
                ]),
            ], spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="grey50",
            border_radius=12,
        )
        
        # Card de información del usuario
        info_usuario_card = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Icon(ft.Icons.PERSON, color="teal600", size=20),
                    ft.Text(
                        "Información de Reserva",
                        size=16,
                        weight="bold",
                        color="grey900"
                    ),
                ], spacing=10),
                ft.Divider(),
                ft.Text(
                    f"Reservando como: {self.nombre_usuario}",
                    size=14,
                    color="grey700"
                ),
                ft.Text(
                    f"Teléfono: {self.telefono_usuario if self.telefono_usuario else 'No proporcionado'}",
                    size=14,
                    color="grey600"
                ),
            ], spacing=8),
            padding=15,
            margin=ft.margin.symmetric(horizontal=20, vertical=5),
            bgcolor="teal50",
            border_radius=10,
            border=ft.border.all(1, "teal200"),
        )

        # Campo de fecha
        fecha_input = ft.TextField(
            label="Fecha del Evento",
            hint_text="YYYY-MM-DD (ej: 2025-11-15)",
            prefix_icon=ft.Icons.CALENDAR_TODAY,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True,
            max_length=10,
            on_change=formatear_fecha
        )

        fecha_container = ft.Container(
            content=fecha_input,
            padding=ft.padding.symmetric(horizontal=20),
            margin=ft.margin.only(bottom=10),
        )

        # Sección de servicios extra
        servicios_title = ft.Container(
            content=ft.Text(
                "Servicios Extra (Opcional)",
                size=16,
                weight="bold",
                color="grey900"
            ),
            padding=ft.padding.symmetric(horizontal=20, vertical=10),
        )

        servicio_nombre_input = ft.TextField(
            label="Nombre del Servicio",
            hint_text="Ej: Mesa adicional, Sonido, etc.",
            prefix_icon=ft.Icons.ADD_BUSINESS,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True,
        )

        servicio_costo_input = ft.TextField(
            label="Costo",
            hint_text="0.00",
            prefix_icon=ft.Icons.ATTACH_MONEY,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True,
            keyboard_type=ft.KeyboardType.NUMBER,
        )

        servicios_input_container = ft.Container(
            content=ft.Column([
                ft.Row([
                    servicio_nombre_input,
                    servicio_costo_input,
                ], spacing=10),
                ft.ElevatedButton(
                    "Agregar Servicio",
                    icon=ft.Icons.ADD,
                    on_click=agregar_servicio,
                    bgcolor="teal600",
                    color="white",
                    expand=True,
                ),
            ], spacing=10),
            padding=ft.padding.symmetric(horizontal=20),
            margin=ft.margin.only(bottom=10),
        )

        # Lista de servicios agregados
        servicios_lista = ft.Column([], spacing=5)
        
        servicios_lista_container = ft.Container(
            content=servicios_lista,
            padding=ft.padding.symmetric(horizontal=20),
            margin=ft.margin.only(bottom=20),
        )

        # Inicializar lista vacía
        actualizar_lista_servicios()

        # Resumen y total
        total_text = ft.Text(
            f"${precio_base:,.2f}",
            size=24,
            weight="bold",
            color="teal600"
        )
        
        servicios_extra_text = ft.Text(
            "$0.00",
            size=14,
            color="grey900"
        )
        
        servicios_extra_row = ft.Row([
            ft.Text("Servicios extra:", size=14, color="grey600"),
            ft.Container(expand=True),
            servicios_extra_text,
        ])
        servicios_extra_row.visible = False

        resumen_card = ft.Container(
            content=ft.Column([
                ft.Text(
                    "Resumen de Reserva",
                    size=18,
                    weight="bold",
                    color="grey900"
                ),
                ft.Divider(),
                ft.Row([
                    ft.Text("Precio base:", size=14, color="grey600"),
                    ft.Container(expand=True),
                    ft.Text(f"${precio_base:,.2f}", size=14, color="grey900"),
                ]),
                servicios_extra_row,
                ft.Divider(),
                ft.Row([
                    ft.Text("Total:", size=18, weight="bold", color="grey900"),
                    ft.Container(expand=True),
                    total_text,
                ]),
            ], spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="grey50",
            border_radius=12,
        )

        # Botón crear reserva
        btn_crear = ft.ElevatedButton(
            "Crear Reserva",
            icon=ft.Icons.CHECK_CIRCLE,
            on_click=crear_reserva,
            bgcolor="teal600",
            color="white",
            expand=True,
            height=50,
            style=ft.ButtonStyle(
                shape=ft.RoundedRectangleBorder(radius=12)
            )
        )

        btn_container = ft.Container(
            content=btn_crear,
            padding=ft.padding.symmetric(horizontal=20),
            margin=ft.margin.only(bottom=20),
        )

        # Contenido principal
        main_content = ft.Column([
            header,
            amenidad_card,
            info_usuario_card,
            fecha_container,
            servicios_title,
            servicios_input_container,
            servicios_lista_container,
            resumen_card,
            btn_container,
            ft.Container(expand=True),
        ], spacing=0, scroll="auto", expand=True)

        self.page.add(main_content)
        
        # Guardar referencias para actualización
        self.fecha_input = fecha_input
        self.servicio_nombre_input = servicio_nombre_input
        self.servicio_costo_input = servicio_costo_input
        self.servicios_lista = servicios_lista
        self.total_text = total_text
        self.btn_crear = btn_crear
        self.resumen_card = resumen_card

