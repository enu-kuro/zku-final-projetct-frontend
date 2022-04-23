import { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useHbContract } from "hooks/useContract";
import {
  Button,
  Center,
  Text,
  Stack,
  Space,
  Title,
  Container,
} from "@mantine/core";
import { retrieveSolutionInfo } from "utils";
import { SolutionInfoPanel } from "./SolutionInfoPanel";
import { SubmissionHistoryView } from "./SubmissionHistoryView";
import { FourNumbers, HBNum } from "types";

export const RevealView = ({ opponent }: { opponent: string }) => {
  const contract = useHbContract();
  const { account } = useWeb3React();
  const [solution, solutionHash, salt] = retrieveSolutionInfo();
  const [isWinner, setIsWinner] = useState<boolean>();

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [myGuesses, setMyGuesses] = useState<FourNumbers[]>([]);
  const [myHBNums, setMyHBNums] = useState<HBNum[]>([]);
  const [opponentGuesses, setOpponentGuesses] = useState<FourNumbers[]>([]);
  const [opponentHBNums, setOpponentHBNums] = useState<HBNum[]>([]);

  useEffect(() => {
    const getWinner = async () => {
      const winner = await contract?.winner();
      if (winner === account) {
        setIsWinner(true);
      } else {
        setIsWinner(false);
      }
    };
    getWinner();

    // TODO: GamePlayViewと処理共通化
    if (!opponent || !account) {
      return;
    }
    const getCurrentState = async () => {
      console.log("getCurrentState");
      const _currentRound = await contract?.currentRound();
      setCurrentRound(_currentRound || 1);
      const myGuess = await contract?.getSubmittedGuess(account || "");
      if (myGuess) {
        setMyGuesses(
          myGuess
            .filter((guess) => guess.submitted)
            .map(
              (guess) => [guess[0], guess[1], guess[2], guess[3]] as FourNumbers
            )
        );
      }
      const myHB = await contract?.getSubmittedHB(opponent || "");
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
      }
    };
    getCurrentState();
  }, [account, contract, opponent]);

  const revealSolution = () => {
    contract?.reveal(salt, solution[0], solution[1], solution[2], solution[3]);
  };
  const renderWinView = () => {
    return (
      <Stack>
        <Center>
          <Text size="xl">You win🎉</Text>
        </Center>
        <Button
          type="submit"
          variant="outline"
          color="pink"
          onClick={revealSolution}
        >
          Reveal Your Solution
        </Button>
      </Stack>
    );
  };
  if (isWinner === undefined) {
    return <Text>Loading...</Text>;
  }
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
        <Container>
          {isWinner ? renderWinView() : <Text size="xl">You lose🤕</Text>}
        </Container>
      </Stack>
    </Center>
  );
};
