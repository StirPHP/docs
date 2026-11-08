<?php

declare(strict_types=1);

namespace App;

final class Mailer
{
    public function send(string $to, string $subject): bool
    {
        return $to !== '' && $subject !== '';
    }

    public function retryTodo(): void {}
}
