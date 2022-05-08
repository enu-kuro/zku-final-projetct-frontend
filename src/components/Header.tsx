import { useHbContract } from "hooks/useContract";
import router from "next/router";
import { useState } from "react";
import { Button } from "./Button";
import { GithubLink } from "./GithubLink";

export const Header = ({ centerText }: { centerText?: string }) => {
  const contract = useHbContract();
  const [isResetting, setIsResetting] = useState(false);
  const initialize = async () => {
    setIsResetting(true);
    const tx = await contract?.initialize().catch((err) => {
      setIsResetting(false);
      console.log(err);
    });
    await tx?.wait().catch((err) => {
      setIsResetting(false);
      console.log(err);
    });
    router.push("/", undefined, { shallow: true });
  };
  return (
    <div className="navbar bg-neutral text-neutral-content">
      <div className="navbar-start"></div>
      <div className="navbar-center">
        <span className="font-bold text-4xl">{centerText}</span>
      </div>
      <div className="navbar-end">
        <GithubLink />
        <Button
          className="btn btn-error btn-xs mx-5"
          onClick={initialize}
          loading={isResetting}
        >
          Reset
        </Button>
      </div>
    </div>
  );
};
