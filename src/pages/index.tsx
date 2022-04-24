import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import { InjectedConnector } from "@web3-react/injected-connector";
import { showNotification } from "@mantine/notifications";
import { useHbContract } from "hooks/useContract";
import {
  Button,
  Center,
  Text,
  Container,
  Space,
  LoadingOverlay,
  Stack,
} from "@mantine/core";

import { AppHeader } from "components/AppHeader";
import { GamePlayView } from "components/GamePlayView";
import { RevealView } from "components/RevealView";
import { RegisterView } from "components/RegisterView";
import { CommitSolutionHashView } from "components/CommitSolutionHashView";

const ConnectWallet = () => {
  const injectedConnector = new InjectedConnector({
    supportedChainIds: [1666700000], // Harmony testnet
  });
  const { activate } = useWeb3React<Web3Provider>();
  const onClick = () => {
    activate(injectedConnector);
  };
  return (
    <Center>
      <Stack>
        <Text>Currently only for Harmony testnet!</Text>
        <Button variant="outline" color="pink" onClick={onClick}>
          Connect Connect
        </Button>
      </Stack>
    </Center>
  );
};

//TODO: avoid too many rerenders...
const Home: NextPage = () => {
  const { active, account } = useWeb3React<Web3Provider>();
  const [stage, setStage] = useState(0);
  const contract = useHbContract();
  const [isLoading, setIsLoading] = useState(false);
  const [opponent, setOpponent] = useState("");

  useEffect(() => {
    setIsLoading(true);
    const getStage = async () => {
      const _stage = await contract?.stage();
      setStage(_stage || 0);
      console.log(`Stage: ${_stage}`);
      setIsLoading(false);
    };
    getStage();

    const onStageChange = (stage: number) => {
      setStage(stage);
      console.log(`Stage: ${stage}`);
    };
    contract?.on("StageChange", onStageChange);

    const onInitialize = () => {
      // TODO: how to handle rejection on Metamask?
      console.log("onInitialize");
      setIsLoading(false);
      setStage(0);
    };
    contract?.on("Initialize", onInitialize);

    const getPlayers = async () => {
      const players = await contract?.getplayers();
      if (players) {
        if (players[0] === account) {
          setOpponent(players[1]);
        } else {
          setOpponent(players[0]);
        }
        console.log(`players: ${players}`);
      }
    };
    getPlayers();

    const onRegister = (player: string) => {
      if (player !== account) {
        setOpponent(player);
      }
    };
    contract?.on("Register", onRegister);

    const onReveal = (
      player: string,
      a: number,
      b: number,
      c: number,
      d: number
    ) => {
      console.log("onReveal");
      if (player !== account) {
        showNotification({
          color: "teal",
          title: "Winner Revealed solution🐶",
          message: `Solution: [${a}${b}${c}${d}]`,
        });
      }
    };
    contract?.on("Reveal", onReveal);

    return () => {
      contract?.off("StageChange", onStageChange);
      contract?.off("Initialize", onInitialize);
      contract?.off("Register", onRegister);
      contract?.off("Reveal", onReveal);
    };
  }, [account, contract]);

  const renderView = () => {
    if (stage === 0) {
      return <RegisterView />;
    } else if (stage === 1) {
      return <CommitSolutionHashView />;
    } else if (stage === 2) {
      return <GamePlayView opponent={opponent} />;
    } else if (stage === 3) {
      return <RevealView opponent={opponent} />;
    } else if (stage === 4) {
      // currently stage is only 0 to 3
      return <Text>Finish!</Text>;
    }
  };
  const initialize = () => {
    setIsLoading(true);
    contract?.initialize();
    console.log("initialize");
  };

  return (
    <div>
      <LoadingOverlay visible={isLoading} />
      <AppHeader initialize={initialize} />
      <Container size="sm">
        <Space h="md" />
        {!active ? <ConnectWallet /> : renderView()}
      </Container>
    </div>
  );
};

export default Home;
