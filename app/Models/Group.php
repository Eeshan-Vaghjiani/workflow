<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Group extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'created_by',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'group_user', 'group_id', 'user_id')
            ->withPivot('is_leader')
            ->withTimestamps();
    }

    public function assignments()
    {
        return $this->hasMany(GroupAssignment::class);
    }

    public function chatMessages()
    {
        return $this->hasMany(GroupChatMessage::class);
    }

    public function isLeader($user)
    {
        $userId = $user instanceof User ? $user->id : $user;
        
        return $this->members()
            ->where('user_id', $userId)
            ->where('is_leader', true)
            ->exists();
    }

    public function isMember($user)
    {
        $userId = $user instanceof User ? $user->id : $user;
        
        return $this->members()
            ->where('user_id', $userId)
            ->exists();
    }
}
