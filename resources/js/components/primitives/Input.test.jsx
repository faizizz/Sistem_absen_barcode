import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
    it('does not override caller padding on focus', () => {
        render(
            <Input
                aria-label="Password"
                className="pl-10 pr-12"
            />,
        );

        const input = screen.getByLabelText('Password');

        expect(input).toHaveClass('pl-10');
        expect(input).toHaveClass('pr-12');
        expect(input.className).not.toContain('focus:px-');
        expect(input.className).not.toContain('focus:py-');
    });
});
