export function decodeJWT(token: string): {
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	signature: string;
} {
	const parts = token.split('.');

	if (parts.length !== 3) {
		throw new Error('Invalid JWT format');
	}

	const [headerB64, payloadB64, signature] = parts;

	// Base64URL decode function
	const base64UrlDecode = (str: string): string => {
		// Replace URL-safe characters with standard base64 characters
		let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

		// Pad with '=' to make length multiple of 4
		while (base64.length % 4) {
			base64 += '=';
		}

		// Decode base64 and handle UTF-8
		return decodeURIComponent(
			atob(base64)
				.split('')
				.map((character) => '%' + ('00' + character.charCodeAt(0).toString(16)).slice(-2))
				.join(''),
		);
	};

	try {
		const header = JSON.parse(base64UrlDecode(headerB64));
		const payload = JSON.parse(base64UrlDecode(payloadB64));

		return {
			header,
			payload,
			signature,
		};
	} catch (error) {
		throw new Error('Failed to decode JWT: ' + (error as Error).message);
	}
}
