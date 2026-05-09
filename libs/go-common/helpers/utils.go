package helpers

import (
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	mathRand "math/rand"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"crypto/hmac"
	"crypto/sha512"
	"encoding/base64"
	"log"

	"github.com/btcsuite/btcd/btcutil/base58"
	"github.com/google/uuid"
	"github.com/leekchan/accounting"
	gonanoid "github.com/matoous/go-nanoid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/text/currency"
	"google.golang.org/protobuf/types/known/structpb"
)

var (
	MODEL_PREFIX_SEPARATOR = "."
)

func MapFn[T, V any](ts []T, fn func(T) V) []V {
	result := make([]V, len(ts))
	for i, t := range ts {
		result[i] = fn(t)
	}
	return result
}

func FilterFunc[E any](s []E, f func(E) bool) *[]E {
	filtered := make([]E, 0)
	for i, v := range s {
		if f(v) {
			filtered = append(filtered, s[i])
		}
	}
	return &filtered
}

// CAUTION: MapValues returns values in random order
func MapValues[T any](record map[string]T) []T {
	values := []T{}
	for _, value := range record {
		values = append(values, value)
	}
	return values
}

func MapPtrValues[T any](record map[string]*T) []T {
	values := []T{}
	for _, value := range record {
		if value != nil {
			values = append(values, *value)
		}
	}
	return values
}

func MapKeys[T comparable, V any](record map[T]V) []T {
	keys := []T{}
	for key := range record {
		keys = append(keys, key)
	}
	return keys
}

func MergeMaps[T any](maps ...map[string]T) map[string]T {
	result := make(map[string]T)
	for _, m := range maps {
		for k, v := range m {
			result[k] = v
		}
	}
	return result
}

func MergeBsonMaps(maps ...bson.M) bson.M {
	result := bson.M{}
	for _, m := range maps {
		for k, v := range m {
			result[k] = v
		}
	}
	return result
}

func StrToObjectIds(ids []string) []primitive.ObjectID {
	return MapFn(ids, func(v string) primitive.ObjectID {
		objectId, _ := primitive.ObjectIDFromHex(v)
		return objectId
	})
}

func FailOnError(err error, msg string) {
	if err != nil {
		log.Panicf("%s: %s", msg, err)
	}
}

func RandomString(length int32) string {
	token := make([]byte, length/2)
	rand.Read(token)
	return hex.EncodeToString(token)
}

func HmacHash(key string, secret string) string {
	h := hmac.New(sha512.New, []byte(key))
	h.Write([]byte(secret))
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}

func HmacHash256(key string, secret string) string {
	h := hmac.New(sha256.New, []byte(key))
	h.Write([]byte(secret))
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}

func Hash(secret string) string {
	h := sha512.New()
	h.Write([]byte(secret))
	return hex.EncodeToString(h.Sum(nil))
}

func Hash1(secret string, encoding ...string) string {
	h := sha1.New()
	h.Write([]byte(secret))

	if len(encoding) > 0 && encoding[0] == "hex" {
		return hex.EncodeToString(h.Sum(nil))
	}
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}

func Hash256(secret string, encoding ...string) string {
	h := sha256.New()
	h.Write([]byte(secret))

	if len(encoding) > 0 && encoding[0] == "hex" {
		return hex.EncodeToString(h.Sum(nil))
	}
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}

func Hash512(secret string, encoding ...string) string {
	h := sha512.New()
	h.Write([]byte(secret))

	if len(encoding) > 0 && encoding[0] == "hex" {
		return hex.EncodeToString(h.Sum(nil))
	}
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}

func HmacHashHex(key string, secret string) string {
	h := hmac.New(sha512.New, []byte(key))
	h.Write([]byte(secret))
	return hex.EncodeToString(h.Sum(nil))
}

func SortMapKeys(entity map[string]interface{}) map[string]interface{} {
	var keys []string
	for k := range entity {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	sorted := make(map[string]interface{})
	for _, k := range keys {
		sorted[k] = entity[k]
	}

	return sorted
}

func GenerateUniqueReferenceId(rawAlphabet ...string) string {
	alphanumeric := "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	if len(rawAlphabet) > 0 {
		alphanumeric = rawAlphabet[0]
	}
	return GenerateRandomReference(alphanumeric, 12)
}

func GenerateRandomBytes(length int, encoding ...string) string {
	bytes := make([]byte, length)
	rand.Read(bytes)

	if len(encoding) > 0 && encoding[0] == "hex" {
		return hex.EncodeToString(bytes)[:length]
	}

	return base64.StdEncoding.EncodeToString(bytes)[:length]
}

func GenerateRandomReference(rawAlphabet string, size int, prefix ...string) string {
	id, _ := gonanoid.Generate(rawAlphabet, size)

	if len(prefix) > 0 {
		return prefix[0] + "-" + id
	}

	return id
}

func GenerateUUID() string {
	return uuid.New().String()
}

// FindFunc returns the first index i satisfying f(s[i]),
// or -1 if none do.
func FindFunc[E any](s []E, f func(E) bool) *E {
	for i, v := range s {
		if f(v) {
			return &s[i]
		}
	}
	return nil
}

func ParseCurrencyToFloat64(str string) float64 {

	reg := regexp.MustCompile("[^0-9.-]+")
	str = reg.ReplaceAllString(str, "")

	if str == "" {
		return 0
	}

	f, err := strconv.ParseFloat(str, 64)
	if err != nil {
		panic(err)
	}
	return f
}

func StructpbToStruct(v *structpb.Struct, obj interface{}) error {
	structValue := structpb.NewStructValue(v)

	data, err := json.Marshal(structValue.GetStructValue().AsMap()) // Convert to a json string

	if err != nil {
		return nil
	}

	return json.Unmarshal(data, &obj) // Convert to a map
}

// https://installmd.com/c/72/go/convert-interface-to-int64
func InterfaceToInt64(i interface{}) (int64, error) {

	switch v := i.(type) {
	case int64:
		return v, nil
	case int:
		return int64(v), nil
	case int32:
		return int64(v), nil
	case string:
		return strconv.ParseInt(v, 10, 64)
	default:
		return 0, errors.New("type error")
	}
}

// https://stackoverflow.com/a/70802740/3335054
func SliceContains[T comparable](s []T, e T) bool {
	for _, v := range s {
		if v == e {
			return true
		}
	}
	return false
}

// https://stackoverflow.com/a/67152714/3335054
func SanitizeString(str string) string {
	re := regexp.MustCompile(`\s+`)
	return strings.TrimSpace(re.ReplaceAllString(str, " "))
}

// Converts a struct to a map while maintaining the json alias as keys
func StructToMap(obj interface{}) (newMap map[string]interface{}, err error) {
	data, err := json.Marshal(obj) // Convert to a json string

	if err != nil {
		return
	}

	err = json.Unmarshal(data, &newMap) // Convert to a map
	return
}

func StructToStructpb(obj interface{}) (*structpb.Struct, error) {
	json_map, _ := StructToMap(obj)
	data, err := structpb.NewStruct(json_map)

	if err != nil {
		return nil, err
	}

	return data, nil
}

func ToSlug(str string) string {
	str = strings.ToLower(str)
	// Make a Regex to say we only want letters and numbers
	reg, _ := regexp.Compile("[^a-zA-Z0-9]+")
	return reg.ReplaceAllString(str, "-")
}

func JSONToStruct(content string, obj interface{}) error {
	return json.Unmarshal([]byte(content), &obj)
}

func JSONToMap(content string) (*Map, error) {
	var result Map
	err := json.Unmarshal([]byte(content), &result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func JSONToMapS(content string) (MapS, error) {
	var result MapS
	err := json.Unmarshal([]byte(content), &result)
	return result, err
}

func StrToObjectId(id string) primitive.ObjectID {
	objectId, _ := primitive.ObjectIDFromHex(id)
	return objectId

}

func StructToJSON(s interface{}) *string {
	b, err := json.Marshal(s)
	if err != nil {
		return nil
	}
	var str = string(b)
	return &str
}

func MapToStruct(content interface{}, obj interface{}) error {
	dbByte, _ := json.Marshal(content)
	return json.Unmarshal(dbByte, &obj)
}

func MapToPretty(v interface{}) string {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return ""
	}
	return string(b)
}

func PrettyPrint(v ...interface{}) {
	prints := CapturePrettyPrint(v...)
	fmt.Println(prints...)
}

func CapturePrettyPrint(v ...interface{}) []any {
	prints := []any{}
	for _, value := range v {
		// if v is a string then print it directly
		if str, ok := value.(string); ok {
			prints = append(prints, str)
			continue
		}

		if str, ok := value.(*string); ok {
			prints = append(prints, *str)
			continue
		}

		if intValue, ok := value.(int); ok {
			prints = append(prints, strconv.Itoa(intValue))
			continue
		}

		if intValue, ok := value.(*int); ok {
			prints = append(prints, strconv.Itoa(*intValue))
			continue
		}

		if intValue, ok := value.(int64); ok {
			prints = append(prints, strconv.FormatInt(intValue, 10))
			continue
		}

		if intValue, ok := value.(*int64); ok {
			prints = append(prints, strconv.FormatInt(*intValue, 10))
			continue
		}

		if floatValue, ok := value.(float64); ok {
			prints = append(prints, strconv.FormatFloat(floatValue, 'f', -1, 64))
			continue
		}

		if floatValue, ok := value.(*float64); ok {
			prints = append(prints, strconv.FormatFloat(*floatValue, 'f', -1, 64))
			continue
		}

		// default to pretty print
		prints = append(prints, MapToPretty(value))
	}

	return prints
}

// https://freshman.tech/snippets/go/split-slice-into-chunks/
func ChunkSlice(slice []interface{}, chunkSize int) [][]interface{} {
	var chunks [][]interface{}
	for {
		if len(slice) == 0 {
			break
		}

		// necessary check to avoid slicing beyond
		// slice capacity
		if len(slice) < chunkSize {
			chunkSize = len(slice)
		}

		chunks = append(chunks, slice[0:chunkSize])
		slice = slice[chunkSize:]
	}

	return chunks
}

func Base58Encode(input []byte) string {
	encode := base58.Encode(input)
	return encode
}

func Base58Decode(input string) []byte {
	decode := base58.Decode(input)
	return decode
}

func Base58EncodeString(input string) string {
	return Base58Encode([]byte(input))
}

func Base58DecodeString(input string) string {
	return string(Base58Decode(input))
}

func Base58EncodeFromHex(input string) (*string, error) {
	data, err := hex.DecodeString(input)
	if err != nil {
		return nil, err
	}

	encoded := Base58Encode(data)
	return &encoded, nil
}

func Base58DecodeToHex(input string) (*string, error) {
	data := Base58Decode(input)
	decoded := hex.EncodeToString(data)
	return &decoded, nil
}

func TagMongoId(tag TypeModelIdTag, id primitive.ObjectID) string {
	encoded, _ := Base58EncodeFromHex(id.Hex())
	return string(tag) + MODEL_PREFIX_SEPARATOR + *encoded
}

func TagHexId(tag TypeModelIdTag, id string) string {
	encoded, _ := Base58EncodeFromHex(id)
	return string(tag) + MODEL_PREFIX_SEPARATOR + *encoded
}

func TagId(tag TypeModelIdTag, id string) string {
	return string(tag) + MODEL_PREFIX_SEPARATOR + id
}

func IsStatusCodeSuccess(statusCode int) bool {
	return IsStatusCodeRange(statusCode, 200, 299)
}

func IsStatusCodeRange(statusCode int, min int, max int) bool {
	return statusCode >= min && statusCode <= max
}

func TagIdToHex(tagId string) (*string, error) {

	split := strings.Split(tagId, MODEL_PREFIX_SEPARATOR)
	var id string
	if len(split) == 2 {
		id = split[1]
	} else if len(split) == 3 {
		id = split[2]
	} else {
		return nil, errors.New("invalid tag id")
	}

	hex, err := Base58DecodeToHex(id)
	if err != nil {
		return nil, err
	}

	return hex, nil
}

func TagIdToMongoId(id string) (*primitive.ObjectID, error) {
	hex, err := TagIdToHex(id)
	if err != nil {
		return nil, err
	}

	objectId, err := primitive.ObjectIDFromHex(*hex)
	if err != nil {
		return nil, err
	}

	return &objectId, nil
}

func GetModelFromTagId(tagId string) (string, error) {
	split := strings.Split(tagId, MODEL_PREFIX_SEPARATOR)
	var tag string
	if len(split) == 2 {
		tag = split[0]
	} else if len(split) == 3 {
		tag = split[0] + MODEL_PREFIX_SEPARATOR + split[1]
	} else {
		return "", errors.New("invalid tag id")
	}

	return TagModelMap[tag], nil
}

func ParseStreamIdToUTC(id string) (*time.Time, error) {
	split := strings.Split(id, "-")
	if len(split) != 2 {
		return nil, errors.New("invalid stream id")
	}

	i, err := strconv.ParseInt(split[0], 10, 64)
	t := time.UnixMilli(i)
	if err != nil {
		return nil, err
	}

	return &t, nil
}

func UniqueSlice[T any](slice []T) []T {
	keys := make(map[any]bool)
	list := []T{}
	for _, entry := range slice {
		if _, value := keys[entry]; !value {
			keys[entry] = true
			list = append(list, entry)
		}
	}
	return list
}

func Flat[T any](slice [][]T) []T {
	flattened := []T{}
	for _, entry := range slice {
		flattened = append(flattened, entry...)
	}
	return flattened
}

// https://stackoverflow.com/a/53878478/3335054
func flattenSliceDeep(args []any, v interface{}) []interface{} {
	if s, ok := v.([]interface{}); ok {
		for _, v := range s {
			args = flattenSliceDeep(args, v)
		}
	} else {
		args = append(args, v)
	}
	return args
}

func FlatDeep(v ...interface{}) []interface{} {
	return flattenSliceDeep(nil, v)
}

func Filter[E any](s []E, f func(E) bool) []E {
	filtered := make([]E, 0)
	for i, v := range s {
		if f(v) {
			filtered = append(filtered, s[i])
		}
	}
	return filtered
}

func Reduce[T any, E any](s []T, fn func(E, T) E, initial E) E {
	result := initial
	for _, v := range s {
		result = fn(result, v)
	}
	return result
}

// FindFunc returns the first index i satisfying f(s[i]),
// or -1 if none do.
func Find[E any](s []E, f func(E) bool) *E {
	for i, v := range s {
		if f(v) {
			return &s[i]
		}
	}
	return nil
}

func ForEach[T any](ts []T, fn func(T)) {
	for _, t := range ts {
		fn(t)
	}
}

func FormatMoney(currency string, amount int64) string {
	currencySymbol := GetCurrencySymbol(currency)
	ac := accounting.DefaultAccounting(currencySymbol, 2)

	return ac.FormatMoneyFloat64(float64(amount) / 100)
}

func FormatMoneyFloat64(currency string, amount float64) string {
	currencySymbol := GetCurrencySymbol(currency)
	ac := accounting.DefaultAccounting(currencySymbol, 2)

	return ac.FormatMoneyFloat64(amount / 100)
}

func FormatNumber(amount int64) string {
	return accounting.FormatNumberFloat64(float64(amount), 0, ",", ".")
}

func FormatNumberFloat64(amount float64) string {
	formatted := accounting.FormatNumberFloat64(amount, 2, ",", ".")
	if strings.Contains(formatted, ".") {
		formatted = strings.TrimRight(formatted, "0")
		formatted = strings.TrimRight(formatted, ".")
	}
	return formatted
}

// GetCurrencyDecimalPlaces returns the number of decimal places for a currency
// using the official golang.org/x/text/currency package.
// Defaults to 2 if currency is not recognized.
func GetCurrencyDecimalPlaces(currencyCode string) int {
	if currencyCode == "" {
		return 2 // Default to 2 decimal places
	}

	unit, err := currency.ParseISO(currencyCode)
	if err != nil {
		return 2 // Default to 2 decimal places if currency is invalid
	}

	// Get the number of decimal digits for this currency
	// Rounding returns (scale, increment) where scale is the number of fractional decimals
	// For example: USD returns scale=2, JPY returns scale=0, KWD returns scale=3
	scale, _ := currency.Cash.Rounding(unit)

	return scale
}

// FormatMoneyToInt64 converts a money string (e.g., "10.50") to the smallest currency unit as int64.
// Uses string parsing to avoid floating-point precision issues.
// Uses currency-specific decimal places (JPY=0, USD=2, KWD=3, etc).
// Handles amounts with or without decimals, and properly handles negative values.
func FormatMoneyToInt64(amountStr string) (int64, error) {
	return FormatMoneyToInt64WithCurrency("", amountStr)
}

// FormatMoneyToInt64WithCurrency converts a money string to the smallest currency unit as int64,
// with currency-specific decimal place handling.
func FormatMoneyToInt64WithCurrency(currencyCode string, amountStr string) (int64, error) {
	amountStr = strings.TrimSpace(amountStr)
	if amountStr == "" {
		return 0, errors.New("amount string cannot be empty")
	}

	// Handle negative sign
	isNegative := strings.HasPrefix(amountStr, "-")
	if isNegative {
		amountStr = amountStr[1:]
	}

	// Split by decimal point
	parts := strings.Split(amountStr, ".")
	if len(parts) > 2 {
		return 0, errors.New("invalid amount format: multiple decimal points")
	}

	// Parse integer part
	intPart, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		return 0, err
	}

	// Get currency-specific decimal places
	decimalPlaces := GetCurrencyDecimalPlaces(currencyCode)
	multiplier := int64(1)
	for i := 0; i < decimalPlaces; i++ {
		multiplier *= 10
	}

	result := intPart * multiplier

	// Handle decimal part if present
	if len(parts) == 2 && decimalPlaces > 0 {
		decimalStr := parts[1]

		// Normalize to currency's decimal places (pad or truncate)
		if len(decimalStr) > decimalPlaces {
			decimalStr = decimalStr[:decimalPlaces]
		} else if len(decimalStr) < decimalPlaces {
			decimalStr += strings.Repeat("0", decimalPlaces-len(decimalStr))
		}

		if decimalStr != "" {
			decVal, err := strconv.ParseInt(decimalStr, 10, 64)
			if err != nil {
				return 0, err
			}
			result += decVal
		}
	}

	if isNegative {
		result = -result
	}

	return result, nil
}

func GetCurrencySymbol(currency string) string {
	if currency == "NGN" {
		return "₦"
	}
	if currency == "USD" {
		return "$"
	}
	if currency == "EUR" {
		return "€"
	}
	if currency == "GBP" {
		return "£"
	}
	if currency == "JPY" {
		return "¥"
	}
	if currency == "CNY" {
		return "¥"
	}

	return currency
}

func Ternary[T any](condition bool, trueVal T, falseVal T) T {
	if condition {
		return trueVal
	}
	return falseVal
}

func TernaryFn[T any](condition bool, trueVal T, Else func() T) T {
	if condition {
		return trueVal
	}
	return Else()
}

// NilTernary is a generic function that returns a value based on a condition.
func NilTernary[T any](value *T, trueVal T) T {
	if value == nil {
		return trueVal
	}
	return *value
}

// NilTernaryFn is a generic function that returns a value based on a condition.
func NilTernaryFn[T any](value *T, Else func() T) T {
	if value == nil {
		return Else()
	}
	return *value
}

func JoinStringsByColon(s ...string) string {
	nonEmpty := Filter(s, func(str string) bool {
		return str != ""
	})

	return strings.Join(nonEmpty, ":")
}

func Ptr[T any](v T) *T {
	return &v
}

func UnpackArgs[T any](args []T) *T {
	if len(args) == 0 {
		return nil
	}
	return &args[0]
}

func IsNumberString(str string) bool {
	_, err := strconv.ParseFloat(str, 64)
	return err == nil
}

// generate a random number as string of the provided length
func RandomNumberStringd(length int) string {
	return GenerateRandomReference("0123456789", length)
}

func RandomNumberString(length int) string {
	mathRand.NewSource(time.Now().UnixNano())

	var s strings.Builder
	for i := 0; i < length; i++ {
		s.WriteString(strconv.Itoa(mathRand.Intn(10)))
	}

	return s.String()
}

func UtcToZonedTime(t time.Time, tz string) *time.Time {
	// Specify desired time zone location
	location, err := time.LoadLocation(tz) // Replace with your desired zone
	if err != nil {
		return nil
	}

	utcTime := t.UTC()
	zonedTime := utcTime.In(location)

	return &zonedTime
}

func ZonedTimeToUtc(t time.Time, tz string) *time.Time {
	// Specify desired time zone location
	location, err := time.LoadLocation(tz) // Replace with your desired zone
	if err != nil {
		return nil
	}

	zonedTime := t
	// Convert UTC time to zoned time
	utcTime := zonedTime.In(location).UTC()

	return &utcTime
}

// First returns a pointer to the first element in the slice.
func First[T any](s []T) *T {
	if len(s) == 0 {
		return nil
	}
	return &s[0]
}

// Last returns a pointer to the last element in the slice.
func Last[T any](s []T) *T {
	if len(s) == 0 {
		return nil
	}
	return &s[len(s)-1]
}

func RedactMapKeys(data map[string]interface{}, spaceSeparatedKeys string, redactedValue ...string) map[string]interface{} {
	if len(redactedValue) == 0 {
		redactedValue = append(redactedValue, "*****")
	}

	keys := strings.Split(spaceSeparatedKeys, " ")
	for _, key := range keys {
		data[key] = redactedValue[0]
	}

	return data
}

func SplitBy(s string, sep string, index int) *string {
	parts := strings.Split(s, sep)
	if len(parts) > index {
		return &parts[index]
	}
	return nil
}

func MapSToMap(mapS MapS) Map {
	result := make(Map)
	for key, value := range mapS {
		result[key] = value
	}
	return result
}

func AbsInt64(x int64) int64 {
	if x < 0 {
		return -x
	}
	return x
}

func ToCamelCase(str string) string {
	return toCamelInitCase(str, false)
}

func ToPascalCase(str string) string {
	return toCamelInitCase(str, true)
}

// toCamelInitCase converts a given string to camel case or Pascal case based on the initCase parameter.
// It trims any leading or trailing whitespace from the input string and processes each character to
// determine if it should be capitalized or not.
//
// Parameters:
//   - s: The input string to be converted.
//   - initCase: A boolean flag indicating whether to use Pascal case (true) or camel case (false).
//
// Returns:
//
//	A string converted to camel case or Pascal case based on the initCase parameter.
//
// Example:
//
//	toCamelInitCase("hello_world", true)  // returns "HelloWorld"
//	toCamelInitCase("hello_world", false) // returns "helloWorld"
func toCamelInitCase(s string, initCase bool) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return s
	}

	n := strings.Builder{}
	n.Grow(len(s))
	capNext := initCase
	prevIsCap := false
	for i, v := range []byte(s) {
		vIsCap := v >= 'A' && v <= 'Z'
		vIsLow := v >= 'a' && v <= 'z'
		if capNext {
			if vIsLow {
				v += 'A'
				v -= 'a'
			}
		} else if i == 0 {
			if vIsCap {
				v += 'a'
				v -= 'A'
			}
		} else if prevIsCap && vIsCap {
			v += 'a'
			v -= 'A'
		}
		prevIsCap = vIsCap

		if vIsCap || vIsLow {
			n.WriteByte(v)
			capNext = false
		} else if vIsNum := v >= '0' && v <= '9'; vIsNum {
			n.WriteByte(v)
			capNext = true
		} else {
			capNext = v == '_' || v == ' ' || v == '-' || v == '.'
		}
	}
	return n.String()
}
