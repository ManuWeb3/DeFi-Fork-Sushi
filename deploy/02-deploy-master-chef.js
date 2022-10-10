const { network, ethers } = require("hardhat")
const { developmentChains, TOKENS_PER_BLOCK, BONUS_END_BLOCK, BONUS_START_BLOCK, ALLOCATION_POINT} = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
require("dotenv").config()

module.exports = async function ({getNamedAccounts, deployments}) {     // get auto-pulled from hre, hence, all-time available
    const {deploy} = deployments                                
    const {deployer} = await getNamedAccounts()                         // deployer is the public address of accounts[0]
    
    const sushiToken = await ethers.getContract("SushiToken", deployer)

    // List of MasterChef.sol's constructor-arguments
    // 'sushiToken.address' is the valid arg in place of 'sushiToken' itself
    const args = [sushiToken.address, deployer, TOKENS_PER_BLOCK, BONUS_END_BLOCK, BONUS_START_BLOCK]

    console.log("Deploying MasterChef.sol...")
    const masterChef = await deploy("MasterChef", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmatios: network.config.blockConfirmations || 1,
    })
    console.log("MasterChef.sol deployed!")
    console.log("------------------------")

    // Verifying on Goerli testnet
    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {        // process.env is accessible here in deploy script
        console.log(`Verifying on Goerli.Etherscan.......`)
        await verify(masterChef.address, args)
        console.log("Verified!")
        console.log("---------")
    }

    // TransferOwnership of SushiToken to MasterChef.sol
    console.log("Transfering Ownership of SushiToken.sol to MasterChef.sol")
    // For trsnaferOwnership():
    // we need Box.sol's contract's instance, hence, getContractAt("", address)...
    // we do NOT need Box.sol's deployed-instance, hence, NOT getContract("")
    // post-deployment, of course
    const sushiTokenContract = await ethers.getContractAt("SushiToken", sushiToken.address)
    const transferTx = await sushiTokenContract.transferOwnership(masterChef.address)
    // Catching the Event-emit for confirmation of operation
    const transferTxReceipt = await transferTx.wait(1)
    const newOwner = transferTxReceipt.events[0].args.newOwner
    console.log(`Ownership Transfered to: ${newOwner}`)
    console.log("------------------------")

    // MasterChef adds Liquidity pool for rewards, e.g., "ETH/DAI Pool"
    console.log("Adding a Liquidity Pool of ETH/DAI")
    await masterChef.add(ALLOCATION_POINT, process.env.LP_TOKEN_ADDRESS, false)
    console.log(`Liquidity Pool created with Liquidity Provider token!`)
    console.log("-----------------------------------------------------")

    // For the above 2: transferOwnership() and add()...
    // can create a separate deploy script / behavior script under utils...
    // to add more modularity
}