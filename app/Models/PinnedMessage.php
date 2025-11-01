<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PinnedMessage extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'message_id',
        'message_type',
        'chat_id',
    ];

    /**
     * Get the user who pinned the message.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the direct message if this pin is for a direct message.
     */
    public function directMessage()
    {
        if ($this->message_type === 'direct') {
            return $this->belongsTo(DirectMessage::class, 'message_id');
        }
        return null;
    }

    /**
     * Get the group message if this pin is for a group message.
     */
    public function groupMessage()
    {
        if ($this->message_type === 'group') {
            return $this->belongsTo(GroupMessage::class, 'message_id');
        }
        return null;
    }
}
