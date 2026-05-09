import { Utils } from '@core/helpers';

export interface RestUriCredentials {
    baseUrl: string;
    id: string;
    secret: string;
}

export interface DBUriCredentials {
    username: string;
    password: string;
    host: string;
    port: number;
    db: string;
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

export function ExtractDBURICredentials(uri: string): DBUriCredentials {
    let url = uri.split('redis://');
    url = url[1].split('@');
    const credentials = url[0].split(':');
    const base = url[1].split('/');

    const hostAndPort = base[0].split(':');

    return {
        username: credentials[0],
        password: credentials[1],
        host: hostAndPort[0],
        port: Utils.safeNumber(hostAndPort[1]),
        db: base[1],
    };
}
