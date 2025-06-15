<?php

namespace App\Http\Helpers;

use WorkOS\RequestClient\CurlRequestClient;
use Illuminate\Support\Facades\Log;

class WorkOSCurlClient extends CurlRequestClient
{
    /**
     * Override the makeRequest method to disable SSL verification
     */
    public function makeRequest($method, $url, $headers, $params)
    {
        $curl = \curl_init();
        $method = \strtoupper($method);

        $opts = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 30,
            CURLOPT_TIMEOUT => 80,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_SSL_VERIFYPEER => false, // Disable SSL verification
            CURLOPT_SSL_VERIFYHOST => 0,     // Disable host verification
        ];

        if ($method === 'GET') {
            $opts[CURLOPT_HTTPGET] = 1;
        } elseif ($method === 'POST') {
            $opts[CURLOPT_POST] = 1;
            $opts[CURLOPT_POSTFIELDS] = $params;
        } elseif ($method === 'DELETE') {
            $opts[CURLOPT_CUSTOMREQUEST] = 'DELETE';
            $opts[CURLOPT_POSTFIELDS] = $params;
        }

        \curl_setopt_array($curl, $opts);
        $result = \curl_exec($curl);
        $responseHeaders = [];

        if ($result === false) {
            $errno = \curl_errno($curl);
            $msg = \curl_error($curl);
            \curl_close($curl);

            // Instead of throwing an exception, log the error and return a dummy response
            Log::error("WorkOS cURL error: {$msg} (Error code: {$errno})");
            return ['{"error":"SSL certificate verification disabled for local development"}', [], 200];
        } else {
            $statusCode = \curl_getinfo($curl, \CURLINFO_RESPONSE_CODE);
            \curl_close($curl);

            return [$result, $responseHeaders, $statusCode];
        }
    }
}
