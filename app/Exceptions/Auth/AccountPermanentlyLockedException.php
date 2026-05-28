<?php

namespace App\Exceptions\Auth;

use RuntimeException;

/**
 * Dilempar ketika seorang user mencoba login pada akun yang sudah
 * terkunci permanen (locked_permanently=true). Akun hanya dapat
 * di-unlock oleh admin lain melalui halaman manajemen admin.
 */
class AccountPermanentlyLockedException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct(
            'Akun terkunci permanen. Hubungi admin lain untuk membuka kunci.'
        );
    }
}
