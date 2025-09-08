// Repositorio para operaciones CRUD de videos
import { getDatabase } from './database';
import { VideoRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class VideoRepository {
  private db = getDatabase();

  // Crear un nuevo video
  create(videoData: Omit<VideoRecord, 'id' | 'created_at' | 'updated_at'>): VideoRecord {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const insert = this.db.prepare(`
      INSERT INTO videos (
        id, file_id, file_unique_id, file_name, file_size, duration, width, height,
        mime_type, file_hash, thumbnail_hash, local_path, thumbnail_path, chat_id,
        chat_title, chat_type, message_id, sender_id, sender_username, sender_first_name,
        sender_last_name, caption, date, processed_date, is_duplicate, original_video_id,
        tags, status, error_message, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);
    
    insert.run(
      id, videoData.file_id, videoData.file_unique_id, videoData.file_name,
      videoData.file_size, videoData.duration, videoData.width, videoData.height,
      videoData.mime_type, videoData.file_hash, videoData.thumbnail_hash,
      videoData.local_path, videoData.thumbnail_path, videoData.chat_id,
      videoData.chat_title, videoData.chat_type, videoData.message_id,
      videoData.sender_id, videoData.sender_username, videoData.sender_first_name,
      videoData.sender_last_name, videoData.caption, videoData.date,
      videoData.processed_date, videoData.is_duplicate, videoData.original_video_id,
      videoData.tags, videoData.status, videoData.error_message, now, now
    );
    
    return this.findById(id)!;
  }

  // Buscar video por ID
  findById(id: string): VideoRecord | null {
    const stmt = this.db.prepare('SELECT * FROM videos WHERE id = ?');
    return stmt.get(id) as VideoRecord | null;
  }

  // Buscar video por hash
  findByHash(hash: string): VideoRecord | null {
    const stmt = this.db.prepare('SELECT * FROM videos WHERE file_hash = ?');
    return stmt.get(hash) as VideoRecord | null;
  }

  // Buscar video por file_unique_id de Telegram
  findByFileUniqueId(fileUniqueId: string): VideoRecord | null {
    const stmt = this.db.prepare('SELECT * FROM videos WHERE file_unique_id = ?');
    return stmt.get(fileUniqueId) as VideoRecord | null;
  }

  // Obtener todos los videos con paginación y filtros
  getAllVideos(
    page: number = 1,
    limit: number = 20,
    filters: {
      chatId?: string;
      status?: string;
      isDuplicate?: boolean;
      search?: string;
    } = {}
  ): { videos: VideoRecord[]; total: number } {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.chatId) {
      whereClause += ' AND chat_id = ?';
      params.push(filters.chatId);
    }

    if (filters.status) {
      whereClause += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.isDuplicate !== undefined) {
      whereClause += ' AND is_duplicate = ?';
      params.push(filters.isDuplicate ? 1 : 0);
    }

    if (filters.search) {
      whereClause += ' AND (file_name LIKE ? OR chat_title LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // Contar total
    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM videos ${whereClause}`);
    const total = (countStmt.get(...params) as { count: number }).count;

    // Obtener videos paginados
    const offset = (page - 1) * limit;
    const stmt = this.db.prepare(`
      SELECT * FROM videos ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    const videos = stmt.all(...params, limit, offset) as VideoRecord[];

    return { videos, total };
  }

  // Actualizar estado de video
  updateStatus(id: string, status: VideoRecord['status'], errorMessage?: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE videos 
      SET status = ?, error_message = ?, updated_at = datetime('now') 
      WHERE id = ?
    `);
    const result = stmt.run(status, errorMessage || null, id);
    return result.changes > 0;
  }

  // Marcar como duplicado
  markAsDuplicate(id: string, originalVideoId: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE videos 
      SET is_duplicate = 1, original_video_id = ?, status = 'duplicate', updated_at = datetime('now')
      WHERE id = ?
    `);
    const result = stmt.run(originalVideoId, id);
    return result.changes > 0;
  }

  // Eliminar video
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM videos WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Obtener estadísticas
  getStats(): {
    total: number;
    unique: number;
    duplicates: number;
    totalSize: number;
    averageSize: number;
  } {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM videos');
    const uniqueStmt = this.db.prepare('SELECT COUNT(*) as count FROM videos WHERE is_duplicate = 0');
    const duplicatesStmt = this.db.prepare('SELECT COUNT(*) as count FROM videos WHERE is_duplicate = 1');
    const sizeStmt = this.db.prepare('SELECT COALESCE(SUM(file_size), 0) as size FROM videos WHERE is_duplicate = 0');

    const total = (totalStmt.get() as { count: number }).count;
    const unique = (uniqueStmt.get() as { count: number }).count;
    const duplicates = (duplicatesStmt.get() as { count: number }).count;
    const totalSize = (sizeStmt.get() as { size: number }).size;

    return {
      total,
      unique,
      duplicates,
      totalSize,
      averageSize: unique > 0 ? Math.round(totalSize / unique) : 0
    };
  }

  // Obtener videos por chat
  getVideosByChat(): { chatId: string; chatTitle: string; count: number; totalSize: number }[] {
    const stmt = this.db.prepare(`
      SELECT 
        chat_id as chatId,
        chat_title as chatTitle,
        COUNT(*) as count,
        SUM(file_size) as totalSize
      FROM videos
      WHERE is_duplicate = 0
      GROUP BY chat_id, chat_title
      ORDER BY count DESC
    `);
    return stmt.all() as { chatId: string; chatTitle: string; count: number; totalSize: number }[];
  }

  // Limpiar videos duplicados
  cleanupDuplicates(): { deleted: number } {
    const stmt = this.db.prepare('DELETE FROM videos WHERE is_duplicate = 1');
    const result = stmt.run();
    return { deleted: result.changes };
  }
}

// Exportar instancia singleton
export const videoRepository = new VideoRepository();