<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Log;

class Group extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'avatar',
        'owner_id',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    public function joinRequests()
    {
        return $this->belongsToMany(User::class, 'group_join_requests')
            ->withTimestamps();
    }

    public function assignments()
    {
        return $this->hasMany(GroupAssignment::class);
    }

    public function tasks()
    {
        return $this->hasManyThrough(GroupTask::class, GroupAssignment::class);
    }

    public function chatMessages()
    {
        return $this->hasMany(GroupChatMessage::class);
    }

    public function isLeader($user)
    {
        $userId = $user instanceof User ? $user->id : $user;
        
        $member = $this->members()
            ->where('user_id', $userId)
            ->first();
            
        Log::info('Group isLeader check', [
            'user_id' => $userId,
            'group_id' => $this->id,
            'member_role' => $member ? $member->pivot->role : null,
            'is_leader' => $member && $member->pivot->role === 'leader'
        ]);
        
        return $member && $member->pivot->role === 'leader';
    }

    public function isMember($user)
    {
        $userId = $user instanceof User ? $user->id : $user;
        
        return $this->members()
            ->where('user_id', $userId)
            ->exists();
    }

    public function hasJoinRequest($user)
    {
        $userId = $user instanceof User ? $user->id : $user;
        
        return $this->joinRequests()
            ->where('user_id', $userId)
            ->exists();
    }
}
