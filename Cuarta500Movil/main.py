import flet as ft
from splash import Splashvista

def main(page: ft.Page):
    try:
        # Configurar tamaño de ventana (tamaño de teléfono)
        page.window.width = 411
        page.window.height = 831
        page.window.resizable = False
        
        # Configurar fondo blanco por defecto
        page.bgcolor = "white"
        # Configurar color de la ventana
        page.window.bgcolor = "white"
        
        Splashvista(page)
    except Exception as e:
        print(f"Error en main: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    ft.app(target=main)