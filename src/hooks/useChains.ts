import { useRouter } from "next/router";
import { AvailableChains } from "utils";

export const useChains = () => {
  const router = useRouter();
  // https://github.com/vercel/next.js/discussions/11484
  const isMainnet = "mainnet" === router.asPath.split(/\?/)[1];
  return {
    isMainnet,
    selectedChain: router.isReady
      ? AvailableChains[isMainnet ? 1 : 0]
      : undefined,
  };
};
