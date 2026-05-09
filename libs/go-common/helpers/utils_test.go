package helpers

import (
	"fmt"
	"log"
	"reflect"
	"sort"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestBase58EncodeObjectId(t *testing.T) {
	tests := []struct {
		decoded  string
		encoded  string
		expectOK bool
	}{
		{"63f1697c033cacea7265408a", "2tPYLVkys3d6aXRQM", true},
	}
	for _, tt := range tests {
		t.Run(tt.decoded, func(t *testing.T) {
			encoded, er := Base58EncodeFromHex(tt.decoded)
			if er != nil {
				log.Println("error: ", er)
				t.Fail()
				return
			}
			decoded, _ := Base58DecodeToHex(*encoded)
			if *decoded != tt.decoded {
				if tt.expectOK {
					log.Printf("Expected success but decoded not equal to original  for %s.", tt.decoded)
					t.Fail()
				}
			}
		})
	}
}

func TestReduceInt(t *testing.T) {
	tests := []struct {
		s        []int
		fn       func(int, int) int
		initial  int
		expected int
	}{
		{[]int{1, 2, 3, 4, 5}, func(acc, val int) int { return acc + val }, 0, 15},
		{[]int{1, 2, 3, 4, 5}, func(acc, val int) int { return acc * val }, 1, 120},
		{[]int{1, 2, 3, 4, 5}, func(acc, val int) int { return acc - val }, 0, -15},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			result := Reduce(tt.s, tt.fn, tt.initial)
			if result != tt.expected {
				log.Printf("Expected %d but got %d for input %v.", tt.expected, result, tt.s)
				t.Fail()
			}
		})
	}
}

func TestReduceMap(t *testing.T) {
	tests := []struct {
		s        []map[string]int
		fn       func(int, map[string]int) int
		initial  int
		expected int
	}{
		{[]map[string]int{{"key": 1}, {"key": 2}, {"key": 3}, {"key": 4}, {"key": 5}}, func(acc int, val map[string]int) int { return acc + val["key"] }, 0, 15},
		{[]map[string]int{{"key": 1}, {"key": 2}, {"key": 3}, {"key": 4}, {"key": 5}}, func(acc int, val map[string]int) int { return acc * val["key"] }, 1, 120},
		{[]map[string]int{{"key": 1}, {"key": 2}, {"key": 3}, {"key": 4}, {"key": 5}}, func(acc int, val map[string]int) int { return acc - val["key"] }, 0, -15},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			result := Reduce(tt.s, tt.fn, tt.initial)
			if result != tt.expected {
				log.Printf("Expected %d but got %d for input %v.", tt.expected, result, tt.s)
				t.Fail()
			}
		})
	}
}

func TestMapFn(t *testing.T) {
	tests := []struct {
		input    []int
		fn       func(int) int
		expected []int
	}{
		{[]int{1, 2, 3, 4, 5}, func(x int) int { return x * 2 }, []int{2, 4, 6, 8, 10}},
		{[]int{1, 2, 3, 4, 5}, func(x int) int { return x + 1 }, []int{2, 3, 4, 5, 6}},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			result := MapFn(tt.input, tt.fn)
			if !reflect.DeepEqual(result, tt.expected) {
				log.Printf("Expected %v but got %v for input %v.", tt.expected, result, tt.input)
				t.Fail()
			}
		})
	}
}

func TestFilterFunc(t *testing.T) {
	tests := []struct {
		input    []int
		fn       func(int) bool
		expected []int
	}{
		{[]int{1, 2, 3, 4, 5}, func(x int) bool { return x%2 == 0 }, []int{2, 4}},
		{[]int{1, 2, 3, 4, 5}, func(x int) bool { return x > 3 }, []int{4, 5}},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			result := FilterFunc(tt.input, tt.fn)
			if !reflect.DeepEqual(*result, tt.expected) {
				log.Printf("Expected %v but got %v for input %v.", tt.expected, *result, tt.input)
				t.Fail()
			}
		})
	}
}

func TestMapValues(t *testing.T) {
	tests := []struct {
		input    map[string]int
		expected []int
	}{
		{map[string]int{"a": 1, "b": 2, "c": 3}, []int{1, 2, 3}},
		{map[string]int{"x": 10, "y": 20, "z": 30}, []int{10, 20, 30}},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			result := MapValues(tt.input)
			// Sort both slices since map iteration order is random
			sort.Ints(result)
			expected := make([]int, len(tt.expected))
			copy(expected, tt.expected)
			sort.Ints(expected)

			if !reflect.DeepEqual(result, expected) {
				log.Printf("Expected %v but got %v for input %v.", expected, result, tt.input)
				t.Fail()
			}
		})
	}
}
func TestNilTernary(t *testing.T) {
	tests := []struct {
		value    *int
		trueVal  int
		expected int
	}{
		{nil, 10, 10},
		{new(int), 20, 0},
		{new(int), 30, 0},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			result := NilTernary(tt.value, tt.trueVal)
			if result != tt.expected {
				log.Printf("Expected %d but got %d for value %v and trueVal %d.", tt.expected, result, tt.value, tt.trueVal)
				t.Fail()
			}
		})
	}
}

func TestNilTernaryFn(t *testing.T) {
	tests := []struct {
		value    *int
		elseFunc func() int
		expected int
	}{
		{nil, func() int { return 10 }, 10},
		{new(int), func() int { return 20 }, 00},
		{new(int), func() int { return 30 }, 0},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			result := NilTernaryFn(tt.value, tt.elseFunc)
			if result != tt.expected {
				log.Printf("Expected %d but got %d for value %v and elseFunc %v.", tt.expected, result, tt.value, tt.elseFunc())
				t.Fail()
			}
		})
	}
}

func TestGetCurrencySymbol(t *testing.T) {
	tests := []struct {
		currency string
		expected string
	}{
		{"NGN", "₦"},
		{"USD", "$"},
		{"EUR", "€"},
		{"GBP", "£"},
		{"JPY", "¥"},
		{"CNY", "¥"},
		{"INR", "INR"}, // Add more test cases if needed
	}

	for _, tt := range tests {
		t.Run(tt.currency, func(t *testing.T) {
			result := GetCurrencySymbol(tt.currency)
			if result != tt.expected {
				t.Errorf("Expected %s but got %s for currency %s.", tt.expected, result, tt.currency)
			}
		})
	}
}
func TestFormatMoney(t *testing.T) {
	tests := []struct {
		currency string
		amount   int64
		expected string
	}{
		{"NGN", 10000, "₦100.00"},
		{"USD", 5000, "$50.00"},
		{"USD", 1, "$0.01"},
		{"EUR", 2500, "€25.00"},
		{"GBP", 7500, "£75.00"},
		{"JPY", 12000, "¥120.00"},
		{"CNY", 8000, "¥80.00"},
		{"INR", 15000, "INR150.00"}, // Add more test cases if needed
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("%s_%d", tt.currency, tt.amount), func(t *testing.T) {
			result := FormatMoney(tt.currency, tt.amount)
			if result != tt.expected {
				t.Errorf("Expected %s but got %s for currency %s and amount %d.", tt.expected, result, tt.currency, tt.amount)
			}
		})
	}
}
func TestFormatNumber(t *testing.T) {
	tests := []struct {
		amount   int64
		expected string
	}{
		{10000, "10,000"},
		{5000, "5,000"},
		{2500, "2,500"},
		{7500, "7,500"},
		{12000, "12,000"},
		{8000, "8,000"},
		{15000, "15,000"},
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("%d", tt.amount), func(t *testing.T) {
			result := FormatNumber(tt.amount)
			if result != tt.expected {
				t.Errorf("Expected %s but got %s for amount %d.", tt.expected, result, tt.amount)
			}
		})
	}
}
func TestFormatMoneyFloat64(t *testing.T) {
	tests := []struct {
		currency string
		amount   float64
		expected string
	}{
		{"NGN", 10000, "₦100.00"},
		{"USD", 5000, "$50.00"},
		{"USD", 0.5, "$0.01"}, // $0.005 is rounded to $0.01
		{"USD", 0.4, "$0.00"}, // $0.004 is rounded to $0.00
		{"EUR", 2500, "€25.00"},
		{"GBP", 7500, "£75.00"},
		{"JPY", 12000, "¥120.00"},
		{"CNY", 8000, "¥80.00"},
		{"INR", 15000, "INR150.00"}, // Add more test cases if needed
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("%s_%f", tt.currency, tt.amount), func(t *testing.T) {
			result := FormatMoneyFloat64(tt.currency, tt.amount)
			if result != tt.expected {
				t.Errorf("Expected %s but got %s for currency %s and amount %f.", tt.expected, result, tt.currency, tt.amount)
			}
		})
	}
}
func TestFormatNumberFloat64(t *testing.T) {
	tests := []struct {
		amount   float64
		expected string
	}{
		{10000.0, "10,000"},
		{5000.0, "5,000"},
		{2500.0, "2,500"},
		{7500.0, "7,500"},
		{12000.0, "12,000"},
		{8000.0, "8,000"},
		{15000.0, "15,000"},
		{30.2, "30.2"},
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("%f", tt.amount), func(t *testing.T) {
			result := FormatNumberFloat64(tt.amount)
			if result != tt.expected {
				t.Errorf("Expected %s but got %s for amount %f.", tt.expected, result, tt.amount)
			}
		})
	}
}

func TestRandomNumberString(t *testing.T) {
	result := RandomNumberString(3)
	if len(result) != 3 {
		t.Errorf("Expected string length of 10, but got %d", len(result))
	}
	if !IsNumberString(result) {
		t.Errorf("Expected a string of numbers, but got %s", result)
	}
}
func TestGenerateRandomBytes(t *testing.T) {
	length := 10
	encoding := "hex"
	timestamp := time.Now().UnixMicro()

	fmt.Println("timestamp: ", timestamp)

	result := GenerateRandomBytes(length, encoding)
	fmt.Println(result)

	if len(result) != length {
		t.Errorf("Expected string length of %d, but got %d", length, len(result))
	}
}

func TestUtcToZonedTime(t *testing.T) {
	// Test with a valid timezone
	tz := "Africa/Lagos"
	now := time.Now()
	zonedTime := UtcToZonedTime(now, tz)
	zoneName, offset := zonedTime.Zone()
	expectedZoneName := "WAT"
	expectedOffset := 3600
	if zoneName != expectedZoneName {
		t.Errorf("Expected zone name %s, but got %s", expectedZoneName, zoneName)
	}
	if offset != expectedOffset {
		t.Errorf("Expected offset %d, but got %d", expectedOffset, offset)
	}

	// Test with an invalid timezone
	invalidTz := "Invalid/Timezone"
	invalidNow := time.Now()
	invalidZonedTime := UtcToZonedTime(invalidNow, invalidTz)
	if invalidZonedTime != nil {
		t.Errorf("Expected nil carbon object for invalid timezone, but got %v", invalidZonedTime)
	}

	// Test with timezone that observes daylight saving time
	dsTz := "Canada/Eastern"
	dsNow := time.Now()
	zonedDsNow := UtcToZonedTime(dsNow, dsTz)
	zoneName, offset = zonedDsNow.Zone()

	// Eastern Time can be either EDT (summer) or EST (winter)
	if zoneName != "EDT" && zoneName != "EST" {
		t.Errorf("Expected zone name to be EDT or EST, but got %s", zoneName)
	}

	// Offset is -4h (-14400) for EDT or -5h (-18000) for EST
	if offset != -14400 && offset != -18000 {
		t.Errorf("Expected offset to be -14400 (EDT) or -18000 (EST), but got %d", offset)
	}
}

func TestMergeBsonMaps(t *testing.T) {
	map1 := bson.M{"key1": "value1", "key2": "value2"}
	map2 := bson.M{"key3": "value3", "key4": "value4"}

	expectedResult := bson.M{"key1": "value1", "key2": "value2", "key3": "value3", "key4": "value4"}

	result := MergeBsonMaps(map1, map2)

	if len(result) != len(expectedResult) {
		t.Errorf("Unexpected result length. Expected: %d, Got: %d", len(expectedResult), len(result))
	}

	for key, value := range expectedResult {
		if result[key] != value {
			t.Errorf("Unexpected value for key '%s'. Expected: %v, Got: %v", key, value, result[key])
		}
	}
}

func TestFirst(t *testing.T) {
	// Test case 1: Empty slice
	slice1 := []int{}
	expected1 := (*int)(nil)
	result1 := First(slice1)
	if result1 != expected1 {
		t.Errorf("First(%v) = %v, expected %v", slice1, result1, expected1)
	}

	// Test case 2: Slice with one element
	slice2 := []int{5}
	expected2 := &slice2[0]
	result2 := First(slice2)
	if result2 != expected2 {
		t.Errorf("First(%v) = %v, expected %v", slice2, result2, expected2)
	}

	// Test case 3: Slice with multiple elements
	slice3 := []int{1, 2, 3, 4, 5}
	expected3 := &slice3[0]
	result3 := First(slice3)
	if result3 != expected3 {
		t.Errorf("First(%v) = %v, expected %v", slice3, result3, expected3)
	}
}

func TestLast(t *testing.T) {
	// Test case 1: Empty slice
	slice1 := []int{}
	expected1 := (*int)(nil)
	result1 := Last(slice1)
	if result1 != expected1 {
		t.Errorf("Last(%v) = %v, expected %v", slice1, result1, expected1)
	}

	// Test case 2: Slice with one element
	slice2 := []int{5}
	expected2 := &slice2[0]
	result2 := Last(slice2)
	if result2 != expected2 {
		t.Errorf("Last(%v) = %v, expected %v", slice2, result2, expected2)
	}

	// Test case 3: Slice with multiple elements
	slice3 := []int{1, 2, 3, 4, 5}
	expected3 := &slice3[len(slice3)-1]
	result3 := Last(slice3)
	if result3 != expected3 {
		t.Errorf("Last(%v) = %v, expected %v", slice3, result3, expected3)
	}
}

func TestRedactMapKeys(t *testing.T) {
	data1 := map[string]interface{}{
		"username": "john_doe",
		"password": "password123",
		"email":    "john.doe@example.com",
	}

	data2 := map[string]interface{}{
		"username": "alice_wonderland",
		"password": "alice123",
		"email":    "alice.wonder@example.com",
	}

	redactedValue1 := "[REDACTED]"
	redactedValue2 := "*****"

	RedactMapKeys(data1, "password email", redactedValue1)
	RedactMapKeys(data2, "password email")
	expected1 := map[string]interface{}{
		"username": "john_doe",
		"password": redactedValue1,
		"email":    redactedValue1,
	}
	expected2 := map[string]interface{}{
		"username": "alice_wonderland",
		"password": redactedValue2,
		"email":    redactedValue2,
	}

	if !reflect.DeepEqual(data1, expected1) {
		t.Errorf("Expected %v but got %v", expected1, data1)
	}

	if !reflect.DeepEqual(data2, expected2) {
		t.Errorf("Expected %v but got %v", expected2, data2)
	}
}

func TestSortMapKeys(t *testing.T) {
	tests := []struct {
		name     string
		input    map[string]interface{}
		expected map[string]interface{}
	}{
		{
			name:     "empty map",
			input:    map[string]interface{}{},
			expected: map[string]interface{}{},
		},
		{
			name: "single key map",
			input: map[string]interface{}{
				"key1": "value1",
			},
			expected: map[string]interface{}{
				"key1": "value1",
			},
		},
		{
			name: "multiple key map",
			input: map[string]interface{}{
				"key3": "value3",
				"key2": "value2",
				"key1": "value1",
			},
			expected: map[string]interface{}{
				"key1": "value1",
				"key2": "value2",
				"key3": "value3",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := SortMapKeys(tt.input)
			if !reflect.DeepEqual(got, tt.expected) {
				t.Errorf("SortMapKeys() = %v, want %v", got, tt.expected)
			}
		})
	}
}

func TestSortMapKeysnilInput(t *testing.T) {
	input := map[string]interface{}{}
	got := SortMapKeys(input)

	if !reflect.DeepEqual(got, input) {
		t.Errorf("SortMapKeys(nil) = %v, want %v", got, input)
	}
}
func TestAbsInt64(t *testing.T) {
	tests := []struct {
		input    int64
		expected int64
	}{
		{input: 0, expected: 0},
		{input: 1, expected: 1},
		{input: -1, expected: 1},
		{input: 123456789, expected: 123456789},
		{input: -123456789, expected: 123456789},
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("AbsInt64(%d)", tt.input), func(t *testing.T) {
			result := AbsInt64(tt.input)
			if result != tt.expected {
				t.Errorf("Expected %d but got %d for input %d", tt.expected, result, tt.input)
			}
		})
	}
}
func TestCapturePrettyPrint(t *testing.T) {
	tests := []struct {
		input    []interface{}
		expected []any
	}{
		{
			input:    []interface{}{"hello", "world"},
			expected: []any{"hello", "world"},
		},
		{
			input:    []interface{}{123, 456},
			expected: []any{"123", "456"},
		},
		{
			input:    []interface{}{int64(123456789), int64(987654321)},
			expected: []any{"123456789", "987654321"},
		},
		{
			input:    []interface{}{new(int), new(string)},
			expected: []any{"0", ""},
		},
		{
			input: []interface{}{"test", map[string]int{"key": 1}},
			expected: []any{"test", `{
  "key": 1
}`},
		},
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("%v", tt.input), func(t *testing.T) {
			result := CapturePrettyPrint(tt.input...)
			if !reflect.DeepEqual(result, tt.expected) {
				t.Errorf("Expected %v but got %v for input %v.", tt.expected, result, tt.input)
			}
		})
	}
}
func TestToCamelInitCase(t *testing.T) {
	tests := []struct {
		input    string
		initCase bool
		expected string
	}{
		{"hello_world", true, "HelloWorld"},
		{"hello_world", false, "helloWorld"},
		{"Hello_World", true, "HelloWorld"},
		{"Hello_World", false, "helloWorld"},
		{"hello world", true, "HelloWorld"},
		{"hello world", false, "helloWorld"},
		{"hello-world", true, "HelloWorld"},
		{"hello-world", false, "helloWorld"},
		{"hello.world", true, "HelloWorld"},
		{"hello.world", false, "helloWorld"},
		{"helloWorld", true, "HelloWorld"},
		{"helloWorld", false, "helloWorld"},
		{"HelloWorld", true, "HelloWorld"},
		{"HelloWorld", false, "helloWorld"},
		{"hello world", true, "HelloWorld"},
		{"hello world", false, "helloWorld"},
		{"", true, ""},
		{"", false, ""},
		{"  hello_world  ", true, "HelloWorld"},
		{"  hello_world  ", false, "helloWorld"},
		{"hello123world", true, "Hello123World"},
		{"hello123world", false, "hello123World"},
		{"hello 123 world", true, "Hello123World"},
		{"hello 123 world", false, "hello123World"},
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("%s_%v", tt.input, tt.initCase), func(t *testing.T) {
			result := toCamelInitCase(tt.input, tt.initCase)
			if result != tt.expected {
				t.Errorf("Expected %s but got %s for input %s with initCase %v.", tt.expected, result, tt.input, tt.initCase)
			}
		})
	}
}
func TestTagMongoId(t *testing.T) {
	objectId, _ := primitive.ObjectIDFromHex("507f1f77bcf86cd799439011")
	tests := []struct {
		name     string
		tag      TypeModelIdTag
		id       primitive.ObjectID
		expected string
	}{
		{
			name:     "should encode mongo id with tag prefix",
			tag:      "test",
			id:       objectId,
			expected: "test.2X73sS2sR63vEpbXv",
		},
		{
			name:     "with empty tag",
			tag:      "",
			id:       objectId,
			expected: ".2X73sS2sR63vEpbXv",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := TagMongoId(tt.tag, tt.id)
			fmt.Println(result)
			if result != tt.expected {
				t.Errorf("Expected %s but got %s for tag %s and id %s",
					tt.expected, result, tt.tag, tt.id.Hex())
			}
		})
	}
}
func TestTagIdToMongoId(t *testing.T) {
	tests := []struct {
		name     string
		tagId    string
		expected string
		wantErr  bool
	}{
		{
			name:     "valid tag id",
			tagId:    "test.2X73sS2sR63vEpbXv",
			expected: "507f1f77bcf86cd799439011",
			wantErr:  false,
		},
		{
			name:     "invalid tag id format",
			tagId:    "invalid_format",
			expected: "",
			wantErr:  true,
		},
		{
			name:     "invalid base58 encoding",
			tagId:    "test.invalid_b58",
			expected: "",
			wantErr:  true,
		},
		{
			name:     "empty tag id",
			tagId:    "",
			expected: "",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := TagIdToMongoId(tt.tagId)

			if (err != nil) != tt.wantErr {
				t.Errorf("TagIdToMongoId() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr {
				if result.Hex() != tt.expected {
					t.Errorf("TagIdToMongoId() = %v, want %v", result.Hex(), tt.expected)
				}
			}
		})
	}
}

func TestFormatMoneyToInt64(t *testing.T) {
	tests := []struct {
		name      string
		amountStr string
		expected  int64
		wantErr   bool
	}{
		{"simple whole number", "2.0", 200, false},
		{"dollar amount with cents", "10.50", 1050, false},
		{"zero amount", "0.00", 0, false},
		{"single cent", "0.01", 1, false},
		{"large amount", "999.99", 99999, false},
		{"amount without decimal", "50", 5000, false},
		{"invalid string", "invalid", 0, true},
		{"empty string", "", 0, true},
		{"negative amount", "-15.75", -1575, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := FormatMoneyToInt64(tt.amountStr)

			if (err != nil) != tt.wantErr {
				t.Errorf("FormatMoneyToInt64() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr && result != tt.expected {
				t.Errorf("FormatMoneyToInt64(%s) = %d, want %d", tt.amountStr, result, tt.expected)
			}
		})
	}
}

func TestFormatMoneyToInt64WithCurrency(t *testing.T) {
	tests := []struct {
		name         string
		currencyCode string
		amountStr    string
		expected     int64
		wantErr      bool
	}{
		// USD (2 decimal places)
		{"USD - standard amount", "USD", "10.50", 1050, false},
		{"USD - whole number", "USD", "100", 10000, false},
		{"USD - single decimal", "USD", "10.5", 1050, false},

		// JPY (0 decimal places)
		{"JPY - whole number", "JPY", "1000", 1000, false},
		{"JPY - with decimal (should ignore)", "JPY", "1000.50", 1000, false},

		// KWD (3 decimal places)
		{"KWD - three decimals", "KWD", "10.555", 10555, false},
		{"KWD - two decimals (pad with zero)", "KWD", "10.55", 10550, false},
		{"KWD - one decimal (pad with zeros)", "KWD", "10.5", 10500, false},
		{"KWD - four decimals (truncate)", "KWD", "10.5559", 10555, false},

		// EUR & NGN (2 decimal places)
		{"EUR - standard", "EUR", "25.99", 2599, false},
		{"NGN - standard", "NGN", "5000.00", 500000, false},

		// Negative amounts
		{"USD - negative", "USD", "-50.25", -5025, false},
		{"JPY - negative", "JPY", "-1000", -1000, false},

		// Edge cases
		{"empty currency (defaults to 2 decimals)", "", "10.50", 1050, false},
		{"invalid currency (defaults to 2 decimals)", "INVALID", "10.50", 1050, false},
		{"zero amount", "USD", "0.00", 0, false},

		// Error cases
		{"invalid amount string", "USD", "invalid", 0, true},
		{"empty amount string", "USD", "", 0, true},
		{"multiple decimal points", "USD", "10.50.25", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := FormatMoneyToInt64WithCurrency(tt.currencyCode, tt.amountStr)

			if (err != nil) != tt.wantErr {
				t.Errorf("FormatMoneyToInt64WithCurrency(%s, %s) error = %v, wantErr %v",
					tt.currencyCode, tt.amountStr, err, tt.wantErr)
				return
			}

			if !tt.wantErr && result != tt.expected {
				t.Errorf("FormatMoneyToInt64WithCurrency(%s, %s) = %d, want %d",
					tt.currencyCode, tt.amountStr, result, tt.expected)
			}
		})
	}
}

func TestGetCurrencyDecimalPlaces(t *testing.T) {
	tests := []struct {
		name         string
		currencyCode string
		expected     int
	}{
		{"USD has 2 decimals", "USD", 2},
		{"EUR has 2 decimals", "EUR", 2},
		{"GBP has 2 decimals", "GBP", 2},
		{"JPY has 0 decimals", "JPY", 0},
		{"KRW has 0 decimals", "KRW", 0},
		{"KWD has 3 decimals", "KWD", 3},
		{"BHD has 3 decimals", "BHD", 3},
		{"empty currency defaults to 2", "", 2},
		{"invalid currency defaults to 2", "INVALID", 2},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GetCurrencyDecimalPlaces(tt.currencyCode)
			if result != tt.expected {
				t.Errorf("GetCurrencyDecimalPlaces(%s) = %d, want %d",
					tt.currencyCode, result, tt.expected)
			}
		})
	}
}
