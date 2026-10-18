// Fastify-Hook, der geschuetzte Routen absichert.
// Liest den Token aus dem Cookie oder dem Authorization-Header.
import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../db/prisma.js'
import { verifyToken, type TokenPayload } from '../utils/auth.js'

// Erweitert den Request um die angemeldete Nutzerkennung
declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Token zuerst aus Cookie, sonst aus Bearer-Header lesen
  const cookieToken = request.cookies?.token
  const header = request.headers.authorization
  const headerToken = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  const token = cookieToken || headerToken

  if (!token) {
    reply.code(401).send({ error: 'Nicht angemeldet' })
    return
  }

  const payload = verifyToken(token)
  if (!payload) {
    reply.code(401).send({ error: 'Sitzung ungültig oder abgelaufen' })
    return
  }

  // Konto muss noch bestehen; Anmeldungen von vor einer Passwortänderung gelten nicht mehr
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { tokenVersion: true },
  })
  if (!user || (payload.tv ?? 0) !== user.tokenVersion) {
    reply.code(401).send({ error: 'Sitzung ungültig oder abgelaufen' })
    return
  }

  request.user = payload
}
