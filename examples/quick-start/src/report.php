<?php

namespace App;

function underline(Invoice $invoice): string
{
    $width = $invoice->find(100);
    return str_repeat('-', $width);
}
