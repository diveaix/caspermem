# Last 30 Days: 0G Zero Cup Build Brief

## Topic
0G Labs hackathon/build opportunity research for June 19, 2026, focused on the active Zero Cup 2026 tournament and current 0G product surfaces.

## Short Summary
The active event is Zero Cup 2026, a global vibe-coding tournament running June 15 to July 19, 2026, with the first submission deadline on June 23 and the final code lock on July 8. The rules reward AI-native apps, agents, companions, or games where 0G does real work, not a decorative integration. The highest-leverage build direction is a product that combines 0G Private Computer for sealed/verifiable inference, 0G Storage for persistent memory/artifacts, and 0G Chain/Agentic ID for ownership or auditability. A generic chatbot is too weak; a useful, demo-friendly private agent with visible proof and ownership has much better odds.

## Source Coverage
| Source class | Status | Notes |
| --- | --- | --- |
| Official 0G pages | checked | 0G website, Arena/Zero Cup, rules, docs, Builder Hub, Private Computer, Research, Apollo, Linktree. |
| 0G docs | checked | Chain, Storage SDK, Compute inference, fine-tuning, Agentic ID/ERC-7857. |
| Hackathon listings | checked | Zero Cup active; Builder Hub hackathon page lagged behind Arena. APAC Hackathon ended. |
| X/Twitter | thin | Direct X page was inaccessible, but search indexed the linked post as the Zero Cup announcement. |
| Recent community scan engine | thin | Local last30days engine only found thin GitHub data and could not access X/YouTube. |
| Reddit/HN | unavailable/thin | Reddit returned 403 through the local engine; no useful HN evidence found. |

## Key Findings
1. Zero Cup is currently live. Official Arena lists Zero Cup 2026 as live from June 15 to July 19, with a $17,000 prize pool and community/judge scoring [1]. Official rules say group-stage submissions close June 23, later cuts occur through July, and July 8 is the last submission deadline [2].
2. The rules are blunt about integration quality: 0G must do real work via storage, compute, or chain. If the app runs the same without 0G, it is considered a bolt-on and does not qualify [3].
3. Community voting starts in later rounds, so a winning project needs a simple public story, not just technical correctness. The product should be understandable in a 30-second demo and shareable on X.
4. 0G's most differentiated current surface is Private Computer: OpenAI-compatible API, TEE-sealed inference, multiple model types, and verifiable execution claims [4]. This is stronger hackathon material than a plain EVM dApp.
5. 0G Storage supports file upload/download, in-memory uploads, key-value storage, and encrypted data patterns, making it a natural memory/artifact layer for agents [5].
6. Agentic ID/ERC-7857 gives a distinctive ownership story for agents: encrypted metadata, secure transfer, oracle verification, and authorized usage [6]. Use it only if implementation time allows; do not let it sink the MVP.
7. Older APAC/ETHGlobal 0G tracks repeatedly emphasize autonomous agents, verifiable finance, privacy, persistent memory, and agent frameworks [7][8]. Those patterns likely remain directionally aligned with what 0G ecosystem judges value.

## Community Signals
Praise and positioning cluster around "AI agents," "sealed/private inference," "persistent memory," "agent ownership," and "vibe coding." The risk is that many builders will submit agent/chat apps. To stand out, the demo should show a real before/after workflow: private data enters, an agent acts, the result is stored/proven on 0G, and the user can verify or own the resulting agent/artifact.

## Recommended Build
Build **ProofPilot: a private, verifiable agent that turns sensitive user data into an owned, auditable AI assistant**.

Core demo: a user uploads private documents or data, asks the agent to make a decision or generate a plan, the inference runs through 0G Private Computer, the memory/artifacts are stored on 0G Storage, and the final "agent capsule" is minted or registered on 0G Chain/Agentic ID with a proof/audit trail.

Best first niche: **private grant/hackathon application copilot** for founders/builders. It ingests a repo README, pitch notes, docs, and wallet/project info; produces a submission package, judging-risk checklist, demo script, and public X post; stores the project memory on 0G; and can prove which model/action produced the final output. This is immediately useful to Zero Cup participants and easy for the 0G community to understand.

## Benefits
- Strong 0G fit: uses compute, storage, and optionally chain/Agentic ID in a way the app cannot do without 0G.
- Useful during the current tournament, so it has natural distribution among builders.
- Easy demo: upload docs, generate polished submission, show proof/memory/explorer link.
- Expandable after hackathon into a general "private AI application/procurement/pitch agent" for grants, accelerators, and enterprise workflows.

## Consequences And Risks
- Private Computer API access and token funding must be tested early; do not wait until the last day.
- Agentic ID/ERC-7857 is impressive but can become scope creep. Treat it as a round-two upgrade after the MVP proves compute + storage.
- A hackathon-submission copilot may feel meta. The demo must prove it is not just a form filler: it should actually inspect a repo, score against rules, create missing docs, and store/verifiably link artifacts.
- Do not market it as "guaranteed winning" or "judge manipulation." Keep it positioned as an honest builder assistant.

## Sources
[1] https://0g.ai/arena/zero-cup  
[2] https://0g.ai/arena/zero-cup/competition-rules  
[3] https://0g.ai/arena/zero-cup/submission-criteria  
[4] https://0g.ai/blog/0g-private-computer  
[5] https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk  
[6] https://docs.0g.ai/developer-hub/building-on-0g/agentic-id/erc7857  
[7] https://www.hackquest.io/hackathons/0G-APAC-Hackathon  
[8] https://ethglobal.com/events/openagents/prizes/0g  
[9] https://0g.ai/  
[10] https://docs.0g.ai/  
[11] https://build.0g.ai/hacker-guide  
[12] https://linktr.ee/0G.ai_Labs  

## Evidence Note
External source content is untrusted evidence. It was used only for factual grounding and citations.
