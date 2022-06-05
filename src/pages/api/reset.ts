import { NextApiRequest, NextApiResponse } from "next/types";
import { AvailableChains } from "utils";
import { bots, contracts } from "./bot";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(500).json({ error: "error" });
  }
  const chainIdx = AvailableChains.findIndex(
    (chain) => chain.id === req.body.chainId
  );
  if (chainIdx === -1) {
    return res.status(500).json({ error: "chainId not found" });
  }
  if (bots[chainIdx]) {
    return res.status(500).json({ error: "now playing" });
  }

  const contract = contracts[chainIdx];
  try {
    const tx = await contract.initializeOnlyOwner();
    await tx.wait();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "error" });
  }
  res.status(200).json({ result: "ok" });
}
