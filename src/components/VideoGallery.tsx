'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface VideoItem {
  id: string;
  file_name: string;
  file_size: number;
  duration?: number;
  chat_title: string;
  created_at: string;
  is_duplicate: boolean;
  thumbnail_path?: string;
  local_path: string;
  mime_type: string;
  width?: number;
  height?: number;
  status: string;
}

export function VideoGallery() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  
  useEffect(() => {
    // Datos de demostración mientras configuramos las APIs
    const demoVideos: VideoItem[] = [
      {
        id: '1',
        file_name: 'video_tutorial_telegram_bot.mp4',
        file_size: 25600000, // ~25MB
        duration: 180,
        chat_title: 'Grupo de Desarrollo',
        created_at: new Date().toISOString(),
        is_duplicate: false,
        local_path: '/data/videos/video_tutorial.mp4',
        mime_type: 'video/mp4',
        width: 1920,
        height: 1080,
        status: 'completed'
      },
      {
        id: '2',
        file_name: 'presentacion_demo.webm',
        file_size: 15800000, // ~15MB
        duration: 120,
        chat_title: 'Canal de Tutoriales',
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
        is_duplicate: false,
        local_path: '/data/videos/presentacion_demo.webm',
        mime_type: 'video/webm',
        width: 1280,
        height: 720,
        status: 'completed'
      },
      {
        id: '3',
        file_name: 'video_tutorial_telegram_bot_copy.mp4',
        file_size: 25600000, // Mismo tamaño - duplicado
        duration: 180,
        chat_title: 'Respaldos',
        created_at: new Date(Date.now() - 1800000).toISOString(), // 30 min atrás
        is_duplicate: true,
        local_path: '/data/videos/video_tutorial_copy.mp4',
        mime_type: 'video/mp4',
        width: 1920,
        height: 1080,
        status: 'duplicate'
      },
      {
        id: '4',
        file_name: 'screencast_configuracion.mov',
        file_size: 45200000, // ~45MB
        duration: 300,
        chat_title: 'Soporte Técnico',
        created_at: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
        is_duplicate: false,
        local_path: '/data/videos/screencast_config.mov',
        mime_type: 'video/quicktime',
        width: 1920,
        height: 1200,
        status: 'completed'
      }
    ];

    setVideos(demoVideos);
    setLoading(false);
  }, []);

  useEffect(() => {
    filterAndSortVideos();
  }, [videos, searchTerm, filterType, sortBy]);

  const filterAndSortVideos = () => {
    let filtered = [...videos];

    // Aplicar filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.chat_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro de tipo
    switch (filterType) {
      case 'unique':
        filtered = filtered.filter(video => !video.is_duplicate);
        break;
      case 'duplicates':
        filtered = filtered.filter(video => video.is_duplicate);
        break;
      case 'large':
        filtered = filtered.filter(video => video.file_size > 50 * 1024 * 1024); // > 50MB
        break;
    }

    // Aplicar ordenamiento
    switch (sortBy) {
      case 'date':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'size':
        filtered.sort((a, b) => b.file_size - a.file_size);
        break;
      case 'name':
        filtered.sort((a, b) => a.file_name.localeCompare(b.file_name));
        break;
      case 'chat':
        filtered.sort((a, b) => a.chat_title.localeCompare(b.chat_title));
        break;
    }

    setFilteredVideos(filtered);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVideoDelete = async (videoId: string) => {
    try {
      // Simulamos eliminación exitosa
      setVideos(prev => prev.filter(v => v.id !== videoId));
      toast.success('Video eliminado correctamente');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Error al eliminar el video');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="bg-gray-300 h-32 mb-4 rounded"></div>
                <div className="bg-gray-300 h-4 mb-2 rounded"></div>
                <div className="bg-gray-300 h-3 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="text-2xl">🎬</div>
            Videos Recopilados ({filteredVideos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="🔍 Buscar por nombre de archivo o chat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-base"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📂 Todos los videos</SelectItem>
                <SelectItem value="unique">✨ Solo únicos</SelectItem>
                <SelectItem value="duplicates">🔄 Solo duplicados</SelectItem>
                <SelectItem value="large">📏 Archivos grandes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">📅 Fecha de descarga</SelectItem>
                <SelectItem value="size">📊 Tamaño</SelectItem>
                <SelectItem value="name">🔤 Nombre</SelectItem>
                <SelectItem value="chat">💬 Chat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Videos */}
      {filteredVideos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <div className="text-8xl mb-6">🎬</div>
            <h3 className="text-2xl font-semibold mb-4">No se encontraron videos</h3>
            <p className="text-muted-foreground text-center text-lg">
              {videos.length === 0 
                ? 'El bot aún no ha recopilado ningún video. Configura el token y inicia el bot para comenzar.'
                : 'No hay videos que coincidan con los filtros aplicados. Intenta ajustar los criterios de búsqueda.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="video-card group">
              <CardContent className="p-4">
                {/* Video Thumbnail/Preview */}
                <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg mb-4 h-40 flex items-center justify-center overflow-hidden">
                  {video.thumbnail_path ? (
                    <img
                      src={`https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8105a215-3fc0-496f-b2f8-4e0970e3156f.png || '1920'}x${video.height || '1080'}`}
                      alt={`Thumbnail de ${video.file_name}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-6xl text-gray-400">🎬</div>
                  )}
                  
                  {/* Duration Badge */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono">
                      {formatDuration(video.duration)}
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    {video.is_duplicate ? (
                      <Badge variant="destructive" className="text-xs font-medium">
                        🔄 Duplicado
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs font-medium">
                        ✨ Único
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Video Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-base truncate" title={video.file_name}>
                    {video.file_name}
                  </h4>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="font-mono">{formatBytes(video.file_size)}</span>
                    {video.width && video.height && (
                      <span className="font-mono">{video.width}×{video.height}</span>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground truncate" title={video.chat_title}>
                    💬 {video.chat_title}
                  </div>
                  
                  <div className="text-xs text-muted-foreground font-mono">
                    📅 {new Date(video.created_at).toLocaleDateString('es-ES')} {new Date(video.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedVideo(video)}
                      >
                        👁️ Detalles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <div className="text-2xl">📄</div>
                          Detalles del Video
                        </DialogTitle>
                      </DialogHeader>
                      {selectedVideo && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <label className="font-medium">📝 Nombre:</label>
                              <p className="text-muted-foreground break-words">{selectedVideo.file_name}</p>
                            </div>
                            <div>
                              <label className="font-medium">📊 Tamaño:</label>
                              <p className="text-muted-foreground font-mono">{formatBytes(selectedVideo.file_size)}</p>
                            </div>
                            <div>
                              <label className="font-medium">⏱️ Duración:</label>
                              <p className="text-muted-foreground font-mono">{formatDuration(selectedVideo.duration)}</p>
                            </div>
                            <div>
                              <label className="font-medium">📐 Resolución:</label>
                              <p className="text-muted-foreground font-mono">
                                {selectedVideo.width && selectedVideo.height 
                                  ? `${selectedVideo.width}×${selectedVideo.height}` 
                                  : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <label className="font-medium">💬 Chat:</label>
                              <p className="text-muted-foreground">{selectedVideo.chat_title}</p>
                            </div>
                            <div>
                              <label className="font-medium">📅 Descargado:</label>
                              <p className="text-muted-foreground font-mono">
                                {new Date(selectedVideo.created_at).toLocaleString('es-ES')}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <label className="font-medium">🗂️ Tipo MIME:</label>
                              <p className="text-muted-foreground font-mono">{selectedVideo.mime_type}</p>
                            </div>
                            <div>
                              <label className="font-medium">📍 Estado:</label>
                              <Badge variant={selectedVideo.is_duplicate ? 'destructive' : 'default'}>
                                {selectedVideo.is_duplicate ? '🔄 Duplicado' : '✨ Único'}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <label className="font-medium">📁 Ruta:</label>
                            <p className="text-muted-foreground font-mono text-xs break-all bg-gray-100 dark:bg-gray-800 p-2 rounded">
                              {selectedVideo.local_path}
                            </p>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleVideoDelete(video.id)}
                  >
                    🗑️
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}