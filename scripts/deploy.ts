import { ethers } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log("Deploying contracts...");

  // Deploy Whitelist contract
  const Whitelist = await ethers.getContractFactory("Whitelist");
  const whitelist = await Whitelist.deploy();
  await whitelist.waitForDeployment();
  const whitelistAddress = await whitelist.getAddress();
  console.log("Whitelist contract deployed to:", whitelistAddress);

  // Deploy Voting contract
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(whitelistAddress);
  await voting.waitForDeployment();
  const votingAddress = await voting.getAddress();
  console.log("Voting contract deployed to:", votingAddress);

  // Add deployer to whitelist
  const [deployer] = await ethers.getSigners();
  const tx = await whitelist.addToWhitelist(deployer.address);
  await tx.wait();
  console.log("Deployer added to whitelist:", deployer.address);

  // Update the contracts.ts file with new addresses
  const configPath = path.join(__dirname, '../src/config/contracts.ts');
  const configContent = `export const CONTRACT_ADDRESSES = {
  whitelist: '${whitelistAddress}',
  voting: '${votingAddress}'
};`;

  fs.writeFileSync(configPath, configContent);
  console.log("Updated contract addresses in src/config/contracts.ts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 