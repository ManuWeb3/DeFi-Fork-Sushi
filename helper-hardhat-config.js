// const { ethers } = require("hardhat")

const ALLOCATION_POINT  = 10
const TOKENS_PER_BLOCK  = 100
const BONUS_START_BLOCK = 7741650
const BONUS_END_BLOCK   = 8241650

const networkConfig = {
    4: {
        name: "rinkeby",    // Deprecated
    },
    31337: {
        name: "hardhat",        
    },
    5: {
        name: "goerli",        
    },
}

const developmentChains = ["hardhat", "localhost"]

// exporting all the consts required for different deploy / run scripts
module.exports = {
    networkConfig, 
    developmentChains,
    ALLOCATION_POINT,
    TOKENS_PER_BLOCK,
    BONUS_START_BLOCK,
    BONUS_END_BLOCK,    
}

// syntax: module.exports = {}