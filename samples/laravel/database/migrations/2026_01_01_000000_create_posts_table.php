<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class {
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->string('title');
            $table->text('body')->nullable();
            $table->unsignedInteger('views');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }
};
