import { Contract, ContractInterface } from "@ethersproject/contracts";
import { useMemo } from "react";
import { AddressZero } from "@ethersproject/constants";
import { isAddress } from "ethers/lib/utils";
import { HitAndBlow } from "typechain";
import HbContract from "contracts/HitAndBlow.json";
import { useChains } from "./useChains";
import { hooks as metaMaskHooks } from "connectors/metaMask";
const { useChainId, useAccount, useProvider } = metaMaskHooks;

export const useContract = <T extends Contract>(
  address: string,
  ABI: ContractInterface
): T | null => {
  const provider = useProvider();
  const account = useAccount();
  const chainId = useChainId();
  const { selectedChain } = useChains();

  return useMemo(() => {
    if (!address || !ABI || !chainId || !provider) {
      return null;
    }
    if (chainId !== selectedChain?.id) {
      return null;
    }
    if (!isAddress(address) || address === AddressZero) {
      throw Error(`Invalid 'address' parameter '${address}'.`);
    }
    try {
      return new Contract(address, ABI, provider.getSigner(account));
    } catch (error) {
      console.error("Failed To Get Contract", error);
      return null;
    }
  }, [address, ABI, chainId, provider, selectedChain?.id, account]) as T;
};

export const useHbContract = () => {
  const { selectedChain } = useChains();
  return useContract<HitAndBlow>(
    selectedChain?.contractAddress || "",
    HbContract.abi
  );
};

export const useHbContractWithUrl = useHbContract;
/*
// It seems MetaMask Provider is't stable about event listening...
import { hooks as urlHooks } from "connectors/url";

export const useHbContractWithUrl = () => {
  const provider = urlHooks.useProvider();
  const { selectedChain } = useChains();
  return useMemo(() => {
    if (!provider) {
      return null;
    }
    console.log(selectedChain?.contractAddress);
    return new Contract(
      selectedChain?.contractAddress || "",
      HbContract.abi,
      provider
    );
  }, [provider, selectedChain?.contractAddress]) as HitAndBlow;
};
*/
