import { NextResponse, NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://fine-tuning-426l.onrender.com' : 'http://127.0.0.1:8000');

async function proxyRequest(request: NextRequest, slug: string[]) {
  const url = new URL(request.url);
  const backendPath = `/api/${slug.join('/')}`;
  const targetUrl = `${BACKEND_URL}${backendPath}${url.search}`;

  try {
    const headers = new Headers();
    const allowedHeaders = ['content-type', 'accept', 'authorization'];
    request.headers.forEach((value, key) => {
      if (allowedHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    const options: RequestInit = {
      method: request.method,
      headers: headers,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const body = await request.text();
      if (body) {
        options.body = body;
      }
    }

    console.log(`[Proxy] ${request.method} ${url.pathname} -> ${targetUrl}`);

    const response = await fetch(targetUrl, options);
    const data = await response.text();

    console.log(`[Proxy] Success: ${response.status}`);

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*', // Be extremely permissive
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
        }
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
