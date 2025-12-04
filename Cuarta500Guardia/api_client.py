"""
Cliente API para consumir las APIs del backend Express
Especializado para guardias - validación de QRs
"""
import requests
import json
import os
from encryption import Encryption

# URL base del backend (ajusta según tu configuración)
BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")

class ApiClient:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.session = requests.Session()
    
    def set_token(self, token):
        """Almacena el token JWT"""
        self.token = token
        # Guardar token en headers para todas las peticiones
        self.session.headers.update({
            'Authorization': f'Bearer {token}'
        })
    
    def clear_token(self):
        """Elimina el token y limpia los headers"""
        self.token = None
        if 'Authorization' in self.session.headers:
            del self.session.headers['Authorization']
    
    def _make_request(self, method, endpoint, data=None, files=None, params=None):
        """Método genérico para hacer peticiones HTTP"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = self.session.get(url, params=params, headers=headers)
            elif method == 'POST':
                if files:
                    headers = {}  
                    response = self.session.post(url, data=data, files=files, params=params)
                else:
                    response = self.session.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                if files:
                    headers = {}
                    response = self.session.put(url, data=data, files=files, params=params)
                else:
                    response = self.session.put(url, json=data, headers=headers, params=params)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers, params=params)
            else:
                raise ValueError(f"Método HTTP no soportado: {method}")
            
            try:
                response_data = response.json()
                
                # Detectar y descifrar respuestas cifradas
                # El backend cifra solo el campo 'data' cuando está activado el cifrado
                if isinstance(response_data, dict) and 'data' in response_data:
                    data = response_data.get('data')
                    # Si data es un string, verificar si está cifrado
                    if isinstance(data, str) and Encryption.is_encrypted(data):
                        try:
                            # Descifrar el campo data
                            decrypted_data = Encryption.decrypt(data)
                            response_data['data'] = decrypted_data
                        except Exception as e:
                            print(f"Error al descifrar respuesta: {e}")
                            import traceback
                            traceback.print_exc()
                            # Si falla el descifrado, intentar usar la data sin descifrar
                            # (puede que no esté cifrado o que la clave no coincida)
                            print(f"Advertencia: No se pudo descifrar la respuesta. Verifica que ENCRYPTION_KEY coincida con el backend.")
                            # Dejar la data como está para que el código pueda continuar
                            pass
                
                return response_data, response.status_code
            except json.JSONDecodeError:
                return {"estado": "error", "mensaje": "Respuesta no válida del servidor"}, response.status_code
                
        except requests.exceptions.ConnectionError:
            return {"estado": "error", "mensaje": "No se pudo conectar al servidor"}, 0
        except requests.exceptions.Timeout:
            return {"estado": "error", "mensaje": "Tiempo de espera agotado"}, 0
        except Exception as e:
            return {"estado": "error", "mensaje": f"Error en la petición: {str(e)}"}, 0
    
    # ========== AUTENTICACION ==========
    def login(self, username, password):
        """Login de guardia - POST /usuarios/login"""
        data = {
            "username": username,
            "password": password
        }
        response, status_code = self._make_request('POST', '/usuarios/login', data=data)
        
        # Validar que response sea un diccionario
        if not isinstance(response, dict):
            return False, f"Error en la respuesta del servidor: {str(response)}", None
        
        if status_code == 200 and response.get('estado') == 'exito':
            # El campo data ya debería estar descifrado automáticamente por _make_request
            data_response = response.get('data', {})
            
            # Manejar caso donde data puede ser un dict (descifrado) o string (sin cifrar o error)
            if isinstance(data_response, dict):
                token = data_response.get('token')
            elif isinstance(data_response, str):
                # Si aún es string, puede estar cifrado o ser un error
                # Si parece ser JSON sin cifrar, intentar parsearlo
                if data_response.startswith('{') or data_response.startswith('['):
                    try:
                        data_response = json.loads(data_response)
                        token = data_response.get('token') if isinstance(data_response, dict) else None
                    except:
                        token = None
                # Si está cifrado, intentar descifrar
                elif Encryption.is_encrypted(data_response):
                    try:
                        data_response = Encryption.decrypt(data_response)
                        token = data_response.get('token') if isinstance(data_response, dict) else None
                    except Exception as e:
                        token = None
                else:
                    token = None
            else:
                token = None
            
            if token:
                self.set_token(token)
                # Asegurar que data_response sea un dict para el retorno
                if not isinstance(data_response, dict):
                    data_response = {}
                # Verificar que el usuario sea guardia
                usuario_data = data_response.get('usuario')
                if usuario_data and isinstance(usuario_data, dict) and usuario_data.get('rol') != 'guardia':
                    return False, "Solo los guardias pueden acceder a esta aplicación", None
                return True, response.get('mensaje', 'Login exitoso'), data_response
        
        mensaje_error = response.get('mensaje', 'Error en el login') if isinstance(response, dict) else str(response)
        return False, mensaje_error, None
        
        mensaje_error = response.get('mensaje', 'Error en el login') if isinstance(response, dict) else str(response)
        return False, mensaje_error, None
    
    def logout(self):
        """Cierra sesión"""
        self.clear_token()
        return True
    
    # ========== VALIDACION QR ==========
    def validar_qr(self, qr_data):
        """
        Valida un QR escaneado - POST /invitar-amigos/validar-qr
        qr_data puede ser un string JSON o un dict con codigo_acceso o invitacion_id
        """
        if isinstance(qr_data, str):
            try:
                qr_data = json.loads(qr_data)
            except:
                pass
        
        data = {
            "qr_data": qr_data
        }
        
        # Esta ruta es pública, no requiere token
        response, status_code = self._make_request('POST', '/invitar-amigos/validar-qr', data=data)
        
        # Validar que response sea un diccionario
        if not isinstance(response, dict):
            return False, None, f"Error en la respuesta del servidor: {str(response)}"
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data'), response.get('mensaje', 'QR válido')
        
        mensaje_error = response.get('mensaje', 'Error al validar QR') if isinstance(response, dict) else str(response)
        return False, None, mensaje_error

