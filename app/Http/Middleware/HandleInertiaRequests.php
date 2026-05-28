<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'flash' => [
                'success' => fn (): ?string => $request->session()->get('success'),
                'error' => fn (): ?string => $request->session()->get('error'),
                'info' => fn (): ?string => $request->session()->get('info'),
            ],
            'auth' => [
                'user' => fn () => $request->user() ? [
                    'id' => $request->user()->id,
                    'login_code' => $request->user()->login_code,
                    'role' => $request->user()->role,
                    'is_admin' => $request->user()->isAdmin(),
                    'must_change_password' => (bool) $request->user()->must_change_password,
                ] : null,
            ],
        ];
    }
}
