import {
  SEED_BLOCK_LEN,
  SEED_USER_KEY_LEN,
  SEED_NO_ROUNDKEY,
  AI_CFB,
  AI_NO_PADDING,
  DATA_LEN, // Specific to Encode15/Decode15 (must be 16)
  NationType,
  type SEED_ALG_INFO,
  CTR_SUCCESS,
} from "./seed_constant.js";
import { SEED_KeySchedule } from "./seed_core.js";
import {
  SEED_SetAlgInfo,
  SEED_EncInit,
  SEED_EncUpdate,
  SEED_EncFinal,
  SEED_DecInit,
  SEED_DecUpdate,
  SEED_DecFinal,
} from "./seed_mode.js";
import { bytesToHex, hexToBytes } from "./utils.js";

// Define the IVs (Initialization Vectors)
const IVs: { [key in NationType]?: Uint8Array } = {
  [NationType.NT_KOREA]: new Uint8Array([
    56, 170, 255, 3, 4, 78, 6, 54, 8, 222, 10, 123, 19, 88, 14, 1,
  ]),
  [NationType.NT_TAIWAN]: new Uint8Array([
    57, 171, 215, 31, 14, 88, 7, 4, 48, 122, 30, 153, 39, 98, 64, 10,
  ]),
};

// TextEncoder/Decoder for string conversions
const encoder = new TextEncoder(); // Defaults to utf-8
const decoder = new TextDecoder(); // Defaults to utf-8

/**
 * Encodes plaintext using SEED CFB mode with specific parameters.
 * Mimics the behavior of the C++ Encode15 function precisely.
 * @param szPlain - The plaintext string to encode.
 * @param szUserKey - The user key string (must be <= 16 bytes).
 * @param eNationType - The nation type to select the IV.
 * @returns The hex-encoded ciphertext string, or null on error.
 */
export function Encode15(
  szPlain: string,
  szUserKey: string,
  eNationType: NationType = NationType.NT_KOREA
): string | null {
  const plainBytes = encoder.encode(szPlain);
  const userKeyBytes = encoder.encode(szUserKey);
  const originalPlainLen = plainBytes.length;

  if (originalPlainLen >= DATA_LEN) {
    console.error(
      `Encode15 - Error -1: Plaintext length (${originalPlainLen}) must be less than DATA_LEN (${DATA_LEN})`
    );
    return null;
  }
  if (userKeyBytes.length >= SEED_USER_KEY_LEN) {
    console.error("Encode15 - Error -2: User key too long");
    return null;
  }

  const iv = IVs[eNationType];
  if (!iv) {
    console.error("Encode15 - Error: Invalid NationType");
    return null;
  }

  const plainInputBuffer = new Uint8Array(DATA_LEN).fill(0);
  plainInputBuffer.set(plainBytes);

  const userKeyBuffer = new Uint8Array(SEED_USER_KEY_LEN).fill(0);
  userKeyBuffer.set(userKeyBytes);

  const AlgInfo: SEED_ALG_INFO = {
    ModeID: AI_CFB,
    PadType: AI_NO_PADDING,
    IV: new Uint8Array(SEED_BLOCK_LEN),
    ChainVar: new Uint8Array(SEED_BLOCK_LEN),
    Buffer: new Uint8Array(SEED_BLOCK_LEN),
    BufLen: 0,
    RoundKey: new Uint32Array(SEED_NO_ROUNDKEY),
  };

  SEED_SetAlgInfo(AI_CFB, AI_NO_PADDING, iv, AlgInfo);

  if (SEED_KeySchedule(userKeyBuffer, AlgInfo) !== CTR_SUCCESS) {
    console.error("Encode15 - Error -3: Key schedule failed");
    return null;
  }

  if (SEED_EncInit(AlgInfo) !== CTR_SUCCESS) {
    console.error("Encode15 - Error -4: Encryption init failed");
    return null;
  }

  const rawCipherBuffer = new Uint8Array(DATA_LEN);
  let totalCipherLen = 0;

  const updateResult = SEED_EncUpdate(
    AlgInfo,
    plainInputBuffer,
    rawCipherBuffer
  );
  if (updateResult.status !== CTR_SUCCESS) {
    console.error("Encode15 - Error -5: Encryption update failed");
    return null;
  }
  totalCipherLen += updateResult.CipherTxtLen;

  const finalCipherBuffer = new Uint8Array(SEED_BLOCK_LEN);
  const finalResult = SEED_EncFinal(AlgInfo, finalCipherBuffer);
  if (finalResult.status !== CTR_SUCCESS) {
    console.error("Encode15 - Error -6: Encryption final failed");
    return null;
  }
  if (finalResult.CipherTxtLen > 0) {
    const temp = new Uint8Array(totalCipherLen + finalResult.CipherTxtLen);
    temp.set(rawCipherBuffer.subarray(0, totalCipherLen));
    temp.set(
      finalCipherBuffer.subarray(0, finalResult.CipherTxtLen),
      totalCipherLen
    );
    console.warn("Encode15: Unexpected output from SEED_EncFinal");
    totalCipherLen += finalResult.CipherTxtLen;
  }

  if (totalCipherLen < originalPlainLen) {
    console.error(
      `Encode15 - Error: Encrypted length (${totalCipherLen}) is less than original plaintext length (${originalPlainLen})`
    );
    return null;
  }

  const outputCipherBytes = rawCipherBuffer.subarray(0, originalPlainLen);
  const hexCipher = bytesToHex(outputCipherBytes);

  return hexCipher;
}

/**
 * Decodes hex-encoded ciphertext using SEED CFB mode.
 * Mimics the behavior of the C++ Decode15 function precisely.
 * @param szCipher - The hex-encoded ciphertext string.
 * @param szUserKey - The user key string (must be <= 16 bytes).
 * @param eNationType - The nation type to select the IV.
 * @returns The decoded plaintext string, or null on error.
 */
export function Decode15(
  szCipher: string,
  szUserKey: string,
  eNationType: NationType = NationType.NT_KOREA
): string | null {
  let cipherBytes: Uint8Array;
  try {
    cipherBytes = hexToBytes(szCipher);
  } catch (e: any) {
    console.error("Decode15 - Error: Invalid hex ciphertext:", e.message);
    return null;
  }

  const userKeyBytes = encoder.encode(szUserKey);
  const decodeLen = cipherBytes.length;

  if (decodeLen === 0 || decodeLen > DATA_LEN) {
    console.error(
      `Decode15 - Error -1: Ciphertext byte length (${decodeLen}) must be > 0 and <= DATA_LEN (${DATA_LEN})`
    );
    return null;
  }
  if (userKeyBytes.length >= SEED_USER_KEY_LEN) {
    console.error("Decode15 - Error -2: User key too long");
    return null;
  }

  const iv = IVs[eNationType];
  if (!iv) {
    console.error("Decode15 - Error: Invalid NationType");
    return null;
  }

  const userKeyBuffer = new Uint8Array(SEED_USER_KEY_LEN).fill(0);
  userKeyBuffer.set(userKeyBytes);

  const AlgInfo: SEED_ALG_INFO = {
    ModeID: AI_CFB,
    PadType: AI_NO_PADDING,
    IV: new Uint8Array(SEED_BLOCK_LEN),
    ChainVar: new Uint8Array(SEED_BLOCK_LEN),
    Buffer: new Uint8Array(SEED_BLOCK_LEN),
    BufLen: 0,
    RoundKey: new Uint32Array(SEED_NO_ROUNDKEY),
  };

  SEED_SetAlgInfo(AI_CFB, AI_NO_PADDING, iv, AlgInfo);

  if (SEED_KeySchedule(userKeyBuffer, AlgInfo) !== CTR_SUCCESS) {
    console.error("Decode15 - Error -3: Key schedule failed");
    return null;
  }

  if (SEED_DecInit(AlgInfo) !== CTR_SUCCESS) {
    console.error("Decode15 - Error -4: Decryption init failed");
    return null;
  }

  const plainOutputBuffer = new Uint8Array(DATA_LEN);
  let totalPlainLen = 0;

  const updateResult = SEED_DecUpdate(AlgInfo, cipherBytes, plainOutputBuffer);
  if (updateResult.status !== CTR_SUCCESS) {
    console.error("Decode15 - Error -5: Decryption update failed");
    return null;
  }
  totalPlainLen += updateResult.PlainTxtLen;

  const finalPlainBuffer = new Uint8Array(SEED_BLOCK_LEN);
  const finalResult = SEED_DecFinal(AlgInfo, finalPlainBuffer);
  if (finalResult.status !== CTR_SUCCESS) {
    console.error("Decode15 - Error -6: Decryption final failed");
    return null;
  }

  if (finalResult.PlainTxtLen > 0) {
    plainOutputBuffer.set(
      finalPlainBuffer.subarray(0, finalResult.PlainTxtLen),
      totalPlainLen
    );
    totalPlainLen += finalResult.PlainTxtLen;
  }

  if (totalPlainLen !== decodeLen) {
    console.error(
      `Decode15 - Error: Output length (${totalPlainLen}) mismatch with input ciphertext length (${decodeLen}). Decryption logic error?`
    );
    return null;
  }

  const finalPlainBytes = plainOutputBuffer.subarray(0, totalPlainLen);
  const plainString = decoder.decode(finalPlainBytes);

  return plainString;
}
