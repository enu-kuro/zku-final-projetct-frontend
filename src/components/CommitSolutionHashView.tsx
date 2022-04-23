import { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useHbContract } from "hooks/useContract";
import { Button, Center, Text, TextInput, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { FourNumbers } from "types";
import { ethers } from "ethers";
import { saveSolutionInfo } from "utils";
const buildPoseidon = require("circomlibjs").buildPoseidon;

export const CommitSolutionHashView = () => {
  const { account } = useWeb3React();
  const [isCommittedSolutionHash, setIsCommittedSolutionHash] = useState(false);
  const contract = useHbContract();
  const form = useForm({
    initialValues: {
      solution: "",
    },

    validate: {
      solution: (value: string) =>
        /^(?!.*(.).*\1)[0-9]{4}$/.test(value) ? null : "Invalid Solution",
    },
  });

  useEffect(() => {
    const onCommitSolutionHash = async (player: string) => {
      if (account === player) {
        setIsCommittedSolutionHash(true);
        console.log(`onCommitSolutionHash`);
      }
    };
    contract?.on("CommitSolutionHash", onCommitSolutionHash);
    return () => {
      contract?.off("CommitSolutionHash", onCommitSolutionHash);
    };
  }, [account, contract]);

  const commitSolutionHash = async (solutionStr: string) => {
    const solutionArray: FourNumbers = solutionStr
      .split("")
      .map((num) => Number(num)) as FourNumbers;
    const poseidon = await buildPoseidon();
    const salt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    const solutionHash = ethers.BigNumber.from(
      poseidon.F.toObject(poseidon([salt, ...solutionArray]))
    );

    contract?.commitSolutionHash(solutionHash);
    saveSolutionInfo(solutionArray, solutionHash, salt);
  };

  return (
    <Center style={{ height: 100 }}>
      {isCommittedSolutionHash ? (
        <Text size="md">Please wait...</Text>
      ) : (
        <form
          onSubmit={form.onSubmit(({ solution }) =>
            commitSolutionHash(solution)
          )}
        >
          <TextInput
            required
            label="Solution"
            placeholder="0123"
            {...form.getInputProps("solution")}
          />

          <Group position="right" mt="md">
            <Button type="submit" variant="outline" color="pink">
              CommitSolutionHash
            </Button>
          </Group>
        </form>
      )}
    </Center>
  );
};
