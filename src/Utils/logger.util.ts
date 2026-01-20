import winston from 'winston'
import { getTraceMetadata } from './trace.util.js'
import { LOG_LEVEL, APP_NAME  } from "../config/properties.js"

// Get environment variables
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// Custom format to include trace context in logs
const traceFormat = winston.format((info) => {
  const traceMetadata = getTraceMetadata()
  
  // Add trace metadata to log entry
  if (traceMetadata && Object.keys(traceMetadata).length > 0) {
    info.trace = traceMetadata
  }
  
  return info
})

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    traceFormat(), // Add trace context to all logs
    winston.format.json()
  ),
  defaultMeta: { service: APP_NAME },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
})

// If we're not in production, log to the console as well
if (!IS_PRODUCTION) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        traceFormat(),
        winston.format.printf(({ level, message, timestamp, trace, ...meta }) => {
          let output = `${timestamp} [${level}]: ${message}`
          
          // Add trace info to console output for better visibility
          if (trace && typeof trace === 'object' && 'traceId' in trace) {
            output += ` [trace:${trace.traceId}]`
            if ('spanId' in trace) {
              output += ` [span:${trace.spanId}]`
            }
          }
          
          // Add other metadata
          if (Object.keys(meta).length > 0) {
            output += ` ${JSON.stringify(meta)}`
          }
          
          return output
        })
      )
    })
  )
}

/**
 * Safely serializes an error object to avoid circular reference issues
 * @param error The error to serialize
 * @returns Safe error object with message and stack
 */
const safeSerializeError = (error: unknown): { error: string; stack?: string } => {
  if (error instanceof Error) {
    return {
      error: error.message,
      ...(error.stack && { stack: error.stack })
    }
  }
  
  // Handle non-Error objects
  try {
    return {
      error: String(error)
    }
  } catch {
    return {
      error: 'Unknown error occurred'
    }
  }
}

// Enhanced logger with trace-aware methods
class TracedLogger {
  private readonly winston: winston.Logger

  constructor(winstonLogger: winston.Logger) {
    this.winston = winstonLogger
  }

  error(message: string, meta?: any): void {
    const traceMetadata = getTraceMetadata()
    let payload = meta

    // If an Error is passed directly, serialize it
    if (meta instanceof Error) {
      payload = {
        error: meta.message,
        stack: meta.stack
      }
    } else if (meta !== undefined && meta !== null) {
      // If error is nested under meta.error and is an Error, serialize it
      if (meta.error instanceof Error) {
        const { error, ...rest } = meta
        payload = {
          ...rest,
          error: error.message,
          stack: error.stack
        }
      }
    }

    this.winston.error(message, { ...payload, ...traceMetadata })
  }

  /**
   * Safely logs an error with proper serialization to avoid circular references
   * @param message Error message
   * @param error The error object to log
   * @param meta Additional metadata
   */
  safeError(message: string, error: unknown, meta?: any): void {
    const traceMetadata = getTraceMetadata()
    const safeError = safeSerializeError(error)
    this.winston.error(message, { ...meta, ...safeError, ...traceMetadata })
  }

  warn(message: string, meta?: any): void {
    const traceMetadata = getTraceMetadata()
    this.winston.warn(message, { ...meta, ...traceMetadata })
  }

  info(message: string, meta?: any): void {
    const traceMetadata = getTraceMetadata()
    this.winston.info(message, { ...meta, ...traceMetadata })
  }

  debug(message: string, meta?: any): void {
    const traceMetadata = getTraceMetadata()
    this.winston.debug(message, { ...meta, ...traceMetadata })
  }

  startOperation(operationName: string, meta?: any): void {
    const traceMetadata = getTraceMetadata()
    this.winston.info(`Starting operation: ${operationName}`, {
      ...meta,
      ...traceMetadata,
      operationName,
      operationStatus: 'start'
    })
  }

  endOperation(operationName: string, duration: number, meta?: any): void {
    const traceMetadata = getTraceMetadata()
    this.winston.info(`Completed operation: ${operationName}`, {
      ...meta,
      ...traceMetadata,
      operationName,
      operationStatus: 'complete',
      duration
    })
  }

  failOperation(operationName: string, error: Error, meta?: any): void {
    const traceMetadata = getTraceMetadata()
    this.winston.error(`Failed operation: ${operationName}`, {
      ...meta,
      ...traceMetadata,
      operationName,
      operationStatus: 'failed',
      error: error.message,
      stack: error.stack
    })
  }

  logApiCall(method: string, url: string, statusCode: number, duration: number, meta?: any): void {
    const traceMetadata = getTraceMetadata()
    const level = statusCode >= 400 ? 'error' : 'info'
    
    this.winston[level](`External API call: ${method} ${url}`, {
      ...meta,
      ...traceMetadata,
      apiCall: {
        method,
        url,
        statusCode,
        duration
      }
    })
  }

  getWinstonLogger(): winston.Logger {
    return this.winston
  }
}

export default new TracedLogger(logger)