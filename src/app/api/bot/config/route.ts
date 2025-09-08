import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener configuración actual del bot
export async function GET() {
  try {
    const config = {
      botToken: process.env.TELEGRAM_BOT_TOKEN ? '***CONFIGURADO***' : '',
      autoStart: process.env.AUTO_START_BOT === 'true',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '100'),
      allowedChats: process.env.ALLOWED_CHATS || '',
      blockedChats: process.env.BLOCKED_CHATS || '',
      enableDuplicateDetection: true,
      storagePath: process.env.STORAGE_PATH || './data/videos'
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching bot config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

// POST - Actualizar configuración del bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // En un entorno real, aquí actualizaríamos las variables de entorno
    // o una base de datos de configuración
    console.log('📝 Configuración recibida:', {
      ...body,
      botToken: body.botToken ? '***OCULTO***' : 'No proporcionado'
    });
    
    // Validaciones básicas
    if (body.maxFileSize && (body.maxFileSize < 1 || body.maxFileSize > 2000)) {
      return NextResponse.json(
        { error: 'El tamaño máximo debe estar entre 1 y 2000 MB' },
        { status: 400 }
      );
    }
    
    // Simular guardado exitoso
    return NextResponse.json({ 
      message: 'Configuración guardada correctamente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error saving bot config:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}