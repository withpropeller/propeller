package helpers

import (
	"strings"
)

type RestUriCredentials struct {
	BaseUrl string
	Id      string
	Secret  string
}

func ExtractURICredentials(uri string, protocol ...string) *RestUriCredentials {
	var url []string

	if len(protocol) > 0 {
		url = strings.Split(uri, protocol[0])
	} else {
		url = strings.Split(uri, "rest://")
	}

	url = strings.Split(url[1], "@")

	if len(url) == 1 {
		return &RestUriCredentials{
			BaseUrl: url[0],
		}
	}

	credentials := strings.Split((url[0]), ":")
	baseUrl := url[1]

	return &RestUriCredentials{
		BaseUrl: baseUrl,
		Id:      credentials[0],
		Secret:  credentials[1],
	}
}
