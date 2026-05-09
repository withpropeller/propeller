import { AppStatus } from '@core/helpers';
import { HttpService } from '@nestjs/axios';
import {
    HttpStatusCode,
    RawAxiosResponseHeaders,
    AxiosHeaders,
    RawAxiosRequestHeaders,
    AxiosRequestConfig,
    AxiosError,
} from 'axios';
import { Observable, of } from 'rxjs';

export interface RResponseData<T> {
    code: string;
    message?: string;
    data?: T;
    error?: string;
    errors?: string;
}
export interface RResponse<T = any> {
    status: HttpStatusCode;
    data: RResponseData<T>;
    headers: RawAxiosResponseHeaders;
}

export class RequestService {
    /**
     * Service constructor.
     *
     * @constructor
     * @param http
     */
    constructor(protected http: HttpService, private endpointBase: string) {}

    private getCombinedHeaders(headers: AxiosHeaders): RawAxiosRequestHeaders {
        return headers.setContentType('application/json').toJSON();
    }

    /**
     * Prepares request object to send to server.
     *
     * @param {string} url - Request url.
     * @param {Object} body - Request Body.
     * @param {RequestMethod} method - Request Method.
     * @param params
     * @param {AxiosHeaders} headers - Request Headers.
     * @param apiBase
     * @param observe
     * @return {Request}
     */
    private prepareRequest(
        url: string,
        data?: Record<string, any>,
        method = 'POST',
        _params?: Record<string, string>,
        headers: AxiosHeaders = new AxiosHeaders(),
        apiBase: string = this.endpointBase,
        observe = 'body',
    ): AxiosRequestConfig {
        let params;
        const combinedHeaders = this.getCombinedHeaders(headers);

        if (_params) {
            params = new URLSearchParams(_params);
        }

        /* if (body && headers.get('Content-Type') === 'application/x-www-form-urlencoded' && method === 'POST') {
             body = Utils.URIEncodeObject(body);
         }*/

        return {
            method,
            url: apiBase + url,
            data,
            headers: combinedHeaders,
            params,
        };
    }

    /**
     * Sends request object to server and handles appropriate callbacks.
     *
     * @param {RequestOpts} requestConfig Request object
     * @return {Observable<RResponse>}
     */
    protected sendToServer(requestConfig: AxiosRequestConfig): Observable<RResponse> {
        return this.http.request(requestConfig);
    }

    /**
     * Sends a GET Request
     *
     * @param {string} url
     * @param {object} paramsObject
     * @param {AxiosHeaders} headers
     * @param {string} apiBase
     * @param observe
     */
    protected sendGetRequest(
        url: string,
        paramsObject?: Record<string, string>,
        headers?: AxiosHeaders,
        apiBase?: string,
        observe?: string,
    ) {
        return this.sendRequest(url, undefined, 'GET', paramsObject, headers, apiBase, observe);
    }

    /**
     * Sends a DELETE Request
     *
     * @param {string} url
     * @param {object} paramsObject
     * @param {AxiosHeaders} headers
     * @param {string} apiBase
     */
    protected sendDeleteRequest(
        url: string,
        paramsObject?: Record<string, string>,
        headers?: AxiosHeaders,
        apiBase?: string,
    ) {
        return this.sendRequest(url, undefined, 'DELETE', paramsObject, headers, apiBase);
    }

    /**
     * Sends a PATCH Request
     *
     * @param {string} url
     * @param {object} body
     * @param {AxiosHeaders} headers
     * @param {string} apiBase
     */
    protected sendPatchRequest(url: string, body?: object, headers?: AxiosHeaders, apiBase?: string) {
        return this.sendRequest(url, body, 'PATCH', undefined, headers, apiBase);
    }

    /**
     * Sends a PUT Request
     *
     * @param {string} url
     * @param {object} body
     * @param {AxiosHeaders} headers
     * @param {string} apiBase
     */
    protected sendPutRequest(url: string, body?: object, headers?: AxiosHeaders, apiBase?: string) {
        return this.sendRequest(url, body, 'PUT', undefined, headers, apiBase);
    }

    /**
     * Sends a POST Request
     *
     * @param {string} url
     * @param {object} body
     * @param {AxiosHeaders} headers
     * @param {string} apiBase
     */
    protected sendPostRequest(url: string, body?: object, headers?: AxiosHeaders, apiBase?: string) {
        return this.sendRequest(url, body, 'POST', undefined, headers, apiBase);
    }

    /**
     * Builds the RequestOpts and sends to server immediately
     *
     * @param {string} url
     * @param {Object} body
     * @param {string} method
     * @param {any} paramsObject
     * @param {HttpHeaders} headers
     * @param apiBase
     * @param observe
     * @return {Observable<RResponse>}
     */
    protected sendRequest(
        url: string,
        body?: Record<string, any>,
        method: string = body == null ? 'GET' : 'POST',
        paramsObject?: Record<string, string>,
        headers?: AxiosHeaders,
        apiBase?: string,
        observe?: string,
    ) {
        const requestConfig = this.prepareRequest(url, body, method, paramsObject, headers, apiBase, observe);

        return this.sendToServer(requestConfig);
    }

    /**
     * Handle Http operation that failed.
     * Let the app continue.
     * TODO: send the error to remote logging infrastructure
     *
     * @param operation - name of the operation that failed
     *
     */
    protected handleError(operation = 'operation') {
        return (err: any) => {
            const error = this.catchErrors(err);

            // display error for user consumption
            // TODO: better job of transforming error for user consumption
            //  console.log(`${operation} failed: ${error.getMessage()}`);

            return of(error);
        };
    }

    /* private handleServiceError(exception: AppException) {
         return (e) => {
             if (e.message === 'Timeout has occurred') {
                 return of(AppException.REQUEST_TIMEOUT as GrpcResponseData<any>);
             }
             return of(exception as GrpcResponseData<any>);
         };
     }*/

    // noinspection JSMethodCanBeStatic
    /**
     * Utility function to catch errors
     * basically it checks if its an unauthorized error
     * it logs out immediately if its an unauthorized error
     *
     * @param err
     */
    private catchErrors<T>(err: AxiosError<RResponseData<T>>): RResponse {
        if (err.code === 'ECONNREFUSED') {
            return {
                status: HttpStatusCode.ServiceUnavailable,
                data: {
                    code: AppStatus.ServiceUnavailable,
                    error: 'Service Unavailable',
                },
                headers: null,
            };
        }

        return {
            status: err.response.status,
            data: err.response.data,
            headers: err.response.headers,
        };

        /* if (err.error instanceof Error) {
             // A client-side or network error occurred. Handle it accordingly.
             error = new AppException(err.error);
 
         } else if (err.status === 0) {
             error = AppException.INTERNET_UNAVAILABLE;
         } else {
             // The backend returned an unsuccessful response code.
             // The response body may contain clues as to what went wrong,
             error = new AppException(err.error.error, err.error.code, err.error.message, err.error.body);
         }
 
         console.log(`Backend returned code ${err.status}, body was: ${JSON.stringify(err.error)}`);
 */
    }
}
