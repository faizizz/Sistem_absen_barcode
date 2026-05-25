<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table): void {
            $table->date('attendance_date')->nullable()->after('check_in_time');
        });

        DB::statement('UPDATE attendances SET attendance_date = DATE(check_in_time) WHERE attendance_date IS NULL');

        Schema::table('attendances', function (Blueprint $table): void {
            $table->date('attendance_date')->nullable(false)->change();
            $table->unique(['user_id', 'attendance_date'], 'attendances_user_id_attendance_date_unique');
            $table->index('attendance_date');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table): void {
            $table->dropUnique('attendances_user_id_attendance_date_unique');
            $table->dropIndex(['attendance_date']);
            $table->dropColumn('attendance_date');
        });
    }
};
