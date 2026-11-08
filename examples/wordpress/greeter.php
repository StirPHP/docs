<?php
/**
 * Plugin Name: Greeter
 */

function greeter_title(string $title, int $post_id): string
{
    return $title . ' #' . $post_id;
}
add_filter('the_title', 'greeter_title', 10, 2);
add_filter('greeter_name', 'greeter_title', 10, 2);
add_action('init', 'greeter_setup');

function greeter_render(): string
{
    global $wpdb;
    $count = $wpdb->get_vr('SELECT COUNT(*) FROM wp_posts');
    return apply_filters('greeter_name', 'Ana') . $count;
}
