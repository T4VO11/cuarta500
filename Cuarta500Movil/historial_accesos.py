import flet as ft
from controller import Controlador
from datetime import datetime

class HistorialAccesosVista:
    def __init__(self, page: ft.Page, api_client=None):
        self.page = page
        self.page.title = "Condominio - Historial de Accesos"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.scroll = ft.ScrollMode.AUTO
        self.page.clean()
        self.controlador = Controlador(page)
        if api_client:
            self.controlador.api_client = api_client
        self.historial = []
        self.build()
    
    def build(self):
        def volver_perfil(e):
            from perfil import PerfilVista
            self.page.clean()
            PerfilVista(self.page, self.controlador.api_client)
        
        # Header con botón de regreso
        header = ft.Container(
            content=ft.Row([
                ft.IconButton(
                    icon=ft.Icons.ARROW_BACK,
                    on_click=volver_perfil,
                    tooltip="Volver al perfil"
                ),
                ft.Text(
                    "Historial de Accesos",
                    size=20,
                    weight="bold",
                    color="grey900"
                ),
                ft.Container(expand=True),
            ]),
            padding=ft.padding.symmetric(horizontal=20, vertical=15),
            bgcolor="white",
        )
        
        # Cargar historial
        self.cargar_historial()
        
        # Lista de accesos
        if not self.historial:
            contenido_lista = ft.Container(
                content=ft.Column([
                    ft.Icon(ft.Icons.HISTORY, size=64, color="grey400"),
                    ft.Text(
                        "No hay registros de acceso",
                        size=16,
                        color="grey600",
                        text_align=ft.TextAlign.CENTER
                    ),
                ], horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=10),
                padding=40,
                alignment=ft.alignment.center,
            )
        else:
            items_historial = []
            for registro in self.historial:
                items_historial.append(self.crear_card_acceso(registro))
            
            contenido_lista = ft.Column(
                items_historial,
                spacing=10,
            )
        
        # Contenido principal
        contenido = ft.Column(
            [
                header,
                ft.Container(
                    content=contenido_lista,
                    padding=ft.padding.symmetric(horizontal=20),
                    expand=True,
                ),
            ],
            spacing=0,
            scroll=ft.ScrollMode.AUTO,
            expand=True,
        )
        
        self.page.add(contenido)
        self.page.update()
    
    def crear_card_acceso(self, registro):
        """Crea un card para un registro de acceso"""
        tipo_registro = registro.get('tipo_registro', '')
        fecha_hora = registro.get('fecha_hora', '')
        accion = registro.get('accion', '')
        detalle = registro.get('detalle_acceso', {})
        codigo_acceso = detalle.get('codigo_acceso', '')
        nombre_visitante = detalle.get('nombre_visitante', '')
        metodo = detalle.get('metodo', '')
        
        # Formatear fecha
        fecha_formateada = fecha_hora
        try:
            # Intentar parsear diferentes formatos de fecha
            formatos = ['%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d']
            fecha_obj = None
            for formato in formatos:
                try:
                    fecha_obj = datetime.strptime(fecha_hora.split('.')[0], formato)
                    break
                except:
                    continue
            
            if fecha_obj:
                fecha_formateada = fecha_obj.strftime('%d/%m/%Y %H:%M')
        except:
            pass
        
        # Determinar icono según tipo
        icono = ft.Icons.QR_CODE
        color_icono = "teal600"
        if 'qr' in metodo.lower() or codigo_acceso:
            icono = ft.Icons.QR_CODE
            color_icono = "teal600"
        elif 'vehiculo' in tipo_registro.lower():
            icono = ft.Icons.DIRECTIONS_CAR
            color_icono = "blue600"
        else:
            icono = ft.Icons.PERSON
            color_icono = "green600"
        
        # Texto principal
        texto_principal = accion
        if nombre_visitante:
            texto_principal = f"{accion} - {nombre_visitante}"
        elif codigo_acceso:
            texto_principal = f"{accion} - Código: {codigo_acceso}"
        
        # Información adicional
        info_adicional = []
        if codigo_acceso:
            info_adicional.append(f"QR: {codigo_acceso}")
        if metodo:
            info_adicional.append(f"Método: {metodo}")
        if detalle.get('placas'):
            info_adicional.append(f"Placas: {detalle.get('placas')}")
        
        card = ft.Container(
            content=ft.Row([
                ft.Container(
                    content=ft.Icon(icono, color=color_icono, size=32),
                    padding=10,
                    bgcolor=f"{color_icono}20",
                    border_radius=8,
                ),
                ft.Column([
                    ft.Text(
                        texto_principal,
                        size=16,
                        weight="w500",
                        color="grey900"
                    ),
                    ft.Text(
                        fecha_formateada,
                        size=14,
                        color="grey600"
                    ),
                    ft.Text(
                        ", ".join(info_adicional) if info_adicional else tipo_registro,
                        size=12,
                        color="grey500"
                    ),
                ], spacing=4, expand=True),
            ], spacing=15, vertical_alignment=ft.CrossAxisAlignment.START),
            padding=15,
            margin=ft.margin.only(bottom=10),
            bgcolor="white",
            border_radius=12,
            border=ft.border.all(1, "grey300"),
        )
        
        return card
    
    def cargar_historial(self):
        """Carga el historial de accesos desde el backend"""
        try:
            exito, historial, mensaje = self.controlador.api_client.obtener_historial_accesos()
            if exito:
                # Filtrar solo registros relacionados con accesos/QRs
                self.historial = [
                    r for r in historial 
                    if r.get('tipo_registro') in ['acceso_qr', 'invitacion', 'visita', 'acceso'] 
                    or r.get('detalle_acceso', {}).get('codigo_acceso')
                ]
                # Ordenar por fecha más reciente
                self.historial.sort(key=lambda x: x.get('fecha_hora', ''), reverse=True)
            else:
                print(f"Error al cargar historial: {mensaje}")
                self.historial = []
        except Exception as e:
            print(f"Error al cargar historial: {e}")
            import traceback
            traceback.print_exc()
            self.historial = []

