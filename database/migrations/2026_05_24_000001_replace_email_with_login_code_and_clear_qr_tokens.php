<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'login_code')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->string('login_code')->nullable()->unique()->after('id');
            });
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'login_code')) {
            $reservedAdminCode = DB::table('users')
                ->where('login_code', 'admin')
                ->exists();

            DB::table('users')
                ->where('role', User::ROLE_ADMIN)
                ->whereNull('login_code')
                ->orderBy('id')
                ->get(['id'])
                ->each(function (object $admin) use (&$reservedAdminCode): void {
                    $loginCode = $reservedAdminCode ? 'admin-'.$admin->id : 'admin';

                    while (DB::table('users')->where('login_code', $loginCode)->exists()) {
                        $loginCode = 'admin-'.$admin->id.'-'.strtolower(Str::random(6));
                    }

                    DB::table('users')
                        ->where('id', $admin->id)
                        ->update([
                            'login_code' => $loginCode,
                        ]);

                    $reservedAdminCode = true;
                });
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'email')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropUnique('users_email_unique');
                $table->dropColumn('email');
            });
        }

        if (Schema::hasTable('profiles') && Schema::hasColumn('profiles', 'qr_token')) {
            DB::table('profiles')->update(['qr_token' => null]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'email')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->string('email')->nullable()->unique()->after('id');
            });
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'email')) {
            DB::table('users')
                ->orderBy('id')
                ->get(['id', 'login_code', 'role'])
                ->each(function (object $user): void {
                    $prefix = $user->role === User::ROLE_ADMIN
                        ? ($user->login_code ?: 'admin-'.$user->id)
                        : 'user-'.$user->id;

                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['email' => $prefix.'@absen.local']);
                });
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'login_code')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropUnique('users_login_code_unique');
                $table->dropColumn('login_code');
            });
        }
    }
};
