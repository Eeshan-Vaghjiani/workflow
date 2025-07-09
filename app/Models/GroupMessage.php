<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class GroupMessage extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'group_id',
        'user_id',
        'message',
        'parent_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the user that owns the message.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the group that owns the message.
     */
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    /**
     * Get the parent message if this is a reply.
     */
    public function parent()
    {
        return $this->belongsTo(GroupMessage::class, 'parent_id');
    }

    /**
     * Get all replies to this message.
     */
    public function replies()
    {
        return $this->hasMany(GroupMessage::class, 'parent_id');
    }

    /**
     * Get all attachments for this message.
     */
    public function attachments()
    {
        return $this->hasMany(MessageAttachment::class, 'message_id')
            ->where('message_type', 'group');
    }

    /**
     * Check if this message has been pinned.
     */
    public function pins()
    {
        return $this->hasMany(PinnedMessage::class, 'message_id')
            ->where('message_type', 'group');
    }
} 