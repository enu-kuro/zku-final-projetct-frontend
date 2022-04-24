import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { MantineProvider } from "@mantine/core";
import { Web3ReactProvider } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import { NotificationsProvider } from "@mantine/notifications";

function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider);
  // defaultは4000?
  library.pollingInterval = 1000;
  return library;
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Hit And Blow</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>

      <MantineProvider withGlobalStyles withNormalizeCSS>
        <NotificationsProvider position="top-center">
          <Web3ReactProvider getLibrary={getLibrary}>
            <Component {...pageProps} />
          </Web3ReactProvider>
        </NotificationsProvider>
      </MantineProvider>
    </>
  );
}

export default MyApp;
