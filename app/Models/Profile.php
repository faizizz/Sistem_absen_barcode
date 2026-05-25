<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    use HasFactory;

    public const DEPARTEMEN_BPI  = 'Badan Pengurus Inti';
    public const DEPARTEMEN_HRD  = 'Human Resources Development';
    public const DEPARTEMEN_RCS  = 'Relation and Community Services';
    public const DEPARTEMEN_PSD  = 'Professional Skill Development';
    public const DEPARTEMEN_ADV  = 'Advocacy and Welfare';
    public const DEPARTEMEN_CMI  = 'Communication and Media Information';
    public const DEPARTEMEN_ENT  = 'Entrepreneurship Development';
    public const DEPARTEMEN_MPKO = 'Majelis Pengawasan dan Konsultasi Organisasi (MPKO)';

    public const DEPARTMENTS = [
        self::DEPARTEMEN_BPI,
        self::DEPARTEMEN_HRD,
        self::DEPARTEMEN_RCS,
        self::DEPARTEMEN_PSD,
        self::DEPARTEMEN_ADV,
        self::DEPARTEMEN_CMI,
        self::DEPARTEMEN_ENT,
        self::DEPARTEMEN_MPKO,
    ];

    protected $fillable = [
        'user_id',
        'nama',
        'nim',
        'qr_token',
        'departemen',
        'jabatan',
    ];

    /**
     * Generate a scanner-friendly attendance QR token.
     *
     * Uses uppercase + digits only (32-char alphabet) so the QR encodes in
     * "Alphanumeric mode" rather than Byte mode. This produces a smaller,
     * lower-density QR (Version ~2 at level H) that decodes far more reliably
     * from a phone screen.
     *
     * 22 chars from a 32-char alphabet ≈ 110 bits of entropy — well over the
     * uniqueness/guessability bar needed for an attendance check-in code.
     */
    public static function generateQrToken(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars; no I, O, 0, 1
        $len = 22;
        $max = strlen($alphabet) - 1;
        $token = '';
        for ($i = 0; $i < $len; $i++) {
            $token .= $alphabet[random_int(0, $max)];
        }

        return 'QR'.$token;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
