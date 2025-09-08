'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { VideoGallery } from '@/components/VideoGallery';

interface DashboardStats {
  isRunning: boolean;
  totalVideos: number;
  uniqueVideos: number;
  duplicatesFound: number;
  totalSize: number;
  activeChats: number;
  uptime: number;
  lastActivity?: string;
}

interface BotConfig {
  botToken: string;
  autoStart: boolean;
  maxFileSize: number;
  allowedChats: string;
  blockedChats: string;
  enableDuplicateDetection: boolean;
  storagePath: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    isRunning: false,
    totalVideos: 25,
    uniqueVideos: 18,
    duplicatesFound: 7,
    totalSize: 157286400, // ~150MB
    activeChats: 3,
    uptime: 3600
  });
  
  const [config, setConfig] = useState<BotConfig>({
    botToken: '',
    autoStart: true,
    maxFileSize: 100,
    allowedChats: '',
    blockedChats: '',
    enableDuplicateDetection: true,
    storagePath: './data/videos'
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchStats();
    fetchConfig();
    const interval = setInterval(fetchStats, 10000); // Actualizar cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/bot/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleBotToggle = async () => {
    setLoading(true);
    try {
      const action = stats.isRunning ? 'stop' : 'start';
      const response = await fetch(`/api/bot/${action}`, { method: 'POST' });
      
      if (response.ok) {
        toast.success(`Bot ${action === 'start' ? 'iniciado' : 'detenido'} correctamente`);
        fetchStats();
      } else {
        throw new Error('Failed to toggle bot');
      }
    } catch (error) {
      toast.error(`Error al ${stats.isRunning ? 'detener' : 'iniciar'} el bot`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        toast.success('Configuración guardada correctamente');
        fetchConfig();
      } else {
        throw new Error('Failed to save config');
      }
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const duplicateRate = stats.totalVideos > 0 ? ((stats.duplicatesFound / stats.totalVideos) * 100).toFixed(1) : '0';
  const uniqueRate = stats.totalVideos > 0 ? ((stats.uniqueVideos / stats.totalVideos) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🤖 Telegram Video Bot
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Sistema automatizado de recopilación y gestión de videos con detección de duplicados
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
              <div className={`w-3 h-3 rounded-full ${stats.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">
                {stats.isRunning ? 'Bot Activo' : 'Bot Inactivo'}
              </span>
            </div>
            <Button 
              onClick={handleBotToggle}
              variant={stats.isRunning ? 'destructive' : 'default'}
              disabled={loading}
              className="font-medium"
            >
              {loading ? 'Procesando...' : (stats.isRunning ? '⏹ Detener Bot' : '▶ Iniciar Bot')}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="dashboard" className="font-medium">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="videos" className="font-medium">🎬 Videos</TabsTrigger>
            <TabsTrigger value="config" className="font-medium">⚙️ Configuración</TabsTrigger>
            <TabsTrigger value="stats" className="font-medium">📈 Estadísticas</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Grid */}
            <div className="stats-grid">
              <Card className="bot-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Videos Totales</CardTitle>
                  <div className="text-2xl">🎥</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalVideos}</div>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                    {stats.uniqueVideos} únicos • {duplicateRate}% duplicados
                  </p>
                </CardContent>
              </Card>

              <Card className="video-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Videos Únicos</CardTitle>
                  <div className="text-2xl">✨</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.uniqueVideos}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {uniqueRate}% del total
                  </p>
                </CardContent>
              </Card>

              <Card className="video-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Duplicados</CardTitle>
                  <div className="text-2xl">🔄</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{stats.duplicatesFound}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Detectados automáticamente
                  </p>
                </CardContent>
              </Card>

              <Card className="video-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
                  <div className="text-2xl">💾</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{formatBytes(stats.totalSize)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.activeChats} chats activos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Bot Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="text-2xl">🤖</div>
                  Estado del Bot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div>
                    <p className="font-semibold text-lg">Estado Actual:</p>
                    <p className="text-muted-foreground">
                      {stats.isRunning 
                        ? `🟢 Activo desde hace ${formatUptime(stats.uptime)}` 
                        : '🔴 Detenido - Esperando comando de inicio'
                      }
                    </p>
                    {stats.lastActivity && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Última actividad: {new Date(stats.lastActivity).toLocaleString('es-ES')}
                      </p>
                    )}
                  </div>
                  <Badge 
                    variant={stats.isRunning ? 'default' : 'secondary'}
                    className="text-lg px-4 py-2"
                  >
                    {stats.isRunning ? 'ONLINE' : 'OFFLINE'}
                  </Badge>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" size="sm" className="w-full">
                    📊 Ver Logs
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    🧹 Limpiar Duplicados
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    💾 Backup BD
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    🔄 Reiniciar Bot
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <VideoGallery />
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="text-2xl">⚙️</div>
                  Configuración del Bot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="botToken" className="text-base font-medium">🔑 Token del Bot</Label>
                  <Input
                    id="botToken"
                    type="password"
                    value={config.botToken}
                    onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Obtén tu token desde @BotFather en Telegram
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoStart"
                    checked={config.autoStart}
                    onCheckedChange={(checked) => setConfig({ ...config, autoStart: checked })}
                  />
                  <Label htmlFor="autoStart" className="text-base">🚀 Iniciar automáticamente</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxFileSize" className="text-base font-medium">📏 Tamaño máximo de archivo (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    min="1"
                    max="2000"
                    value={config.maxFileSize}
                    onChange={(e) => setConfig({ ...config, maxFileSize: parseInt(e.target.value) || 100 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowedChats" className="text-base font-medium">✅ Chats permitidos</Label>
                  <Textarea
                    id="allowedChats"
                    value={config.allowedChats}
                    onChange={(e) => setConfig({ ...config, allowedChats: e.target.value })}
                    placeholder="-1001234567890, -1009876543210"
                    className="font-mono"
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    IDs de chats separados por comas. Dejar vacío para permitir todos.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blockedChats" className="text-base font-medium">❌ Chats bloqueados</Label>
                  <Textarea
                    id="blockedChats"
                    value={config.blockedChats}
                    onChange={(e) => setConfig({ ...config, blockedChats: e.target.value })}
                    placeholder="-1001111111111, -1002222222222"
                    className="font-mono"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableDuplicateDetection"
                    checked={config.enableDuplicateDetection}
                    onCheckedChange={(checked) => setConfig({ ...config, enableDuplicateDetection: checked })}
                  />
                  <Label htmlFor="enableDuplicateDetection" className="text-base">🔍 Detectar duplicados automáticamente</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storagePath" className="text-base font-medium">📁 Ruta de almacenamiento</Label>
                  <Input
                    id="storagePath"
                    value={config.storagePath}
                    onChange={(e) => setConfig({ ...config, storagePath: e.target.value })}
                    className="font-mono"
                  />
                </div>

                <Button 
                  onClick={handleConfigSave} 
                  className="w-full text-lg py-6"
                  disabled={loading}
                >
                  {loading ? '💾 Guardando...' : '💾 Guardar Configuración'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="text-2xl">📈</div>
                  Estadísticas Detalladas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-2xl font-semibold mb-2">Estadísticas Avanzadas</h3>
                  <p className="text-muted-foreground">
                    Próximamente: Gráficos detallados, tendencias y análisis avanzado
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}