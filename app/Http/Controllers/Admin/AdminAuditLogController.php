<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminAuditLogController extends Controller
{
    public function __construct(private readonly AuditService $audit)
    {
    }

    public function index(Request $request): Response
    {
        $filters = [
            'action' => $request->string('action')->toString(),
            'from' => $request->string('from')->toString(),
            'to' => $request->string('to')->toString(),
        ];

        $logs = $this->audit->query($filters)
            ->paginate(20)
            ->withQueryString()
            ->through(fn (AuditLog $log) => (new AuditLogResource($log))->toArray($request));

        return Inertia::render('Admin/AuditLog/Index', [
            'admin' => ['login_code' => $request->user()?->login_code],
            'logs' => $logs,
            'actions' => $this->audit->distinctActions(),
            'filters' => $filters,
        ]);
    }
}
