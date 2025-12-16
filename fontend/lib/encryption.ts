// frontend/lib/encryption.ts
import CryptoJS from "crypto-js";

// Khóa này phải giống hệt khóa dùng trong proxy.ts để giải mã được
const SECRET_KEY = "phuong-dao-thanh-secret-key-123"; 

export const encryptData = (data: string) => {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

export const decryptData = (ciphertext: string) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || null;
  } catch (e) {
    return null; 
  }
};