import flet as ft
from controller import Controlador

class Registrovista:
    def __init__(self, page: ft.Page):
        self.page = page
        self.page.title = "Registro"
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
        nombre = ft.TextField(label="Nombre", autofocus=True)
        apellido_paterno = ft.TextField(label="Apellido Paterno")
        apellido_materno = ft.TextField(label="Apellido Materno")
        correo = ft.TextField(label="Correo electrónico")
        telefono = ft.TextField(label="Teléfono")
        numero_casa = ft.TextField(label="Número de Casa (opcional)")
        password = ft.TextField(label="Contraseña", password=True, can_reveal_password=True)
        password_confirm = ft.TextField(label="Confirmar Contraseña", password=True, can_reveal_password=True)
        
        # Mensaje de error/éxito
        mensaje = ft.Text("", color="red", size=12, visible=False)
        
        # Indicador de carga
        indicador_carga = ft.ProgressRing(visible=False)

        def registrar(e):
            # Validar campos obligatorios
            if not all([nombre.value, correo.value, telefono.value, password.value]):
                mensaje.value = "Por favor completa todos los campos obligatorios"
                mensaje.color = "red"
                mensaje.visible = True
                indicador_carga.visible = False
                self.page.update()
                return
            
            # Validar que las contraseñas coincidan
            if password.value != password_confirm.value:
                mensaje.value = "Las contraseñas no coinciden"
                mensaje.color = "red"
                mensaje.visible = True
                indicador_carga.visible = False
                self.page.update()
                return
            
            # Mostrar indicador de carga
            mensaje.visible = False
            indicador_carga.visible = True
            boton_registrar.disabled = True
            self.page.update()
            
            # Intentar registro
            exito, mensaje_texto = self.controlador.handle_registro(
                nombre.value,
                correo.value,
                telefono.value,
                password.value,
                apellido_paterno.value,
                apellido_materno.value,
                numero_casa.value
            )
            
            if not exito:
                # Mostrar error
                mensaje.value = mensaje_texto
                mensaje.color = "red"
                mensaje.visible = True
                indicador_carga.visible = False
                boton_registrar.disabled = False
                self.page.update()
            # Si es exitoso, el controlador ya navega a login

        def ir_a_login(e):
            from login import Loginvista
            self.page.clean()
            Loginvista(self.page)

        boton_registrar = ft.ElevatedButton("Registrarse", on_click=registrar)

        self.page.add(
            ft.Column([
                logo,
                ft.Text("Registro de Usuario", size=22, weight="bold"),
                nombre,
                apellido_paterno,
                apellido_materno,
                correo,
                telefono,
                numero_casa,
                password,
                password_confirm,
                mensaje,
                ft.Row([
                    indicador_carga,
                    boton_registrar,
                ], alignment=ft.MainAxisAlignment.CENTER),
                ft.TextButton("Ya tengo cuenta - Ir a Login", on_click=ir_a_login),
            ],
            alignment="center",
            horizontal_alignment="center",
            spacing=15,
            scroll="auto"
            )
        )



