<?php

namespace App\Exceptions\Admin;

use RuntimeException;

/**
 * Dilempar ketika sebuah operasi akan melanggar invariant minimum 2 admin
 * (mis. menghapus admin terakhir / kedua dari belakang). Pesan dibungkus
 * agar controller dapat menyajikannya sebagai validation error Indonesian.
 */
class AdminInvariantException extends RuntimeException
{
    public function __construct(string $message = 'Tidak boleh menghapus admin terakhir. Sistem wajib memiliki minimal 2 admin.')
    {
        parent::__construct($message);
    }
}
