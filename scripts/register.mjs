// ERC-8004 On-Chain Registration Script
// Run: node scripts/register.mjs

import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const RPC_URL = process.env.ETH_RPC_URL || 'https://eth.llamarpc.com';
const PRIVATE_KEY = process.env.AGENT_WALLET_PRIVATE_KEY;
const AGENT_URI = 'https://constellation-shapes-production.up.railway.app/.well-known/agent-registration.json';

if (!PRIVATE_KEY) {
  console.error('Error: AGENT_WALLET_PRIVATE_KEY environment variable not set');
  process.exit(1);
}

const abi = parseAbi([
  'function register(string agentURI) external returns (uint256 agentId)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
]);

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`Registering agent from wallet: ${account.address}`);
  
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http(RPC_URL),
  });

  // Check balance (need ~0.0005 ETH for gas)
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Balance: ${Number(balance) / 1e18} ETH`);
  
  if (balance < BigInt(0.0003 * 1e18)) {
    console.error('Warning: Balance may be too low for gas. Need ~0.0005 ETH');
  }

  console.log(`\nRegistering URI: ${AGENT_URI}`);
  console.log('Sending transaction...');

  // Register
  const hash = await walletClient.writeContract({
    address: IDENTITY_REGISTRY,
    abi,
    functionName: 'register',
    args: [AGENT_URI],
  });

  console.log(`Transaction hash: ${hash}`);
  console.log('Waiting for confirmation...');
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Confirmed in block: ${receipt.blockNumber}`);
  
  // Get agentId from Transfer event (topic index 3)
  const transferLog = receipt.logs.find(log => 
    log.address.toLowerCase() === IDENTITY_REGISTRY.toLowerCase() && 
    log.topics.length === 4
  );
  
  if (transferLog?.topics[3]) {
    const agentId = parseInt(transferLog.topics[3], 16);
    console.log(`\n✅ Successfully registered!`);
    console.log(`Agent ID: ${agentId}`);
    console.log(`\nNext steps:`);
    console.log(`1. Update src/agent-registration.json with:`);
    console.log(`   "registrations": [`);
    console.log(`     {`);
    console.log(`       "agentId": ${agentId},`);
    console.log(`       "agentRegistry": "eip155:1:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"`);
    console.log(`     }`);
    console.log(`   ]`);
    console.log(`\n2. Redeploy to Railway`);
  } else {
    console.log('Could not find agent ID in logs. Check transaction on Etherscan:');
    console.log(`https://etherscan.io/tx/${hash}`);
  }
}

main().catch(console.error);
