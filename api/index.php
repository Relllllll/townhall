<?php

// Temporary test marker to prove Vercel is running this file
// if you see this in your browser, it means the routing works!
// echo "Vercel is running our custom entrypoint!"; die();

$_ENV['APP_CONFIG_CACHE'] = '/tmp/config.php';
$_ENV['VIEW_COMPILED_PATH'] = '/tmp';
$_ENV['CACHE_STORE'] = 'array';
$_ENV['CACHE_DRIVER'] = 'array';
$_ENV['LOG_CHANNEL'] = 'stderr';
$_ENV['SESSION_DRIVER'] = 'cookie';

$dbUrl = getenv('POSTGRES_URL') ?: getenv('DATABASE_URL');
if ($dbUrl) {
    $dbParts = parse_url($dbUrl);
    $_ENV['DB_CONNECTION'] = 'pgsql';
    $_ENV['DB_HOST'] = $dbParts['host'] ?? '';
    $_ENV['DB_PORT'] = $dbParts['port'] ?? '5432';
    $_ENV['DB_DATABASE'] = ltrim($dbParts['path'] ?? '', '/');
    $_ENV['DB_USERNAME'] = $dbParts['user'] ?? '';
    $_ENV['DB_PASSWORD'] = $dbParts['pass'] ?? '';
}

require __DIR__ . '/../public/index.php';