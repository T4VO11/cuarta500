import flet as ft
import os
from login_guardia import LoginGuardiaVista

def main(page: ft.Page):
	try:
		# Cambiar al directorio del script para que las rutas relativas funcionen
		script_dir = os.path.dirname(os.path.abspath(__file__))
		os.chdir(script_dir)
		
		# Configurar tamaño de ventana (tamaño de teléfono)
		page.window.width = 411
		page.window.height = 831
		page.window.resizable = False
		
		# Configurar fondo blanco por defecto
		page.bgcolor = "white"
		# Configurar color de la ventana
		page.window.bgcolor = "white"
		
		LoginGuardiaVista(page)
	except Exception as e:
		print(f"Error en main: {str(e)}")
		import traceback
		traceback.print_exc()

if __name__ == "__main__":
	ft.app(target=main)

