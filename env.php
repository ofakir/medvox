<?php
// Fichier : env.php
// Lit les variables d'environnement (serveur) ou le fichier .env local (jamais commité).
// Les clés API ne doivent JAMAIS être écrites directement dans le code.

if (!function_exists('env')) {
    function env(string $key, ?string $default = null): ?string
    {
        static $fileVars = null;

        $value = getenv($key);
        if ($value !== false && $value !== '') {
            return $value;
        }

        if ($fileVars === null) {
            $fileVars = [];
            $path = __DIR__ . '/.env';
            if (is_readable($path)) {
                foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                    $line = trim($line);
                    if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
                        continue;
                    }
                    [$k, $v] = array_map('trim', explode('=', $line, 2));
                    $fileVars[$k] = trim($v, "\"'");
                }
            }
        }

        return $fileVars[$key] ?? $default;
    }
}
