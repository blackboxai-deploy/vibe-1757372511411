// Esquemas de base de datos para el Bot de Telegram
import Database from 'better-sqlite3';

// SQL para crear tablas
export const createTablesSQL = {
  videos: `
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      file_unique_id TEXT UNIQUE NOT NULL,
      file_name TEXT,
      file_size INTEGER NOT NULL,
      duration INTEGER,
      width INTEGER,
      height INTEGER,
      mime_type TEXT,
      file_hash TEXT NOT NULL,
      thumbnail_hash TEXT,
      local_path TEXT NOT NULL,
      thumbnail_path TEXT,
      chat_id TEXT NOT NULL,
      chat_title TEXT,
      chat_type TEXT NOT NULL,
      message_id INTEGER NOT NULL,
      sender_id INTEGER,
      sender_username TEXT,
      sender_first_name TEXT,
      sender_last_name TEXT,
      caption TEXT,
      date TEXT NOT NULL,
      processed_date TEXT NOT NULL,
      is_duplicate BOOLEAN DEFAULT FALSE,
      original_video_id TEXT,
      tags TEXT DEFAULT '[]',
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error', 'duplicate')),
      error_message TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (original_video_id) REFERENCES videos(id)
    )
  `,
  
  bot_config: `
    CREATE TABLE IF NOT EXISTS bot_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `,
  
  chat_settings: `
    CREATE TABLE IF NOT EXISTS chat_settings (
      chat_id TEXT PRIMARY KEY,
      chat_title TEXT,
      chat_type TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      is_whitelisted BOOLEAN DEFAULT FALSE,
      is_blacklisted BOOLEAN DEFAULT FALSE,
      auto_download BOOLEAN DEFAULT TRUE,
      max_file_size_mb INTEGER DEFAULT 100,
      allowed_formats TEXT DEFAULT '["mp4","avi","mov","wmv","flv","webm","mkv"]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `,
  
  bot_stats: `
    CREATE TABLE IF NOT EXISTS bot_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      total_messages INTEGER DEFAULT 0,
      videos_detected INTEGER DEFAULT 0,
      videos_downloaded INTEGER DEFAULT 0,
      duplicates_found INTEGER DEFAULT 0,
      errors_count INTEGER DEFAULT 0,
      storage_used_bytes INTEGER DEFAULT 0,
      unique_chats INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `
};

// Índices para mejor rendimiento
export const createIndexesSQL = [
  'CREATE INDEX IF NOT EXISTS idx_videos_file_hash ON videos(file_hash)',
  'CREATE INDEX IF NOT EXISTS idx_videos_file_unique_id ON videos(file_unique_id)',
  'CREATE INDEX IF NOT EXISTS idx_videos_chat_id ON videos(chat_id)',
  'CREATE INDEX IF NOT EXISTS idx_videos_date ON videos(date)',
  'CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status)',
  'CREATE INDEX IF NOT EXISTS idx_videos_is_duplicate ON videos(is_duplicate)',
  'CREATE INDEX IF NOT EXISTS idx_chat_settings_is_active ON chat_settings(is_active)',
  'CREATE INDEX IF NOT EXISTS idx_bot_stats_date ON bot_stats(date)'
];

// Configuración por defecto del bot
export const defaultBotConfig = [
  { key: 'bot_active', value: 'true', description: 'Estado activo del bot' },
  { key: 'max_file_size_mb', value: '100', description: 'Tamaño máximo de archivo en MB' },
  { key: 'allowed_formats', value: '["mp4","avi","mov","wmv","flv","webm","mkv"]', description: 'Formatos de video permitidos' },
  { key: 'enable_duplicate_detection', value: 'true', description: 'Habilitar detección de duplicados' },
  { key: 'auto_delete_duplicates', value: 'false', description: 'Eliminar automáticamente duplicados' },
  { key: 'enable_thumbnails', value: 'true', description: 'Generar miniaturas de videos' },
  { key: 'storage_path', value: './data/videos', description: 'Ruta de almacenamiento de videos' },
  { key: 'temp_path', value: './data/temp', description: 'Ruta de archivos temporales' }
];

// Función para inicializar la base de datos
export function initializeDatabase(db: Database.Database) {
  console.log('🔧 Inicializando base de datos...');
  
  // Crear tablas
  Object.values(createTablesSQL).forEach(sql => {
    db.exec(sql);
  });
  
  // Crear índices
  createIndexesSQL.forEach(sql => {
    db.exec(sql);
  });
  
  // Insertar configuración por defecto si no existe
  const insertConfig = db.prepare(`
    INSERT OR IGNORE INTO bot_config (key, value, description) 
    VALUES (?, ?, ?)
  `);
  
  defaultBotConfig.forEach(config => {
    insertConfig.run(config.key, config.value, config.description);
  });
  
  // Crear triggers para updated_at
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS videos_updated_at 
    AFTER UPDATE ON videos
    BEGIN
      UPDATE videos SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);
  
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS chat_settings_updated_at 
    AFTER UPDATE ON chat_settings
    BEGIN
      UPDATE chat_settings SET updated_at = datetime('now') WHERE chat_id = NEW.chat_id;
    END;
  `);
  
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS bot_config_updated_at 
    AFTER UPDATE ON bot_config
    BEGIN
      UPDATE bot_config SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);
  
  console.log('✅ Base de datos inicializada correctamente');
}