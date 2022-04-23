import { Text, Container, Stack, Paper, Title } from "@mantine/core";
import { retrieveSolutionInfo } from "utils";

export const SolutionInfoPanel = () => {
  const [solution, solutionHash, salt] = retrieveSolutionInfo();
  return (
    <Container>
      <Paper shadow="lg" p="lg" withBorder>
        <Stack>
          <Title order={3}>Your Solution:</Title>
          <Text>{`[${solution}]`}</Text>
          <Title order={3}>Your SolutionHash:</Title>
          <Text>{`${solutionHash}`}</Text>
          <Title order={3}>Your SolutionHashSalt:</Title>
          <Text>{`${salt}`}</Text>
        </Stack>
      </Paper>
    </Container>
  );
};
