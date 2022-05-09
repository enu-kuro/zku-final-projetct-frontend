import type { NextApiRequest, NextApiResponse } from "next";
import { BigNumber, ethers } from "ethers";
import { HitAndBlow } from "typechain";
import HitAndBlowJson from "contracts/HitAndBlow.json";
import { FourNumbers, ProofInput, ZeroToNine } from "types";
import {
  AvailableChains,
  calculateHB,
  filterCandidates,
  generateProof,
  initCandidates,
  randomSample,
  retryIfFailed,
  ZERO_ADDRESS,
} from "utils";
const buildPoseidon = require("circomlibjs").buildPoseidon;

let poseidon: any;
const defaultCandidates = initCandidates();

const BOT_PLAYER_ADDRESS = "0x951444F56EF94FeC42e8cDBeDef1A4Dc1D1ea63B";

class Solution {
  readonly numbers: FourNumbers;
  readonly salt: BigNumber;
  readonly hash: BigNumber;

  constructor() {
    this.numbers = randomSample(defaultCandidates);
    console.log("Solution: ", this.numbers);
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
    // TODO: filterCandidates doesn't work properly...
    this.candidates = filterCandidates(this.candidates, guess, hit, blow);
    console.log("updateCandidates: ", this.candidates.length);
    if (this.candidates.length === 0) {
      // This shouldn't happen... but there seems to be a bug...
      this.candidates = defaultCandidates;
    }
  }

  guess() {
    const guess = randomSample(this.candidates);
    this.lastGuess = guess;
    // return [1, 2, 3, 4] as FourNumbers;
    return guess;
  }
}
let bots: Bot[] = [];
const contracts = AvailableChains.map((chain) => {
  return new ethers.Contract(
    chain.contractAddress,
    HitAndBlowJson.abi,
    new ethers.Wallet(
      process.env.PRIVATE_KEY as string,
      ethers.getDefaultProvider(chain.url)
    )
  ) as HitAndBlow;
});

const RESET_PERIOD = 60 * 1;
class Bot {
  readonly contract: HitAndBlow;
  readonly player: Player;
  public lastActionTime: Date;
  readonly timerId;

  constructor(_contract: HitAndBlow) {
    this.contract = _contract;
    this.player = new Player();
    this.lastActionTime = new Date();
    this.timerId = setInterval(() => this.checkActivity(), 10000);
    this.contract.on("Initialize", this.onInitialize);
    this.contract.on("StageChange", this.onStageChange);
    this.contract.on("RoundChange", this.onRoundChange);
    this.contract.on("SubmitGuess", this.onSubmitGuess);
    this.contract.on("SubmitHB", this.onSubmitHB);
    console.log("Listen Events");
  }
  async checkActivity() {
    const seconds =
      (new Date().getTime() - this.lastActionTime.getTime()) / 1000;
    if (seconds > RESET_PERIOD) {
      console.log("Reset!!! ", seconds);
      this.lastActionTime = new Date();
      try {
        const tx = await this.contract.initialize();
        await tx.wait();
      } catch (err) {
        console.log(err);
      }
    }
  }
  cleanup() {
    this.contract.removeAllListeners();
    clearInterval(this.timerId);
  }
  onInitialize = () => {
    this.cleanup();
    console.log("onInitialize");
  };
  onSubmitHB = async (
    address: string,
    currentRound: number,
    hit: number,
    blow: number
  ) => {
    console.log("onSubmitHB");
    if (address !== BOT_PLAYER_ADDRESS) {
      this.lastActionTime = new Date();
      this.player.updateCandidates(this.player.lastGuess!, hit, blow);
    }
  };

  onStageChange = async (stage: number) => {
    this.lastActionTime = new Date();
    console.log(`Stage: ${stage}`);
    if (stage === 1) {
      await this.commitSolutionHash();
    } else if (stage === 2) {
      await this.submitGuess(this.player.guess());
    } else if (stage === 3) {
      await this.revealSolution();
    }
  };

  onRoundChange = async (round: number) => {
    console.log(`Round: ${round}`);
    await this.submitGuess(this.player.guess());
  };

  onSubmitGuess = async (
    address: string,
    currentRound: number,
    a: ZeroToNine,
    b: ZeroToNine,
    c: ZeroToNine,
    d: ZeroToNine
  ) => {
    console.log("onSubmitGuess");
    if (address !== BOT_PLAYER_ADDRESS) {
      this.lastActionTime = new Date();
      const guess = [a, b, c, d] as FourNumbers;
      const solution = this.player.solution;
      const solutionNumbers = solution.numbers;
      const [hit, blow] = calculateHB(guess, solutionNumbers);
      await this.submitProof(guess, solution, hit, blow);
    }
  };

  async register() {
    await retryIfFailed(this.contract.register)().catch((err) => {
      console.log(err);
      throw Error(err);
    });
  }

  async commitSolutionHash() {
    console.log("commitSolutionHash");
    const solution = this.player.solution;
    const solutionHash = solution.hash;
    await retryIfFailed(this.contract.commitSolutionHash)(solutionHash).catch(
      (err) => {
        console.log(err);
        throw Error(err);
      }
    );
  }

  async submitGuess(guess: FourNumbers) {
    console.log(guess);
    await retryIfFailed(this.contract.submitGuess)(...guess).catch((err) => {
      console.log(err);
      throw Error(err);
    });
  }

  async submitProof(
    guess: FourNumbers,
    solution: Solution,
    hit: number,
    blow: number
  ) {
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
    await retryIfFailed(this.contract.submitHbProof)(...proof).catch((err) => {
      console.log(err);
      throw Error(err);
    });
  }

  async revealSolution() {
    const winner = await this.contract.winner();
    if (BOT_PLAYER_ADDRESS === winner) {
      const solution = this.player.solution;
      await retryIfFailed(this.contract.reveal)(
        solution.salt,
        ...solution.numbers
      ).catch((err) => {
        console.log(err);
        throw Error(err);
      });
    }
  }
}

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
  const contract = contracts[chainIdx];

  const players = await contract.getplayers();
  if (players.includes(BOT_PLAYER_ADDRESS)) {
    return res.status(200).json({ result: "registered" });
  } else if (
    players.filter((address) => address === ZERO_ADDRESS).length !== 1
  ) {
    return res.status(200).json({ result: "player should register first" });
  }

  if (!poseidon) {
    poseidon = await buildPoseidon();
  }

  bots[chainIdx]?.cleanup();
  delete bots[chainIdx];
  const bot = new Bot(contract);
  bot.register();
  bots[chainIdx] = bot;
  res.status(200).json({ result: "ok" });
}

// TODO: no memory leak?
// setInterval(() => {
//   const used = process.memoryUsage();
//   const messages = [];
//   for (let key in used) {
//     messages.push(
//       `${key}: ${
//         Math.round(
//           (used[key as keyof NodeJS.MemoryUsage] / 1024 / 1024) * 100
//         ) / 100
//       } MB`
//     );
//   }
//   console.log(new Date(), messages.join(", "));
// }, 1 * 60 * 1000);
