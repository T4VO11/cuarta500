import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root' // Esto hace que el servicio esté disponible en toda la app
})
export class CryptoService {
  // Tomamos la clave de tu archivo de environment
  private secretKey = environment.secretKey; 

  constructor() { }

  /**
   * Método para descifrar la respuesta del servidor
   * Espera un formato: "IV_EN_HEX:DATA_EN_HEX"
   */
  decrypt(encryptedString: string): any {
    try {
      // 1. Validamos que el string no esté vacío
      if (!encryptedString) return null;

      // 2. Separamos el IV de la data (formato del backend)
      const parts = encryptedString.split(':');
      
      // Si no tiene el formato correcto (no hay dos partes), devolvemos null
      if (parts.length !== 2) {
        console.warn("Formato de cifrado incorrecto");
        return null;
      }

      const ivHex = parts[0];
      const encryptedDataHex = parts[1];

      // 3. Preparamos la llave para que tenga exactamente 32 bytes (como hace tu backend)
      let keyString = this.secretKey;
      if (keyString.length < 32) keyString = keyString.padEnd(32, '0');
      if (keyString.length > 32) keyString = keyString.substring(0, 32);

      // Convertimos todo a formatos que CryptoJS entienda
      const key = CryptoJS.enc.Utf8.parse(keyString);
      const iv = CryptoJS.enc.Hex.parse(ivHex);
      const ciphertext = CryptoJS.enc.Hex.parse(encryptedDataHex);

      // 4. Ejecutamos el descifrado AES
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: ciphertext } as any,
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      // 5. Convertimos los bytes resultantes a texto legible
      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

      // 6. Convertimos el texto JSON a un objeto de JavaScript real
      return JSON.parse(decryptedText);

    } catch (e) {
      console.error("Error crítico al descifrar datos:", e);
      return null;
    }
  }

  /**
   * NUEVO: Cifra datos para enviarlos al servidor
   * Genera formato: "IV_HEX:DATA_HEX" compatible con tu backend Node.js
   */
  encrypt(data: any): string {
    try {
      // 1. Preparar la data
      const dataString = JSON.stringify(data);
      
      // 2. Generar IV aleatorio (16 bytes)
      const iv = CryptoJS.lib.WordArray.random(16);
      
      // 3. Preparar la clave (32 bytes)
      let keyString = this.secretKey;
      if (keyString.length < 32) keyString = keyString.padEnd(32, '0');
      if (keyString.length > 32) keyString = keyString.substring(0, 32);
      const key = CryptoJS.enc.Utf8.parse(keyString);

      // 4. Cifrar
      const encrypted = CryptoJS.AES.encrypt(dataString, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // 5. IMPORTANTE: El backend espera HEX, no Base64
      // Convertimos el IV y el Ciphertext a Hexadecimal
      const ivHex = iv.toString(CryptoJS.enc.Hex);
      const encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);

      // 6. Retornamos el formato "IV:DATA"
      return ivHex + ':' + encryptedHex;

    } catch (e) {
      console.error("Error cifrando datos:", e);
      return '';
    }
  }

}