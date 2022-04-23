import { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useHbContract } from "hooks/useContract";
import { Button, Center, Text } from "@mantine/core";

export const RegisterView = () => {
  const { account } = useWeb3React();
  const contract = useHbContract();
  const [isRegistered, setIsRegistered] = useState(false);

  const register = () => {
    contract?.register();
  };

  useEffect(() => {
    const onRegister = (player: string) => {
      // TODO: how to handle rejection?
      console.log("onRegister");
      if (player === account) {
        setIsRegistered(true);
      }
    };
    contract?.on("Register", onRegister);

    return () => {
      contract?.off("Register", onRegister);
    };
  }, [account, contract]);

  return (
    <Center style={{ height: 100 }}>
      {isRegistered ? (
        <Text size="md">Please wait...</Text>
      ) : (
        <Button variant="outline" color="pink" onClick={register}>
          Register
        </Button>
      )}
    </Center>
  );
};
