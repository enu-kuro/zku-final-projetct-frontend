import { useEffect, useRef, useState } from "react";
import { hooks as metaMaskHooks, metaMask } from "connectors/metaMask";
import { HARMONY_TESTNET_CHAIN_ID } from "utils";

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

  useEffect(() => {
    if (chainId && chainId !== HARMONY_TESTNET_CHAIN_ID) {
      console.log("wrong chain: ", chainId);
      console.log("deactivate");
      metaMask.deactivate();
    }
  }, [chainId]);

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

  return { user, isConnecting, isActive, error };
}
