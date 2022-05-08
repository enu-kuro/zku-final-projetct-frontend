import { metaMask } from "connectors/metaMask";
import { url } from "connectors/url";
import useAuth from "hooks/useAuth";
import { useRouter } from "next/router";
import { ReactNode, useEffect } from "react";

export const Auth: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const { user, isActive, isConnecting } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user && !isConnecting && router.pathname !== "/") {
      // if unconnected, redirect to top
      console.log("redirect to /");
      router.push("/", undefined, { shallow: true });
    }
  }, [user, isConnecting, router]);

  useEffect(() => {
    if (isActive && router.pathname !== "/game") {
      console.log("redirect to /game");
      router.push("/game", undefined, { shallow: true });
    }
  }, [isActive, router]);

  useEffect(() => {
    // connectEagerlyすると一時的にproviderのstateがresetされるようなのでtopで一度だけ実行させる
    console.log("connectEagerly");
    metaMask.connectEagerly();
    url.activate();
  }, []);

  return <>{children}</>;
};
