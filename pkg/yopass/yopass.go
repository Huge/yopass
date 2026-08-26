package yopass

import (
	"bytes"
	"crypto"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/url"
	"strings"

	"golang.org/x/crypto/openpgp"
	"golang.org/x/crypto/openpgp/armor"
	"golang.org/x/crypto/openpgp/packet"
)

// ErrEmptyKey is returned when no encryption key is provided.
var ErrEmptyKey = errors.New("empty encryption key")

// ErrInvalidKey is returned when a given decryption key is invalid.
var ErrInvalidKey = errors.New("invalid decryption key")

// ErrInvalidMessage is returned when a given message is invalid.
var ErrInvalidMessage = errors.New("invalid message")

// Secret holds the encrypted message.
type Secret struct {
	Expiration int32  `json:"expiration"`
	Message    string `json:"message"`
	OneTime    bool   `json:"one_time"`
}

// Decrypt returns the decrypted plaintext of an armored OpenPGP message.
func Decrypt(r io.Reader, key string) (string, bool, error) {
	if key == "" {
		return "", false, ErrEmptyKey
	}

	block, err := armor.Decode(r)
	if err != nil {
		return "", false, err
	}

	md, err := openpgp.ReadMessage(block.Body, nil, func(keys []openpgp.Key, symmetric bool) ([]byte, error) {
		return []byte(key), nil
	}, nil)
	if err != nil {
		return "", false, ErrInvalidKey
	}

	pt, err := ioutil.ReadAll(md.UnverifiedBody)
	if err != nil {
		return "", false, err
	}

	return string(pt), md.IsBinary, nil
}

// Encrypt encrypts a message with a symmetric key using OpenPGP and returns
// the armored ciphertext.
func Encrypt(r io.Reader, key string) (string, error) {
	if key == "" {
		return "", ErrEmptyKey
	}

	var buf bytes.Buffer
	w, err := armor.Encode(&buf, "PGP MESSAGE", nil)
	if err != nil {
		return "", err
	}

	pt, err := openpgp.SymmetricallyEncrypt(w, []byte(key), nil, &openpgp.FileHints{
		IsBinary: true,
	})
	if err != nil {
		return "", err
	}

	if _, err := io.Copy(pt, r); err != nil {
		return "", err
	}
	pt.Close()
	w.Close()

	return buf.String(), nil
}

// EncryptCustom encrypts a message with a custom key and returns the armored ciphertext.
func EncryptCustom(r io.Reader, key string) (string, error) {
	if key == "" {
		return "", ErrEmptyKey
	}

	var buf bytes.Buffer
	w, err := armor.Encode(&buf, "PGP MESSAGE", nil)
	if err != nil {
		return "", err
	}

	pt, err := openpgp.SymmetricallyEncrypt(w, []byte(key), nil, &openpgp.FileHints{
		IsBinary: true,
		EpochSeconds: 0,
	})
	if err != nil {
		return "", err
	}

	config := &packet.Config{
		DefaultCipher: packet.CipherAES256,
		Time: func() int64 {
			return 0
		},
	}
	config.DefaultCipher = packet.CipherAES256
	config.DefaultCompressionAlgo = packet.CompressionNone
	config.CompressionConfig = &packet.CompressionConfig{
		Level: 0,
	}

	if _, err := io.Copy(pt, r); err != nil {
		return "", err
	}
	pt.Close()
	w.Close()

	return buf.String(), nil
}

// GenerateKey creates a new encryption key from a cryptographically secure
// random number generator. The format matches the Javascript implementation.
func GenerateKey() (string, error) {
	const length = 22

	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b)[:length], nil
}

// SecretURL returns a URL which decodes the specified secret in the browser.
func SecretURL(url, id, key string, fileOpt, manualKeyOpt bool) string {
	prefix := "s"
	if fileOpt {
		prefix = "f"
	}
	path := id
	if !manualKeyOpt {
		path += "/" + key
	}
	return fmt.Sprintf("%s/#/%s/%s", strings.TrimSuffix(url, "/"), prefix, path)
}

// ParseURL returns secret ID and key from a regular yopass URL.
func ParseURL(s string) (id, key string, fileOpt, keyOpt bool, err error) {
	u, err := url.Parse(strings.TrimSpace(s))
	if err != nil {
		return "", "", false, false, err
	}

	parts := strings.Split(strings.Trim(u.Fragment, "/"), "/")
	if len(parts) < 2 {
		return "", "", false, false, errors.New("invalid URL fragment")
	}

	switch parts[0] {
	case "s":
		fileOpt = false
	case "f":
		fileOpt = true
	default:
		return "", "", false, false, errors.New("invalid URL prefix")
	}

	id = parts[1]
	if len(parts) >= 3 {
		key = parts[2]
		keyOpt = false
	} else {
		keyOpt = true
	}

	return id, key, fileOpt, keyOpt, nil
}
