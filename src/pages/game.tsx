import { useHbContract } from "hooks/useContract";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import { CommitSolutionHashView } from "components/CommitSolutionHashView";
import { RegisterView } from "components/RegisterView";
import { GamePlayView } from "components/GamePlayView";
import { Header } from "components/Header";
import { Stage, ZERO_ADDRESS } from "utils";
import { hooks as metaMaskHooks } from "connectors/metaMask";
import { HarmonyLogo } from "components/HarmonyLogo";
import toast from "react-hot-toast";

const Game: NextPage = () => {
  const account = metaMaskHooks.useAccount()!;
  const contract = useHbContract();
  const [stage, setStage] = useState<Stage>(Stage.None);
  const [players, setPlayers] = useState<[string, string]>();
  const isPlayer = players && players.indexOf(account) > -1;

  useEffect(() => {
    const getPlayers = async () => {
      if (contract) {
        const players = await contract.getplayers();
        setPlayers(players);
        console.log("getplayers:", players);
      }
    };
    getPlayers();

    const onInitialize = () => {
      console.log("onInitialize");
    };

    const onStageChange = (stage: number) => {
      if (stage > 0) {
        setStage(stage);
        console.log(`Stage: ${stage}`);
      }
      // TODO: When can I fetch updated latest block? When StageChanged, sometimes fetched block haven't yet inclueded both players.
      if (stage === Stage.Playing || stage === Stage.CommitSolutionHash) {
        getPlayers();
      }
    };
    if (contract?.listenerCount("StageChange") === 0 && contract) {
      contract.on("Initialize", onInitialize);
      contract.on("StageChange", onStageChange);
    }

    return () => {
      contract?.off("StageChange", onStageChange);
      contract?.off("Initialize", onInitialize);
    };
  }, [contract]);

  useEffect(() => {
    const getStage = async () => {
      if (contract) {
        const _stage = await contract.stage();
        setStage(_stage);
        console.log(`Stage: ${_stage}`);
      }
    };
    getStage();
  }, [contract]);

  const renderView = () => {
    if (!players) {
      return <></>;
    }
    if (stage === Stage.Register) {
      return <RegisterView />;
    } else if (stage === Stage.CommitSolutionHash) {
      if (!isPlayer) {
        return (
          <div className="flex flex-col items-center mt-40">
            <div className="text-xl">
              Players are committng their solution hash...
            </div>
            <div className="text-base mt-2">Wait a minute.</div>
          </div>
        );
      }
      return <CommitSolutionHashView />;
    } else if (
      stage === Stage.Playing ||
      stage === Stage.Reveal ||
      !players.includes(ZERO_ADDRESS)
    ) {
      return (
        <GamePlayView stage={stage} players={players} isPlayer={isPlayer} />
      );
    }
    return <></>;
  };

  return (
    <>
      <Header
        centerText={stage === Stage.Register ? "" : "Hit And Blow onChain"}
        isPlayer={isPlayer}
        canChangeChain={stage === Stage.Register}
      />
      <div className="prose container mx-auto flex flex-col items-center">
        {renderView()}
        <div className="text-center">
          <HarmonyLogo />
        </div>
      </div>
    </>
  );
};

export default Game;
