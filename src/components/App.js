import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import Navbar from "./Navbar";
import Main from "./Main";
import Web3 from "web3";
import Tether from "../truffle_abis/Tether.json";
import Rwd from "../truffle_abis/RWD.json";
import DecentralBank from "../truffle_abis/DecentralBank.json";

const App = () => {
  const [account, setAccount] = useState("0x0");
  const [tether, setTether] = useState();
  const [rwd, setRwd] = useState();
  const [decentralBank, setDecentralBank] = useState();
  const [tetherBalance, setTetherBalance] = useState("0");
  const [rwdBalance, setRwdBalance] = useState("0");
  const [stakingBalance, setStakingBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  console.log("loading :", loading);

  useEffect(() => {
    handleWeb3Call();
  }, []);

  const handleWeb3Call = async () => {
    await webThree();
    await loadBlockchainData();
  };

  const loadBlockchainData = async () => {
    const web3 = window.web3;
    const act = await web3.eth.getAccounts();
    setAccount(act[0]);
    const networkId = await web3.eth.net.getId();

    //Load Tether Contract
    const tetherData = Tether.networks[networkId];
    if (tetherData && act[0]) {
      const tether = new web3.eth.Contract(Tether.abi, tetherData.address);
      setTether(tether);
      let tetherBalance = await tether.methods.balanceOf(act[0]).call();
      console.log("tetherBalance :", tetherBalance);
      setTetherBalance(tetherBalance.toString());
    } else {
      window.alert("Error! Tether contract not deployed");
    }

    const rwdData = Rwd.networks[networkId];
    if (rwdData) {
      const rwd = new web3.eth.Contract(Rwd.abi, rwdData.address);
      setRwd({ rwd });
      let rwdBalance = await rwd.methods.balanceOf(act[0]).call();
      console.log("rwdBalance :", rwdBalance);
      setStakingBalance(rwdBalance.toString());
    } else {
      window.alert("Error! Rwd contract not deployed");
    }

    const decentralBankData = DecentralBank.networks[networkId];
    if (decentralBankData) {
      const decentralBank = new web3.eth.Contract(
        DecentralBank.abi,
        decentralBankData.address
      );
      setDecentralBank(decentralBank);
      let stakingBankBalance = await decentralBank.methods
        .stakingBalance(act[0])
        .call();
      console.log("stakingBankBalance :", stakingBankBalance);
      setRwdBalance(stakingBankBalance.toString());
    } else {
      window.alert("Error! Decentral Bank contract not deployed");
    }
    console.log("setting loading to false ", loading);
    setLoading(false);
  };

  const webThree = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "No ethereum browser detected! you can check out Meta Mask!"
      );
    }
  };

  const stakeTokens = (amount) => {
    setLoading(true);

    tether.methods
      .approve(decentralBank._address, amount)
      .send({ from: account })
      .on("transactionHash", (hash) => {
        decentralBank.methods
          .depositTokens(amount)
          .send({ from: account })
          .on("transactionHash", (hash) => {
            setLoading(false);
          });
      });
  };

  const unStakeTokens = () => {
    setLoading(true);

    decentralBank.methods
      .unstakeTokens()
      .send({ from: account })
      .on("transactionHash", (hash) => {
        setLoading(false);
      });
  };

  return (
    <>
      <Navbar account={account} />
      <div className="container-fluid mt-5">
        <div className="row">
          <main
            role="main"
            className="col-lg-12 ml-auto mr-auto"
            style={{ maxWidth: "600px", minHeight: "100vm" }}
          >
            <div>
              {loading ? (
                <h1>Loading...!</h1>
              ) : (
                <Main
                  stakingBalance={stakingBalance}
                  tetherBalance={tetherBalance}
                  rwdBalance={rwdBalance}
                  stakeTokens={stakeTokens}
                  unStakeTokens={unStakeTokens}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default App;
