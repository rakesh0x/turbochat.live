import { NextResponse, NextRequest } from 'next/server';
import { getToken } from "next-auth/jwt";
import jwt from 'jsonwebtoken';
import { Phone } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 

const BACKEND_URL = process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://app.turbochat.live' : 'http://127.0.0.1:8000');
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';


async function proxyRequest(request: NextRequest, slug: string[]) {
  const url = new URL(request.url);
  const backendPath = `/api/${slug.join('/')}`;
  const targetUrl = `${BACKEND_URL}${backendPath}${url.search}`;

  try {
    const token = await getToken({ req: request, secret: NEXTAUTH_SECRET });
    const headers = new Headers();

    const userId = (token?.sub as string | undefined) || ((token as any)?.id as string | undefined);
    const userEmail = (token?.email as string | undefined) || ((token as any)?.user?.email as string | undefined);
    if (userId && userEmail) {
      const backendToken = jwt.sign(
        { sub: userId, email: userEmail },
        NEXTAUTH_SECRET,
        { algorithm: 'HS256', expiresIn: '1h' }
      );
      headers.set('Authorization', `Bearer ${backendToken}`);
    }

    const allowedHeaders = ['content-type', 'accept'];
    request.headers.forEach((value, key) => {
      if (allowedHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    const options: RequestInit = { method: request.method, headers };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const body = await request.text();
      if (body) options.body = body;
    }

    console.log(`[Proxy] ${request.method} ${url.pathname} -> ${targetUrl}`);

    const response = await fetch(targetUrl, options);
    const contentType = response.headers.get('Content-Type') || '';

    // --- SSE / streaming passthrough ---
    // If the backend returns an event-stream, pipe the body directly instead
    // of buffering with response.text(). Buffering would make the browser wait
    // for the full LLM response, defeating the purpose of streaming entirely.
    if (contentType.includes('text/event-stream') && response.body) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // --- Normal (non-streaming) response ---
    const data = await response.text();
    console.log(`[Proxy] Success: ${response.status}`);

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  } catch (error: any) {
    console.error('[Proxy Error]:', error.message);
    return NextResponse.json(
      { error: 'Backend connection failed', details: error.message },
      {
        status: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': '*',
          'Access-Control-Allow-Headers': '*',
        },
      }
    );
  }
}


export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}
