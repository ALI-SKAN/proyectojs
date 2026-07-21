import mongoose from 'mongoose';
import { createClient } from 'redis';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createTursoClient } from '@libsql/client';
import { neon } from '@neondatabase/serverless';
import cassandra from 'cassandra-driver';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { setMemoryMode, seedMemory } from '../models/Consulta';

// Configuración de MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/proyectoIntegralDB';

// No dejar que las operaciones queden colgadas si Mongo no está conectado
mongoose.set('bufferCommands', false);

/** Carga las consultas iniciales desde backend/db.json (para el modo en memoria). */
function cargarSemilla(): any[] {
  try {
    const dir = dirname(fileURLToPath(import.meta.url)); // .../backend/src/config
    const raw = readFileSync(join(dir, '..', '..', 'db.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : (parsed.consultas || []);
  } catch {
    return [];
  }
}

export const connectMongo = async () => {
  try {
    // Timeout corto: si no hay Mongo, no esperamos 30s, pasamos a memoria rápido.
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    setMemoryMode(false);
    console.log(`📦 Conectado a MongoDB en ${MONGO_URI}`);
  } catch (err: any) {
    setMemoryMode(true);
    const semilla = cargarSemilla();
    seedMemory(semilla);
    console.warn('⚠️  MongoDB no disponible → usando ALMACENAMIENTO EN MEMORIA.');
    console.warn(`   Los datos se reinician al reiniciar el servidor (${semilla.length} consulta(s) precargada(s)).`);
    console.warn(`   Detalle: ${err.message}`);
  }
};

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) return new Error('Max retries reached');
      return 1000; // retry after 1 sec
    }
  }
});

redisClient.on('error', (err) => console.log('⚠️ Aviso: Redis no disponible.'));

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log(`🚀 Conectado a Redis en ${process.env.REDIS_URL || 'redis://127.0.0.1:6379'}`);
  } catch (err: any) {
    console.error('❌ Error conectando a Redis:', err.message);
  }
};

// Configuración de Supabase (PostgreSQL para Auth y Usuarios)
const supabaseUrl = process.env.SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'public-anon-key';
export const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

// Configuración de Turso (Edge SQLite para Catálogos Estáticos)
const tursoUrl = process.env.TURSO_URL || 'libsql://my-db.turso.io';
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN || 'dummy-token';
export const turso = createTursoClient({
  url: tursoUrl,
  authToken: tursoAuthToken
});

// Configuración de Neon Database (Serverless PostgreSQL para Logs y Analíticas)
const neonUrl = process.env.NEON_DB_URL || 'postgresql://user:pass@ep-restless-lake.eu-central-1.aws.neon.tech/neondb';
export const neonSql = neon(neonUrl);

// Configuración de Cassandra (Big Data / Series Temporales)
export const cassandraClient = new cassandra.Client({
  contactPoints: [process.env.CASSANDRA_HOST || '127.0.0.1'],
  localDataCenter: process.env.CASSANDRA_DATACENTER || 'datacenter1',
  keyspace: process.env.CASSANDRA_KEYSPACE || 'proyecto_java'
});

export const connectCassandra = async () => {
  try {
    await cassandraClient.connect();
    console.log(`🗄️ Conectado a Cassandra en ${process.env.CASSANDRA_HOST || '127.0.0.1'}`);
  } catch (err: any) {
    console.error('❌ Error conectando a Cassandra:', err.message);
  }
};

// Función principal de conexión a múltiples bases de datos
export const connectDatabases = async () => {
  await Promise.all([connectMongo(), connectRedis(), connectCassandra()]);
  console.log(`☁️ Supabase cliente inicializado (${supabaseUrl})`);
  console.log(`⚡ Turso cliente inicializado (${tursoUrl})`);
  console.log(`📊 Neon Database cliente inicializado`);
};
