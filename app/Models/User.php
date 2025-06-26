<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'last_login_at',
        'workos_id',
        'avatar',
        'is_admin',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'workos_id',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Get the groups that the user belongs to.
     */
    public function groups()
    {
        return $this->belongsToMany(Group::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Get the user's Google Calendar connection.
     */
    public function googleCalendar()
    {
        return $this->hasOne(GoogleCalendar::class);
    }

    public function user()
    {
        // This is a self-referential relationship, needed for compatibility
        return $this->belongsTo(User::class);
    }

    /**
     * Determine if two-factor authentication has been enabled.
     */
    public function hasTwoFactorEnabled(): bool
    {
        return ! is_null($this->two_factor_confirmed_at);
    }

    /**
     * Get the user's two-factor recovery codes.
     */
    public function recoveryCodes(): array
    {
        return json_decode(decrypt($this->two_factor_recovery_codes), true);
    }

    /**
     * Replace the user's recovery codes.
     */
    public function replaceRecoveryCodes(array $codes): void
    {
        $this->forceFill([
            'two_factor_recovery_codes' => encrypt(json_encode($codes)),
        ])->save();
    }

    /**
     * Generate new recovery codes for the user.
     */
    public function generateRecoveryCodes(): void
    {
        $this->forceFill([
            'two_factor_recovery_codes' => encrypt(json_encode(Collection::times(8, function () {
                return sprintf('%s-%s-%s-%s',
                    $this->generateRecoveryCodeSegment(),
                    $this->generateRecoveryCodeSegment(),
                    $this->generateRecoveryCodeSegment(),
                    $this->generateRecoveryCodeSegment()
                );
            })->all())),
        ])->save();
    }

    /**
     * Generate a new recovery code segment.
     */
    protected function generateRecoveryCodeSegment(): string
    {
        return strtoupper(substr(bin2hex(random_bytes(3)), 0, 4));
    }

    /**
     * Check if the user is an admin.
     */
    public function isAdmin(): bool
    {
        // Cast to boolean and handle both 1/0 and true/false
        return $this->is_admin == true;
    }
}
