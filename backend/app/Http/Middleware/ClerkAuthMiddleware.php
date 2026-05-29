<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ClerkAuthMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['message' => 'Unauthorized: Missing token'], 401);
        }

        // For now, we will decode the token to get the user ID without verifying the signature.
        // In production, you MUST verify the signature using Clerk's JWKS or use a library like firebase/php-jwt.
        try {
            $tokenParts = explode('.', $token);
            if (count($tokenParts) !== 3) {
                throw new \Exception('Invalid token format');
            }

            $payload = json_decode(base64_decode($tokenParts[1]), true);

            if (!$payload || !isset($payload['sub'])) {
                throw new \Exception('Invalid token payload');
            }

            // Set the Clerk User ID in the request headers or attributes for controllers to use
            $request->headers->set('X-Clerk-User-Id', $payload['sub']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Unauthorized: Invalid token'], 401);
        }

        return $next($request);
    }
}
