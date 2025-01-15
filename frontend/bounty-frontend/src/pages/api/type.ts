import {
  ConStr0,
  Integer,
  PubKeyAddress,
  Data,
  List,
  PubKeyHash,
  ByteString,
  ConStr1,
  PolicyId,
} from "@meshsdk/common";

export type OracleNFTDatum = ConStr0<
  [PolicyId, PubKeyAddress, PolicyId, PubKeyAddress]
>;

export type OracleCounterDatum = ConStr0<[Integer, PubKeyAddress]>;

export type BountyDatum = ConStr0<[Data, Integer, List<PubKeyHash>]>;

export type ContributerDatum = ConStr0<
  [ByteString, List<ConStr0<[List<PubKeyHash>, Integer]>>]
>;

export type ActionMint = ConStr0<[]>;

export type ActionBurn = ConStr1<[]>;