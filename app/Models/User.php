<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

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
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
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
}
