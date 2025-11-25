// Script simple para ejecutar migraciones SQL en Supabase
// Ejecutar con: node scripts/run-items-migration-simple.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://qudxsciydyynimvpbgfm.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1ZHhzY2l5ZHl5bmltdnBiZ2ZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkyODQ4NSwiZXhwIjoyMDc1NTA0NDg1fQ.72Eh8yqG14kSj--4G3p8OolBBFCkd3wEoDEnNSLtJCQ';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     MIGRACIÓN: SISTEMA DE ITEMS               ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Leer el archivo de migración de items
  console.log('📄 Leyendo migration_items.sql...');
  const migration1Path = path.join(__dirname, '..', 'supabase', 'migration_items.sql');
  const migration1Sql = fs.readFileSync(migration1Path, 'utf8');

  console.log('🔄 Ejecutando migración de tabla gu_items...');
  console.log('   Esto creará:');
  console.log('   • Tabla gu_items con todos sus campos');
  console.log('   • Índices para búsquedas optimizadas');
  console.log('   • Trigger para updated_at automático\n');

  // Leer el archivo de migración de líneas OC
  console.log('📄 Leyendo migration_items_lineas_oc.sql...');
  const migration2Path = path.join(__dirname, '..', 'supabase', 'migration_items_lineas_oc.sql');
  const migration2Sql = fs.readFileSync(migration2Path, 'utf8');

  console.log('🔄 Ejecutando migración de item_id en líneas OC...');
  console.log('   Esto agregará:');
  console.log('   • Columna item_id a gu_lineasdeordenesdecompra');
  console.log('   • Foreign key constraint');
  console.log('   • Índice para optimizar joins\n');

  console.log('═══════════════════════════════════════════════════');
  console.log('IMPORTANTE: Ejecuta estos SQL manualmente en Supabase');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('1. Ve a: https://supabase.com/dashboard/project/qudxsciydyynimvpbgfm/editor');
  console.log('2. Abre el SQL Editor');
  console.log('3. Copia y ejecuta primero: supabase/migration_items.sql');
  console.log('4. Luego ejecuta: supabase/migration_items_lineas_oc.sql\n');

  console.log('📋 Los archivos están listos en:');
  console.log(`   ${migration1Path}`);
  console.log(`   ${migration2Path}\n`);
}

main().catch(console.error);
