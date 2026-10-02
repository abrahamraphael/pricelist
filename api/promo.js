export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Promo code is required' });
    }

    // Read promo codes from Vercel Environment Variables
    // Expected PROMO_CODES env format (JSON):
    // {"DIWALI10": {"type": "percent", "value": 10}, "FESTIVE500": {"type": "flat", "value": 500}}
    let promos = {};
    if (process.env.PROMO_CODES) {
      try {
        promos = JSON.parse(process.env.PROMO_CODES);
      } catch (e) {
        console.error("Invalid PROMO_CODES JSON in env", e);
      }
    }

    // Default fallback promo codes if environment variable isn't set yet
    if (Object.keys(promos).length === 0) {
      promos = {
        "DIWALI10": { type: "percent", value: 10 },
        "DIWALI20": { type: "percent", value: 20 },
        "FESTIVE100": { type: "flat", value: 100 }
      };
    }

    const upperCode = code.trim().toUpperCase();
    const promo = promos[upperCode];

    if (!promo) {
      return res.status(400).json({ error: 'Invalid or expired promo code' });
    }

    let discount = 0;
    if (promo.type === 'percent') {
      discount = Math.round((subtotal * promo.value) / 100);
    } else if (promo.type === 'flat') {
      discount = promo.value;
    }

    if (discount > subtotal) {
      discount = subtotal;
    }

    return res.status(200).json({
      success: true,
      code: upperCode,
      discount,
      message: Promo code ${upperCode} applied successfully!
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
