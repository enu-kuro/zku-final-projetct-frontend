import { useEffect, useState, useCallback } from "react";
import { useWeb3React } from "@web3-react/core";
import { useHbContract } from "hooks/useContract";
import {
  Button,
  Center,
  Text,
  TextInput,
  Group,
  Container,
  Stack,
  Space,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { retrieveSolutionInfo } from "utils";
import {
  FourNumbers,
  HBNum,
  ProofInput,
  SolidityProof,
  ZeroToNine,
} from "types";
import { SolutionInfoPanel } from "./SolutionInfoPanel";
import { showNotification } from "@mantine/notifications";
import { SubmissionHistoryView } from "./SubmissionHistoryView";
const snarkjs = require("snarkjs");

// @ts-ignore
function buildSolidityProof(snarkProof, publicSignals) {
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

async function generateProof(inputs: ProofInput) {
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    "/HitAndBlow.wasm",
    "/HitAndBlow_0001.zkey"
  );

  const solidityProof = await buildSolidityProof(proof, publicSignals);

  return [
    solidityProof.a,
    solidityProof.b,
    solidityProof.c,
    solidityProof.input,
  ] as const;
}

function calculateHB(guess: FourNumbers, solution: FourNumbers) {
  const hit = solution.filter((sol, i) => {
    return sol === guess[i];
  }).length;

  const blow = solution.filter((sol, i) => {
    return sol !== guess[i] && guess.some((g) => g === sol);
  }).length;

  return [hit, blow];
}

export const GamePlayView = ({ opponent }: { opponent: string }) => {
  const [solution, solutionHash, salt] = retrieveSolutionInfo();
  const { account } = useWeb3React();
  const [currentRound, setCurrentRound] = useState<number>(1);
  const contract = useHbContract();
  const [myGuesses, setMyGuesses] = useState<FourNumbers[]>([]);
  const [myHBNums, setMyHBNums] = useState<HBNum[]>([]);
  const [opponentGuesses, setOpponentGuesses] = useState<FourNumbers[]>([]);
  const [opponentHBNums, setOpponentHBNums] = useState<HBNum[]>([]);
  const canSubmitGuess = myGuesses.length < currentRound;
  const [shouldSubmitProof, setShouldSubmitProof] = useState(false);

  const submitProof = useCallback(
    async (guess: FourNumbers) => {
      const [hit, blow] = calculateHB(guess, solution);
      const proofInput: ProofInput = {
        pubGuessA: guess[0],
        pubGuessB: guess[1],
        pubGuessC: guess[2],
        pubGuessD: guess[3],
        pubNumHit: hit,
        pubNumBlow: blow,
        pubSolnHash: solutionHash,
        privSolnA: solution[0],
        privSolnB: solution[1],
        privSolnC: solution[2],
        privSolnD: solution[3],
        privSalt: salt,
      };
      const proof = await generateProof(proofInput);
      contract?.submitHbProof(...proof);
    },
    [contract, salt, solution, solutionHash]
  );

  useEffect(() => {
    if (!opponent || !account) {
      return;
    }

    // state取得(reloading対応)
    const getCurrentState = async () => {
      console.log("getCurrentState");
      const _currentRound = await contract?.currentRound();
      setCurrentRound(_currentRound || 1);
      const myGuess = await contract?.getSubmittedGuess(account);
      if (myGuess) {
        setMyGuesses(
          myGuess
            .filter((guess) => guess.submitted)
            .map(
              (guess) => [guess[0], guess[1], guess[2], guess[3]] as FourNumbers
            )
        );
      }
      const myHB = await contract?.getSubmittedHB(opponent);
      if (myHB) {
        setMyHBNums(
          myHB
            .filter((hb) => hb.submitted)
            .map((hb) => {
              return { hit: hb[0], blow: hb[1] };
            })
        );
      }

      const opponentGuess = await contract?.getSubmittedGuess(opponent);
      const opponentHB = await contract?.getSubmittedHB(account);
      if (opponentGuess && opponentHB) {
        const filteredOpponentGuess = opponentGuess
          .filter((guess) => guess.submitted)
          .map(
            (guess) => [guess[0], guess[1], guess[2], guess[3]] as FourNumbers
          );
        setOpponentGuesses(filteredOpponentGuess);

        const filteredOpponentHB = opponentHB
          .filter((hb) => hb.submitted)
          .map((hb) => {
            return { hit: hb[0], blow: hb[1] };
          });
        setOpponentHBNums(filteredOpponentHB);

        if (filteredOpponentGuess.length > filteredOpponentHB.length) {
          setShouldSubmitProof(true);
        }
      }
    };
    getCurrentState();
  }, [account, contract, opponent]);

  useEffect(() => {
    // TODO: Eventの挙動は不安定な気がする...必要な情報は毎回fetchし直す方が良い？
    const onSubmitGuess = async (
      player: string,
      currentRound: number,
      a: ZeroToNine,
      b: ZeroToNine,
      c: ZeroToNine,
      d: ZeroToNine
    ) => {
      const guess = [a, b, c, d] as FourNumbers;
      if (account === player) {
        console.log(`onSubmitGuess`);
        if (myGuesses.length === currentRound) {
          return;
        }
        setMyGuesses([...myGuesses, guess]);
      } else {
        if (opponentGuesses.length === currentRound) {
          return;
        }
        setOpponentGuesses([...opponentGuesses, guess]);
        submitProof(guess);
        showNotification({
          color: "teal",
          title: "Opponent submits guess",
          message: `Guess: [${a},${b},${c},${d}]`,
        });
      }
    };
    const onSubmitHB = (
      player: string,
      currentRound: number,
      hit: number,
      blow: number
    ) => {
      console.log(`onSubmitHB`);
      if (account !== player) {
        setMyHBNums([...myHBNums, { hit, blow }]);
      } else {
        setShouldSubmitProof(false);
        setOpponentHBNums([...opponentHBNums, { hit, blow }]);
      }
      setCurrentRound(currentRound);
    };

    contract?.on("SubmitGuess", onSubmitGuess);
    contract?.on("SubmitHB", onSubmitHB);

    return () => {
      contract?.off("SubmitGuess", onSubmitGuess);
      contract?.off("SubmitHB", onSubmitHB);
    };
  }, [
    account,
    contract,
    myGuesses,
    myHBNums,
    opponentGuesses,
    opponentHBNums,
    salt,
    solution,
    solutionHash,
    submitProof,
  ]);

  const form = useForm({
    initialValues: {
      guess: "",
    },

    validate: {
      guess: (value: string) =>
        /^(?!.*(.).*\1)[0-9]{4}$/.test(value) ? null : "Invalid Guess",
    },
  });

  const submitGuess = async (guessStr: string) => {
    const guessArray: FourNumbers = guessStr
      .split("")
      .map((num) => Number(num)) as FourNumbers;
    console.log(guessArray);
    form.setFieldValue("guess", "");
    contract?.submitGuess(...guessArray);
  };

  return (
    <Center>
      <Stack>
        <SolutionInfoPanel />
        <Space h="md" />
        <Title>{`Round: ${currentRound}`}</Title>
        <SubmissionHistoryView
          myGuesses={myGuesses}
          myHBNums={myHBNums}
          opponentGuesses={opponentGuesses}
          opponentHBNums={opponentHBNums}
        />
        <Space h="md" />
        {shouldSubmitProof && (
          <Container>
            <Button
              variant="outline"
              color="pink"
              onClick={() =>
                submitProof(opponentGuesses[opponentGuesses.length - 1])
              }
            >
              Submit Proof
            </Button>
          </Container>
        )}
        {!canSubmitGuess ? (
          <Text align="center" size="md">
            Please wait...
          </Text>
        ) : (
          <Container>
            <form onSubmit={form.onSubmit(({ guess }) => submitGuess(guess))}>
              <TextInput
                required
                label="Guess"
                placeholder="0123"
                {...form.getInputProps("guess")}
              />

              <Group position="center" mt="md">
                <Button type="submit" variant="outline" color="pink">
                  Submit Guess
                </Button>
              </Group>
            </form>
          </Container>
        )}
      </Stack>
    </Center>
  );
};
