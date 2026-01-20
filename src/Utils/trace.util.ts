import { AsyncLocalStorage } from 'async_hooks'
import { v4 as uuidv4 } from 'uuid'

/**
 * Interface for trace context
 */
export interface TraceContext {
  traceId: string
  spanId: string
  parentSpanId?: string
  correlationId?: string
  userId?: string
  companyId?: string
  operationName?: string
  startTime: number
}

/**
 * AsyncLocalStorage instance for trace context
 */
const asyncLocalStorage = new AsyncLocalStorage<TraceContext>()

/**
 * Common trace headers used across services
 */
export const TRACE_HEADERS = {
  TRACE_ID: 'x-trace-id',
  SPAN_ID: 'x-span-id',
  PARENT_SPAN_ID: 'x-parent-span-id',
  CORRELATION_ID: 'x-correlation-id',
  USER_ID: 'x-user-id',
  COMPANY_ID: 'x-company-id'
} as const

/**
 * Generate a new trace ID
 */
export const generateTraceId = (): string => {
  return uuidv4()
}

/**
 * Generate a new span ID
 */
export const generateSpanId = (): string => {
  return uuidv4()
}

/**
 * Create a new trace context
 */
export const createTraceContext = (
  traceId?: string,
  parentSpanId?: string,
  correlationId?: string,
  userId?: string,
  companyId?: string,
  operationName?: string
): TraceContext => {
  const context: TraceContext = {
    traceId: traceId || generateTraceId(),
    spanId: generateSpanId(),
    startTime: Date.now()
  }

  if (parentSpanId !== undefined) context.parentSpanId = parentSpanId
  if (correlationId !== undefined) context.correlationId = correlationId
  if (userId !== undefined) context.userId = userId
  if (companyId !== undefined) context.companyId = companyId
  if (operationName !== undefined) context.operationName = operationName

  return context
}

/**
 * Get the current trace context
 */
export const getTraceContext = (): TraceContext | undefined => {
  return asyncLocalStorage.getStore()
}

/**
 * Set the trace context for the current async context
 */
export const runWithTraceContext = <T>(
  context: TraceContext,
  callback: () => T
): T => {
  return asyncLocalStorage.run(context, callback)
}

/**
 * Extract trace headers from HTTP request headers
 */
export const extractTraceHeaders = (headers: Record<string, any>): Partial<TraceContext> => {
  return {
    traceId: headers[TRACE_HEADERS.TRACE_ID] || headers[TRACE_HEADERS.TRACE_ID.toLowerCase()],
    parentSpanId: headers[TRACE_HEADERS.SPAN_ID] || headers[TRACE_HEADERS.SPAN_ID.toLowerCase()],
    correlationId: headers[TRACE_HEADERS.CORRELATION_ID] || headers[TRACE_HEADERS.CORRELATION_ID.toLowerCase()],
    userId: headers[TRACE_HEADERS.USER_ID] || headers[TRACE_HEADERS.USER_ID.toLowerCase()],
    companyId: headers[TRACE_HEADERS.COMPANY_ID] || headers[TRACE_HEADERS.COMPANY_ID.toLowerCase()]
  }
}

/**
 * Generate trace headers for outgoing HTTP requests
 */
export const generateTraceHeaders = (context?: TraceContext): Record<string, string> => {
  const traceContext = context || getTraceContext()
  if (!traceContext) {
    return {}
  }

  const headers: Record<string, string> = {
    [TRACE_HEADERS.TRACE_ID]: traceContext.traceId,
    [TRACE_HEADERS.SPAN_ID]: traceContext.spanId
  }

  if (traceContext.parentSpanId) {
    headers[TRACE_HEADERS.PARENT_SPAN_ID] = traceContext.parentSpanId
  }

  if (traceContext.correlationId) {
    headers[TRACE_HEADERS.CORRELATION_ID] = traceContext.correlationId
  }

  if (traceContext.userId) {
    headers[TRACE_HEADERS.USER_ID] = traceContext.userId
  }

  if (traceContext.companyId) {
    headers[TRACE_HEADERS.COMPANY_ID] = traceContext.companyId
  }

  return headers
}

/**
 * Create a child span from the current trace context
 */
export const createChildSpan = (operationName: string): TraceContext | undefined => {
  const currentContext = getTraceContext()
  if (!currentContext) {
    return undefined
  }

  return {
    ...currentContext,
    spanId: generateSpanId(),
    parentSpanId: currentContext.spanId,
    operationName,
    startTime: Date.now()
  }
}

/**
 * Get trace metadata for logging
 */
export const getTraceMetadata = (context?: TraceContext): Record<string, any> => {
  const traceContext = context || getTraceContext()
  if (!traceContext) {
    return {}
  }

  const metadata: Record<string, any> = {
    traceId: traceContext.traceId,
    spanId: traceContext.spanId
  }

  if (traceContext.parentSpanId) {
    metadata.parentSpanId = traceContext.parentSpanId
  }

  if (traceContext.correlationId) {
    metadata.correlationId = traceContext.correlationId
  }

  if (traceContext.userId) {
    metadata.userId = traceContext.userId
  }

  if (traceContext.companyId) {
    metadata.companyId = traceContext.companyId
  }

  if (traceContext.operationName) {
    metadata.operationName = traceContext.operationName
  }

  return metadata
}

/**
 * Calculate span duration
 */
export const getSpanDuration = (context?: TraceContext): number => {
  const traceContext = context || getTraceContext()
  if (!traceContext) {
    return 0
  }

  return Date.now() - traceContext.startTime
}

export default {
  generateTraceId,
  generateSpanId,
  createTraceContext,
  getTraceContext,
  runWithTraceContext,
  extractTraceHeaders,
  generateTraceHeaders,
  createChildSpan,
  getTraceMetadata,
  getSpanDuration,
  TRACE_HEADERS
} 