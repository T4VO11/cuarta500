"""
Cliente API para consumir las APIs del backend Express
Maneja autenticación con JWT y todas las peticiones HTTP
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
        """Login de usuario - POST /usuarios/login"""
        data = {
            "username": username,
            "password": password
        }
        response, status_code = self._make_request('POST', '/usuarios/login', data=data)
        
        if status_code == 200 and response.get('estado') == 'exito':
            # El campo data ya debería estar descifrado automáticamente por _make_request
            data_response = response.get('data', {})
            
            # Debug: verificar el tipo de data_response
            print(f"DEBUG login - Tipo de data_response: {type(data_response)}")
            if isinstance(data_response, str):
                print(f"DEBUG login - data_response es string, longitud: {len(data_response)}")
                print(f"DEBUG login - Primeros 100 chars: {data_response[:100]}")
            
            # Manejar caso donde data puede ser un dict (descifrado) o string (sin cifrar o error)
            if isinstance(data_response, dict):
                token = data_response.get('token')
            elif isinstance(data_response, str):
                # Si aún es string, puede estar cifrado o ser un error
                print("DEBUG login - data_response es string, intentando procesar...")
                # Si parece ser JSON sin cifrar, intentar parsearlo
                if data_response.startswith('{') or data_response.startswith('['):
                    try:
                        data_response = json.loads(data_response)
                        token = data_response.get('token') if isinstance(data_response, dict) else None
                    except:
                        token = None
                # Si está cifrado, intentar descifrar
                elif Encryption.is_encrypted(data_response):
                    print("DEBUG login - Detectado formato cifrado, intentando descifrar...")
                    try:
                        data_response = Encryption.decrypt(data_response)
                        token = data_response.get('token') if isinstance(data_response, dict) else None
                    except Exception as e:
                        print(f"DEBUG login - Error al descifrar: {e}")
                        token = None
                else:
                    print("DEBUG login - data_response no es JSON ni está cifrado")
                    token = None
            else:
                token = None
            
            if token:
                self.set_token(token)
                # Asegurar que data_response sea un dict para el retorno
                if not isinstance(data_response, dict):
                    data_response = {}
                return True, response.get('mensaje', 'Login exitoso'), data_response
            else:
                print(f"DEBUG login - No se pudo obtener token. data_response: {data_response}")
        
        return False, response.get('mensaje', 'Error en el login'), None
    
    def registrar_usuario(self, usuario_data, files=None):
        """Registrar nuevo usuario - POST /usuarios/registrar"""
        # Preparar datos para multipart/form-data si hay archivos
        if files:
            data = {}
            for key, value in usuario_data.items():
                if value is not None:
                    data[key] = str(value) if not isinstance(value, str) else value
            response, status_code = self._make_request('POST', '/usuarios/registrar', data=data, files=files)
        else:
            response, status_code = self._make_request('POST', '/usuarios/registrar', data=usuario_data)
        
        if status_code in [200, 201] and response.get('estado') == 'exito':
            return True, response.get('mensaje', 'Usuario registrado exitosamente'), response.get('data')
        
        return False, response.get('mensaje', 'Error al registrar usuario'), None
    
    def logout(self):
        """Logout de usuario - POST /usuarios/logout"""
        response, status_code = self._make_request('POST', '/usuarios/logout')
        self.clear_token()
        return status_code == 200
    
    # ========== USUARIOS ==========
    def obtener_usuarios(self, encrypt=False):
        """Obtener todos los usuarios - GET /usuarios"""
        params = {'encrypt': 'true'} if encrypt else None
        response, status_code = self._make_request('GET', '/usuarios', params=params)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data', []), response.get('mensaje')
        
        return False, [], response.get('mensaje', 'Error al obtener usuarios')
    
    def obtener_usuario(self, usuario_id, encrypt=False):
        """Obtener un usuario por ID - GET /usuarios/:id"""
        params = {'encrypt': 'true'} if encrypt else None
        response, status_code = self._make_request('GET', f'/usuarios/{usuario_id}', params=params)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data'), response.get('mensaje')
        
        return False, None, response.get('mensaje', 'Usuario no encontrado')
    
    def obtener_mi_perfil(self, encrypt=False):
        """Obtener perfil del usuario actual - GET /usuarios/mi-perfil"""
        params = {'encrypt': 'true'} if encrypt else None
        response, status_code = self._make_request('GET', '/usuarios/mi-perfil', params=params)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data'), response.get('mensaje')
        
        return False, None, response.get('mensaje', 'Error al obtener perfil')
    
    def actualizar_usuario(self, usuario_id, usuario_data, files=None):
        """Actualizar usuario - PUT /usuarios/:id"""
        if files:
            data = {}
            for key, value in usuario_data.items():
                if value is not None:
                    data[key] = str(value) if not isinstance(value, str) else value
            response, status_code = self._make_request('PUT', f'/usuarios/{usuario_id}', data=data, files=files)
        else:
            response, status_code = self._make_request('PUT', f'/usuarios/{usuario_id}', data=usuario_data)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data'), response.get('mensaje')
        
        return False, None, response.get('mensaje', 'Error al actualizar usuario')
    
    def eliminar_usuario(self, usuario_id):
        """Eliminar usuario - DELETE /usuarios/:id"""
        response, status_code = self._make_request('DELETE', f'/usuarios/{usuario_id}')
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('mensaje')
        
        return False, response.get('mensaje', 'Error al eliminar usuario')
    
    # ========== CATEGORÍAS ==========
    def obtener_categorias(self, encrypt=False):
        """Obtener todas las categorías - GET /categorias"""
        params = {'encrypt': 'true'} if encrypt else None
        response, status_code = self._make_request('GET', '/categorias', params=params)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data', []), response.get('mensaje')
        
        return False, [], response.get('mensaje', 'Error al obtener categorías')
    
    def obtener_categoria(self, categoria_id, encrypt=False):
        """Obtener una categoría por ID - GET /categorias/:id"""
        params = {'encrypt': 'true'} if encrypt else None
        response, status_code = self._make_request('GET', f'/categorias/{categoria_id}', params=params)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data'), response.get('mensaje')
        
        return False, None, response.get('mensaje', 'Categoría no encontrada')
    
    def crear_categoria(self, categoria_data):
        """Crear categoría - POST /categorias"""
        response, status_code = self._make_request('POST', '/categorias', data=categoria_data)
        
        if status_code in [200, 201] and response.get('estado') == 'exito':
            return True, response.get('data'), response.get('mensaje')
        
        return False, None, response.get('mensaje', 'Error al crear categoría')
    
    def actualizar_categoria(self, categoria_id, categoria_data):
        """Actualizar categoría - PUT /categorias/:id"""
        response, status_code = self._make_request('PUT', f'/categorias/{categoria_id}', data=categoria_data)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data'), response.get('mensaje')
        
        return False, None, response.get('mensaje', 'Error al actualizar categoría')
    
    def eliminar_categoria(self, categoria_id):
        """Eliminar categoría - DELETE /categorias/:id"""
        response, status_code = self._make_request('DELETE', f'/categorias/{categoria_id}')
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('mensaje')
        
        return False, response.get('mensaje', 'Error al eliminar categoría')
    
    # ========== INCIDENTES ==========
    def obtener_incidentes(self, encrypt=False):
        """Obtener todos los incidentes - GET /incidentes"""
        params = {'encrypt': 'true'} if encrypt else None
        response, status_code = self._make_request('GET', '/incidentes', params=params)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data', []), response.get('mensaje')
        
        return False, [], response.get('mensaje', 'Error al obtener incidentes')
    
    
    # ========== INVITAR AMIGOS ==========
    def obtener_invitaciones(self, encrypt=False):
        """Obtener todas las invitaciones - GET /invitarAmigos"""
        params = {'encrypt': 'true'} if encrypt else None
        response, status_code = self._make_request('GET', '/invitarAmigos', params=params)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data', []), response.get('mensaje')
        
        return False, [], response.get('mensaje', 'Error al obtener invitaciones')
    
    def obtener_invitacion(self, invitacion_id, encrypt=False):
        """Obtener una invitación por ID - GET /invitarAmigos/:id"""
        params = {'encrypt': 'true'} if encrypt else None
        response, status_code = self._make_request('GET', f'/invitarAmigos/{invitacion_id}', params=params)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data'), response.get('mensaje')
        
        return False, None, response.get('mensaje', 'Invitación no encontrada')
    
    def crear_invitacion(self, invitacion_data):
        """Crear invitación - POST /invitarAmigos/crear (para usuarios normales)"""
        print(f"API Client - Enviando invitación: {invitacion_data}")
        # Intentar primero con la ruta para usuarios normales
        response, status_code = self._make_request('POST', '/invitarAmigos/crear', data=invitacion_data)
        print(f"API Client - Respuesta ruta /crear: status={status_code}, response={response}")
        
        # Si falla, intentar con la ruta de admin (por compatibilidad)
        if status_code not in [200, 201]:
            print(f"API Client - Primera ruta falló, intentando con /invitarAmigos")
            response, status_code = self._make_request('POST', '/invitarAmigos', data=invitacion_data)
            print(f"API Client - Respuesta ruta /invitarAmigos: status={status_code}, response={response}")
        
        if status_code in [200, 201] and response.get('estado') == 'exito':
            print(f"API Client - Invitación creada exitosamente: {response.get('data')}")
            return True, response.get('data'), response.get('mensaje')
        
        error_msg = response.get('mensaje', 'Error al crear invitación')
        print(f"API Client - Error al crear invitación: {error_msg}")
        return False, None, error_msg
    
    def actualizar_invitacion(self, invitacion_id, invitacion_data):
        """Actualizar invitación - PUT /invitarAmigos/:id"""
        response, status_code = self._make_request('PUT', f'/invitarAmigos/{invitacion_id}', data=invitacion_data)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data'), response.get('mensaje')
        
        return False, None, response.get('mensaje', 'Error al actualizar invitación')
    
    def eliminar_invitacion(self, invitacion_id):
        """Eliminar invitación - DELETE /invitarAmigos/:id"""
        response, status_code = self._make_request('DELETE', f'/invitarAmigos/{invitacion_id}')
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('mensaje')
        
        return False, response.get('mensaje', 'Error al eliminar invitación')
    
    def obtener_mis_invitaciones(self, encrypt=False):
        """Obtener invitaciones del usuario actual - GET /invitarAmigos/mis-invitaciones"""
        params = {'encrypt': 'true'} if encrypt else None
        response, status_code = self._make_request('GET', '/invitarAmigos/mis-invitaciones', params=params)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data', []), response.get('mensaje')
        
        return False, [], response.get('mensaje', 'Error al obtener invitaciones')
    
    # ========== ADEUDOS/PAGOS ==========
    def obtener_mis_adeudos(self, encrypt=False):
        """Obtener adeudos del usuario actual - GET /listadoAdeudos/mis-adeudos"""
        params = {'encrypt': 'true'} if encrypt else None
        response, status_code = self._make_request('GET', '/listadoAdeudos/mis-adeudos', params=params)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data', []), response.get('mensaje')
        
        return False, [], response.get('mensaje', 'Error al obtener adeudos')
    
    # ========== AMENIDADES ==========
    def obtener_amenidades_disponibles(self, encrypt=False):
        """Obtener amenidades disponibles - GET /amenidades/disponibles"""
        params = {'encrypt': 'true'} if encrypt else None
        response, status_code = self._make_request('GET', '/amenidades/disponibles', params=params)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data', []), response.get('mensaje')
        
        return False, [], response.get('mensaje', 'Error al obtener amenidades disponibles')
    
    def obtener_amenidad(self, amenidad_id, encrypt=False):
        """Obtener una amenidad por ID - GET /amenidades/:id"""
        params = {'encrypt': 'true'} if encrypt else None
        response, status_code = self._make_request('GET', f'/amenidades/{amenidad_id}', params=params)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data'), response.get('mensaje')
        
        return False, None, response.get('mensaje', 'Amenidad no encontrada')
    
    # ========== RESERVACIONES ==========
    def obtener_mis_reservas(self, encrypt=False):
        """Obtener reservas del usuario actual - GET /reservaciones/mis-reservaciones"""
        params = {'encrypt': 'true'} if encrypt else None
        print(f"Obteniendo reservas del usuario...")
        response, status_code = self._make_request('GET', '/reservaciones/mis-reservaciones', params=params)
        
        print(f"Respuesta del servidor (obtener_mis_reservas): status={status_code}, response={response}")
        
        if status_code == 200 and response.get('estado') == 'exito':
            reservas = response.get('data', [])
            print(f"Reservas obtenidas: {len(reservas)} reservas")
            return True, reservas, response.get('mensaje')
        
        return False, [], response.get('mensaje', 'Error al obtener reservas')
    
    def crear_reservacion(self, reservacion_data):
        """Crear reservación - POST /reservaciones/crear (para usuarios normales)"""
        print(f"Enviando datos de reservación: {reservacion_data}")
        # Solo usar la ruta para usuarios normales, no intentar con la de admin
        response, status_code = self._make_request('POST', '/reservaciones/crear', data=reservacion_data)
        
        print(f"Respuesta del servidor (crear_reservacion): status={status_code}, response={response}")
        
        if status_code in [200, 201] and response.get('estado') == 'exito':
            return True, response.get('data'), response.get('mensaje')
        
        return False, None, response.get('mensaje', 'Error al crear reservación')
    
    # ========== BITÁCORAS / HISTORIAL DE ACCESOS ==========
    def obtener_historial_accesos(self, encrypt=False):
        """Obtener historial de accesos del usuario actual - GET /bitacoras/mi-historial"""
        params = {'encrypt': 'true'} if encrypt else None
        response, status_code = self._make_request('GET', '/bitacoras/mi-historial', params=params)
        
        if status_code == 200 and response.get('estado') == 'exito':
            return True, response.get('data', []), response.get('mensaje')
        
        return False, [], response.get('mensaje', 'Error al obtener historial de accesos')



