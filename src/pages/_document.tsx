import NextDocument, { Html, Head, Main, NextScript } from "next/document";

type Props = {};

class Document extends NextDocument<Props> {
  render() {
    return (
      // https://daisyui.com/docs/themes/
      <Html data-theme="lemonade">
        <Head>
          {/* eslint-disable-next-line @next/next/no-title-in-document-head */}
          <title>Hit And Blow onChain</title>
          <meta
            name="viewport"
            content="initial-scale=1.0, width=device-width"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default Document;
