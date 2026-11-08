<?php

declare(strict_types=1);

namespace App;

$container = new Container();
$container->set(new Mailer());

$mailer = $container->get(Mailer::class);
$sent = $mailer->send('ana@example.com', 'Hello');
$mailer->sendLater('ana@example.com');
$mailer->send('ana@example.com', 42);

var_dump($sent);
