import { BigNumber } from "ethers";
import { FourNumbers } from "types";

const solutionInfoKeys = ['solutionArray','solutionHash', 'salt' ]

export const saveSolutionInfo = (solutionArray:FourNumbers, solutionHash: BigNumber, salt:BigNumber) => {
    localStorage.setItem(solutionInfoKeys[0], JSON.stringify(solutionArray));
    localStorage.setItem(solutionInfoKeys[1], solutionHash.toString());
    localStorage.setItem(solutionInfoKeys[2], salt.toString());

    console.log("saveSolutionInfo");
}

export const retrieveSolutionInfo = () => {
    const solutionArrayStr = localStorage.getItem(solutionInfoKeys[0])
    const solutionHashStr = localStorage.getItem(solutionInfoKeys[1]);
    const saltStr = localStorage.getItem(solutionInfoKeys[2]);

    if (solutionArrayStr && solutionHashStr && saltStr){
        return [JSON.parse(solutionArrayStr) , BigNumber.from(solutionHashStr), BigNumber.from(saltStr)]
    } else {
        throw new Error("SolutionInfo not found"); 
    }
    
}