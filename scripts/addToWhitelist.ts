import { ethers } from "hardhat";

async function main() {
  // The address to whitelist (replace with your address)
  const addressToWhitelist = "0xf740...3166"; // Replace with your full address

  console.log("Adding address to whitelist...");

  // Get the Whitelist contract
  const whitelistAddress = process.env.REACT_APP_WHITELIST_ADDRESS;
  if (!whitelistAddress) {
    throw new Error("Whitelist contract address not found in environment variables");
  }

  // Get the signer (admin account)
  const [admin] = await ethers.getSigners();
  console.log("Using admin account:", admin.address);

  // Get the Whitelist contract
  const Whitelist = await ethers.getContractFactory("Whitelist");
  const whitelist = Whitelist.attach(whitelistAddress);

  try {
    // Check if address is already whitelisted
    const isWhitelisted = await whitelist.isWhitelisted(addressToWhitelist);
    if (isWhitelisted) {
      console.log(`Address ${addressToWhitelist} is already whitelisted`);
      return;
    }

    // Add address to whitelist using the function name from the ABI
    const tx = await whitelist.addWhitelisted(addressToWhitelist);
    console.log("Transaction sent:", tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction mined in block:", receipt?.blockNumber);
    console.log(`Address ${addressToWhitelist} added to whitelist successfully!`);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
      if (error.message.includes("execution reverted")) {
        console.error("Transaction reverted. Make sure you're using the admin account.");
      }
    } else {
      console.error("Unknown error:", error);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 