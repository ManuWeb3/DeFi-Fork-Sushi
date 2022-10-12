const { network, ethers } = require("hardhat")
const { developmentChains, TOKENS_PER_BLOCK, BONUS_END_BLOCK, BONUS_START_BLOCK, ALLOCATION_POINT} = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
require("dotenv").config()
const AMOUNT = ethers.utils.parseEther("0.001")     // 10**15 wei

module.exports = async function ({getNamedAccounts, deployments}) {     // get auto-pulled from hre, hence, all-time available
    const {deploy} = deployments                                
    const {deployer} = await getNamedAccounts()                         // deployer is the public address of accounts[0]
    
    const sushiToken = await ethers.getContract("SushiToken", deployer)

    // List of MasterChef.sol's constructor-arguments
    // 'sushiToken.address' is the valid arg in place of 'sushiToken' itself
    const args = [sushiToken.address, deployer, TOKENS_PER_BLOCK, BONUS_START_BLOCK, BONUS_END_BLOCK]

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

    /* some error with .add()
    // MasterChef adds Liquidity pool for $SUSHI rewards, e.g., "ETH/DAI Pool"
    console.log("Adding a Liquidity Pool of ETH/DAI")
    const TxAddLP = await masterChef.add(ALLOCATION_POINT, process.env.LP_TOKEN_ADDRESS, false)
    await TxAddLP.wait(1)
    console.log("------------------------")
    */

    // For the above 2: transferOwnership() and add()...
    // can create a separate deploy script / behavior script under utils...
    // to add more modularity
    
    /* will re-try sone other day - going ahead with UI for now.
    const uniV2Address = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
    await approveMasterChef(uniV2Address, masterChef.address, AMOUNT, deployer)
    */
}
    // generic mechanism to Approve before we deposit()
async function approveMasterChef(uniV2Address, spenderAddress, amountToSpend, account) {
    //  uniV2Address - needed to further pass it on into the getContractAt() to get contract abstraction instance of ERC20.sol to run approve f()
    //  spender, amountToSpend will be used inside Approve()
    //  account = deployer everywhere

    //  took IERC20 below instead of IWeth.sol bcz we just need an ERC20 kind of interface here, so IERC20.sol does good.
    const IERC20artifact = "contracts/interfaces/IERC20.sol:IERC20"
    const uniV2LPToken = await ethers.getContractAt(IERC20artifact, uniV2Address, account)      // attach erc20Token with deployer
    //  can go with "IWeth.sol" as well bcz IERC20.sol is a subset of IWeth.sol (deposit(), withdraw() are extra)
    //  we only need approve() which is included in the both
    //  MEANS - do not need an EXACT MATCH b/w the Interface and the contract at that address, just the function matters.
    const tx = await uniV2LPToken.approve(spenderAddress, amountToSpend)      //  deployer (msg.sender) is actually running this f()
    //  hence, balance of deployer is in the picture here, in case of only 1 depositor i.e. deployer, bal(WETH9.sol) = bal(deployer)...why?
    //  bcz contract's balance also gets updated with every .deposit() getting run.
    //  Hence, deployer approved Aave's LP.sol (spender) to spend AMOUNT on deployer's behalf
    const txReceipt = await tx.wait(1)
    const spender = txReceipt.events[0].args.spender
    console.log(`Approved Spender: ${spender}`)
}
