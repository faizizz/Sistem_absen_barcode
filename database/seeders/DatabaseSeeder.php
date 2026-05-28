<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Akun admin demo. firstOrCreate (bukan updateOrCreate) agar
        // password yang sudah pernah diganti oleh admin tidak ter-reset
        // saat seeder dijalankan ulang. Field security lain (failed_login_*,
        // locked_until, must_change_password, dll.) memakai default kolom
        // dari migration `add_security_columns_to_users_table`.
        $admin = User::firstOrCreate(
            ['login_code' => 'admin'],
            [
                'password' => 'password', // di-hash otomatis via cast 'hashed'
                'role' => User::ROLE_ADMIN,
            ]
        );

        $this->call(KepengurusanSeeder::class);

        // Skip event seeding kalau sudah ada event tersisa dari run sebelumnya.
        if (Event::query()->exists()) {
            return;
        }

        Event::create([
            'nama_kegiatan' => 'Rapat Rutin HRD',
            'deskripsi' => 'Rapat koordinasi mingguan departemen HRD.',
            'tanggal_mulai' => Carbon::today(),
            'tanggal_selesai' => Carbon::today(),
            'waktu_mulai' => '13:00:00',
            'waktu_selesai' => '15:00:00',
            'batas_absensi' => '13:15:00',
            'departemen' => Profile::DEPARTEMEN_HRD,
            'status' => Event::STATUS_ACTIVE,
            'created_by' => $admin->id,
        ]);

        Event::create([
            'nama_kegiatan' => 'Forum Bersama Pengurus',
            'deskripsi' => 'Forum koordinasi seluruh departemen.',
            'tanggal_mulai' => Carbon::today()->addDays(2),
            'tanggal_selesai' => Carbon::today()->addDays(2),
            'waktu_mulai' => '09:00:00',
            'waktu_selesai' => '11:00:00',
            'batas_absensi' => '09:15:00',
            'departemen' => null,
            'status' => Event::STATUS_DRAFT,
            'created_by' => $admin->id,
        ]);

        Event::create([
            'nama_kegiatan' => 'Pelatihan Komunikasi',
            'deskripsi' => 'Sesi pelatihan rutin sudah ditutup.',
            'tanggal_mulai' => Carbon::today()->subDays(3),
            'tanggal_selesai' => Carbon::today()->subDays(3),
            'waktu_mulai' => '13:00:00',
            'waktu_selesai' => '15:00:00',
            'batas_absensi' => '13:15:00',
            'departemen' => Profile::DEPARTEMEN_CMI,
            'status' => Event::STATUS_CLOSED,
            'created_by' => $admin->id,
        ]);
    }
}
