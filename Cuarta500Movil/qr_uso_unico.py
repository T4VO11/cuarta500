import flet as ft
import qrcode
import io
import json
import base64
from datetime import datetime
from controller import Controlador
from token_storage import TokenStorage

class QRUsoUnicoVista:
    def __init__(self, page: ft.Page, api_client=None):
        self.page = page
        self.page.title = "Condominio - Generar QR de Uso Único"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.scroll = ft.ScrollMode.AUTO
        self.page.clean()
        self.controlador = Controlador(page)
        if api_client:
            self.controlador.api_client = api_client
        self.invitacion_creada = None
        self.qr_image = None
        self.build()

    def build(self):
        def volver_opciones(e):
            from opciones_qr import OpcionesQRVista
            self.page.clean()
            OpcionesQRVista(self.page, self.controlador.api_client)

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

        def generar_codigo_acceso():
            """Genera un código de acceso único"""
            import random
            import string
            return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

        def formatear_fecha(e):
            """Formatea automáticamente la fecha agregando barras"""
            try:
                valor = fecha_input.value or ""
                # Remover todos los caracteres no numéricos
                valor_limpio = ''.join(c for c in valor if c.isdigit())
                
                # Limitar a 8 dígitos (DDMMYYYY)
                if len(valor_limpio) > 8:
                    valor_limpio = valor_limpio[:8]
                
                # Agregar barras automáticamente
                if len(valor_limpio) >= 2:
                    fecha_formateada = valor_limpio[:2]  # Día
                    if len(valor_limpio) > 2:
                        fecha_formateada += "/" + valor_limpio[2:4]  # Mes
                    if len(valor_limpio) > 4:
                        fecha_formateada += "/" + valor_limpio[4:8]  # Año
                else:
                    fecha_formateada = valor_limpio
                
                # Actualizar el campo solo si cambió
                if fecha_input.value != fecha_formateada:
                    fecha_input.value = fecha_formateada
                    self.page.update()
            except Exception as ex:
                print(f"Error al formatear fecha: {str(ex)}")

        def formatear_hora(e, campo):
            """Formatea automáticamente la hora"""
            try:
                valor = campo.value or ""
                # Remover todos los caracteres no numéricos excepto :, a, p, m
                valor_limpio = ''.join(c for c in valor if c.isdigit() or c in [':', 'a', 'p', 'm', ' '])
                
                # Si solo hay números, formatear
                solo_numeros = ''.join(c for c in valor if c.isdigit())
                if len(solo_numeros) >= 3 and ':' not in valor:
                    # Formato HHMM
                    if len(solo_numeros) >= 4:
                        hora = solo_numeros[:2]
                        minuto = solo_numeros[2:4]
                        campo.value = f"{hora}:{minuto}"
                        self.page.update()
            except Exception as ex:
                print(f"Error al formatear hora: {str(ex)}")

        def cancelar(e):
            """Cancela y vuelve a opciones"""
            volver_opciones(e)

        def generar_qr_func(e):
            """Genera el QR de uso único"""
            try:
                # Validar campos requeridos
                if not nombre_input.value or nombre_input.value.strip() == "":
                    mostrar_mensaje("Por favor ingresa el nombre del visitante", "error")
                    return
                
                if not fecha_input.value or fecha_input.value.strip() == "":
                    mostrar_mensaje("Por favor selecciona la fecha de acceso", "error")
                    return
                
                if not hora_inicio_input.value or hora_inicio_input.value.strip() == "":
                    mostrar_mensaje("Por favor ingresa la hora de inicio", "error")
                    return
                
                if not hora_fin_input.value or hora_fin_input.value.strip() == "":
                    mostrar_mensaje("Por favor ingresa la hora de fin", "error")
                    return

                # Deshabilitar botón mientras se procesa
                btn_generar.disabled = True
                btn_generar.text = "Generando QR..."
                self.page.update()

                # Obtener datos del usuario
                token, usuario_data = TokenStorage.get_token()
                if not token and self.controlador.api_client.token:
                    token = self.controlador.api_client.token
                
                if not token:
                    mostrar_mensaje("No estás autenticado. Por favor inicia sesión.", "error")
                    btn_generar.disabled = False
                    btn_generar.text = "Generar QR"
                    self.page.update()
                    return

                # Obtener usuario_id del token JWT
                usuario_id = None
                try:
                    import base64
                    parts = token.split('.')
                    if len(parts) >= 2:
                        payload = parts[1]
                        payload += '=' * (4 - len(payload) % 4)
                        decoded = base64.urlsafe_b64decode(payload)
                        token_data = json.loads(decoded)
                        # Intentar diferentes formas de obtener el usuario_id
                        usuario_info = token_data.get('usuario', {})
                        if usuario_info and isinstance(usuario_info, dict):
                            usuario_id = usuario_info.get('usuario_id') or usuario_info.get('_id') or usuario_info.get('id')
                        # Si no está en usuario, buscar directamente en token_data
                        if not usuario_id:
                            usuario_id = token_data.get('usuario_id') or token_data.get('id') or token_data.get('userId')
                        print(f"Usuario ID obtenido del token JWT: {usuario_id}")
                except Exception as ex:
                    print(f"Error al decodificar token: {str(ex)}")
                    import traceback
                    traceback.print_exc()
                
                # Si aún no hay usuario_id, intentar desde usuario_data
                if not usuario_id and usuario_data:
                    usuario_id = usuario_data.get('usuario_id') or usuario_data.get('_id') or usuario_data.get('id')
                    print(f"Usuario ID obtenido de usuario_data: {usuario_id}")
                
                if not usuario_id:
                    print("ERROR: No se pudo obtener usuario_id. Usando valor por defecto 1")
                    mostrar_mensaje("Error: No se pudo identificar al usuario. Por favor inicia sesión nuevamente.", "error")
                    btn_generar.disabled = False
                    btn_generar.text = "Generar QR"
                    self.page.update()
                    return

                # Obtener número de casa
                numero_casa = None
                if usuario_data:
                    numero_casa = usuario_data.get('numero_casa')
                if not numero_casa:
                    numero_casa = 1

                # Generar código de acceso
                codigo = generar_codigo_acceso()

                # Generar ID único para la invitación
                invitacion_id = int(datetime.now().timestamp() * 1000) % 1000000

                # Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
                fecha_formateada = fecha_input.value.strip()
                try:
                    if '/' in fecha_formateada:
                        partes = fecha_formateada.split('/')
                        if len(partes) == 3:
                            dia, mes, anio = partes
                            # Validar que sean números
                            if dia.isdigit() and mes.isdigit() and anio.isdigit():
                                fecha_formateada = f"{anio}-{mes.zfill(2)}-{dia.zfill(2)}"
                            else:
                                mostrar_mensaje("Formato de fecha inválido. Use DD/MM/YYYY", "error")
                                btn_generar.disabled = False
                                btn_generar.text = "Generar QR"
                                self.page.update()
                                return
                    elif '-' in fecha_formateada:
                        # Ya está en formato YYYY-MM-DD, usar directamente
                        pass
                    else:
                        mostrar_mensaje("Formato de fecha inválido. Use DD/MM/YYYY", "error")
                        btn_generar.disabled = False
                        btn_generar.text = "Generar QR"
                        self.page.update()
                        return
                except Exception as fecha_error:
                    print(f"Error al convertir fecha: {fecha_error}")
                    mostrar_mensaje("Error al procesar la fecha", "error")
                    btn_generar.disabled = False
                    btn_generar.text = "Generar QR"
                    self.page.update()
                    return

                # Preparar datos del vehículo (opcional)
                vehiculo_data = {}
                if (modelo_input.value and modelo_input.value.strip()) or (color_input.value and color_input.value.strip()) or (placas_input.value and placas_input.value.strip()):
                    vehiculo_data = {
                        "modelo": modelo_input.value.strip() if modelo_input.value else "",
                        "color": color_input.value.strip() if color_input.value else "",
                        "placas": placas_input.value.strip() if placas_input.value else ""
                    }

                # Preparar datos de la invitación
                invitacion_data = {
                    "invitacion_id": invitacion_id,
                    "usuario_id": usuario_id,
                    "numeroCasa": int(numero_casa) if isinstance(numero_casa, (int, str)) and str(numero_casa).strip() else 1,
                    "nombre_invitado": nombre_input.value.strip(),
                    "codigo_acceso": codigo,
                    "fecha_visita": fecha_formateada,
                    "proposito_visita": proposito_dropdown.value if proposito_dropdown.value else "Visita Personal",
                    "hora_inicio": hora_inicio_input.value.strip(),
                    "hora_fin": hora_fin_input.value.strip(),
                    "tipo_qr": "uso_unico",
                    "estado": "pendiente",
                    "vehiculo": vehiculo_data
                }
                
                # Solo agregar correo_electronico si tiene valor
                correo_valor = correo_input.value.strip() if correo_input.value else ""
                if correo_valor:
                    invitacion_data["correo_electronico"] = correo_valor

                # Crear invitación en el backend
                print(f"Enviando datos de invitación: {invitacion_data}")
                exito, data, mensaje = self.controlador.api_client.crear_invitacion(invitacion_data)
                print(f"Respuesta del servidor - Éxito: {exito}, Mensaje: {mensaje}, Data: {data}")
                
                if exito:
                    if data:
                        self.invitacion_creada = data
                        print(f"Invitación creada exitosamente: {data}")
                        mostrar_mensaje("QR generado exitosamente", "exito")
                        generar_qr()
                    else:
                        print("ERROR: No se recibieron datos de la invitación")
                        mostrar_mensaje("Error: No se recibieron datos de la invitación", "error")
                        btn_generar.disabled = False
                        btn_generar.text = "Generar QR"
                        self.page.update()
                else:
                    print(f"ERROR del servidor: {mensaje}")
                    mostrar_mensaje(f"Error: {mensaje}", "error")
                    btn_generar.disabled = False
                    btn_generar.text = "Generar QR"
                    self.page.update()
            except Exception as ex:
                import traceback
                print(f"Error al generar QR: {str(ex)}")
                print(traceback.format_exc())
                mostrar_mensaje(f"Error: {str(ex)}", "error")
                btn_generar.disabled = False
                btn_generar.text = "Generar QR"
                self.page.update()

        def generar_qr():
            """Genera el código QR con los datos de la invitación"""
            try:
                if not self.invitacion_creada:
                    return

                # Preparar datos para el QR
                qr_data = {
                    "tipo": "qr_uso_unico",
                    "invitacion_id": self.invitacion_creada.get("invitacion_id"),
                    "nombre_invitado": self.invitacion_creada.get("nombre_invitado"),
                    "codigo_acceso": self.invitacion_creada.get("codigo_acceso"),
                    "fecha_visita": self.invitacion_creada.get("fecha_visita"),
                    "hora_inicio": self.invitacion_creada.get("hora_inicio"),
                    "hora_fin": self.invitacion_creada.get("hora_fin"),
                    "numero_casa": self.invitacion_creada.get("numeroCasa"),
                    "condominio_id": self.invitacion_creada.get("condominio_id", "C500"),
                    "tipo_qr": "uso_unico",
                    "vehiculo": self.invitacion_creada.get("vehiculo", {})
                }

                # Convertir a JSON string
                qr_json = json.dumps(qr_data, ensure_ascii=False)

                # Generar QR
                qr = qrcode.QRCode(
                    version=1,
                    error_correction=qrcode.constants.ERROR_CORRECT_L,
                    box_size=10,
                    border=4,
                )
                qr.add_data(qr_json)
                qr.make(fit=True)

                # Crear imagen
                img = qr.make_image(fill_color="black", back_color="white")
                
                # Convertir a bytes para Flet
                img_buffer = io.BytesIO()
                img.save(img_buffer, format='PNG')
                img_buffer.seek(0)
                
                self.qr_image = img_buffer.getvalue()
                img_buffer.close()
                
                # Actualizar la UI para mostrar el QR
                mostrar_qr_generado()
            except Exception as ex:
                print(f"Error al generar QR: {str(ex)}")
                mostrar_mensaje(f"Error al generar QR: {str(ex)}", "error")

        def descargar_qr(e):
            """Descarga el QR como imagen"""
            try:
                if not self.qr_image:
                    snackbar = ft.SnackBar(content=ft.Text("No hay QR para descargar"), bgcolor="red")
                    self.page.snack_bar = snackbar
                    snackbar.open = True
                    self.page.update()
                    return
                
                # Guardar imagen
                from datetime import datetime
                import os
                
                # Crear directorio de descargas si no existe
                downloads_dir = os.path.join(os.path.expanduser("~"), "Downloads")
                if not os.path.exists(downloads_dir):
                    downloads_dir = os.path.expanduser("~")
                
                # Nombre del archivo
                codigo = self.invitacion_creada.get('codigo_acceso', 'QR')
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"QR_{codigo}_{timestamp}.png"
                filepath = os.path.join(downloads_dir, filename)
                
                # Guardar archivo
                with open(filepath, 'wb') as f:
                    f.write(self.qr_image)
                
                snackbar = ft.SnackBar(content=ft.Text(f"QR descargado en: {filepath}"), bgcolor="green")
                self.page.snack_bar = snackbar
                snackbar.open = True
                self.page.update()
                
            except Exception as ex:
                print(f"Error al descargar QR: {str(ex)}")
                snackbar = ft.SnackBar(content=ft.Text(f"Error al descargar: {str(ex)}"), bgcolor="red")
                self.page.snack_bar = snackbar
                snackbar.open = True
                self.page.update()

        def mostrar_qr_generado():
            """Muestra el QR generado en la interfaz"""
            try:
                if not self.qr_image:
                    return

                # Codificar imagen en base64
                qr_base64 = base64.b64encode(self.qr_image).decode('utf-8')
                
                # Obtener datos para mostrar
                nombre_visitante = self.invitacion_creada.get('nombre_invitado', 'Visitante')
                codigo = self.invitacion_creada.get('codigo_acceso', '')
                fecha = self.invitacion_creada.get('fecha_visita', '')
                hora_inicio = self.invitacion_creada.get('hora_inicio', '')
                hora_fin = self.invitacion_creada.get('hora_fin', '')
                
                # Formatear fecha y hora de validez
                fecha_validez = fecha
                hora_validez = hora_fin
                validez_texto = f"Válido hasta: {fecha_validez} {hora_validez} hrs"
                
                # Actualizar el contenedor del QR con nueva interfaz
                qr_container.content = ft.Column([
                    # Mensaje de confirmación
                    ft.Container(
                        content=ft.Column([
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.CHECK_CIRCLE,
                                    size=60,
                                    color="green600"
                                ),
                                width=80,
                                height=80,
                                bgcolor="green50",
                                border_radius=40,
                                alignment=ft.alignment.center,
                            ),
                            ft.Text(
                                "¡Código QR Generado!",
                                size=24,
                                weight="bold",
                                color="grey900"
                            ),
                            ft.Text(
                                "Listo para compartir con tu visitante",
                                size=14,
                                color="grey600"
                            ),
                        ], horizontal_alignment="center", spacing=10),
                        padding=20,
                    ),
                    
                    # QR Code
                    ft.Container(
                        content=ft.Image(
                            src_base64=qr_base64,
                            width=280,
                            height=280,
                        ),
                        padding=20,
                        bgcolor="white",
                        border_radius=12,
                        border=ft.border.all(2, "grey300"),
                        margin=ft.margin.symmetric(horizontal=20, vertical=10),
                    ),
                    
                    # Información del visitante
                    ft.Container(
                        content=ft.Column([
                            ft.Row([
                                ft.Column([
                                    ft.Text("Visitante", size=12, color="grey600"),
                                    ft.Text(nombre_visitante, size=16, weight="bold", color="grey900"),
                                ], spacing=4, expand=True),
                                ft.Column([
                                    ft.Text("Código", size=12, color="grey600", text_align="right"),
                                    ft.Text(
                                        f"SINGLE-{codigo}",
                                        size=16,
                                        weight="bold",
                                        color="teal600",
                                        text_align="right"
                                    ),
                                ], spacing=4, horizontal_alignment="end"),
                            ], spacing=10),
                            ft.Divider(height=1, color="grey300"),
                            ft.Row([
                                ft.Icon(ft.Icons.ACCESS_TIME, size=16, color="grey600"),
                                ft.Text(validez_texto, size=13, color="grey700", expand=True),
                            ], spacing=8),
                            ft.Row([
                                ft.Icon(ft.Icons.LOCK, size=16, color="grey600"),
                                ft.Text("Tipo de Acceso: Uso Único", size=13, color="grey700", expand=True),
                            ], spacing=8),
                        ], spacing=12),
                        padding=20,
                        margin=ft.margin.symmetric(horizontal=20, vertical=10),
                        bgcolor="#F5F5DC",
                        border_radius=12,
                        border=ft.border.all(1, "grey300"),
                    ),
                    
                    # Botones de acción
                    ft.Container(
                        content=ft.Column([
                            ft.ElevatedButton(
                                "Compartir Código QR",
                                icon=ft.Icons.SHARE,
                                on_click=lambda e: self.mostrar_opciones_compartir(e),
                                bgcolor="teal600",
                                color="white",
                                expand=True,
                                height=50,
                                style=ft.ButtonStyle(
                                    shape=ft.RoundedRectangleBorder(radius=12)
                                )
                            ),
                            ft.OutlinedButton(
                                "Descargar QR",
                                icon=ft.Icons.DOWNLOAD,
                                on_click=descargar_qr,
                                expand=True,
                                height=50,
                                style=ft.ButtonStyle(
                                    shape=ft.RoundedRectangleBorder(radius=12)
                                )
                            ),
                            ft.OutlinedButton(
                                "< Volver a Opciones",
                                icon=ft.Icons.ARROW_BACK,
                                on_click=volver_opciones,
                                expand=True,
                                height=45,
                                style=ft.ButtonStyle(
                                    shape=ft.RoundedRectangleBorder(radius=12)
                                )
                            ),
                        ], spacing=10),
                        padding=ft.padding.symmetric(horizontal=20, vertical=10),
                    ),
                    
                    # Consejo
                    ft.Container(
                        content=ft.Row([
                            ft.Icon(ft.Icons.INFO_OUTLINE, size=20, color="blue600"),
                            ft.Column([
                                ft.Text("Consejo", size=14, weight="bold", color="grey900"),
                                ft.Text(
                                    "Comparte este código QR directamente con tu visitante. El acceso se activará automáticamente al escanear.",
                                    size=12,
                                    color="grey700"
                                ),
                            ], spacing=4, expand=True),
                        ], spacing=10),
                        padding=15,
                        margin=ft.margin.symmetric(horizontal=20, vertical=10),
                        bgcolor="blue50",
                        border_radius=12,
                        border=ft.border.all(1, "blue200"),
                    ),
                ], spacing=0, scroll="auto", horizontal_alignment="center")
                
                # Ocultar formulario y mostrar QR
                form_container.visible = False
                qr_section.visible = True
                
                # Restaurar botón
                btn_generar.disabled = False
                btn_generar.text = "Generar QR"
                
                self.page.update()
            except Exception as ex:
                print(f"Error al mostrar QR: {str(ex)}")
                import traceback
                traceback.print_exc()
                mostrar_mensaje(f"Error al mostrar QR: {str(ex)}", "error")

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
                        on_click=volver_opciones,
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
                    "Generar QR de Uso Único",
                    size=28,
                    weight="bold",
                    color="grey900"
                ),
                ft.Text(
                    "Crea un código QR para un visitante puntual. El acceso será válido solo para la fecha y hora especificadas.",
                    size=14,
                    color="grey600"
                ),
            ], spacing=10),
            padding=20,
            bgcolor="white",
        )

        # Campos del formulario
        nombre_input = ft.TextField(
            label="Nombre del Visitante *",
            hint_text="Ej: Juan Pérez",
            prefix_icon=ft.Icons.PERSON,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True
        )

        correo_input = ft.TextField(
            label="Correo Electrónico (Opcional)",
            hint_text="visitante@ejemplo.com",
            prefix_icon=ft.Icons.EMAIL,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True
        )

        proposito_dropdown = ft.Dropdown(
            label="Propósito de la Visita",
            options=[
                ft.dropdown.Option("Visita Personal"),
                ft.dropdown.Option("Entrega de Paquete"),
                ft.dropdown.Option("Servicio Técnico"),
                ft.dropdown.Option("Mantenimiento"),
                ft.dropdown.Option("Otro"),
            ],
            value="Visita Personal",
            border_radius=10,
            text_size=14,
            expand=True
        )

        fecha_input = ft.TextField(
            label="Fecha de Acceso *",
            hint_text="DD/MM/YYYY",
            prefix_icon=ft.Icons.CALENDAR_TODAY,
            suffix_icon=ft.Icons.CALENDAR_TODAY,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True,
            max_length=10,
            on_change=formatear_fecha
        )

        hora_inicio_input = ft.TextField(
            label="Hora de Inicio *",
            hint_text="HH:MM",
            prefix_icon=ft.Icons.ACCESS_TIME,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True,
            on_change=lambda e: formatear_hora(e, hora_inicio_input)
        )

        hora_fin_input = ft.TextField(
            label="Hora de Fin *",
            hint_text="HH:MM",
            prefix_icon=ft.Icons.ACCESS_TIME,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True,
            on_change=lambda e: formatear_hora(e, hora_fin_input)
        )

        # Campos de vehículo (opcional)
        modelo_input = ft.TextField(
            label="Modelo del Vehículo (Opcional)",
            hint_text="Ej: Honda Civic",
            prefix_icon=ft.Icons.DIRECTIONS_CAR,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True
        )

        color_input = ft.TextField(
            label="Color del Vehículo (Opcional)",
            hint_text="Ej: Blanco",
            prefix_icon=ft.Icons.COLOR_LENS,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True
        )

        placas_input = ft.TextField(
            label="Placas del Vehículo (Opcional)",
            hint_text="Ej: ABC-123",
            prefix_icon=ft.Icons.CREDIT_CARD,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True
        )

        # Sección: Información del Visitante
        info_visitante_card = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Icon(ft.Icons.PERSON, color="teal600", size=20),
                    ft.Text(
                        "Información del Visitante",
                        size=16,
                        weight="bold",
                        color="grey900"
                    ),
                ], spacing=8),
                nombre_input,
                correo_input,
                proposito_dropdown,
                # Información del vehículo (opcional)
                ft.Container(
                    content=ft.Text(
                        "Información del Vehículo (Opcional)",
                        size=14,
                        weight="w500",
                        color="grey700"
                    ),
                    margin=ft.margin.only(top=10, bottom=5),
                ),
                modelo_input,
                color_input,
                placas_input,
            ], spacing=12),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="#F5F5DC",  # Beige claro
            border_radius=12,
            border=ft.border.all(1, "grey300"),
        )

        # Sección: Detalles de Acceso
        detalles_acceso_card = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Icon(ft.Icons.CALENDAR_TODAY, color="teal600", size=20),
                    ft.Text(
                        "Detalles de Acceso",
                        size=16,
                        weight="bold",
                        color="grey900"
                    ),
                ], spacing=8),
                fecha_input,
                ft.Row([
                    hora_inicio_input,
                    hora_fin_input,
                ], spacing=10),
                # Mensaje informativo
                ft.Container(
                    content=ft.Row([
                        ft.Icon(ft.Icons.INFO_OUTLINE, color="green600", size=20),
                        ft.Text(
                            "El código QR será válido solo durante el período especificado. Después de la hora de fin, el acceso será revocado automáticamente.",
                            size=12,
                            color="grey700",
                            expand=True
                        ),
                    ], spacing=8),
                    padding=12,
                    margin=ft.margin.only(top=10),
                    bgcolor="green50",
                    border_radius=8,
                    border=ft.border.all(1, "green200"),
                ),
            ], spacing=12),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="#F5F5DC",  # Beige claro
            border_radius=12,
            border=ft.border.all(1, "grey300"),
        )

        # Sección: Seguridad
        seguridad_card = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Icon(ft.Icons.SHIELD, color="teal600", size=20),
                    ft.Text(
                        "Seguridad",
                        size=16,
                        weight="bold",
                        color="grey900"
                    ),
                ], spacing=8),
                ft.Text(
                    "Este QR de uso único solo podrá ser utilizado una vez. Después de que el visitante ingrese, el código se desactivará automáticamente.",
                    size=13,
                    color="grey700"
                ),
            ], spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="white",
            border_radius=12,
            border=ft.border.all(1, "grey300"),
        )

        # Botones
        btn_cancelar = ft.OutlinedButton(
            "Cancelar",
            icon=ft.Icons.CANCEL,
            on_click=cancelar,
            expand=True,
            height=45,
            style=ft.ButtonStyle(
                shape=ft.RoundedRectangleBorder(radius=12)
            )
        )

        btn_generar = ft.ElevatedButton(
            "Generar QR",
            icon=ft.Icons.QR_CODE,
            on_click=generar_qr_func,
            bgcolor="teal600",
            color="white",
            expand=True,
            height=45,
            style=ft.ButtonStyle(
                shape=ft.RoundedRectangleBorder(radius=12)
            )
        )

        botones_container = ft.Container(
            content=ft.Row([
                btn_cancelar,
                btn_generar,
            ], spacing=10),
            padding=ft.padding.symmetric(horizontal=20, vertical=10),
        )

        # Contenedor del formulario
        form_container = ft.Container(
            content=ft.Column([
                info_visitante_card,
                detalles_acceso_card,
                seguridad_card,
                botones_container,
            ], spacing=0, scroll="auto"),
            visible=True
        )

        # Contenedor del QR (inicialmente oculto)
        qr_container = ft.Container(
            content=ft.Column([]),
            padding=20,
            alignment=ft.alignment.center
        )

        # Sección del QR (inicialmente oculta)
        qr_section = ft.Container(
            content=ft.Column([
                qr_container,
            ], spacing=10, scroll="auto", horizontal_alignment="center"),
            visible=False
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
            form_container,
            qr_section,
            ft.Container(expand=True),  # Spacer
        ], spacing=0, scroll="auto", expand=True)
        
        # Contenedor con gestos de swipe
        swipe_container = ft.GestureDetector(
            content=main_content,
            on_horizontal_drag_end=self.on_swipe,
            drag_interval=50,
        )

        self.page.add(swipe_container)

    def mostrar_opciones_compartir(self, e):
        """Muestra un diálogo para elegir cómo compartir"""
        def cerrar_dialogo(e):
            dialog.open = False
            self.page.update()
        
        def compartir_whatsapp_dialog(e):
            cerrar_dialogo(e)
            try:
                self.compartir_whatsapp(e)
            except Exception as ex:
                print(f"Error: {ex}")
        
        def compartir_telegram_dialog(e):
            cerrar_dialogo(e)
            try:
                self.compartir_telegram(e)
            except Exception as ex:
                print(f"Error: {ex}")
        
        dialog = ft.AlertDialog(
            modal=True,
            title=ft.Text("Compartir QR"),
            content=ft.Text("Elige cómo deseas compartir el código QR:"),
            actions=[
                ft.TextButton(
                    "WhatsApp",
                    icon=ft.Icons.CHAT,
                    on_click=compartir_whatsapp_dialog
                ),
                ft.TextButton(
                    "Telegram",
                    icon=ft.Icons.SEND,
                    on_click=compartir_telegram_dialog
                ),
                ft.TextButton("Cancelar", on_click=cerrar_dialogo),
            ],
            actions_alignment=ft.MainAxisAlignment.END,
        )
        
        self.page.dialog = dialog
        dialog.open = True
        self.page.update()

    def compartir_whatsapp(self, e):
        """Comparte el QR por WhatsApp"""
        try:
            if not self.qr_image:
                # Usar snackbar directamente
                snackbar = ft.SnackBar(content=ft.Text("No hay QR para compartir"), bgcolor="red")
                self.page.snack_bar = snackbar
                snackbar.open = True
                self.page.update()
                return
            
            # Preparar mensaje
            nombre_visitante = self.invitacion_creada.get('nombre_invitado', 'Visitante')
            codigo = self.invitacion_creada.get('codigo_acceso', '')
            fecha = self.invitacion_creada.get('fecha_visita', '')
            hora_inicio = self.invitacion_creada.get('hora_inicio', '')
            hora_fin = self.invitacion_creada.get('hora_fin', '')
            
            mensaje = f"*Código QR de Acceso*\n\n"
            mensaje += f"Visitante: {nombre_visitante}\n"
            mensaje += f"Código: {codigo}\n"
            mensaje += f"Fecha: {fecha}\n"
            mensaje += f"Horario: {hora_inicio} - {hora_fin}\n\n"
            mensaje += "Escanea este código QR para acceder al condominio."
            
            # En Windows, usar el esquema de URL de WhatsApp
            import urllib.parse
            mensaje_encoded = urllib.parse.quote(mensaje)
            whatsapp_url = f"https://wa.me/?text={mensaje_encoded}"
            
            # Intentar abrir WhatsApp
            self.page.launch_url(whatsapp_url)
            snackbar = ft.SnackBar(content=ft.Text("Abriendo WhatsApp..."), bgcolor="blue")
            self.page.snack_bar = snackbar
            snackbar.open = True
            self.page.update()
            
        except Exception as ex:
            print(f"Error al compartir por WhatsApp: {str(ex)}")
            snackbar = ft.SnackBar(content=ft.Text(f"Error al compartir: {str(ex)}"), bgcolor="red")
            self.page.snack_bar = snackbar
            snackbar.open = True
            self.page.update()

    def compartir_telegram(self, e):
        """Comparte el QR por Telegram"""
        try:
            if not self.qr_image:
                snackbar = ft.SnackBar(content=ft.Text("No hay QR para compartir"), bgcolor="red")
                self.page.snack_bar = snackbar
                snackbar.open = True
                self.page.update()
                return
            
            # Preparar mensaje
            nombre_visitante = self.invitacion_creada.get('nombre_invitado', 'Visitante')
            codigo = self.invitacion_creada.get('codigo_acceso', '')
            fecha = self.invitacion_creada.get('fecha_visita', '')
            hora_inicio = self.invitacion_creada.get('hora_inicio', '')
            hora_fin = self.invitacion_creada.get('hora_fin', '')
            
            mensaje = f"*Código QR de Acceso*\n\n"
            mensaje += f"Visitante: {nombre_visitante}\n"
            mensaje += f"Código: {codigo}\n"
            mensaje += f"Fecha: {fecha}\n"
            mensaje += f"Horario: {hora_inicio} - {hora_fin}\n\n"
            mensaje += "Escanea este código QR para acceder al condominio."
            
            # En Windows, usar el esquema de URL de Telegram
            import urllib.parse
            mensaje_encoded = urllib.parse.quote(mensaje)
            telegram_url = f"https://t.me/share/url?url=&text={mensaje_encoded}"
            
            # Intentar abrir Telegram
            self.page.launch_url(telegram_url)
            snackbar = ft.SnackBar(content=ft.Text("Abriendo Telegram..."), bgcolor="blue")
            self.page.snack_bar = snackbar
            snackbar.open = True
            self.page.update()
            
        except Exception as ex:
            print(f"Error al compartir por Telegram: {str(ex)}")
            snackbar = ft.SnackBar(content=ft.Text(f"Error al compartir: {str(ex)}"), bgcolor="red")
            self.page.snack_bar = snackbar
            snackbar.open = True
            self.page.update()

    def on_swipe(self, e):
        """Maneja el gesto de swipe horizontal"""
        if e.velocity_x > 500:  # Swipe rápido a la derecha
            from amenidades import AmenidadesVista
            self.page.clean()
            AmenidadesVista(self.page, self.controlador.api_client)
            self.page.update()
        elif e.velocity_x < -500:  # Swipe rápido a la izquierda
            from home import Homevista
            self.page.clean()
            Homevista(self.page, self.controlador.api_client)
            self.page.update()

