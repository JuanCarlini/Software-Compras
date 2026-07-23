// Un solo tipo de error de aplicación. No hay jerarquía: el status ES la semántica.
// (La jerarquía anterior, shared/errors.ts, se borró con D3 porque solo la usaban los mocks.)
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = "HttpError"
  }
}
