const { network} = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async function ({getNamedAccounts, deployments}) {     // get auto-pulled from hre, hence, all-time available
    const {deploy} = deployments                                
    const {deployer} = await getNamedAccounts()                         // deployer is the public address of accounts[0]
    const args = []

    console.log("Deploying SushiToken.sol...")
    const sushiToken = await deploy("SushiToken", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmatios: network.config.blockConfirmations || 1,
    })
    console.log("SushiToken.sol deployed!")
    console.log("------------------------")

    // Verifying on Goerli testnet
    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {        // process.env is accessible here in deploy script
        console.log(`Verifying on Goerli.Etherscan.......`)
        await verify(sushiToken.address, args)
        console.log("---------")
    }
}