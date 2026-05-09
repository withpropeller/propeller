package helpers

import (
	"log"
	"testing"
)

func TestEncrypt(t *testing.T) {
	tests := []struct {
		secret   string
		expected bool
	}{
		{
			"hello some secret",
			true,
		},
	}
	passphrase := "somesecretpassphrase"
	for _, test := range tests {
		t.Run(test.secret, func(t *testing.T) {
			_, err := Encrypt(test.secret, passphrase)
			if err != nil {
				t.Fail()
			}
		})
	}
}

func TestDecrypt(t *testing.T) {
	tests := []struct {
		secret    string
		encrypted string
		expected  bool
	}{
		{
			"hello some secret",
			"h0HT2HmdfhVg3wT+CoE5TIqrhoxu4Y7J8HTFSzZt0NE1H8cYJa91AY2Xh9II3hD9kcoMpLi68wPFPTo5Njlo/emhhmsnZ7MxkOCEAdJZBC3Io1gCxmOs7WlT0kvZDc1p0U2rzNq9V1uFw6gRGqQbKMU",
			true,
		},
	}
	passphrase := "somesecretpassphrase"
	for _, test := range tests {
		t.Run(test.secret, func(t *testing.T) {

			decrypted, err := DecryptFromBase64(test.encrypted, passphrase)
			if err != nil {
				log.Printf("error decrypting %s.", test.secret)
				t.Fail()
			}

			if (decrypted == test.secret) != test.expected {
				t.Fail()
			}

		})
	}
}
