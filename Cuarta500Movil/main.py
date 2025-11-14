import flet as ft
from splash import Splashvista

def main(page: ft.Page):
    try:
        Splashvista(page)
    except Exception as e:
        print(f"Error en main: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    ft.app(target=main)