import { NextResponse } from 'next/server'
import { serialize } from 'cookie'
import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants'

/**
 * Next.js Route Handler for proxying login and setting HTTP-Only cookies.
 */
export async function POST(request) {
  try {
    const body = await request.json()
    
    // Call the actual backend
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // Extract token (assuming its name is 'token' or similar in response)
    const token = data.data?.token || data.token

    if (token) {
      const cookieHeader = serialize(STORAGE_KEYS.ACCESS_TOKEN, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      })

      const res = NextResponse.json(data)
      res.headers.append('Set-Cookie', cookieHeader)
      return res
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
