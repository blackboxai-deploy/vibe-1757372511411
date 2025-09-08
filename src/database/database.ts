// Configuración de base de datos SQLite
import Database from 'better-sqlite3';
import { initializeDatabase } from './schema';
import path from 'path';
import fs from 'fs-extra';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/videos.db';
    
    // Asegurar que el directorio existe
    const dbDir = path.dirname(dbPath);
    fs.ensureDirSync(dbDir);
    
    // Crear conexión a la base de datos
    db = new Database(dbPath);
    
    // Habilitar claves foráneas
    db.pragma('foreign_keys = ON');
    
    // Configurar modo journal para mejor rendimiento
    db.pragma('journal_mode = WAL');
    
    // Inicializar esquema
    initializeDatabase(db);
    
    console.log(`✅ Base de datos conectada: ${dbPath}`);
  }
  
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('🔒 Conexión a base de datos cerrada');
  }
}

// Función para obtener estadísticas de la base de datos
export function getDatabaseStats() {
  const database = getDatabase();
  
  const totalVideos = database.prepare('SELECT COUNT(*) as count FROM videos').get() as { count: number };
  const uniqueVideos = database.prepare('SELECT COUNT(*) as count FROM videos WHERE is_duplicate = 0').get() as { count: number };
  const duplicates = database.prepare('SELECT COUNT(*) as count FROM videos WHERE is_duplicate = 1').get() as { count: number };
  const totalSize = database.prepare('SELECT COALESCE(SUM(file_size), 0) as size FROM videos WHERE is_duplicate = 0').get() as { size: number };
  const activeChats = database.prepare(`
    SELECT COUNT(DISTINCT chat_id) as count 
    FROM videos 
    WHERE date > datetime('now', '-7 days')
  `).get() as { count: number };

  return {
    total: totalVideos.count,
    unique: uniqueVideos.count,
    duplicates: duplicates.count,
    totalSize: totalSize.size,
    activeChats: activeChats.count
  };
}

// Limpieza elegante al cerrar la aplicación
process.on('SIGINT', () => {
  console.log('🛑 Recibido SIGINT. Cerrando graciosamente...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Recibido SIGTERM. Cerrando graciosamente...');
  closeDatabase();
  process.exit(0);
});

export { db };