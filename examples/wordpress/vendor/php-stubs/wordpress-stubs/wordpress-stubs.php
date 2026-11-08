<?php
// A few of WordPress's declarations, written for this example; the real ones are in
// php-stubs/wordpress-stubs.

/**
 * @param callable $callback
 */
function add_action(string $hook_name, $callback, int $priority = 10, int $accepted_args = 1): true {}

/**
 * @param callable $callback
 */
function add_filter(string $hook_name, $callback, int $priority = 10, int $accepted_args = 1): true {}

/**
 * @param mixed ...$arg
 */
function do_action(string $hook_name, ...$arg): void {}

/**
 * @param mixed $value
 * @param mixed ...$args
 * @return mixed
 */
function apply_filters(string $hook_name, $value, ...$args) {}

class wpdb
{
    /** @return string|null */
    public function get_var(?string $query = null, int $x = 0, int $y = 0) {}
}
