<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageAttachment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'message_id',
        'message_type',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
    ];

    /**
     * Get the direct message if this attachment is for a direct message.
     */
    public function directMessage()
    {
        if ($this->message_type === 'direct') {
            return $this->belongsTo(DirectMessage::class, 'message_id');
        }
        return null;
    }

    /**
     * Get the group message if this attachment is for a group message.
     */
    public function groupMessage()
    {
        if ($this->message_type === 'group') {
            return $this->belongsTo(GroupMessage::class, 'message_id');
        }
        return null;
    }
}
