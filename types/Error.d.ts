export declare class HttpError extends Error {
    status: number;
    constructor(status: number, message: string);
}
export declare class BadRequestError extends HttpError {
    constructor(message: string);
}
export declare class InternalServerError extends HttpError {
    constructor(message: string);
}
export default class GatewayApiError extends Error {
    status: number;
    constructor(status: number, message: string);
}
