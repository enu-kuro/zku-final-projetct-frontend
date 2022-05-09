import "../styles/globals.css";
import type { AppProps } from "next/app";
import { Web3ReactProvider } from "@web3-react/core";
import { hooks as metaMaskHooks, metaMask } from "connectors/metaMask";
import ErrorBoundary from "components/ErrorBoundary";
import { Auth } from "components/Auth";
import { Toaster } from "react-hot-toast";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Web3ReactProvider
        connectors={[[metaMask, metaMaskHooks]]}
        network={"any"}
      >
        <Auth>
          <Component {...pageProps} />
          <Toaster position="top-right" />
        </Auth>
      </Web3ReactProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
