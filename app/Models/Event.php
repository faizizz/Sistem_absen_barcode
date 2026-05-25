<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Event extends Model
{
    use HasFactory;

    public const STATUS_DRAFT  = 'draft';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_CLOSED = 'closed';

    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_ACTIVE,
        self::STATUS_CLOSED,
    ];

    public const TIME_STATE_UPCOMING = 'upcoming';
    public const TIME_STATE_OPEN     = 'open';
    public const TIME_STATE_ENDED    = 'ended';

    protected $fillable = [
        'nama_kegiatan',
        'deskripsi',
        'tanggal',
        'waktu_mulai',
        'waktu_selesai',
        'batas_absensi',
        'departemen',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'waktu_mulai' => 'datetime:H:i:s',
            'waktu_selesai' => 'datetime:H:i:s',
            'batas_absensi' => 'datetime:H:i:s',
        ];
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Combine event date with waktu_mulai into a single moment.
     * Returns null if either value is missing.
     */
    public function startMoment(): ?Carbon
    {
        if (! $this->tanggal || ! $this->waktu_mulai) {
            return null;
        }

        return $this->tanggal->copy()->setTimeFromTimeString($this->waktu_mulai->format('H:i:s'));
    }

    /**
     * Combine event date with waktu_selesai into a single moment.
     */
    public function endMoment(): ?Carbon
    {
        if (! $this->tanggal || ! $this->waktu_selesai) {
            return null;
        }

        return $this->tanggal->copy()->setTimeFromTimeString($this->waktu_selesai->format('H:i:s'));
    }

    /**
     * Whether the wall-clock window of this event is currently open,
     * regardless of stored status. Used for auto-transition + scan guard.
     */
    public function isWithinWindow(?Carbon $now = null): bool
    {
        $now ??= now();
        $start = $this->startMoment();
        $end = $this->endMoment();

        if (! $start || ! $end) {
            return false;
        }

        return $now->greaterThanOrEqualTo($start) && $now->lessThanOrEqualTo($end);
    }

    /**
     * Whether members may scan right now: status is ACTIVE AND we have
     * not passed the end moment. Start moment is intentionally not
     * required, so admin "early-open" works.
     */
    public function isOpenForScan(?Carbon $now = null): bool
    {
        if ($this->status !== self::STATUS_ACTIVE) {
            return false;
        }

        $now ??= now();
        $end = $this->endMoment();

        return $end === null || $now->lessThanOrEqualTo($end);
    }

    /**
     * Pure time-based view of the event window — independent of status.
     */
    public function timeState(?Carbon $now = null): string
    {
        $now ??= now();
        $start = $this->startMoment();
        $end = $this->endMoment();

        if ($end && $now->greaterThan($end)) {
            return self::TIME_STATE_ENDED;
        }

        if ($start && $now->lessThan($start)) {
            return self::TIME_STATE_UPCOMING;
        }

        return self::TIME_STATE_OPEN;
    }
}
