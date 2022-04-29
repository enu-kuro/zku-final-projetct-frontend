import type { NextApiRequest, NextApiResponse } from "next";
import { BigNumber, ethers } from "ethers";
import { defineReadOnly } from "@ethersproject/properties";
import { HitAndBlow } from "typechain";
import HitAndBlowJson from "contracts/HitAndBlow.json";
import { FourNumbers, ProofInput, ZeroToNine } from "types";
import { calculateHB, generateProof } from "utils";
const buildPoseidon = require("circomlibjs").buildPoseidon;

let poseidon: any;
(async function () {
  poseidon = await buildPoseidon();
})();

const CONTRACT_ADDRESS = "0x43b9AAF34367630360ffdbe48edB855f123b14f8";
const PLAYER_ADDRESS = "0x951444F56EF94FeC42e8cDBeDef1A4Dc1D1ea63B";

class Solution {
  readonly numbers!: FourNumbers;
  readonly salt!: BigNumber;
  readonly hash!: BigNumber;

  constructor() {
    // @TODO: randomly generate numbers
    const numbers: FourNumbers = [4, 5, 6, 7];
    const salt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    const hash = ethers.BigNumber.from(
      poseidon.F.toObject(poseidon([salt, ...numbers]))
    );
    defineReadOnly(this, "numbers", numbers);
    defineReadOnly(this, "salt", salt);
    defineReadOnly(this, "hash", hash);
  }
}

let solution: Solution;

const account = new ethers.Wallet(
  process.env.PRIVATE_KEY as string,
  ethers.getDefaultProvider("https://api.s0.b.hmny.io")
);

export const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  HitAndBlowJson.abi,
  account
) as HitAndBlow;

const onInitialize = () => {
  console.log("onInitialize");
};

const submitGuess = async (guess: FourNumbers) => {
  const gasLimit = await contract.estimateGas.submitGuess(...guess);
  return contract.submitGuess(...guess, { gasLimit: gasLimit.toString() });
};

// const onSubmitHB = (
//   player: string,
//   currentRound: number,
//   hit: number,
//   blow: number
// ) => {
//   console.log(`onSubmitHB`);
//   //   if (player !== CONTRACT_ADDRESS) {
//   //   }
// };

const submitProof = async (guess: FourNumbers) => {
  const solutionNumbers = solution.numbers;
  const [hit, blow] = calculateHB(guess, solutionNumbers);
  const proofInput: ProofInput = {
    pubGuessA: guess[0],
    pubGuessB: guess[1],
    pubGuessC: guess[2],
    pubGuessD: guess[3],
    pubNumHit: hit,
    pubNumBlow: blow,
    pubSolnHash: solution.hash,
    privSolnA: solutionNumbers[0],
    privSolnB: solutionNumbers[1],
    privSolnC: solutionNumbers[2],
    privSolnD: solutionNumbers[3],
    privSalt: solution.salt,
  };
  const proof = await generateProof(proofInput);
  const gasLimit = await contract.estimateGas.submitHbProof(...proof);
  return contract.submitHbProof(...proof, {
    gasLimit: gasLimit.toString(),
  });
};

const onSubmitGuess = async (
  player: string,
  currentRound: number,
  a: ZeroToNine,
  b: ZeroToNine,
  c: ZeroToNine,
  d: ZeroToNine
) => {
  console.log(player);
  if (player !== PLAYER_ADDRESS) {
    const guess = [a, b, c, d] as FourNumbers;
    await submitProof(guess);
  }
};

const commitSolutionHash = async () => {
  solution = new Solution();
  const solutionHash = solution.hash;
  const gasLimit = await contract.estimateGas.commitSolutionHash(solutionHash);
  await contract.commitSolutionHash(solutionHash, {
    gasLimit: gasLimit.toString(),
  });
};

const revealSolution = async () => {
  const gasLimit = await contract.estimateGas.winner();
  const winner = await contract.winner({
    gasLimit: gasLimit.toString(),
  });
  if (PLAYER_ADDRESS === winner) {
    const gasLimit = await contract.estimateGas.reveal(
      solution.salt,
      ...solution.numbers
    );
    return await contract.reveal(solution.salt, ...solution.numbers, {
      gasLimit: gasLimit.toString(),
    });
  }
  return Promise.resolve();
};

const onStageChange = async (stage: number) => {
  console.log(`Stage: ${stage}`);
  if (stage === 1) {
    await commitSolutionHash();
    console.log("commitSolutionHash");
  } else if (stage === 2) {
    // @TODO: generate guess
    const guess: FourNumbers = [4, 5, 6, 7];
    await submitGuess(guess);
  } else if (stage === 3) {
    await revealSolution();
  }
};

const onRoundChange = async (round: number) => {
  console.log(`Round: ${round}`);
  const guess: FourNumbers = [3, 5, 6, 9];
  await submitGuess(guess);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  //   if (contract.listeners("Initialize").length === 0) {
  if (contract.listenerCount("Initialize") === 0) {
    contract.on("Initialize", onInitialize);
    // contract.on("Register", onRegister);
    contract.on("StageChange", onStageChange);
    contract.on("RoundChange", onRoundChange);
    contract.on("SubmitGuess", onSubmitGuess);
    // contract.on("SubmitHB", onSubmitHB);

    console.log("Listen Events");
  }
  const gasLimit = await contract.estimateGas.register();
  await contract.register({ gasLimit: gasLimit.toString() });
  res.status(200).json({ result: "ok" });
}
