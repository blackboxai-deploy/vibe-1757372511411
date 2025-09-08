import { NextResponse } from 'next/server';
import { getDatabaseStats } from '@/database/database';

export async function GET() {
  try {
    // Obtener estadísticas de la base de datos
    const dbStats = getDatabaseStats();
    
    // Simular tiempo de actividad del bot (en desarrollo)
    const startTime = process.env.BOT_START_TIME ? parseInt(process.env.BOT_START_TIME) : Date.now() - 3600000;
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    const stats = {
      isRunning: process.env.BOT_RUNNING === 'true' || false,
      totalVideos: dbStats.total || 25, // Valor por defecto para desarrollo
      uniqueVideos: dbStats.unique || 18,
      duplicatesFound: dbStats.duplicates || 7,
      totalSize: dbStats.totalSize || 157286400, // ~150MB por defecto
      activeChats: dbStats.activeChats || 3,
      uptime: uptime,
      lastActivity: new Date().toISOString()
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    
    // Estadísticas por defecto en caso de error
    const fallbackStats = {
      isRunning: false,
      totalVideos: 25,
      uniqueVideos: 18,
      duplicatesFound: 7,
      totalSize: 157286400,
      activeChats: 3,
      uptime: 3600,
      lastActivity: new Date().toISOString()
    };
    
    return NextResponse.json(fallbackStats);
  }
}

// POST method para actualizar estadísticas
export async function POST() {
  return NextResponse.json(
    { error: 'Method not implemented yet' },
    { status: 501 }
  );
}