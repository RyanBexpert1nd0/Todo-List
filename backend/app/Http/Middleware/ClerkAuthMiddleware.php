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
                // Proper Verification with JWKS cached using Laravel's native cache
                $jwksData = Cache::remember('clerk_jwks', 300, function () use ($jwksUrl) {
                    $httpClient = new Client();
                    $response = $httpClient->get($jwksUrl);
                    return json_decode($response->getBody()->getContents(), true);
                });

                $keys = \Firebase\JWT\JWK::parseKeySet($jwksData);
                $decoded = JWT::decode($token, $keys);
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

            // Find or create user in DB
            $user = \App\Models\User::where('clerk_id', $userId)->first();
            if (!$user) {
                $email = $decoded->email ?? ($decoded->email_address ?? $userId . '@clerk.local');
                $name = $decoded->name ?? ($decoded->username ?? 'User ' . substr($userId, -6));
                
                $user = \App\Models\User::create([
                    'clerk_id' => $userId,
                    'name' => $name,
                    'email' => $email,
                ]);
            }

            // Find or create organization in DB if in route
            $orgId = $request->route('org');
            if ($orgId) {
                \App\Models\Organization::firstOrCreate(
                    ['id' => $orgId],
                    [
                        'clerk_org_id' => $orgId,
                        'name' => 'Org ' . ($orgId === 'org_placeholder_123' ? 'Demo' : substr($orgId, -6)),
                        'slug' => $orgId,
                    ]
                );

                // Ensure membership exists
                \App\Models\Membership::firstOrCreate([
                    'user_id' => $user->id,
                    'organization_id' => $orgId,
                ], [
                    'role' => 'admin',
                ]);
            }

            // Authenticate user via Laravel Auth guard
            \Illuminate\Support\Facades\Auth::login($user);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Unauthorized: Invalid token',
                'error' => $e->getMessage()
            ], 401);
        }

        return $next($request);
    }
}
