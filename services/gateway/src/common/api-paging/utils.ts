import { Utils } from "@core/helpers";


export function parseQueryBoolean(value: any) {
    return value === "" ? true : Utils.safeBoolean(value) 
}