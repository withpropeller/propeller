package helpers

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha512"
	"encoding/base64"
	"errors"
	"io"

	"github.com/xdg-go/pbkdf2"
)

// https://gist.github.com/STGDanny/03acf29a90684c2afc9487152324e832
// https://gist.github.com/enyachoke/5c60f5eebed693d9b4bacddcad693b47
// https://gist.github.com/AndiDittrich/4629e7db04819244e843

const SALT_SIZE = 64
const PBKDF2_ITERATIONS = 2145

func Encrypt(plaintext string, passphrase string) (encrypted []byte, err error) {

	//Make the cipher text a byte array of size BlockSize + the length of the message
	cipherText := make([]byte, SALT_SIZE+aes.BlockSize)

	//salt is the ciphertext up to the blocksize (SALT_SIZE)
	salt := cipherText[:SALT_SIZE]
	io.ReadFull(rand.Reader, salt)
	if _, err = io.ReadFull(rand.Reader, salt); err != nil {
		return
	}

	//initialization vector
	iv := cipherText[SALT_SIZE:]
	if _, err = io.ReadFull(rand.Reader, iv); err != nil {
		return
	}

	// derive encryption key: 32 byte key length
	// in assumption the masterkey is a cryptographic and NOT a password there is no need for
	// a large number of iterations. It may can replaced by HKDF
	// the value of 2145 is randomly chosen!
	key := pbkdf2.Key([]byte(passphrase), salt, PBKDF2_ITERATIONS, 32, sha512.New)

	block, _ := aes.NewCipher(key)
	aesgcm, _ := cipher.NewGCMWithNonceSize(block, aes.BlockSize)
	cipherText = aesgcm.Seal(cipherText, iv, []byte(plaintext), nil)

	return cipherText, nil
	//return base64.RawStdEncoding.EncodeToString(cipherText), nil
}

func EncryptToBase64(plaintext string, passphrase string) (encrypted string, err error) {
	cipherText, err := Encrypt(plaintext, passphrase)
	if err != nil {
		return
	}
	return base64.RawStdEncoding.EncodeToString(cipherText), nil
}

func Decrypt(cipherText []byte, passphrase string) (decoded string, err error) {

	if len(cipherText) == 0 {
		return
	}

	//IF the length of the cipherText is less than salt size and block size:
	if len(cipherText) < SALT_SIZE+aes.BlockSize {
		err = errors.New("ciphertext block size is too short")
		return
	}

	salt := cipherText[:SALT_SIZE]
	iv := cipherText[SALT_SIZE : SALT_SIZE+aes.BlockSize]
	encrypted := cipherText[SALT_SIZE+aes.BlockSize:]

	//Create a new AES cipher with the key and encrypted message
	key := pbkdf2.Key([]byte(passphrase), salt, PBKDF2_ITERATIONS, 32, sha512.New)
	block, err := aes.NewCipher(key)

	//IF NewCipher failed, exit:
	if err != nil {
		return
	}

	//Decrypt the message
	aesgcm, _ := cipher.NewGCMWithNonceSize(block, aes.BlockSize)
	decrypted, _ := aesgcm.Open(nil, iv, encrypted, nil)

	return string(decrypted), err
}

func DecryptFromBase64(secure string, passphrase string) (decoded string, err error) {
	//Remove base64 encoding:
	cipherText, err := base64.RawStdEncoding.DecodeString(secure)

	//IF DecodeString failed, exit:
	if err != nil {
		return
	}

	return Decrypt(cipherText, passphrase)
}
