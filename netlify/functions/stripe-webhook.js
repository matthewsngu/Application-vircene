/**
 * Stripe webhook — active / désactive Premium dans Supabase.
 * URL prod : https://TON_SITE.netlify.app/.netlify/functions/stripe-webhook
 */
const Stripe = require('stripe');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceKey) {
    return { statusCode: 500, body: 'Missing env vars' };
  }

  const stripe = Stripe(stripeSecret);
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      event.headers['stripe-signature'],
      webhookSecret
    );
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  async function patchProfile(filterQuery, body) {
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?${filterQuery}`, {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        ...body,
        updated_at: new Date().toISOString()
      })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase PATCH failed (${res.status}): ${text}`);
    }
  }

  async function setPlan({ userId, email, plan, customerId }) {
    const payload = {
      plan,
      stripe_customer_id: customerId || null
    };

    if (userId) {
      await patchProfile(`id=eq.${encodeURIComponent(userId)}`, payload);
      return;
    }

    if (email) {
      await patchProfile(`email=eq.${encodeURIComponent(email)}`, payload);
    }
  }

  async function setPlanFromCustomer(customerId, plan) {
    if (!customerId) return;
    const customer = await stripe.customers.retrieve(customerId);
    const email = customer.email || null;
    const userId = customer.metadata?.supabase_user_id || null;
    await setPlan({ userId, email, plan, customerId });
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        const email = session.customer_details?.email || session.customer_email || null;
        const userId = session.client_reference_id || session.metadata?.supabase_user_id || null;
        await setPlan({
          userId,
          email,
          plan: 'premium',
          customerId: session.customer
        });
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = stripeEvent.data.object;
        const active = sub.status === 'active' || sub.status === 'trialing';
        await setPlanFromCustomer(sub.customer, active ? 'premium' : 'free');
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = stripeEvent.data.object;
        await setPlanFromCustomer(sub.customer, 'free');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object;
        if (invoice.customer) {
          await setPlanFromCustomer(invoice.customer, 'free');
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('stripe-webhook handler error', err);
    return { statusCode: 500, body: err.message };
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
