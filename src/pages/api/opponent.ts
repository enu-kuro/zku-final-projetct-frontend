import type { NextApiRequest, NextApiResponse } from "next";
import { contract } from "./connect";

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const players = await contract.getplayers();

  console.log(players);
  res.status(200).json({ name: "aaa" });
}
