'use client';

import { usePostHog } from 'posthog-js/react';
import { type FormEvent, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'adq-subscribed';

type Status = 'idle' | 'loading' | 'success' | 'error' | 'invalid';

export function EmailSignup() {
	const [status, setStatus] = useState<Status>('idle');
	const [hidden, setHidden] = useState(true);
	const inputRef = useRef<HTMLInputElement>(null);
	const posthog = usePostHog();

	useEffect(() => {
		setHidden(localStorage.getItem(STORAGE_KEY) === '1');
	}, []);

	if (hidden) return null;

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const email = inputRef.current?.value.trim() ?? '';

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setStatus('invalid');
			return;
		}

		setStatus('loading');
		posthog?.capture('email_signup_submitted');

		try {
			const res = await fetch('/api/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});

			if (!res.ok) throw new Error();

			setStatus('success');
			localStorage.setItem(STORAGE_KEY, '1');
			posthog?.capture('email_signup_success');
		} catch {
			setStatus('error');
		}
	}

	return (
		<section className="signup" aria-labelledby="signup-heading">
			{status === 'success' ? (
				<p className="signup-confirmed">
					You're in — look for us weekday mornings.
				</p>
			) : (
				<>
					<h2 id="signup-heading" className="signup-heading">
						Get each question in your inbox
					</h2>
					<p className="signup-sub">
						One foundational AI question, every weekday morning.
					</p>
					<form className="signup-form" onSubmit={handleSubmit} noValidate>
						<label htmlFor="signup-email" className="sr-only">
							Email address
						</label>
						<input
							ref={inputRef}
							id="signup-email"
							type="email"
							placeholder="you@example.com"
							autoComplete="email"
							required
							className={`signup-input ${status === 'invalid' ? 'signup-input--error' : ''}`}
							aria-invalid={status === 'invalid' || undefined}
							aria-describedby={
								status === 'invalid' || status === 'error'
									? 'signup-feedback'
									: undefined
							}
							disabled={status === 'loading'}
						/>
						<button
							type="submit"
							className="signup-btn"
							disabled={status === 'loading'}
						>
							{status === 'loading' ? 'Subscribing…' : 'Subscribe'}
						</button>
					</form>
					<div
						id="signup-feedback"
						aria-live="polite"
						className="signup-feedback"
					>
						{status === 'invalid' && (
							<p className="signup-error">Enter a valid email address.</p>
						)}
						{status === 'error' && (
							<p className="signup-error">Something went wrong. Try again?</p>
						)}
					</div>
				</>
			)}
		</section>
	);
}
