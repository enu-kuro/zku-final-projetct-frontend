import { useHbContract } from "hooks/useContract";
import { hooks as metaMaskHooks, metaMask } from "connectors/metaMask";
import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import toast from "react-hot-toast";
import { ProgressBar } from "./ProgressBar";
import { useChains } from "hooks/useChains";

const { useAccount } = metaMaskHooks;

export const RegisterView = () => {
  const contract = useHbContract();

  const account = useAccount();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const interval = useRef<NodeJS.Timer | null>(null);
  const { selectedChain } = useChains();

  useEffect(() => {
    const onRegister = async (player: string) => {
      console.log("onRegister");
      if (player === account) {
        toast.success("Registered!");
        setIsRegistered(true);
        setIsLoading(false);
        interval.current = setInterval(() => {
          setProgressValue((prevState) => prevState + 1);
        }, 180);

        await fetch("/api/bot", {
          method: "POST",
          body: JSON.stringify({ chainId: selectedChain?.id }),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }).catch((err) => {
          contract?.initialize();
          toast.error("Error!");
          console.log(err);
        });
      }
    };
    contract?.on("Register", onRegister);

    return () => {
      contract?.off("Register", onRegister);
    };
  }, [account, contract, selectedChain?.id]);

  useEffect(() => {
    return () => {
      if (interval.current !== null) {
        clearInterval(interval.current);
        interval.current = null;
      }
    };
  }, []);

  const register = async () => {
    setIsLoading(true);
    const tx = await contract?.register().catch((err) => {
      console.log("error: ", err);
      setIsLoading(false);
    });
    await tx?.wait().catch((err) => {
      console.log(err);
      setIsLoading(false);
      toast.error("Error!");
    });
  };

  return (
    <>
      <h1 className="text-5xl font-bold mt-40 mb-6">Hit And Blow onChain</h1>
      {isRegistered ? (
        <>
          <div className="text-xl">Activating bot player...</div>
          <div className="text-base mt-2">Wait a minute.</div>
          <ProgressBar
            value={progressValue}
            className="mt-8 progress-warning w-80"
          />
        </>
      ) : (
        <>
          <div className="text-xl mb-8">Register to play the game.</div>
          <Button
            className="btn btn-wide"
            loading={isLoading}
            onClick={register}
          >
            Register
          </Button>
        </>
      )}
    </>
  );
};
