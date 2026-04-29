<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeocodingService
{
    private const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

    /**
     * Geocode a Philippine address → ['lat' => float, 'lng' => float] or null
     */
    public function geocode(string $address): ?array
    {
        try {
            $response = Http::timeout(5)
                ->withHeaders(['User-Agent' => 'FoodBankApp/1.0 (contact@foodbank.ph)'])
                ->get(self::NOMINATIM_URL, [
                    'q'            => $address . ', Philippines',
                    'format'       => 'json',
                    'limit'        => 1,
                    'countrycodes' => 'ph',
                ]);

            $results = $response->json();

            if (!empty($results)) {
                return [
                    'lat' => (float) $results[0]['lat'],
                    'lng' => (float) $results[0]['lon'],
                ];
            }
        } catch (\Exception $e) {
            Log::warning('Geocoding failed: ' . $address . ' — ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Haversine distance between two lat/lng points, in kilometers.
     */
    public function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R    = 6371; // Earth radius km
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a    = sin($dLat/2)**2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng/2)**2;
        return $R * 2 * atan2(sqrt($a), sqrt(1-$a));
    }
}
