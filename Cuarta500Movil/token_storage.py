"""
Utilidad para almacenar y recuperar el token JWT de forma persistente
Usa archivo local para guardar el token entre sesiones
"""
import os
import json

TOKEN_FILE = "token.json"

class TokenStorage:
    @staticmethod
    def save_token(token, usuario_data=None):
        """Guarda el token en un archivo local"""
        try:
            data = {
                "token": token,
                "usuario": usuario_data
            }
            with open(TOKEN_FILE, 'w') as f:
                json.dump(data, f)
            return True
        except Exception as e:
            print(f"Error al guardar token: {e}")
            return False
    
    @staticmethod
    def get_token():
        """Recupera el token del archivo local"""
        try:
            if os.path.exists(TOKEN_FILE):
                with open(TOKEN_FILE, 'r') as f:
                    data = json.load(f)
                    return data.get("token"), data.get("usuario")
            return None, None
        except Exception as e:
            print(f"Error al leer token: {e}")
            return None, None
    
    @staticmethod
    def clear_token():
        """Elimina el token almacenado"""
        try:
            if os.path.exists(TOKEN_FILE):
                os.remove(TOKEN_FILE)
            return True
        except Exception as e:
            print(f"Error al eliminar token: {e}")
            return False



