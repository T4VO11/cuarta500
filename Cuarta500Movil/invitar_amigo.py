import flet as ft
import qrcode
import io
import json
import base64
from datetime import datetime
from controller import Controlador
from token_storage import TokenStorage

class InvitarAmigoVista:
    def __init__(self, page: ft.Page, api_client=None):
        self.page = page
        self.page.title = "Condominio - Invitar Amigo"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.clean()
        self.controlador = Controlador(page)
        if api_client:
            self.controlador.api_client = api_client
        self.invitacion_creada = None
        self.qr_image = None
        self.build()

    def build(self):
        def volver_propiedad(e):
            from propiedad import PropiedadVista
            self.page.clean()
            PropiedadVista(self.page)

        def generar_codigo_acceso():
            """Genera un código de acceso único"""
            import random
            import string
            return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

        def crear_invitacion(e):
            """Crea la invitación y genera el QR"""
            print("Botón presionado - Iniciando creación de invitación")
            try:
                # Deshabilitar botón mientras se procesa
                btn_crear.disabled = True
                btn_crear.text = "Creando invitación..."
                self.page.update()
                print("Botón deshabilitado, validando campos...")
                
                # Validar campos
                if not nombre_input.value or nombre_input.value.strip() == "":
                    print("Error: Nombre vacío")
                    mostrar_mensaje("Por favor ingresa el nombre del invitado", "error")
                    btn_crear.disabled = False
                    btn_crear.text = "Crear Invitación y Generar QR"
                    self.page.update()
                    return
                
                if not fecha_input.value or fecha_input.value.strip() == "":
                    print("Error: Fecha vacía")
                    mostrar_mensaje("Por favor selecciona la fecha de visita", "error")
                    btn_crear.disabled = False
                    btn_crear.text = "Crear Invitación y Generar QR"
                    self.page.update()
                    return

                print("Campos validados correctamente")
                
                # Obtener datos del usuario actual
                # Primero intentar desde el token guardado
                token, usuario_data = TokenStorage.get_token()
                print(f"Token obtenido del almacenamiento: {token is not None}, Usuario data: {usuario_data}")
                
                # Si no hay token guardado, verificar si hay token en el api_client
                if not token and self.controlador.api_client.token:
                    token = self.controlador.api_client.token
                    print("Token encontrado en api_client")
                
                # Si aún no hay token, el usuario no está autenticado
                if not token:
                    print("Error: No hay token de autenticación")
                    mostrar_mensaje("No estás autenticado. Por favor inicia sesión para crear invitaciones.", "error")
                    btn_crear.disabled = False
                    btn_crear.text = "Crear Invitación y Generar QR"
                    self.page.update()
                    return
                
                # Obtener usuario_id de diferentes fuentes posibles
                usuario_id = None
                if usuario_data:
                    usuario_id = usuario_data.get('usuario_id') or usuario_data.get('_id') or usuario_data.get('id')
                
                # Si no hay usuario_id en los datos guardados, usar un valor por defecto o el número de casa
                if not usuario_id:
                    # Intentar decodificar el token JWT para obtener el usuario_id
                    try:
                        import base64
                        # Los tokens JWT tienen formato: header.payload.signature
                        parts = token.split('.')
                        if len(parts) >= 2:
                            # Decodificar el payload (sin verificar firma, solo para obtener datos)
                            payload = parts[1]
                            # Agregar padding si es necesario
                            payload += '=' * (4 - len(payload) % 4)
                            decoded = base64.urlsafe_b64decode(payload)
                            import json
                            token_data = json.loads(decoded)
                            usuario_id = token_data.get('usuario_id') or token_data.get('id') or token_data.get('userId') or 1
                            print(f"Usuario ID obtenido del token JWT: {usuario_id}")
                    except Exception as ex:
                        print(f"No se pudo decodificar el token: {str(ex)}")
                        usuario_id = 1  # Valor por defecto
                
                # Obtener número de casa
                numero_casa = None
                if usuario_data:
                    numero_casa = usuario_data.get('numero_casa')
                
                # Si no hay número de casa en los datos, usar el del campo o valor por defecto
                if not numero_casa:
                    numero_casa = numero_casa_input.value if numero_casa_input.value and numero_casa_input.value.strip() else 1
                
                print(f"Usuario ID final: {usuario_id}, Número de casa: {numero_casa}")

                # Generar código de acceso si no se proporcionó
                codigo = codigo_input.value if codigo_input.value and codigo_input.value.strip() else generar_codigo_acceso()
                print(f"Código de acceso: {codigo}")
                
                # Preparar datos del vehículo
                vehiculo_data = {}
                if (modelo_input.value and modelo_input.value.strip()) or (color_input.value and color_input.value.strip()) or (placas_input.value and placas_input.value.strip()):
                    vehiculo_data = {
                        "modelo": modelo_input.value.strip() if modelo_input.value else "",
                        "color": color_input.value.strip() if color_input.value else "",
                        "placas": placas_input.value.strip() if placas_input.value else ""
                    }
                print(f"Datos del vehículo: {vehiculo_data}")

                # Generar un ID único para la invitación
                invitacion_id = int(datetime.now().timestamp() * 1000) % 1000000
                print(f"ID de invitación generado: {invitacion_id}")

                # Preparar datos de la invitación
                invitacion_data = {
                    "invitacion_id": invitacion_id,
                    "usuario_id": usuario_id,
                    "numeroCasa": int(numero_casa) if isinstance(numero_casa, (int, str)) and str(numero_casa).strip() else 1,
                    "nombre_invitado": nombre_input.value.strip(),
                    "codigo_acceso": codigo,
                    "fecha_visita": fecha_input.value.strip(),
                    "estado": "pendiente",
                    "vehiculo": vehiculo_data
                }

                # Crear invitación en el backend
                print(f"Enviando datos de invitación al servidor: {invitacion_data}")
                exito, data, mensaje = self.controlador.api_client.crear_invitacion(invitacion_data)
                print(f"Respuesta del servidor - Éxito: {exito}, Mensaje: {mensaje}, Data: {data}")
                
                if exito:
                    if data:
                        self.invitacion_creada = data
                        print(f"Invitación creada exitosamente: {data}")
                        mostrar_mensaje("Invitación creada exitosamente y guardada en la base de datos", "exito")
                        # Generar QR de forma síncrona pero segura
                        generar_qr()
                    else:
                        print("Error: No se recibieron datos de la invitación")
                        mostrar_mensaje("Error: No se recibieron datos de la invitación creada", "error")
                        btn_crear.disabled = False
                        btn_crear.text = "Crear Invitación y Generar QR"
                        self.page.update()
                else:
                    print(f"Error del servidor: {mensaje}")
                    error_msg = mensaje if mensaje else "Error desconocido al crear invitación"
                    # Verificar si es un error de permisos
                    if "admin" in error_msg.lower() or "permiso" in error_msg.lower() or "autorizado" in error_msg.lower():
                        error_msg = "No tienes permisos para crear invitaciones. Se requiere rol de administrador."
                    mostrar_mensaje(f"Error: {error_msg}", "error")
                    btn_crear.disabled = False
                    btn_crear.text = "Crear Invitación y Generar QR"
                    self.page.update()
            except Exception as ex:
                import traceback
                print(f"Error al crear invitación: {str(ex)}")
                print(traceback.format_exc())
                mostrar_mensaje(f"Error: {str(ex)}", "error")
                btn_crear.disabled = False
                btn_crear.text = "Crear Invitación y Generar QR"
                self.page.update()

        def generar_qr():
            """Genera el código QR con los datos de la invitación"""
            try:
                if not self.invitacion_creada:
                    return

                # Preparar datos para el QR
                qr_data = {
                    "tipo": "invitacion_condominio",
                    "invitacion_id": self.invitacion_creada.get("invitacion_id"),
                    "nombre_invitado": self.invitacion_creada.get("nombre_invitado"),
                    "codigo_acceso": self.invitacion_creada.get("codigo_acceso"),
                    "fecha_visita": self.invitacion_creada.get("fecha_visita"),
                    "numero_casa": self.invitacion_creada.get("numeroCasa"),
                    "condominio_id": self.invitacion_creada.get("condominio_id", "C500"),
                    "vehiculo": self.invitacion_creada.get("vehiculo", {}),
                    "descripcion": f"Invitación para {self.invitacion_creada.get('nombre_invitado')} - Fecha: {self.invitacion_creada.get('fecha_visita')} - Código: {self.invitacion_creada.get('codigo_acceso')}"
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
                mostrar_qr()
            except Exception as ex:
                print(f"Error al generar QR: {str(ex)}")
                mostrar_mensaje(f"Error al generar QR: {str(ex)}", "error")

        def mostrar_qr():
            """Muestra el QR generado en la interfaz"""
            try:
                if not self.qr_image:
                    return

                # Codificar imagen en base64
                qr_base64 = base64.b64encode(self.qr_image).decode('utf-8')
                
                # Actualizar el contenedor del QR
                qr_container.content = ft.Column([
                    ft.Text("Código QR de Invitación", size=18, weight="bold", color="black"),
                    ft.Image(
                        src_base64=qr_base64,
                        width=250,
                        height=250,
                    ),
                    ft.Text(
                        f"Código: {self.invitacion_creada.get('codigo_acceso')}",
                        size=14,
                        weight="bold",
                        color="purple600"
                    ),
                    ft.Text(
                        "Escanea este código para acceder al condominio",
                        size=12,
                        color="grey600",
                        text_align="center"
                    ),
                ], horizontal_alignment="center", spacing=10)
                
                # Mostrar información de la invitación
                info_container.content = ft.Column([
                    ft.Text("Información de la Invitación", size=16, weight="bold", color="black"),
                    ft.Divider(),
                    ft.Text(f"Nombre: {self.invitacion_creada.get('nombre_invitado')}", size=14, color="black"),
                    ft.Text(f"Fecha: {self.invitacion_creada.get('fecha_visita')}", size=14, color="black"),
                    ft.Text(f"Casa: {self.invitacion_creada.get('numeroCasa')}", size=14, color="black"),
                    ft.Text(f"Estado: {self.invitacion_creada.get('estado', 'pendiente')}", size=14, color="green"),
                ], spacing=8)
                
                # Ocultar formulario y mostrar QR
                form_container.visible = False
                qr_section.visible = True
                
                # Restaurar botón
                btn_crear.disabled = False
                btn_crear.text = "Crear Invitación y Generar QR"
                
                # Actualizar página de forma segura
                try:
                    if self.page:
                        self.page.update()
                except RuntimeError as runtime_error:
                    # Si el event loop está cerrado, intentar de nuevo
                    if "Event loop is closed" in str(runtime_error):
                        print("Event loop cerrado, reintentando actualización...")
                        try:
                            # Dar tiempo para que el event loop se estabilice
                            import time
                            time.sleep(0.1)
                            if self.page:
                                self.page.update()
                        except:
                            pass
                    else:
                        print(f"Error al actualizar página: {str(runtime_error)}")
                except Exception as update_error:
                    print(f"Error al actualizar página: {str(update_error)}")
            except Exception as ex:
                print(f"Error al mostrar QR: {str(ex)}")
                mostrar_mensaje(f"Error al mostrar QR: {str(ex)}", "error")

        def nueva_invitacion(e):
            """Permite crear una nueva invitación"""
            form_container.visible = True
            qr_section.visible = False
            self.invitacion_creada = None
            self.qr_image = None
            # Limpiar campos
            nombre_input.value = ""
            fecha_input.value = ""
            codigo_input.value = ""
            numero_casa_input.value = ""
            modelo_input.value = ""
            color_input.value = ""
            placas_input.value = ""
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
                if self.page:
                    self.page.update()
            except RuntimeError as runtime_error:
                if "Event loop is closed" not in str(runtime_error):
                    print(f"Error al mostrar mensaje: {str(runtime_error)}")
            except Exception as ex:
                print(f"Error al mostrar mensaje: {str(ex)}")

        # Header
        header = ft.Container(
            content=ft.Row([
                ft.IconButton(
                    icon=ft.Icons.ARROW_BACK,
                    on_click=volver_propiedad,
                    tooltip="Volver a Propiedad"
                ),
                ft.Text("Invitar Amigo", size=20, weight="bold", color="black"),
                ft.Container(expand=True),  # Spacer
            ]),
            padding=20,
            bgcolor="white",
        )

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

        # Campos del formulario
        nombre_input = ft.TextField(
            label="Nombre del Invitado",
            hint_text="Ingresa el nombre completo",
            prefix_icon=ft.Icons.PERSON,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True
        )

        fecha_input = ft.TextField(
            label="Fecha de Visita",
            hint_text="YYYY-MM-DD (ej: 2024-07-20)",
            prefix_icon=ft.Icons.CALENDAR_TODAY,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True,
            max_length=10,
            on_change=formatear_fecha
        )

        codigo_input = ft.TextField(
            label="Código de Acceso (opcional)",
            hint_text="Se generará automáticamente si se deja vacío",
            prefix_icon=ft.Icons.LOCK,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True
        )

        numero_casa_input = ft.TextField(
            label="Número de Casa",
            hint_text="Número de casa",
            prefix_icon=ft.Icons.HOME,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True
        )

        # Sección de vehículo (opcional)
        modelo_input = ft.TextField(
            label="Modelo del Vehículo (opcional)",
            hint_text="Ej: Honda Civic",
            prefix_icon=ft.Icons.DIRECTIONS_CAR,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True
        )

        color_input = ft.TextField(
            label="Color del Vehículo (opcional)",
            hint_text="Ej: Blanco",
            prefix_icon=ft.Icons.COLOR_LENS,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True
        )

        placas_input = ft.TextField(
            label="Placas del Vehículo (opcional)",
            hint_text="Ej: ABC-123",
            prefix_icon=ft.Icons.CREDIT_CARD,
            border_radius=10,
            color="black",
            text_size=14,
            expand=True
        )

        # Botón crear invitación
        btn_crear = ft.ElevatedButton(
            "Crear Invitación y Generar QR",
            icon=ft.Icons.PERSON_ADD,
            on_click=crear_invitacion,
            bgcolor="purple600",
            color="white",
            expand=True,
            height=50
        )

        # Contenedor del formulario
        form_container = ft.Container(
            content=ft.Column([
                ft.Text("Nueva Invitación", size=22, weight="bold", color="black"),
                ft.Divider(),
                nombre_input,
                fecha_input,
                codigo_input,
                numero_casa_input,
                ft.Container(
                    content=ft.Text("Información del Vehículo (opcional)", size=16, weight="bold", color="black"),
                    margin=ft.margin.only(top=10)
                ),
                modelo_input,
                color_input,
                placas_input,
                btn_crear,
            ], spacing=15, scroll="auto"),
            padding=20,
            visible=True
        )

        # Contenedor del QR (inicialmente oculto)
        qr_container = ft.Container(
            content=ft.Column([]),
            padding=20,
            alignment=ft.alignment.center
        )

        # Contenedor de información
        info_container = ft.Container(
            content=ft.Column([]),
            padding=20,
            bgcolor="grey100",
            margin=10,
            border_radius=10
        )

        # Sección del QR (inicialmente oculta)
        qr_section = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.IconButton(
                        icon=ft.Icons.ADD_CIRCLE,
                        on_click=nueva_invitacion,
                        tooltip="Nueva Invitación",
                        icon_color="purple600"
                    ),
                    ft.Text("Nueva Invitación", size=16, color="purple600"),
                ]),
                qr_container,
                info_container,
            ], spacing=10, scroll="auto"),
            visible=False
        )

        # Contenido principal
        main_content = ft.Column([
            header,
            form_container,
            qr_section,
            ft.Container(expand=True),  
        ], spacing=0, scroll="auto")

        self.page.add(main_content)

