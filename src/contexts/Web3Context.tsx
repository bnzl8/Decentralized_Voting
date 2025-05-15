import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WhitelistArtifact from '../contracts/Whitelist.json';
import VotingArtifact from '../contracts/Voting.json';
import { CONTRACT_ADDRESSES } from '../config/contracts';

interface Web3ContextType {
  account: string | null;
  isAdmin: boolean;
  isWhitelisted: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  provider: ethers.Provider | null;
  signer: ethers.Signer | null;
  whitelistContract: ethers.Contract | null;
  votingContract: ethers.Contract | null;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  isAdmin: false,
  isWhitelisted: false,
  connect: async () => {},
  disconnect: () => {},
  provider: null,
  signer: null,
  whitelistContract: null,
  votingContract: null,
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [whitelistContract, setWhitelistContract] = useState<ethers.Contract | null>(null);
  const [votingContract, setVotingContract] = useState<ethers.Contract | null>(null);

  const connect = async () => {
    try {
      console.log('Starting Web3 connection...');
      const web3Modal = new Web3Modal({
        cacheProvider: true,
        providerOptions: {},
      });

      const instance = await web3Modal.connect();
      console.log('Web3Modal connected');
      
      const provider = new ethers.BrowserProvider(instance);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      console.log('Connected address:', address);

      // Initialize contracts
      const whitelistAddress = CONTRACT_ADDRESSES.whitelist;
      const votingAddress = CONTRACT_ADDRESSES.voting;

      console.log('Contract addresses:', { whitelistAddress, votingAddress });

      if (!whitelistAddress || !votingAddress) {
        throw new Error('Contract addresses not found in configuration');
      }

      // Verify contract addresses are valid
      if (!ethers.isAddress(whitelistAddress) || !ethers.isAddress(votingAddress)) {
        throw new Error('Invalid contract addresses');
      }

      // Get network info
      const network = await provider.getNetwork();
      console.log('Connected to network:', {
        chainId: network.chainId,
        name: network.name
      });

      // Check if contracts are deployed
      const whitelistCode = await provider.getCode(whitelistAddress);
      const votingCode = await provider.getCode(votingAddress);
      
      console.log('Contract code lengths:', {
        whitelist: whitelistCode.length,
        voting: votingCode.length
      });

      if (whitelistCode === '0x' || votingCode === '0x') {
        throw new Error('One or both contracts are not deployed at the specified addresses');
      }

      // Initialize Whitelist contract with read-only provider for view functions
      const whitelistReadOnly = new ethers.Contract(
        whitelistAddress,
        WhitelistArtifact.abi,
        provider
      );
      console.log('Whitelist contract initialized (read-only)');

      try {
        // Test the contract connection
        const testResult = await whitelistReadOnly.isWhitelisted(address);
        console.log('Test whitelist check result:', testResult);
      } catch (error) {
        console.error('Error testing whitelist contract:', error);
        throw new Error('Failed to connect to whitelist contract: ' + (error instanceof Error ? error.message : String(error)));
      }

      // Initialize Whitelist contract with signer for state-changing functions
      const whitelist = new ethers.Contract(
        whitelistAddress,
        WhitelistArtifact.abi,
        signer
      );
      console.log('Whitelist contract initialized (with signer)');

      const voting = new ethers.Contract(
        votingAddress,
        VotingArtifact.abi,
        signer
      );
      console.log('Voting contract initialized');

      // Check if user is whitelisted using read-only contract
      try {
        const whitelisted = await whitelistReadOnly.isWhitelisted(address);
        console.log('Is whitelisted:', whitelisted);
        setIsWhitelisted(whitelisted);
      } catch (error) {
        console.error('Error checking whitelist status:', error);
        throw new Error('Failed to check whitelist status: ' + (error instanceof Error ? error.message : String(error)));
      }

      // Check if user is admin (owner of the contract)
      try {
        const owner = await whitelistReadOnly.owner();
        const isAdmin = address.toLowerCase() === owner.toLowerCase();
        console.log('Is admin:', isAdmin, 'Contract owner:', owner);
        setIsAdmin(isAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        throw new Error('Failed to check admin status: ' + (error instanceof Error ? error.message : String(error)));
      }

      setAccount(address);
      setProvider(provider);
      setSigner(signer);
      setWhitelistContract(whitelist);
      setVotingContract(voting);

      // Listen for account changes
      instance.on('accountsChanged', (accounts: string[]) => {
        console.log('Account changed:', accounts[0]);
        setAccount(accounts[0]);
        window.location.reload();
      });

      // Listen for chain changes
      instance.on('chainChanged', (chainId: string) => {
        console.log('Chain changed:', chainId);
        window.location.reload();
      });
    } catch (error) {
      console.error('Error connecting to Web3:', error);
      disconnect(); // Clean up state on error
      throw error;
    }
  };

  const disconnect = () => {
    setAccount(null);
    setIsAdmin(false);
    setIsWhitelisted(false);
    setProvider(null);
    setSigner(null);
    setWhitelistContract(null);
    setVotingContract(null);
  };

  useEffect(() => {
    if (window.ethereum) {
      connect();
    }
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        isAdmin,
        isWhitelisted,
        connect,
        disconnect,
        provider,
        signer,
        whitelistContract,
        votingContract,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}; 