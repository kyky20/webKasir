<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Store extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'phone',
        'email',
        'logo',
        'currency',
        'timezone',
        'tax_percentage',
        'receipt_header',
        'receipt_footer',
        'receipt_paper_size',
        'show_cashier_name',
    ];

    protected $casts = [
        'tax_percentage' => 'decimal:2',
        'show_cashier_name' => 'boolean',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
