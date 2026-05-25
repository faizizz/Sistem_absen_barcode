<?php

namespace App\Services;

use App\Models\Profile;
use App\Models\User;

class QrTokenService
{
    public function issueFor(Profile $profile): Profile
    {
        $alreadyHadToken = ! blank($profile->qr_token);

        if (! $alreadyHadToken) {
            do {
                $token = Profile::generateQrToken();
            } while (Profile::query()->where('qr_token', $token)->exists());

            $profile->forceFill(['qr_token' => $token])->save();
            $profile->refresh();
        }

        $profile->qr_token_was_fresh = ! $alreadyHadToken;

        return $profile;
    }

    public function resolveUser(string $qrCode): ?User
    {
        return User::query()
            ->with('profile')
            ->where('role', User::ROLE_USER)
            ->whereHas('profile', fn ($q) => $q->where('qr_token', $qrCode))
            ->first();
    }

    public function isValidTokenFormat(string $code): bool
    {
        return (bool) preg_match('/^QR[A-HJ-NP-Z2-9]{22}$/', $code);
    }

    public function ensureProfileHasToken(Profile $profile): Profile
    {
        return $this->issueFor($profile);
    }
}
