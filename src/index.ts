import express from "express";
import { config } from "dotenv";
import cors from "cors";
import {
  account_address,
  cert_path,
  claim_account,
  component_address,
  gateway_url,
  get_config,
  getPrivateKey,
  network_id,
  privkey_path,
  randomShard,
  shardz_badge,
  shardz_ticket_address,
  write_log,
} from "./Utils";
import { LTSRadixEngineToolkit } from "@radixdlt/radix-engine-toolkit";
import { GatewayApiClient } from "@radixdlt/babylon-gateway-api-sdk";
import { ProcessRandomMintRequest } from "./Types";
import {
  addressFrom,
  callMethod,
  GatewayProcessor,
  lockFee,
  NonFungibleItem,
} from "@beaker-tools/typescript-toolkit";
import * as https from "https";
import fs from "fs";
import * as http from "node:http";

config();

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb" }));
app.use(cors());
export const gatewayApi = GatewayApiClient.initialize({
  basePath: gateway_url(),
  applicationName: "Shardz Randomizer",
});

export const gatewayProcessor = new GatewayProcessor(gatewayApi);

async function launch() {
  const address = await LTSRadixEngineToolkit.Derive.virtualAccountAddress(
    getPrivateKey().publicKey(),
    network_id(),
  );
  write_log(`Using config: ${network_id()}, ${gateway_url()}`);
  write_log(`Using account ${address}`);
}

if (get_config() === 1) {
  write_log("Launching server in HTTPS config");
  const options = {
    key: fs.readFileSync(privkey_path()),
    cert: fs.readFileSync(cert_path()),
  };

  https.createServer(options, app).listen(443, launch);

  // Redirect http traffic
  http.createServer((req, res) => {
    res.writeHead(301, {
      Location: "https://" + req.headers["host"] + req.url,
    });
    res.end();
  });
} else {
  write_log("Launching in local config");
  write_log(`Listening on port ${process.env.PORT}!`);
  app.listen(process.env.PORT, launch);
}

app.get("/", async (_req, res) => {
  return res.json("Radix Shardz backend api. Documentation coming soon!");
});

app.post("/processRandomMint", async (req, res) => {
  try {
    let input = req.body as ProcessRandomMintRequest;

    let updated: NonFungibleItem[] = [];

    write_log(
      `Received request to proceed random mint with ${input.ids.length} items.`,
    );

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
      write_log(`Processing ${to_process.length} items.`);
      let update_string = "";

      to_process.forEach((item) => {
        const shard = `Enum<1u8>(Enum<${randomShard()}u8>())`;
        update_string += `
      ${callMethod("update_non_fungible_data", shardz_ticket_address(), [`NonFungibleLocalId("${item.id}")`, `"shard_type"`, shard])}`;
      });

      let string_manifest = `
      ${lockFee(account_address(), 20)}
       
      CALL_METHOD
        ${addressFrom(account_address())}
        "create_proof_of_non_fungibles"
        ${addressFrom(shardz_badge())}
        Array<NonFungibleLocalId>(NonFungibleLocalId("#0#"));
      
      ${update_string}
    `;

      let receipt = await gatewayProcessor.submitRawManifest(
        string_manifest,
        network_id(),
        getPrivateKey(),
      );

      updated =
        receipt.transaction_status == "CommittedSuccess" ? to_process : [];
    } else {
      write_log("All items have already been processed.");
    }

    res.json(updated);
  } catch (bad_request_err) {
    //throw new BadRequestError("Request type is wrong");
    throw bad_request_err;
  }
});

app.get("/claimRoyalties", async (_, res) => {
  write_log("Received request to claim royalties");

  let state_response = await gatewayProcessor.entityDetails([
    component_address(),
  ]);

  let state = state_response.items[0];

  if (state && state.details.type == "Component") {
    let to_claim = parseFloat(state.details.royalty_vault_balance);

    if (to_claim > 0) {
      write_log(`Found ${to_claim} XRD to claim!`);

      let manifest = `
         ${lockFee(account_address(), 20)}
            
        ${callMethod("create_proof_of_non_fungibles", account_address(), [addressFrom(shardz_badge()), `Array<NonFungibleLocalId>(NonFungibleLocalId("#0#"))`])}
        
        CLAIM_COMPONENT_ROYALTIES
          Address("${component_address()}");
          
        ${callMethod("try_deposit_batch_or_abort", claim_account(), [`Expression("ENTIRE_WORKTOP")`, `None`])}
  `;

      let receipt = await gatewayProcessor.submitRawManifest(
        manifest,
        network_id(),
        getPrivateKey(),
      );

      if (receipt.transaction_status == "CommittedSuccess") {
        res.json(
          `Transaction ${receipt.intent_hash} succeeded. Claimed ${to_claim} XRD!`,
        );
      } else {
        res.json(`Transaction failed with error: ${receipt.error_message}`);
      }
    } else {
      res.json("There are no royalties to claim!");
    }
  } else {
    res.json("Something went wrong!");
  }
});
