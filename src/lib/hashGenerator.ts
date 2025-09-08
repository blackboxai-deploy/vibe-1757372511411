// Generador de hashes MD5 para detección de duplicados
import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { promisify } from 'util';

export class HashGenerator {
  /**
   * Genera hash MD5 de un archivo
   */
  static async generateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('md5');
      const stream = createReadStream(filePath);

      stream.on('data', (data) => {
        hash.update(data);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Genera hash MD5 de un buffer
   */
  static generateBufferHash(buffer: Buffer): string {
    const hash = createHash('md5');
    hash.update(buffer);
    return hash.digest('hex');
  }

  /**
   * Genera hash MD5 de un string
   */
  static generateStringHash(text: string): string {
    const hash = createHash('md5');
    hash.update(text);
    return hash.digest('hex');
  }

  /**
   * Genera hash de thumbnail de video
   */
  static async generateThumbnailHash(thumbnailPath: string): Promise<string> {
    try {
      return await this.generateFileHash(thumbnailPath);
    } catch (error) {
      console.error('Error generando hash de thumbnail:', error);
      return '';
    }
  }

  /**
   * Genera hash único para video basado en metadata
   */
  static generateMetadataHash(metadata: {
    fileSize: number;
    duration?: number;
    width?: number;
    height?: number;
    chatId: string;
    messageId: number;
  }): string {
    const metadataString = `${metadata.fileSize}-${metadata.duration || 0}-${metadata.width || 0}-${metadata.height || 0}-${metadata.chatId}-${metadata.messageId}`;
    return this.generateStringHash(metadataString);
  }

  /**
   * Compara dos hashes
   */
  static compareHashes(hash1: string, hash2: string): boolean {
    return hash1.toLowerCase() === hash2.toLowerCase();
  }

  /**
   * Valida que un hash sea válido (MD5)
   */
  static isValidHash(hash: string): boolean {
    return /^[a-fA-F0-9]{32}$/.test(hash);
  }
}