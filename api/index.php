<?php

// Force the configuration and view cache paths to live in Vercel's writable memory space
$_ENV['APP_CONFIG_CACHE'] = '/tmp/config.php';
$_ENV['VIEW_COMPILED_PATH'] = '/tmp';

require __DIR__ . '/../public/index.php';