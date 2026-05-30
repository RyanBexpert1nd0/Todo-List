<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'clerk_org_id', 'name', 'slug'];

    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
