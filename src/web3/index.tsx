import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from 'ethers';
import diamondAbi from './abi/diamond.json';
import { AavegotchiContractObject, AavegotchiObject } from 'types';

const aavegotchiAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';

type FetchAavegotchisRes = Promise<{status: 200, data: Array<AavegotchiObject>} | {status: 400, error: any}>

export const Web3Context = createContext<{
  provider?: ethers.providers.Web3Provider,
  contract?: ethers.Contract,
  signer?: ethers.providers.JsonRpcSigner,
  address?: string,
  getAavegotchisForUser?: () => Promise<FetchAavegotchisRes>,
  connectToNetwork: () => Promise<void>
}>({
  connectToNetwork: async () => {await window.ethereum.enable()}
});

declare global {
  interface Window {
    ethereum: any;
  }
}

interface Props {
  children: React.ReactNode;
}

export const Web3Provider = ({ children }: Props) => {
  // Stored on init
  const [ isConnected, setIsConnected ] = useState(false);
  const [ provider, setProvider ] = useState<ethers.providers.Web3Provider>();
  const [ contract, setContract ] = useState<ethers.Contract>();
  const [ signer, setSigner ] = useState<ethers.providers.JsonRpcSigner>();

  // Stored after initial call
  const [ address, setAddress ] = useState<string>();
  const [ usersGotchis, setUsersGotchis ] = useState<Array<AavegotchiObject>>([]);

  const connectToNetwork = async () => {
    try {
      await window.ethereum.enable();
      setIsConnected(true);
    } catch (error) {
      console.log("Error connecting to Ethereum: ", error)
    }
  };

  useEffect(() => {
    if (window.ethereum && isConnected) {
      window.ethereum.on('accountsChanged', function (accounts: any) {
        console.log("Account changed");
        setAddress(accounts[0]);
      })

      const newProvider = new ethers.providers.Web3Provider(window.ethereum);
      const newContract = new ethers.Contract(aavegotchiAddress, diamondAbi, newProvider);
      const newSigner = newProvider.getSigner();
      setProvider(newProvider);
      setContract(newContract);
      setSigner(newSigner);
      _setAddress(newSigner);
    } else {
      connectToNetwork();
    }
  }, [isConnected]);

  const _setAddress = async (rpcSigner: ethers.providers.JsonRpcSigner) => {
    const res = await rpcSigner.getAddress();
    setAddress(res);
  }

  const getAavegotchisForUser = async (): Promise<FetchAavegotchisRes> => {
    if (usersGotchis.length > 0) return {status: 200, data: usersGotchis};

    try {
      const gotchis = await contract?.allAavegotchisOfOwner(address) as Array<AavegotchiContractObject>;

      // Filter out portals
      const gotchisOnly = gotchis.filter(gotchi => gotchi.status.toString() === "3");

      if (gotchisOnly.length === 0) throw new Error('No gotchis found - Please make sure your wallet is connected');

      const gotchisWithSVGs = await _getAllAavegotchiSVGs(gotchisOnly || []);
      setUsersGotchis(gotchisWithSVGs);
      return {
        status: 200,
        data: gotchisWithSVGs
      };
    } catch (error) {
      return {
        status: 400,
        error: error,
      };
    }
  };

  const _getAavegotchiSvg = async (tokenId: ethers.BigNumber) => {
    const svg = await contract?.getAavegotchiSvg(tokenId) as string;
    return svg;
  };

  const _getAllAavegotchiSVGs = async (gotchis: Array<AavegotchiContractObject>): Promise<Array<AavegotchiObject>> => {
    return Promise.all(
      gotchis.map(async (gotchi) => {
        const svg = await _getAavegotchiSvg(gotchi.tokenId);
        return {
          ...gotchi,
          svg,
        };
      }),
    );
  };

  return (
    <Web3Context.Provider value={{
      provider,
      contract,
      signer,
      address,
      getAavegotchisForUser,
      connectToNetwork,
    }}>
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => useContext(Web3Context);
