use cardano/transaction.{Datum, InlineDatum} as tx

pub type Action {
  CheckMint
  CheckBurn(ByteArray)
}

pub type BountyDatum {
  issue_url: Data,
  reward: Int,
}

pub fn to_bounty_datum(data: Datum) -> BountyDatum {
  expect InlineDatum(my_datum) = data
  expect bounty_datum: BountyDatum = my_datum
  bounty_datum
}
