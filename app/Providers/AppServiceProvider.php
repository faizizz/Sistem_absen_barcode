<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // When a logged-in user hits a "guest only" route (like /kuasa login),
        // send admins to the dashboard and regular users to the public homepage
        // — instead of bouncing back to the login page.
        RedirectIfAuthenticated::redirectUsing(function ($request) {
            $user = $request->user();

            if ($user && $user->role === User::ROLE_ADMIN) {
                return route('admin.dashboard');
            }

            return route('home');
        });
    }
}
