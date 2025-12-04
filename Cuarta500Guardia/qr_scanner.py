"""
Módulo para escanear códigos QR usando la cámara
"""
import cv2
from pyzbar import pyzbar
import threading
import time

class QRScanner:
    def __init__(self):
        self.camera = None
        self.scanning = False
        self.last_qr = None
    
    def start_camera(self):
        """Inicia la cámara"""
        try:
            self.camera = cv2.VideoCapture(0)
            if not self.camera.isOpened():
                return False, "No se pudo abrir la cámara"
            return True, "Cámara iniciada"
        except Exception as e:
            return False, f"Error al iniciar cámara: {str(e)}"
    
    def stop_camera(self):
        """Detiene la cámara"""
        self.scanning = False
        if self.camera:
            self.camera.release()
            self.camera = None
        cv2.destroyAllWindows()
    
    def scan_qr(self, callback=None, timeout=30):
        """
        Escanea QR desde la cámara
        @param callback: Función a llamar cuando se detecte un QR (recibe el código QR como parámetro)
        @param timeout: Tiempo máximo de escaneo en segundos
        """
        if not self.camera or not self.camera.isOpened():
            success, message = self.start_camera()
            if not success:
                if callback:
                    callback(None, message)
                return None, message
        
        self.scanning = True
        start_time = time.time()
        
        try:
            while self.scanning:
                # Verificar timeout
                if time.time() - start_time > timeout:
                    if callback:
                        callback(None, "Tiempo de escaneo agotado")
                    break
                
                # Leer frame de la cámara
                ret, frame = self.camera.read()
                if not ret:
                    continue
                
                # Mostrar frame (opcional, para debugging)
                # cv2.imshow('Escanear QR', frame)
                
                # Detectar códigos QR
                qr_codes = pyzbar.decode(frame)
                
                if qr_codes:
                    # Obtener el primer QR detectado
                    qr_data = qr_codes[0].data.decode('utf-8')
                    self.last_qr = qr_data
                    self.scanning = False
                    
                    if callback:
                        callback(qr_data, None)
                    return qr_data, None
                
                # Salir con 'q' o ESC (opcional)
                # key = cv2.waitKey(1) & 0xFF
                # if key == ord('q') or key == 27:
                #     break
                
                time.sleep(0.1)  # Pequeña pausa para no saturar CPU
            
            return None, "Escaneo cancelado"
        except Exception as e:
            return None, f"Error al escanear: {str(e)}"
        finally:
            self.stop_camera()
    
    def scan_qr_async(self, callback, timeout=30):
        """
        Escanea QR de forma asíncrona en un thread separado
        """
        def scan_thread():
            self.scan_qr(callback, timeout)
        
        thread = threading.Thread(target=scan_thread, daemon=True)
        thread.start()
        return thread

