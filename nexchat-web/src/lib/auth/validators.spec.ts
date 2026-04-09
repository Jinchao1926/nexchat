import { describe, expect, it } from 'vitest';

import { validateAuthInput } from './validators';

describe('validateAuthInput', () => {
	it('returns errors for invalid email and short password', () => {
		expect(validateAuthInput({ email: 'bad', password: '123' })).toEqual({
			email: 'Enter a valid email address',
			password: 'Password must be at least 6 characters'
		});
	});

	it('returns no errors for valid credentials', () => {
		expect(validateAuthInput({ email: 'user@example.com', password: '123456' })).toEqual({});
	});
});
