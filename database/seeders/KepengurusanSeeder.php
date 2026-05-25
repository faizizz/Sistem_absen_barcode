<?php

namespace Database\Seeders;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class KepengurusanSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/data/kepengurusan.csv');

        if (! file_exists($path)) {
            $this->command?->warn("kepengurusan.csv not found at {$path}; skipping.");

            return;
        }

        $handle = fopen($path, 'r');
        if ($handle === false) {
            $this->command?->warn("Unable to open {$path}; skipping.");

            return;
        }

        try {
            $header = fgetcsv($handle);
            if ($header === false) {
                return;
            }

            $header[0] = $this->stripBom($header[0]);
            $indexMap = [];
            foreach ($header as $i => $col) {
                $indexMap[strtolower(trim($col))] = $i;
            }

            $required = ['departemen/biro', 'jabatan', 'nama', 'nim'];
            foreach ($required as $col) {
                if (! array_key_exists($col, $indexMap)) {
                    $this->command?->warn("CSV missing required column: {$col}");

                    return;
                }
            }

            DB::transaction(function () use ($handle, $indexMap) {
                $count = 0;
                while (($row = fgetcsv($handle)) !== false) {
                    if (count($row) < 4) {
                        continue;
                    }

                    $clean = [
                        'departemen' => $this->sanitize($row[$indexMap['departemen/biro']] ?? ''),
                        'jabatan'    => $this->sanitize($row[$indexMap['jabatan']] ?? ''),
                        'nama'       => $this->sanitize($row[$indexMap['nama']] ?? ''),
                        'nim'        => $this->sanitize($row[$indexMap['nim']] ?? ''),
                    ];

                    if ($clean['nim'] === '' || $clean['nama'] === '') {
                        continue;
                    }

                    if (! in_array($clean['departemen'], Profile::DEPARTMENTS, true)) {
                        $this->command?->warn("Unknown departemen '{$clean['departemen']}' for NIM {$clean['nim']}; skipping.");
                        continue;
                    }

                    $this->seedRow($clean);
                    $count++;
                }

                $this->command?->info("KepengurusanSeeder: seeded {$count} rows.");
            });
        } finally {
            fclose($handle);
        }
    }

    private function sanitize(string $value): string
    {
        $value = $this->stripBom($value);
        $value = trim($value);
        $value = ltrim($value, ":\t\r\n ");

        return $value;
    }

    private function stripBom(string $value): string
    {
        if (str_starts_with($value, "\xEF\xBB\xBF")) {
            return substr($value, 3);
        }

        return $value;
    }

    private function seedRow(array $row): void
    {
        $profile = Profile::query()
            ->where('nim', $row['nim'])
            ->with('user')
            ->first();

        $user = $profile?->user ?? User::create([
            'password' => Hash::make(Str::random(20)),
            'role' => User::ROLE_USER,
        ]);
        $user->forceFill([
            'login_code' => null,
            'role' => User::ROLE_USER,
        ])->save();

        Profile::updateOrCreate(
            ['nim' => $row['nim']],
            [
                'user_id'    => $user->id,
                'nama'       => $row['nama'],
                'departemen' => $row['departemen'],
                'jabatan'    => $row['jabatan'],
            ]
        );
    }
}
