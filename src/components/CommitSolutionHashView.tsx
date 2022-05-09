import { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useHbContract } from "hooks/useContract";
import { FourNumbers } from "types";
import { BigNumber, ethers } from "ethers";
import { saveSolutionInfo } from "utils";
import { ReactPinFieldProps } from "react-pin-field";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { Button } from "./Button";

// https://github.com/vercel/next.js/issues/4957
const WrappedReactPinField = dynamic<ReactPinFieldProps>(
  () => import("./WrappedReactPinField"),
  {
    ssr: false,
  }
);

const buildPoseidon = require("circomlibjs").buildPoseidon;

let poseidon: any;
(async () => {
  poseidon = await buildPoseidon();
})();

export const CommitSolutionHashView = () => {
  const { account } = useWeb3React();
  const [isLoading, setIsLoading] = useState(false);
  const [isCommittedSolutionHash, setIsCommittedSolutionHash] = useState(false);
  const contract = useHbContract();
  const [salt, setSalt] = useState<BigNumber>();
  const [solution, setSolution] = useState("");
  const [solutionHash, setSolutionHash] = useState<BigNumber>();
  const canSubmit = solution.length === 4 && salt && solutionHash;

  useEffect(() => {
    setSalt(ethers.BigNumber.from(ethers.utils.randomBytes(32)));
  }, []);

  useEffect(() => {
    const onCommitSolutionHash = async (player: string) => {
      console.log(`onCommitSolutionHash`);
      if (account === player) {
        setIsCommittedSolutionHash(true);
        setIsLoading(false);
        toast.success("SolutionHash committed!");
      }
    };
    contract?.on("CommitSolutionHash", onCommitSolutionHash);
    return () => {
      contract?.off("CommitSolutionHash", onCommitSolutionHash);
    };
  }, [account, contract]);

  const commitSolutionHash = async () => {
    if (canSubmit) {
      saveSolutionInfo(
        [...solution].map((s) => Number(s)) as FourNumbers,
        solutionHash,
        salt
      );
      setIsLoading(true);
      const tx = await contract
        ?.commitSolutionHash(solutionHash)
        .catch((err) => {
          console.log("error: ", err);
          setIsLoading(false);
        });
      await tx?.wait().catch((err) => {
        console.log(err);
        setIsLoading(false);
        toast.error("Error!");
      });
    }
  };

  const changeSalt = () => {
    setSalt(ethers.BigNumber.from(ethers.utils.randomBytes(32)));
  };

  const handleOnChange = (code: string) => {
    setSolution(code);
  };

  useEffect(() => {
    if (salt && solution.length === 4) {
      const solutionHash = ethers.BigNumber.from(
        poseidon.F.toObject(poseidon([salt, ...solution]))
      );
      setSolutionHash(solutionHash);
    } else {
      setSolutionHash(undefined);
    }
  }, [salt, solution]);

  if (isCommittedSolutionHash) {
    return (
      <div className="flex flex-col items-center mt-40">
        <div className="text-xl">Opponent is committing solution hash...</div>
        <div className="text-xl mt-2">Wait a minute.</div>
      </div>
    );
  }

  return (
    <div className="container w-80 border-4 rounded-3xl border-slate-200 border-solid mt-20 p-8">
      <div className="mb-4 text-center">
        <div className="text-3xl mb-2">Your Solution</div>
        <WrappedReactPinField
          onChange={handleOnChange}
          className="pin-field"
          validate="0123456789"
          inputMode="numeric"
          length={4}
        />
      </div>
      <div className="mb-5 text-center">
        <div className="text-xl">Salt</div>
        <div className="mb-2 text-xs break-all">{salt?.toString()}</div>
        <Button className="btn btn-sm" onClick={changeSalt}>
          Change Salt
        </Button>
      </div>
      <div className="text-center">
        <div className="text-xl">SolutionHash</div>
        <div className="mb-2 text-xs break-all">
          {solutionHash?.toString() || "_ _ _ _ _ _ _ _ _"}
        </div>
        <Button
          className="btn btn-base"
          onClick={commitSolutionHash}
          disabled={!canSubmit}
          loading={isLoading}
        >
          Commit SolutionHash
        </Button>
      </div>
    </div>
  );
};
