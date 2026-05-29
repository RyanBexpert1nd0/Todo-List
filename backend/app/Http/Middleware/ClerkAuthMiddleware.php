<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\CachedKeySet;
use GuzzleHttp\Client;
use GuzzleHttp\Psr7\HttpFactory;
use Illuminate\Support\Facades\Cache;

class ClerkAuthMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['message' => 'Unauthorized: Missing token'], 401);
        }

        try {
            // Check if JWKS URL is provided, e.g., https://clerk.yourdomain.com/.well-known/jwks.json
            $jwksUrl = env('CLERK_JWKS_URL');

            if ($jwksUrl) {
                // Proper Verification with JWKS (Requires firebase/php-jwt and guzzlehttp/guzzle)
                $httpClient = new Client();
                $httpFactory = new HttpFactory();
                $cacheItemPool = Cache::psr16();
                
                $jwks = new CachedKeySet(
                    $jwksUrl,
                    $httpClient,
                    $httpFactory,
                    $cacheItemPool,
                    300, // cache 5 minutes
                    true
                );

                $decoded = JWT::decode($token, $jwks);
                $userId = $decoded->sub;
            } else {
                // Fallback Development Mode: Decode without verification if JWKS_URL is missing
                // IMPORTANT: Do not use this in production!
                $tokenParts = explode('.', $token);
                if (count($tokenParts) !== 3) {
                    throw new \Exception('Invalid token format');
                }

                $payload = json_decode(base64_decode($tokenParts[1]), true);
                if (!$payload || !isset($payload['sub'])) {
                    throw new \Exception('Invalid token payload');
                }
                
                $userId = $payload['sub'];
            }

            // Bind user ID to request
            $request->headers->set('X-Clerk-User-Id', $userId);

            // Optional: Find user in DB and authenticate them via Laravel Auth guard
            $user = \App\Models\User::where('clerk_id', $userId)->first();
            if ($user) {
                \Illuminate\Support\Facades\Auth::login($user);
            }

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Unauthorized: Invalid token',
                'error' => $e->getMessage()
            ], 401);
        }

        return $next($request);
    }
}
