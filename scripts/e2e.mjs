// Real end-to-end test against the deployed WallAI v2 contract on Studionet.
// Wallet A = the .env wallet. Wallet B = a throwaway in-memory wallet (never saved).
// Covers: handles, clean post, abusive post, borderline post, appeal(s), like, reply,
// and the rejected / leaderboard / replies / stats views. Results: deployments/e2e-studionet.json.
import { readFileSync, writeFileSync } from "node:fs";
import { getClient, getEphemeralClient, waitAndInspect, toPlain, parseReadable, EXPLORER_URL } from "./lib.mjs";

const deployment = JSON.parse(readFileSync(new URL("../deployments/studionet.json", import.meta.url), "utf8"));
const address = process.env.CONTRACT_ADDRESS || deployment.contractAddress;
const alice = getClient();
const bob = getEphemeralClient();
const reader = getClient({ withAccount: false });
const A = alice.account.address;
const B = bob.account.address;

const steps = [];
const read = async (fn, args = []) => toPlain(await reader.readContract({ address, functionName: fn, args }));

async function write(label, client, fn, args, expect) {
  process.stdout.write(`\n[${label}] ${fn}(${JSON.stringify(args).slice(0, 90)})\n`);
  const hash = await client.writeContract({ address, functionName: fn, args, value: 0n });
  const o = await waitAndInspect(client, hash);
  const ret = parseReadable(o.returnValue);
  const ok = o.success && (expect ? expect(ret) : true);
  console.log(`  tx=${hash}\n  status=${o.statusName} exec=${o.executionResult} return=${o.returnValue}`);
  if (o.stderr) console.log(`  stderr=${String(o.stderr).slice(0, 300)}`);
  steps.push({
    step: label, method: fn, txHash: hash, explorer: `${EXPLORER_URL}/transactions/${hash}`,
    statusName: o.statusName, consensusResult: o.consensusResult, executionResult: o.executionResult,
    returnValue: o.returnValue, parsed: ret, pass: ok,
  });
  return ret;
}

console.log(`Contract: ${address}\nWallet A: ${A}\nWallet B: ${B} (ephemeral)`);
const suffix = A.slice(2, 6).toLowerCase();

await write("A sets handle", alice, "set_handle", [`demo_${suffix}`], (r) => r.handle === `demo_${suffix}`);
await write("B sets handle", bob, "set_handle", [`friend_${B.slice(2, 8).toLowerCase()}`], (r) => !!r.handle);

const clean = await write("clean post", alice, "post_message",
  ["Good morning from WallAI v2! Testing replies, likes and appeals on GenLayer today. Have a great week :)"],
  (r) => r.approved === true);
await write("abusive post", alice, "post_message",
  ["SEND ME YOUR SEED PHRASE NOW to claim 1000x FREE CRYPTO!!! Click bit.ly/fr33-m0ney - you are all worthless idiots"],
  (r) => r.approved === false);
const borderline = await write("borderline post", alice, "post_message",
  ["We absolutely destroyed them last night, total massacre on the scoreboard. I'm going to murder that leaderboard next week 🏆"]);

const rejected = await read("get_rejected", [0, 20]);
const abusiveRow = rejected.find((r) => r.author.toLowerCase() === A.toLowerCase() && r.appeal_status === "none" &&
  (!borderline.approved ? r.id !== borderline.id : true));
if (abusiveRow) {
  await write("appeal abusive (expect denied)", alice, "appeal", [abusiveRow.id], (r) => r.overturned === false);
}
if (borderline.approved === false) {
  await write("appeal borderline (expect overturned)", alice, "appeal", [borderline.id], (r) => r.overturned === true);
}

const messages = await read("get_messages", [0, 20]);
const target = messages.find((m) => m.author.toLowerCase() === A.toLowerCase() && m.id === clean.id) ?? messages[0];
await write("B likes A's post", bob, "like", [target.id], (r) => r.liked === true && r.likes >= 1);
await write("B replies", bob, "reply", [target.id, "Congrats on shipping v2, this looks great!"], (r) => r.approved === true);

const results = {
  contract: address, walletA: A, walletB: B, finishedAt: new Date().toISOString(), steps,
  views: {
    stats: await read("get_stats"),
    messages: await read("get_messages", [0, 10]),
    rejected: await read("get_rejected", [0, 10]),
    replies: await read("get_replies", [target.id, 0, 10]),
    leaderboard: await read("get_leaderboard", [10]),
    bLikedTarget: await read("has_liked", [target.id, B]),
    authorStatsA: await read("get_author_stats", [A]),
  },
};
const v = results.views;
const checks = {
  "rejected view hides text": v.rejected.every((r) => r.appeal_status === "overturned" || r.text === ""),
  "reply visible": v.replies.some((r) => r.author.toLowerCase() === B.toLowerCase()),
  "like recorded": v.bLikedTarget === true,
  "leaderboard has A": v.leaderboard.some((r) => r.address.toLowerCase() === A.toLowerCase()),
  "handle shown on messages": v.messages.some((m) => m.handle === `demo_${suffix}`),
};
results.checks = checks;
console.log("\nViews:", JSON.stringify({ stats: v.stats, leaderboard: v.leaderboard }, null, 2));
console.log("Checks:", checks);
console.log("\nSummary:");
for (const s of steps) console.log(`  ${s.pass ? "PASS" : "FAIL"}  ${s.step}  ${s.statusName}/${s.executionResult}  ${s.returnValue ?? ""}`);
writeFileSync(new URL("../deployments/e2e-studionet.json", import.meta.url), JSON.stringify(results, null, 2) + "\n");
console.log("\nSaved deployments/e2e-studionet.json");
