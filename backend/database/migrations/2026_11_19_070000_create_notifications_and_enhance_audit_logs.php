<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Enhance audit_logs table with module, subject, and old/new change tracking
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->string('module', 50)->default('system')->after('user_name');
            $table->string('subject_type', 100)->nullable()->after('description');
            $table->unsignedBigInteger('subject_id')->nullable()->after('subject_type');
            $table->json('old_values')->nullable()->after('subject_id');
            $table->json('new_values')->nullable()->after('old_values');

            $table->index(['store_id', 'module', 'created_at']);
            $table->index(['subject_type', 'subject_id']);
        });

        // 2. Create notifications table
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->foreignId('audit_log_id')->nullable()->constrained('audit_logs')->nullOnDelete();
            $table->string('title', 150);
            $table->text('message');
            $table->string('type', 40)->default('info'); // info, success, warning, danger
            $table->string('category', 40)->default('system'); // pos, inventory, finance, employee, auth, settings
            $table->string('link', 255)->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['store_id', 'user_id', 'read_at']);
            $table->index(['store_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['store_id', 'module', 'created_at']);
            $table->dropIndex(['subject_type', 'subject_id']);
            $table->dropColumn(['module', 'subject_type', 'subject_id', 'old_values', 'new_values']);
        });
    }
};
