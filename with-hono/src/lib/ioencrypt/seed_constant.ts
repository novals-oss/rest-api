export const SEED_BLOCK_LEN = 16;
export const SEED_USER_KEY_LEN = 16;
export const SEED_NO_ROUNDS = 16;
export const SEED_NO_ROUNDKEY = 2 * SEED_NO_ROUNDS;

// Operation Modes
export const AI_ECB = 1;
export const AI_CBC = 2;
export const AI_OFB = 3;
export const AI_CFB = 4;

export const AI_NO_PADDING = 1;
export const AI_PKCS_PADDING = 2;

export const CTR_SUCCESS = 0;
export const CTR_FATAL_ERROR = 0x1001;
export const CTR_INVALID_USERKEYLEN = 0x1002;
export const CTR_PAD_CHECK_ERROR = 0x1003;
export const CTR_DATA_LEN_ERROR = 0x1004;
export const CTR_CIPHER_LEN_ERROR = 0x1005;

export const DATA_LEN = 16;

// NationType Enum
export enum NationType {
  NT_KOREA = 0,
  NT_TAIWAN = 1,
  NT_MAX,
}

export interface SEED_ALG_INFO {
  ModeID: number;
  PadType: number;
  IV: Uint8Array;
  ChainVar: Uint8Array;
  Buffer: Uint8Array;
  BufLen: number;
  RoundKey: Uint32Array;
}

export function ROTL_DWORD(x: number, n: number): number {
  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

export function BIG_B2D(bytes: Uint8Array, offset: number = 0): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 4);
  return view.getUint32(0, false); // false for Big Endian
}

export function BIG_D2B(dword: number, bytes: Uint8Array, offset: number = 0) {
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 4);
  view.setUint32(0, dword >>> 0, false); // false for Big Endian
}

export function BlockCopy(
  dst: Uint8Array,
  src: Uint8Array,
  dstOffset = 0,
  srcOffset = 0
) {
  dst.set(src.subarray(srcOffset, srcOffset + SEED_BLOCK_LEN), dstOffset);
}

export function BlockXor(
  dst: Uint8Array,
  src1: Uint8Array,
  src2: Uint8Array,
  dstOffset = 0,
  src1Offset = 0,
  src2Offset = 0
) {
  for (let i = 0; i < SEED_BLOCK_LEN; i++) {
    dst[dstOffset + i] = (src1[src1Offset + i] ^ src2[src2Offset + i]) & 0xff;
  }
}
