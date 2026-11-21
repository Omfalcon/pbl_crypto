"""
AES-256-GCM Cryptographic Engine.
Uses Python cryptography library (cryptography.hazmat.primitives.ciphers.aead.AESGCM).
Enforces:
- 256-bit key
- 96-bit (12-byte) random nonce per encryption
- 128-bit (16-byte) authentication tag
- Strict authenticated decryption before releasing plaintext.
"""
import base64
import os
from typing import Tuple, Dict, Any, Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag
from app.core.security import validate_key_bytes


class AESGCMCryptoEngine:
    """Core cryptographic engine for AES-256-GCM authenticated encryption and decryption."""

    TAG_LENGTH_BYTES = 16  # 128 bits
    NONCE_LENGTH_BYTES = 12  # 96 bits
    KEY_LENGTH_BYTES = 32  # 256 bits

    @classmethod
    def encrypt(cls, plaintext: str, key_b64: str) -> Dict[str, Any]:
        """
        Encrypts a plaintext string using AES-256-GCM.
        Generates a fresh 12-byte cryptographically secure random nonce.
        Returns Base64 encoded ciphertext, nonce, and authentication tag.
        """
        if not plaintext:
            raise ValueError("Plaintext cannot be empty.")

        is_valid, err_msg, key_bytes = validate_key_bytes(key_b64)
        if not is_valid:
            raise ValueError(f"Invalid encryption key: {err_msg}")

        # Convert message to UTF-8 bytes
        data_bytes = plaintext.encode("utf-8")

        # Generate fresh 12-byte nonce
        nonce_bytes = os.urandom(cls.NONCE_LENGTH_BYTES)

        # Initialize AES-GCM cipher
        aesgcm = AESGCM(key_bytes)

        # Encrypt: AESGCM.encrypt produces ciphertext with 16-byte authentication tag appended
        encrypted_data = aesgcm.encrypt(nonce_bytes, data_bytes, None)

        # Split ciphertext and authentication tag
        ciphertext_bytes = encrypted_data[:-cls.TAG_LENGTH_BYTES]
        tag_bytes = encrypted_data[-cls.TAG_LENGTH_BYTES:]

        # Encode to Base64
        ciphertext_b64 = base64.b64encode(ciphertext_bytes).decode("utf-8")
        nonce_b64 = base64.b64encode(nonce_bytes).decode("utf-8")
        tag_b64 = base64.b64encode(tag_bytes).decode("utf-8")

        return {
            "algorithm": "AES-256-GCM",
            "ciphertext": ciphertext_b64,
            "nonce": nonce_b64,
            "auth_tag": tag_b64,
            "key_size": 256,
            "nonce_bits": 96,
            "tag_bits": 128
        }

    @classmethod
    def decrypt(
        cls,
        ciphertext_b64: str,
        nonce_b64: str,
        tag_b64: str,
        key_b64: str
    ) -> Tuple[bool, Optional[str], str]:
        """
        Decrypts an encrypted payload using AES-256-GCM and verifies authenticity.
        Returns: (success: bool, plaintext: Optional[str], safe_message: str)
        Plaintext is ONLY returned when authentication is completely verified.
        """
        # Validate key
        is_valid_key, key_err, key_bytes = validate_key_bytes(key_b64)
        if not is_valid_key:
            return False, None, f"Decryption failed: {key_err}"

        # Decode nonce
        try:
            nonce_bytes = base64.b64decode(nonce_b64.strip(), validate=True)
            if len(nonce_bytes) != cls.NONCE_LENGTH_BYTES:
                return False, None, f"Invalid nonce length: expected {cls.NONCE_LENGTH_BYTES} bytes, got {len(nonce_bytes)} bytes."
        except Exception:
            return False, None, "Invalid nonce: corrupted Base64 encoding."

        # Decode auth tag
        try:
            tag_bytes = base64.b64decode(tag_b64.strip(), validate=True)
            if len(tag_bytes) != cls.TAG_LENGTH_BYTES:
                return False, None, f"Invalid authentication tag length: expected {cls.TAG_LENGTH_BYTES} bytes, got {len(tag_bytes)} bytes."
        except Exception:
            return False, None, "Invalid authentication tag: corrupted Base64 encoding."

        # Decode ciphertext
        try:
            ciphertext_bytes = base64.b64decode(ciphertext_b64.strip(), validate=True)
        except Exception:
            return False, None, "Invalid ciphertext: corrupted Base64 encoding."

        # Recombine ciphertext and authentication tag for AESGCM decrypt
        combined_payload = ciphertext_bytes + tag_bytes

        try:
            aesgcm = AESGCM(key_bytes)
            # Decrypt verifies the tag before returning plaintext
            decrypted_bytes = aesgcm.decrypt(nonce_bytes, combined_payload, None)
            decrypted_text = decrypted_bytes.decode("utf-8")
            return True, decrypted_text, "MESSAGE SUCCESSFULLY DECRYPTED — AUTHENTICATION VERIFIED"
        except InvalidTag:
            # Cryptographic authentication failure: either tag, ciphertext, nonce, or key was invalid/tampered
            return False, None, "Decryption failed. The key may be incorrect or the encrypted message may have been modified."
        except UnicodeDecodeError:
            return False, None, "Decryption failed: Decrypted bytes could not be decoded as UTF-8 text."
        except Exception:
            # Generic safe failure message: do not leak raw exception details
            return False, None, "Decryption failed due to cryptographic verification error."

    @classmethod
    def tamper_payload(
        cls,
        ciphertext_b64: str,
        nonce_b64: str,
        tag_b64: str,
        attack_type: str
    ) -> Dict[str, Any]:
        """
        Modifies specific bytes of ciphertext, tag, or nonce to simulate tampering.
        Tampering is performed on a copy and returns both original and modified payloads.
        """
        attack_type = attack_type.lower().strip()
        mod_ciphertext = ciphertext_b64
        mod_nonce = nonce_b64
        mod_tag = tag_b64
        tamper_description = ""

        if attack_type in ["ciphertext", "cipher"]:
            # Decode ciphertext bytes, flip bits in the first available byte
            raw_bytes = bytearray(base64.b64decode(ciphertext_b64))
            if len(raw_bytes) > 0:
                raw_bytes[0] ^= 0xFF  # Invert all bits of the first byte
            else:
                raw_bytes = bytearray(b"\xFF")
            mod_ciphertext = base64.b64encode(bytes(raw_bytes)).decode("utf-8")
            tamper_description = "Ciphertext byte 0 was inverted (bit-flip attack)."

        elif attack_type in ["tag", "auth_tag", "authentication_tag"]:
            raw_bytes = bytearray(base64.b64decode(tag_b64))
            if len(raw_bytes) > 0:
                raw_bytes[-1] ^= 0x55  # Modify last byte of tag
            else:
                raw_bytes = bytearray(b"\x00" * 16)
            mod_tag = base64.b64encode(bytes(raw_bytes)).decode("utf-8")
            tamper_description = "Authentication tag trailing byte was modified."

        elif attack_type in ["nonce", "iv"]:
            raw_bytes = bytearray(base64.b64decode(nonce_b64))
            if len(raw_bytes) > 0:
                raw_bytes[0] ^= 0xAA  # Modify initial byte of nonce
            else:
                raw_bytes = bytearray(b"\x00" * 12)
            mod_nonce = base64.b64encode(bytes(raw_bytes)).decode("utf-8")
            tamper_description = "Nonce initial byte was modified."

        else:
            raise ValueError(f"Unsupported attack type '{attack_type}'. Choose 'ciphertext', 'tag', or 'nonce'.")

        return {
            "attack_type": attack_type,
            "description": tamper_description,
            "original_payload": {
                "ciphertext": ciphertext_b64,
                "nonce": nonce_b64,
                "auth_tag": tag_b64
            },
            "modified_payload": {
                "ciphertext": mod_ciphertext,
                "nonce": mod_nonce,
                "auth_tag": mod_tag
            }
        }
