import React from "react";
import { createStyles, Title, Header, Button, Container } from "@mantine/core";
import { useHbContract } from "hooks/useContract";

const useStyles = createStyles((theme) => ({
  inner: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    height: 56,
  },

  right: {
    position: "absolute",
    right: "20px",
  },
}));

export const AppHeader = ({ initialize }: { initialize: () => void }) => {
  const { classes } = useStyles();
  const contract = useHbContract();
  return (
    <Header height={56} mb={120}>
      <Container className={classes.inner} fluid>
        <Title order={1}>Hit And Blow!</Title>
        {contract && (
          <Button className={classes.right} color="red" onClick={initialize}>
            Initialize
          </Button>
        )}
      </Container>
    </Header>
  );
};
