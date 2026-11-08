<?php

namespace App;

use Monolog\Logger;

final class Logs
{
    public function make(): Logger
    {
        return new Logger('app');
    }

    public function broken(): Mailer
    {
        return new Mailer();
    }
}
