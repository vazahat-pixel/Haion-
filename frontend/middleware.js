/**
 * Vercel Edge middleware — proxies /api and /uploads to the backend in production.
 * Set BACKEND_URL in Vercel (e.g. https://your-backend.vercel.app) on the frontend project.
 * Local dev uses Vite's proxy instead (vite.config.js).
 */
export default async function middleware(request) {
  const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, '');
  if (!backendUrl) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'BACKEND_URL is not set in Vercel environment variables for this frontend project.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const url = new URL(request.url);
  const targetUrl = `${backendUrl}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  try {
    return await fetch(targetUrl, init);
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Backend unreachable',
        error: err.message,
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

export const config = {
  matcher: ['/api/:path*', '/uploads/:path*'],
};
