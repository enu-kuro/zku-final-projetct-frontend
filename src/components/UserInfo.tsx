import Davatar from "@davatar/react";
import truncateMiddle from "truncate-middle";

export const UserInfo = ({ address }: { address: string }) => {
  return (
    <div className="inline-block pl-2 pr-5 h-10 leading-10">
      <div className="inline-block align-middle">
        <Davatar size={24} address={address} />
      </div>
      <span className="ml-3 align-middle ">
        {truncateMiddle(address || "", 5, 4, "...")}
      </span>
    </div>
  );
};
