import process from "process";
import { NetworkId, PrivateKey } from "@radixdlt/radix-engine-toolkit";
import { InternalServerError } from "./Error";

export function write_log(message: string) {
  let time = new Date().toISOString();
  console.log(`[${time}] ${message}`);
}

export function network_id() {
  let ret = process.env.NETWORK_ID;
  if (!ret) {
    throw new Error("NETWORK_ID is undefined");
  } else {
    return parseInt(ret);
  }
}

export function get_config(): number {
  let ret = process.env.CONFIG;
  if (!ret) {
    throw new Error("CONFIG is undefined");
  } else {
    return parseInt(ret);
  }
}

export function privkey_path(): string {
  let ret: string = process.env.PRIVKEY_PATH;
  if (!ret) {
    throw new Error("PRIVKEY_PATH is undefined");
  } else {
    return ret;
  }
}

export function cert_path(): string {
  let ret: string = process.env.CERT_PATH;
  if (!ret) {
    throw new Error("CERT_PATH is undefined");
  } else {
    return ret;
  }
}

export function account_address() {
  let str: string | undefined;
  switch (network_id()) {
    case NetworkId.Mainnet: {
      str = process.env.MAINNET_ACCOUNT_ADDRESS;
      break;
    }
    case NetworkId.Stokenet: {
      str = process.env.STOKENET_ACCOUNT_ADDRESS;
      break;
    }
    default: {
      break;
    }
  }

  if (!str) {
    throw new InternalServerError("Account address is undefined");
  }
  return str;
}

export function shardz_badge() {
  let str: string | undefined;
  switch (network_id()) {
    case NetworkId.Mainnet: {
      str = process.env.MAINNET_SHARDZ_ADMIN_BADGE;
      break;
    }
    case NetworkId.Stokenet: {
      str = process.env.STOKENET_SHARDZ_ADMIN_BADGE;
      break;
    }
    default: {
      break;
    }
  }

  if (!str) {
    throw new InternalServerError("Shardz badge is undefined");
  }
  return str;
}

export function claim_account() {
  let str: string | undefined;
  switch (network_id()) {
    case NetworkId.Mainnet: {
      str = process.env.MAINNET_CLAIM_ACCOUNT_ADDRESS;
      break;
    }
    case NetworkId.Stokenet: {
      str = process.env.STOKENET_CLAIM_ACCOUNT_ADDRESS;
      break;
    }
    default: {
      break;
    }
  }

  if (!str) {
    throw new InternalServerError("Claim account address is undefined");
  }
  return str;
}

export function component_address() {
  let str: string | undefined;
  switch (network_id()) {
    case NetworkId.Mainnet: {
      str = process.env.MAINNET_COMPONENT_ADDRESS;
      break;
    }
    case NetworkId.Stokenet: {
      str = process.env.STOKENET_COMPONENT_ADDRESS;
      break;
    }
    default: {
      break;
    }
  }

  if (!str) {
    throw new InternalServerError("Component address is undefined");
  }
  return str;
}

export function shardz_ticket_address() {
  let str: string | undefined;
  switch (network_id()) {
    case NetworkId.Mainnet: {
      str = process.env.MAINNET_SHARDZ_TICKET_ADDRESS;
      break;
    }
    case NetworkId.Stokenet: {
      str = process.env.STOKENET_SHARDZ_TICKET_ADDRESS;
      break;
    }
    default: {
      break;
    }
  }

  if (!str) {
    throw new InternalServerError("Shardz ticket address is undefined");
  }
  return str;
}

export const gateway_url = () => {
  if (network_id() === 1) {
    return "https://mainnet.radixdlt.com/";
  } else {
    if (network_id() === 2) {
      return "https://babylon-stokenet-gateway.radixdlt.com/";
    } else {
      throw new Error("Wrong configuration");
    }
  }
};

export function getPrivateKey(): PrivateKey {
  let key_string = hexPrivateKey();
  const bytes: number[] = [];
  for (let i = 0; i < key_string.length; i += 2) {
    bytes.push(parseInt(key_string.slice(i, i + 2), 16));
  }
  return new PrivateKey.Ed25519(new Uint8Array(bytes));
}

function hexPrivateKey(): string {
  let str: string | undefined;
  switch (network_id()) {
    case NetworkId.Mainnet: {
      str = process.env.MAINNET_PRIVATE_KEY;
      break;
    }
    case NetworkId.Stokenet: {
      str = process.env.STOKENET_PRIVATE_KEY;
      break;
    }
    default: {
      break;
    }
  }

  if (!str) {
    throw new InternalServerError("Private key is undefined");
  }
  return str;
}

export function randomShard(): number {
  let random = Math.random() * 100;
  console.log(random);
  if (random <= 0.1) {
    return 7;
  } else if (random <= 1.1) {
    return 6;
  } else if (random <= 4.1) {
    return 5;
  } else if (random <= 9.1) {
    return 4;
  } else if (random <= 19.6) {
    return 3;
  } else if (random <= 38) {
    return 2;
  } else if (random <= 64.6) {
    return 1;
  } else {
    return 0;
  }
}
