import { NextResponse } from 'next/server'
import { buildSearchIndex } from '@/lib/docs/nav'

export function GET() {
  return NextResponse.json(buildSearchIndex(), {
    headers: { 'Cache-Control': 'public, max-age=300' },
  })
}