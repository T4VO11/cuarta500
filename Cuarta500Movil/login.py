import flet as ft
from controller import Controlador

class Loginvista:
    def __init__(self, page: ft.Page):
        self.page = page
        self.page.title = "Login"
        self.page.bgcolor = "white"  # Fondo blanco consistente
        self.page.vertical_alignment = ft.MainAxisAlignment.CENTER
        self.page.window.width = 411
        self.page.window.height = 831
        self.page.window.resizable = False
        self.page.window.bgcolor = "white"  # Fondo de ventana blanco
        self.page.clean()
        self.controlador = Controlador(page)
        self.build()

    def build(self):
        logo = ft.Image(src="condominio.png", width=150)
        usuario = ft.TextField(label="Usuario", autofocus=True)
        password = ft.TextField(label="Contraseña", password=True, can_reveal_password=True)
        
        # Mensaje de error (inicialmente oculto)
        mensaje_error = ft.Text("", color="red", size=12, visible=False)
        
        # Indicador de carga
        indicador_carga = ft.ProgressRing(visible=False)

        def entrar(e):
            # Validar campos
            if not usuario.value or not password.value:
                mensaje_error.value = "Por favor completa todos los campos"
                mensaje_error.visible = True
                indicador_carga.visible = False
                self.page.update()
                return
            
            # Mostrar indicador de carga
            mensaje_error.visible = False
            indicador_carga.visible = True
            boton_entrar.disabled = True
            self.page.update()
            
            # Intentar login
            exito, mensaje = self.controlador.handle_login(usuario.value, password.value)
            
            if not exito:
                # Mostrar error
                mensaje_error.value = mensaje
                mensaje_error.visible = True
                indicador_carga.visible = False
                boton_entrar.disabled = False
                self.page.update()

        def ir_a_registro(e):
            from registro import Registrovista
            self.page.clean()
            Registrovista(self.page)

        boton_entrar = ft.ElevatedButton("Entrar", on_click=entrar)

        self.page.add(
            ft.Column([
                logo,
                ft.Text("Iniciar Sesión", size=22, weight="bold"),
                usuario,
                password,
                mensaje_error,
                ft.Row([
                    indicador_carga,
                    boton_entrar,
                ], alignment=ft.MainAxisAlignment.CENTER),
                ft.TextButton("Ir a Registro", on_click=ir_a_registro),
            ],
            alignment="center",
            horizontal_alignment="center",
            spacing=15
            )
        )