import {
  BlockfrostProvider,
  BrowserWallet,
  MeshTxBuilder,
  resolveScriptHash,
  stringToHex,
  deserializeAddress,
  applyCborEncoding,
  CIP68_100,
  CIP68_222,
  serializePlutusScript,
  mConStr0,
} from "@meshsdk/core";
import { applyParamsToScript, OfflineEvaluator } from "@meshsdk/core-csl";

export const mintExample = async (wallet: BrowserWallet) => {
  if (!wallet) {
    alert("Please connect your wallet");
    return;
  }
  if (!process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY) {
    alert("Please set up environment variables");
    return;
  }

  // Set up tx builder with blockfrost support
  const blockfrost: BlockfrostProvider = new BlockfrostProvider(
    process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY,
    0
  );
  const txBuilder: MeshTxBuilder = new MeshTxBuilder({
    fetcher: blockfrost,
    submitter: blockfrost,
    evaluator: new OfflineEvaluator(blockfrost, "preprod"),
  });

  const changeAddress = await wallet.getChangeAddress();
  const utxos = await wallet.getUtxos();
  const collateral = (await wallet.getCollateral())[0];
  const usedAddress = (await wallet.getUsedAddresses())[0];
  const pubKeyHash = deserializeAddress(usedAddress).pubKeyHash;

  const spendingScriptCbor = applyCborEncoding(
    "5857010100323232323225333002323232323253330073370e900118041baa00113233224a260160026016601800260126ea800458c024c02800cc020008c01c008c01c004c010dd50008a4c26cacae6955ceaab9e5742ae89"
  );

  const scriptAddress = serializePlutusScript(
    {
      code: spendingScriptCbor,
      version: "V3",
    },
    undefined,
    0
  ).address;

  const mintingScriptCbor = applyParamsToScript(
    "590e610101003232323232323232323232323223225333008323232323253323300e300130103754004264a66666602e00826464a666022600860266ea80184c94ccc0580040384c94cccccc06c00403c03c03c03c4c8c94ccc0640040444c94cccccc07800454ccc068c0740084c94ccc05cc02800454ccc06cc068dd50010038098a99980b98040008a99980d980d1baa00200701301330183754002024024024024024603600260360066eb8004c060004c050dd5003006899191919191919191919191919299981080080d09919299981180080e09929998121813801099191919191919192999814180d98151baa00113232323232533302d533302d00914a22a6605c921147369676e65725f636865636b203f2046616c73650014a02a66605aa66605a008294454cc0b9241187265665f6f75747075745f636865636b203f2046616c73650014a02a66605aa66605a006294454cc0b92411672656465656d65725f636865636b203f2046616c73650014a02a66605a002294454cc0b9240113646174756d5f636865636b203f2046616c73650014a029405280a50533302c533302c33302c3372e6e64dd7180a18179baa0014901004a09445288a99816a4811b646174756d2e67697468756220213d20402222203f2046616c73650014a02a66605866ebcc054c0bcdd5000a6101800014a22a6605a92121646174756d2e636f6e747269627574696f6e73203d3d205b5d203f2046616c73650014a02940cc894ccc0b4cdc3a4008605e6ea80044c94cccccc0d800454ccc0b8c084c0c0dd50008992999819800817099299999981c00081781781781789919299981b000818899299999981d800819019099299981c181d80189980480091299981d0010804899299999981f8008a99981b9815181c9baa001132533303c001037132533333304100103803813232533303f00103a132533333304400103b03b03b132533304130440031330120042253330430021300a304600b132533333304800103f03f03f03f13230033048004375c002608a0040786eb40040ecc104004c10400cdd600081c01c181f000981d1baa001036036036036036303c0020333758002064064607000260700066e64dd7000981a80098189baa00102d02d02d02d02d3033303037540022a6605c9212365787065637420496e6c696e65446174756d286d795f646174756d29203d20646174610016223233001001003223300300130020023012302e3754006a666054603a60586ea8c04cc0b4dd500f8a9998152999815299981519b8f00a00513371e0100082a66605466e3c0280104cdc78040028a5014a22a6605692018f69662061737365745f6e616d655f31203d3d207265665f746b6e207b0a202061737365745f6e616d655f32203d3d206e66745f746b6e0a7d20656c73652069662061737365745f6e616d655f31203d3d206e66745f746b6e207b0a202061737365745f6e616d655f32203d3d207265665f746b6e0a7d20656c7365207b0a202046616c73650a7d203f2046616c73650014a02a666054a6660546036012294454cc0ad24115616d6f756e745f31203d3d2031203f2046616c73650014a02a666054603600e294454cc0ad240115616d6f756e745f32203d3d2031203f2046616c73650014a029405280a999815299981519b87009480045288a99815a4916616d6f756e745f31203d3d202d31203f2046616c73650014a02a66605466e1c01d200114a22a6605692116616d6f756e745f32203d3d202d31203f2046616c73650014a029414ccc0a4c070c0acdd5191980080099198008009bab3014302e375400644a666060002297ae01323332223233001001003225333036001100313233038374e660706ea4018cc0e0c0d4004cc0e0c0d80052f5c066006006607400460700026eb8c0bc004dd5981800099801801981a00118190009129998178008a60103d87a800013322533302d32533302e3371e6eb8c0d0c0d400c0244cdc78008100a50375c606600426030660646e9c0092f5c02660080080026eb0c0c4004c0c80045288a50302e302b37540022a66052921bb65787065637420536f6d65287265665f6f757470757429203d0a2020202020206f7574707574730a20202020202020207c3e206c6973742e66696e64280a202020202020202020202020666e286f757470757429207b0a20202020202020202020202020206f75747075742e61646472657373203d3d206f7261636c655f696e7075745f646174756d2e69645f746f6b656e5f73746f72655f616464726573730a2020202020202020202020207d2c0a202020202020202020202900163301101423375e602060566ea8004c0b8c0bcc0bcc0bcc0acdd500699b8a488104000de14000375c601c60526ea806ccdc524504000643b000375c601a60506ea8068c8c8cc004004048894ccc0ac00452809991299981499b8f00200514a22660080080026eb8c0b4004c0b8004dd7180618139baa019375a604c0086eb8c09000cdd698120021bae302200301d30250013025002302300132533301d300e301f3754002297adef6c6013756604660406ea8004cc008dd59811005007191919299980f180898101baa00113253333330270011533301f301230213754002264a66604800203c264a66666605200203e03e03e03e26464a66604e002042264a666666058002264a666052002046264a66666605c00204804804804826464a66605800204c264a6666660620022a66605a6060004266601a00c266601a002201604e04e04e04e04e04e04e605c002605c0066eb8004c0ac004c0ac008088088088088c0a4004c0a400cdd7000981300098111baa00101d01d01d01d01d32325333020301300115330214901274f7261636c6520696e70757420646f6573206e6f7420636f6e7461696e20616e7920646174756d001615333020301100115330214901224f7261636c6520696e70757420646174756d206d75737420626520696e6c696e65640016130263023375400460426ea8004c014c084dd5180398109baa3024302137540022a6603e9201d165787065637420536f6d65286f7261636c655f696e70757429203d0a202020207265666572656e63655f696e707574730a2020202020207c3e206c6973742e66696e64280a20202020202020202020666e287265665f696e7075743a20496e70757429207b0a2020202020202020202020207175616e746974795f6f66287265665f696e7075742e6f75747075742e76616c75652c206f7261636c655f6e66742e3173742c206f7261636c655f6e66742e326e6429203d3d20310a202020202020202020207d2c0a2020202020202020290016330073758604601a4601e66644464a666044602660486ea8004520001375a6050604a6ea8004c94ccc088c04cc090dd50008a60103d87a80001323300100137566052604c6ea8008894ccc0a0004530103d87a80001323332225333028337220100062a66605066e3c02000c4c04ccc0b4dd400125eb80530103d87a8000133006006001375c604e0026eb4c0a0004c0b0008c0a8004cc01c00c008dd5980398109baa3007302137540026eb8c018060dd7180380c111299980f980918109baa003132533302400100213253333330290011325333026001004132533333302b00115333027302a0021333008003132533302430170011325333029001007132533333302e0011533302a302d0021325333027301a001132533302c00100a13253333330310011533302d3030002133300e00100c00b00b00b00b00b00b302e001302a37540042a66604e6030002264a666058002014264a66666606200201601601626464a66605e00201a264a66666606800201c01c01c26464a666064002020264a66666606e002022022022264a666068606e0060260246eb4004044c0d0004c0d000cdd6800807181880098188019bad00100b302e001302a375400401260506ea8004020020020020020c0ac004c09cdd50010a999812180a8008a99981418139baa0020070060063025375400200a00a00a00a00a00a60500026050004006006006006604c00260446ea800c004888c94ccc07cc0480044c94ccc09000400c4c94cccccc0a40040100100100104c94ccc098c0a400c018014dd7000981300098111baa0041533301f30100011325333024001003132533333302900100400400400413253330263029003006005375c002604c00260446ea8010008c080dd50019119198008008019129998110008a60103d87a800013233322253330223372200e0062a66604466e3c01c00c4c034cc09cdd300125eb80530103d87a8000133006006001375c60420026eacc088004c098008c0900048c080c084c0840048c07c0048c078c07c00488c8cc00400400c894ccc0780045300103d87a800013322533301c300500213007330210024bd70099802002000981000098108009ba548000dd6180d180d980d980d980d8011bac301900230193019001301800130173013375400c6e1d200200b00b00b00b375c602860226ea8008dc3a40002c6024602600660220046020004602000260166ea8004526153300949011856616c696461746f722072657475726e65642066616c7365001365637580022a6600a9211472656465656d65723a20496452656465656d65720016153300449195657870656374205b506169722861737365745f6e616d655f312c20616d6f756e745f31292c0a202020202020506169722861737365745f6e616d655f322c20616d6f756e745f32295d203d0a2020202020206d696e740a20202020202020207c3e206173736574732e746f6b656e7328706f6c6963795f6964290a20202020202020207c3e20646963742e746f5f70616972732829001615330034913a657870656374206f7261636c655f696e7075745f646174756d3a204f7261636c65446174756d203d206f7261636c655f696e7075745f64617461001615330024913565787065637420636f6e74726962757465725f646174756d3a20436f6e7472696275746572446174756d203d206d795f646174756d00165734ae7155ceaab9e5573eae815d0aba257481",
    [
      {
        constructor: 0,
        fields: [
          {
            constructor: 1,
            fields: [
              {
                bytes: resolveScriptHash(spendingScriptCbor, "V3"),
              },
            ],
          },
          {
            constructor: 1,
            fields: [],
          },
        ],
      },
    ],
    "JSON"
  );

  const policyId = resolveScriptHash(mintingScriptCbor, "V3");

  try {
    const unsignedTx = await txBuilder
      .mintPlutusScriptV3()
      .mint("1", policyId, CIP68_100(pubKeyHash))
      .mintingScript(mintingScriptCbor)
      .mintRedeemerValue(
        JSON.stringify({
          constructor: 0,
          fields: [
            {
              bytes: pubKeyHash,
            },
            {
              constructor: 0,
              fields: [],
            },
          ],
        }),
        "JSON"
      )
      .mintPlutusScriptV3()
      .mint("1", policyId, CIP68_222(pubKeyHash))
      .mintingScript(mintingScriptCbor)
      .mintRedeemerValue(
        JSON.stringify({
          constructor: 0,
          fields: [
            {
              bytes: pubKeyHash,
            },
            {
              constructor: 0,
              fields: [],
            },
          ],
        }),
        "JSON"
      )
      .readOnlyTxInReference(
        "8fc4635dbc4dd5a61fb64b33c5b9b5cc819f437ace8a1c05e9ea21197356e18f",
        0
      )
      .requiredSignerHash(pubKeyHash)
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos)
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .txOut(scriptAddress, [
        { unit: policyId + CIP68_100(pubKeyHash), quantity: "1" },
      ])
      .txOutInlineDatumValue(
        JSON.stringify({
          constructor: 0,
          fields: [
            {
              bytes: stringToHex("aaa@github.com"),
            },
            { list: [] },
          ],
        }),
        "JSON"
      )
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);
    const txHash = await wallet.submitTx(signedTx);
    console.log(txHash);
  } catch (e) {
    console.error(e);
  }
};

// JSON.stringify({
//   constructor: 0,
//   fields: [
//     {
//       bytes: stringToHex("aaa@github.com"),
//     },
//     { list: [
//       {
//         constructor: 0,
//         fields: [
//           {
//             "list": [
//               {
//                 "bytes": pubKeyHash
//               }
//             ]
//           },
//           {
//             "int": 10000
//           }
//         ]
//       }
//     ] },
//   ],
// }),
// "JSON"
// Exercise 2: Try to decode this cbor and find the following information:
// Inputs
// Outputs
// Mint
// transaction_witness_set.vkeywitness
// transaction_witness_set.native_script

// While this seems like a very simple transaction, there is actually a lot going on.
// In particular, an asset's identity is separated into two parts, something called a policy id, and the asset's name.
// Exercise 2a: Could you try and find information on what a policy id is?
// After which, try to explain concisely what the above nativeScript is doing.
