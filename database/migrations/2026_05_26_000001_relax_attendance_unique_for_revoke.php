<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The (user_id, event_id) unique constraint must be relaxed once we allow
 * status='revoked' on attendance records: a revoked record stays in the
 * table (we don't hard-delete) but the same user must still be able to
 * record a fresh attendance for that event afterwards. Uniqueness for
 * "active" attendance (anything not revoked) is enforced at the service
 * layer instead.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table): void {
            $table->dropUnique('attendances_user_id_event_id_unique');
        });

        Schema::table('attendances', function (Blueprint $table): void {
            // Keep a non-unique composite index so per-event lookups stay fast.
            $table->index(['user_id', 'event_id'], 'attendances_user_id_event_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table): void {
            $table->dropIndex('attendances_user_id_event_id_index');
        });

        Schema::table('attendances', function (Blueprint $table): void {
            $table->unique(['user_id', 'event_id'], 'attendances_user_id_event_id_unique');
        });
    }
};
