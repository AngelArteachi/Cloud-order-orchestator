import crypto from 'crypto';

export const generateWebhookSignature = (payload: unknown, secret: string): string => {
  const jsonPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(jsonPayload).digest('hex');
};

export const verifyWebhookSignature = (
  payload: unknown,
  signature: string,
  secret: string
): boolean => {
  try {
    const expectedSignature = generateWebhookSignature(payload, secret);
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
};
