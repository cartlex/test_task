// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { BigNumber, utils } = require("ethers");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const hre = require("hardhat");

async function main() {
    let manager;
    let signer;
    let roleContract;
    let price = 110; // 1.1$

    [manager, signer] = await ethers.getSigners();

    let fundrisingWallet = ethers.Wallet.createRandom()

    const USD = await ethers.getContractFactory("USD");
    const usd = await USD.deploy();
    await usd.deployed();
    console.log("usd deployed with address: ", usd.address);


    const LPToken = await ethers.getContractFactory("LPToken");
    const lpToken = await LPToken.deploy("testing", "tst", manager.address);
    await lpToken.deployed();
    console.log("lpToken deployed with address: ", lpToken.address);

    const Roles = await ethers.getContractFactory("RoleContract");
    roleContract = await upgrades.deployProxy(Roles, [signer.address, manager.address, [
        {
            roleNumber: 0,
            isExist: true,
            maxAmount: utils.parseEther("100"),
            minAmount: 0,
        },
        {
            roleNumber: 1,
            isExist: true,
            maxAmount: utils.parseEther("500"),
            minAmount: 0,
        },
        {
            roleNumber: 2,
            isExist: true,
            maxAmount: utils.parseEther("1000"),
            minAmount: utils.parseEther("500"),
        }
    ]]);
    console.log("roleContract deployed with address: ", roleContract.address);

    const InvestPool = await ethers.getContractFactory("InvestPool");
    const investPool = await InvestPool.deploy(lpToken.address, roleContract.address, usd.address, fundrisingWallet.address, 5, price, utils.parseEther("1200"), manager.address,
        [
            {
                roleNumber: 0,
                startTime: await time.latest() + 1000,
                deadline: await time.latest() + 3000,
                roleFee: 20,
                maxAmountToSellForRole: utils.parseEther("100")
            },
            {
                roleNumber: 1,
                startTime: await time.latest() + 50,
                deadline: await time.latest() + 1000,
                roleFee: 10,
                maxAmountToSellForRole: utils.parseEther("600")
            },
            {
                roleNumber: 2,
                startTime: await time.latest() + 50,
                deadline: await time.latest() + 3000,
                roleFee: 0,
                maxAmountToSellForRole: utils.parseEther("1500")
            },
        ]
    );
    await investPool.deployed();
    console.log("InvestPool deployed with address: ", investPool.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
