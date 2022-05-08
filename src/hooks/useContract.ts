import { Contract, ContractInterface } from "@ethersproject/contracts";
import { useMemo } from "react";
import { AddressZero } from "@ethersproject/constants";
import { isAddress } from "ethers/lib/utils";
import { HitAndBlow } from "typechain";
import HbContract from "contracts/HitAndBlow.json";
import { hooks as metaMaskHooks } from "connectors/metaMask";
const { useChainId, useAccount, useProvider } = metaMaskHooks;
import { CONTRACT_ADDRESS, HARMONY_TESTNET_CHAIN_ID } from "utils";

export const useContract = <T extends Contract>(
  address: string,
  ABI: ContractInterface
): T | null => {
  // const { provider, account, chainId } = useWeb3React();
  const provider = useProvider();
  const account = useAccount();
  const chainId = useChainId();
  return useMemo(() => {
    if (!address || !ABI || !chainId || !provider) {
      return null;
    }
    if (chainId !== HARMONY_TESTNET_CHAIN_ID) {
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
  }, [address, ABI, chainId, provider, account]) as T;
};

export const useHbContract = () => {
  return useContract<HitAndBlow>(CONTRACT_ADDRESS, HbContract.abi);
};

// It seems MetaMask Provider is't stable about event listening...
import { hooks as urlHooks, url } from "connectors/url";
export const useHbContractWithUrl = () => {
  const provider = urlHooks.useProvider();
  return useMemo(() => {
    if (!provider) {
      return null;
    }
    return new Contract(CONTRACT_ADDRESS, HbContract.abi, provider);
  }, [provider]) as HitAndBlow;
};
