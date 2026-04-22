<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Models\FinancialDonationRecord;
use App\Models\FinancialDonation;
use App\Services\PayMongoService;

class FinancialDonationController extends Controller
{
    // ══════════════════════════════════════════════════════════════════
    // DONOR — Manual submission (receipt upload)
    //         → saved to financial_donation_records, staff reviews it
    // ══════════════════════════════════════════════════════════════════
    public function store(Request $request)
    {
        $request->validate([
            'payment_method' => 'required|in:GCash,Bank Transfer',
            'receipt'        => 'required|file|mimes:jpeg,jpg,png,webp,pdf|max:5120',
            'receipt_number' => 'required|string|max:100',
            'amount'         => 'required|numeric|min:1',
            'date'           => 'required|date',
            'time'           => 'required',
            'message'        => 'nullable|string|max:1000',
        ]);

        $receiptPath = $request->file('receipt')
            ->store('financial-records/receipts', 'public');

        $donatedAt = $request->date . ' ' . $request->time . ':00';

        $record = FinancialDonationRecord::create([
            'user_id'        => $request->user()->id,
            'payment_type'   => 'manual',
            'payment_method' => $request->payment_method,
            'receipt_path'   => $receiptPath,
            'receipt_number' => $request->receipt_number,
            'amount'         => $request->amount,
            'donated_at'     => $donatedAt,
            'message'        => $request->message ?? null,
            'status'         => 'pending',
        ]);

        return response()->json([
            'message' => 'Financial donation submitted for staff review.',
            'record'  => $record,
        ], 201);
    }

    // ══════════════════════════════════════════════════════════════════
    // DONOR — Create a PayMongo Payment Link
    //         Donor clicks "Pay Now" → gets redirected to PayMongo checkout
    // ══════════════════════════════════════════════════════════════════
    public function createPaymentLink(Request $request)
    {
        $request->validate([
            'amount'  => 'required|numeric|min:1',
            'message' => 'nullable|string|max:1000',
        ]);

        $paymongo = new PayMongoService();

        try {
            $link = $paymongo->createPaymentLink(
                amount:      (float) $request->amount,
                description: 'Food Bank Financial Donation',
                remarks:     $request->message ?? 'Thank you for your generosity!'
            );
        } catch (\Exception $e) {
            Log::error('PayMongo link creation failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Could not create payment link. Please try again.'], 500);
        }

        // Pre-create the donation record so we can match it when the webhook fires
        $record = FinancialDonationRecord::create([
            'user_id'          => $request->user()->id,
            'payment_type'     => 'paymongo',
            'payment_method'   => null,        // filled by webhook (gcash / card / etc.)
            'amount'           => $request->amount,
            'message'          => $request->message ?? null,
            'paymongo_link_id' => $link['link_id'],
            'status'           => 'pending',   // webhook will auto-approve on payment
        ]);

        return response()->json([
            'message'      => 'Payment link created.',
            'checkout_url' => $link['checkout_url'],
            'record_id'    => $record->id,
        ], 201);
    }

    // ══════════════════════════════════════════════════════════════════
    // PAYMONGO WEBHOOK — called by PayMongo when a payment link is paid
    //                    → auto-approves the record, adds to financial_donations
    // Route: POST /api/paymongo/webhook  (public, no auth)
    // ══════════════════════════════════════════════════════════════════
    public function handleWebhook(Request $request)
    {
        $rawPayload       = $request->getContent();
        $signatureHeader  = $request->header('Paymongo-Signature', '');

        // ── Verify signature ───────────────────────────────────────────────
        $paymongo = new PayMongoService();

        if ($signatureHeader && !$paymongo->verifyWebhookSignature($rawPayload, $signatureHeader)) {
            Log::warning('PayMongo webhook signature mismatch.');
            return response()->json(['message' => 'Invalid signature.'], 401);
        }

        $event = $request->json()->all();
        $type  = $event['data']['attributes']['type'] ?? null;

        Log::info('PayMongo webhook received', ['type' => $type]);

        // ── Handle: link.payment.paid ──────────────────────────────────────
        if ($type === 'link.payment.paid') {
            $parsed = $paymongo->parseLinkPaymentPaid($event);

            // Find the pre-created record by link ID
            $record = FinancialDonationRecord::where('paymongo_link_id', $parsed['link_id'])
                ->where('status', 'pending')
                ->first();

            if (!$record) {
                Log::warning('PayMongo webhook: no matching record for link', ['link_id' => $parsed['link_id']]);
                return response()->json(['message' => 'Record not found.'], 404);
            }

            // Update the record with confirmed payment details
            $record->update([
                'status'             => 'approved',
                'payment_method'     => $parsed['payment_method'],
                'receipt_number'     => $parsed['reference_number'],
                'donated_at'         => $parsed['paid_at'],
                'paymongo_payment_id'=> $parsed['payment_id'],
            ]);

            // Add to financial_donations (the confirmed "bank" table)
            FinancialDonation::create([
                'financial_donation_record_id' => $record->id,
                'user_id'                      => $record->user_id,
                'payment_type'                 => 'paymongo',
                'payment_method'               => $parsed['payment_method'],
                'receipt_number'               => $parsed['reference_number'],
                'amount'                       => $record->amount,
                'donated_at'                   => $parsed['paid_at'],
                'message'                      => $record->message,
                'paymongo_payment_id'          => $parsed['payment_id'],
            ]);

            Log::info('PayMongo payment auto-approved', [
                'record_id'  => $record->id,
                'payment_id' => $parsed['payment_id'],
                'amount'     => $record->amount,
            ]);
        }

        // Always return 200 to acknowledge receipt
        return response()->json(['message' => 'Webhook received.'], 200);
    }

    // ══════════════════════════════════════════════════════════════════
    // DONOR — View own financial donation records
    // ══════════════════════════════════════════════════════════════════
    public function index(Request $request)
    {
        $records = FinancialDonationRecord::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($records);
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — List all financial donation records
    // ══════════════════════════════════════════════════════════════════
    public function getRecords(Request $request)
    {
        $query = FinancialDonationRecord::with('user')
            ->orderByDesc('created_at');

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%")
                       ->orWhere('email', 'like', "%{$search}%");
                })->orWhere('receipt_number', 'like', "%{$search}%");
            });
        }

        return response()->json($query->get());
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — Approve a MANUAL donation record → moves to financial_donations
    //         (PayMongo donations are auto-approved via webhook, no staff action needed)
    // ══════════════════════════════════════════════════════════════════
    public function approveRecord(Request $request, $id)
    {
        $record = FinancialDonationRecord::findOrFail($id);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Record is no longer pending.'], 422);
        }

        if ($record->payment_type === 'paymongo') {
            return response()->json(['message' => 'PayMongo donations are auto-approved by webhook.'], 422);
        }

        FinancialDonation::create([
            'financial_donation_record_id' => $record->id,
            'user_id'                      => $record->user_id,
            'payment_type'                 => 'manual',
            'payment_method'               => $record->payment_method,
            'receipt_path'                 => $record->receipt_path,
            'receipt_number'               => $record->receipt_number,
            'amount'                       => $record->amount,
            'donated_at'                   => $record->donated_at,
            'message'                      => $record->message,
        ]);

        $record->update([
            'status'      => 'approved',
            'staff_notes' => $request->notes ?? null,
        ]);

        Cache::forget('financial_donation_record_stats');
        Cache::forget('staff_dashboard_stats');

        return response()->json([
            'message' => 'Financial donation approved. Payment confirmed in system.',
        ]);
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — Reject a MANUAL donation record (donor gets refunded)
    // ══════════════════════════════════════════════════════════════════
    public function rejectRecord(Request $request, $id)
    {
        $record = FinancialDonationRecord::findOrFail($id);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Record is no longer pending.'], 422);
        }

        if ($record->payment_type === 'paymongo') {
            return response()->json(['message' => 'PayMongo donations cannot be manually rejected. Use PayMongo dashboard to issue a refund.'], 422);
        }

        $record->update([
            'status'      => 'rejected',
            'staff_notes' => $request->notes ?? null,
        ]);

        Cache::forget('financial_donation_record_stats');

        return response()->json([
            'message' => 'Financial donation rejected. Donor will be refunded.',
        ]);
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — Stats
    // ══════════════════════════════════════════════════════════════════
    public function getRecordStats()
    {
        $stats = Cache::remember('financial_donation_record_stats', 15, fn() => [
            'pending'         => FinancialDonationRecord::where('status', 'pending')->count(),
            'approved'        => FinancialDonationRecord::where('status', 'approved')->count(),
            'rejected'        => FinancialDonationRecord::where('status', 'rejected')->count(),
            'total_amount'    => FinancialDonation::sum('amount'),
            'paymongo_amount' => FinancialDonation::where('payment_type', 'paymongo')->sum('amount'),
            'manual_amount'   => FinancialDonation::where('payment_type', 'manual')->sum('amount'),
        ]);
        return response()->json($stats);
    }
}
