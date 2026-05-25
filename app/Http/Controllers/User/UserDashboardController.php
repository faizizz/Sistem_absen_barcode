<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\GenerateAttendanceQrRequest;
use App\Http\Requests\User\LookupNimRequest;
use App\Models\Profile;
use App\Services\QrTokenService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserDashboardController extends Controller
{
    public function __construct(private readonly QrTokenService $qrTokens)
    {
    }

    public function index(): Response
    {
        return Inertia::render('User/Dashboard');
    }

    public function lookupNim(LookupNimRequest $request): JsonResponse
    {
        $profile = $this->findByNim($request->validated('nim'));

        if (! $profile) {
            return response()->json([
                'match' => false,
                'message' => 'NIM yang Anda masukkan tidak ditemukan dalam database.',
            ], 422);
        }

        return response()->json([
            'match' => true,
            'nama' => $profile->nama,
            'nim' => $profile->nim,
            'departemen' => $profile->departemen,
            'jabatan' => $profile->jabatan,
            'has_qr' => ! blank($profile->qr_token),
        ]);
    }

    public function generateQr(GenerateAttendanceQrRequest $request): JsonResponse
    {
        $profile = $this->findByNim($request->validated('nim'));

        if (! $profile) {
            return response()->json([
                'message' => 'NIM tidak ditemukan dalam database.',
            ], 422);
        }

        // One-time issuance: if a QR already exists for this NIM, the
        // public flow must NOT regenerate or expose the existing token.
        // The user has to contact an admin (who can re-download via the
        // admin endpoints) instead of self-serving from the portal.
        if (! blank($profile->qr_token)) {
            return response()->json([
                'message' => 'QR untuk NIM ini sudah pernah dibuat dan hanya bisa dibuat satu kali. '
                    .'Hubungi admin jika perlu QR ulang.',
                'has_qr' => true,
            ], 409);
        }

        $profile = $this->qrTokens->issueFor($profile);

        return response()->json([
            'message' => 'QR Code absensi permanen berhasil dibuat. Simpan baik-baik karena tidak bisa dibuat ulang.',
            'qr_code' => $profile->qr_token,
            'nama' => $profile->nama,
            'nim' => $profile->nim,
            'fresh' => true,
        ]);
    }

    private function findByNim(string $nim): ?Profile
    {
        $needle = (string) str($nim)->squish()->lower();

        return Profile::query()
            ->whereRaw('LOWER(nim) = ?', [$needle])
            ->first();
    }
}
