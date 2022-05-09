import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AvailableChains } from "utils";

export const useChains = () => {
  const router = useRouter();

  // https://github.com/vercel/next.js/discussions/11484
  const isMainnet = "mainnet" === router.asPath.split(/\?/)[1];

  // https://www.benmvp.com/blog/handling-react-server-mismatch-error/
  const [isReady, setIsready] = useState(false);
  useEffect(() => {
    if (router.isReady) {
      setIsready(true);
    }
  }, [router.isReady]);

  return {
    isMainnet,
    selectedChain: isReady ? AvailableChains[isMainnet ? 1 : 0] : undefined,
  };
};
