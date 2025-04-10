const BaseModel = require('./BaseModel');
const { query } = require('../config/database');
const OrdenCompra = require('./OrdenCompra');

/**
 * Modelo para la gestión de líneas de órdenes de compra
 */
class LineaOrdenCompra extends BaseModel {
  constructor() {
    super();
    this.tableName = 'lineas_ordenes_compra';
    this.fillable = [
      'orden_compra_id', 'numero', 'tipo', 'titulo', 'unidad', 
      'cantidad', 'precio_unitario', 'iva', 'subtotal', 
      'observaciones', 'estado'
    ];
  }

  /**
   * Crea una nueva línea de orden de compra con número autogenerado
   * @param {Object} data - Datos de la línea
   * @returns {Promise<Object>} - Línea creada
   */
  async create(data) {
    // Generar el número de línea
    const numeroLinea = await this.generarNumeroLinea(data.orden_compra_id);
    data.numero = numeroLinea;
    
    // Calcular el subtotal
    const subtotal = this.calcularSubtotal(
      data.cantidad, 
      data.precio_unitario, 
      data.iva
    );
    data.subtotal = subtotal;
    
    // Obtener el estado de la orden de compra para asignar el mismo a la línea
    const ordenCompra = await OrdenCompra.findById(data.orden_compra_id);
    data.estado = ordenCompra.estado;
    
    // Crear la línea
    const lineaCreada = await super.create(data);
    
    // Actualizar el monto total de la orden de compra
    await OrdenCompra.actualizarMontoTotal(data.orden_compra_id);
    
    return lineaCreada;
  }

  /**
   * Actualiza una línea existente y recalcula totales
   * @param {number} id - ID de la línea
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} - Línea actualizada
   */
  async update(id, data) {
    // Si se actualizan los valores que afectan al subtotal, recalcular
    if (data.cantidad !== undefined || data.precio_unitario !== undefined || data.iva !== undefined) {
      // Obtener los datos actuales de la línea
      const lineaActual = await this.findById(id);
      
      // Usar los nuevos valores o los actuales si no se proporcionan
      const cantidad = data.cantidad !== undefined ? data.cantidad : lineaActual.cantidad;
      const precioUnitario = data.precio_unitario !== undefined ? data.precio_unitario : lineaActual.precio_unitario;
      const iva = data.iva !== undefined ? data.iva : lineaActual.iva;
      
      // Calcular el nuevo subtotal
      data.subtotal = this.calcularSubtotal(cantidad, precioUnitario, iva);
    }
    
    // Actualizar la línea
    const lineaActualizada = await super.update(id, data);
    
    // Actualizar el monto total de la orden de compra
    await OrdenCompra.actualizarMontoTotal(lineaActualizada.orden_compra_id);
    
    return lineaActualizada;
  }

  /**
   * Genera un número único para la línea de orden de compra
   * @param {number} ordenCompraId - ID de la orden de compra
   * @returns {Promise<string>} - Número generado (formato: OC-XXX.YY)
   */
  async generarNumeroLinea(ordenCompraId) {
    // Obtener el número de orden
    const ordenCompra = await OrdenCompra.findById(ordenCompraId);
    
    if (!ordenCompra) {
      throw new Error('Orden de compra no encontrada');
    }
    
    // Contar las líneas existentes para esta orden
    const sql = 'SELECT COUNT(*) as total FROM lineas_ordenes_compra WHERE orden_compra_id = ?';
    const result = await query(sql, [ordenCompraId]);
    const total = result[0].total;
    
    // Formato: OC-XXX.YY (donde YY es el número de línea)
    return `${ordenCompra.numero}.${total + 1}`;
  }

  /**
   * Calcula el subtotal de una línea
   * @param {number} cantidad - Cantidad de unidades
   * @param {number} precioUnitario - Precio por unidad
   * @param {number} iva - Porcentaje de IVA
   * @returns {number} - Subtotal calculado
   */
  calcularSubtotal(cantidad, precioUnitario, iva) {
    const subtotalSinIva = cantidad * precioUnitario;
    const valorIva = subtotalSinIva * (iva / 100);
    return subtotalSinIva + valorIva;
  }

  /**
   * Obtiene todas las líneas de una orden de compra
   * @param {number} ordenCompraId - ID de la orden de compra
   * @returns {Promise<Array>} - Lista de líneas
   */
  async findByOrdenCompra(ordenCompraId) {
    return await this.findWhere('orden_compra_id = ?', [ordenCompraId]);
  }

  /**
   * Elimina una línea y actualiza el total de la orden (solo disponible en estado borrador)
   * @param {number} id - ID de la línea
   * @param {number} ordenCompraId - ID de la orden a la que pertenece
   * @returns {Promise<boolean>} - Resultado de la operación
   */
  async eliminar(id, ordenCompraId) {
    // Verificar que la orden esté en estado borrador
    const ordenCompra = await OrdenCompra.findById(ordenCompraId);
    
    if (!ordenCompra || ordenCompra.estado !== 'borrador') {
      throw new Error('Solo se pueden eliminar líneas de órdenes en estado borrador');
    }
    
    // Eliminar la línea
    const resultado = await super.delete(id);
    
    // Actualizar el monto total de la orden
    if (resultado) {
      await OrdenCompra.actualizarMontoTotal(ordenCompraId);
    }
    
    return resultado;
  }
}

module.exports = new LineaOrdenCompra();