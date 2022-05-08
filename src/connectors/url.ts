import { JsonRpcProvider } from "@ethersproject/providers";
import { initializeConnector } from "@web3-react/core";
import { Url } from "@web3-react/url";
import { HARMONY_TESTNET_RPC_URL } from "utils";

const provider = new JsonRpcProvider(HARMONY_TESTNET_RPC_URL);
export const [url, hooks] = initializeConnector<Url>(
  (actions) => new Url(actions, provider)
);
