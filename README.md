# WallAI

**WallAI** is an AI-moderated public message wall built on [GenLayer](https://genlayer.com) and deployed to **GenLayer Studionet**.

Anyone with a wallet can post a short message (up to 280 characters). Before a post is published, an
**intelligent contract** asks an LLM whether the message is appropriate. GenLayer validators must agree on
the moderation decision through the **Equivalence Principle**, so no single node decides what gets published.
Approved messages are stored on-chain. Rejected messages are counted, and the AI's reason is saved for the author.

| | |
|---|---|
| Network | GenLayer Studionet (chain ID `61999`, RPC `https://studio.genlayer.com/api`) |
| Contract | [`0x7cD9D77c23024D21868dA19F9FD4cE723aE2241b`](https://explorer-studio.genlayer.com/address/0x7cD9D77c23024D21868dA19F9FD4cE723aE2241b) |
| Deploy tx | [`0xd34a17c6…a714ea07`](https://explorer-studio.genlayer.com/transactions/0xd34a17c692b7d0c14e4968c5ae9e6734004230e1037e79cd0baadf72a714ea07) |

> Studionet is a temporary, hosted development network and its state can be reset. If the contract above no
> longer exists, redeploy it (see [Deploy](#deploy)).

## How moderation works

1. **Submit**: the user calls `post_message(text)` from MetaMask. The contract checks input deterministically
   first: empty messages and messages longer than 280 characters are reverted.
2. **Leader proposes**: inside a non-deterministic block, the leader validator sends the message to an LLM with
   `gl.nondet.exec_prompt(prompt, response_format="json")`. The model must answer
   `{"approved": bool, "reason": str}`. The prompt wraps the message in `<message>` tags and tells the model to
   treat it as untrusted data, which mitigates prompt injection.
3. **Validators verify**: the contract uses `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`. Each validator
   rejects malformed leader output, **re-runs the moderation independently**, and agrees only if it reaches the
   **same approve/reject decision**. The free-text reason is not compared, because two LLMs word it differently.
4. **Consensus outcome**:
   - approved: the message is appended to the wall with the author, a timestamp (the transaction time), and the AI's reason
   - rejected: the global rejection counter and the author's counter go up, and the reason is stored as the author's last rejection reason
   - if validators cannot agree, the network rotates leaders. If agreement is still impossible, the transaction ends `UNDETERMINED` and state is unchanged.

The moderator rejects hate speech, harassment and threats, explicit content, spam, scams and phishing, requests
for seed phrases or private keys, other people's personal data, and gibberish. Everything else is approved.

## Project structure

```
contracts/wall_ai.py          Python intelligent contract (GenVM)
tests/direct/                 Fast in-memory tests with a mocked LLM (genlayer-test direct mode)
scripts/create-wallet.mjs     Generates a new wallet into .env (key is never printed)
scripts/deploy.mjs            Deploys the contract to Studionet with the .env wallet
scripts/e2e.mjs               Real end-to-end test on Studionet (clean + abusive post)
scripts/schema-check.mjs      Asks Studionet to parse the contract and print its schema (read-only)
scripts/lib.mjs               Shared helpers (client, receipt inspection)
deploy/deployScript.ts        Deploy script for `genlayer deploy` (GenLayer CLI)
deployments/                  Deployment record and e2e results for Studionet
frontend/                     Next.js app (genlayer-js + MetaMask)
gltest.config.yaml            genlayer-test network config
```

## Contract API

| Method | Type | Description |
|---|---|---|
| `post_message(text: str)` | write | Moderates and (if approved) publishes a message. Returns `{approved, reason}`. |
| `get_messages(offset: int, limit: int)` | view | Approved messages, newest first (`limit` capped at 100). |
| `get_all_messages()` | view | All approved messages, oldest first. |
| `get_message_count()` | view | Number of approved messages. |
| `get_stats()` | view | `{approved, rejected, total}` |
| `get_author_stats(author: str)` | view | `{approved, rejected, last_rejection_reason}` for an address. |

Each message has the shape `{id, author, text, timestamp, reason}`. `author` is a checksummed hex address and
`timestamp` is Unix seconds.

Storage follows GenVM rules: `DynArray[Message]` for the wall, `TreeMap[Address, u256]` and `TreeMap[Address, str]`
for per-author data, `u256` counters, and an `@allow_storage @dataclass` `Message` struct.

## Setup

Requirements: Node.js 18+, Python 3.12+, Git. Docker is **not** needed for Studionet.

```bash
git clone https://github.com/DikaCream/WallAI.git
cd WallAI

# Node dependencies for the scripts (genlayer-js)
npm install

# Python tooling for linting and tests
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Lint and test the contract

```bash
genvm-lint check contracts/wall_ai.py   # GenVM static analysis + SDK validation
pytest tests/direct/ -v                 # 10 direct-mode tests with mocked LLM responses
```

## Deploy

Option A (Node script, no keychain needed):

```bash
npm run wallet:new          # creates a fresh wallet in .env (gitignored); prints only the address
npm run deploy:studionet    # deploys contracts/wall_ai.py, writes deployments/studionet.json
                            # and frontend/.env.local with NEXT_PUBLIC_CONTRACT_ADDRESS
```

Studionet is currently gasless, so a new, unfunded wallet can deploy. If deployment ever fails for lack of
funds, get GEN from the faucet in the account selector at [studio.genlayer.com](https://studio.genlayer.com).
If a deploy is interrupted after the transaction hash is printed, resume tracking it instead of redeploying:
`node scripts/deploy.mjs --tx 0x...`.

Option B (GenLayer CLI):

```bash
npm install -g genlayer
genlayer network set studionet
genlayer account create            # or: genlayer account import --private-key 0x...
genlayer deploy --contract contracts/wall_ai.py
# or run the script in ./deploy:  genlayer deploy
```

On Linux the CLI keychain needs `libsecret` (`sudo apt-get install libsecret-1-0`).

### End-to-end test on Studionet

```bash
npm run e2e:studionet
```

This posts one clean and one abusive/spam message from the `.env` wallet, waits for consensus, then reads back
the wall and stats. Results are saved to `deployments/e2e-studionet.json`.

## Run the frontend

```bash
cd frontend
cp .env.example .env.local      # skip if deploy:studionet already created it
# set NEXT_PUBLIC_CONTRACT_ADDRESS=0x... in .env.local
npm install
npm run dev                     # http://localhost:3000
npm run build && npm start      # production build
```

Frontend features:
- connect **MetaMask**, which automatically adds or switches to GenLayer Studionet (chain `61999`)
- a post form with a live 280-character counter
- a pending state while validators moderate the post, with a link to the transaction in the explorer
- approved, rejected, or error feedback that shows the AI's reason
- the wall (newest first, paginated), global stats, and your own published/rejected counts with your last rejection reason

The frontend uses `genlayer-js` with the `studionet` chain: an account-less client for reads, and a client with
`provider: window.ethereum` for writes. The write is then tracked with `waitForTransactionReceipt`
and `getTransaction`.

## Security notes

- `.env` holds a private key and is gitignored. Never commit it. The key in it is a throwaway test key.
- The frontend never handles private keys; all writes are signed in MetaMask.
- LLM moderation is probabilistic. Validators only agree on the approve/reject decision, and borderline content
  may be undetermined or decided differently on a retry.

## License

MIT
