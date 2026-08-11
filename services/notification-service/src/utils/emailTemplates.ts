import { OrderEventPayload } from '../types/notification.types';

export const buildOrderCreatedTemplate = (payload: OrderEventPayload): string => {
  const itemsHtml = (payload.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-size: 14px; color: #1F2937;">
          <strong>${item.productName}</strong>
          <br/><span style="color: #6B7280; font-size: 12px;">ID: ${item.productId}</span>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-size: 14px; color: #4B5563; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-size: 14px; color: #4B5563; text-align: right;">
          $${item.price.toFixed(2)}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-size: 14px; font-weight: bold; color: #111827; text-align: right;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6; padding: 40px 10px;">
        <tr>
          <td align="center">
            <!-- Main Card Container -->
            <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);">
              
              <!-- Header Banner -->
              <tr>
                <td style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 32px 24px; text-align: center;">
                  <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 20px; color: #FFFFFF; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                    ⚡ Cloud Order Orchestrator
                  </div>
                  <h1 style="color: #FFFFFF; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                    Order Confirmed! 🎉
                  </h1>
                  <p style="color: #E0E7FF; margin: 8px 0 0 0; font-size: 14px;">
                    Order #${payload.orderId}
                  </p>
                </td>
              </tr>

              <!-- Greeting Body -->
              <tr>
                <td style="padding: 32px 32px 16px 32px;">
                  <p style="font-size: 16px; color: #1F2937; margin: 0 0 12px 0;">
                    Hello <strong>User ${payload.userId}</strong>,
                  </p>
                  <p style="font-size: 14px; color: #4B5563; line-height: 1.6; margin: 0;">
                    Thank you for your purchase! We've received your order and are currently processing it. Here is your official order receipt summary:
                  </p>
                </td>
              </tr>

              <!-- Items Table -->
              <tr>
                <td style="padding: 16px 32px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background-color: #F9FAFB; border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB;">
                    <thead>
                      <tr style="background-color: #EEF2FF;">
                        <th style="padding: 12px 16px; font-size: 12px; text-transform: uppercase; color: #3730A3; text-align: left;">Item</th>
                        <th style="padding: 12px 16px; font-size: 12px; text-transform: uppercase; color: #3730A3; text-align: center;">Qty</th>
                        <th style="padding: 12px 16px; font-size: 12px; text-transform: uppercase; color: #3730A3; text-align: right;">Price</th>
                        <th style="padding: 12px 16px; font-size: 12px; text-transform: uppercase; color: #3730A3; text-align: right;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Total Breakdown & Shipping Card -->
              <tr>
                <td style="padding: 16px 32px 32px 32px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <!-- Shipping Address Card -->
                      <td width="55%" valign="top" style="padding-right: 12px;">
                        <div style="background-color: #F9FAFB; border-radius: 12px; padding: 16px; border: 1px solid #E5E7EB;">
                          <div style="font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase; margin-bottom: 8px;">
                            📍 Shipping Address
                          </div>
                          <div style="font-size: 13px; color: #1F2937; line-height: 1.5;">
                            ${payload.shippingAddress || 'N/A'}
                          </div>
                        </div>
                      </td>
                      
                      <!-- Total Breakdown Card -->
                      <td width="45%" valign="top" style="padding-left: 12px;">
                        <div style="background-color: #EEF2FF; border-radius: 12px; padding: 16px; border: 1px solid #C7D2FE; text-align: right;">
                          <div style="font-size: 12px; color: #4338CA; font-weight: 600;">Order Total</div>
                          <div style="font-size: 24px; font-weight: 800; color: #312E81; margin: 4px 0 8px 0;">
                            $${(payload.totalAmount || 0).toFixed(2)}
                          </div>
                          <span style="display: inline-block; background-color: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px;">
                            Status: PENDING
                          </span>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td align="center" style="padding: 0 32px 32px 32px;">
                  <a href="http://localhost:3000/api/orders/${payload.orderId}" style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                    View Order Status →
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #F9FAFB; padding: 24px 32px; text-align: center; border-top: 1px solid #E5E7EB;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #6B7280;">
                    You are receiving this automated transaction email from <strong>Cloud Order Orchestrator</strong>.
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #9CA3AF;">
                    © 2026 Distributed Microservices Architecture • Portfolio Showcase
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const buildOrderStatusUpdatedTemplate = (payload: OrderEventPayload): string => {
  let statusBadgeColor = '#3B82F6';
  let statusBgColor = '#EFF6FF';
  let statusTextColor = '#1E40AF';

  if (payload.status === 'PROCESSING') {
    statusBadgeColor = '#6366F1';
    statusBgColor = '#EEF2FF';
    statusTextColor = '#3730A3';
  } else if (payload.status === 'SHIPPED') {
    statusBadgeColor = '#0EA5E9';
    statusBgColor = '#F0F9FF';
    statusTextColor = '#0369A1';
  } else if (payload.status === 'DELIVERED') {
    statusBadgeColor = '#10B981';
    statusBgColor = '#ECFDF5';
    statusTextColor = '#065F46';
  } else if (payload.status === 'CANCELLED') {
    statusBadgeColor = '#EF4444';
    statusBgColor = '#FEF2F2';
    statusTextColor = '#991B1B';
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Status Update</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);">
              
              <!-- Header Banner -->
              <tr>
                <td style="background: linear-gradient(135deg, #111827 0%, #1F2937 100%); padding: 32px 24px; text-align: center;">
                  <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); padding: 8px 16px; border-radius: 20px; color: #FFFFFF; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                    ⚡ Cloud Order Orchestrator
                  </div>
                  <h1 style="color: #FFFFFF; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                    Order Status Update 📦
                  </h1>
                  <p style="color: #9CA3AF; margin: 8px 0 0 0; font-size: 14px;">
                    Order #${payload.orderId}
                  </p>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 32px;">
                  <p style="font-size: 16px; color: #1F2937; margin: 0 0 16px 0;">
                    Hello <strong>User ${payload.userId}</strong>,
                  </p>
                  <p style="font-size: 14px; color: #4B5563; line-height: 1.6; margin: 0 0 24px 0;">
                    The status of your order <strong>#${payload.orderId}</strong> has been updated. Here are the latest status details:
                  </p>

                  <!-- Status Highlight Card -->
                  <div style="background-color: ${statusBgColor}; border-left: 5px solid ${statusBadgeColor}; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                    <div style="font-size: 12px; color: ${statusTextColor}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">New Status</div>
                    <div style="font-size: 22px; font-weight: 800; color: ${statusTextColor}; margin-top: 4px;">
                      ${payload.status}
                    </div>
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin-top: 32px;">
                    <a href="http://localhost:3000/api/orders/${payload.orderId}" style="display: inline-block; background-color: #111827; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 10px;">
                      Track Order in Dashboard →
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #F9FAFB; padding: 24px 32px; text-align: center; border-top: 1px solid #E5E7EB;">
                  <p style="margin: 0; font-size: 11px; color: #9CA3AF;">
                    © 2026 Distributed Microservices Architecture • Portfolio Showcase
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
