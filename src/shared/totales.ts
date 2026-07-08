// La DB NO mantiene los totales de línea ni de cabecera (contrato 2026-07-07,
// "la app SÍ calcula y escribe"): los calcula la app. Puras a propósito → testeables sin DB.
// La excepción son las líneas de certificación, cuyos totales deriva fn_lce_derive.
//
// ponytail: number/float, no decimal.js. Con 2 decimales y montos de obra alcanza; si algún
// día hay que cerrar contra contabilidad al centavo, pasar a bigint de centavos.

const r2 = (n: number) => Math.round(n * 100) / 100

export function totalesDeLinea(cantidad: number, precioUnitario: number, ivaPorcentaje: number) {
  const total_neto = r2(cantidad * precioUnitario)
  return { total_neto, total_con_iva: r2(total_neto * (1 + ivaPorcentaje / 100)) }
}

// Number() explícito: los `numeric` de Postgres llegan como string por supabase-js.
export function totalesDeCabecera(lineas: { total_neto: number; total_con_iva: number }[]) {
  const total_neto = r2(lineas.reduce((a, l) => a + Number(l.total_neto), 0))
  const total_con_iva = r2(lineas.reduce((a, l) => a + Number(l.total_con_iva), 0))
  return { total_neto, total_iva: r2(total_con_iva - total_neto), total_con_iva }
}
