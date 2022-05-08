import { useHbContractWithUrl } from "hooks/useContract";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import { CommitSolutionHashView } from "components/CommitSolutionHashView";
import { RegisterView } from "components/RegisterView";
import { GamePlayView } from "components/GamePlayView";
import { Header } from "components/Header";
import { Stage } from "utils";

const Game: NextPage = () => {
  const contract = useHbContractWithUrl();
  const [stage, setStage] = useState<Stage>(Stage.None);

  useEffect(() => {
    const onInitialize = () => {
      console.log("onInitialize");
      // setStage(0);
    };

    const onStageChange = (stage: number) => {
      if (stage > 0) {
        setStage(stage);
        console.log(`Stage: ${stage}`);
      }
    };
    if (contract?.listenerCount("StageChange") === 0) {
      contract?.on("Initialize", onInitialize);
      contract?.on("StageChange", onStageChange);
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
    if (stage === Stage.Register) {
      return <RegisterView />;
    } else if (stage === Stage.CommitSolutionHash) {
      return <CommitSolutionHashView />;
    } else if (stage === Stage.Playing || stage === Stage.Reveal) {
      return <GamePlayView stage={stage} />;
    }
    return <></>;
  };

  return (
    <>
      <Header centerText="Hit And Blow onChain" />
      <div className="prose container mx-auto flex flex-col">
        {renderView()}
      </div>
    </>
  );
};

export default Game;
