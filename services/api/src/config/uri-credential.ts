export interface RestUriCredentials {
    baseUrl: string;
    id: string;
    secret: string;
}

export function ExtractURICredentials(uri: string): RestUriCredentials {
    let url = uri.split('rest://');
    url = url[1].split('@');
    const credentials = url[0].split(':');

    return {
        id: credentials[0],
        secret: credentials[1],
        baseUrl: url[1],
    };
}
