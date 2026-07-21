import jwt from 'jsonwebtoken';

export const JWT_SECRET = 'secreto_super_seguro_soporte_u';

export const sseClients: any[] = [];

export const broadcast = (event: string, data: any) => {
  const payload = JSON.stringify(data);
  sseClients.forEach(client => {
    client.write(`event: ${event}\n`);
    client.write(`data: ${payload}\n\n`);
  });
};

export const authMiddleware = (req: any, res: any, next: any) => {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers.cookie) {
    const cookies = Object.fromEntries(
      req.headers.cookie.split(';').map((c: string) => {
        const parts = c.trim().split('=');
        return [parts[0], parts.slice(1).join('=')];
      })
    );
    token = cookies['token'] || '';
  }

  if (!token) {
    return res.status(401).json({ error: 'No autorizado, token ausente' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
