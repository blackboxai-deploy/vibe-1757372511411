import { NextResponse } from 'next/server';

// POST - Iniciar el bot de Telegram
export async function POST() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken || botToken === 'your_bot_token_here') {
      return NextResponse.json(
        { error: 'Token del bot no configurado. Configura TELEGRAM_BOT_TOKEN en .env.local' },
        { status: 400 }
      );
    }
    
    // En desarrollo, simplemente actualizamos la variable de entorno
    // En producción, aquí iniciaríamos el proceso del bot
    process.env.BOT_RUNNING = 'true';
    process.env.BOT_START_TIME = Date.now().toString();
    
    console.log('🤖 Bot de Telegram iniciado:', {
      token: botToken.substring(0, 10) + '...',
      startTime: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      message: 'Bot iniciado correctamente',
      status: 'running',
      startTime: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error starting bot:', error);
    return NextResponse.json(
      { error: 'Failed to start bot' },
      { status: 500 }
    );
  }
}