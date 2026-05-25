<?php

use App\Models\Attendance;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table): void {
            $table->foreignId('event_id')->nullable()->after('user_id')
                ->constrained('events')->nullOnDelete();
            $table->text('alasan')->nullable()->after('departemen');
        });

        // Allow status to use longer enum values (izin, sakit, alpha, terlambat).
        DB::statement("ALTER TABLE attendances MODIFY status VARCHAR(20) NOT NULL DEFAULT 'hadir'");

        // Replace (user_id, attendance_date) unique with (user_id, event_id) unique.
        // MySQL requires an index on user_id for the foreign key — add a regular
        // composite first so the FK doesn't break when we drop the unique.
        Schema::table('attendances', function (Blueprint $table): void {
            $table->index('user_id', 'attendances_user_id_index');
        });

        Schema::table('attendances', function (Blueprint $table): void {
            $table->dropUnique('attendances_user_id_attendance_date_unique');
        });

        Schema::table('attendances', function (Blueprint $table): void {
            $table->unique(['user_id', 'event_id'], 'attendances_user_id_event_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table): void {
            $table->dropUnique('attendances_user_id_event_id_unique');
        });

        Schema::table('attendances', function (Blueprint $table): void {
            $table->unique(['user_id', 'attendance_date'], 'attendances_user_id_attendance_date_unique');
        });

        Schema::table('attendances', function (Blueprint $table): void {
            $table->dropForeign(['event_id']);
            $table->dropColumn(['event_id', 'alasan']);
        });
    }
};
