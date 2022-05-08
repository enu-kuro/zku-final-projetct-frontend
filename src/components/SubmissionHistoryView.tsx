import { FourNumbers, HBNum } from "types";
import { Button } from "./Button";
export const SubmissionHistoryView = ({
  guesses,
  hbNums,
  isSubmitting = false,
  submitProofCallback,
}: {
  guesses: FourNumbers[];
  hbNums: HBNum[];
  isSubmitting?: boolean;
  submitProofCallback?: () => {};
}) => {
  const tableRow = (idx: number, guess: FourNumbers, hbNum: HBNum) => {
    const isEmpty = hbNum.hit === undefined;
    return (
      <tr key={idx}>
        <td className="text-center px-0 py-2 text-2xl ">{guess.join(" ")}</td>
        {isEmpty && submitProofCallback ? (
          <td colSpan={2} className="text-center align-middle p-2">
            <Button
              className={`btn btn-active btn-accent btn-sm -mx-2 ${
                !isSubmitting && "animate-bounce"
              }`}
              loading={isSubmitting}
              onClick={submitProofCallback}
            >
              Proof
            </Button>
          </td>
        ) : (
          <>
            <td className="text-center  px-0 py-2 text-2xl">
              {isEmpty ? "?" : hbNum.hit}
            </td>
            <td className="text-center  px-0 py-2 text-2xl">
              {isEmpty ? "?" : hbNum.blow}
            </td>
          </>
        )}
      </tr>
    );
  };
  return (
    <div className="m-3">
      <table className="table w-full mt-0">
        <thead>
          <tr>
            <th className="text-center px-0 py-1 w-6/12">Guess</th>
            <th className="text-center px-0 py-1 w-3/12">Hit</th>
            <th className="text-center px-0 py-1 w-3/12">Blow</th>
          </tr>
        </thead>
        <tbody>
          {guesses.map((guess, i) => {
            const hbNum = hbNums[i] || {};
            return tableRow(i, guess, hbNum);
          })}
        </tbody>
      </table>
    </div>
  );
};
