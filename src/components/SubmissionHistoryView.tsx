import { Text, Title, Container, Group, Paper } from "@mantine/core";
import { FourNumbers, HBNum } from "types";

export const SubmissionHistoryView = ({
  myGuesses,
  myHBNums,
  opponentGuesses,
  opponentHBNums,
}: {
  myGuesses: FourNumbers[];
  myHBNums: HBNum[];
  opponentGuesses: FourNumbers[];
  opponentHBNums: HBNum[];
}) => {
  const historyView = (
    title: string,
    guesses: FourNumbers[],
    hbNums: HBNum[]
  ) => {
    return (
      <Container>
        <Paper shadow="lg" p="lg" withBorder>
          <Title order={3}>{title}</Title>
          {guesses.map((guess, i) => {
            let hbNum = "";
            if (hbNums.length > i) {
              hbNum = `(Hit: ${hbNums[i].hit}, Blow: ${hbNums[i].blow})`;
            }
            return <Text key={i}>{`Round ${i + 1}: [${guess}] ${hbNum}`}</Text>;
          })}
        </Paper>
      </Container>
    );
  };
  return (
    <Group>
      {historyView("Your Guess", myGuesses, myHBNums)}
      {historyView("Opponent Guess", opponentGuesses, opponentHBNums)}
    </Group>
  );
};
