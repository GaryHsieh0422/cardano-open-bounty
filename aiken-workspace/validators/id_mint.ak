use aiken/primitive/bytearray.{concat}
use cardano/address.{from_script}
use cardano/assets.{AssetName, PolicyId, from_asset, quantity_of}
use cardano/transaction.{InlineDatum, Transaction} as tx
use cip.{cip68_100, cip68_222}
use cocktail.{convert_int_to_bytes, outputs_at_with}
use cocktail/vodka_extra_signatories.{key_signed}
use identity_token_type.{
  CheckBurn, CheckMint, ContributerDatum, IdRedeemr, to_contributer_datum,
}
use mocktail.{
  add_output, complete, mint, mock_policy_id, mock_pub_key_address,
  mock_pub_key_hash, mock_script_output, mock_tx_hash, mocktail_tx, ref_tx_in,
  ref_tx_in_inline_datum, required_signer_hash, tx_in, tx_in_inline_datum,
}
use oracle_token_type.{OracleCounterDatum, OracleDatum}
use oracle_token_util.{get_oracle_counter_datum, get_oracle_nft_datum}

validator identity_token(
  oracle_nft: (PolicyId, AssetName),
  oracle_counter: PolicyId,
) {
  mint(redeemer: IdRedeemr, policy_id: PolicyId, transaction: Transaction) {
    let Transaction {
      mint,
      outputs,
      reference_inputs,
      inputs,
      extra_signatories,
      ..
    } = transaction

    let oracle_input_datum: OracleDatum =
      reference_inputs |> get_oracle_nft_datum(oracle_nft)

    let oracle_counter_datum: OracleCounterDatum =
      inputs |> get_oracle_counter_datum(oracle_counter)

    let counter_bytes = convert_int_to_bytes(oracle_counter_datum.count)

    let ref_token_name =
      cip.cip68_100(redeemer.token_name)
        |> concat(counter_bytes)
    let ref_token_qty =
      mint
        |> quantity_of(policy_id, ref_token_name)

    let nft_token_name =
      cip.cip68_222(redeemer.token_name)
        |> concat(counter_bytes)
    let nft_token_qty =
      mint
        |> quantity_of(policy_id, nft_token_name)

    when redeemer.action is {
      CheckMint -> {
        let are_tokens_nfts = ref_token_qty == 1 && nft_token_qty == 1
        expect [ref_output] =
          outputs_at_with(
            outputs,
            oracle_input_datum.id_token_store_address,
            policy_id,
            ref_token_name,
          )

        let datum = ref_output.datum |> to_contributer_datum()
        let datum_check =
          datum.contributions == [] && key_signed(
            extra_signatories,
            datum.pub_key_hash,
          )

        are_tokens_nfts? && datum_check?
      }
      CheckBurn -> (ref_token_qty == -1)? && (nft_token_qty == -1)?
    }
  }

  else(_) {
    fail
  }
}

type MintTestCase {
  is_counter_inputed: Bool,
  is_oracle_inputed: Bool,
  is_ref_output_check: Bool,
  is_redeemer_check: Bool,
  is_datum_check: Bool,
  is_key_signed: Bool,
}

const mock_oracle_datum: OracleDatum =
  OracleDatum {
    bounty_token_policy_id: mock_policy_id(0),
    bounty_board_address: from_script("bounty_board_hold"),
    id_token_policy_id: mock_policy_id(1),
    id_token_store_address: from_script("ref_token_hold"),
    owner: mock_pub_key_address(0, None),
  }

fn mock_mint_tx(test_case: MintTestCase) -> Transaction {
  let MintTestCase {
    is_counter_inputed,
    is_oracle_inputed,
    is_ref_output_check,
    is_redeemer_check,
    is_datum_check,
    is_key_signed,
  } = test_case

  mocktail_tx()
    |> mint(
        is_redeemer_check,
        1,
        mock_policy_id(1),
        cip68_100("id")
          |> concat(convert_int_to_bytes(10)),
      )
    |> mint(
        is_redeemer_check,
        1,
        mock_policy_id(1),
        cip68_222("id")
          |> concat(convert_int_to_bytes(10)),
      )
    |> ref_tx_in(
        is_oracle_inputed,
        mock_tx_hash(0),
        0,
        from_asset(mock_policy_id(2), "oracle", 1),
        from_script("ref_token_hold"),
      )
    |> ref_tx_in_inline_datum(is_oracle_inputed, mock_oracle_datum)
    |> tx_in(
        is_counter_inputed,
        mock_tx_hash(0),
        0,
        from_asset(mock_policy_id(3), "", 1),
        from_script("ref_token_hold"),
      )
    |> tx_in_inline_datum(
        is_counter_inputed,
        OracleCounterDatum { count: 10, owner: mock_pub_key_address(0, None) },
      )
    |> required_signer_hash(is_key_signed, mock_pub_key_hash(0))
    |> complete()
    |> add_output(
        is_ref_output_check,
        mock_script_output(
          from_script("ref_token_hold"),
          from_asset(
            mock_policy_id(1),
            cip68_100("id")
              |> concat(convert_int_to_bytes(10)),
            1,
          ),
          if is_datum_check {
            InlineDatum(
              ContributerDatum {
                metadata: [],
                version: 1,
                contributions: [],
                pub_key_hash: mock_pub_key_hash(0),
              },
            )
          } else {
            InlineDatum(mock_oracle_datum)
          },
        ),
      )
}

test success_mint_identity_token() {
  let id_redeemer = IdRedeemr { action: CheckMint, token_name: "id" }

  let tx =
    mock_mint_tx(
      MintTestCase {
        is_counter_inputed: True,
        is_oracle_inputed: True,
        is_ref_output_check: True,
        is_redeemer_check: True,
        is_datum_check: True,
        is_key_signed: True,
      },
    )

  identity_token.mint(
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}

test fail_mint_identity_token_with_no_counter() fail {
  let id_redeemer = IdRedeemr { action: CheckMint, token_name: "id" }

  let tx =
    mock_mint_tx(
      MintTestCase {
        is_counter_inputed: False,
        is_oracle_inputed: True,
        is_ref_output_check: True,
        is_redeemer_check: True,
        is_datum_check: True,
        is_key_signed: True,
      },
    )

  identity_token.mint(
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}

test fail_mint_identity_token_with_no_oracle() fail {
  let id_redeemer = IdRedeemr { action: CheckMint, token_name: "id" }

  let tx =
    mock_mint_tx(
      MintTestCase {
        is_counter_inputed: True,
        is_oracle_inputed: False,
        is_ref_output_check: True,
        is_redeemer_check: True,
        is_datum_check: True,
        is_key_signed: True,
      },
    )

  identity_token.mint(
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}

test fail_mint_identity_token_with_no_ref_output() fail {
  let id_redeemer = IdRedeemr { action: CheckMint, token_name: "id" }

  let tx =
    mock_mint_tx(
      MintTestCase {
        is_counter_inputed: True,
        is_oracle_inputed: True,
        is_ref_output_check: False,
        is_redeemer_check: True,
        is_datum_check: True,
        is_key_signed: True,
      },
    )

  identity_token.mint(
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}

test fail_mint_identity_token_with_no_redeeme() fail {
  let id_redeemer = IdRedeemr { action: CheckMint, token_name: "id" }

  let tx =
    mock_mint_tx(
      MintTestCase {
        is_counter_inputed: True,
        is_oracle_inputed: True,
        is_ref_output_check: True,
        is_redeemer_check: False,
        is_datum_check: True,
        is_key_signed: True,
      },
    )

  identity_token.mint(
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}

test fail_mint_identity_token_with_no_datumn() fail {
  let id_redeemer = IdRedeemr { action: CheckMint, token_name: "id" }

  let tx =
    mock_mint_tx(
      MintTestCase {
        is_counter_inputed: True,
        is_oracle_inputed: True,
        is_ref_output_check: True,
        is_redeemer_check: True,
        is_datum_check: False,
        is_key_signed: True,
      },
    )

  identity_token.mint(
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}

test fail_mint_identity_token_with_no_sign() fail {
  let id_redeemer = IdRedeemr { action: CheckMint, token_name: "id" }

  let tx =
    mock_mint_tx(
      MintTestCase {
        is_counter_inputed: True,
        is_oracle_inputed: True,
        is_ref_output_check: True,
        is_redeemer_check: True,
        is_datum_check: True,
        is_key_signed: False,
      },
    )

  identity_token.mint(
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}

type BurnTestCase {
  is_counter_inputed: Bool,
  is_oracle_inputed: Bool,
  is_redeemer_check: Bool,
  is_token_inputed: Bool,
}

fn mock_burn_tx(test_case: BurnTestCase) -> Transaction {
  let BurnTestCase {
    is_counter_inputed,
    is_oracle_inputed,
    is_redeemer_check,
    is_token_inputed,
  } = test_case

  mocktail_tx()
    |> mint(
        is_redeemer_check,
        -1,
        mock_policy_id(1),
        cip68_100("id")
          |> concat(convert_int_to_bytes(10)),
      )
    |> mint(
        is_redeemer_check,
        -1,
        mock_policy_id(1),
        cip68_222("id")
          |> concat(convert_int_to_bytes(10)),
      )
    |> tx_in(
        is_token_inputed,
        mock_tx_hash(1),
        0,
        from_asset(
          mock_policy_id(1),
          cip68_222("id")
            |> concat(convert_int_to_bytes(10)),
          1,
        ),
        mock_pub_key_address(0, None),
      )
    |> tx_in(
        is_token_inputed,
        mock_tx_hash(1),
        0,
        from_asset(
          mock_policy_id(1),
          cip68_100("id")
            |> concat(convert_int_to_bytes(10)),
          1,
        ),
        from_script("ref_token_hold"),
      )
    |> ref_tx_in(
        is_oracle_inputed,
        mock_tx_hash(0),
        0,
        from_asset(mock_policy_id(2), "oracle", 1),
        from_script("ref_token_hold"),
      )
    |> ref_tx_in_inline_datum(is_oracle_inputed, mock_oracle_datum)
    |> tx_in(
        is_counter_inputed,
        mock_tx_hash(0),
        0,
        from_asset(mock_policy_id(3), "", 1),
        from_script("ref_token_hold"),
      )
    |> tx_in_inline_datum(
        is_counter_inputed,
        OracleCounterDatum { count: 10, owner: mock_pub_key_address(0, None) },
      )
    |> complete()
}

test success_burn_identity_token() {
  let id_redeemer = IdRedeemr { action: CheckBurn, token_name: "id" }

  let tx =
    mock_burn_tx(
      BurnTestCase {
        is_counter_inputed: True,
        is_oracle_inputed: True,
        is_redeemer_check: True,
        is_token_inputed: True,
      },
    )

  identity_token.mint(
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}

test fail_burn_identity_token_with_no_redeemer() fail {
  let id_redeemer = IdRedeemr { action: CheckBurn, token_name: "id" }

  let tx =
    mock_burn_tx(
      BurnTestCase {
        is_counter_inputed: True,
        is_oracle_inputed: True,
        is_redeemer_check: False,
        is_token_inputed: True,
      },
    )

  identity_token.mint(
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}
