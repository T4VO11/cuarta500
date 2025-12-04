import flet as ft
from api_client import ApiClient
from datetime import datetime

class HistorialGuardiaVista:
    def __init__(self, page: ft.Page, api_client: ApiClient):
        self.page = page
        self.page.title = "Historial de Accesos"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.clean()
        self.api_client = api_client
        self.build()
    
    def build(self):
        def volver(e):
            # Importar aquí para evitar importación circular
            from scanner_qr import ScannerQRVista
            self.page.clean()
            ScannerQRVista(self.page, self.api_client)
        
        def formatear_fecha(fecha_str):
            """Formatea una fecha para mostrar"""
            if not fecha_str:
                return "N/A"
            try:
                # Intentar diferentes formatos
                formatos = ['%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%Y/%m/%d', '%d-%m-%Y', '%d/%m/%Y']
                fecha_obj = None
                for formato in formatos:
                    try:
                        fecha_obj = datetime.strptime(fecha_str, formato)
                        break
                    except:
                        continue
                
                if fecha_obj:
                    meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                            'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
                    return f"{fecha_obj.day} {meses[fecha_obj.month-1]} {fecha_obj.year} {fecha_obj.hour:02d}:{fecha_obj.minute:02d}"
                return fecha_str
            except:
                return fecha_str
        
        # Botón de volver
        if hasattr(ft, 'icons') and hasattr(ft.icons, 'ARROW_BACK'):
            btn_volver = ft.IconButton(
                icon=ft.icons.ARROW_BACK,
                on_click=volver,
                tooltip="Volver"
            )
        else:
            btn_volver = ft.ElevatedButton(
                content=ft.Text("←", size=20),
                tooltip="Volver",
                on_click=volver,
                bgcolor="transparent",
                width=40,
                height=40,
                style=ft.ButtonStyle(
                    shape=ft.RoundedRectangleBorder(radius=20),
                )
            )
        
        # Header
        header = ft.Container(
            content=ft.Row([
                btn_volver,
                ft.Text(
                    "Historial de Accesos",
                    size=20,
                    weight="bold",
                    color="grey900"
                ),
                ft.Container(expand=True),
            ]),
            padding=20,
            bgcolor="white",
        )
        
        # Nota: En una implementación completa, aquí se cargarían los registros
        # desde el backend usando un endpoint de bitácoras
        # Por ahora mostramos un mensaje informativo
        
        info_card = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Text("ℹ️", size=24),
                    ft.Text("Historial", size=18, weight="bold", color="grey900"),
                ], spacing=10),
                ft.Text(
                    "El historial de accesos se registra automáticamente cuando se valida un QR.\n\n"
                    "Cada acceso validado queda registrado en el sistema con:\n"
                    "• Fecha y hora\n"
                    "• Nombre del visitante\n"
                    "• Tipo de QR utilizado\n"
                    "• Estado del acceso",
                    size=14,
                    color="grey700"
                ),
            ], spacing=15),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            bgcolor="grey50",
            border_radius=12,
        )
        
        # Lista de accesos (placeholder - en producción se cargaría del backend)
        lista_accesos = ft.Container(
            content=ft.Column([
                ft.Container(
                    content=ft.Row([
                        ft.Text("✓", size=24, color="green600"),
                        ft.Column([
                            ft.Text("Acceso registrado", size=14, weight="w500", color="grey900"),
                            ft.Text("QR validado correctamente", size=12, color="grey600"),
                        ], spacing=2, expand=True),
                        ft.Text("Hoy", size=12, color="grey600"),
                    ], spacing=10),
                    padding=15,
                    margin=ft.margin.only(bottom=10),
                    bgcolor="white",
                    border_radius=12,
                    border=ft.border.all(1, "grey300"),
                ),
            ], spacing=0),
            padding=20,
        )
        
        # Contenido principal
        contenido = ft.Column([
            header,
            info_card,
            ft.Text(
                "Últimos accesos registrados",
                size=16,
                weight="bold",
                color="grey900",
                padding=ft.padding.only(left=20, top=10, bottom=10)
            ),
            lista_accesos,
        ],
        spacing=0,
        scroll=ft.ScrollMode.AUTO,
        expand=True)
        
        self.page.add(contenido)
        self.page.update()

