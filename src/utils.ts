import { BigNumber } from "ethers";
import { FourNumbers, ProofInput, SolidityProof } from "types";
const snarkjs = require("snarkjs");

const solutionInfoKeys = ["solutionArray", "solutionHash", "salt"];

export const saveSolutionInfo = (
  solutionArray: FourNumbers,
  solutionHash: BigNumber,
  salt: BigNumber
) => {
  localStorage.setItem(solutionInfoKeys[0], JSON.stringify(solutionArray));
  localStorage.setItem(solutionInfoKeys[1], solutionHash.toString());
  localStorage.setItem(solutionInfoKeys[2], salt.toString());

  console.log("saveSolutionInfo");
};

export const retrieveSolutionInfo = () => {
  const solutionArrayStr = localStorage.getItem(solutionInfoKeys[0]);
  const solutionHashStr = localStorage.getItem(solutionInfoKeys[1]);
  const saltStr = localStorage.getItem(solutionInfoKeys[2]);

  if (solutionArrayStr && solutionHashStr && saltStr) {
    return [
      JSON.parse(solutionArrayStr),
      BigNumber.from(solutionHashStr),
      BigNumber.from(saltStr),
    ];
  } else {
    throw new Error("SolutionInfo not found");
  }
};

// @ts-ignore
export function buildSolidityProof(snarkProof, publicSignals) {
  return {
    a: snarkProof.pi_a.slice(0, 2),
    b: [
      snarkProof.pi_b[0].slice(0).reverse(),
      snarkProof.pi_b[1].slice(0).reverse(),
    ],
    c: snarkProof.pi_c.slice(0, 2),
    input: publicSignals,
  } as SolidityProof;
}

import path from "path";
import getConfig from "next/config";
const serverPath = (staticFilePath: string) => {
  return path.join(
    getConfig().serverRuntimeConfig.PROJECT_ROOT,
    staticFilePath
  );
};

export async function generateProof(inputs: ProofInput) {
  let wasmPath = "/HitAndBlow.wasm";
  let zkeyPath = "/HitAndBlow_0001.zkey";
  if (typeof window === "undefined") {
    wasmPath = serverPath(`/public${wasmPath}`);
    zkeyPath = serverPath(`/public${zkeyPath}`);
  }
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    wasmPath,
    zkeyPath
  );

  const solidityProof = await buildSolidityProof(proof, publicSignals);

  return [
    solidityProof.a,
    solidityProof.b,
    solidityProof.c,
    solidityProof.input,
  ] as const;
}

export function calculateHB(guess: FourNumbers, solution: FourNumbers) {
  const hit = solution.filter((sol, i) => {
    return sol === guess[i];
  }).length;

  const blow = solution.filter((sol, i) => {
    return sol !== guess[i] && guess.some((g) => g === sol);
  }).length;

  return [hit, blow];
}
