<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use App\Receipt;
use App\Shop\Cart;
use App\Shop\Item;
use App\Shop\Money;

$cart = new Cart();
$cart->add(new Item('Tea', new Money(450)));
$cart->add(new Item('Cups', new Money(1200), '2'));

$tea = $cart->find('Tea');
echo $tea->name, "\n";

echo (new Receipt($cart))->render(42), "\n";
