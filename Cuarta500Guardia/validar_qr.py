import flet as ft
from api_client import ApiClient
import json
import threading
from qr_scanner import QRScanner

class ValidarQRVista:
    def __init__(self, page: ft.Page, api_client: ApiClient):
        self.page = page
        self.page.title = "Validar QR"
        self.page.bgcolor = "white"
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.clean()
        self.api_client = api_client
        self.qr_scanner = QRScanner()
        self.build()
    
    def build(self):
        def volver(e):
            # Detener escaneo si está activo
            if self.qr_scanner.scanning:
                self.qr_scanner.stop_camera()
            # Importar aquí para evitar importación circular
            from scanner_qr import ScannerQRVista
            self.page.clean()
            ScannerQRVista(self.page, self.api_client)
        
        def escanear_qr(e):
            # Iniciar escaneo con cámara
            iniciar_escaneo_camara()
        
        def ingresar_manual(e):
            # Mostrar campo para ingresar código manualmente
            mostrar_campo_manual()
        
        def validar_codigo_manual(e):
            codigo = campo_codigo.value.strip()
            if not codigo:
                mostrar_mensaje("Por favor ingresa un código", "error")
                return
            
            # Intentar parsear como JSON o usar como código de acceso
            try:
                qr_data = json.loads(codigo)
            except:
                # Si no es JSON, asumir que es un código de acceso
                qr_data = {"codigo_acceso": codigo}
            
            validar_qr(qr_data)
        
        def mostrar_mensaje(texto, tipo="info"):
            color = "green" if tipo == "exito" else "red" if tipo == "error" else "blue"
            snackbar = ft.SnackBar(
                content=ft.Text(texto),
                bgcolor=color,
                duration=3000
            )
            self.page.snack_bar = snackbar
            snackbar.open = True
            self.page.update()
        
        def validar_qr(qr_data):
            # Mostrar indicador de carga
            resultado_container.visible = False
            indicador_carga.visible = True
            self.page.update()
            
            # Validar QR
            exito, data, mensaje = self.api_client.validar_qr(qr_data)
            
            indicador_carga.visible = False
            
            if exito and data:
                invitacion = data.get('invitacion', {})
                acceso_permitido = data.get('acceso_permitido', False)
                
                if acceso_permitido:
                    # Mostrar resultado exitoso
                    resultado_titulo.value = "✓ Acceso Permitido"
                    resultado_titulo.color = "green"
                    resultado_mensaje.value = mensaje
                    resultado_info.value = (
                        f"Visitante: {invitacion.get('nombre_invitado', 'N/A')}\n"
                        f"Tipo QR: {invitacion.get('tipo_qr', 'N/A')}\n"
                        f"Estado: {invitacion.get('estado', 'N/A')}"
                    )
                    if invitacion.get('tipo_qr') == 'usos_multiples':
                        resultado_info.value += f"\nUsos: {invitacion.get('usos_actuales', 0)}/{invitacion.get('numero_usos', '∞')}"
                    resultado_container.bgcolor = "green50"
                else:
                    # Mostrar resultado denegado
                    resultado_titulo.value = "✗ Acceso Denegado"
                    resultado_titulo.color = "red"
                    resultado_mensaje.value = mensaje
                    resultado_info.value = ""
                    resultado_container.bgcolor = "red50"
                
                resultado_container.visible = True
            else:
                # Error en la validación
                resultado_titulo.value = "✗ Error"
                resultado_titulo.color = "red"
                resultado_mensaje.value = mensaje or "Error al validar el QR"
                resultado_info.value = ""
                resultado_container.bgcolor = "red50"
                resultado_container.visible = True
                mostrar_mensaje(mensaje or "Error al validar el QR", "error")
            
            self.page.update()
        
        def iniciar_escaneo_camara():
            """Inicia el escaneo de QR con la cámara"""
            # Ocultar botón de escanear y mostrar indicador
            btn_escanear.visible = False
            btn_manual.visible = False
            container_escaneo.visible = True
            self.page.update()
            
            def on_qr_scanned(qr_data, error):
                # Ocultar indicador de escaneo
                container_escaneo.visible = False
                
                if error:
                    mostrar_mensaje(f"Error al escanear: {error}", "error")
                    btn_escanear.visible = True
                    btn_manual.visible = True
                    self.page.update()
                    return
                
                if qr_data:
                    # Intentar parsear como JSON o usar como código de acceso
                    try:
                        qr_data_parsed = json.loads(qr_data)
                    except:
                        # Si no es JSON, asumir que es un código de acceso
                        qr_data_parsed = {"codigo_acceso": qr_data}
                    
                    # Validar el QR escaneado
                    validar_qr(qr_data_parsed)
                    btn_escanear.visible = True
                    btn_manual.visible = True
                else:
                    mostrar_mensaje("No se detectó ningún QR", "error")
                    btn_escanear.visible = True
                    btn_manual.visible = True
                
                self.page.update()
            
            # Iniciar escaneo en thread separado
            self.qr_scanner.scan_qr_async(on_qr_scanned, timeout=30)
        
        def mostrar_campo_manual():
            campo_codigo.visible = True
            btn_validar_manual.visible = True
            btn_escanear.visible = False
            self.page.update()
        
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
                    "Validar QR",
                    size=20,
                    weight="bold",
                    color="grey900"
                ),
                ft.Container(expand=True),
            ]),
            padding=20,
            bgcolor="white",
        )
        
        # Campo para código manual (inicialmente oculto)
        campo_codigo = ft.TextField(
            label="Código del QR",
            hint_text="Pega el código del QR o escanéalo",
            multiline=True,
            min_lines=3,
            max_lines=5,
            border_color="teal400",
            focused_border_color="teal600",
            border_width=2,
            visible=False,
        )
        
        # Botón para validar código manual
        btn_validar_manual = ft.ElevatedButton(
            "Validar Código",
            on_click=validar_codigo_manual,
            bgcolor="teal600",
            color="white",
            width=300,
            height=50,
            visible=False,
            style=ft.ButtonStyle(
                shape=ft.RoundedRectangleBorder(radius=12),
            )
        )
        
        # Botón principal: Escanear QR
        btn_escanear = ft.Container(
            content=ft.ElevatedButton(
                content=ft.Column([
                    ft.Text("📷", size=80),
                    ft.Text("Escanear QR", size=24, weight="bold", color="white"),
                ], 
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                spacing=15),
                on_click=escanear_qr,
                bgcolor="teal600",
                color="white",
                width=350,
                height=250,
                style=ft.ButtonStyle(
                    shape=ft.RoundedRectangleBorder(radius=20),
                )
            ),
            padding=20,
            margin=ft.margin.only(top=40, bottom=20),
        )
        
        # Botón alternativo: Ingresar manualmente
        btn_manual = ft.TextButton(
            "Ingresar código manualmente",
            on_click=ingresar_manual,
            icon=ft.icons.KEYBOARD if hasattr(ft, 'icons') else "⌨️",
        )
        
        # Indicador de carga
        indicador_carga = ft.ProgressRing(
            visible=False,
            width=50,
            height=50,
            color="teal600"
        )
        
        # Indicador de escaneo
        indicador_escaneo = ft.ProgressRing(
            visible=False,
            width=60,
            height=60,
            color="teal600"
        )
        
        # Mensaje de escaneo
        mensaje_escaneo = ft.Text(
            "Escaneando QR... Apunta la cámara al código",
            size=16,
            color="teal600",
            weight="w500",
            visible=False,
            text_align=ft.TextAlign.CENTER
        )
        
        # Contenedor de escaneo
        container_escaneo = ft.Container(
            content=ft.Column([
                indicador_escaneo,
                mensaje_escaneo,
            ],
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            spacing=15),
            padding=20,
            alignment=ft.alignment.center,
            visible=False
        )
        
        # Resultado de validación
        resultado_container = ft.Container(
            content=ft.Column([
                ft.Text(
                    "",
                    size=20,
                    weight="bold",
                    key="titulo"
                ),
                ft.Text(
                    "",
                    size=16,
                    key="mensaje"
                ),
                ft.Text(
                    "",
                    size=14,
                    color="grey700",
                    key="info"
                ),
            ], spacing=10),
            padding=20,
            margin=ft.margin.symmetric(horizontal=20, vertical=10),
            border_radius=12,
            visible=False,
        )
        
        # Referencias para actualizar
        resultado_titulo = resultado_container.content.controls[0]
        resultado_mensaje = resultado_container.content.controls[1]
        resultado_info = resultado_container.content.controls[2]
        
        # Contenido principal
        contenido = ft.Column([
            header,
            btn_escanear,
            btn_manual,
            ft.Container(
                campo_codigo,
                width=350,
                padding=20,
                visible=False
            ),
            ft.Container(
                btn_validar_manual,
                padding=20,
            ),
            ft.Container(
                indicador_carga,
                padding=20,
                alignment=ft.alignment.center
            ),
            container_escaneo,
            resultado_container,
        ],
        spacing=0,
        scroll=ft.ScrollMode.AUTO,
        expand=True,
        horizontal_alignment=ft.CrossAxisAlignment.CENTER)
        
        self.page.add(contenido)
        self.page.update()

