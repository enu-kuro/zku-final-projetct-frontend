import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { hooks as metaMaskHooks, metaMask } from "connectors/metaMask";
import { Header } from "components/Header";
import { MetaMaskButton } from "components/MetaMaskButton";
import { useChains } from "hooks/useChains";
import { HarmonyLogo } from "components/HarmonyLogo";
import Head from "next/head";

const Home: NextPage = () => {
  const { selectedChain } = useChains();
  const error = metaMaskHooks.useError();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
    }
  }, [error]);

  const onClick = async () => {
    setIsLoading(true);
    await metaMask.activate(selectedChain?.id);
  };
  return (
    <>
      <Head>
        <title>Hit And Blow onChain</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Header canChangeChain={true} />
      <div className="prose container mx-auto flex flex-col items-center mt-40">
        <h1 className="text-5xl font-bold mb-4">Hit And Blow onChain</h1>
        <div className="text-2xl mb-10">Full onchain code-breaking game</div>
        <MetaMaskButton className="btn" loading={isLoading} onClick={onClick} />
        <HarmonyLogo />
      </div>
    </>
  );
};

export default Home;
