declare module 'next' {
  export interface RouteHandlerContext<TParams extends Record<string, any> = {}> {
    params: TParams
  }
}
