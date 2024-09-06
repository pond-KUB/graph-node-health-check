#!/usr/bin/env node

import { ethers } from "ethers";
import http from "http";
import getGraphNodeBlockDetail from "./graph-node/index.js";
import dotenv from "dotenv";
dotenv.config();

const port = process.env.PORT;
const networkRpcUrls = process.env.NETWORK_URLS.split(",");
const graphNodeUrl = process.env.BITKUB_GRAPH_NODE_URL;

const MAX_BLOCK_DIFFERENCE = process.env.MAX_BLOCK_DIFFERENCE || 3;

const getNetworkBlockNum = async (rpcUrl) => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  return provider.getBlockNumber();
};

const randomBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};

const onHealthCheckRequest = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  const networkRpcIndex = randomBetween(0, networkRpcUrls.length);
  const networkRpcUrl = networkRpcUrls[networkRpcIndex];

  let networkBlockNum;
  try {
    networkBlockNum = await getNetworkBlockNum(networkRpcUrl);
  } catch (error) {
    console.log(
      `Fetch network ${networkRpcUrl}, error: Cannot connect network.`
    );
    console.error(error);
    networkBlockNum = 0;
  }

  let localBlockNum;
  try {
    const currentBlockDetail = await getGraphNodeBlockDetail(graphNodeUrl);
    localBlockNum = currentBlockDetail["latestBlock"]["number"];
  } catch (error) {
    console.log(
      `Fetch graph node ${graphNodeUrl}, error: Cannot connect graph node.`
    );
    console.error(error);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Cannot connect graph node.");
    return;
  }

  console.log(
    `Fetch network ${networkRpcUrl} -> graph node ${graphNodeUrl}, last block: ${networkBlockNum} --> ${localBlockNum}`
  );

  let responseStatus =
    networkBlockNum - localBlockNum > MAX_BLOCK_DIFFERENCE ? 500 : 200;
  if (localBlockNum > 10000 && networkBlockNum <= 0) {
    // don't let etherscan f**k us
    responseStatus = 200;
  } else if (networkBlockNum < localBlockNum) {
    responseStatus = 200;
  }
  res.writeHead(responseStatus, { "Content-Type": "text/plain" });
  res.end((localBlockNum - networkBlockNum).toString());
};

http.createServer(onHealthCheckRequest).listen(port, () => {
  console.log(`Start port ${port}`);
});
