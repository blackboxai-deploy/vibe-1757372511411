import { NextResponse } from 'next/server';

// POST - Detener el bot de Telegram
export async function POST() {
  try {
    // Actualizar estado del bot
    process.env.BOT_RUNNING = 'false';
    delete process.env.BOT_START_TIME;
    
    console.log('🛑 Bot de Telegram detenido:', {
      stopTime: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      message: 'Bot detenido correctamente',
      status: 'stopped',
      stopTime: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error stopping bot:', error);
    return NextResponse.json(
      { error: 'Failed to stop bot' },
      { status: 500 }
    );
  }
}