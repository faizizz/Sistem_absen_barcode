<?php

use App\Models\Profile;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('check_in_time');
            $table->string('status')->default('hadir');
            $table->enum('departemen', Profile::DEPARTMENTS);
            $table->timestamps();

            $table->index('check_in_time');
            $table->index('departemen');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
