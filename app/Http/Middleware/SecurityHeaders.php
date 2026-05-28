<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * SecurityHeaders — pasang header proteksi browser standar pada setiap
 * response web. Dipakai global di middleware web group (lihat
 * bootstrap/app.php).
 *
 * Headers yang dipasang:
 *   - Content-Security-Policy
 *       Mode dev (`local`): mengizinkan 'unsafe-inline'/'unsafe-eval'/
 *       blob/ws dan origin Vite untuk HMR. Mode production: script dari
 *       'self' saja (Vite di production sudah di-bundle). Google Fonts
 *       diizinkan karena layout memuatnya dari CDN.
 *   - X-Frame-Options: DENY  → blok clickjacking via iframe
 *   - X-Content-Type-Options: nosniff → blok MIME sniffing
 *   - Referrer-Policy: strict-origin-when-cross-origin
 *   - Permissions-Policy:
 *       camera=(self) → dibutuhkan oleh fitur scanner QR
 *       microphone=(), geolocation=() → ditolak
 *   - Strict-Transport-Security: hanya jika request HTTPS, agar tidak
 *     menjebak local-dev di http://.
 *
 * Catatan: jika pernah pasang header sama lewat web-server (Nginx/
 * Apache/Cloudflare), header dari Laravel akan menimpa hanya jika
 * web-server tidak menambahkan duplikat. Sebaiknya diset di SATU tempat.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        // Skip jika response sudah punya header (mis. ditangani CDN/Nginx).
        // Tetap kita tulis untuk menjamin nilai default yang aman.

        $isProduction = app()->environment('production');

        $csp = $this->contentSecurityPolicy($isProduction);
        $response->headers->set('Content-Security-Policy', $csp);

        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions-Policy:
        //   camera=(self) — dibutuhkan oleh /kuasa/scanner (html5-qrcode).
        //   microphone=() & geolocation=() — eksplisit ditolak.
        $response->headers->set(
            'Permissions-Policy',
            'camera=(self), microphone=(), geolocation=(), payment=(), usb=()'
        );

        if ($request->isSecure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        return $response;
    }

    /**
     * Susun string Content-Security-Policy. Dipisah ke method sendiri
     * agar mudah ditest dan agar perbedaan dev vs prod tetap eksplisit.
     */
    protected function contentSecurityPolicy(bool $isProduction): string
    {
        $styleSources = [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
        ];

        if (! $isProduction) {
            $styleSources[] = 'http://localhost:5800';
            $styleSources[] = 'http://127.0.0.1:5800';
        }

        $directives = [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "img-src 'self' data: blob:",
            "font-src 'self' data: https://fonts.gstatic.com",
            // Tailwind 4 + utilities dapat menanam inline style; ini umum
            // diizinkan dengan 'unsafe-inline' di style-src walau di prod.
            'style-src ' . implode(' ', $styleSources),
        ];

        if ($isProduction) {
            // Production: script hanya dari self. Bila kelak butuh nonce
            // untuk script inline (mis. analytics), tambahkan di sini.
            $directives[] = "script-src 'self'";
            $directives[] = "connect-src 'self'";
        } else {
            // Dev: Vite HMR butuh eval (untuk transform), inline boot
            // script, ws/blob untuk hot-reload, dan origin dev server.
            $viteDevOrigins = 'http://localhost:5800 http://127.0.0.1:5800';

            $directives[] = "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: {$viteDevOrigins}";
            $directives[] = "connect-src 'self' ws: wss: http://localhost:* http://127.0.0.1:*";
        }

        return implode('; ', $directives);
    }
}
