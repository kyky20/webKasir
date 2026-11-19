<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ActivityLogger
{
    /**
     * List of sensitive fields that must never be recorded in audit logs.
     */
    protected static array $sensitiveFields = [
        'password',
        'password_confirmation',
        'token',
        'remember_token',
        'api_token',
        'secret',
    ];

    /**
     * Record an activity log and optionally broadcast / generate a notification.
     * Guaranteed never to throw an exception to protect business transactions.
     */
    public static function log(
        string $module,
        string $action,
        string $description,
        ?Request $request = null,
        ?int $storeId = null,
        ?User $user = null,
        ?string $subjectType = null,
        ?int $subjectId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $properties = null,
        bool $notify = false,
        ?string $notifyTitle = null,
        ?string $notifyType = 'info', // info, success, warning, danger
        ?int $notifyUserId = null,    // null = visible to store Owner, specific id = targeted
        ?string $notifyLink = null
    ): ?AuditLog {
        try {
            $user = $user ?? $request?->user() ?? auth()->user();
            $storeId = $storeId ?? $user?->store_id ?? $request?->user()?->store_id;

            if (!$storeId) {
                return null;
            }

            // Sanitize sensitive fields from old and new values
            $cleanOld = $oldValues ? self::sanitize($oldValues) : null;
            $cleanNew = $newValues ? self::sanitize($newValues) : null;

            $log = AuditLog::create([
                'store_id' => $storeId,
                'user_id' => $user?->id,
                'user_name' => $user?->name ?? 'Sistem',
                'module' => $module,
                'action' => $action,
                'description' => $description,
                'subject_type' => $subjectType,
                'subject_id' => $subjectId,
                'old_values' => $cleanOld,
                'new_values' => $cleanNew,
                'ip_address' => $request?->ip(),
                'user_agent' => $request ? substr($request->userAgent() ?? '', 0, 255) : null,
                'properties' => $properties,
                'created_at' => now(),
            ]);

            if ($notify) {
                Notification::create([
                    'store_id' => $storeId,
                    'user_id' => $notifyUserId,
                    'audit_log_id' => $log->id,
                    'title' => $notifyTitle ?? ucfirst(str_replace('_', ' ', $action)),
                    'message' => $description,
                    'type' => $notifyType ?? 'info',
                    'category' => $module,
                    'link' => $notifyLink,
                    'created_at' => now(),
                ]);
            }

            return $log;
        } catch (\Throwable $e) {
            Log::error('ActivityLogger failure: ' . $e->getMessage(), [
                'module' => $module,
                'action' => $action,
            ]);
            return null;
        }
    }

    /**
     * Strip password and sensitive credentials recursively.
     */
    protected static function sanitize(array $data): array
    {
        foreach ($data as $key => $value) {
            if (in_array(strtolower($key), self::$sensitiveFields, true)) {
                $data[$key] = '********';
            } elseif (is_array($value)) {
                $data[$key] = self::sanitize($value);
            }
        }
        return $data;
    }
}
