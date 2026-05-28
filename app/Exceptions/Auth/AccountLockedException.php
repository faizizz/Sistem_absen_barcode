<?php

namespace App\Exceptions\Auth;

use RuntimeException;

/**
 * Dilempar ketika seorang user mencoba login pada akun yang sedang
 * terkunci sementara karena melebihi MAX_ATTEMPTS percobaan gagal.
 */
class AccountLockedException extends RuntimeException
{
    public function __construct(public readonly int $remainingMinutes)
    {
        parent::__construct(sprintf(
            'Akun terkunci sementara. Coba lagi dalam %d menit.',
            max($remainingMinutes, 1)
        ));
    }
}
