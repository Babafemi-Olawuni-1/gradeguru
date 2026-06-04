<?php
function validate(array $data, array $rules): array {
    $errors = [];
    foreach ($rules as $field => $rule) {
        $value = $data[$field] ?? null;
        $parts = explode('|', $rule);
        foreach ($parts as $part) {
            [$r, $param] = array_pad(explode(':', $part, 2), 2, null);
            switch ($r) {
                case 'required':
                    if ($value === null || $value === '') $errors[$field] = "$field is required";
                    break;
                case 'email':
                    if ($value && !filter_var($value, FILTER_VALIDATE_EMAIL)) $errors[$field] = "$field must be a valid email";
                    break;
                case 'min':
                    if ($value !== null && strlen((string)$value) < (int)$param) $errors[$field] = "$field must be at least $param characters";
                    break;
                case 'max':
                    if ($value !== null && strlen((string)$value) > (int)$param) $errors[$field] = "$field must not exceed $param characters";
                    break;
                case 'numeric':
                    if ($value !== null && !is_numeric($value)) $errors[$field] = "$field must be numeric";
                    break;
                case 'slug':
                    if ($value && !preg_match('/^[a-z0-9\-]{3,60}$/', $value)) $errors[$field] = "$field must be 3-60 lowercase letters, numbers, or hyphens";
                    break;
                case 'in':
                    $allowed = explode(',', $param);
                    if ($value && !in_array($value, $allowed)) $errors[$field] = "$field must be one of: $param";
                    break;
            }
            if (isset($errors[$field])) break;
        }
    }
    return $errors;
}

function body(): array {
    $raw = file_get_contents('php://input');
    if ($raw) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) return $decoded;
    }
    // Fallback to $_POST for form submissions
    return $_POST ?: [];
}
