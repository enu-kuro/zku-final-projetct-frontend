import { useCallback, useEffect, useRef, useState } from "react";
import { useHbContract } from "hooks/useContract";
import { hooks as metaMaskHooks } from "connectors/metaMask";
import { FourNumbers, HBNum, ProofInput, ZeroToNine } from "types";
import {
  calculateHB,
  generateProof,
  retrieveSolutionInfo,
  Stage,
  ZERO_ADDRESS,
} from "utils";
import dynamic from "next/dynamic";
import { SubmissionHistoryView } from "./SubmissionHistoryView";
import { Button } from "./Button";
import { UserInfo } from "./UserInfo";
import Link from "next/link";
import toast from "react-hot-toast";
import { useReward } from "react-rewards";
import { useChains } from "hooks/useChains";

const WrappedReactPinField = dynamic(() => import("./WrappedReactPinField"), {
  ssr: false,
});

type PlayerIndex = -1 | 0 | 1;

const WinBadge = () => {
  return (
    <div className="badge badge-accent absolute -left-5 -top-5 w-30 h-10 text-2xl font-extrabold">
      WIN!
    </div>
  );
};

const DrawBadge = () => {
  return (
    <div className="badge badge-accent absolute -left-5 -top-5 w-20 h-8 text-lg font-bold">
      DRAW
    </div>
  );
};

export const GamePlayView = ({
  stage,
  players,
  isPlayer,
}: {
  stage: number;
  players: [string, string];
  isPlayer?: boolean;
}) => {
  // reward function isn't memorized in react-rewards though it should be.
  // https://github.com/thedevelobear/react-rewards/blob/master/src/hooks/useReward.ts
  const { reward } = useReward("winReward", "confetti", {
    lifetime: 1000,
    startVelocity: 20,
  });
  const { isMainnet } = useChains();
  const [solution, solutionHash, salt] = isPlayer
    ? retrieveSolutionInfo()
    : [null, null, null];
  const contract = useHbContract();

  const account = metaMaskHooks.useAccount()!; // must not undefined
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [guesses, setGuesses] = useState<[FourNumbers[], FourNumbers[]]>([
    [],
    [],
  ]);
  const [hbNums, setHbNums] = useState<[HBNum[], HBNum[]]>([[], []]);
  const [guess, setGuess] = useState("");
  const [proofTargetGuess, setProofTargetGuess] = useState<FourNumbers>();

  const myIndex = players.indexOf(account) as PlayerIndex;
  const opponentIndex = (isPlayer ? myIndex ^ 1 : -1) as PlayerIndex;
  const canSubmitGuess =
    account && guess.length === 4
      ? guesses[myIndex]?.length < currentRound
      : false;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const leftSideIdx = isPlayer ? myIndex : 0;
  const rightSideIdx = isPlayer ? opponentIndex : 1;

  const resetPinFieldRef = useRef<() => void>();
  const isRevealStage = stage === Stage.Reveal;
  const [winner, setWinner] = useState<string>();
  const winnerIdx = (winner ? players.indexOf(winner) : -1) as PlayerIndex;
  const [revealedSolutions, setRevealedSolutions] = useState<
    [FourNumbers | null, FourNumbers | null]
  >([null, null]);
  const shouldReveal =
    isRevealStage && account === winner && !revealedSolutions[0];
  const notRevealed = !revealedSolutions[0] && !revealedSolutions[1];
  const [isDraw, setIsDraw] = useState<boolean>();

  useEffect(() => {
    if (winner === account && guesses[myIndex]) {
      setRevealedSolutions((prevState) => [
        prevState[0],
        guesses[myIndex][guesses[myIndex].length - 1],
      ]);
    }
  }, [account, guesses, myIndex, winner]);

  useEffect(() => {
    const getCurrentState = async () => {
      if (!contract || !account) return;
      console.log("getCurrentState");
      const winner = await contract.winner();
      setWinner(winner);
      const _currentRound = await contract.currentRound();
      setCurrentRound(_currentRound || 1);

      Promise.all([
        ...players.map((player) => {
          return contract.getSubmittedGuess(player).then((guess) => {
            return guess
              .filter((guess) => guess.submitted)
              .map(
                (guess) =>
                  [guess[0], guess[1], guess[2], guess[3]] as FourNumbers
              );
          });
        }),
        ...players.map((player) => {
          return contract.getSubmittedHB(player).then((hb) => {
            return hb
              .filter((hb) => hb.submitted)
              .map((hb) => {
                return { hit: hb[0], blow: hb[1] };
              });
          });
        }),
      ])
        .then((results) => {
          setGuesses([
            results[0] as FourNumbers[],
            results[1] as FourNumbers[],
          ]);
          setHbNums([results[3] as HBNum[], results[2] as HBNum[]]);
          const myIndex = players.indexOf(account);
          if (myIndex === 0 && results[1].length > results[2].length) {
            setProofTargetGuess(
              (results[1] as FourNumbers[])[results[1].length - 1]
            );
          } else if (myIndex === 1 && results[0].length > results[3].length) {
            setProofTargetGuess(
              (results[0] as FourNumbers[])[results[0].length - 1]
            );
          }
        })
        .catch((err) => {
          console.log(err);
        });
    };
    getCurrentState();
  }, [account, contract, players]);

  const submitProof = async () => {
    if (proofTargetGuess && solution) {
      setIsSubmittingProof(true);
      const [hit, blow] = calculateHB(proofTargetGuess, solution);
      const proofInput: ProofInput = {
        pubGuessA: proofTargetGuess[0],
        pubGuessB: proofTargetGuess[1],
        pubGuessC: proofTargetGuess[2],
        pubGuessD: proofTargetGuess[3],
        pubNumHit: hit,
        pubNumBlow: blow,
        pubSolnHash: solutionHash,
        privSolnA: solution[0],
        privSolnB: solution[1],
        privSolnC: solution[2],
        privSolnD: solution[3],
        privSalt: salt,
      };

      try {
        const proof = await generateProof(proofInput);
        // if both player's submitHbProof tx is in the same block, latter's gas limit is not enough.
        const tx = await contract?.submitHbProof(...proof, {
          gasLimit: 450000,
        });
        await tx?.wait();
      } catch (err) {
        console.log(err);
        setIsSubmittingProof(false);
        toast.error("Error!");
      }
    } else {
      throw Error();
    }
  };

  useEffect(() => {
    const onSubmitGuess = async (
      player: string,
      currentRound: number,
      a: ZeroToNine,
      b: ZeroToNine,
      c: ZeroToNine,
      d: ZeroToNine
    ) => {
      const guess = [a, b, c, d] as FourNumbers;
      const playerIndex = players.indexOf(player);
      console.log("onSubmitGuess", guess, playerIndex);
      if (playerIndex === 0) {
        setGuesses((prevState) => [
          [...prevState[playerIndex], guess],
          prevState[1],
        ]);
      } else if (playerIndex === 1) {
        setGuesses((prevState) => [
          prevState[0],
          [...prevState[playerIndex], guess],
        ]);
      }
      if (player !== account && players.indexOf(account!) > -1) {
        setProofTargetGuess(guess);
      }
      if (player === account) {
        setIsSubmitting(false);
        resetPinFieldRef.current?.();
      }
    };
    const onSubmitHB = (
      player: string,
      currentRound: number,
      hit: number,
      blow: number
    ) => {
      console.log(`onSubmitHB`, player);
      const hb = { hit, blow };
      const playerIndex = players.indexOf(player);
      if (playerIndex === 0) {
        setHbNums((prevState) => [
          prevState[playerIndex],
          [...prevState[1], hb],
        ]);
      } else if (playerIndex === 1) {
        setHbNums((prevState) => [
          [...prevState[0], hb],
          prevState[playerIndex],
        ]);
      }
      if (player === account) {
        setIsSubmittingProof(false);
      }
      setCurrentRound(currentRound);
    };

    const onReveal = async (
      player: string,
      a: ZeroToNine,
      b: ZeroToNine,
      c: ZeroToNine,
      d: ZeroToNine
    ) => {
      console.log("onReveal");
      toast.success("Solution Revealed!");
      const solution = [a, b, c, d] as FourNumbers;
      const playerIndex = players.indexOf(player);
      if (playerIndex === leftSideIdx) {
        setRevealedSolutions((prevState) => [solution, prevState[1]]);
      } else {
        setRevealedSolutions((prevState) => [prevState[0], solution]);
      }
    };

    const onGameFinish = (winner?: string) => {
      console.log("onGameFinish: ", winner);
      setWinner(winner);
      if (winner === account) {
        reward();
      }
      if (winner === ZERO_ADDRESS) {
        setIsDraw(true);
      } else {
        setIsDraw(false);
      }
    };

    if (
      contract?.listenerCount("SubmitGuess") === 0 &&
      !players.includes(ZERO_ADDRESS)
    ) {
      console.log("listen!!!");
      // linsten only once
      contract?.on("SubmitGuess", onSubmitGuess);
      contract?.on("SubmitHB", onSubmitHB);
      contract?.on("GameFinish", onGameFinish);
      contract?.on("Reveal", onReveal);
    }
    return () => {
      console.log("unlisten!!!");
      contract?.off("SubmitGuess", onSubmitGuess);
      contract?.off("SubmitHB", onSubmitHB);
      contract?.off("GameFinish", onGameFinish);
      contract?.off("Reveal", onReveal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    account,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    players[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    players[1],
    contract,
    leftSideIdx,
    myIndex,
  ]);

  const submitGuess = async () => {
    const guessArray: FourNumbers = guess
      .split("")
      .map((num) => Number(num)) as FourNumbers;
    setIsSubmitting(true);
    try {
      const tx = await contract?.submitGuess(...guessArray);
      await tx?.wait();
    } catch (err) {
      console.log(err);
      setIsSubmitting(false);
      toast.error("Error!");
    }
  };

  const handleOnChange = (guess: string) => {
    setGuess(guess);
  };

  const [isRevealing, setIsRevealing] = useState(false);

  const handleReveal = async () => {
    if (solution) {
      setIsRevealing(true);
      try {
        const tx = await contract?.reveal(
          salt,
          solution[0],
          solution[1],
          solution[2],
          solution[3]
        );
        await tx?.wait();
      } catch (err) {
        console.log(err);
        setIsRevealing(false);
        toast.error("Error!");
      }
    }
  };

  const renderSubmitArea = () => {
    if (isDraw) {
      return (
        <Link href={`/${isMainnet ? "?mainnet" : ""}`}>
          <a className="mt-6">Go back to Top</a>
        </Link>
      );
    } else if (isRevealStage) {
      if (shouldReveal) {
        return (
          <>
            <div className="text-2xl mt-6">Please reveal your solution.</div>
            <Button
              className={"btn btn-lg mt-4"}
              onClick={handleReveal}
              loading={isRevealing}
            >
              Reveal
            </Button>
          </>
        );
      } else if (notRevealed) {
        return (
          <div className="text-2xl mt-6">
            Opponent revealing its solution...
          </div>
        );
      } else {
        return (
          <Link href={`/${isMainnet ? "?mainnet" : ""}`}>
            <a className="mt-6">Go back to Top</a>
          </Link>
        );
      }
    } else {
      return (
        <div className="container text-center mt-6">
          <WrappedReactPinField
            className="pin-field"
            validate="0123456789"
            inputMode="numeric"
            onChange={handleOnChange}
            length={4}
            resetPinFieldRef={resetPinFieldRef}
          />
          <Button
            className={"btn btn-lg mt-6"}
            onClick={submitGuess}
            disabled={!canSubmitGuess}
            loading={isSubmitting}
          >
            Submit
          </Button>
        </div>
      );
    }
  };
  return (
    <>
      <div className="flex flex-row gap-x-6 mt-12">
        <div className="relative w-56 min-h-[24rem] border-4 rounded-3xl border-slate-200 border-solid">
          {winnerIdx === leftSideIdx && <WinBadge />}
          {isDraw && <DrawBadge />}
          <span id="winReward" />
          <div className="mt-3 text-center">
            <UserInfo address={players[leftSideIdx]} />
          </div>
          <div className="mt-1 text-center text-4xl tracking-widest">
            {solution ||
              revealedSolutions[0] ||
              ((winnerIdx === rightSideIdx || isDraw) &&
                guesses[1][guesses[1].length - 1]) ||
              "????"}
          </div>

          <SubmissionHistoryView
            guesses={guesses[leftSideIdx]}
            hbNums={hbNums[leftSideIdx]}
          />
        </div>
        <div className="relative w-56 min-h-[24rem] border-4 rounded-3xl border-slate-200 border-solid">
          {winnerIdx === rightSideIdx && <WinBadge />}
          {isDraw && <DrawBadge />}
          <div className="mt-3 text-center">
            <UserInfo address={players[rightSideIdx]} />
          </div>
          <div className="mt-1 text-center text-4xl tracking-widest">
            {revealedSolutions[1] ||
              ((winnerIdx === leftSideIdx || isDraw) &&
                guesses[0][guesses[0].length - 1]) ||
              "????"}
          </div>
          <SubmissionHistoryView
            guesses={guesses[rightSideIdx]}
            hbNums={hbNums[rightSideIdx]}
            isSubmitting={isSubmittingProof}
            submitProofCallback={isPlayer ? submitProof : undefined}
          />
        </div>
      </div>
      {isPlayer && renderSubmitArea()}
    </>
  );
};
