<?php
function respond(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function success(mixed $data = null, string $message = 'Success', int $code = 200): void {
    respond(['success' => true, 'message' => $message, 'data' => $data], $code);
}

function error(string $message, int $code = 400, array $errors = []): void {
    respond(['success' => false, 'message' => $message, 'errors' => $errors], $code);
}

function paginate(array $items, int $total, int $page, int $perPage): array {
    return [
        'items'       => $items,
        'total'       => $total,
        'page'        => $page,
        'per_page'    => $perPage,
        'total_pages' => (int) ceil($total / $perPage),
    ];
}
