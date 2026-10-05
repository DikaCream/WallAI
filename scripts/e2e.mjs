// Real end-to-end test against the deployed WallAI contract on Studionet.
// Posts one clean message and one abusive/spam message from the .env wallet,
// then reads back the wall and the stats. Results go to deployments/e2e-studionet.json.
import { readFileSync, writeFileSync } from "node:fs";
import { getClient, waitAndInspect, toPlain, EXPLORER_URL } from "./lib.mjs";

const deployment = JSON.parse(readFileSync(new URL("../deployments/studionet.json", import.meta.url), "utf8"));
const address = process.env.CONTRACT_ADDRESS || deployment.contractAddress;
const client = getClient();
const reader = getClient({ withAccount: false });

const cases = [
  { label: "clean", text: "Hello from WallAI! Excited to try an AI-moderated wall on GenLayer. Have a great day everyone :)" },
  {
    label: "abusive/spam",
    text: "SEND ME YOUR SEED PHRASE NOW to claim 1000x FREE CRYPTO!!! Click bit.ly/fr33-m0ney - you are all worthless idiots",
  },
];

async function read(functionName, args = []) {
  return toPlain(await reader.readContract({ address, functionName, args }));
}

const results = { contract: address, wallet: client.account.address, startedAt: new Date().toISOString(), posts: [] };
console.log(`Contract: ${address}\nWallet:   ${client.account.address}\n`);
console.log("Before:", await read("get_stats"));

for (const c of cases) {
  console.log(`\nPosting [${c.label}]: ${c.text}`);
  const hash = await client.writeContract({ address, functionName: "post_message", args: [c.text], value: 0n });
  console.log(`  tx: ${hash}`);
  const outcome = await waitAndInspect(client, hash);
  console.log(`  status=${outcome.statusName} consensus=${outcome.consensusResult} execution=${outcome.executionResult}`);
  console.log(`  return=${outcome.returnValue}`);
  if (outcome.stderr) console.log(`  stderr=${outcome.stderr.slice(0, 500)}`);
  results.posts.push({
    label: c.label,
    text: c.text,
    txHash: hash,
    explorer: `${EXPLORER_URL}/transactions/${hash}`,
    statusName: outcome.statusName,
    consensusResult: outcome.consensusResult,
    executionResult: outcome.executionResult,
    returnValue: outcome.returnValue,
  });
}

results.after = {
  stats: await read("get_stats"),
  messageCount: await read("get_message_count"),
  latestMessages: await read("get_messages", [0, 10]),
  authorStats: await read("get_author_stats", [client.account.address]),
};
results.finishedAt = new Date().toISOString();
console.log("\nAfter:", JSON.stringify(results.after, null, 2));
writeFileSync(new URL("../deployments/e2e-studionet.json", import.meta.url), JSON.stringify(results, null, 2) + "\n");
console.log("\nSaved deployments/e2e-studionet.json");
