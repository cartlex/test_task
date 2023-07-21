require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.19",

    networks: {
        // sepolia: {
        //     url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.SEPOLIA_API_KEY}`,
        //     accounts: [`0x${process.env.PRIVATE_KEY}`]
        // },
        // hardhat: {
        //     forking: {
        //         url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.SEPOLIA_API_KEY}`
        //     }
        // }
    },
    etherscan: {
        apiKey: process.env.SEPOLIA_API_VERIFY
    },
};

