import flet as ft
from controller import Controlador
from token_storage import TokenStorage
from datetime import datetime

class AmenidadesVista:
    def __init__(self, page: ft.Page, api_client=None):
        self.page = page
        self.page.title = "Condominio - Amenidades"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.scroll = ft.ScrollMode.AUTO
        self.page.clean()
        self.controlador = Controlador(page)
        if api_client:
            self.controlador.api_client = api_client
        self.amenidades = []
        self.reservas = []
        self.tab_actual = "disponibles"  # "disponibles" o "mis_reservas"
        self.build()

    def build(self):
        def volver_home(e):
            from home import Homevista
            self.page.clean()
            Homevista(self.page, self.controlador.api_client)

        def cambiar_tab(tab):
            """Cambia entre las pestañas Disponibles y Mis Reservas"""
            self.tab_actual = tab
            # Actualizar estilos de los tabs
            if tab == "disponibles":
                tab_disponibles.bgcolor = "grey200"
                tab_mis_reservas.bgcolor = "white"
            else:
                tab_disponibles.bgcolor = "white"
                tab_mis_reservas.bgcolor = "grey200"
            
            # Actualizar contenido
            contenido_column.controls.clear()
            
            if self.tab_actual == "disponibles":
                if not self.amenidades:
                    contenido_column.controls.append(
                        ft.Container(
                            content=ft.Text(
                                "No hay amenidades disponibles",
                                size=14,
                                color="grey500",
                                text_align=ft.TextAlign.CENTER
                            ),
                            padding=40,
                            alignment=ft.alignment.center,
                        )
                    )
                else:
                    for amenidad in self.amenidades:
                        contenido_column.controls.append(self.crear_card_amenidad(amenidad))
            else:
                if not self.reservas:
                    contenido_column.controls.append(
                        ft.Container(
                            content=ft.Text(
                                "No tienes reservas",
                                size=14,
                                color="grey500",
                                text_align=ft.TextAlign.CENTER
                            ),
                            padding=40,
                            alignment=ft.alignment.center,
                        )
                    )
                else:
                    for reserva in self.reservas:
                        contenido_column.controls.append(self.crear_card_reserva(reserva))
            
            self.page.update()



        def on_navigation_change(e):
            """Maneja el cambio de navegación"""
            selected_index = e.control.selected_index
            if selected_index == 0:
                from home import Homevista
                self.page.clean()
                Homevista(self.page, self.controlador.api_client)
            elif selected_index == 1:
                # Ya estamos en amenidades
                pass
            elif selected_index == 2:
                from pagos import PagosVista
                self.page.clean()
                PagosVista(self.page, self.controlador.api_client)
            elif selected_index == 3:
                print("Navegando a Perfil")

        # Cargar datos
        self.cargar_amenidades()
        self.cargar_reservas()

        # Header
        header = ft.Container(
            content=ft.Column([
                ft.Row([
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
                ft.Text(
                    "Reservar Área",
                    size=28,
                    weight="bold",
                    color="grey900"
                ),
                ft.Text(
                    "Explora nuestras amenidades y reserva tu espacio favorito",
                    size=14,
                    color="grey600"
                ),
            ], spacing=10),
            padding=20,
            bgcolor="white",
        )

        # Tabs
        tab_disponibles = ft.Container(
            content=ft.Text(
                "Disponibles",
                size=16,
                weight="w500",
                color="grey900",
                text_align=ft.TextAlign.CENTER
            ),
            padding=15,
            bgcolor="grey200",
            border_radius=20,
            on_click=lambda e: cambiar_tab("disponibles"),
            expand=True,
        )

        tab_mis_reservas = ft.Container(
            content=ft.Text(
                "Mis Reservas",
                size=16,
                weight="w500",
                color="grey900",
                text_align=ft.TextAlign.CENTER
            ),
            padding=15,
            bgcolor="white",
            border_radius=20,
            on_click=lambda e: cambiar_tab("mis_reservas"),
            expand=True,
        )

        tabs_container = ft.Container(
            content=ft.Row([
                tab_disponibles,
                tab_mis_reservas,
            ], spacing=10),
            padding=ft.padding.symmetric(horizontal=20, vertical=10),
            bgcolor="white",
        )

        # Contenedor de contenido (se actualiza dinámicamente)
        contenido_column = ft.Column([], spacing=15, scroll="auto", expand=True)
        
        # Inicializar contenido
        if self.tab_actual == "disponibles":
            if not self.amenidades:
                contenido_column.controls.append(
                    ft.Container(
                        content=ft.Text(
                            "No hay amenidades disponibles",
                            size=14,
                            color="grey500",
                            text_align=ft.TextAlign.CENTER
                        ),
                        padding=40,
                        alignment=ft.alignment.center,
                    )
                )
            else:
                for amenidad in self.amenidades:
                    contenido_column.controls.append(self.crear_card_amenidad(amenidad))
        else:
            if not self.reservas:
                contenido_column.controls.append(
                    ft.Container(
                        content=ft.Text(
                            "No tienes reservas",
                            size=14,
                            color="grey500",
                            text_align=ft.TextAlign.CENTER
                        ),
                        padding=40,
                        alignment=ft.alignment.center,
                    )
                )
            else:
                for reserva in self.reservas:
                    contenido_column.controls.append(self.crear_card_reserva(reserva))

        contenido_container = ft.Container(
            content=contenido_column,
            padding=ft.padding.symmetric(horizontal=20),
            expand=True,
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
            selected_index=1,
            indicator_color="teal600",
        )

        # Contenido principal
        main_content = ft.Column([
            header,
            tabs_container,
            contenido_container,
        ], spacing=0, scroll="auto", expand=True)
        
        # Contenedor con gestos de swipe (solo detecta gestos horizontales, permite scroll vertical)
        swipe_container = ft.GestureDetector(
            content=main_content,
            on_horizontal_drag_end=self.on_swipe,
            drag_interval=50,
        )

        self.page.add(swipe_container)
        
        # Guardar referencias para actualización
        self.tab_disponibles = tab_disponibles
        self.tab_mis_reservas = tab_mis_reservas
        self.contenido_column = contenido_column
    
    def on_swipe(self, e):
        """Maneja el gesto de swipe horizontal"""
        if e.velocity_x > 500:  # Swipe rápido a la derecha
            # Ir a Pagos
            from pagos import PagosVista
            self.page.clean()
            PagosVista(self.page, self.controlador.api_client)
            self.page.update()
        elif e.velocity_x < -500:  # Swipe rápido a la izquierda
            # Ir a Home
            from home import Homevista
            self.page.clean()
            Homevista(self.page, self.controlador.api_client)
            self.page.update()

    def reservar_amenidad_func(self, amenidad):
        """Abre el diálogo o pantalla para reservar"""
        print(f"Reservar amenidad: {amenidad.get('nombre')}")
        # Importar y abrir la vista de reservar
        from reservar import ReservarVista
        self.page.clean()
        ReservarVista(self.page, amenidad, self.controlador.api_client)

    def crear_card_amenidad(self, amenidad):
        """Crea un card para una amenidad"""
        nombre = amenidad.get('nombre', 'Sin nombre')
        descripcion = amenidad.get('descripcion', 'Sin descripción')
        tipo = amenidad.get('tipo', '')
        estado = amenidad.get('estado', 'activo')
        precio = amenidad.get('catalogo_detalle', {}).get('precio', 0)
        galeria_urls = amenidad.get('reglas_apartado', {}).get('galeria_urls', [])
        
        # Obtener primera imagen de la galería
        imagen_url = galeria_urls[0] if galeria_urls else None
        
        # Determinar ubicación (puede venir de tipo o descripción)
        ubicacion = f"{tipo} - Área Común" if tipo else "Área Común"
        
        # Tags/Features (ejemplo, puedes ajustar según tus datos)
        tags = []
        if "climatizada" in descripcion.lower() or "climatizado" in descripcion.lower():
            tags.append("Climatizada")
        if "infantil" in descripcion.lower():
            tags.append("Zona Infantil")
        if len(tags) < 3:
            tags.append("+2")
        
        # Capacidad (ejemplo, ajustar según datos reales)
        capacidad = "Hasta 50 personas"
        
        # Badge de disponibilidad
        disponible = estado in ['activo', 'disponible', 'activa']
        
        # Imagen de la amenidad
        imagen_widget = None
        if imagen_url:
            try:
                # Si es una URL completa, usarla directamente
                if imagen_url.startswith('http'):
                    imagen_widget = ft.Image(
                        src=imagen_url,
                        width=400,
                        height=200,
                        fit=ft.ImageFit.COVER,
                        border_radius=ft.border_radius.only(top_left=12, top_right=12)
                    )
                else:
                    # Si es una ruta relativa, construir URL completa
                    base_url = self.controlador.api_client.base_url
                    imagen_widget = ft.Image(
                        src=f"{base_url}/{imagen_url}",
                        width=400,
                        height=200,
                        fit=ft.ImageFit.COVER,
                        border_radius=ft.border_radius.only(top_left=12, top_right=12)
                    )
            except:
                pass
        
        if not imagen_widget:
            # Imagen placeholder
            imagen_widget = ft.Container(
                content=ft.Icon(ft.Icons.IMAGE, size=60, color="grey400"),
                width=400,
                height=200,
                bgcolor="grey200",
                alignment=ft.alignment.center,
                border_radius=ft.border_radius.only(top_left=12, top_right=12)
            )

        # Icono según tipo de amenidad
        icono_amenidad = ft.Icons.POOL if "piscina" in nombre.lower() else ft.Icons.SPORTS_BAR if "gym" in nombre.lower() else ft.Icons.MEETING_ROOM

        card = ft.Container(
            content=ft.Column([
                # Imagen con badge
                ft.Stack([
                    imagen_widget,
                    ft.Container(
                        content=ft.Text(
                            "Disponible" if disponible else "No disponible",
                            size=12,
                            weight="w500",
                            color="white"
                        ),
                        bgcolor="green600" if disponible else "red600",
                        padding=ft.padding.symmetric(horizontal=10, vertical=5),
                        border_radius=12,
                        top=10,
                        right=10,
                    ),
                ]),
                # Contenido del card
                ft.Container(
                    content=ft.Column([
                        ft.Row([
                            ft.Icon(icono_amenidad, color="teal600", size=24),
                            ft.Text(
                                nombre,
                                size=18,
                                weight="bold",
                                color="grey900"
                            ),
                        ], spacing=8),
                        ft.Text(
                            ubicacion,
                            size=14,
                            color="grey600"
                        ),
                        ft.Text(
                            descripcion,
                            size=14,
                            color="grey700"
                        ),
                        # Tags
                        ft.Row([
                            ft.Container(
                                content=ft.Text(tag, size=12, color="teal700"),
                                bgcolor="teal50",
                                padding=ft.padding.symmetric(horizontal=8, vertical=4),
                                border_radius=8,
                            ) for tag in tags[:3]
                        ], spacing=5, wrap=True),
                        # Capacidad y precio
                        ft.Row([
                            ft.Row([
                                ft.Icon(ft.Icons.PEOPLE, size=16, color="grey600"),
                                ft.Text(capacidad, size=12, color="grey600"),
                            ], spacing=5),
                            ft.Container(expand=True),
                            ft.Text(
                                f"${precio}/hora",
                                size=14,
                                weight="w500",
                                color="grey900"
                            ),
                        ], spacing=10),
                        # Botón reservar
                        ft.ElevatedButton(
                            "Reservar Ahora",
                            icon=ft.Icons.CALENDAR_TODAY,
                            on_click=lambda e, a=amenidad: self.reservar_amenidad_func(a),
                            bgcolor="teal600",
                            color="white",
                            expand=True,
                            height=45,
                            style=ft.ButtonStyle(
                                shape=ft.RoundedRectangleBorder(radius=12)
                            )
                        ) if disponible else ft.Container(
                            content=ft.Text(
                                "No disponible para reservar",
                                size=14,
                                color="grey500",
                                text_align=ft.TextAlign.CENTER
                            ),
                            padding=15,
                        ),
                    ], spacing=10),
                    padding=15,
                ),
            ], spacing=0),
            margin=ft.margin.only(bottom=20),
            bgcolor="white",
            border_radius=12,
            border=ft.border.all(1, "grey300"),
            shadow=ft.BoxShadow(blur_radius=3, color="black12"),
        )
        
        return card

    def crear_card_reserva(self, reserva):
        """Crea un card para una reserva del usuario"""
        nombre_residente = reserva.get('nombre_residente', '')
        fecha_evento = reserva.get('fecha_evento', '')
        total = reserva.get('total', 0)
        estado = reserva.get('estado', 'pendiente')
        estado_pago = reserva.get('estado_pago', 'pendiente')
        
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

        card = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Icon(ft.Icons.CALENDAR_TODAY, color="teal600", size=24),
                    ft.Column([
                        ft.Text(
                            nombre_residente,
                            size=16,
                            weight="bold",
                            color="grey900"
                        ),
                        ft.Text(
                            f"Fecha: {fecha_formateada}",
                            size=14,
                            color="grey600"
                        ),
                    ], spacing=2, expand=True),
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
                ], spacing=10),
                ft.Divider(),
                ft.Row([
                    ft.Text("Total:", size=14, color="grey600"),
                    ft.Container(expand=True),
                    ft.Text(
                        f"${total:,.0f}",
                        size=16,
                        weight="bold",
                        color="grey900"
                    ),
                ]),
                ft.Text(
                    f"Estado de pago: {estado_pago}",
                    size=12,
                    color="grey500"
                ),
            ], spacing=10),
            padding=20,
            margin=ft.margin.only(bottom=15),
            bgcolor="white",
            border_radius=12,
            border=ft.border.all(1, "grey300"),
        )
        
        return card

    def cargar_amenidades(self):
        """Carga las amenidades disponibles desde el backend"""
        try:
            exito, amenidades, mensaje = self.controlador.api_client.obtener_amenidades_disponibles()
            if exito:
                self.amenidades = amenidades
                print(f"Amenidades cargadas: {len(amenidades)}")
                # Imprimir nombres de amenidades para debug
                for amenidad in amenidades:
                    print(f"  - {amenidad.get('nombre', 'Sin nombre')} (Estado: {amenidad.get('estado', 'N/A')})")
            else:
                print(f"Error al cargar amenidades: {mensaje}")
                self.amenidades = []
        except Exception as e:
            print(f"Error al cargar amenidades: {e}")
            import traceback
            traceback.print_exc()
            self.amenidades = []

    def cargar_reservas(self):
        """Carga las reservas del usuario desde el backend"""
        try:
            exito, reservas, mensaje = self.controlador.api_client.obtener_mis_reservas()
            if exito:
                self.reservas = reservas
            else:
                print(f"Error al cargar reservas: {mensaje}")
                self.reservas = []
        except Exception as e:
            print(f"Error al cargar reservas: {e}")
            self.reservas = []

