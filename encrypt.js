import CryptoJS from "crypto-js";
import fs from "fs";

export function encryptSession(filePath, secretKey) {
    const data = fs.readFileSync(filePath, "utf-8");
    const encrypted = CryptoJS.AES.encrypt(data, secretKey).toString();
    return encrypted;
}

export function decryptSession(encrypted, secretKey) {
    const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
}