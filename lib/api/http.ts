import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function serverError(message = "Unexpected server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function asApiError(error: unknown) {
  if (error instanceof Error) {
    return badRequest(error.message);
  }

  return serverError();
}
