<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Allow CORS if accessed from different ports (e.g. dev server)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

$action = isset($_GET['action']) ? strtolower(trim($_GET['action'])) : 'metrics';
$scriptPath = __DIR__ . DIRECTORY_SEPARATOR . 'scripts' . DIRECTORY_SEPARATOR . 'get_metrics.ps1';
$cacheDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';

if (!file_exists($cacheDir)) {
    @mkdir($cacheDir, 0777, true);
}

if (!file_exists($scriptPath)) {
    echo json_encode([
        'success' => false,
        'error' => 'PowerShell script not found: ' . $scriptPath
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($action === 'sysinfo') {
    $cacheFile = $cacheDir . DIRECTORY_SEPARATOR . 'sysinfo_cache.json';
    $forceRefresh = isset($_GET['refresh']) && $_GET['refresh'] === '1';

    // Cache valid for 1 hour unless forced
    if (!$forceRefresh && file_exists($cacheFile) && (time() - filemtime($cacheFile) < 3600)) {
        $cachedData = file_get_contents($cacheFile);
        if (!empty($cachedData)) {
            echo $cachedData;
            exit;
        }
    }

    $cmd = 'powershell -NoProfile -ExecutionPolicy Bypass -File ' . escapeshellarg($scriptPath) . ' -Mode sysinfo 2>&1';
    $output = shell_exec($cmd);

    if ($output) {
        $decoded = json_decode($output, true);
        if ($decoded !== null) {
            file_put_contents($cacheFile, json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            echo json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            exit;
        }
    }

    echo json_encode([
        'success' => false,
        'error' => 'Gagal mengambil informasi sistem hardware.',
        'raw' => $output
    ], JSON_PRETTY_PRINT);
    exit;
}

if ($action === 'metrics') {
    $cmd = 'powershell -NoProfile -ExecutionPolicy Bypass -File ' . escapeshellarg($scriptPath) . ' -Mode metrics 2>&1';
    $output = shell_exec($cmd);

    if ($output) {
        $decoded = json_decode($output, true);
        if ($decoded !== null) {
            echo json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            exit;
        }
    }

    echo json_encode([
        'success' => false,
        'error' => 'Gagal membaca metrik sistem secara real-time.',
        'raw' => $output
    ], JSON_PRETTY_PRINT);
    exit;
}

echo json_encode([
    'success' => false,
    'error' => 'Aksi tidak dikenali. Gunakan ?action=metrics atau ?action=sysinfo'
], JSON_PRETTY_PRINT);
