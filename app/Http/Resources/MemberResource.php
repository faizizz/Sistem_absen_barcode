<?php

namespace App\Http\Resources;

use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberResource extends JsonResource
{
    public function __construct($resource, public readonly ?array $summary = null)
    {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        /** @var Profile $profile */
        $profile = $this->resource;

        $payload = [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'nama' => $profile->nama,
            'nim' => $profile->nim,
            'departemen' => $profile->departemen,
            'jabatan' => $profile->jabatan,
            'has_qr' => ! blank($profile->qr_token),
        ];

        if ($this->summary !== null) {
            $payload['attendance_summary'] = $this->summary;
        }

        return $payload;
    }
}
