import flet as ft
from controller import Controlador
from token_storage import TokenStorage
import json
import base64

class PerfilVista:
    def __init__(self, page: ft.Page, api_client=None):
        self.page = page
        self.page.title = "Condominio - Perfil"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.scroll = ft.ScrollMode.AUTO
        self.page.clean()
        self.controlador = Controlador(page)
        if api_client:
            self.controlador.api_client = api_client
        self.usuario_data = None
        try:
            self.build()
        except Exception as e:
            print(f"Error al construir perfil: {e}")
            import traceback
            traceback.print_exc()
            # Mostrar mensaje de error al usuario
            self.page.add(ft.Text(f"Error al cargar perfil: {str(e)}", color="red"))
            self.page.update()
    
    def build(self):
        # Obtener datos del usuario (se carga de forma asíncrona, pero usamos datos del token primero)
        token, usuario_data = TokenStorage.get_token()
        if usuario_data:
            self.usuario_data = usuario_data
        
        # Cargar datos completos en segundo plano
        self.cargar_datos_usuario()
        
        def volver_home(e):
            from home import Homevista
            self.page.clean()
            Homevista(self.page, self.controlador.api_client)
        
        def ir_a_vehiculos(e):
            # TODO: Implementar vista de vehículos
            mostrar_mensaje("Funcionalidad de vehículos en desarrollo", "info")
        
        def ir_a_residentes_autorizados(e):
            # TODO: Implementar vista de residentes autorizados
            mostrar_mensaje("Funcionalidad de residentes autorizados en desarrollo", "info")
        
        def ir_a_historial_accesos(e):
            from historial_accesos import HistorialAccesosVista
            self.page.clean()
            HistorialAccesosVista(self.page, self.controlador.api_client)
        
        def mostrar_mensaje(texto, tipo="info"):
            color = "teal600" if tipo == "info" else "red600" if tipo == "error" else "blue600"
            snackbar = ft.SnackBar(
                content=ft.Text(texto),
                bgcolor=color,
            )
            self.page.snack_bar = snackbar
            snackbar.open = True
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
                # Ya estamos en perfil
                pass
        
        # Obtener datos del usuario (valores por defecto)
        nombre_completo = "Usuario"
        ubicacion = "Torre B, Apto 402"
        telefono = ""
        email = ""
        rol = "dueño"
        imagen_perfil_url = None
        
        # Obtener datos del token si no hay usuario_data aún
        if not self.usuario_data:
            token, usuario_data = TokenStorage.get_token()
            if usuario_data and isinstance(usuario_data, dict):
                self.usuario_data = usuario_data
        
        if self.usuario_data:
            nombre = self.usuario_data.get('nombre', '')
            apellido_paterno = self.usuario_data.get('apellido_paterno', '')
            apellido_materno = self.usuario_data.get('apellido_materno', '')
            nombre_completo = ' '.join([nombre, apellido_paterno, apellido_materno]).strip() or self.usuario_data.get('username', 'Usuario')
            numero_casa = self.usuario_data.get('numero_casa', '')
            if numero_casa:
                ubicacion = f"Torre B, Apto {numero_casa}"
            telefono = self.usuario_data.get('telefono', '')
            email = self.usuario_data.get('email', '')
            rol = self.usuario_data.get('rol', 'dueño')
            if self.usuario_data.get('documentos', {}).get('imagen_perfil_url'):
                imagen_perfil_url = self.usuario_data.get('documentos', {}).get('imagen_perfil_url')
        
        # Mapear rol a texto en español
        rol_texto = {
            'dueño': 'Propietario',
            'habitante': 'Habitante',
            'arrendatario': 'Arrendatario',
            'administrador': 'Administrador',
            'guardia': 'Guardia'
        }.get(rol, rol.capitalize())
        
        # Header con saludo y notificaciones
        header = ft.Container(
            content=ft.Row([
                ft.Column([
                    ft.Text(
                        f"Hola, {nombre_completo.split()[0] if nombre_completo else 'Usuario'}",
                        size=24,
                        weight="bold",
                        color="grey900"
                    ),
                    ft.Text(
                        ubicacion,
                        size=14,
                        color="grey600"
                    ),
                ], spacing=4),
                ft.Container(expand=True),
                ft.IconButton(
                    icon=ft.Icons.NOTIFICATIONS_OUTLINED,
                    icon_size=24,
                    tooltip="Notificaciones"
                ),
            ]),
            padding=ft.padding.symmetric(horizontal=20, vertical=15),
            bgcolor="white",
        )
        
        # Card de perfil
        # Imagen de perfil
        imagen_perfil = ft.CircleAvatar(
            content=ft.Icon(ft.Icons.PERSON, size=40, color="white"),
            bgcolor="teal600",
            radius=40,
        )
        
        if imagen_perfil_url:
            try:
                # Construir URL completa si es necesario
                if imagen_perfil_url.startswith('http'):
                    url_imagen = imagen_perfil_url
                else:
                    base_url = self.controlador.api_client.base_url
                    url_imagen = f"{base_url}/{imagen_perfil_url}"
                
                # Usar ClipRRect para que la imagen llene completamente el círculo
                imagen_perfil = ft.Container(
                    content=ft.Image(
                        src=url_imagen,
                        fit=ft.ImageFit.COVER,
                        width=80,
                        height=80,
                    ),
                    width=80,
                    height=80,
                    border_radius=40,
                    clip_behavior=ft.ClipBehavior.HARD_EDGE,
                )
            except Exception as e:
                print(f"Error al cargar imagen de perfil: {e}")
                # Mantener el CircleAvatar por defecto
                pass
        
        profile_card = ft.Container(
            content=ft.Row([
                imagen_perfil,
                ft.Column([
                    ft.Row([
                        ft.Text(
                            nombre_completo,
                            size=18,
                            weight="bold",
                            color="grey900"
                        ),
                        ft.Container(
                            content=ft.Text(
                                rol_texto,
                                size=12,
                                weight="w500",
                                color="teal700"
                            ),
                            bgcolor="teal50",
                            padding=ft.padding.symmetric(horizontal=10, vertical=5),
                            border_radius=12,
                        ),
                    ], spacing=8, wrap=True),
                    ft.Text(
                        ubicacion,
                        size=14,
                        color="grey600"
                    ),
                    ft.Row([
                        ft.Icon(ft.Icons.PHONE, size=16, color="grey600"),
                        ft.Text(
                            telefono or "No disponible",
                            size=14,
                            color="grey700"
                        ),
                    ], spacing=5),
                    ft.Row([
                        ft.Icon(ft.Icons.EMAIL, size=16, color="grey600"),
                        ft.Text(
                            email or "No disponible",
                            size=14,
                            color="grey700"
                        ),
                    ], spacing=5),
                ], spacing=6, expand=True),
            ], spacing=15, vertical_alignment=ft.CrossAxisAlignment.START),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="#F5F5DC",  # Beige claro
            border_radius=12,
        )
        
        # Sección "Mi Unidad"
        seccion_mi_unidad = ft.Container(
            content=ft.Column([
                ft.Text(
                    "Mi Unidad",
                    size=18,
                    weight="bold",
                    color="grey900"
                ),
                # Vehículos
                ft.Container(
                    content=ft.ListTile(
                        leading=ft.Icon(ft.Icons.DIRECTIONS_CAR, color="teal600"),
                        title=ft.Text("Vehículos", size=16, color="grey900"),
                        trailing=ft.Icon(ft.Icons.CHEVRON_RIGHT, color="grey400"),
                        on_click=ir_a_vehiculos,
                    ),
                    bgcolor="white",
                    border_radius=12,
                    margin=ft.margin.only(bottom=5),
                ),
                # Residentes Autorizados
                ft.Container(
                    content=ft.ListTile(
                        leading=ft.Icon(ft.Icons.PEOPLE, color="teal600"),
                        title=ft.Text("Residentes Autorizados", size=16, color="grey900"),
                        trailing=ft.Icon(ft.Icons.CHEVRON_RIGHT, color="grey400"),
                        on_click=ir_a_residentes_autorizados,
                    ),
                    bgcolor="white",
                    border_radius=12,
                ),
            ], spacing=10),
            padding=ft.padding.symmetric(horizontal=20, vertical=15),
        )
        
        # Sección "Seguridad y Acceso"
        seccion_seguridad = ft.Container(
            content=ft.Column([
                ft.Text(
                    "Seguridad y Acceso",
                    size=18,
                    weight="bold",
                    color="grey900"
                ),
                # Historial de Accesos
                ft.Container(
                    content=ft.ListTile(
                        leading=ft.Icon(ft.Icons.ACCESS_TIME, color="teal600"),
                        title=ft.Text("Historial de Accesos", size=16, color="grey900"),
                        trailing=ft.Icon(ft.Icons.CHEVRON_RIGHT, color="grey400"),
                        on_click=ir_a_historial_accesos,
                    ),
                    bgcolor="white",
                    border_radius=12,
                ),
            ], spacing=10),
            padding=ft.padding.symmetric(horizontal=20, vertical=15),
        )
        
        # Contenido principal
        contenido = ft.Column(
            [
                header,
                profile_card,
                seccion_mi_unidad,
                seccion_seguridad,
            ],
            spacing=0,
            scroll=ft.ScrollMode.AUTO,
            expand=True,
        )
        
        # Configurar NavigationBar (se configura en page.navigation_bar, no se agrega como componente)
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
            bgcolor="#F5F5DC",
            selected_index=3,
            indicator_color="teal600",
        )
        
        self.page.add(contenido)
        self.page.update()
    
    def cargar_datos_usuario(self):
        """Carga los datos del usuario desde el backend"""
        try:
            exito, usuario_completo, mensaje = self.controlador.api_client.obtener_mi_perfil()
            if exito and usuario_completo:
                self.usuario_data = usuario_completo
            else:
                # Si falla, intentar obtener del token
                token, usuario_data = TokenStorage.get_token()
                if usuario_data:
                    self.usuario_data = usuario_data
        except Exception as e:
            print(f"Error al cargar datos del usuario: {e}")
            # Fallback a datos del token
            token, usuario_data = TokenStorage.get_token()
            if usuario_data:
                self.usuario_data = usuario_data

