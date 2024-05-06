import { PrivateKey } from "@radixdlt/radix-engine-toolkit";
export declare function write_log(message: string): void;
export declare function network_id(): number;
export declare function account_address(): string;
export declare function shardz_badge(): string;
export declare function shardz_ticket_address(): string;
export declare const gateway_url: () => "https://mainnet.radixdlt.com/" | "https://babylon-stokenet-gateway.radixdlt.com/";
export declare function getPrivateKey(): PrivateKey;
export declare function randomShard(): number;
