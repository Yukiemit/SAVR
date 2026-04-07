<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayMongoService
{
    private string $secretKey;
    private string $baseUrl = 'https://api.paymongo.com/v1';

    public function __construct()
    {
        $this->secretKey = config('services.paymongo.secret_key');
    }

    // ── Auth header (Basic base64(secret_key:)) ──────────────────────────────
    private function authHeader(): string
    {
        return 'Basic ' . base64_encode($this->secretKey . ':');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Create a Payment Link
    // amount     → PHP peso amount (e.g. 500.00)
    // description → shown on PayMongo checkout page
    // Returns: [ 'link_id' => '...', 'checkout_url' => '...', 'reference_number' => '...' ]
    // ══════════════════════════════════════════════════════════════════════════
    public function createPaymentLink(float $amount, string $description, ?string $remarks = null): array
    {
        // PayMongo amounts are in centavos (integers)
        $amountCentavos = (int) round($amount * 100);

        $payload = [
            'data' => [
                'attributes' => [
                    'amount'      => $amountCentavos,
                    'description' => $description,
                    'remarks'     => $remarks ?? 'Food Bank Donation',
                ],
            ],
        ];

        $response = Http::withHeaders([
            'Authorization' => $this->authHeader(),
            'Content-Type'  => 'application/json',
        ])->post("{$this->baseUrl}/links", $payload);

        if ($response->failed()) {
            Log::error('PayMongo createPaymentLink failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \Exception('PayMongo payment link creation failed: ' . $response->body());
        }

        $data = $response->json('data');

        return [
            'link_id'          => $data['id'],
            'checkout_url'     => $data['attributes']['checkout_url'],
            'reference_number' => $data['attributes']['reference_number'],
        ];
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Fetch a Payment Link by ID (to verify status)
    // ══════════════════════════════════════════════════════════════════════════
    public function getPaymentLink(string $linkId): array
    {
        $response = Http::withHeaders([
            'Authorization' => $this->authHeader(),
        ])->get("{$this->baseUrl}/links/{$linkId}");

        if ($response->failed()) {
            throw new \Exception('PayMongo getPaymentLink failed: ' . $response->body());
        }

        return $response->json('data');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Verify webhook signature
    // PayMongo signs webhooks with HMAC-SHA256 using your webhook secret key
    // Header: Paymongo-Signature  (format: t=timestamp,te=token,li=live,lo=liveonly)
    // ══════════════════════════════════════════════════════════════════════════
    public function verifyWebhookSignature(string $rawPayload, string $signatureHeader): bool
    {
        $webhookSecret = config('services.paymongo.webhook_secret');

        if (!$webhookSecret) {
            Log::warning('PayMongo webhook secret not configured.');
            return false;
        }

        // Parse the signature header: t=...,te=...,li=...,lo=...
        $parts = [];
        foreach (explode(',', $signatureHeader) as $part) {
            [$k, $v]   = explode('=', $part, 2);
            $parts[$k] = $v;
        }

        if (!isset($parts['t'])) {
            return false;
        }

        // Compute expected signature: HMAC-SHA256(timestamp.payload, webhookSecret)
        $signedPayload = $parts['t'] . '.' . $rawPayload;
        $expected      = hash_hmac('sha256', $signedPayload, $webhookSecret);

        // Compare against the 'te' (test environment) or 'li' (live) token
        $token = $parts['te'] ?? $parts['li'] ?? '';

        return hash_equals($expected, $token);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Parse a link.payment.paid webhook event
    // Returns structured data about the payment
    // ══════════════════════════════════════════════════════════════════════════
    public function parseLinkPaymentPaid(array $eventData): array
    {
        $linkAttrs   = $eventData['data']['attributes']['data']['attributes'] ?? [];
        $payments    = $linkAttrs['payments'] ?? [];
        $firstPayment = $payments[0] ?? [];
        $payAttrs    = $firstPayment['attributes'] ?? [];

        return [
            'link_id'          => $eventData['data']['attributes']['data']['id'] ?? null,
            'payment_id'       => $firstPayment['id'] ?? null,
            'amount'           => ($payAttrs['amount'] ?? 0) / 100,   // centavos → peso
            'payment_method'   => $payAttrs['source']['type'] ?? 'unknown',
            'reference_number' => $linkAttrs['reference_number'] ?? null,
            'paid_at'          => isset($payAttrs['paid_at'])
                ? date('Y-m-d H:i:s', $payAttrs['paid_at'])
                : now()->toDateTimeString(),
        ];
    }
}
