// Sistema de detección de duplicados
import { videoRepository } from '../database/videoRepository';
import { HashGenerator } from '../lib/hashGenerator';
import { VideoRecord } from '../types';
import fs from 'fs-extra';

export interface DuplicateResult {
  isDuplicate: boolean;
  originalVideo?: VideoRecord;
  similarity?: number;
  reason?: string;
}

export class DuplicateDetector {
  /**
   * Verifica si video es duplicado basado en hash de archivo
   */
  static async detectByFileHash(filePath: string): Promise<DuplicateResult> {
    try {
      const fileHash = await HashGenerator.generateFileHash(filePath);
      const existingVideo = videoRepository.findByHash(fileHash);
      
      if (existingVideo) {
        return {
          isDuplicate: true,
          originalVideo: existingVideo,
          similarity: 1.0, // Coincidencia exacta
          reason: 'Hash de archivo idéntico (MD5)'
        };
      }
      
      return { isDuplicate: false };
    } catch (error) {
      console.error('Error detectando duplicado por hash:', error);
      return { isDuplicate: false, reason: 'Error durante detección de hash' };
    }
  }

  /**
   * Verifica si video es duplicado basado en ID único de Telegram
   */
  static detectByTelegramId(fileUniqueId: string): DuplicateResult {
    try {
      const existingVideo = videoRepository.findByFileUniqueId(fileUniqueId);
      
      if (existingVideo) {
        return {
          isDuplicate: true,
          originalVideo: existingVideo,
          similarity: 1.0, // Coincidencia exacta
          reason: 'Mismo ID único de Telegram'
        };
      }
      
      return { isDuplicate: false };
    } catch (error) {
      console.error('Error detectando duplicado por ID Telegram:', error);
      return { isDuplicate: false, reason: 'Error durante detección de ID Telegram' };
    }
  }

  /**
   * Verifica si video es duplicado basado en similitud de metadata
   */
  static async detectByMetadata(videoData: {
    fileSize: number;
    duration?: number;
    width?: number;
    height?: number;
    mimeType?: string;
    chatId: string;
  }): Promise<DuplicateResult> {
    try {
      // Obtener videos del mismo chat con propiedades similares
      const { videos } = videoRepository.getAllVideos(1, 100, {
        chatId: videoData.chatId,
        status: 'completed'
      });
      
      for (const existingVideo of videos) {
        const similarity = DuplicateDetector.calculateMetadataSimilarity(videoData, existingVideo);
        
        // Considerar como duplicado si la similitud es muy alta
        if (similarity >= 0.95) {
          return {
            isDuplicate: true,
            originalVideo: existingVideo,
            similarity,
            reason: `Alta similitud de metadata (${Math.round(similarity * 100)}%)`
          };
        }
      }
      
      return { isDuplicate: false };
    } catch (error) {
      console.error('Error detectando duplicado por metadata:', error);
      return { isDuplicate: false, reason: 'Error durante detección de metadata' };
    }
  }

  /**
   * Calcula similitud entre metadata de videos
   */
  private static calculateMetadataSimilarity(
    newVideo: {
      fileSize: number;
      duration?: number;
      width?: number;
      height?: number;
      mimeType?: string;
    },
    existingVideo: VideoRecord
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Comparación de tamaño de archivo (peso: 40%)
    const sizeDiff = Math.abs(newVideo.fileSize - existingVideo.file_size) / Math.max(newVideo.fileSize, existingVideo.file_size);
    const sizeScore = Math.max(0, 1 - sizeDiff);
    totalScore += sizeScore * 40;
    totalWeight += 40;

    // Comparación de duración (peso: 30%)
    if (newVideo.duration && existingVideo.duration) {
      const durationDiff = Math.abs(newVideo.duration - existingVideo.duration) / Math.max(newVideo.duration, existingVideo.duration);
      const durationScore = Math.max(0, 1 - durationDiff);
      totalScore += durationScore * 30;
      totalWeight += 30;
    }

    // Comparación de resolución (peso: 20%)
    if (newVideo.width && newVideo.height && existingVideo.width && existingVideo.height) {
      const widthDiff = Math.abs(newVideo.width - existingVideo.width) / Math.max(newVideo.width, existingVideo.width);
      const heightDiff = Math.abs(newVideo.height - existingVideo.height) / Math.max(newVideo.height, existingVideo.height);
      const resolutionScore = Math.max(0, 1 - (widthDiff + heightDiff) / 2);
      totalScore += resolutionScore * 20;
      totalWeight += 20;
    }

    // Comparación de tipo MIME (peso: 10%)
    if (newVideo.mimeType && existingVideo.mime_type) {
      const mimeScore = newVideo.mimeType === existingVideo.mime_type ? 1 : 0;
      totalScore += mimeScore * 10;
      totalWeight += 10;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Detección comprehensiva de duplicados
   */
  static async detectDuplicate(
    filePath: string,
    fileUniqueId: string,
    videoData: {
      fileSize: number;
      duration?: number;
      width?: number;
      height?: number;
      mimeType?: string;
      chatId: string;
    }
  ): Promise<DuplicateResult> {
    // Primero verificar por ID único de Telegram (más rápido)
    const telegramIdResult = DuplicateDetector.detectByTelegramId(fileUniqueId);
    if (telegramIdResult.isDuplicate) {
      return telegramIdResult;
    }

    // Luego verificar por hash de archivo (más confiable)
    const fileHashResult = await DuplicateDetector.detectByFileHash(filePath);
    if (fileHashResult.isDuplicate) {
      return fileHashResult;
    }

    // Finalmente verificar por similitud de metadata (menos confiable pero detecta archivos similares)
    const metadataResult = await DuplicateDetector.detectByMetadata(videoData);
    if (metadataResult.isDuplicate) {
      return metadataResult;
    }

    return { isDuplicate: false };
  }

  /**
   * Obtener estadísticas de duplicados
   */
  static getDuplicateStats(): {
    totalVideos: number;
    duplicateVideos: number;
    uniqueVideos: number;
    duplicateRate: number;
    spaceSavedBytes: number;
  } {
    const stats = videoRepository.getStats();
    const spaceSavedBytes = stats.duplicates * (stats.totalSize / Math.max(stats.total, 1));
    
    return {
      totalVideos: stats.total,
      duplicateVideos: stats.duplicates,
      uniqueVideos: stats.total - stats.duplicates,
      duplicateRate: stats.total > 0 ? stats.duplicates / stats.total : 0,
      spaceSavedBytes
    };
  }

  /**
   * Limpiar archivos duplicados del sistema de archivos
   */
  static async cleanupDuplicateFiles(): Promise<{
    cleaned: number;
    errors: string[];
  }> {
    const result = { cleaned: 0, errors: [] };
    
    try {
      const { videos } = videoRepository.getAllVideos(1, 1000, { isDuplicate: true });
      
      for (const video of videos) {
        try {
          // Eliminar archivo de video
          if (await fs.pathExists(video.local_path)) {
            await fs.remove(video.local_path);
          }
          
          // Eliminar thumbnail si existe
          if (video.thumbnail_path && await fs.pathExists(video.thumbnail_path)) {
            await fs.remove(video.thumbnail_path);
          }
          
          result.cleaned++;
        } catch (error) {
          result.errors.push(`Error limpiando ${video.id}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Error general de limpieza: ${error}`);
    }
    
    return result;
  }
}

export default DuplicateDetector;