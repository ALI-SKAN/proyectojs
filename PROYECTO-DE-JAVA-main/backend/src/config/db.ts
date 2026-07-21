import mongoose from 'mongoose';
import { createClient } from 'redis';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createTursoClient } from '@libsql/client';
import { neon } from '@neondatabase/serverless';
import cassandra from 'cassandra-driver';

// Configuración de MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/proyectoIntegralDB';

export const connectMongo = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`📦 Conectado a MongoDB en ${MONGO_URI}`);
  } catch (err: any) {
    console.error('❌ Error conectando a MongoDB:', err.message);
    process.exit(1);
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
