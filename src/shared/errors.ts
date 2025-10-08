/**
 * Sistema de errores estructurado para la aplicación
 * Mejora el manejo de errores y debugging
 */

export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} no encontrado`, 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string) {
    super(message, 422)
    this.name = 'BusinessLogicError'
  }
}

/**
 * Utility function para crear respuestas de error consistentes
 */
export function createErrorResponse(error: Error) {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        type: error.name,
        statusCode: error.statusCode,
        ...(error instanceof ValidationError && error.field && { field: error.field })
      }
    }
  }

  // Error no controlado
  console.error('Error no manejado:', error)
  return {
    error: {
      message: 'Error interno del servidor',
      type: 'InternalServerError',
      statusCode: 500
    }
  }
}

/**
 * Type guard para verificar si es un error operacional
 */
export function isOperationalError(error: Error): error is AppError {
  return error instanceof AppError && error.isOperational
}
