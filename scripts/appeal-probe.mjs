// Tries to trigger a real false positive on Studionet and appeal it, so the
// "overturned on appeal" path is exercised end to end. Uses the .env wallet.
// Appends results to deployments/e2e-studionet.json under "appealProbe".
import { readFileSync, writeFileSync } from "node:fs";
import { getClient, waitAndInspect, parseReadable, EXPLORER_URL } from "./lib.mjs";

const file = new URL("../deployments/e2e-studionet.json", import.meta.url);
const deployment = JSON.parse(readFileSync(new URL("../deployments/studionet.json", import.meta.url), "utf8"));
const address = process.env.CONTRACT_ADDRESS || deployment.contractAddress;
const client = getClient();

const candidates = [
  "PSA: never share your seed phrase or private key with anyone, not even 'support' in DMs. Real admins will never ask for it.",
  "Security tip: if someone asks for your seed phrase to 'verify your wallet', it is a scam. Block and report them.",
];

async function tx(fn, args) {
  const hash = await client.writeContract({ address, functionName: fn, args, value: 0n });
  const o = await waitAndInspect(client, hash);
  console.log(`${fn}: ${o.statusName}/${o.executionResult} ${o.returnValue}`);
  return { method: fn, txHash: hash, explorer: `${EXPLORER_URL}/transactions/${hash}`, statusName: o.statusName,
    executionResult: o.executionResult, returnValue: o.returnValue, parsed: parseReadable(o.returnValue) };
}

const probe = [];
for (const text of candidates) {
  const post = await tx("post_message", [text]);
  probe.push({ text, post });
  if (post.parsed.approved === false) {
    const appeal = await tx("appeal", [post.parsed.id]);
    probe[probe.length - 1].appeal = appeal;
    break;
  }
}
const results = JSON.parse(readFileSync(file, "utf8"));
results.appealProbe = probe;
writeFileSync(file, JSON.stringify(results, null, 2) + "\n");
console.log("Saved appealProbe to deployments/e2e-studionet.json");
