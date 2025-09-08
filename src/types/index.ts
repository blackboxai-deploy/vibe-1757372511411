// Tipos principales del bot de Telegram
export interface VideoRecord {
  id: string;
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  file_size: number;
  duration?: number;
  width?: number;
  height?: number;
  mime_type?: string;
  file_hash: string;
  thumbnail_hash?: string;
  local_path: string;
  thumbnail_path?: string;
  chat_id: string;
  chat_title?: string;
  chat_type: string;
  message_id: number;
  sender_id?: number;
  sender_username?: string;
  sender_first_name?: string;
  sender_last_name?: string;
  caption?: string;
  date: string;
  processed_date: string;
  is_duplicate: boolean;
  original_video_id?: string;
  tags?: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'duplicate';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface BotConfig {
  id: number;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

export interface ChatSettings {
  chat_id: string;
  chat_title?: string;
  chat_type: string;
  is_active: boolean;
  is_whitelisted: boolean;
  is_blacklisted: boolean;
  auto_download: boolean;
  max_file_size_mb: number;
  allowed_formats?: string;
  created_at: string;
  updated_at: string;
}

export interface BotStats {
  id: number;
  date: string;
  total_messages: number;
  videos_detected: number;
  videos_downloaded: number;
  duplicates_found: number;
  errors_count: number;
  storage_used_bytes: number;
  unique_chats: number;
  created_at: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    username?: string;
    first_name: string;
    last_name?: string;
  };
  chat: {
    id: number;
    title?: string;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    username?: string;
  };
  date: number;
  video?: {
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    duration: number;
    file_size?: number;
    mime_type?: string;
    file_name?: string;
  };
  document?: {
    file_id: string;
    file_unique_id: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
  };
  caption?: string;
  text?: string;
}

export interface VideoStats {
  total: number;
  unique: number;
  duplicates: number;
  totalSize: number;
  averageSize: number;
  totalDuration: number;
  chatsActive: number;
  downloadsToday: number;
}

export interface DashboardStats {
  isRunning: boolean;
  totalVideos: number;
  uniqueVideos: number;
  duplicatesFound: number;
  totalSize: number;
  activeChats: number;
  uptime: number;
  lastActivity?: string;
}