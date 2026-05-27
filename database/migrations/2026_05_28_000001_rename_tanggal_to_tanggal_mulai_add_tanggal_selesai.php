<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('events', 'tanggal')) {
            Schema::table('events', function (Blueprint $table): void {
                $table->renameColumn('tanggal', 'tanggal_mulai');
            });
        }

        if (! Schema::hasColumn('events', 'tanggal_selesai')) {
            Schema::table('events', function (Blueprint $table): void {
                $table->date('tanggal_selesai')->nullable()->after('tanggal_mulai');
            });

            DB::table('events')->whereNull('tanggal_selesai')->update(['tanggal_selesai' => DB::raw('tanggal_mulai')]);

            Schema::table('events', function (Blueprint $table): void {
                $table->date('tanggal_selesai')->nullable(false)->change();
            });
        }

        // Rebuild index.
        $indexes = collect(Schema::getIndexes('events'))->pluck('name')->all();

        if (in_array('events_tanggal_index', $indexes, true)) {
            Schema::table('events', function (Blueprint $table): void {
                $table->dropIndex('events_tanggal_index');
            });
        }
        if (in_array('events_tanggal_mulai_index', $indexes, true)) {
            Schema::table('events', function (Blueprint $table): void {
                $table->dropIndex('events_tanggal_mulai_index');
            });
        }
        if (! in_array('events_tanggal_mulai_tanggal_selesai_index', $indexes, true)) {
            Schema::table('events', function (Blueprint $table): void {
                $table->index(['tanggal_mulai', 'tanggal_selesai']);
            });
        }
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table): void {
            $table->dropIndex(['tanggal_mulai', 'tanggal_selesai']);
            $table->dropColumn('tanggal_selesai');
        });

        Schema::table('events', function (Blueprint $table): void {
            $table->renameColumn('tanggal_mulai', 'tanggal');
            $table->index('tanggal');
        });
    }
};
