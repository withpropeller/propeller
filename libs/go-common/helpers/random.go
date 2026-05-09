package helpers

import (
	"math/rand"
	"sync"
	"time"
)

// https://stackoverflow.com/a/77405311/3335054

type Random struct {
	source rand.Source
	mu     sync.Mutex
}

func (rnd *Random) Next(from int, to int) int {
	rnd.mu.Lock()
	if rnd.source == nil {
		rnd.source = rand.NewSource(time.Now().UnixNano())
	}
	rnd.mu.Unlock()
	return from + rand.New(rnd.source).Intn(to-from+1)
}
