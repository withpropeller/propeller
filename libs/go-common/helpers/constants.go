package helpers

type Map = map[string]interface{}
type MapS = map[string]string

const (
	ZERO_STRING                     = ""
	MDEL_SHA                        = "092707c3bf586b9bde7d67423d5f1320b3f02205"
	HMSET_AUTO_INC_SHA              = "ea2ad1a33d3a73825156954fe7181bde5e957c6b"
	MULTI_MATCH_DEL_SHA             = "614adfdea8851ed8fcced1ce6286e26dfb108de1" // MULTI_MATCH_DEL_SHA is the sha1 of the lua script that deletes multiple keys if they match the same content
	INCR_BY_AND_EXPIRE_AT_SHA       = "ac1d133b05dabb2ae72e911d343fde9128ab2146"
	MULTI_INCR_BY_AND_EXPIRE_AT_SHA = "8897ac85a342969db131f83cc0ee9eaae5f4f43a" // MULTI_INCR_BY_AND_EXPIRE_AT_SHA is the sha1 of the lua script that increments multiple keys by the same amount and sets the same expiry time
)

var TagModelMap = map[string]string{
	"cus":    "Customer",
	"wh":     "Webhook",
	"ac":     "Account",
	"isv.ac": "IsvAccount",
	"c.prg":  "CardProgram",
	"c":      "Card",
	"c.txn":  "CardTransaction",
	"c.auth": "CardAuthorization",
	"d":      "Dispute",
	"p":      "Payment",
	"p.req":  "PaymentRequest",
	"p.rsv":  "ReservePayment",
	"evt":    "Event",
	"evt.a":  "EventAttempt",
	"req":    "Request",
	"mch":    "Merchant",
}

var ModelTagMap = map[string]TypeModelIdTag{
	"Customer":          "cus",
	"Webhook":           "wh",
	"Account":           "ac",
	"IsvAccount":        "isv.ac",
	"CardProgram":       "c.prg",
	"Card":              "c",
	"CardTransaction":   "c.txn",
	"CardAuthorization": "c.auth",
	"Dispute":           "d",
	"Payment":           "p",
	"ReservePayment":    "p.rsv",
	"PaymentRequest":    "p.req",
	"Event":             "evt",
	"EventAttempt":      "evt.a",
	"Request":           "req",
	"Merchant":          "mch",
}
