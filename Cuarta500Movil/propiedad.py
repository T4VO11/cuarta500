import flet as ft
import flet_map as map

class PropiedadVista:
    def __init__(self, page: ft.Page):
        self.page = page
        self.page.title = "Condominio - Mi Propiedad"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = True
        self.page.clean()
        self.build()

    def build(self):
        def volver_home(e):
            from home import Homevista   
            self.page.clean()
            Homevista(self.page)

        def volver_login(e):
            from login import Loginvista   
            self.page.clean()
            Loginvista(self.page)

        def ir_a_invitar_amigo(e):
            from invitar_amigo import InvitarAmigoVista
            from controller import Controlador
            controlador = Controlador(self.page)
            self.page.clean()
            InvitarAmigoVista(self.page, controlador.api_client)

        # Header con botón de regreso
        header = ft.Container(
            content=ft.Row([
                ft.IconButton(
                    icon=ft.Icons.ARROW_BACK,
                    on_click=volver_home,
                    tooltip="Volver al inicio"
                ),
                ft.Text("Mi Propiedad", size=20, weight="bold", color="black"),
                ft.Container(expand=True),  # Spacer
                ft.IconButton(
                    icon=ft.Icons.LOGOUT,
                    on_click=volver_login,
                    tooltip="Cerrar sesión"
                ),
            ]),
            padding=20,
            bgcolor="white",
        )

        # Información de la propiedad
        property_info = ft.Container(
            content=ft.Column([
                ft.Text("🏠 Departamento 4A", size=18, weight="bold", color="black"),
                ft.Text("Torre Norte - Piso 4", size=14, color="grey600"),
                ft.Text("Área: 85 m²", size=14, color="grey600"),
                ft.Text("Estado: Habitado", size=14, color="green"),
            ], spacing=8),
            padding=20,
            bgcolor="grey100",
            margin=10,
            border_radius=10,
        )

        # Mapa con la ubicación de la casa
        # Coordenadas de ejemplo (puedes cambiar por las coordenadas reales de tu condominio)
        casa_lat = 20.67816  # Latitud de ejemplo
        casa_lon = -103.34210  # Longitud de ejemplo
        
        mapa = map.Map(
            expand=True,
            initial_center=map.MapLatitudeLongitude(casa_lat, casa_lon),
            initial_zoom=18,
            interaction_configuration=map.MapInteractionConfiguration(
                flags=map.MapInteractiveFlag.ALL
            ),
            on_init=lambda e: print("Mapa inicializado"),
            layers=[
                map.TileLayer(
                    url_template="https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                    on_image_error=lambda e: print("Error cargando tiles"),
                ),
                map.MarkerLayer(
                    markers=[
                        map.Marker(
                            content=ft.Icon(
                                ft.Icons.HOME, 
                                color="purple600", 
                                size=30
                            ),
                            coordinates=map.MapLatitudeLongitude(casa_lat, casa_lon),
                        ),
                    ],
                ),
                map.SimpleAttribution(
                    text="Ubicación de tu casa",
                    alignment=ft.alignment.top_left,
                ),
            ],
        )

        # Contenedor del mapa
        map_container = ft.Container(
            content=mapa,
            height=400,
            margin=10,
            border_radius=10,
            shadow=ft.BoxShadow(blur_radius=5, color="black12"),
        )

        # Sección de servicios y aparatos
        servicios_section = ft.Container(
            content=ft.Column([
                ft.Text("🔧 Servicios y Aparatos", size=18, weight="bold", color="black"),
                ft.Divider(),
                ft.ElevatedButton(
                    "👥 Invitar Amigo",
                    icon=ft.Icons.PERSON_ADD,
                    on_click=ir_a_invitar_amigo,
                    bgcolor="purple600",
                    color="white",
                    expand=True,
                    height=50,
                    style=ft.ButtonStyle(
                        shape=ft.RoundedRectangleBorder(radius=10)
                    )
                ),
                ft.ElevatedButton(
                    "🏊 Reservar Amenidad",
                    icon=ft.Icons.POOL,
                    on_click=lambda e: print("Reservar amenidad"),
                    bgcolor="blue600",
                    color="white",
                    expand=True,
                    height=50,
                    style=ft.ButtonStyle(
                        shape=ft.RoundedRectangleBorder(radius=10)
                    )
                ),
                ft.ElevatedButton(
                    "📋 Reportar Incidente",
                    icon=ft.Icons.REPORT_PROBLEM,
                    on_click=lambda e: print("Reportar incidente"),
                    bgcolor="orange600",
                    color="white",
                    expand=True,
                    height=50,
                    style=ft.ButtonStyle(
                        shape=ft.RoundedRectangleBorder(radius=10)
                    )
                ),
            ], spacing=10),
            padding=20,
            bgcolor="white",
            margin=10,
            border_radius=10,
            shadow=ft.BoxShadow(blur_radius=3, color="black12"),
        )

        # Información adicional
        additional_info = ft.Container(
            content=ft.Column([
                ft.Text("📍 Dirección", size=16, weight="bold", color="black"),
                ft.Text("Av. Condominio 123, Col. Residencial", size=14, color="grey600"),
                ft.Text("Guadalajara, Jalisco, México", size=14, color="grey600"),
                ft.Divider(),
                ft.Text("📞 Contacto", size=16, weight="bold", color="black"),
                ft.Text("Administración: (33) 1234-5678", size=14, color="grey600"),
                ft.Text("Emergencias: (33) 9876-5432", size=14, color="grey600"),
            ], spacing=8),
            padding=20,
            bgcolor="white",
            margin=10,
            border_radius=10,
            shadow=ft.BoxShadow(blur_radius=3, color="black12"),
        )

        # Configurar NavigationBar
        self.page.navigation_bar = ft.NavigationBar(
            destinations=[
                ft.NavigationBarDestination(
                    icon=ft.Icons.PERSON,
                    selected_icon=ft.Icons.PERSON,
                    label="Inicio",
                ),
                ft.NavigationBarDestination(
                    icon=ft.Icons.HOME_WORK,
                    selected_icon=ft.Icons.HOME_WORK,
                    label="Propiedad",
                ),
                ft.NavigationBarDestination(
                    icon=ft.Icons.PUBLIC,
                    selected_icon=ft.Icons.PUBLIC,
                    label="Comunidad",
                ),
            ],
            on_change=self.on_navigation_change,
            bgcolor="purple400",
            selected_index=1,  # Propiedad está seleccionada
        )

        # Contenido principal
        main_content = ft.Column([
            header,
            property_info,
            servicios_section,
            map_container,
            additional_info,
            ft.Container(expand=True),  # Spacer
        ], spacing=0, scroll="auto")

        # Estructura completa de la página
        self.page.add(main_content)

    def on_navigation_change(self, e):
        """Maneja el cambio de navegación"""
        selected_index = e.control.selected_index
        if selected_index == 0:
            from home import Homevista   
            self.page.clean()
            Homevista(self.page)
        elif selected_index == 1:
            # Ya estamos en propiedad
            pass
        elif selected_index == 2:
            print("Navegando a Comunidad")
            # Aquí puedes implementar la navegación a comunidad
