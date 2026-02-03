# Constellation Shapes ✨

What shape is your birthday? Get constellation stick-figures as line segments. Paid API via x402.

## Endpoints

| Endpoint | Price | Description |
|----------|-------|-------------|
| `/health` | Free | Health check |
| `/entrypoints/get-shape/invoke` | $0.001 | Get constellation line segments |

## Why?

Drawing constellations? Building a star map? This agent returns normalized coordinates (0-1 space) that you can scale to any canvas. Token-efficient format designed for agent-to-agent communication.

## Usage

### Get a constellation

```bash
curl -X POST https://constellation-shapes-production.up.railway.app/entrypoints/get-shape/invoke \
  -H "Content-Type: application/json" \
  -d '{"input": {"name": "orion"}}'
```

Response:
```json
{
  "name": "Orion",
  "lines": [[0.5,0.15,0.35,0.3], [0.5,0.15,0.65,0.3], ...]
}
```

Each line is `[x1, y1, x2, y2]` in 0-1 normalized space.

### Aliases work too

```bash
# These all return Ursa Major:
{"name": "ursa_major"}
{"name": "big dipper"}
{"name": "great bear"}
{"name": "uma"}
```

## Supported Constellations

**Zodiac:** Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpius, Sagittarius, Capricornus, Aquarius, Pisces

**Major:** Orion, Ursa Major (Big Dipper), Ursa Minor (Little Dipper), Cassiopeia, Cygnus (Swan), Draco, Perseus, Andromeda, Pegasus, Lyra, Aquila, Crux (Southern Cross), Centaurus, Canis Major, Canis Minor, Corona Borealis, Boötes, Hercules

## x402 Payment

Paid endpoints return a `402 Payment Required` response with payment details. Use an x402-compatible client or the [x402 SDK](https://github.com/coinbase/x402) to complete payment.

## ERC-8004 Identity

This agent is registered on-chain:
- **Agent ID:** 22706
- **Registry:** `eip155:1:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- **Explorer:** [8004scan.io](https://8004scan.io/agents/1/22706)

## Self-Hosting

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Required variables:
- `AGENT_WALLET_PRIVATE_KEY` — your agent's wallet
- `PAYMENTS_RECEIVABLE_ADDRESS` — where payments go

### 3. Run locally

```bash
bun run dev
```

### 4. Deploy to Railway

```bash
railway init --name constellation-shapes
railway up --detach
railway variables set AGENT_WALLET_PRIVATE_KEY=... PAYMENTS_RECEIVABLE_ADDRESS=...
railway domain
```

## Example: Drawing on Canvas

```javascript
const response = await fetch('/entrypoints/get-shape/invoke', {
  method: 'POST',
  body: JSON.stringify({ input: { name: 'orion' } })
});
const { lines } = await response.json();

// Scale to your canvas
const scale = (v, size) => v * size;
lines.forEach(([x1, y1, x2, y2]) => {
  ctx.moveTo(scale(x1, width), scale(y1, height));
  ctx.lineTo(scale(x2, width), scale(y2, height));
});
ctx.stroke();
```

## Built With

- [Lucid Agents SDK](https://github.com/lucid-labs/lucid-agents)
- [Bun](https://bun.sh)
- [x402](https://github.com/coinbase/x402)

## License

MIT
