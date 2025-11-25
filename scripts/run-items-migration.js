// Script para ejecutar migraciones de items
// Ejecutar con: node scripts/run-items-migration.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = 'https://qudxsciydyynimvpbgfm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1ZHhzY2l5ZHl5bmltdnBiZ2ZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkyODQ4NSwiZXhwIjoyMDc1NTA0NDg1fQ.72Eh8yqG14kSj--4G3p8OolBBFCkd3wEoDEnNSLtJCQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSqlFile(fileName, description) {
  console.log(`\n🔄 Ejecutando: ${description}`);
  console.log(`📄 Archivo: ${fileName}\n`);

  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'supabase', fileName);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Separar las consultas por punto y coma y ejecutar una por una
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--') && !q.startsWith('COMMENT'));

    for (const query of queries) {
      if (query.includes('COMMENT ON')) continue;
      
      const { error } = await supabase.rpc('query', { query_text: query });
      
      if (error) {
        console.error('❌ Error ejecutando query:', error.message);
        console.error('Query:', query.substring(0, 100) + '...');
        return false;
      }
    }

    console.log('✅ Migración ejecutada exitosamente');
    return true;
  } catch (err) {
    console.error('❌ Error al leer o ejecutar el archivo:', err.message);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     MIGRACIÓN: SISTEMA DE ITEMS               ║');
  console.log('╚════════════════════════════════════════════════╝');

  // Paso 1: Crear tabla gu_items
  const step1 = await executeSqlFile('migration_items.sql', 'Crear tabla gu_items');
  if (!step1) {
    console.log('\n⚠️  Abortando migración debido a errores');
    process.exit(1);
  }

  // Paso 2: Agregar item_id a líneas de OC
  const step2 = await executeSqlFile('migration_items_lineas_oc.sql', 'Agregar item_id a líneas de OC');
  if (!step2) {
    console.log('\n⚠️  Abortando migración debido a errores');
    process.exit(1);
  }

  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE        ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('\nCambios realizados:');
  console.log('  • Tabla gu_items creada');
  console.log('  • Relación item_id agregada a gu_lineasdeordenesdecompra');
  console.log('  • Índices creados para optimización');
  console.log('  • Trigger de updated_at configurado');
}

main();
