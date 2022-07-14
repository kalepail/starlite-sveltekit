export async function generateOpenChannelTx({
  sourceAccount,
  publicKey1, 
  publicKey2,
  keypair1,
  keypair2,
}) {
  const { Server, Operation, Networks, TransactionBuilder } = await import ('stellar-sdk')

  const server = new Server('https://horizon-testnet.stellar.org')

  if ([
    sourceAccount.signers.length, 
    sourceAccount.thresholds.low_threshold, 
    sourceAccount.thresholds.med_threshold, 
    sourceAccount.thresholds.high_threshold
  ].find((v) => v >= 2)) return

  const txOpenChannel = new TransactionBuilder(
    sourceAccount, {
    fee: 100000,
    networkPassphrase: Networks.TESTNET
  })
  .addOperation(Operation.setOptions({
    lowThreshold: 2,
    medThreshold: 2,
    highThreshold: 2,
    masterWeight: 1,
    signer: {
      ed25519PublicKey: publicKey2,
      weight: 1
    },
    source: publicKey1
  }))
  .addOperation(Operation.setOptions({
    lowThreshold: 2,
    medThreshold: 2,
    highThreshold: 2,
    masterWeight: 1,
    signer: {
      ed25519PublicKey: publicKey1,
      weight: 1
    },
    source: publicKey2
  }))
  .setTimeout(0)
  .build()

  txOpenChannel.sign(keypair1, keypair2)

  return server.submitTransaction(txOpenChannel)
}

export async function generatePaymentChannelTx({
  sourceAccount,
  publicKey1,
  publicKey2,
  keypair1,
  sequence,
  amount
}) {
  const { xdr, StrKey, Account, SignerKey, Operation, Networks, TransactionBuilder, Asset } = await import ('stellar-sdk')

  const txCloseSequence = String(parseInt(sourceAccount.sequence) + sequence + 2)
  const txClose = new TransactionBuilder(
    new Account(sourceAccount.id, txCloseSequence), {
    fee: 100000,
    networkPassphrase: Networks.TESTNET
  })
  .addOperation(Operation.payment({
    destination: publicKey2,
    asset: Asset.native(),
    amount,
    source: publicKey1
  }))
  .addOperation(Operation.setOptions({
    lowThreshold: 0,
    medThreshold: 0,
    highThreshold: 0,
    masterWeight: 1,
    signer: {
      ed25519PublicKey: publicKey2,
      weight: 0
    },
    source: publicKey1
  }))
  .addOperation(Operation.setOptions({
    lowThreshold: 0,
    medThreshold: 0,
    highThreshold: 0,
    masterWeight: 1,
    signer: {
      ed25519PublicKey: publicKey1,
      weight: 0
    },
    source: publicKey2
  }))
  .setMinAccountSequence(txCloseSequence)
  .setTimebounds(parseInt(Date.now() / 1000 + (60 * 0)), 0) // (60 * x) minutes
  .build()

  const txCloseHash = txClose.hash()
  const txCloseExtraSigner = SignerKey.encodeSignerKey(
    xdr.SignerKey.signerKeyTypeEd25519SignedPayload(
      new xdr.SignerKeyEd25519SignedPayload({
        ed25519: StrKey.decodeEd25519PublicKey(publicKey2),
        payload: txCloseHash
      })
    )
)

  const txDeclarationSequence = String(parseInt(sourceAccount.sequence) + sequence)
  const txDeclaration = new TransactionBuilder(
    new Account(sourceAccount.id, txDeclarationSequence), {
    fee: 100000,
    networkPassphrase: Networks.TESTNET
  })
  .addOperation(Operation.bumpSequence({
    bumpTo: '0'
  }))
  .setExtraSigners([txCloseExtraSigner])
  .setMinAccountSequence(txDeclarationSequence)
  .setTimeout(0)
  .build()

  txClose.sign(keypair1)
  txDeclaration.sign(keypair1)

  return {
    txClose: txClose.toXDR(),
    txDeclaration: txDeclaration.toXDR()
  }
}