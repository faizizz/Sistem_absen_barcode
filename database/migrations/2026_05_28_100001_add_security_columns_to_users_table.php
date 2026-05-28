<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            // Throttle / lockout state.
            $table->unsignedInteger('failed_login_attempts')->default(0)->after('role');
            $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
            $table->boolean('locked_permanently')->default(false)->after('locked_until');
            $table->unsignedInteger('lockout_cycles')->default(0)->after('locked_permanently');

            // Password lifecycle.
            $table->boolean('must_change_password')->default(false)->after('lockout_cycles');
            $table->timestamp('password_changed_at')->nullable()->after('must_change_password');
            $table->json('password_history')->nullable()->after('password_changed_at');

            // Audit attribution.
            $table->timestamp('last_login_at')->nullable()->after('password_history');
            $table->string('last_login_ip', 64)->nullable()->after('last_login_at');

            // Helpful index for admin listing & lockout queries.
            $table->index(['role', 'locked_permanently']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['role', 'locked_permanently']);
            $table->dropColumn([
                'failed_login_attempts',
                'locked_until',
                'locked_permanently',
                'lockout_cycles',
                'must_change_password',
                'password_changed_at',
                'password_history',
                'last_login_at',
                'last_login_ip',
            ]);
        });
    }
};
