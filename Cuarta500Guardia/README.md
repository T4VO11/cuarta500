# Cuarta500 Guardia - Aplicación Móvil para Guardias

Aplicación móvil para guardias que permite validar QRs de visitantes y registrar entradas/salidas.

## Características

- **Login de Guardias**: Autenticación exclusiva para usuarios con rol "guardia"
- **Escaneo de QR**: Validación de códigos QR de visitantes
- **Registro de Accesos**: Registro automático de entradas y salidas
- **Historial**: Visualización de accesos registrados

## Requisitos

- Python 3.9 o superior
- Flet
- Conexión al backend de Cuarta500

## Instalación

```bash
pip install -r requirements.txt
```

## Configuración

Ajusta la URL del backend en `api_client.py`:

```python
BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")
```

O establece la variable de entorno:

```bash
export API_BASE_URL=http://tu-servidor:3000
```

## Uso

```bash
python main.py
```

## Funcionalidades

### Login
- Solo usuarios con rol "guardia" pueden acceder
- Autenticación mediante JWT

### Validar QR
- Escaneo de códigos QR de visitantes
- Validación automática contra el backend
- Registro de acceso en bitácora
- Soporte para QRs de uso único y múltiples usos

### Historial
- Visualización de accesos registrados
- Información de visitantes y fechas

## Notas

- La aplicación requiere conexión al backend para funcionar
- Los QRs se validan usando el endpoint `/invitar-amigos/validar-qr`
- Cada validación exitosa se registra automáticamente en la bitácora

