import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { hooks as metaMaskHooks, metaMask } from "connectors/metaMask";
import { HARMONY_TESTNET_CHAIN_ID } from "utils";
import { Header } from "components/Header";
import { MetaMaskButton } from "components/MetaMaskButton";

const Home: NextPage = () => {
  const error = metaMaskHooks.useError();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
    }
  }, [error]);

  const onClick = async () => {
    setIsLoading(true);
    await metaMask.activate(HARMONY_TESTNET_CHAIN_ID);
  };
  return (
    <>
      <Header />
      <div className="prose container mx-auto flex flex-col items-center mt-40">
        <h1 className="text-5xl font-bold mb-4">Hit And Blow onChain</h1>
        <div className="text-2xl mb-12">Full onchain PvP game</div>
        <MetaMaskButton className="btn" loading={isLoading} onClick={onClick} />
      </div>
    </>
  );
};

export default Home;
