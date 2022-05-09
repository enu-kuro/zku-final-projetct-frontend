import { useChains } from "./useChains";
import { useEffect, useRef, useState } from "react";
import { hooks as metaMaskHooks, metaMask } from "connectors/metaMask";

const { useChainId, useAccount, useError, useIsActive, useIsActivating } =
  metaMaskHooks;

function usePrevious(value: any) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
export default function useAuth() {
  const [isConnecting, setIsConnecting] = useState(true);
  const user = useAccount();
  const chainId = useChainId();
  const isActive = useIsActive();
  const isActivating = useIsActivating();
  const prevIsActivating = usePrevious(isActivating);
  const error = useError();
  const { selectedChain } = useChains();

  useEffect(() => {
    if (chainId && selectedChain && chainId !== selectedChain?.id) {
      console.log("wrong chain: ", chainId, selectedChain?.id);
      console.log("deactivate");
      metaMask.deactivate();
    }
  }, [chainId, selectedChain, selectedChain?.id]);

  useEffect(() => {
    if (isActive) {
      setIsConnecting(false);
    }
    // eager connect finished
    if (prevIsActivating && !isActivating) {
      console.log("eager connect finished");
      setIsConnecting(false);
    }
  }, [chainId, isActivating, isActive, prevIsActivating]);

  return { user, isConnecting, isActive, error, chainId };
}
