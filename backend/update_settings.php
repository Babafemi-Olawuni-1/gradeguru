<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers/db.php';

$settings = [
    'pro_price_monthly'          => '10000',
    'enterprise_price_monthly'   => '30000',
    'pro_price_annual'           => '80000',
    'enterprise_price_annual'    => '240000',
    'billing_period'             => 'per_term',
    'bulk_email_pro_limit'       => '500',
    'bulk_email_enterprise_limit'=> 'unlimited',
    'pin_price_starter'          => '100',
    'pin_price_pro'              => '80',
    'pin_price_enterprise'       => '50',
];

foreach ($settings as $key => $value) {
    $exists = fetchOne('SELECT id FROM platform_settings WHERE setting_key = ?', [$key]);
    if ($exists) {
        query('UPDATE platform_settings SET setting_value = ? WHERE setting_key = ?', [$value, $key]);
    } else {
        query('INSERT INTO platform_settings (setting_key, setting_value) VALUES (?, ?)', [$key, $value]);
    }
    echo "Set $key = $value\n";
}

echo "\nAll settings updated.\n";
