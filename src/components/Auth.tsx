import { metaMask } from "connectors/metaMask";
import useAuth from "hooks/useAuth";
import { useChains } from "hooks/useChains";
import { useRouter } from "next/router";
import { ReactNode, useEffect } from "react";

export const Auth: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const { user, isActive, isConnecting, chainId } = useAuth();
  const { selectedChain, isMainnet } = useChains();
  const router = useRouter();

  useEffect(() => {
    // if unconnected, redirect to top
    if (!user && !isConnecting && router.pathname !== "/") {
      let queryString = "";
      if (isMainnet) {
        queryString = "?mainnet";
      }
      console.log("redirect to /");
      router.push(`/${queryString}`, undefined, { shallow: true });
    }
  }, [user, isConnecting, router, isMainnet]);

  useEffect(() => {
    if (
      isActive &&
      router.pathname !== "/game" &&
      selectedChain?.id === chainId
    ) {
      let queryString = "";
      if (isMainnet) {
        queryString = "?mainnet";
      }
      console.log("redirect to /game");
      router.push(`/game${queryString}`, undefined, { shallow: true });
    }
  }, [chainId, isActive, isMainnet, router, selectedChain?.id]);

  useEffect(() => {
    // connectEagerlyすると一時的にproviderのstateがresetされるようなのでtopで一度だけ実行させる
    console.log("connectEagerly");
    metaMask.connectEagerly();
  }, []);

  return <>{children}</>;
};
