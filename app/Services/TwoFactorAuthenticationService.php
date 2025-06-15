<?php

namespace App\Services;

use App\Models\User;
use BaconQrCode\Renderer\Color\Rgb;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\Fill;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorAuthenticationService
{
    /**
     * The Google2FA instance.
     */
    protected $engine;

    /**
     * Create a new two factor authentication provider instance.
     */
    public function __construct()
    {
        $this->engine = new Google2FA();
    }

    /**
     * Generate a new secret key.
     */
    public function generateSecretKey(): string
    {
        return $this->engine->generateSecretKey();
    }

    /**
     * Get the current one time password for a key.
     */
    public function getCurrentOtp(string $secret): string
    {
        return $this->engine->getCurrentOtp($secret);
    }

    /**
     * Verify the given code.
     */
    public function verify(string $secret, string $code): bool
    {
        return $this->engine->verifyKey($secret, $code);
    }

    /**
     * Get a Google2FA QR code URL.
     */
    public function qrCodeUrl(string $companyName, string $companyEmail, string $secret): string
    {
        return $this->engine->getQRCodeUrl($companyName, $companyEmail, $secret);
    }

    /**
     * Get a Google2FA QR code SVG.
     */
    public function qrCodeSvg(string $companyName, string $companyEmail, string $secret): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle(192, 0, null, null, Fill::uniformColor(new Rgb(255, 255, 255), new Rgb(45, 55, 72))),
            new SvgImageBackEnd()
        );

        $writer = new Writer($renderer);

        return $writer->writeString($this->qrCodeUrl(
            $companyName,
            $companyEmail,
            $secret
        ));
    }

    /**
     * Enable two-factor authentication for the user.
     */
    public function enable(User $user, string $secret): void
    {
        $user->forceFill([
            'two_factor_secret' => encrypt($secret),
            'two_factor_confirmed_at' => now(),
        ])->save();
    }

    /**
     * Disable two-factor authentication for the user.
     */
    public function disable(User $user): void
    {
        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();
    }

    /**
     * Get the decrypted two-factor secret.
     */
    public function getDecryptedSecret(User $user): ?string
    {
        if (! $user->two_factor_secret) {
            return null;
        }

        return decrypt($user->two_factor_secret);
    }
}
