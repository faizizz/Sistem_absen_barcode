<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['login_code' => 'admin'],
            [
                'password' => Hash::make('password'),
                'role'     => User::ROLE_ADMIN,
            ]
        );

        $this->call(KepengurusanSeeder::class);

        // Seed sample events only if none exist.
        if (Event::query()->count() === 0) {
            Event::create([
                'nama_kegiatan' => 'Rapat Rutin HRD',
                'deskripsi' => 'Rapat koordinasi mingguan departemen HRD.',
                'tanggal' => Carbon::today(),
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
                'tanggal' => Carbon::today()->addDays(2),
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
                'tanggal' => Carbon::today()->subDays(3),
                'waktu_mulai' => '13:00:00',
                'waktu_selesai' => '15:00:00',
                'batas_absensi' => '13:15:00',
                'departemen' => Profile::DEPARTEMEN_CMI,
                'status' => Event::STATUS_CLOSED,
                'created_by' => $admin->id,
            ]);
        }
    }
}
