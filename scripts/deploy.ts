import { ethers } from "hardhat";

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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 