<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Membership;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

/**
 * Handles Clerk webhook events to keep the local database in sync.
 *
 * Configure in Clerk Dashboard → Webhooks:
 *   URL: https://your-domain.com/api/webhooks/clerk
 *   Events: user.created, user.updated, user.deleted,
 *           organization.created, organization.updated, organization.deleted,
 *           organizationMembership.created, organizationMembership.deleted
 */
class WebhookController extends Controller
{
    public function clerk(Request $request): JsonResponse
    {
        // Optional: verify Svix signature
        // $this->verifySvixSignature($request);

        $event = $request->input('type');
        $data  = $request->input('data', []);

        match ($event) {
            'user.created', 'user.updated' => $this->upsertUser($data),
            'user.deleted'                 => $this->deleteUser($data),

            'organization.created',
            'organization.updated'         => $this->upsertOrganization($data),
            'organization.deleted'         => $this->deleteOrganization($data),

            'organizationMembership.created' => $this->createMembership($data),
            'organizationMembership.deleted' => $this->deleteMembership($data),

            default => null,
        };

        return response()->json(['status' => 'ok']);
    }

    // ─── User sync ────────────────────────────────────────────────────────────

    private function upsertUser(array $data): void
    {
        $primaryEmail = collect($data['email_addresses'] ?? [])
            ->firstWhere('id', $data['primary_email_address_id'] ?? null);

        User::updateOrCreate(
            ['clerk_id' => $data['id']],
            [
                'email'      => $primaryEmail['email_address'] ?? '',
                'name'       => trim(($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? '')),
                'avatar_url' => $data['image_url'] ?? null,
            ]
        );
    }

    private function deleteUser(array $data): void
    {
        User::where('clerk_id', $data['id'])->delete();
    }

    // ─── Organization sync ────────────────────────────────────────────────────

    private function upsertOrganization(array $data): void
    {
        Organization::updateOrCreate(
            ['clerk_org_id' => $data['id']],
            [
                'name' => $data['name'],
                'slug' => $data['slug'] ?? Str::slug($data['name']),
            ]
        );
    }

    private function deleteOrganization(array $data): void
    {
        Organization::where('clerk_org_id', $data['id'])->delete();
    }

    // ─── Membership sync ──────────────────────────────────────────────────────

    private function createMembership(array $data): void
    {
        $user = User::where('clerk_id', $data['public_user_data']['user_id'] ?? '')->first();
        $org  = Organization::where('clerk_org_id', $data['organization']['id'] ?? '')->first();

        if (!$user || !$org) {
            return;
        }

        Membership::updateOrCreate(
            ['user_id' => $user->id, 'organization_id' => $org->id],
            ['role' => $data['role'] ?? 'member']
        );
    }

    private function deleteMembership(array $data): void
    {
        $user = User::where('clerk_id', $data['public_user_data']['user_id'] ?? '')->first();
        $org  = Organization::where('clerk_org_id', $data['organization']['id'] ?? '')->first();

        if (!$user || !$org) {
            return;
        }

        Membership::where('user_id', $user->id)
            ->where('organization_id', $org->id)
            ->delete();
    }
}
