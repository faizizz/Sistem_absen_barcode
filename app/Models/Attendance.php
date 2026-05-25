<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    public const STATUS_HADIR     = 'hadir';
    public const STATUS_TERLAMBAT = 'terlambat';
    public const STATUS_IZIN      = 'izin';
    public const STATUS_SAKIT     = 'sakit';
    public const STATUS_ALPHA     = 'alpha';
    public const STATUS_REVOKED   = 'revoked';

    public const STATUSES = [
        self::STATUS_HADIR,
        self::STATUS_TERLAMBAT,
        self::STATUS_IZIN,
        self::STATUS_SAKIT,
        self::STATUS_ALPHA,
        self::STATUS_REVOKED,
    ];

    /**
     * Statuses that "occupy" the (user_id, event_id) slot. A revoked
     * record is intentionally excluded so the same user can be re-recorded
     * for the same event after a revoke.
     */
    public const ACTIVE_STATUSES = [
        self::STATUS_HADIR,
        self::STATUS_TERLAMBAT,
        self::STATUS_IZIN,
        self::STATUS_SAKIT,
        self::STATUS_ALPHA,
    ];

    protected $fillable = [
        'user_id',
        'event_id',
        'check_in_time',
        'attendance_date',
        'status',
        'departemen',
        'alasan',
    ];

    protected function casts(): array
    {
        return [
            'check_in_time' => 'datetime',
            'attendance_date' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $attendance): void {
            if (blank($attendance->attendance_date)) {
                $attendance->attendance_date = $attendance->check_in_time
                    ? $attendance->check_in_time->copy()->toDateString()
                    : now()->toDateString();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
