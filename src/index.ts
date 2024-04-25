import express from "express";
import { config } from "dotenv";
import cors from "cors";
import {
  account_address,
  gateway_url,
  getPrivateKey,
  network_id,
  randomShard,
  shardz_badge,
  shardz_ticket_address,
  write_log,
} from "./Utils";
import { LTSRadixEngineToolkit } from "@radixdlt/radix-engine-toolkit";
import { GatewayApiClient } from "@radixdlt/babylon-gateway-api-sdk";
import { BadRequestError, InternalServerError } from "./Error";
import { ProcessRandomMintRequest } from "./Types";
import {
  callMethod,
  createProofOfAmount,
  GatewayProcessor,
  lockFee,
} from "@beaker-tools/typescript-toolkit";

config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));
app.use(cors());
export const gatewayApi = GatewayApiClient.initialize({
  basePath: gateway_url(),
  applicationName: "Shardz Randomizer",
});

export const gatewayProcessor = new GatewayProcessor(gatewayApi);

async function launch() {
  write_log(`Listening on port ${process.env.PORT}!`);

  const address = await LTSRadixEngineToolkit.Derive.virtualAccountAddress(
    getPrivateKey().publicKey(),
    network_id(),
  );
  write_log(`Using config: ${network_id()}, ${gateway_url()}`);
  write_log(`Using account ${address}`);
}

app.listen(process.env.PORT, launch);

app.get("/", async (_req, res) => {
  return res.json("Radix Shardz backend api. Documentation coming soon!");
});

app.post("/processRandomMint", async (req) => {
  try {
    let input = req.body as ProcessRandomMintRequest;

    let non_fungible_items = await gatewayProcessor.getNonFungibleItemsFromIds(
      shardz_ticket_address(),
      input.ids,
    );

    let to_process = non_fungible_items.filter((item) => {
      if (!item.non_fungible_data) {
        return false;
      }
      let shard_type = item.non_fungible_data.get("shard_type");
      return shard_type && shard_type === "None";
    });

    if (to_process.length > 0) {
      let update_string = "";

      to_process.forEach((item) => {
        const shard = `Enum<1u8>(Enum<${randomShard()}u8>())`;
        update_string += `
      ${callMethod("update_non_fungible_data", shardz_ticket_address(), [`NonFungibleLocalId("${item.id}")`, `"shard_type"`, shard])}`;
      });

      let string_manifest = `
      ${lockFee(account_address(), 20)}
      
      ${createProofOfAmount(account_address(), shardz_badge(), 1)}
      
      ${update_string}
    `;

      await gatewayProcessor.submitRawManifest(
        string_manifest,
        network_id(),
        getPrivateKey(),
      );

      return;
    }
  } catch (bad_request_err) {
    //throw new BadRequestError("Request type is wrong");
    throw bad_request_err;
  }
});
