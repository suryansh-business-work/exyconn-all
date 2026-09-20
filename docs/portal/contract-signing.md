# Signing a contract

Signing used to be one mutation that wrote a name into a field: whoever had the Sign Board
open typed the counterparty's name, the contract read as signed, and nothing tied that to the
person named, to the moment, or to a document — because a contract had no document. It
carried a title, a party and two dates, with nothing to read.

## What a signature is made of now

A contract has a `documentUrl`, and a signature records four things:

|                |                                                                        |
| -------------- | ---------------------------------------------------------------------- |
| **Who**        | The name the signer typed, and the address the link was sent to        |
| **When**       | The moment the server recorded it, not a date anybody chose            |
| **From where** | The IP and user agent of the request, read from the request            |
| **Of what**    | SHA-256 of the document's **bytes**, fetched and hashed at that moment |

The hash is the part that makes it a signature of something. If the file behind the contract
is ever replaced, its hash stops matching what was signed, and the record says which version
was agreed to instead of quietly appearing to cover the new one. The signer is shown the
hash on their receipt, so they hold their half of it.

A document that cannot be read is a refusal, not an empty hash: a signature with no hash
would look exactly like one whose document had been swapped.

## Two paths, one record

```
Legal → requestContractSignature ── emails a link ──► status.exyconn.com/sign/<token>
                                                        │  reads the document
                                                        │  types their name
                                                        │  agrees, separately
                                                        ▼
                                              ContractSignature (the evidence)
Legal → signContract ─────── our own side, signed by the account asking ──────┘
```

Both write the same row. Our own side is signed by **the account making the request** rather
than by a name typed into a field — the same change in the other direction, because a
signature that says whatever the person at the keyboard wanted is not a signature.

Typing the name and agreeing are separate answers on the public page. A name in a box is not
consent to anything; the switch is the act.

## The link

- Thirty days, then it stops working. Long enough for a counterparty's legal team to read a
  contract; short enough that a link forwarded on and forgotten is not a way to sign in our
  name months later.
- Works once. A request that has been used is finished — re-signing would leave two answers
  about one agreement and no way to say which stood.
- Only its SHA-256 is stored. The link is a bearer credential, so a database dump must not
  carry live ones.
- Can be withdrawn while unsigned, and cannot be withdrawn once used, because by then it is
  evidence.
- Unknown, withdrawn and expired all read identically. Telling them apart would confirm to
  somebody holding a guessed link that they had guessed a real one.

Legal is handed the link as well as emailing it: contracts often go out by another route, and
a link that exists only in somebody's inbox cannot be re-sent.

## What Legal sees

**Contracts → Send for signature** raises the request; the sign board shows every request on
a contract with its evidence — who was asked, what they typed, when, from where, and the
fingerprint of what they agreed to. That is the record an argument is settled from.

## What this is not

- **A certificate.** There is no countersigned PDF to hand a court; the evidence lives in the
  portal and in this record.
- **A provider.** No DocuSign, no Adobe Sign, no qualified electronic signature under eIDAS.
  What this gives is an audited record of consent, which is what most commercial contracts
  actually rely on — but it is not a qualified signature and should not be described as one.
- **Identity verification.** It proves somebody with that emailed link agreed. It does not
  prove who they were beyond the address Legal sent it to.
