import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number }) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: { path?: string }) {
          res.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  // Auth routes handling
  if (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register')) {
    if (user) {
      // If user is already logged in, redirect to dashboard
      const redirectUrl = new URL('/dashboard', req.url)
      return NextResponse.redirect(redirectUrl)
    }
    // If not logged in, allow access to auth pages
    return res
  }

  // Protected routes handling
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user || userError) {
      // If not logged in or error getting user, redirect to login
      const redirectUrl = new URL('/login', req.url)
      return NextResponse.redirect(redirectUrl)
    }

    try {
      // Role-based access control
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (dbError || !userData) {
        // If user not found in database, redirect to login
        const redirectUrl = new URL('/login', req.url)
        return NextResponse.redirect(redirectUrl)
      }

      // Admin-only routes
      if (req.nextUrl.pathname.startsWith('/dashboard/admin') && userData.role !== 'admin') {
        const redirectUrl = new URL('/dashboard', req.url)
        return NextResponse.redirect(redirectUrl)
      }

      // Teacher-only routes
      if (req.nextUrl.pathname.startsWith('/dashboard/teacher') && userData.role !== 'teacher') {
        const redirectUrl = new URL('/dashboard', req.url)
        return NextResponse.redirect(redirectUrl)
      }

      // Parent-only routes
      if (req.nextUrl.pathname.startsWith('/dashboard/parent') && userData.role !== 'parent') {
        const redirectUrl = new URL('/dashboard', req.url)
        return NextResponse.redirect(redirectUrl)
      }

      // If all checks pass, allow access to protected route
      return res
    } catch (error) {
      console.error('Middleware error:', error)
      const redirectUrl = new URL('/login', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
} 