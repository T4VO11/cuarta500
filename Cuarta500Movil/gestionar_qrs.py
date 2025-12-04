import flet as ft
import qrcode
import io
import json
import base64
from datetime import datetime
from controller import Controlador
from token_storage import TokenStorage

class GestionarQRsVista:
    def __init__(self, page: ft.Page, api_client=None):
        self.page = page
        self.page.title = "Condominio - QRs Activos"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.scroll = ft.ScrollMode.AUTO
        self.page.clean()
        self.controlador = Controlador(page)
        if api_client:
            self.controlador.api_client = api_client
        self.invitaciones = []
        self.filtro_actual = "todos"  # "todos", "activos", "caducados", "revocados"
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

        def determinar_estado_qr(invitacion, ahora):
            """
            Determina el estado real del QR basándose solo en el estado del backend.
            NO se valida por fechas hasta que el IoT esté implementado.
            El IoT será el responsable de marcar QRs como caducados cuando se validen.
            """
            estado = invitacion.get('estado', 'pendiente')
            
            # Si está cancelado, está revocado
            if estado == 'cancelado':
                return "revocado"
            
            # NOTA: No validamos fechas aquí porque el IoT aún no está implementado.
            # Cuando el IoT valide un QR y determine que está caducado,
            # deberá actualizar el estado en el backend a 'caducado' o similar.
            # Por ahora, todos los QRs que no estén cancelados se consideran activos.
            
            # Si el estado es 'completado', podría indicar que ya fue usado
            # pero lo mantenemos como activo hasta que el IoT lo marque explícitamente como caducado
            if estado == 'completado':
                # Podríamos considerar esto como "usado" pero no "caducado"
                # Por ahora lo mantenemos como activo para QRs de múltiples usos
                return "activo"
            
            # Estados 'pendiente' y 'confirmado' son activos
            return "activo"

        def generar_qr_desde_invitacion(invitacion):
            """Genera el código QR desde los datos de la invitación"""
            try:
                tipo_qr = invitacion.get('tipo_qr', 'uso_unico')
                
                if tipo_qr == 'uso_unico':
                    # Preparar datos para QR de uso único
                    qr_data = {
                        "tipo": "qr_uso_unico",
                        "invitacion_id": invitacion.get("invitacion_id"),
                        "nombre_invitado": invitacion.get("nombre_invitado"),
                        "codigo_acceso": invitacion.get("codigo_acceso"),
                        "fecha_visita": invitacion.get("fecha_visita"),
                        "hora_inicio": invitacion.get("hora_inicio", ""),
                        "hora_fin": invitacion.get("hora_fin", ""),
                        "numero_casa": invitacion.get("numeroCasa"),
                        "condominio_id": invitacion.get("condominio_id", "C500"),
                        "tipo_qr": "uso_unico",
                        "vehiculo": invitacion.get("vehiculo", {})
                    }
                else:
                    # Preparar datos para QR de usos múltiples
                    qr_data = {
                        "tipo": "qr_usos_multiples",
                        "invitacion_id": invitacion.get("invitacion_id"),
                        "nombre_invitado": invitacion.get("nombre_invitado"),
                        "codigo_acceso": invitacion.get("codigo_acceso"),
                        "fecha_inicio": invitacion.get("fecha_inicio"),
                        "fecha_fin": invitacion.get("fecha_fin"),
                        "numero_usos": invitacion.get("numero_usos", 0),
                        "areas_permitidas": invitacion.get("areas_permitidas", []),
                        "numero_casa": invitacion.get("numeroCasa"),
                        "condominio_id": invitacion.get("condominio_id", "C500"),
                        "tipo_qr": "usos_multiples",
                        "vehiculo": invitacion.get("vehiculo", {})
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
                
                # Convertir a bytes
                img_buffer = io.BytesIO()
                img.save(img_buffer, format='PNG')
                img_buffer.seek(0)
                
                qr_image_bytes = img_buffer.getvalue()
                img_buffer.close()
                
                return qr_image_bytes
            except Exception as ex:
                print(f"Error al generar QR: {str(ex)}")
                import traceback
                traceback.print_exc()
                return None

        def descargar_qr_desde_dialogo(qr_image_bytes, invitacion):
            """Descarga el QR como imagen desde el diálogo"""
            try:
                if not qr_image_bytes:
                    mostrar_mensaje("No hay QR para descargar", "error")
                    return
                
                import os
                
                # Crear directorio de descargas si no existe
                downloads_dir = os.path.join(os.path.expanduser("~"), "Downloads")
                if not os.path.exists(downloads_dir):
                    downloads_dir = os.path.expanduser("~")
                
                # Nombre del archivo
                codigo = invitacion.get('codigo_acceso', 'QR')
                tipo = "SINGLE" if invitacion.get('tipo_qr') == 'uso_unico' else "MULTI"
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"QR_{tipo}_{codigo}_{timestamp}.png"
                filepath = os.path.join(downloads_dir, filename)
                
                # Guardar archivo
                with open(filepath, 'wb') as f:
                    f.write(qr_image_bytes)
                
                mostrar_mensaje(f"QR descargado en: {filepath}", "exito")
                
            except Exception as ex:
                print(f"Error al descargar QR: {str(ex)}")
                mostrar_mensaje(f"Error al descargar: {str(ex)}", "error")

        def compartir_qr_whatsapp(qr_image_bytes, invitacion):
            """Comparte el QR por WhatsApp"""
            try:
                nombre_visitante = invitacion.get('nombre_invitado', 'Visitante')
                codigo = invitacion.get('codigo_acceso', '')
                tipo_qr = invitacion.get('tipo_qr', 'uso_unico')
                
                if tipo_qr == 'uso_unico':
                    fecha = invitacion.get('fecha_visita', '')
                    hora_inicio = invitacion.get('hora_inicio', '')
                    hora_fin = invitacion.get('hora_fin', '')
                    
                    mensaje = f"*Código QR de Acceso*\n\n"
                    mensaje += f"Visitante: {nombre_visitante}\n"
                    mensaje += f"Código: {codigo}\n"
                    mensaje += f"Fecha: {fecha}\n"
                    mensaje += f"Horario: {hora_inicio} - {hora_fin}\n\n"
                    mensaje += "Escanea este código QR para acceder al condominio."
                else:
                    fecha_inicio = invitacion.get('fecha_inicio', '')
                    fecha_fin = invitacion.get('fecha_fin', '')
                    numero_usos = invitacion.get('numero_usos', 0)
                    
                    mensaje = f"*Código QR de Acceso - Usos Múltiples*\n\n"
                    mensaje += f"Visitante: {nombre_visitante}\n"
                    mensaje += f"Código: MULTI-{codigo}\n"
                    mensaje += f"Válido: {fecha_inicio} al {fecha_fin}\n"
                    mensaje += f"Número de usos: {numero_usos}\n\n"
                    mensaje += "Escanea este código QR para acceder al condominio."
                
                # En Windows, usar el esquema de URL de WhatsApp
                import urllib.parse
                mensaje_encoded = urllib.parse.quote(mensaje)
                whatsapp_url = f"https://wa.me/?text={mensaje_encoded}"
                
                # Intentar abrir WhatsApp
                self.page.launch_url(whatsapp_url)
                mostrar_mensaje("Abriendo WhatsApp...", "info")
                
            except Exception as ex:
                print(f"Error al compartir por WhatsApp: {str(ex)}")
                mostrar_mensaje(f"Error al compartir: {str(ex)}", "error")

        def ver_detalles_qr(invitacion):
            """Muestra los detalles del QR con opción de verlo nuevamente"""
            try:
                print(f"🔍 ver_detalles_qr llamado para: {invitacion.get('nombre_invitado')}")
                # Generar QR desde la invitación
                qr_image_bytes = generar_qr_desde_invitacion(invitacion)
                print(f"✅ QR generado: {len(qr_image_bytes) if qr_image_bytes else 0} bytes")
                
                if not qr_image_bytes:
                    mostrar_mensaje("Error al generar el QR", "error")
                    return
                
                # Codificar imagen en base64
                qr_base64 = base64.b64encode(qr_image_bytes).decode('utf-8')
                
                # Obtener datos para mostrar
                nombre_visitante = invitacion.get('nombre_invitado', 'Visitante')
                codigo = invitacion.get('codigo_acceso', '')
                tipo_qr = invitacion.get('tipo_qr', 'uso_unico')
                
                # Preparar información según tipo
                if tipo_qr == 'uso_unico':
                    fecha = invitacion.get('fecha_visita', '')
                    hora_inicio = invitacion.get('hora_inicio', '')
                    hora_fin = invitacion.get('hora_fin', '')
                    validez_texto = f"Válido hasta: {fecha} {hora_fin} hrs"
                    tipo_texto = "Uso Único"
                    codigo_display = f"SINGLE-{codigo}"
                else:
                    fecha_inicio = invitacion.get('fecha_inicio', '')
                    fecha_fin = invitacion.get('fecha_fin', '')
                    numero_usos = invitacion.get('numero_usos', 0)
                    usos_actuales = invitacion.get('usos_actuales', 0)
                    
                    # Formatear fechas
                    try:
                        if '-' in fecha_inicio:
                            partes = fecha_inicio.split('-')
                            if len(partes) == 3:
                                fecha_inicio = f"{partes[2]}/{partes[1]}/{partes[0]}"
                        if '-' in fecha_fin:
                            partes = fecha_fin.split('-')
                            if len(partes) == 3:
                                fecha_fin = f"{partes[2]}/{partes[1]}/{partes[0]}"
                    except:
                        pass
                    
                    validez_texto = f"Válido: {fecha_inicio} al {fecha_fin}"
                    tipo_texto = "Usos Múltiples"
                    codigo_display = f"MULTI-{codigo}"
                    if numero_usos > 0:
                        usos_restantes = numero_usos - usos_actuales
                        validez_texto += f" | Usos: {usos_actuales}/{numero_usos}"
                
                # Mostrar QR en contenedor en lugar de diálogo (más confiable en móvil)
                print(f"🔍 Mostrando QR en contenedor...")
                
                # Ocultar lista y mostrar QR
                self.contenido_container.visible = False
                self.tabs_container.visible = False
                self.qr_view_container.visible = True
                
                # Crear contenido del QR
                self.qr_view_container.content = ft.Column([
                    # Botón volver
                    ft.Row([
                        ft.IconButton(
                            icon=ft.Icons.ARROW_BACK,
                            on_click=lambda e: self.volver_a_lista(),
                            tooltip="Volver a la lista"
                        ),
                        ft.Text(
                            "Código QR",
                            size=24,
                            weight="bold",
                            color="grey900",
                            expand=True
                        ),
                    ], spacing=10),
                    
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
                        alignment=ft.alignment.center,
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
                                        codigo_display,
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
                                ft.Text(f"Tipo de Acceso: {tipo_texto}", size=13, color="grey700", expand=True),
                            ], spacing=8),
                        ], spacing=12),
                        padding=20,
                        margin=ft.margin.symmetric(horizontal=20, vertical=10),
                        bgcolor="grey50",
                        border_radius=12,
                        border=ft.border.all(1, "grey300"),
                    ),
                    
                    # Botones de acción
                    ft.Container(
                        content=ft.Column([
                            ft.ElevatedButton(
                                "Compartir QR",
                                icon=ft.Icons.SHARE,
                                on_click=lambda e: compartir_qr_whatsapp(qr_image_bytes, invitacion),
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
                                on_click=lambda e: descargar_qr_desde_dialogo(qr_image_bytes, invitacion),
                                expand=True,
                                height=50,
                                style=ft.ButtonStyle(
                                    shape=ft.RoundedRectangleBorder(radius=12)
                                )
                            ),
                        ], spacing=10),
                        padding=ft.padding.symmetric(horizontal=20, vertical=10),
                    ),
                ], spacing=0, scroll="auto", horizontal_alignment="center")
                
                print(f"🔍 Actualizando page para mostrar QR...")
                self.page.update()
                print(f"✅ QR debería estar visible ahora")
                
            except Exception as ex:
                print(f"Error al mostrar detalles del QR: {str(ex)}")
                import traceback
                traceback.print_exc()
                mostrar_mensaje(f"Error al mostrar QR: {str(ex)}", "error")
        
        def cerrar_dialogo_qr(e=None):
            """Cierra el diálogo del QR"""
            if self.page.dialog:
                self.page.dialog.open = False
                self.page.update()

        def crear_card_qr(invitacion, ver_detalles_func):
            """Crea un card para un QR"""
            # Crear una copia de la invitación para evitar problemas de referencia
            invitacion_copy = invitacion.copy() if isinstance(invitacion, dict) else invitacion
            
            nombre_visitante = invitacion_copy.get('nombre_invitado', 'Visitante')
            tipo_qr = invitacion_copy.get('tipo_qr', 'uso_unico')
            estado_invitacion = invitacion_copy.get('estado', 'pendiente')
            
            # Determinar estado real
            ahora = datetime.now()
            estado_real = determinar_estado_qr(invitacion_copy, ahora)
            
            # Crear función de clic que capture correctamente la invitación
            def hacer_clic(e):
                print(f"🔍 Click en QR: {nombre_visitante}, ID: {invitacion_copy.get('invitacion_id')}")
                try:
                    ver_detalles_func(invitacion_copy)
                except Exception as ex:
                    print(f"❌ Error al llamar ver_detalles_func: {str(ex)}")
                    import traceback
                    traceback.print_exc()
                    mostrar_mensaje(f"Error: {str(ex)}", "error")
            
            # Icono según tipo
            if tipo_qr == 'usos_multiples':
                icono = ft.Icons.REPEAT
            else:
                icono = ft.Icons.QR_CODE
            
            # Texto del tipo
            tipo_texto = "Uso Único" if tipo_qr == 'uso_unico' else "Múltiples Usos"
            
            # Texto de usos
            if tipo_qr == 'usos_multiples':
                numero_usos = invitacion.get('numero_usos', 0)
                if numero_usos == 0:
                    usos_texto = "Ilimitado"
                else:
                    usos_texto = str(numero_usos)
            else:
                # Para uso único, verificar si ya se usó
                usos_texto = "1"  # Siempre 1 para uso único
            
            # Fecha de vencimiento
            fecha_vencimiento = ""
            if tipo_qr == 'usos_multiples':
                fecha_fin = invitacion.get('fecha_fin', '')
                if fecha_fin:
                    try:
                        fecha_obj = datetime.strptime(fecha_fin, "%Y-%m-%d")
                        fecha_vencimiento = fecha_obj.strftime("%d/%m/%Y")
                    except:
                        fecha_vencimiento = fecha_fin
            else:
                fecha_visita = invitacion.get('fecha_visita', '')
                if fecha_visita:
                    try:
                        fecha_obj = datetime.strptime(fecha_visita, "%Y-%m-%d")
                        fecha_vencimiento = fecha_obj.strftime("%d/%m/%Y")
                    except:
                        fecha_vencimiento = fecha_visita
            
            # Color y texto del estado
            if estado_real == "activo":
                estado_color = "green600"
                estado_texto = "Activo"
            elif estado_real == "caducado":
                estado_color = "orange600"
                estado_texto = "Caducado"
            else:  # revocado
                estado_color = "red600"
                estado_texto = "Revocado"

            card = ft.Container(
                content=ft.Row([
                    ft.Container(
                        content=ft.Icon(
                            icono,
                            size=32,
                            color="teal600"
                        ),
                        padding=ft.padding.only(right=15),
                    ),
                    ft.Column([
                        ft.Text(
                            nombre_visitante,
                            size=16,
                            weight="bold",
                            color="grey900"
                        ),
                        ft.Text(
                            f"Tipo: {tipo_texto}",
                            size=13,
                            color="grey600"
                        ),
                        ft.Text(
                            f"Usos: {usos_texto}",
                            size=13,
                            color="grey600"
                        ),
                        ft.Text(
                            f"Vence: {fecha_vencimiento}",
                            size=13,
                            color="grey600"
                        ),
                    ], spacing=4, expand=True),
                    ft.Container(
                        content=ft.Text(
                            estado_texto,
                            size=12,
                            weight="w500",
                            color="white"
                        ),
                        bgcolor=estado_color,
                        padding=ft.padding.symmetric(horizontal=10, vertical=5),
                        border_radius=12,
                    ),
                    ft.Icon(
                        ft.Icons.CHEVRON_RIGHT,
                        size=24,
                        color="grey400"
                    ),
                ], 
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
                spacing=10),
                padding=20,
                margin=ft.margin.symmetric(horizontal=20, vertical=5),
                bgcolor="grey50",
                border_radius=12,
                border=ft.border.all(1, "grey300"),
                on_click=hacer_clic,
            )
            
            return card

        def filtrar_invitaciones():
            """Filtra las invitaciones según el filtro actual"""
            if self.filtro_actual == "todos":
                return self.invitaciones
            
            ahora = datetime.now()
            filtradas = []
            
            for invitacion in self.invitaciones:
                estado_invitacion = invitacion.get('estado', 'pendiente')
                tipo_qr = invitacion.get('tipo_qr', 'uso_unico')
                
                # Determinar estado real del QR
                estado_real = determinar_estado_qr(invitacion, ahora)
                
                if self.filtro_actual == "activos" and estado_real == "activo":
                    filtradas.append(invitacion)
                elif self.filtro_actual == "caducados" and estado_real == "caducado":
                    filtradas.append(invitacion)
                elif self.filtro_actual == "revocados" and estado_real == "revocado":
                    filtradas.append(invitacion)
            
            return filtradas

        def actualizar_lista_qrs(recargar_desde_bd=False):
            """Actualiza la lista de QRs según el filtro"""
            # Recargar invitaciones desde la BD si se solicita
            if recargar_desde_bd:
                self.cargar_invitaciones()
            
            contenido_column.controls.clear()
            
            # Filtrar invitaciones según el filtro
            invitaciones_filtradas = filtrar_invitaciones()
            
            if not invitaciones_filtradas:
                mensaje = "No hay QRs activos" if self.filtro_actual == "activos" else \
                         "No hay QRs caducados" if self.filtro_actual == "caducados" else \
                         "No hay QRs revocados" if self.filtro_actual == "revocados" else \
                         "No hay QRs generados"
                contenido_column.controls.append(
                    ft.Container(
                        content=ft.Text(
                            mensaje,
                            size=14,
                            color="grey500",
                            text_align=ft.TextAlign.CENTER
                        ),
                        padding=40,
                        alignment=ft.alignment.center,
                    )
                )
            else:
                for invitacion in invitaciones_filtradas:
                    contenido_column.controls.append(crear_card_qr(invitacion, ver_detalles_qr))

        def cambiar_filtro(filtro):
            """Cambia el filtro de QRs"""
            self.filtro_actual = filtro
            
            # Actualizar estilos de los tabs
            for tab in tabs:
                if tab.data == filtro:
                    tab.bgcolor = "grey200"
                    tab.content.color = "grey900"
                else:
                    tab.bgcolor = "white"
                    tab.content.color = "grey600"
            
            # Actualizar contenido
            actualizar_lista_qrs()
            self.page.update()

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

        # Cargar invitaciones
        self.cargar_invitaciones()

        def refrescar_lista(e):
            """Recarga los QRs desde la base de datos"""
            mostrar_mensaje("Actualizando lista de QRs...", "info")
            actualizar_lista_qrs(recargar_desde_bd=True)
            mostrar_mensaje("Lista actualizada", "exito")

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
                        icon=ft.Icons.REFRESH,
                        icon_size=24,
                        tooltip="Actualizar lista",
                        on_click=refrescar_lista
                    ),
                    ft.IconButton(
                        icon=ft.Icons.NOTIFICATIONS_OUTLINED,
                        icon_size=24,
                        tooltip="Notificaciones",
                        on_click=lambda e: print("Abrir notificaciones")
                    )
                ]),
                ft.Text(
                    "QRs Activos",
                    size=28,
                    weight="bold",
                    color="grey900"
                ),
                ft.Text(
                    "Gestiona tus códigos QR generados",
                    size=14,
                    color="grey600"
                ),
            ], spacing=10),
            padding=20,
            bgcolor="white",
        )

        # Tabs de filtrado
        tab_todos = ft.Container(
            content=ft.Text("Todos", size=14, weight="w500", color="grey900"),
            data="todos",
            padding=12,
            bgcolor="grey200",
            border_radius=20,
            on_click=lambda e: cambiar_filtro("todos"),
        )

        tab_activos = ft.Container(
            content=ft.Text("Activos", size=14, weight="w500", color="grey600"),
            data="activos",
            padding=12,
            bgcolor="white",
            border_radius=20,
            on_click=lambda e: cambiar_filtro("activos"),
        )

        tab_caducados = ft.Container(
            content=ft.Text("Caducados", size=14, weight="w500", color="grey600"),
            data="caducados",
            padding=12,
            bgcolor="white",
            border_radius=20,
            on_click=lambda e: cambiar_filtro("caducados"),
        )

        tab_revocados = ft.Container(
            content=ft.Text("Revocados", size=14, weight="w500", color="grey600"),
            data="revocados",
            padding=12,
            bgcolor="white",
            border_radius=20,
            on_click=lambda e: cambiar_filtro("revocados"),
        )

        tabs = [tab_todos, tab_activos, tab_caducados, tab_revocados]

        tabs_container = ft.Container(
            content=ft.Row(tabs, spacing=8, scroll="auto"),
            padding=ft.padding.symmetric(horizontal=20, vertical=10),
            bgcolor="white",
        )

        # Contenedor de contenido (se actualiza dinámicamente)
        contenido_column = ft.Column([], spacing=10, scroll="auto", expand=True)
        
        # Contenedor para mostrar el QR (inicialmente oculto)
        qr_view_container = ft.Container(
            content=ft.Column([]),
            visible=False,
            padding=20,
        )
        
        # Inicializar contenido
        actualizar_lista_qrs()

        contenido_container = ft.Container(
            content=contenido_column,
            padding=ft.padding.symmetric(horizontal=20),
            expand=True,
        )

        # Botón volver a opciones
        btn_volver = ft.OutlinedButton(
            "Volver a Opciones",
            icon=ft.Icons.ARROW_BACK,
            on_click=volver_opciones,
            expand=True,
            height=45,
            style=ft.ButtonStyle(
                shape=ft.RoundedRectangleBorder(radius=12)
            )
        )

        boton_container = ft.Container(
            content=btn_volver,
            padding=ft.padding.symmetric(horizontal=20, vertical=10),
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
            tabs_container,
            contenido_container,
            qr_view_container,  # Vista del QR (oculta por defecto)
            boton_container,
        ], spacing=0, scroll="auto", expand=True)
        
        # Contenedor con gestos de swipe
        swipe_container = ft.GestureDetector(
            content=main_content,
            on_horizontal_drag_end=self.on_swipe,
            drag_interval=50,
        )

        self.page.add(swipe_container)
        
        # Guardar referencias para actualización
        self.tabs = tabs
        self.contenido_column = contenido_column
        self.actualizar_lista_qrs = actualizar_lista_qrs
        self.contenido_container = contenido_container
        self.tabs_container = tabs_container
        self.qr_view_container = qr_view_container

    def cargar_invitaciones(self):
        """Carga las invitaciones del usuario desde el backend"""
        try:
            print("Cargando invitaciones del usuario...")
            exito, invitaciones, mensaje = self.controlador.api_client.obtener_mis_invitaciones()
            if exito:
                self.invitaciones = invitaciones
                print(f"Invitaciones cargadas exitosamente: {len(invitaciones)} invitaciones encontradas")
                if invitaciones:
                    for invitacion in invitaciones:
                        print(f"  - Invitación ID: {invitacion.get('invitacion_id')}, Visitante: {invitacion.get('nombre_invitado')}, Tipo: {invitacion.get('tipo_qr')}")
            else:
                print(f"Error al cargar invitaciones: {mensaje}")
                self.invitaciones = []
        except Exception as e:
            print(f"Error al cargar invitaciones: {e}")
            import traceback
            traceback.print_exc()
            self.invitaciones = []


    def volver_a_lista(self):
        """Vuelve a mostrar la lista de QRs ocultando la vista del QR"""
        try:
            self.contenido_container.visible = True
            self.tabs_container.visible = True
            self.qr_view_container.visible = False
            self.page.update()
            print("✅ Volviendo a la lista de QRs")
        except Exception as ex:
            print(f"Error al volver a la lista: {str(ex)}")
            import traceback
            traceback.print_exc()

    def on_swipe(self, e):
        """Maneja el gesto de swipe horizontal"""
        # Solo permitir swipe si estamos en la lista, no en la vista del QR
        if hasattr(self, 'qr_view_container') and self.qr_view_container.visible:
            return  # No hacer swipe si estamos viendo un QR
            
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

