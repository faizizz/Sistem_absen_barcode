<?php

namespace App\Concerns;

trait NormalizesStrings
{
    protected function squish(?string $value): string
    {
        return (string) str((string) $value)->squish();
    }

    protected function squishLower(?string $value): string
    {
        return (string) str((string) $value)->squish()->lower();
    }
}
