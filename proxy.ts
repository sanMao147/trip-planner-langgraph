import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createLogger } from '@/lib/infra/logger'

const logger = createLogger('Middleware')

export function proxy(request: NextRequest) {
  const start = Date.now()
  const method = request.method
  const pathname = request.nextUrl.pathname

  logger.info(`${method} ${pathname} started`)

  const response = NextResponse.next()

  logger.info(`${method} ${pathname} completed in ${Date.now() - start}ms`)

  return response
}

export const config = {
  matcher: '/api/:path*',
}
