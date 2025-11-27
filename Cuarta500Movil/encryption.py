"""
Utilidad para cifrar y descifrar datos
Compatible con el sistema de cifrado del backend Node.js
Usa AES-256-CBC para el cifrado
"""
import os
import json
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
import secrets

class Encryption:
    # Clave por defecto (debe coincidir con la del backend)
    DEFAULT_SECRET_KEY = 'clave-de-cifrado-de-32-caracteres-minimo-12345678901234567890'
    
    @staticmethod
    def _get_secret_key():
        """
        Obtiene la clave secreta del entorno o usa la por defecto
        
        IMPORTANTE: La clave debe ser EXACTAMENTE la misma que en el backend.
        Configura la variable de entorno ENCRYPTION_KEY antes de ejecutar la app:
        
        En Windows (PowerShell):
        $env:ENCRYPTION_KEY="tu-clave-de-32-caracteres-aqui"
        
        En Linux/Mac:
        export ENCRYPTION_KEY="tu-clave-de-32-caracteres-aqui"
        
        O usa la misma clave que está en el .env del backend.
        """
        key = os.getenv('ENCRYPTION_KEY', Encryption.DEFAULT_SECRET_KEY)
        if key == Encryption.DEFAULT_SECRET_KEY:
            print("ADVERTENCIA: Usando clave de cifrado por defecto. Asegúrate de que coincida con el backend.")
        return key
    
    @staticmethod
    def _prepare_key(key_string):
        """Prepara la clave para que tenga exactamente 32 bytes (igual que Node.js)"""
        # Node.js hace: key.substring(0, 32).padEnd(32, '0')
        if len(key_string) > 32:
            key_string = key_string[:32]
        if len(key_string) < 32:
            key_string = key_string.ljust(32, '0')
        return key_string.encode('utf-8')
    
    @staticmethod
    def encrypt(data, secret_key=None):
        """
        Cifra un objeto o string usando AES-256-CBC
        @param data - Datos a cifrar (objeto o string)
        @param secret_key - Clave secreta para cifrar (opcional)
        @returns string - String cifrado en formato hex:iv:encrypted
        """
        try:
            # Usar la clave secreta del .env o una por defecto
            key_string = secret_key or Encryption._get_secret_key()
            key = Encryption._prepare_key(key_string)
            
            # Convertir objeto a string JSON si es necesario
            if isinstance(data, str):
                data_string = data
            else:
                data_string = json.dumps(data)
            
            # Generar IV (Initialization Vector) aleatorio (16 bytes)
            iv = secrets.token_bytes(16)
            
            # Crear cipher
            cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
            encryptor = cipher.encryptor()
            
            # Aplicar padding PKCS7
            padder = padding.PKCS7(128).padder()
            padded_data = padder.update(data_string.encode('utf-8'))
            padded_data += padder.finalize()
            
            # Cifrar los datos
            encrypted = encryptor.update(padded_data) + encryptor.finalize()
            
            # Retornar en formato: iv:encrypted (ambos en hex)
            return iv.hex() + ':' + encrypted.hex()
        except Exception as error:
            print(f'Error al cifrar: {error}')
            raise Exception('Error al cifrar los datos')
    
    @staticmethod
    def decrypt(encrypted_data, secret_key=None):
        """
        Descifra un string cifrado
        @param encrypted_data - String cifrado en formato hex:iv:encrypted
        @param secret_key - Clave secreta para descifrar (opcional)
        @returns - Datos descifrados (objeto o string)
        """
        try:
            key_string = secret_key or Encryption._get_secret_key()
            # Preparar clave exactamente como Node.js: substring(0, 32).padEnd(32, '0')
            if len(key_string) < 32:
                key_string = key_string.ljust(32, '0')
            elif len(key_string) > 32:
                key_string = key_string[:32]
            key = key_string.encode('utf-8')
            
            # Separar IV y datos cifrados
            parts = encrypted_data.split(':')
            if len(parts) != 2:
                raise Exception('Formato de datos cifrados inválido')
            
            iv = bytes.fromhex(parts[0])
            encrypted_hex = parts[1]
            encrypted = bytes.fromhex(encrypted_hex)
            
            # Crear decipher
            cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
            decryptor = cipher.decryptor()
            
            # Descifrar (el padding se maneja automáticamente en Node.js, aquí también)
            decrypted_padded = decryptor.update(encrypted) + decryptor.finalize()
            
            # Remover padding PKCS7 (Node.js lo hace automáticamente, aquí lo hacemos manualmente)
            unpadder = padding.PKCS7(128).unpadder()
            try:
                decrypted = unpadder.update(decrypted_padded)
                decrypted += unpadder.finalize()
            except ValueError as e:
                # Si falla el unpadding, intentar sin padding (por si acaso)
                print(f'Advertencia: Error al remover padding, intentando sin padding: {e}')
                decrypted = decrypted_padded
            
            # Convertir a string
            try:
                decrypted_string = decrypted.decode('utf-8')
            except UnicodeDecodeError as e:
                print(f'Error al decodificar UTF-8: {e}')
                print(f'Datos descifrados (hex): {decrypted.hex()[:100]}...')
                # Intentar con diferentes encodings
                try:
                    decrypted_string = decrypted.decode('latin-1')
                except:
                    raise Exception(f'No se pudo decodificar los datos descifrados: {e}')
            
            # Intentar parsear como JSON, si falla retornar como string
            try:
                return json.loads(decrypted_string)
            except json.JSONDecodeError:
                return decrypted_string
        except Exception as error:
            print(f'Error al descifrar: {error}')
            import traceback
            traceback.print_exc()
            raise Exception('Error al descifrar los datos')
    
    @staticmethod
    def is_encrypted(data):
        """
        Verifica si un string está cifrado
        Un string cifrado tiene el formato: hex:hex (dos partes separadas por :)
        """
        if not isinstance(data, str):
            return False
        
        parts = data.split(':')
        if len(parts) != 2:
            return False
        
        # Verificar que ambas partes sean hexadecimales válidas
        try:
            bytes.fromhex(parts[0])
            bytes.fromhex(parts[1])
            return True
        except ValueError:
            return False
    
    @staticmethod
    def test_encryption():
        """Método de prueba para verificar que el cifrado/descifrado funciona"""
        test_data = {"test": "data", "number": 123}
        try:
            encrypted = Encryption.encrypt(test_data)
            print(f"Test - Datos cifrados: {encrypted[:50]}...")
            decrypted = Encryption.decrypt(encrypted)
            print(f"Test - Datos descifrados: {decrypted}")
            if decrypted == test_data:
                print("✓ Test de cifrado/descifrado: EXITOSO")
                return True
            else:
                print(f"✗ Test falló: datos no coinciden. Esperado: {test_data}, Obtenido: {decrypted}")
                return False
        except Exception as e:
            print(f"✗ Test falló con error: {e}")
            import traceback
            traceback.print_exc()
            return False

