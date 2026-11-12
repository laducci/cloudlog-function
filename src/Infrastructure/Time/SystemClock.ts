import { Clock } from "../../Domain/Ports";

export class SystemClock implements Clock { now() { return new Date(); } }
