import flet as ft
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

        def ver_detalles_qr(invitacion):
            """Muestra los detalles del QR"""
            # TODO: Implementar vista de detalles con opciones de editar/revocar
            mostrar_mensaje(f"Detalles de QR: {invitacion.get('nombre_invitado')}. Funcionalidad de detalles próximamente.", "info")

        def crear_card_qr(invitacion, ver_detalles_func):
            """Crea un card para un QR"""
            nombre_visitante = invitacion.get('nombre_invitado', 'Visitante')
            tipo_qr = invitacion.get('tipo_qr', 'uso_unico')
            estado_invitacion = invitacion.get('estado', 'pendiente')
            
            # Determinar estado real
            ahora = datetime.now()
            estado_real = determinar_estado_qr(invitacion, ahora)
            
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
                bgcolor="#F5F5DC",  # Beige claro
                border_radius=12,
                border=ft.border.all(1, "grey300"),
                on_click=lambda e, inv=invitacion: ver_detalles_func(inv),
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

        def actualizar_lista_qrs():
            """Actualiza la lista de QRs según el filtro"""
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
                    tab.bgcolor = "#F5F5DC"  # Beige claro
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
            bgcolor="#F5F5DC",
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

