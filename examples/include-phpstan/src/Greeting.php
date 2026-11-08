<?php

function greeting(?string $name): string
{
    return 'Hello, ' . ucfirst($name);
}
