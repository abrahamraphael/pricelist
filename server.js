const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function getPromos() {
  // PROMOCODES example:
  // DIWALI10=percent:10,FESTIVE200=flat:200
  const raw = process.env.PROMOCODES || "";
  return Object.fromEntries(
    raw.split(",").filter(Boolean).map(entry => {
      const [code, rule] = entry.split("=");
      const [type, value] = (rule || "").split(":");
      return [code.trim().toUpperCase(), { type, value: Number(value) }];
    })
  );
}

app.post("/api/promo", (req, res) => {
  const code = String(req.body?.code || "").trim().toUpperCase();
  const subtotal = Math.max(0, Number(req.body?.subtotal || 0));
  const promo = getPromos()[code];

  if (!promo || !Number.isFinite(subtotal)) {
    return res.json({ valid: false });
  }

  const discount = promo.type === "percent"
    ? Math.round(subtotal * promo.value / 100)
    : promo.type === "flat"
      ? Math.min(subtotal, promo.value)
      : 0;

  if (discount <= 0) return res.json({ valid: false });

  res.json({ valid: true, code, type: promo.type, value: promo.value, discount });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Order site running on http://localhost:${PORT}`));
