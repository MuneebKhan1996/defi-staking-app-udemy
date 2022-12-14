const Tether = artifacts.require("Tether");
const RWD = artifacts.require("RWD");
const DecentralBank = artifacts.require("DecentralBank");

require("chai")
  .use(require("chai-as-promised"))
  .should();

contract("DecentralBank", ([owner, customer]) => {
  let tether, rwd, decentralBank;

  function tokens(number) {
    return web3.utils.toWei(number, "ether");
  }

  before(async () => {
    tether = await Tether.new();
    rwd = await RWD.new();
    decentralBank = await DecentralBank.new(rwd.address, tether.address);

    ///check if we transfer all our reward tokens (1 million)
    await rwd.transfer(decentralBank.address, tokens("1000000"));

    ///Transfer 100 mock tokens to customer
    await tether.transfer(customer, tokens("100"), { from: owner });
  });

  describe("Mock Tether Deployment", async () => {
    it("matches name successfully", async () => {
      const name = await tether.name();
      assert.equal(name, "Mock Tether Token");
    });
  });

  describe("RWD Deployment", async () => {
    it("matches name successfully", async () => {
      const name = await rwd.name();
      assert.equal(name, "Reward Token");
    });

    it("matches symbol successfully", async () => {
      let rwd = await RWD.new();
      const name = await rwd.symbol();
      assert.equal(name, "RWD");
    });
  });
  describe("Decentral Bank Deployment", async () => {
    it("matches name successfully", async () => {
      const name = await decentralBank.name();
      assert.equal(name, "Decentral Bank");
    });

    it("Contract has tokens", async () => {
      let balance = await rwd.balanceOf(decentralBank.address);
      assert.equal(balance, tokens("1000000"));
    });
  });

  describe("Yield Farming", async () => {
    it("rewards tokens for staking", async () => {
      let result;

      // Check Investor Balance
      result = await tether.balanceOf(customer);
      assert.equal(
        result.toString(),
        tokens("100"),
        "customer mock wallet balance before staking"
      );

      // Check Staking For Customer of 100 tokens
      await tether.approve(decentralBank.address, tokens("100"), {
        from: customer,
      });
      await decentralBank.depositTokens(tokens("100"), { from: customer });

      // Check Updated Balance of Customer
      result = await tether.balanceOf(customer);
      assert.equal(
        result.toString(),
        tokens("0"),
        "customer mock wallet balance after staking 100 tokens"
      );

      // Check Updated Balance of Decentral Bank
      result = await tether.balanceOf(decentralBank.address);
      assert.equal(
        result.toString(),
        tokens("100"),
        "decentral bank mock wallet balance after staking from customer"
      );

      // Is Staking Update
      result = await decentralBank.isStaking(customer);
      assert.equal(
        result.toString(),
        "true",
        "customer is staking status after staking"
      );

      //issue Tokens
      await decentralBank.issueTokens({ from: owner });

      //Ensure only owner
      await decentralBank.issueTokens({ from: customer }).should.be.rejected;

      //unstaking tokens
      await decentralBank.unstakeTokens({ from: customer });

      //check unstaking balances
      result = await tether.balanceOf(customer);
      assert.equal(
        result.toString(),
        tokens("100"),
        "customer mock wallet balance after unstaking"
      );

      // Check Updated Balance of Decentral Bank
      result = await tether.balanceOf(decentralBank.address);
      assert.equal(
        result.toString(),
        tokens("0"),
        "decentral bank mock wallet balance after staking from customer"
      );

      // Is Staking Update
      result = await decentralBank.isStaking(customer);
      assert.equal(
        result.toString(),
        "false",
        "customer is no longer staking status after staking"
      );
    });
  });
});
