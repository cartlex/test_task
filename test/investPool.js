const { expect, assert } = require("chai");
const { BigNumber, utils } = require("ethers");
const { ethers, upgrades } = require("hardhat");
const { mine, time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

///////////////////////////////////////////////////////////////////////////
//// to make test write `npx hardhat test`
////
//// to deploy contracts run `npx hardhat node` then split the terminal and write
////`npx hardhat run scripts/deploy.js --network localhost`
////
///////////////////////////////////////////////////////////////////////////

describe("Invest Pool Basic tests", async function () {
    let owner, signer, manager, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10;
    let investPool, roleContract, usd, lpToken;
    let price = 110; // 1.1$

    const addRole = async (user, roleNumber, days) => {
        await roleContract.connect(manager).giveRole(user, roleNumber, days)
    }

    const airDropUSD = async (user, amount) => {
        let _amount = utils.parseEther(amount.toString())
        await usd.mint(user.address, _amount)
        expect(await usd.balanceOf(user.address)).to.equal(_amount)
    }

    const givaAllAprroves = async (user, amount) => {
        await usd.connect(user).approve(investPool.address, amount)
        expect(await usd.allowance(user.address, investPool.address)).to.equal(amount)
    }

    const makeBuyOrder = async (user, amount, fee) => {
        let _amount = utils.parseEther(amount.toString())
        userUsdBalanceBefore = await usd.balanceOf(user.address);
        userTokenBalanceBefore = await lpToken.balanceOf(user.address);
        await investPool.connect(user).buy(_amount)
        // expect(await lpToken.balanceOf(user.address)).to.be.equal(userTokenBalanceBefore.add(BigNumber.from(_amount.mul(1000 - fee).div(1000)).mul(1e2).div(price)))
        // expect(await usd.balanceOf(user.address)).to.be.equal(userUsdBalanceBefore.sub(_amount))
    }

    async function deploy() {
        [owner, signer, manager, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10] = await ethers.getSigners();
        let users = [user1, user2, user3, user4, user5, user6, user7, user8, user9, user10]
        let fundrisingWallet = ethers.Wallet.createRandom()

        const USD = await ethers.getContractFactory("USD");
        usd = await USD.deploy();
        await usd.deployed();

        const LPToken = await ethers.getContractFactory("LPToken");
        lpToken = await LPToken.deploy("testing", "tst", manager.address);

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
        ]], {initializer: "initialize"});

        const InvestPool = await ethers.getContractFactory("InvestPool");
        investPool = await InvestPool.deploy(lpToken.address, roleContract.address, usd.address, fundrisingWallet.address, 5, price, utils.parseEther("1200"), manager.address,
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

        {
            await lpToken.mint(investPool.address, utils.parseEther("2700"))
        }

        for (let i = 0; i < users.length; i++) {
            await airDropUSD(users[i], 1000000)
            await givaAllAprroves(users[i], utils.parseEther("100000000000000000000"))
        }

        return { investPool, roleContract, lpToken, usd, owner, signer, manager, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10 };
    }

    // describe("gives roles", function () {
    //     it("gives role 1 to user3", async function () {
    //         await roleContract.connect(manager).giveRole(user3.address, 1, 13)
    //         expect(await roleContract.getRole(user3.address)).to.deep.equal(await roleContract.rolesList(1))
    //         expect(await roleContract.getDeadline(user3.address)).to.be.closeTo(BigNumber.from((await ethers.provider.getBlock(ethers.provider.getBlockNumber())).timestamp).add(13 * 24 * 60 * 60), 100)
    //     })

    //     it("gives role 1 to user4", async function () {
    //         await roleContract.connect(manager).giveRole(user4.address, 1, 23)
    //         expect(await roleContract.getRole(user4.address)).to.deep.equal(await roleContract.rolesList(1))
    //         expect(await roleContract.getDeadline(user4.address)).to.be.closeTo(BigNumber.from((await ethers.provider.getBlock(ethers.provider.getBlockNumber())).timestamp).add(23 * 24 * 60 * 60), 100)
    //     })

    //     it("gives role 2 to user5", async function () {
    //         await roleContract.connect(manager).giveRole(user5.address, 2, 105)
    //         expect(await roleContract.getRole(user5.address)).to.deep.equal(await roleContract.rolesList(2))
    //         expect(await roleContract.getDeadline(user5.address)).to.be.closeTo(BigNumber.from((await ethers.provider.getBlock(ethers.provider.getBlockNumber())).timestamp).add(105 * 24 * 60 * 60), 100)
    //     })

    //     it("gives role 2 to user6", async function () {
    //         await roleContract.connect(manager).giveRole(user6.address, 2, 10)
    //         expect(await roleContract.getRole(user6.address)).to.deep.equal(await roleContract.rolesList(2))
    //         expect(await roleContract.getDeadline(user6.address)).to.be.closeTo(BigNumber.from((await ethers.provider.getBlock(ethers.provider.getBlockNumber())).timestamp).add(10 * 24 * 60 * 60), 100)
    //     })
    // })

    // describe("Buys tokens (first bundle)", function () {

    //     it("Buy tokens for user3[role id 1] (should be rejected (sale not started))", async function () {
    //         await expect(makeBuyOrder(user3, 303, 10)).to.be.reverted
    //     })

    //     it("Buy tokens for user1[role id 0] (should be rejected (sale's not started))", async function () {
    //         await expect(makeBuyOrder(user1, 100 * 1e6, 20)).to.be.reverted
    //     })

    //     it("Buy tokens for user3[role id 1]", async function () {
    //         addRole(user3.address, 1, 10);

    //         await mine(50);
    //         await makeBuyOrder(user3, 10, 10)
    //     })

    //     it("Buy tokens for user1[role id 0] (should be rejected (sale's still not started))", async function () {
    //         await expect(makeBuyOrder(user1, 100 * 1e6, 20)).to.be.reverted
    //     })

    //     it("Buy tokens for user4[role id1]  (should be rejected (role limit reached))", async function () {
    //         await expect(makeBuyOrder(user4, 202, 10)).to.be.reverted
    //     })

    //     it("Buy tokens for user3[role id 1] (should be rejected (out of roles limits per user))", async function () {
    //         await expect(makeBuyOrder(user3, 303, 10)).to.be.reverted
    //     })

    //     it("Buy tokens for user5[role id 2] (should be rejected (amount too small for his role))", async function () {
    //         await expect(makeBuyOrder(user5, 202, 5)).to.be.reverted
    //     })

    //     it("Buy tokens for user5[role id 2]", async function () {
    //         await makeBuyOrder(user5, 600, 5)
    //     })

    //     it("Buy tokens for user5[role id 2] (should be rejected (the role max limit per user will be reached))", async function () {
    //         await expect(makeBuyOrder(user5, 400, 5)).to.be.reverted
    //     })

    //     it("Buy tokens for user4[role id 1] (should be rejected (out of time for his role))", async function () {
    //         mine(1000, { interval: 2 })
    //         await expect(makeBuyOrder(user4, 202, 10)).to.be.reverted
    //     })

    //     it("Buy tokens for user1[role id 0]", async function () {
    //         await makeBuyOrder(user1, 100, 20)
    //     })

    //     it("Buy tokens for user1 (should be rejected (out of roles limits per user))", async function () {
    //         await expect(makeBuyOrder(user1, 10, 20)).to.be.reverted
    //     })
    // })

    // describe("Admin adds new tokens for sale", function () {
    //     it("adds new tokens for sale", async function () {
    //         await investPool.connect(manager).setMaxAmountToSell(await lpToken.balanceOf(investPool.address))
    //     })
    // })

    // describe("Buys tokens (second bundle)", function () {

    //     it("User3 upgrades role and buy tokens user3[role id switch from 1 to 2]", async function () {
    //         await roleContract.connect(manager).giveRole(user3.address, 2, 13)
    //         await makeBuyOrder(user3, 506, 5)
    //     })
    // })


    ///////////////////////////////
    ///////// TASK TESTS //////////
    ///////////////////////////////

    describe("buy()", function () {
        it("storage values before", async function () {
            const { investPool, roleContract, user1 } = await loadFixture(deploy);

            expect(await investPool.alreadyBought(user1.address)).to.eq(0);
            expect(await investPool.alreadySold()).to.eq(0);
            expect(await investPool.totalPaymentTokenSpended()).to.eq(0);
            expect(await investPool.baseFee()).to.eq(5);
            expect(await investPool.price()).to.eq(110);
            expect(await investPool.maxAmountToSell()).to.eq(utils.parseEther("1200"));
            expect(await investPool.totalLPDeposited()).to.eq(0);

            let userNum = await roleContract.getRoleNumber(user1.address);
            let RoleSettings = await investPool.roleSettings(userNum);
            expect(await RoleSettings.soldAmountForThisRole).to.eq(0);
            expect(await RoleSettings.totalAmountOfPaymentTokenSpended).to.eq(0);
        })

        it("will revert if timestamp is > user.deadline or timestamp < user.startTime", async function () {
            const { user1 } = await loadFixture(deploy);
            const ROLE_FEE_USER_1 = 20;

            await mine(10);
            await expect(makeBuyOrder(user1, 80, ROLE_FEE_USER_1)).to.be.revertedWith("TE");

            await mine(4500);
            await expect(makeBuyOrder(user1, 80, ROLE_FEE_USER_1)).to.be.revertedWith("TE");
        })

        it("will revert if sold more than maxAmountForRole", async function () {
            const { user1, roleContract } = await loadFixture(deploy);
            const ROLE_FEE_USER_1 = 20;

            addRole(user1.address, 1, 10)

            await mine(500);
            await makeBuyOrder(user1, 80, ROLE_FEE_USER_1);
            await expect(makeBuyOrder(user1, 580, ROLE_FEE_USER_1)).to.be.revertedWith("IA");
        })

        it("will revert if sold more than userRole.maxAmountToSellForRole", async function () {
            const { investPool, roleContract, user1, user2 } = await loadFixture(deploy);
            const ROLE_FEE_USER_1 = 20;

            addRole(user1.address, 0, 10)
            addRole(user2.address, 0, 10)

            let userRoleNum = await roleContract.getRoleNumber(user1.address);
            let roleSettings = await investPool.roleSettings(userRoleNum);

            await mine(1200);
            await makeBuyOrder(user1, 80, ROLE_FEE_USER_1);
            await expect(makeBuyOrder(user2, 40, ROLE_FEE_USER_1)).to.be.revertedWith("RR");
        })

        it("will revert if sold more than maxAmountToSell", async function () {
            const { investPool, roleContract, user1, user2, user3 } = await loadFixture(deploy);
            const DAYS = 5;

            addRole(user1.address, 0, DAYS)
            addRole(user2.address, 2, DAYS)
            addRole(user3.address, 1, DAYS)

            let role_user1 = await roleContract.getRole(user1.address);
            let role_user2 = await roleContract.getRole(user2.address);
            let role_user3 = await roleContract.getRole(user3.address);

            expect(role_user1[0]).to.eq(0);
            expect(role_user2[0]).to.eq(2);
            expect(role_user3[0]).to.eq(1);

            await mine(300);
            await makeBuyOrder(user3, 350, 0);

            await mine(1200);
            await makeBuyOrder(user1, 50, 0);
            await makeBuyOrder(user1, 50, 0);
            await expect(makeBuyOrder(user2, 1000, 0)).to.be.revertedWith("LT");
        })

        it("will buy tokens", async function () {
            const { investPool, roleContract, user1 } = await loadFixture(deploy);
            const ROLE_FEE_USER_1 = 20;

            let paymentTokenAmount = 80;
            let decimals = await usd.decimals();
            let = investPoolLPTokenBalanceBefore = await lpToken.balanceOf(investPool.address);

            expect(await lpToken.balanceOf(user1.address)).to.eq(0);

            await mine(1200);

            let roleNumber = await roleContract.getRoleNumber(user1.address);
            let amounts = await roleContract.getAmounts(user1.address);

            expect(await investPool.alreadySold()).to.eq(0);
            expect(await investPool.alreadyBought(user1.address)).to.eq(0);

            await makeBuyOrder(user1, paymentTokenAmount, ROLE_FEE_USER_1);

            let afterFeesPaymentTokenAmount = (utils.parseEther("80") * (1000 - ROLE_FEE_USER_1)) / 1000;
            let tokenAmount = (afterFeesPaymentTokenAmount * (10 ** (20 - decimals))) / price;
            let roleSettings = await investPool.roleSettings(roleNumber);

            expect(await investPool.alreadyBought(user1.address)).to.eq(78400000000000000000n);
            expect(await investPool.alreadySold()).to.eq(71272727272727272727n);
            expect(await investPool.totalPaymentTokenSpended()).to.eq(80000000000000000000n);
            expect(await roleSettings.soldAmountForThisRole).to.eq(71272727272727272727n);
            expect(await roleSettings.totalAmountOfPaymentTokenSpended).to.eq(80000000000000000000n);
            expect(await lpToken.balanceOf(user1.address)).to.eq(71272727272727272727n);
            expect(await lpToken.balanceOf(investPool.address)).to.eq(2628727272727272727273n);
        })
    })

});