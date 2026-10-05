// Deploy script for `genlayer deploy` (GenLayer CLI runs every script in ./deploy in name order).
// Usage:
//   genlayer network set studionet
//   genlayer deploy
// Alternatively use `npm run deploy:studionet` (scripts/deploy.mjs), which signs with the key in .env.
import { readFileSync } from "fs";
import path from "path";
import { TransactionStatus, type GenLayerClient, type TransactionHash } from "genlayer-js/types";

export default async function main(client: GenLayerClient<any>) {
  const filePath = path.resolve(process.cwd(), "contracts/wall_ai.py");
  const code = new Uint8Array(readFileSync(filePath));

  const txHash = (await client.deployContract({ code, args: [] })) as TransactionHash;
  console.log(`Deploy tx: ${txHash}`);

  await client.waitForTransactionReceipt({ hash: txHash, status: TransactionStatus.ACCEPTED, retries: 200 });
  const tx: any = await client.getTransaction({ hash: txHash });

  const leader = Array.isArray(tx?.consensus_data?.leader_receipt)
    ? tx.consensus_data.leader_receipt[0]
    : tx?.consensus_data?.leader_receipt;
  const ok =
    ["ACCEPTED", "FINALIZED"].includes(tx?.statusName) &&
    (tx?.txExecutionResultName === "FINISHED_WITH_RETURN" || leader?.execution_result === "SUCCESS");
  if (!ok) throw new Error(`Deployment failed: ${tx?.statusName} / ${leader?.execution_result}`);

  const address = tx?.data?.contract_address ?? tx?.txDataDecoded?.contractAddress ?? tx?.recipient;
  console.log(`WallAI deployed at: ${address}`);
  console.log("Set NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env.local to this address.");
}
