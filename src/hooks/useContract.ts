import { Contract } from "@ethersproject/contracts";
import { useWeb3React } from "@web3-react/core";
import { useMemo } from "react";

export const useContract = <T extends Contract = Contract>(
  address: string,
  ABI: any
): T | null => {
  const { library, account, chainId } = useWeb3React();

  return useMemo(() => {
    if (!address || !ABI || !library || !chainId) {
      return null;
    }

    try {
      return new Contract(address, ABI, library.getSigner(account));
    } catch (error) {
      console.error("Failed To Get Contract", error);
      return null;
    }
  }, [address, ABI, library, chainId, account]) as T;
};

import { HitAndBlow } from "typechain";
import HitAndBlowJson from "contracts/HitAndBlow.json";
const CONTRACT_ADDRESS = "0x43b9AAF34367630360ffdbe48edB855f123b14f8";

export const useHbContract = () => {
  return useContract<HitAndBlow>(CONTRACT_ADDRESS, HitAndBlowJson.abi);
};
