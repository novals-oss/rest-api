import {
  SEED_BLOCK_LEN,
  type SEED_ALG_INFO,
  AI_ECB,
  AI_CBC,
  AI_OFB,
  AI_CFB,
  AI_NO_PADDING,
  AI_PKCS_PADDING,
  CTR_SUCCESS,
  CTR_FATAL_ERROR,
  CTR_DATA_LEN_ERROR,
  CTR_PAD_CHECK_ERROR,
  CTR_CIPHER_LEN_ERROR,
  BlockCopy,
  BlockXor,
} from "./seed_constant.js";
import { SEED_Encrypt, SEED_Decrypt } from "./seed_core.js";

/**
 * Initializes the SEED_ALG_INFO structure with mode, padding type, and IV.
 * @param ModeID - The operation mode (e.g., AI_CFB).
 * @param PadType - The padding type (e.g., AI_NO_PADDING).
 * @param IV - The initialization vector (16 bytes). Null defaults to zeros.
 * @param AlgInfo - The structure to initialize.
 */
export function SEED_SetAlgInfo(
  ModeID: number,
  PadType: number,
  IV: Uint8Array | null,
  AlgInfo: SEED_ALG_INFO
): void {
  AlgInfo.ModeID = ModeID;
  AlgInfo.PadType = PadType;

  if (IV && IV.length === SEED_BLOCK_LEN) {
    AlgInfo.IV.set(IV);
  } else {
    AlgInfo.IV.fill(0);
  }
  // Ensure other buffers are initialized
  AlgInfo.ChainVar.fill(0);
  AlgInfo.Buffer.fill(0);
  AlgInfo.BufLen = 0;
}

// --- Padding Functions ---

/**
 * Applies padding to the last block.
 * @returns The number of padding bytes added, or an error code.
 */
function PaddSet(
  pbOutBuffer: Uint8Array,
  dRmdLen: number,
  dBlockLen: number,
  dPaddingType: number
): number {
  let dPadLen: number;

  switch (dPaddingType) {
    case AI_NO_PADDING:
      if (dRmdLen === 0) return 0;
      else return CTR_DATA_LEN_ERROR;

    case AI_PKCS_PADDING:
      dPadLen = dBlockLen - dRmdLen;
      if (dPadLen <= 0 || dPadLen > dBlockLen) {
        return CTR_FATAL_ERROR;
      }
      pbOutBuffer.fill(dPadLen, dRmdLen, dBlockLen);
      return dPadLen;

    default:
      return CTR_FATAL_ERROR;
  }
}

/**
 * Checks and removes padding from the last decrypted block.
 * @returns The number of padding bytes found (and thus removed), or an error code.
 */
function PaddCheck(
  pbOutBuffer: Uint8Array,
  dBlockLen: number,
  dPaddingType: number
): number {
  let dPadLen: number;

  switch (dPaddingType) {
    case AI_NO_PADDING:
      return 0;

    case AI_PKCS_PADDING:
      dPadLen = pbOutBuffer[dBlockLen - 1];

      if (dPadLen <= 0 || dPadLen > dBlockLen) {
        return CTR_PAD_CHECK_ERROR;
      }

      for (let i = 1; i <= dPadLen; i++) {
        if (pbOutBuffer[dBlockLen - i] !== dPadLen) {
          return CTR_PAD_CHECK_ERROR;
        }
      }
      return dPadLen;

    default:
      return CTR_FATAL_ERROR;
  }
}

/**
 * Initializes the encryption process.
 */
export function SEED_EncInit(AlgInfo: SEED_ALG_INFO): number {
  AlgInfo.BufLen = 0;
  AlgInfo.Buffer.fill(0);
  if (AlgInfo.ModeID !== AI_ECB) {
    AlgInfo.ChainVar.set(AlgInfo.IV);
  }
  return CTR_SUCCESS;
}

function CFB_EncUpdate(
  AlgInfo: SEED_ALG_INFO,
  PlainTxt: Uint8Array,
  CipherTxt: Uint8Array
): { CipherTxtLen: number; status: number } {
  const BlockLen = SEED_BLOCK_LEN;
  let BufLen = AlgInfo.BufLen;
  let PlainTxtLen = PlainTxt.length;
  let PlainTxtOffset = 0;
  let CipherTxtOffset = 0;

  let totalDataLen = BufLen + PlainTxtLen;
  let outputLen = 0;

  if (totalDataLen < BlockLen) {
    AlgInfo.Buffer.set(PlainTxt, BufLen);
    AlgInfo.BufLen += PlainTxtLen;
    return { CipherTxtLen: 0, status: CTR_SUCCESS };
  }

  const bytesNeeded = BlockLen - BufLen;
  AlgInfo.Buffer.set(PlainTxt.subarray(0, bytesNeeded), BufLen);
  PlainTxtOffset += bytesNeeded;
  PlainTxtLen -= bytesNeeded;

  SEED_Encrypt(AlgInfo, AlgInfo.ChainVar);
  BlockXor(AlgInfo.ChainVar, AlgInfo.ChainVar, AlgInfo.Buffer);
  BlockCopy(CipherTxt, AlgInfo.ChainVar, CipherTxtOffset);
  CipherTxtOffset += BlockLen;
  outputLen += BlockLen;

  while (PlainTxtLen >= BlockLen) {
    SEED_Encrypt(AlgInfo, AlgInfo.ChainVar);

    BlockXor(
      AlgInfo.ChainVar,
      AlgInfo.ChainVar,
      PlainTxt,
      0,
      0,
      PlainTxtOffset
    );
    BlockCopy(CipherTxt, AlgInfo.ChainVar, CipherTxtOffset);
    PlainTxtOffset += BlockLen;
    CipherTxtOffset += BlockLen;
    PlainTxtLen -= BlockLen;
    outputLen += BlockLen;
  }

  // Buffer any remaining partial data
  if (PlainTxtLen > 0) {
    AlgInfo.Buffer.set(PlainTxt.subarray(PlainTxtOffset));
    AlgInfo.BufLen = PlainTxtLen;
  } else {
    AlgInfo.BufLen = 0;
  }

  return { CipherTxtLen: outputLen, status: CTR_SUCCESS };
}

/**
 * Processes the input plaintext data for encryption.
 * @param AlgInfo - Algorithm state.
 * @param PlainTxt - Input plaintext block.
 * @param CipherTxt - Output buffer for ciphertext.
 * @returns Object containing CipherTxtLen (bytes written) and status code.
 */
export function SEED_EncUpdate(
  AlgInfo: SEED_ALG_INFO,
  PlainTxt: Uint8Array,
  CipherTxt: Uint8Array // Output buffer must be large enough
): { CipherTxtLen: number; status: number } {
  switch (AlgInfo.ModeID) {
    // case AI_ECB: // Implement ECB_EncUpdate if needed
    // case AI_CBC: // Implement CBC_EncUpdate if needed
    // case AI_OFB: // Implement OFB_EncUpdate if needed
    case AI_CFB:
      return CFB_EncUpdate(AlgInfo, PlainTxt, CipherTxt);
    default:
      return { CipherTxtLen: 0, status: CTR_FATAL_ERROR };
  }
}

function CFB_EncFinal(
  AlgInfo: SEED_ALG_INFO,
  CipherTxt: Uint8Array // Output buffer
): { CipherTxtLen: number; status: number } {
  const BufLen = AlgInfo.BufLen;
  let outputLen = 0;

  if (AlgInfo.PadType === AI_NO_PADDING) {
    if (BufLen > 0) {
      SEED_Encrypt(AlgInfo, AlgInfo.ChainVar);

      for (let i = 0; i < BufLen; i++) {
        CipherTxt[i] = (AlgInfo.ChainVar[i] ^ AlgInfo.Buffer[i]) & 0xff;
      }
      outputLen = BufLen;
    }
  } else if (AlgInfo.PadType === AI_PKCS_PADDING) {
    const paddByte = PaddSet(
      AlgInfo.Buffer,
      BufLen,
      SEED_BLOCK_LEN,
      AlgInfo.PadType
    );
    if (paddByte < 0) return { CipherTxtLen: 0, status: paddByte };

    if (paddByte > 0 || BufLen === 0) {
      SEED_Encrypt(AlgInfo, AlgInfo.ChainVar);
      BlockXor(AlgInfo.ChainVar, AlgInfo.ChainVar, AlgInfo.Buffer);
      BlockCopy(CipherTxt, AlgInfo.ChainVar, 0);
      outputLen = SEED_BLOCK_LEN;
    } else {
      outputLen = 0;
    }
  } else {
    return { CipherTxtLen: 0, status: CTR_FATAL_ERROR };
  }

  // Clear sensitive info
  AlgInfo.Buffer.fill(0);
  AlgInfo.ChainVar.fill(0);
  AlgInfo.BufLen = 0;

  return { CipherTxtLen: outputLen, status: CTR_SUCCESS };
}

/**
 * Finalizes the encryption process, handling padding and the last block.
 * @param AlgInfo - Algorithm state.
 * @param CipherTxt - Output buffer for the final ciphertext block.
 * @returns Object containing CipherTxtLen (bytes written) and status code.
 */
export function SEED_EncFinal(
  AlgInfo: SEED_ALG_INFO,
  CipherTxt: Uint8Array // Output buffer must be large enough (at least SEED_BLOCK_LEN)
): { CipherTxtLen: number; status: number } {
  switch (AlgInfo.ModeID) {
    // case AI_ECB: // Implement ECB_EncFinal if needed
    // case AI_CBC: // Implement CBC_EncFinal if needed
    // case AI_OFB: // Implement OFB_EncFinal if needed
    case AI_CFB:
      return CFB_EncFinal(AlgInfo, CipherTxt);
    default:
      return { CipherTxtLen: 0, status: CTR_FATAL_ERROR };
  }
}

/**
 * Initializes the decryption process.
 */
export function SEED_DecInit(AlgInfo: SEED_ALG_INFO): number {
  AlgInfo.BufLen = 0;
  AlgInfo.Buffer.fill(0); // Clear buffer
  if (AlgInfo.ModeID !== AI_ECB) {
    AlgInfo.ChainVar.set(AlgInfo.IV); // Copy IV to ChainVar for non-ECB modes
  }
  return CTR_SUCCESS;
}

function CFB_DecUpdate(
  AlgInfo: SEED_ALG_INFO,
  CipherTxt: Uint8Array,
  PlainTxt: Uint8Array // Output buffer
): { PlainTxtLen: number; status: number } {
  const BlockLen = SEED_BLOCK_LEN;
  let BufLen = AlgInfo.BufLen;
  let CipherTxtLen = CipherTxt.length;
  let CipherTxtOffset = 0;
  let PlainTxtOffset = 0;

  let totalDataLen = BufLen + CipherTxtLen;
  let outputLen = 0;

  if (totalDataLen < BlockLen) {
    AlgInfo.Buffer.set(CipherTxt, BufLen);
    AlgInfo.BufLen += CipherTxtLen;
    return { PlainTxtLen: 0, status: CTR_SUCCESS };
  }

  const bytesNeeded = BlockLen - BufLen;
  AlgInfo.Buffer.set(CipherTxt.subarray(0, bytesNeeded), BufLen);
  CipherTxtOffset += bytesNeeded;
  CipherTxtLen -= bytesNeeded;

  SEED_Encrypt(AlgInfo, AlgInfo.ChainVar);
  BlockXor(PlainTxt, AlgInfo.ChainVar, AlgInfo.Buffer, PlainTxtOffset);
  BlockCopy(AlgInfo.ChainVar, AlgInfo.Buffer);
  PlainTxtOffset += BlockLen;
  outputLen += BlockLen;

  while (CipherTxtLen >= BlockLen) {
    SEED_Encrypt(AlgInfo, AlgInfo.ChainVar);
    BlockXor(
      PlainTxt,
      AlgInfo.ChainVar,
      CipherTxt,
      PlainTxtOffset,
      0,
      CipherTxtOffset
    );
    BlockCopy(AlgInfo.ChainVar, CipherTxt, 0, CipherTxtOffset);
    CipherTxtOffset += BlockLen;
    PlainTxtOffset += BlockLen;
    CipherTxtLen -= BlockLen;
    outputLen += BlockLen;
  }

  if (CipherTxtLen > 0) {
    AlgInfo.Buffer.set(CipherTxt.subarray(CipherTxtOffset));
    AlgInfo.BufLen = CipherTxtLen;
  } else {
    AlgInfo.BufLen = 0;
  }

  return { PlainTxtLen: outputLen, status: CTR_SUCCESS };
}

/**
 * Processes the input ciphertext data for decryption.
 * @param AlgInfo - Algorithm state.
 * @param CipherTxt - Input ciphertext block.
 * @param PlainTxt - Output buffer for plaintext.
 * @returns Object containing PlainTxtLen (bytes written) and status code.
 */
export function SEED_DecUpdate(
  AlgInfo: SEED_ALG_INFO,
  CipherTxt: Uint8Array,
  PlainTxt: Uint8Array // Output buffer must be large enough
): { PlainTxtLen: number; status: number } {
  switch (AlgInfo.ModeID) {
    // case AI_ECB: // Implement ECB_DecUpdate if needed
    // case AI_CBC: // Implement CBC_DecUpdate if needed
    // case AI_OFB: // Implement OFB_DecUpdate if needed
    case AI_CFB:
      return CFB_DecUpdate(AlgInfo, CipherTxt, PlainTxt);
    default:
      return { PlainTxtLen: 0, status: CTR_FATAL_ERROR };
  }
}

function CFB_DecFinal(
  AlgInfo: SEED_ALG_INFO,
  PlainTxt: Uint8Array // Output buffer
): { PlainTxtLen: number; status: number } {
  const BufLen = AlgInfo.BufLen;
  let outputLen = 0;

  if (AlgInfo.PadType === AI_NO_PADDING) {
    if (BufLen > 0) {
      SEED_Encrypt(AlgInfo, AlgInfo.ChainVar);

      for (let i = 0; i < BufLen; i++) {
        PlainTxt[i] = (AlgInfo.ChainVar[i] ^ AlgInfo.Buffer[i]) & 0xff;
      }
      outputLen = BufLen;
    }
  } else if (AlgInfo.PadType === AI_PKCS_PADDING) {
    if (BufLen !== SEED_BLOCK_LEN) {
      return { PlainTxtLen: 0, status: CTR_CIPHER_LEN_ERROR };
    }
    SEED_Encrypt(AlgInfo, AlgInfo.ChainVar);
    BlockXor(PlainTxt, AlgInfo.ChainVar, AlgInfo.Buffer, 0);

    const padLen = PaddCheck(PlainTxt, SEED_BLOCK_LEN, AlgInfo.PadType);
    if (padLen < 0) {
      return { PlainTxtLen: 0, status: padLen };
    }
    outputLen = SEED_BLOCK_LEN - padLen;
  } else {
    return { PlainTxtLen: 0, status: CTR_FATAL_ERROR };
  }

  AlgInfo.Buffer.fill(0);
  AlgInfo.ChainVar.fill(0);
  AlgInfo.BufLen = 0;

  return { PlainTxtLen: outputLen, status: CTR_SUCCESS };
}

/**
 * Finalizes the decryption process, handling the last block and padding removal.
 * @param AlgInfo - Algorithm state.
 * @param PlainTxt - Output buffer for the final plaintext block.
 * @returns Object containing PlainTxtLen (bytes written) and status code.
 */
export function SEED_DecFinal(
  AlgInfo: SEED_ALG_INFO,
  PlainTxt: Uint8Array
): { PlainTxtLen: number; status: number } {
  switch (AlgInfo.ModeID) {
    // case AI_ECB: // Implement ECB_DecFinal if needed
    // case AI_CBC: // Implement CBC_DecFinal if needed
    // case AI_OFB: // Implement OFB_DecFinal if needed
    case AI_CFB:
      return CFB_DecFinal(AlgInfo, PlainTxt);
    default:
      return { PlainTxtLen: 0, status: CTR_FATAL_ERROR };
  }
}
