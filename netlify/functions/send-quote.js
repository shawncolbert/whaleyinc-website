// Whaley Inc — Quote Request → Slack notifier
// Reads the Slack webhook URL from a Netlify environment variable
// (SLACK_WEBHOOK_URL) so it never lives in the public GitHub repo.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Slack webhook not configured in Netlify env vars' }),
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { name, phone, vehicle, zone, rateRange, vehicleCount, surcharges, estimate } = data;

    const surchargeText = Array.isArray(surcharges) && surcharges.length
      ? surcharges.join(', ')
      : 'None';

    const slackMessage = {
      text:
        `🚚 *New Quote Request — Whaley Inc*\n` +
        `*Name:* ${name || 'N/A'}\n` +
        `*Phone:* ${phone || 'N/A'}\n` +
        `*Vehicle:* ${vehicle || 'N/A'}\n` +
        `*Zone:* ${zone || 'N/A'}\n` +
        `*Rate/Estimate:* ${estimate || rateRange || 'N/A'}\n` +
        `*Vehicle Count:* ${vehicleCount || 1}\n` +
        `*Surcharges:* ${surchargeText}`,
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage),
    });

    if (!res.ok) {
      throw new Error(`Slack webhook returned ${res.status}`);
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
