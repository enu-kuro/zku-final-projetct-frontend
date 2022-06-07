import { useHbContract } from "hooks/useContract";
import { useState } from "react";
import { Button } from "./Button";
import { GithubLink } from "./GithubLink";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { useChains } from "hooks/useChains";
import { AvailableChains } from "utils";
import { hooks as metaMaskHooks, metaMask } from "connectors/metaMask";
import { Tutorial } from "./Tutorial";
const { useAccount } = metaMaskHooks;

export const Header = ({
  centerText,
  isPlayer,
  canChangeChain,
}: {
  centerText?: string;
  isPlayer?: boolean;
  canChangeChain?: boolean;
}) => {
  const contract = useHbContract();
  const account = useAccount();
  const router = useRouter();
  const { isMainnet, selectedChain } = useChains();
  const [isResetting, setIsResetting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const initialize = async () => {
    setIsResetting(true);
    let queryString = "";
    if (isMainnet) {
      queryString = "?mainnet";
    }

    try {
      if (isPlayer) {
        const tx = await contract?.initialize();
        await tx?.wait();

        console.log("redirect to /");
        router.push(`/${queryString}`, undefined, { shallow: true });
      } else {
        await fetch("/api/reset", {
          method: "POST",
          body: JSON.stringify({ chainId: selectedChain?.id }),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        router.reload();
      }
    } catch (err) {
      setIsResetting(false);
      toast.error("Error!");
      console.log(err);
    }
  };

  const handleOnChangeNetwork: React.ChangeEventHandler<
    HTMLSelectElement
  > = async (event) => {
    if (event.target.value === AvailableChains[1].name) {
      router.replace({
        query: "mainnet",
      });
    } else {
      router.replace({
        query: "",
      });
    }

    console.log(
      AvailableChains.find((chain) => {
        return chain.name === event.target.value;
      })?.id
    );
    await metaMask.activate(
      AvailableChains.find((chain) => {
        return chain.name === event.target.value;
      })?.id
    );
  };
  return (
    <>
      {showModal && <Tutorial setShowModal={setShowModal} />}
      <div className="navbar bg-neutral text-neutral-content">
        <div className="navbar-start">
          <Button
            className="btn btn-accent btn-sm ml-5"
            onClick={() => {
              setShowModal(true);
            }}
          >
            How to Play?
          </Button>
        </div>
        <div className="navbar-center">
          <span className="font-bold text-4xl">{centerText}</span>
        </div>
        <div className="navbar-end mr-5">
          {canChangeChain && (
            <select
              className="mr-5 select select-bordered select-sm w-42 max-w-xs"
              onChange={handleOnChangeNetwork}
              value={selectedChain?.name}
            >
              {AvailableChains.map((n, idx) => {
                return (
                  <option key={idx} value={AvailableChains[idx].name}>
                    {n.name}
                  </option>
                );
              })}
            </select>
          )}
          <GithubLink className="" />
          {account && (
            <Button
              className="btn btn-error btn-xs ml-5"
              onClick={initialize}
              loading={isResetting}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
