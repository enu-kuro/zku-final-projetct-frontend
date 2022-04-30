import type { NextApiRequest, NextApiResponse } from "next";
import { BigNumber, ContractTransaction, ethers } from "ethers";
import { HitAndBlow } from "typechain";
import HitAndBlowJson from "contracts/HitAndBlow.json";
import { FourNumbers, ProofInput, ZeroToNine } from "types";
import {
  calculateHB,
  filterCandidates,
  generateProof,
  initCandidates,
  randomSample,
  retryIfFailed,
} from "utils";
const buildPoseidon = require("circomlibjs").buildPoseidon;

let poseidon: any;
const defaultCandidates = initCandidates();

const CONTRACT_ADDRESS = "0x43b9AAF34367630360ffdbe48edB855f123b14f8";
const PLAYER_ADDRESS = "0x951444F56EF94FeC42e8cDBeDef1A4Dc1D1ea63B";

class Solution {
  readonly numbers: FourNumbers;
  readonly salt: BigNumber;
  readonly hash: BigNumber;

  constructor() {
    this.numbers = randomSample(defaultCandidates);
    this.salt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    this.hash = ethers.BigNumber.from(
      poseidon.F.toObject(poseidon([this.salt, ...this.numbers]))
    );
  }
}

class Player {
  readonly solution: Solution;
  candidates: FourNumbers[];
  lastGuess?: FourNumbers;

  constructor() {
    this.solution = new Solution();
    this.candidates = defaultCandidates;
  }

  updateCandidates(guess: FourNumbers, hit: number, blow: number) {
    this.candidates = filterCandidates(this.candidates, guess, hit, blow);
    console.log("updateCandidates: ", this.candidates.length);
  }

  guess() {
    const guess = randomSample(this.candidates);
    this.lastGuess = guess;
    return guess;
  }
}
let player: Player;

const account = new ethers.Wallet(
  process.env.PRIVATE_KEY as string,
  ethers.getDefaultProvider("https://api.s0.b.hmny.io")
);

const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  HitAndBlowJson.abi,
  account
) as HitAndBlow;

const onInitialize = () => {
  console.log("onInitialize");
};

const submitGuess = async (guess: FourNumbers) => {
  await retryIfFailed(contract.submitGuess)(...guess).catch((err) => {
    console.log(err);
    throw Error(err);
  });
};

const submitProof = async (
  guess: FourNumbers,
  solution: Solution,
  hit: number,
  blow: number
) => {
  const proofInput: ProofInput = {
    pubGuessA: guess[0],
    pubGuessB: guess[1],
    pubGuessC: guess[2],
    pubGuessD: guess[3],
    pubNumHit: hit,
    pubNumBlow: blow,
    pubSolnHash: solution.hash,
    privSolnA: solution.numbers[0],
    privSolnB: solution.numbers[1],
    privSolnC: solution.numbers[2],
    privSolnD: solution.numbers[3],
    privSalt: solution.salt,
  };
  const proof = await generateProof(proofInput);
  await retryIfFailed(contract.submitHbProof)(...proof).catch((err) => {
    console.log(err);
    throw Error(err);
  });
};

const onSubmitGuess = async (
  address: string,
  currentRound: number,
  a: ZeroToNine,
  b: ZeroToNine,
  c: ZeroToNine,
  d: ZeroToNine
) => {
  console.log("onSubmitGuess");
  if (address !== PLAYER_ADDRESS) {
    const guess = [a, b, c, d] as FourNumbers;
    const solution = player.solution;
    const solutionNumbers = solution.numbers;
    const [hit, blow] = calculateHB(guess, solutionNumbers);
    await submitProof(guess, solution, hit, blow);
  }
};

const commitSolutionHash = async () => {
  console.log("commitSolutionHash");
  const solution = player.solution;
  const solutionHash = solution.hash;
  await retryIfFailed(contract.commitSolutionHash)(solutionHash).catch(
    (err) => {
      console.log(err);
      throw Error(err);
    }
  );
};

const revealSolution = async () => {
  const gasLimit = await contract.estimateGas.winner();
  const winner = await contract.winner({
    gasLimit: gasLimit.toString(),
  });
  if (PLAYER_ADDRESS === winner) {
    const solution = player.solution;
    await retryIfFailed(contract.reveal)(
      solution.salt,
      ...solution.numbers
    ).catch((err) => {
      console.log(err);
      throw Error(err);
    });
  }
};

const onStageChange = async (stage: number) => {
  console.log(`Stage: ${stage}`);
  if (stage === 1) {
    await commitSolutionHash();
  } else if (stage === 2) {
    await submitGuess(player.guess());
  } else if (stage === 3) {
    await revealSolution();
  }
};

const onRoundChange = async (round: number) => {
  console.log(`Round: ${round}`);
  await submitGuess(player.guess());
};

const onSubmitHB = async (
  address: string,
  currentRound: number,
  hit: number,
  blow: number
) => {
  if (address !== PLAYER_ADDRESS) {
    player.updateCandidates(player.lastGuess!, hit, blow);
  }
};

// @TODO: transaction failした場合の処理は？
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (contract.listenerCount("Initialize") === 0) {
    contract.on("Initialize", onInitialize);
    // contract.on("Register", onRegister);
    contract.on("StageChange", onStageChange);
    contract.on("RoundChange", onRoundChange);
    contract.on("SubmitGuess", onSubmitGuess);
    contract.on("SubmitHB", onSubmitHB);
    console.log("Listen Events");
  }

  if (!poseidon) {
    poseidon = await buildPoseidon();
  }
  player = new Player();

  await retryIfFailed(contract.register)().catch((err) => {
    console.log(err);
    throw Error(err);
  });
  res.status(200).json({ result: "ok" });
}
